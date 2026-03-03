import { NextRequest, NextResponse } from "next/server";
import { PLANT_CLASSES, parseClassName, getDiseaseInfo, getSeverity } from "@/lib/plantClasses";
import { validateBase64Image, logSecurityEvent } from "@/lib/security";

// ── Configuration ────────────────────────────────────────────────────────────
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ── Rate Limits per Plan ─────────────────────────────────────────────────────
const PLAN_LIMITS = {
  free: { perMinute: 10, perDay: 100 },
  pro: { perMinute: 60, perDay: 5000 },
  enterprise: { perMinute: Infinity, perDay: Infinity },
};

// In-memory rate limiting (per API key)
const apiKeyUsage = new Map<string, { minute: number; day: number; minuteReset: number; dayReset: number }>();

// ── Helper: Validate image contains a plant leaf using Gemini ────────────────
async function validatePlantImage(base64Image: string): Promise<{
  isPlant: boolean;
  confidence: number;
  reason?: string;
  validationSkipped?: boolean;
}> {
  if (!GEMINI_API_KEY) {
    console.warn("⚠️  Gemini API key not configured - skipping plant validation");
    return { isPlant: true, confidence: 1.0, validationSkipped: true };
  }

  try {
    const imageData = base64Image.includes(",") 
      ? base64Image.split(",")[1] 
      : base64Image;

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
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("❌ Gemini API error:", response.status, errorText);
      logSecurityEvent(
        "gemini_api_error",
        { status: response.status, error: errorText },
        "medium"
      );
      return { isPlant: true, confidence: 1.0, validationSkipped: true };
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      console.error("❌ No response from Gemini");
      return { isPlant: true, confidence: 1.0, validationSkipped: true };
    }

    const result = JSON.parse(resultText);
    
    if (typeof result.isPlant !== "boolean" || typeof result.confidence !== "number") {
      console.error("❌ Invalid Gemini response format:", result);
      return { isPlant: true, confidence: 1.0, validationSkipped: true };
    }

    console.log("✅ Plant validation:", {
      isPlant: result.isPlant,
      confidence: result.confidence,
      reason: result.reason
    });

    return {
      isPlant: result.isPlant === true,
      confidence: Math.max(0, Math.min(1, result.confidence)),
      reason: result.reason || "No reason provided",
      validationSkipped: false,
    };
  } catch (error: any) {
    console.error("❌ Plant validation error:", error.message);
    logSecurityEvent(
      "plant_validation_error",
      { error: error.message },
      "low"
    );
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
    // Dynamically import Firebase to avoid build-time initialization
    const { db } = await import("@/lib/firebase");
    const { collection, query, where, getDocs } = await import("firebase/firestore");
    
    if (!db) {
      return { valid: false, error: "Database not available" };
    }
    
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
    const { db } = await import("@/lib/firebase");
    const { doc, updateDoc, increment, Timestamp } = await import("firebase/firestore");
    
    if (!db) {
      console.error("❌ Database not available for usage tracking");
      return;
    }
    
    const keyDocRef = doc(db, "apiKeys", keyDocId);
    
    await updateDoc(keyDocRef, {
      usageCount: increment(1),
      lastUsed: Timestamp.now(),
    });
    
    console.log(`✅ Updated usage for API key: ${keyDocId}`);
  } catch (error) {
    console.error("❌ Failed to update API key usage:", error);
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

    // ── Validate image contains a plant using Gemini ─────────────────────
    const plantValidation = await validatePlantImage(image);
    
    if (!plantValidation.validationSkipped && !plantValidation.isPlant) {
      return NextResponse.json(
        { 
          error: "Invalid image type",
          message: "This doesn't appear to be a plant leaf image. Please upload a clear photo of a plant leaf for accurate disease detection.",
          details: plantValidation.reason,
          suggestions: [
            "Ensure the image shows plant leaves clearly",
            "Use good lighting and focus on the affected area",
            "Avoid images of people, animals, or non-plant objects",
            "Make sure leaves fill most of the frame"
          ],
          isPlant: false,
          confidence: plantValidation.confidence
        },
        { status: 400 }
      );
    }

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
    console.log(`📊 Updating usage for API key doc: ${validation.keyDocId}`);
    updateApiKeyUsage(validation.keyDocId!).catch(err => {
      console.error("Usage update failed:", err);
    });

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
