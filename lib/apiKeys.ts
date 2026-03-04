// API Key Management Utilities
import { db } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc, increment, query, where, getDocs, Timestamp } from 'firebase/firestore';
import crypto from 'crypto';

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

// ── Firestore Operations ─────────────────────────────────────────────────────

/**
 * Create a new API key in Firestore
 * @param ownerId - User ID from Firebase Auth
 * @param ownerEmail - User email
 * @param name - Descriptive name for the key
 * @param plan - Subscription plan
 * @returns Object with plain key (show once) and key ID
 */
export async function createApiKey(
  ownerId: string,
  ownerEmail: string,
  name: string,
  plan: 'free' | 'premium' | 'enterprise' = 'free'
): Promise<{ plainKey: string; keyId: string }> {
  const plainKey = generateApiKey();
  const hashedKey = hashApiKey(plainKey);
  
  const keyData = {
    hashedKey,
    ownerId,
    ownerEmail,
    name,
    isActive: true,
    plan,
    usageCount: 0,
    usageLimit: PLAN_LIMITS[plan].requestsPerMonth,
    createdAt: Timestamp.now(),
    lastUsedAt: null,
    expiresAt: null, // Optional: set expiration date
  };

  const keyRef = doc(collection(db, 'api_keys'));
  await setDoc(keyRef, keyData);

  return {
    plainKey, // Return this to user ONCE
    keyId: keyRef.id,
  };
}

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
    // Query Firestore for matching hashed key
    const keysRef = collection(db, 'api_keys');
    const q = query(keysRef, where('hashedKey', '==', hashedKey));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        valid: false,
        error: 'API key not found',
      };
    }

    const keyDoc = snapshot.docs[0];
    const keyData = keyDoc.data() as Omit<ApiKey, 'id'>;
    const apiKey: ApiKey = {
      id: keyDoc.id,
      ...keyData,
      createdAt: keyData.createdAt instanceof Date ? keyData.createdAt : (keyData.createdAt as any)?.toDate?.() || new Date(),
      lastUsedAt: keyData.lastUsedAt instanceof Date ? keyData.lastUsedAt : (keyData.lastUsedAt as any)?.toDate?.(),
      expiresAt: keyData.expiresAt instanceof Date ? keyData.expiresAt : (keyData.expiresAt as any)?.toDate?.(),
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
    const keyRef = doc(db, 'api_keys', keyId);
    await updateDoc(keyRef, {
      usageCount: increment(1),
      lastUsedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Failed to increment usage:', error);
    // Don't throw - usage tracking failure shouldn't block the request
  }
}

/**
 * Deactivate an API key
 * @param keyId - Document ID of the API key
 */
export async function deactivateApiKey(keyId: string): Promise<void> {
  const keyRef = doc(db, 'api_keys', keyId);
  await updateDoc(keyRef, {
    isActive: false,
  });
}

/**
 * Get all API keys for a user
 * @param ownerId - User ID from Firebase Auth
 * @returns Array of API keys (without hashed keys)
 */
export async function getUserApiKeys(ownerId: string): Promise<Omit<ApiKey, 'hashedKey'>[]> {
  const keysRef = collection(db, 'api_keys');
  const q = query(keysRef, where('ownerId', '==', ownerId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ownerId: data.ownerId,
      ownerEmail: data.ownerEmail,
      name: data.name,
      isActive: data.isActive,
      plan: data.plan,
      usageCount: data.usageCount,
      usageLimit: data.usageLimit,
      createdAt: data.createdAt instanceof Date ? data.createdAt : (data.createdAt as any)?.toDate?.() || new Date(),
      lastUsedAt: data.lastUsedAt instanceof Date ? data.lastUsedAt : (data.lastUsedAt as any)?.toDate?.(),
      expiresAt: data.expiresAt instanceof Date ? data.expiresAt : (data.expiresAt as any)?.toDate?.(),
    };
  });
}

// ── Rate Limiting (In-Memory) ────────────────────────────────────────────────
// For per-minute rate limiting, use in-memory cache

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

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimitCache(): void {
  const now = Date.now();
  const entries = Array.from(rateLimitCache.entries());
  for (const [keyId, entry] of entries) {
    if (now > entry.resetAt) {
      rateLimitCache.delete(keyId);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitCache, 5 * 60 * 1000);
}
