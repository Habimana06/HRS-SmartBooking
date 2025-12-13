import apiClient from "./apiClient.js";

export const messageService = {
  async getMessages() {
    const { data } = await apiClient.get("/messages");
    return data;
  },

  async sendMessage(payload) {
    const { data } = await apiClient.post("/messages", payload);
    return data;
  },

  async sendReply(id, payload) {
    const { data } = await apiClient.post(`/messages/${id}/reply`, payload);
    return data;
  }
};

