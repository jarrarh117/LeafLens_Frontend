// Server-side API Key Management Utilities (Firebase Admin SDK)
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
