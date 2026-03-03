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

// Rate limiter for predictions
const predictRateLimit = rateLimit(RATE_LIMITS.predict);

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
