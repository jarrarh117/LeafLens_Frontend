"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { resendVerificationEmail, checkEmailVerified, logOut } from "@/lib/auth";
import LeafLoader from "@/components/LeafLoader";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Auto-check verification status every 3 seconds
  useEffect(() => {
    if (!user || loading) return;

    // If user is already verified, redirect to dashboard
    if (user.emailVerified) {
      router.push("/dashboard");
      return;
    }

    const interval = setInterval(async () => {
      setChecking(true);
      const isVerified = await checkEmailVerified();
      setChecking(false);

      if (isVerified) {
        router.push("/dashboard");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, loading, router]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Redirect if no user or user is already verified
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleResendEmail = async () => {
    if (!canResend) return;

    setResending(true);
    setError("");
    setResendSuccess(false);

    try {
      await resendVerificationEmail();
      setResendSuccess(true);
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) {
    return <LeafLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-6 rounded-full">
            <Mail className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
          Verify Your Email
        </h1>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6">
          We've sent a verification email to{" "}
          <span className="font-semibold text-gray-900">{user?.email}</span>
        </p>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Please check your inbox and click the verification link to activate your account.
            This page will automatically redirect you once verified.
          </p>
        </div>

        {/* Auto-checking indicator */}
        {checking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center space-x-2 text-green-600 mb-4"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Checking verification status...</span>
          </motion.div>
        )}

        {/* Success message */}
        {resendSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start space-x-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 text-sm">
              Verification email sent successfully! Please check your inbox.
            </p>
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start space-x-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Resend button */}
        <button
          onClick={handleResendEmail}
          disabled={!canResend || resending}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mb-4"
        >
          {resending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              <span>
                {canResend
                  ? "Resend Verification Email"
                  : `Resend in ${countdown}s`}
              </span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">or</span>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300"
        >
          Sign Out
        </button>

        {/* Help text */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Didn't receive the email? Check your spam folder or try resending.
        </p>
      </motion.div>
    </div>
  );
}
