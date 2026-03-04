import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, incrementUsage, checkRateLimit } from '@/lib/apiKeys';
import { validateBase64Image, logSecurityEvent } from '@/lib/security';

// ── Configuration ────────────────────────────────────────────────────────────
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const HF_TOKEN = process.env.HF_TOKEN; // Hugging Face API token

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
        { status: 401 }
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
        { status: 401 }
      );
    }

    const { keyData } = validation;

    if (!keyData) {
      return NextResponse.json(
        { error: 'API key validation failed' },
        { status: 500 }
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
        { status: 400 }
      );
    }

    const { image } = body;

    if (!image) {
      return NextResponse.json(
        {
          error: 'No image provided',
          message: 'Please include an "image" field with a base64-encoded image',
        },
        { status: 400 }
      );
    }

    // ── Validate Image Format ────────────────────────────────────────────
    const imageValidation = validateBase64Image(image);
    if (!imageValidation.isValid) {
      return NextResponse.json(
        { error: imageValidation.error },
        { status: 400 }
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
        { status: 503 }
      );
    }

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error('Backend error:', backendResponse.status, errorData);
      return NextResponse.json(
        { error: errorData.detail || 'AI model returned an error' },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();

    // ── Increment Usage Count (async, don't wait) ────────────────────────
    incrementUsage(keyData.id).catch(err => 
      console.error('Failed to increment usage:', err)
    );

    // ── Return Response ──────────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        ...result,
        usage: {
          requestsUsed: keyData.usageCount + 1,
          requestsRemaining: validation.remainingRequests! - 1,
          plan: keyData.plan,
        },
      },
      {
        headers: {
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
      { status: 500 }
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
  });
}
