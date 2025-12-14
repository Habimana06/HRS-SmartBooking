import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { authService } from "../services/authService.js";
import { useAuth } from "../hooks/useAuth.jsx";

export default function EmailVerificationPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiryTime, setExpiryTime] = useState(10 * 60);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  // Load credentials on mount - check location.state first, then sessionStorage
  useEffect(() => {
    console.log("=== EmailVerificationPage MOUNTED ===");
    console.log("Current URL:", window.location.href);
    
    const loadCredentials = () => {
      // First, try to get from location.state (passed during navigation)
      const locationState = location.state || {};
      const stateEmail = locationState.email;
      const statePassword = locationState.password;
      
      console.log("Location state:", locationState);
      console.log("Email from location.state:", stateEmail);
      
      // Then check sessionStorage
      const storageEmail = sessionStorage.getItem("verify_email");
      const storagePassword = sessionStorage.getItem("verify_password");
      
      console.log("Email from sessionStorage:", storageEmail);
      console.log("Password exists in sessionStorage:", !!storagePassword);
      console.log("All sessionStorage keys:", Object.keys(sessionStorage));

      // Use location.state first, then sessionStorage as fallback
      const emailToUse = stateEmail || storageEmail;
      const passwordToUse = statePassword || storagePassword;

      if (emailToUse && passwordToUse) {
        console.log("✓✓✓ CREDENTIALS FOUND! ✓✓✓");
        console.log("Using email:", emailToUse);
        
        // Set state
        setEmail(emailToUse);
        setPassword(passwordToUse);
        setIsInitialized(true);
        
        // Also ensure sessionStorage is set (in case we got it from location.state)
        if (!storageEmail || storageEmail !== emailToUse) {
          sessionStorage.setItem("verify_email", emailToUse);
          sessionStorage.setItem("verify_password", passwordToUse);
          console.log("✓ Saved credentials to sessionStorage");
        }
        
        return true; // Found credentials
      }
      
      console.log("✗ No credentials found in location.state or sessionStorage");
      return false; // Not found
    };

    // Try immediately
    if (loadCredentials()) {
      console.log("✓ Credentials loaded successfully");
      return; // Found credentials, exit
    }

    // If not found, wait a bit and check sessionStorage again (in case navigation happened before storage was set)
    console.log("Credentials not found immediately, waiting and checking again...");
    const checkTimer = setTimeout(() => {
      const storageEmail = sessionStorage.getItem("verify_email");
      const storagePassword = sessionStorage.getItem("verify_password");
      
      if (storageEmail && storagePassword) {
        console.log("✓ Credentials found after delay!");
        setEmail(storageEmail);
        setPassword(storagePassword);
        setIsInitialized(true);
      } else {
        console.error("✗✗✗ NO CREDENTIALS FOUND - REDIRECTING TO LOGIN ✗✗✗");
        navigate("/login", { replace: true });
      }
    }, 1000); // Wait 1 second before giving up
    
    return () => {
      console.log("=== EmailVerificationPage UNMOUNTED ===");
      clearTimeout(checkTimer);
    };
  }, [navigate]); // Include navigate in dependencies

  // Countdown timers
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (expiryTime > 0) {
      const timer = setTimeout(() => setExpiryTime(expiryTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [expiryTime]);

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

    console.log("Verifying code for:", email);

    // New flow: call login with code to finalize auth
    const loginResult = await authService.login(email, password, code);
    
    if (loginResult.success) {
      console.log("✓ Login successful with code");
      let freshUser = loginResult.data;
      try {
        freshUser = await authService.me();
      } catch (refreshErr) {
        console.warn("Could not refresh auth after verification login, using login payload", refreshErr?.message);
      }
      setUser(freshUser || loginResult.data);
      
      // Clear storage
      sessionStorage.removeItem("verify_email");
      sessionStorage.removeItem("verify_password");
      sessionStorage.removeItem("verify_role");
      
      // Redirect
      switch ((freshUser || loginResult.data)?.role) {
        case "Admin":
          navigate("/admin/dashboard", { replace: true });
          break;
        case "Manager":
          navigate("/manager/dashboard", { replace: true });
          break;
        case "Receptionist":
          navigate("/receptionist/dashboard", { replace: true });
          break;
        case "Customer":
        default:
          navigate("/customer/home", { replace: true });
          break;
      }
    } else {
      console.error("✗ Verification failed:", loginResult);
      setError(loginResult.error || "Invalid or expired code. Please try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setResendLoading(true);
    setError("");

    // Request a new code by calling login without code
    const result = await authService.login(email, password);
    
    if (result.success || result.requiresVerification) {
      setResendCooldown(60);
      setExpiryTime(10 * 60);
      alert("Verification code sent! Please check your email.");
    } else {
      setError(result.error || "Failed to resend code. Please try again.");
    }
    setResendLoading(false);
  };

  // Show loading if not initialized
  if (!isInitialized || !email || !password) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-secondary-900 dark:to-secondary-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-secondary-900 dark:to-secondary-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a verification code to
          </p>
          <p className="font-semibold text-primary-600 dark:text-primary-400 mt-2 text-lg">
            {email}
          </p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
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
                className="input-field text-center text-3xl font-mono tracking-widest py-4"
                placeholder="000000"
                autoFocus
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                Code expires in: <span className="font-semibold text-primary-600 dark:text-primary-400">{formatTime(expiryTime)}</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="mt-6 text-center space-y-3">
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

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/login"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                ← Back to Login
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              The verification code will expire in 10 minutes. Make sure to check your spam folder if you don't see the email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}