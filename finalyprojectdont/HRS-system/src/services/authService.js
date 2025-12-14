import apiClient from "./apiClient.js";

export const authService = {
  async login(email, password, code = null) {
    try {
      const { data } = await apiClient.post("/auth/login", { email, password, code });
      return { success: true, data };
    } catch (error) {
      const errorData = error?.response?.data;
      
      if (errorData?.requiresVerification) {
        return {
          success: false,
          requiresVerification: true,
          userId: errorData.userId,
          email: errorData.email,
          error: errorData.error || "Verification code required"
        };
      }
      
      return {
        success: false,
        error: errorData?.error || "Login failed. Please try again."
      };
    }
  },

  async register(userData) {
    try {
      const { data } = await apiClient.post("/auth/register", userData);
      return { success: true, data };
    } catch (error) {
      const errorData = error?.response?.data;
      return {
        success: false,
        error: errorData?.error || "Registration failed. Please try again."
      };
    }
  },

  async me() {
    try {
      const { data } = await apiClient.get("/auth/me");
      return data;
    } catch (error) {
      return null;
    }
  },

  async logout() {
    try {
      await apiClient.post("/auth/logout");
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  },

  async sendVerificationCode(email) {
    try {
      const { data } = await apiClient.post("/auth/send-verification-code", { email });
      return { success: true, data };
    } catch (error) {
      const errorData = error?.response?.data;
      return {
        success: false,
        error: errorData?.error || "Failed to send verification code"
      };
    }
  },

  async verifyEmail(email, code) {
    try {
      const { data } = await apiClient.post("/auth/verify-email", { email, code });
      return { success: true, data };
    } catch (error) {
      const errorData = error?.response?.data;
      return {
        success: false,
        error: errorData?.error || "Email verification failed"
      };
    }
  },

  async forgotPassword(email) {
    try {
      const { data } = await apiClient.post("/auth/forgot-password", { email });
      return { success: true, data };
    } catch (error) {
      const errorData = error?.response?.data;
      return {
        success: false,
        error: errorData?.error || "Failed to send reset email"
      };
    }
  },

  async verifyResetToken(token, email) {
    try {
      const { data } = await apiClient.post("/auth/verify-reset-token", { token, email });
      return { success: true, data };
    } catch (error) {
      const errorData = error?.response?.data;
      return {
        success: false,
        error: errorData?.error || "Invalid or expired reset token"
      };
    }
  },

  async resetPassword(token, email, newPassword, confirmPassword) {
    try {
      const { data } = await apiClient.post("/auth/reset-password", { 
        token, email, newPassword, confirmPassword 
      });
      return { success: true, data };
    } catch (error) {
      const errorData = error?.response?.data;
      return {
        success: false,
        error: errorData?.error || "Failed to reset password"
      };
    }
  }
};


