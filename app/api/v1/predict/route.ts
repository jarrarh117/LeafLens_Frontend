import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, incrementUsage, checkRateLimit } from '@/lib/apiKeysServer';
import { validateBase64Image, logSecurityEvent } from '@/lib/security';

// ── Configuration ────────────────────────────────────────────────────────────
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Max-Age': '86400',
};

// ── Helper Functions ─────────────────────────────────────────────────────────
function calculateSeverity(confidence: number): string {
  if (confidence >= 95) return 'high';
  if (confidence >= 80) return 'medium';
  return 'low';
}

function generateRecommendations(condition: string, plant: string): string[] {
  const conditionLower = condition.toLowerCase();
  
  if (conditionLower.includes('healthy')) {
    return [
      'Plant appears healthy - continue regular care',
      'Monitor regularly for any changes',
      'Maintain proper watering and sunlight',
    ];
  }
  
  if (conditionLower.includes('blight')) {
    return [
      'Remove and destroy infected leaves immediately',
      'Apply copper-based fungicide',
      'Improve air circulation around plants',
      'Avoid overhead watering',
      'Mulch to prevent soil splash',
    ];
  }
  
  if (conditionLower.includes('spot') || conditionLower.includes('leaf spot')) {
    return [
      'Remove infected leaves',
      'Apply appropriate fungicide',
      'Ensure proper spacing between plants',
      'Water at soil level, not on leaves',
    ];
  }
  
  if (conditionLower.includes('mold') || conditionLower.includes('mildew')) {
    return [
      'Improve air circulation',
      'Reduce humidity around plants',
      'Apply fungicide treatment',
      'Remove severely affected leaves',
    ];
  }
  
  if (conditionLower.includes('rust')) {
    return [
      'Remove infected leaves',
      'Apply sulfur or copper-based fungicide',
      'Avoid wetting foliage when watering',
      'Ensure good air circulation',
    ];
  }
  
  if (conditionLower.includes('mosaic') || conditionLower.includes('virus')) {
    return [
      'Remove and destroy infected plants',
      'Control aphids and other vectors',
      'Disinfect tools between plants',
      'Plant resistant varieties',
    ];
  }
  
  // Generic recommendations
  return [
    'Isolate affected plants if possible',
    'Remove infected plant material',
    'Consult local agricultural extension for treatment',
    'Monitor other plants for similar symptoms',
  ];
}

// ═════════════════════════════════════════════════════════════════════════════
// OPTIONS /api/v1/predict
// Handle CORS preflight requests
// ═════════════════════════════════════════════════════════════════════════════
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/v1/predict
//
// Authenticated API endpoint with API key validation
// Forwards requests to Hugging Face model or your backend
// ═════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // ── Extract API Key from Header ──────────────────────────────────────
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Missing API key',
          message: 'Please provide your API key in the x-api-key header',
          documentation: 'https://leaflens-six.vercel.app/api-docs',
        },
        { status: 401, headers: corsHeaders }
      );
    }

    // ── Validate API Key ─────────────────────────────────────────────────
    const validation = await validateApiKey(apiKey);

    if (!validation.valid) {
      logSecurityEvent(
        'invalid_api_key',
        { endpoint: '/api/v1/predict', error: validation.error },
        'medium'
      );

      return NextResponse.json(
        {
          error: 'Invalid API key',
          message: validation.error,
        },
        { status: 401, headers: corsHeaders }
      );
    }

    const { keyData } = validation;

    if (!keyData) {
      return NextResponse.json(
        { error: 'API key validation failed' },
        { status: 500, headers: corsHeaders }
      );
    }

    // ── Check Rate Limit ─────────────────────────────────────────────────
    const withinRateLimit = checkRateLimit(keyData.id, keyData.plan);

    if (!withinRateLimit) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You have exceeded the rate limit for your ${keyData.plan} plan`,
          retryAfter: 60, // seconds
        },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': '60',
            'X-RateLimit-Limit': String(
              keyData.plan === 'free' ? 10 : keyData.plan === 'premium' ? 60 : 'unlimited'
            ),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // ── Parse Request Body ───────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { image } = body;

    if (!image) {
      return NextResponse.json(
        {
          error: 'No image provided',
          message: 'Please include an "image" field with a base64-encoded image',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // ── Validate Image Format ────────────────────────────────────────────
    const imageValidation = validateBase64Image(image);
    if (!imageValidation.isValid) {
      return NextResponse.json(
        { error: imageValidation.error },
        { status: 400, headers: corsHeaders }
      );
    }

    // ── Forward to Backend (Your Python API or Hugging Face) ─────────────
    let backendResponse;
    
    try {
      // Option 1: Forward to your existing Python backend
      backendResponse = await fetch(`${BACKEND_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          tta: true,
          tta_steps: 3,
          top_k: 5,
        }),
        signal: AbortSignal.timeout(30000),
      });

      /* Option 2: Call Hugging Face directly (uncomment if needed)
      if (HF_TOKEN) {
        const { HfInference } = await import('@huggingface/inference');
        const hf = new HfInference(HF_TOKEN);
        
        // Convert base64 to blob
        const base64Data = image.split(',')[1] || image;
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer]);
        
        const result = await hf.imageClassification({
          data: blob,
          model: 'your-model-name', // Replace with your HF model
        });
        
        backendResponse = {
          ok: true,
          json: async () => result,
        };
      }
      */
    } catch (fetchError: any) {
      console.error('Backend connection error:', fetchError);
      return NextResponse.json(
        {
          error: 'AI model service unavailable',
          message: 'The inference service is currently unavailable. Please try again later.',
        },
        { status: 503, headers: corsHeaders }
      );
    }

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error('Backend error:', backendResponse.status, errorData);
      return NextResponse.json(
        { error: errorData.detail || 'AI model returned an error' },
        { status: backendResponse.status, headers: corsHeaders }
      );
    }

    const result = await backendResponse.json();

    // ── Transform backend response to user-friendly format ───────────────
    const topPrediction = result.predictions?.[0];
    
    if (!topPrediction) {
      return NextResponse.json(
        { error: 'No predictions returned from model' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Generate recommendations based on disease severity
    const recommendations = generateRecommendations(topPrediction.condition, topPrediction.plant);
    const severity = calculateSeverity(topPrediction.confidence);

    // ── Increment Usage Count (async, don't wait) ────────────────────────
    incrementUsage(keyData.id).catch(err => 
      console.error('Failed to increment usage:', err)
    );

    // ── Return Response ──────────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        disease: `${topPrediction.plant} ${topPrediction.condition}`,
        plant: topPrediction.plant,
        condition: topPrediction.condition,
        confidence: `${topPrediction.confidence.toFixed(1)}%`,
        severity,
        description: `Detected ${topPrediction.condition.toLowerCase()} in ${topPrediction.plant.toLowerCase()} plant.`,
        recommendations,
        predictions: result.predictions,
        usage: {
          requestsUsed: keyData.usageCount + 1,
          requestsRemaining: validation.remainingRequests! - 1,
          plan: keyData.plan,
        },
      },
      {
        headers: {
          ...corsHeaders,
          'X-RateLimit-Remaining': String(validation.remainingRequests! - 1),
          'X-API-Key-Plan': keyData.plan,
        },
      }
    );
  } catch (error: any) {
    console.error('API v1 prediction error:', error);

    logSecurityEvent(
      'api_v1_error',
      { endpoint: '/api/v1/predict', error: error.message },
      'high'
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/v1/predict
// Returns API information
// ═════════════════════════════════════════════════════════════════════════════
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/v1/predict',
    method: 'POST',
    description: 'Authenticated plant disease detection API',
    authentication: {
      type: 'API Key',
      header: 'x-api-key',
      format: 'pd_live_xxxxxxxxxxxxx',
    },
    documentation: 'https://leaflens-six.vercel.app/api-docs',
    getApiKey: 'https://leaflens-six.vercel.app/api-keys',
  }, { headers: corsHeaders });
}
