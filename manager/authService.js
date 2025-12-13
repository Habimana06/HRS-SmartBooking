import apiClient from "./apiClient.js";

export const authService = {
  async login(email, password, code) {
    const { data } = await apiClient.post("/auth/login", { email, password, code });
    return data;
  },

  async register(userData) {
    try {
      const { data } = await apiClient.post("/auth/register", userData);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error?.response?.data?.error || "Registration failed. Please try again."
      };
    }
  },

  async me() {
    const { data } = await apiClient.get("/auth/me");
    return data;
  },

  async logout() {
    await apiClient.post("/auth/logout");
  },

  async sendVerificationCode(email) {
    const { data } = await apiClient.post("/auth/send-verification-code", { email });
    return data;
  },

  async verifyEmail(email, code) {
    const { data } = await apiClient.post("/auth/verify-email", { email, code });
    return data;
  },

  async forgotPassword(email) {
    const { data } = await apiClient.post("/auth/forgot-password", { email });
    return data;
  },

  async verifyResetToken(token, email) {
    const { data } = await apiClient.post("/auth/verify-reset-token", { token, email });
    return data;
  },

  async resetPassword(token, email, newPassword, confirmPassword) {
    const { data } = await apiClient.post("/auth/reset-password", { 
      token, 
      email, 
      newPassword, 
      confirmPassword 
    });
    return data;
  }
};


