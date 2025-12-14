import { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../services/authService.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleVerifyEmail = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setVerifying(true);
    setError("");
    
    try {
      // Check if email exists (we'll verify by attempting to send code)
      // For now, we'll just enable the button if email format is valid
      // The actual verification happens on the backend
      setEmailVerified(true);
    } catch (err) {
      setError("Failed to verify email. Please try again.");
      setEmailVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!emailVerified) {
      setError("Please verify your email first");
      return;
    }

    setLoading(true);
    setError("");

    const result = await authService.forgotPassword(email);
    
    if (result.success) {
      setSubmitted(true);
    } else {
      const errorMessage = result.error || "Failed to send reset link. Please try again.";
      if (errorMessage.includes("customers") || errorMessage.includes("administrator")) {
        setError(errorMessage);
      } else {
        setError(errorMessage);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-secondary-900 dark:to-secondary-800 p-4">
      <div className="w-full max-w-md">
        <div className="card">
          {!submitted ? (
            <>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                Forgot Password
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="label">
                    Email Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailVerified(false);
                        setError("");
                      }}
                      required
                      className="input-field flex-1"
                      placeholder="Enter your email"
                      disabled={submitted}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyEmail}
                      disabled={!email || !email.includes("@") || emailVerified || submitted || verifying}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        emailVerified
                          ? "bg-green-600 text-white cursor-not-allowed"
                          : (!email || !email.includes("@") || submitted || verifying)
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {verifying ? "Verifying..." : emailVerified ? "✓ Verified" : "Verify Email"}
                    </button>
                  </div>
                  {error && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>
                  )}
                </div>
                <button 
                  type="submit" 
                  className="btn-primary w-full"
                  disabled={!emailVerified || loading || submitted}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We've sent a password reset link to {email}
              </p>
            </div>
          )}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
