import apiClient from "./apiClient.js";
import QRCode from "qrcode";

export const customerService = {
  async getHome() {
    const { data } = await apiClient.get("/customer/home");
    return data;
  },

  async getMyBookings() {
    const { data } = await apiClient.get("/customer/my-bookings");
    return data;
  },

  async cancelBooking(bookingId, payload = {}) {
    const { data } = await apiClient.post(`/customer/cancel-booking/${bookingId}`, payload);
    return data;
  },

  async bookRoom(payload) {
    const { data } = await apiClient.post("/customer/book-room", payload);
    return data;
  },

  async submitFeedback(feedback) {
    const { data } = await apiClient.post("/customer/feedback", feedback);
    return data;
  },

  async createTravelBooking(bookingData) {
    const { data } = await apiClient.post("/customer/travel-booking", bookingData);
    return data;
  },

  async uploadTravelImages(files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    const { data } = await apiClient.post("/manager/travel/upload-images", formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async requestTravelRefund(payload) {
    const { data } = await apiClient.post("/customer/travel/refund", payload);
    return data;
  },

  async updateProfile(payload) {
    const { data } = await apiClient.put("/customer/profile", payload);
    return data;
  },
};
