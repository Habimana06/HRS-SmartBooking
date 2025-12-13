import apiClient from "./apiClient.js";

export const roomService = {
  async getRooms(checkIn, checkOut, guests, roomType) {
    const params = {};
    if (checkIn) params.checkIn = checkIn;
    if (checkOut) params.checkOut = checkOut;
    if (guests) params.guests = guests;
    if (roomType) params.roomType = roomType;
    
    const { data } = await apiClient.get("/rooms", { params });
    return data;
  },

  async getRoomDetails(id) {
    const { data } = await apiClient.get(`/rooms/${id}`);
    return data;
  },
};
