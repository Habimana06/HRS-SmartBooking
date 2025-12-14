import { useState, useEffect } from "react";
import { authService } from "../services/authService.js";

export default function EmailVerificationModal({ 
  isOpen, 
  onClose, 
  email, 
  userId,
  onVerified 
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiryTime, setExpiryTime] = useState(10 * 60); // 10 minutes in seconds

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setError("");
      setExpiryTime(10 * 60);
      setResendCooldown(60); // 1 minute cooldown
    }
  }, [isOpen]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (expiryTime > 0 && isOpen) {
      const timer = setTimeout(() => setExpiryTime(expiryTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [expiryTime, isOpen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter a 6-digit code.");
      return;
    }

    setError("");
    setLoading(true);

    // Verify the code
    const verifyResult = await authService.verifyEmail(email, code);
    
    if (verifyResult.success) {
      console.log("Verification successful:", verifyResult);
      
      // After successful verification, try to login automatically
      // Don't close modal yet - let onVerified handle the login retry
      try {
        await onVerified();
        // If onVerified succeeds, parent will close modal and redirect
        // Modal stays open until login succeeds
      } catch (loginErr) {
        // Login retry failed - keep modal open and show error
        console.error("Login retry failed:", loginErr);
        const errorMsg = loginErr?.response?.data?.error || loginErr?.message || "Verification successful, but login failed. Please try logging in again.";
        setError(errorMsg);
        setLoading(false);
        // Don't close modal - let user try again or manually login
      }
    } else {
      console.error("Verification failed:", verifyResult);
      const errorMsg = verifyResult.error || "Invalid or expired code. Please try again.";
      setError(errorMsg);
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setResendLoading(true);
    setError("");

    const result = await authService.sendVerificationCode(email);
    
    if (result.success) {
      setResendCooldown(60);
      setExpiryTime(10 * 60);
      alert("Verification code sent! Please check your email.");
    } else {
      setError(result.error || "Failed to resend code. Please try again.");
    }
    setResendLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // Prevent closing when clicking outside
        if (e.target === e.currentTarget) {
          // Optionally allow closing, but for now prevent it
          // onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a verification code to
          </p>
          <p className="font-semibold text-primary-600 dark:text-primary-400 mt-1">
            {email}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="code" className="label">
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(value);
                setError("");
              }}
              required
              maxLength={6}
              className="input-field text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              autoFocus
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
              Code expires in: <span className="font-semibold">{formatTime(expiryTime)}</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              "Verify Email"
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading ? (
              "Sending..."
            ) : resendCooldown > 0 ? (
              `Resend code in ${resendCooldown}s`
            ) : (
              "Didn't receive code? Resend"
            )}
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            The verification code will expire in 10 minutes. Make sure to check your spam folder if you don't see the email.
          </p>
        </div>
      </div>
    </div>
  );
}

