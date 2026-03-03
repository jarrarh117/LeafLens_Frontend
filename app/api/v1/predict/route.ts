import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, increment, Timestamp } from "firebase/firestore";
import { PLANT_CLASSES, parseClassName, getDiseaseInfo, getSeverity } from "@/lib/plantClasses";
import { validateBase64Image, logSecurityEvent } from "@/lib/security";

// ── Configuration ────────────────────────────────────────────────────────────
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

// ── Rate Limits per Plan ─────────────────────────────────────────────────────
const PLAN_LIMITS = {
  free: { perMinute: 10, perDay: 100 },
  pro: { perMinute: 60, perDay: 5000 },
  enterprise: { perMinute: Infinity, perDay: Infinity },
};

// In-memory rate limiting (per API key)
const apiKeyUsage = new Map<string, { minute: number; day: number; minuteReset: number; dayReset: number }>();

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

// ── Helper: Validate API Key ─────────────────────────────────────────────────
async function validateApiKey(apiKey: string): Promise<{
  valid: boolean;
  error?: string;
  userId?: string;
  keyDocId?: string;
  plan?: string;
}> {
  // Check API key format (llai_ prefix + 32 chars)
  if (!apiKey || !apiKey.startsWith("llai_") || apiKey.length !== 37) {
    return { valid: false, error: "Invalid API key format" };
  }

  try {
    // Query Firestore for this API key
    const apiKeysRef = collection(db, "apiKeys");
    const q = query(apiKeysRef, where("key", "==", apiKey));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { valid: false, error: "API key not found" };
    }

    const keyDoc = snapshot.docs[0];
    const keyData = keyDoc.data();

    // Check if key is active (allow keys without status field for backward compatibility)
    if (keyData.status && keyData.status !== "active") {
      return { valid: false, error: "API key is inactive or revoked" };
    }

    return {
      valid: true,
      userId: keyData.userId,
      keyDocId: keyDoc.id,
      plan: keyData.plan || "free",
    };
  } catch (error) {
    console.error("API key validation error:", error);
    return { valid: false, error: "Failed to validate API key" };
  }
}

// ── Helper: Check Rate Limits ────────────────────────────────────────────────
function checkRateLimit(apiKey: string, plan: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
  
  let usage = apiKeyUsage.get(apiKey);
  
  // Initialize or reset usage tracking
  if (!usage) {
    usage = { minute: 0, day: 0, minuteReset: now + 60000, dayReset: now + 86400000 };
    apiKeyUsage.set(apiKey, usage);
  }
  
  // Reset minute counter if needed
  if (now > usage.minuteReset) {
    usage.minute = 0;
    usage.minuteReset = now + 60000;
  }
  
  // Reset day counter if needed
  if (now > usage.dayReset) {
    usage.day = 0;
    usage.dayReset = now + 86400000;
  }
  
  // Check limits
  if (usage.minute >= limits.perMinute) {
    return { allowed: false, retryAfter: Math.ceil((usage.minuteReset - now) / 1000) };
  }
  
  if (usage.day >= limits.perDay) {
    return { allowed: false, retryAfter: Math.ceil((usage.dayReset - now) / 1000) };
  }
  
  // Increment usage
  usage.minute++;
  usage.day++;
  
  return { allowed: true };
}

// ── Helper: Update API Key Usage Stats ───────────────────────────────────────
async function updateApiKeyUsage(keyDocId: string) {
  try {
    const { doc } = await import("firebase/firestore");
    const keyDocRef = doc(db, "apiKeys", keyDocId);
    
    await updateDoc(keyDocRef, {
      usageCount: increment(1),
      lastUsed: Timestamp.now(),
    });
  } catch (error) {
    console.error("Failed to update API key usage:", error);
    // Don't fail the request if usage tracking fails
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/v1/predict
//
// External API endpoint with API key authentication.
// Validates API key from Authorization header, checks rate limits,
// then forwards to the Python backend for disease detection.
// ═════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // ── Extract API Key from Authorization header ────────────────────────
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing Authorization header. Use: Bearer YOUR_API_KEY" },
        { status: 401 }
      );
    }

    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Invalid Authorization format. Use: Bearer YOUR_API_KEY" },
        { status: 401 }
      );
    }

    const apiKey = authHeader.slice(7).trim();

    // ── Validate API Key ─────────────────────────────────────────────────
    const validation = await validateApiKey(apiKey);
    
    if (!validation.valid) {
      logSecurityEvent(
        "invalid_api_key",
        { endpoint: "/api/v1/predict", error: validation.error },
        "medium"
      );
      
      return NextResponse.json(
        { error: validation.error || "Invalid or missing API key" },
        { status: 401 }
      );
    }

    // ── Check Rate Limits ────────────────────────────────────────────────
    const rateCheck = checkRateLimit(apiKey, validation.plan || "free");
    
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: rateCheck.retryAfter },
        { status: 429 }
      );
    }

    // ── Parse request body ───────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided. Include 'image' field with base64-encoded image." },
        { status: 400 }
      );
    }

    // ── Validate image format ────────────────────────────────────────────
    const imageValidation = validateBase64Image(image);
    if (!imageValidation.isValid) {
      return NextResponse.json(
        { error: imageValidation.error },
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
        signal: AbortSignal.timeout(30000),
      });
    } catch (fetchError: any) {
      console.error("Backend connection error:", fetchError);
      return NextResponse.json(
        { error: "AI model service is currently unavailable. Please try again later." },
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

    // ── Update API key usage stats (async, don't wait) ───────────────────
    updateApiKeyUsage(validation.keyDocId!);

    // ── Enrich with disease info ─────────────────────────────────────────
    const topPrediction = backendResult.predictions[0];
    const { description, recommendations, severity } = getAnalysisDetails(
      topPrediction.plant,
      topPrediction.condition
    );

    const confidenceStr = `${topPrediction.confidence.toFixed(1)}%`;

    const predictions = backendResult.predictions.map(
      (p: { class_name: string; plant: string; condition: string; confidence: number }) => ({
        class: p.class_name,
        plant: p.plant,
        condition: p.condition,
        confidence: p.confidence,
      })
    );

    // ── Return response ──────────────────────────────────────────────────
    const result = {
      success: true,
      disease: topPrediction.condition,
      plant: topPrediction.plant,
      condition: topPrediction.condition,
      confidence: confidenceStr,
      severity,
      description,
      recommendations,
      predictions,
      inferenceTime: backendResult.inference_time_ms,
      model: backendResult.model,
    };

    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error("API v1 prediction error:", error);
    
    logSecurityEvent(
      "api_v1_error",
      { endpoint: "/api/v1/predict", error: error.message },
      "high"
    );

    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/v1/predict
// Returns API usage information
// ═════════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: "/api/v1/predict",
    method: "POST",
    description: "Analyze plant images for disease detection",
    authentication: "Bearer token required",
    documentation: "/api-docs",
    example: {
      headers: {
        "Authorization": "Bearer llai_your_api_key_here",
        "Content-Type": "application/json"
      },
      body: {
        image: "data:image/jpeg;base64,..."
      }
    }
  });
}
