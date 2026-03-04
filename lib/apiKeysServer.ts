// Server-side API Key Management Utilities (Firebase Admin SDK)
import crypto from 'crypto';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }
  }
  return admin;
}

function getDb() {
  return getFirebaseAdmin().firestore();
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface ApiKey {
  id: string;
  hashedKey: string;
  ownerId: string;
  ownerEmail: string;
  name: string;
  isActive: boolean;
  plan: 'free' | 'premium' | 'enterprise';
  usageCount: number;
  usageLimit: number;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
}

export interface ApiKeyValidationResult {
  valid: boolean;
  error?: string;
  keyData?: ApiKey;
  remainingRequests?: number;
}

// ── Plan Limits ──────────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  free: {
    requestsPerMonth: 100,
    requestsPerMinute: 10,
    requestsPerDay: 50,
  },
  premium: {
    requestsPerMonth: 5000,
    requestsPerMinute: 60,
    requestsPerDay: 1000,
  },
  enterprise: {
    requestsPerMonth: Infinity,
    requestsPerMinute: Infinity,
    requestsPerDay: Infinity,
  },
};

// ── Key Generation ───────────────────────────────────────────────────────────

/**
 * Generate a secure random API key with pd_live_ prefix
 * @returns Plain text API key (show to user only once)
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(32);
  const key = randomBytes.toString('base64url'); // URL-safe base64
  return `pd_live_${key}`;
}

/**
 * Hash an API key using SHA-256
 * @param plainKey - The plain text API key
 * @returns Hashed key (store this in Firestore)
 */
export function hashApiKey(plainKey: string): string {
  return crypto.createHash('sha256').update(plainKey).digest('hex');
}

// ── Firestore Operations (Server-side with Admin SDK) ────────────────────────

/**
 * Validate an API key and check rate limits
 * @param plainKey - The API key from request header
 * @returns Validation result with key data if valid
 */
export async function validateApiKey(plainKey: string): Promise<ApiKeyValidationResult> {
  // Check key format
  if (!plainKey || !plainKey.startsWith('pd_live_')) {
    return {
      valid: false,
      error: 'Invalid API key format',
    };
  }

  // Hash the provided key
  const hashedKey = hashApiKey(plainKey);

  try {
    const db = getDb();
    
    // Query Firestore for matching hashed key
    const snapshot = await db.collection('api_keys')
      .where('hashedKey', '==', hashedKey)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return {
        valid: false,
        error: 'API key not found',
      };
    }

    const keyDoc = snapshot.docs[0];
    const keyData = keyDoc.data();
    const apiKey: ApiKey = {
      id: keyDoc.id,
      hashedKey: keyData.hashedKey,
      ownerId: keyData.ownerId,
      ownerEmail: keyData.ownerEmail,
      name: keyData.name,
      isActive: keyData.isActive,
      plan: keyData.plan,
      usageCount: keyData.usageCount,
      usageLimit: keyData.usageLimit,
      createdAt: keyData.createdAt?.toDate() || new Date(),
      lastUsedAt: keyData.lastUsedAt?.toDate(),
      expiresAt: keyData.expiresAt?.toDate(),
    };

    // Check if key is active
    if (!apiKey.isActive) {
      return {
        valid: false,
        error: 'API key is inactive or revoked',
      };
    }

    // Check if key is expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return {
        valid: false,
        error: 'API key has expired',
      };
    }

    // Check usage limit
    const limit = PLAN_LIMITS[apiKey.plan].requestsPerMonth;
    if (apiKey.usageCount >= limit) {
      return {
        valid: false,
        error: `Usage limit exceeded (${limit} requests per month)`,
        keyData: apiKey,
        remainingRequests: 0,
      };
    }

    // Valid key
    return {
      valid: true,
      keyData: apiKey,
      remainingRequests: limit - apiKey.usageCount,
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return {
      valid: false,
      error: 'Failed to validate API key',
    };
  }
}

/**
 * Increment usage count for an API key
 * @param keyId - Document ID of the API key
 */
export async function incrementUsage(keyId: string): Promise<void> {
  try {
    const db = getDb();
    await db.collection('api_keys').doc(keyId).update({
      usageCount: admin.firestore.FieldValue.increment(1),
      lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to increment usage:', error);
    // Don't throw - usage tracking failure shouldn't block the request
  }
}

// ── Rate Limiting (In-Memory) ────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitCache = new Map<string, RateLimitEntry>();

/**
 * Check per-minute rate limit
 * @param keyId - API key document ID
 * @param plan - Subscription plan
 * @returns true if within limit, false if exceeded
 */
export function checkRateLimit(keyId: string, plan: 'free' | 'premium' | 'enterprise'): boolean {
  const limit = PLAN_LIMITS[plan].requestsPerMinute;
  
  if (limit === Infinity) {
    return true; // No limit for enterprise
  }

  const now = Date.now();
  const entry = rateLimitCache.get(keyId);

  // Reset if window expired
  if (!entry || now > entry.resetAt) {
    rateLimitCache.set(keyId, {
      count: 1,
      resetAt: now + 60000, // 1 minute
    });
    return true;
  }

  // Check limit
  if (entry.count >= limit) {
    return false; // Rate limit exceeded
  }

  // Increment count
  entry.count++;
  return true;
}

