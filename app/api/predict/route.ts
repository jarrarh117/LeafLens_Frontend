import { NextRequest, NextResponse } from "next/server";
import { PLANT_CLASSES, parseClassName, getDiseaseInfo, getSeverity } from "@/lib/plantClasses";
import {
  rateLimit,
  getClientIdentifier,
  validateBase64Image,
  RATE_LIMITS,
  logSecurityEvent,
} from "@/lib/security";

// ── Configuration ────────────────────────────────────────────────────────────
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Rate limiter for predictions
const predictRateLimit = rateLimit(RATE_LIMITS.predict);

// ── Helper: Validate image contains a plant leaf using Gemini ────────────────
async function validatePlantImage(base64Image: string): Promise<{
  isPlant: boolean;
  confidence: number;
  reason?: string;
  validationSkipped?: boolean;
}> {
  if (!GEMINI_API_KEY) {
    // If Gemini API key is not configured, log warning but allow request
    console.warn("⚠️  Gemini API key not configured - plant validation disabled");
    console.warn("⚠️  Set GEMINI_API_KEY in .env.local to enable smart validation");
    return { isPlant: true, confidence: 1.0, validationSkipped: true };
  }

  try {
    // Extract base64 data without data URL prefix
    const imageData = base64Image.includes(",") 
      ? base64Image.split(",")[1] 
      : base64Image;

    console.log("🔍 Validating image with Gemini AI...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert botanist and image classifier. Analyze this image carefully and determine if it contains a plant leaf or plant foliage suitable for disease detection.

Respond with a JSON object in this EXACT format:
{
  "isPlant": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}

Classification Rules:
✅ ACCEPT (isPlant: true) if image shows:
- Plant leaves (any species)
- Plant foliage or stems with leaves
- Crops or agricultural plants
- Tree leaves or branches with leaves
- Indoor or outdoor plants
- Even if leaves appear damaged or diseased

❌ REJECT (isPlant: false) if image shows:
- Animals, insects, or people
- Buildings, vehicles, or objects
- Food items (cooked/processed)
- Landscapes without clear plant focus
- Abstract art or patterns
- Text, documents, or screenshots
- Flowers only (without leaves)
- Fruits only (without leaves)
- Blurry or unclear images

Confidence Guidelines:
- 0.9-1.0: Very clear plant leaves visible
- 0.7-0.9: Likely plant leaves but some uncertainty
- 0.5-0.7: Possible plant but unclear
- 0.0-0.5: Probably not a plant

Be strict but fair. The goal is to filter out obvious non-plant images while allowing genuine plant disease detection.`,
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: imageData,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.2,
            maxOutputTokens: 200,
          },
        }),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("❌ Gemini API error:", response.status, errorText);
      
      // Log for monitoring
      logSecurityEvent(
        "gemini_api_error",
        { status: response.status, error: errorText },
        "medium"
      );
      
      // If API fails, allow request but log it
      return { isPlant: true, confidence: 1.0, validationSkipped: true };
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      console.error("❌ No response from Gemini");
      return { isPlant: true, confidence: 1.0, validationSkipped: true };
    }

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (parseError) {
      console.error("❌ Failed to parse Gemini response:", resultText);
      return { isPlant: true, confidence: 1.0, validationSkipped: true };
    }
    
    // Validate response structure
    if (typeof result.isPlant !== "boolean" || typeof result.confidence !== "number") {
      console.error("❌ Invalid Gemini response format:", result);
      return { isPlant: true, confidence: 1.0, validationSkipped: true };
    }

    console.log("✅ Plant validation result:", {
      isPlant: result.isPlant,
      confidence: result.confidence,
      reason: result.reason
    });

    return {
      isPlant: result.isPlant === true,
      confidence: Math.max(0, Math.min(1, result.confidence)), // Clamp to 0-1
      reason: result.reason || "No reason provided",
      validationSkipped: false,
    };
  } catch (error: any) {
    console.error("❌ Plant validation error:", error.message);
    
    // Log for monitoring
    logSecurityEvent(
      "plant_validation_error",
      { error: error.message },
      "low"
    );
    
    // On error, allow the request to proceed (fail open for better UX)
    return { isPlant: true, confidence: 1.0, validationSkipped: true };
  }
}

// ── Helper: get disease description & treatment for a condition ──────────────
function getAnalysisDetails(plant: string, condition: string) {
  const isHealthy = condition.toLowerCase().includes("healthy");

  if (isHealthy) {
    return {
      description: `Your ${plant} plant appears to be healthy! No signs of disease detected.`,
      recommendations: [
        "Continue regular watering schedule",
        "Maintain proper sunlight exposure",
        "Monitor for any changes in leaf color or texture",
        "Ensure good air circulation around the plant",
        "Regularly inspect for pests",
      ],
      severity: "none" as const,
    };
  }

  const diseaseInfo = getDiseaseInfo(condition);
  const severity = getSeverity(condition);

  return {
    description:
      diseaseInfo?.description ||
      `${condition} has been detected on your ${plant} plant. This condition requires attention to prevent further damage.`,
    recommendations:
      diseaseInfo?.treatment || [
        "Consult with a local plant specialist or agricultural extension office",
        "Remove visibly affected leaves to prevent spreading",
        "Apply appropriate fungicide or treatment for the specific condition",
        "Improve air circulation and avoid overhead watering",
        "Monitor the plant closely for any changes",
      ],
    severity,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/predict
//
// INTERNAL ENDPOINT - For web dashboard use only (authenticated via Firebase)
// 
// For external API access, use /api/v1/predict with API key authentication.
//
// Receives a base64 image from the frontend, forwards it to the Python
// FastAPI backend (EfficientNetV2S + CBAM model), then enriches the
// response with disease descriptions, treatment recommendations, and
// severity classifications from the curated database.
//
// Returns a unified response compatible with BOTH the Dashboard
// (AnalysisResult format) and the UploadSection (DetectionResult format).
// ═════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // ── Check for Firebase Auth (for web dashboard) ──────────────────────
    // This endpoint is ONLY for the web dashboard, not for external API access
    // External API access should use /api/v1/predict with API keys
    
    const authHeader = request.headers.get("Authorization");
    const isWebDashboard = authHeader && authHeader.startsWith("Bearer ") && !authHeader.includes("llai_");
    
    // If this looks like an API key attempt, redirect to proper endpoint
    if (authHeader && authHeader.includes("llai_")) {
      return NextResponse.json(
        {
          error: "Invalid endpoint for API key authentication",
          message: "Please use the authenticated endpoint for API access",
          correctEndpoint: "https://leaflens-six.vercel.app/api/v1/predict",
          documentation: "https://leaflens-six.vercel.app/api-docs"
        },
        { status: 401 }
      );
    }
    
    // ── Rate limiting ────────────────────────────────────────────────────
    const identifier = getClientIdentifier(request);
    const rateLimitResult = predictRateLimit(identifier);

    if (!rateLimitResult.success) {
      logSecurityEvent(
        "rate_limit_exceeded",
        { endpoint: "/api/predict", identifier },
        "medium"
      );

      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000
          ),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": RATE_LIMITS.predict.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
            "Retry-After": Math.ceil(
              (rateLimitResult.resetTime - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // ── Parse request ────────────────────────────────────────────────────
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Validate image format
    const validation = validateBase64Image(image);
    if (!validation.isValid) {
      logSecurityEvent(
        "invalid_image_upload",
        { endpoint: "/api/predict", identifier, error: validation.error },
        "low"
      );
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // ── Validate image contains a plant using Gemini ─────────────────────
    const plantValidation = await validatePlantImage(image);
    
    // Log validation result for debugging
    if (plantValidation.validationSkipped) {
      console.log("⚠️  Plant validation was skipped - check GEMINI_API_KEY configuration");
    }
    
    // Only reject if validation was successful AND image is not a plant
    if (!plantValidation.validationSkipped && !plantValidation.isPlant) {
      logSecurityEvent(
        "non_plant_image_rejected",
        { 
          endpoint: "/api/predict", 
          identifier, 
          confidence: plantValidation.confidence,
          reason: plantValidation.reason 
        },
        "low"
      );
      
      return NextResponse.json(
        { 
          error: "This doesn't appear to be a plant leaf image",
          message: `Our AI detected: ${plantValidation.reason || "This image doesn't contain plant leaves"}`,
          details: "Please upload a clear photo of plant leaves for accurate disease detection.",
          suggestions: [
            "📸 Take a close-up photo of the plant leaves",
            "💡 Ensure good lighting and focus",
            "🌿 Make sure leaves fill most of the frame",
            "❌ Avoid images of people, animals, or objects"
          ],
          isPlant: false,
          confidence: plantValidation.confidence,
          validationEnabled: true
        },
        { status: 400 }
      );
    }

    // Warn about low confidence detections (but still proceed)
    if (!plantValidation.validationSkipped && plantValidation.confidence < 0.7) {
      console.warn("⚠️  Low confidence plant detection:", {
        confidence: plantValidation.confidence,
        reason: plantValidation.reason,
        proceeding: true
      });
    }

    // ── Forward to Python backend ────────────────────────────────────────
    let backendResponse;
    try {
      backendResponse = await fetch(`${BACKEND_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          tta: true,
          tta_steps: 3,
          top_k: 5,
        }),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });
    } catch (fetchError: any) {
      console.error("Backend connection error:", fetchError);
      logSecurityEvent(
        "backend_unavailable",
        { endpoint: "/api/predict", error: fetchError.message },
        "high"
      );
      return NextResponse.json(
        {
          error:
            "AI model service is currently unavailable. Please ensure the backend server is running (python backend/app.py).",
        },
        { status: 503 }
      );
    }

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error("Backend error:", backendResponse.status, errorData);
      return NextResponse.json(
        { error: errorData.detail || "AI model returned an error." },
        { status: backendResponse.status }
      );
    }

    const backendResult = await backendResponse.json();

    // ── Enrich with disease info ─────────────────────────────────────────
    const topPrediction = backendResult.predictions[0];
    const { description, recommendations, severity } = getAnalysisDetails(
      topPrediction.plant,
      topPrediction.condition
    );

    // Format confidence as percentage string
    const confidenceStr = `${topPrediction.confidence.toFixed(1)}%`;

    // Build predictions array for DetectionResult compatibility
    const predictions = backendResult.predictions.map(
      (p: { class_name: string; plant: string; condition: string; confidence: number; class_index: number }) => ({
        class: p.class_name,
        plant: p.plant,
        condition: p.condition,
        confidence: p.confidence,
      })
    );

    // ── Unified response ─────────────────────────────────────────────────
    // Compatible with BOTH Dashboard (AnalysisResult) and UploadSection (DetectionResult)
    const result = {
      // AnalysisResult fields (for Dashboard)
      disease: topPrediction.condition,
      plant: topPrediction.plant,
      condition: topPrediction.condition,
      confidence: confidenceStr,
      description,
      recommendations,
      severity,

      // DetectionResult fields (for UploadSection / ResultsSection)
      id: `det_${Date.now()}`,
      predictions,
      topPrediction: predictions[0],
      timestamp: new Date().toISOString(),

      // Inference metadata
      inferenceTime: backendResult.inference_time_ms,
      ttaEnabled: backendResult.tta_enabled,
      ttaViews: backendResult.tta_views,
      model: backendResult.model,
    };

    return NextResponse.json(result, {
      headers: {
        "X-RateLimit-Limit": RATE_LIMITS.predict.maxRequests.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
      },
    });
  } catch (error: any) {
    console.error("Prediction error:", error);

    logSecurityEvent(
      "prediction_error",
      { endpoint: "/api/predict", error: error.message },
      "high"
    );

    return NextResponse.json(
      { error: "Failed to process image. Please try again." },
      { status: 500 }
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/predict
// Returns information about API access
// ═════════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "This endpoint is for internal web dashboard use only",
    externalApiAccess: {
      endpoint: "https://leaflens-six.vercel.app/api/v1/predict",
      method: "POST",
      authentication: "API key required (Bearer token)",
      documentation: "https://leaflens-six.vercel.app/api-docs",
      getApiKey: "https://leaflens-six.vercel.app/api-keys"
    },
    note: "Sign up and create an API key to access the LeafLens API programmatically"
  });
}
