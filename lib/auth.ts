import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { getErrorMessage, logError } from "./errors";
import { rateLimit, getClientIdentifier, RATE_LIMITS, logSecurityEvent } from "./security";

// Rate limiters for auth endpoints
const loginRateLimit = rateLimit(RATE_LIMITS.login);
const signupRateLimit = rateLimit(RATE_LIMITS.signup);
const passwordResetRateLimit = rateLimit(RATE_LIMITS.passwordReset);

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  totalScans?: number;
}

// Sign up with email and password
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  // Rate limiting
  const rateLimitResult = signupRateLimit(email);

  if (!rateLimitResult.success) {
    logSecurityEvent("rate_limit_exceeded", {
      endpoint: "signUp",
      identifier: email,
    }, "high");

    throw new Error(
      `Too many signup attempts. Please try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`
    );
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, { displayName });

    // Send email verification
    await sendEmailVerification(user);

    // Create user document in Firestore
    if (db) {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName,
        createdAt: new Date(),
        totalScans: 0,
      });
    }

    return user;
  } catch (error: any) {
    logError(error, "signUp");
    throw new Error(getErrorMessage(error));
  }
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<User> {
  // Rate limiting
  const identifier = email; // Use email as identifier for login rate limiting
  const rateLimitResult = loginRateLimit(identifier);

  if (!rateLimitResult.success) {
    logSecurityEvent("rate_limit_exceeded", {
      endpoint: "signIn",
      identifier,
    }, "high");

    throw new Error(
      `Too many login attempts. Please try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`
    );
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error: any) {
    logError(error, "signIn");
    throw new Error(getErrorMessage(error));
  }
}

// Sign in with Google
export async function signInWithGoogle(): Promise<User> {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user document exists, if not create it
    if (db) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date(),
          totalScans: 0,
        });
      }
    }

    return user;
  } catch (error: any) {
    logError(error, "signInWithGoogle");
    throw new Error(getErrorMessage(error));
  }
}

// Sign out
export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    logError(error, "logOut");
    throw new Error(getErrorMessage(error));
  }
}

// Reset password
export async function resetPassword(email: string): Promise<void> {
  // Rate limiting
  const rateLimitResult = passwordResetRateLimit(email);

  if (!rateLimitResult.success) {
    logSecurityEvent("rate_limit_exceeded", {
      endpoint: "resetPassword",
      identifier: email,
    }, "medium");

    throw new Error(
      `Too many password reset requests. Please try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`
    );
  }

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    logError(error, "resetPassword");
    throw new Error(getErrorMessage(error));
  }
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Listen to auth state changes
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Get user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    if (!db) return null;
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    logError(error, "getUserProfile");
    return null;
  }
}

// Resend verification email
export async function resendVerificationEmail(): Promise<void> {
  try {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
    } else {
      throw new Error("No user found or email already verified");
    }
  } catch (error: any) {
    logError(error, "resendVerificationEmail");
    throw new Error(getErrorMessage(error));
  }
}

// Check if email is verified
export async function checkEmailVerified(): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (user) {
      await user.reload();
      return user.emailVerified;
    }
    return false;
  } catch (error) {
    logError(error, "checkEmailVerified");
    return false;
  }
}
