// Centralized error handling utilities

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
}

// Firebase Auth error codes mapping
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Email/Password errors
  "auth/email-already-in-use": "This email is already registered. Please sign in instead.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/operation-not-allowed": "This sign-in method is not enabled. Please contact support.",
  "auth/weak-password": "Password is too weak. Please use at least 8 characters with letters and numbers.",
  "auth/user-disabled": "This account has been disabled. Please contact support.",
  "auth/user-not-found": "No account found with this email. Please check your email or sign up.",
  "auth/wrong-password": "Incorrect password. Please try again or reset your password.",
  "auth/invalid-credential": "Invalid email or password. Please try again.",
  "auth/too-many-requests": "Too many failed attempts. Please try again later or reset your password.",
  
  // Google OAuth errors
  "auth/popup-closed-by-user": "Sign-in cancelled. Please try again.",
  "auth/popup-blocked": "Pop-up blocked by browser. Please allow pop-ups and try again.",
  "auth/cancelled-popup-request": "Sign-in cancelled. Please try again.",
  "auth/account-exists-with-different-credential": "An account already exists with this email using a different sign-in method.",
  
  // Network errors
  "auth/network-request-failed": "Network error. Please check your internet connection and try again.",
  "auth/timeout": "Request timed out. Please try again.",
  
  // Token errors
  "auth/invalid-verification-code": "Invalid verification code. Please try again.",
  "auth/invalid-verification-id": "Verification session expired. Please request a new code.",
  "auth/code-expired": "Verification code expired. Please request a new one.",
  
  // Password reset errors
  "auth/expired-action-code": "This link has expired. Please request a new password reset.",
  "auth/invalid-action-code": "This link is invalid or has already been used.",
  "auth/user-token-expired": "Your session has expired. Please sign in again.",
  "auth/requires-recent-login": "For security, please sign in again to complete this action.",
  
  // Email verification errors
  "auth/missing-email": "Email address is required.",
  "auth/invalid-continue-uri": "Invalid redirect URL.",
  
  // General errors
  "auth/internal-error": "An unexpected error occurred. Please try again.",
  "auth/unauthorized-domain": "This domain is not authorized. Please contact support.",
};

// Firestore error messages
export const FIRESTORE_ERROR_MESSAGES: Record<string, string> = {
  "permission-denied": "You don't have permission to access this data.",
  "not-found": "The requested data was not found.",
  "already-exists": "This data already exists.",
  "resource-exhausted": "Too many requests. Please try again later.",
  "failed-precondition": "Operation failed. Please try again.",
  "aborted": "Operation was aborted. Please try again.",
  "out-of-range": "Invalid data range.",
  "unimplemented": "This feature is not yet available.",
  "internal": "An internal error occurred. Please try again.",
  "unavailable": "Service temporarily unavailable. Please try again later.",
  "data-loss": "Data loss detected. Please contact support.",
  "unauthenticated": "Please sign in to continue.",
  "deadline-exceeded": "Request timed out. Please try again.",
  "cancelled": "Operation was cancelled.",
};

// Storage error messages
export const STORAGE_ERROR_MESSAGES: Record<string, string> = {
  "storage/unknown": "An unknown error occurred. Please try again.",
  "storage/object-not-found": "File not found.",
  "storage/bucket-not-found": "Storage bucket not found. Please contact support.",
  "storage/project-not-found": "Project not found. Please contact support.",
  "storage/quota-exceeded": "Storage quota exceeded. Please contact support.",
  "storage/unauthenticated": "Please sign in to upload files.",
  "storage/unauthorized": "You don't have permission to access this file.",
  "storage/retry-limit-exceeded": "Upload failed after multiple attempts. Please try again.",
  "storage/invalid-checksum": "File upload corrupted. Please try again.",
  "storage/canceled": "Upload cancelled.",
  "storage/invalid-event-name": "Invalid operation.",
  "storage/invalid-url": "Invalid file URL.",
  "storage/invalid-argument": "Invalid file or parameters.",
  "storage/no-default-bucket": "No storage bucket configured. Please contact support.",
  "storage/cannot-slice-blob": "File upload failed. Please try again.",
  "storage/server-file-wrong-size": "File size mismatch. Please try again.",
};

/**
 * Get user-friendly error message from Firebase error
 */
export function getErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  
  // Check if it's a Firebase error with a code
  if (error.code) {
    const code = error.code as string;
    
    // Check auth errors
    if (code.startsWith("auth/")) {
      return AUTH_ERROR_MESSAGES[code] || error.message || "Authentication error. Please try again.";
    }
    
    // Check Firestore errors
    if (FIRESTORE_ERROR_MESSAGES[code]) {
      return FIRESTORE_ERROR_MESSAGES[code];
    }
    
    // Check Storage errors
    if (code.startsWith("storage/")) {
      return STORAGE_ERROR_MESSAGES[code] || "Storage error. Please try again.";
    }
  }
  
  // Check for network errors
  if (error.message?.includes("network") || error.message?.includes("fetch")) {
    return "Network error. Please check your internet connection and try again.";
  }
  
  // Return the error message if available, otherwise generic message
  return error.message || "An unexpected error occurred. Please try again.";
}

/**
 * Log error for debugging (in development) and monitoring (in production)
 */
export function logError(error: any, context?: string): void {
  if (process.env.NODE_ENV === "development") {
    console.error(`[${context || "Error"}]:`, error);
  }
  
  // In production, you would send this to a monitoring service like Sentry
  // Example: Sentry.captureException(error, { tags: { context } });
}

/**
 * Create a standardized error object
 */
export function createError(code: string, message: string, userMessage?: string): AppError {
  return {
    code,
    message,
    userMessage: userMessage || message,
  };
}

/**
 * Check if error is a specific Firebase error code
 */
export function isErrorCode(error: any, code: string): boolean {
  return error?.code === code;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.code === "auth/network-request-failed" ||
    error?.message?.includes("network") ||
    error?.message?.includes("fetch failed")
  );
}

/**
 * Check if error requires re-authentication
 */
export function requiresReauth(error: any): boolean {
  return (
    error?.code === "auth/requires-recent-login" ||
    error?.code === "auth/user-token-expired"
  );
}
