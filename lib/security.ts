// Security utilities for LeafLens

import { NextRequest } from "next/server";

// Rate limiting configuration
interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per interval
}

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return (identifier: string): { success: boolean; remaining: number; resetTime: number } => {
    const now = Date.now();
    const record = rateLimitStore.get(identifier);

    // Clean up expired entries
    if (record && now > record.resetTime) {
      rateLimitStore.delete(identifier);
    }

    const currentRecord = rateLimitStore.get(identifier);

    if (!currentRecord) {
      // First request
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + config.interval,
      });
      return {
        success: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.interval,
      };
    }

    if (currentRecord.count >= config.maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        remaining: 0,
        resetTime: currentRecord.resetTime,
      };
    }

    // Increment count
    currentRecord.count++;
    rateLimitStore.set(identifier, currentRecord);

    return {
      success: true,
      remaining: config.maxRequests - currentRecord.count,
      resetTime: currentRecord.resetTime,
    };
  };
}

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";
  
  return ip;
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (password.length > 128) {
    errors.push("Password must be less than 128 characters");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Invalid file type. Only JPEG and PNG images are allowed.",
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size exceeds 5MB limit.",
    };
  }

  return { isValid: true };
}

/**
 * Validate base64 image
 */
export function validateBase64Image(base64: string): {
  isValid: boolean;
  error?: string;
} {
  // Check if it's a valid base64 string
  const base64Regex = /^data:image\/(jpeg|jpg|png);base64,/;
  if (!base64Regex.test(base64)) {
    return {
      isValid: false,
      error: "Invalid image format.",
    };
  }

  // Check size (approximate)
  const sizeInBytes = (base64.length * 3) / 4;
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (sizeInBytes > maxSize) {
    return {
      isValid: false,
      error: "Image size exceeds 5MB limit.",
    };
  }

  return { isValid: true };
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, storedToken: string): boolean {
  return token === storedToken && token.length === 64;
}

/**
 * Content Security Policy header
 */
export const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://*.googleusercontent.com https://firebasestorage.googleapis.com;
  font-src 'self' data:;
  connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firebasestorage.googleapis.com;
  frame-src 'self' https://*.firebaseapp.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s+/g, " ").trim();

/**
 * Security headers for Next.js
 */
export const SECURITY_HEADERS = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: CSP_HEADER,
  },
];

/**
 * Check if request is from allowed origin
 */
export function isAllowedOrigin(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  return allowedOrigins.includes(origin);
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .substring(0, 255);
}

/**
 * Check for SQL injection patterns (basic)
 */
export function hasSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|\*|;|'|"|\||&)/g,
    /(\bOR\b|\bAND\b).*=.*=/gi,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check for NoSQL injection patterns
 */
export function hasNoSQLInjection(input: any): boolean {
  if (typeof input === "object" && input !== null) {
    const keys = Object.keys(input);
    return keys.some((key) => key.startsWith("$") || key.includes("."));
  }
  return false;
}

/**
 * Validate Firebase UID format
 */
export function isValidFirebaseUID(uid: string): boolean {
  return /^[a-zA-Z0-9]{28}$/.test(uid);
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authentication endpoints
  login: { interval: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  signup: { interval: 60 * 60 * 1000, maxRequests: 3 }, // 3 signups per hour
  passwordReset: { interval: 60 * 60 * 1000, maxRequests: 3 }, // 3 resets per hour
  
  // API endpoints
  predict: { interval: 60 * 1000, maxRequests: 10 }, // 10 predictions per minute
  upload: { interval: 60 * 1000, maxRequests: 20 }, // 20 uploads per minute
  
  // General API
  api: { interval: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
};

/**
 * Log security event (for monitoring)
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  severity: "low" | "medium" | "high" | "critical" = "medium"
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    severity,
    details,
  };

  if (process.env.NODE_ENV === "development") {
    console.warn("[Security Event]", logEntry);
  }

  // In production, send to monitoring service (e.g., Sentry, DataDog)
  // Example: Sentry.captureMessage(event, { level: severity, extra: details });
}
