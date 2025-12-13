import apiClient from "./apiClient.js";

export const receptionistService = {
  async getDashboard() {
    const { data } = await apiClient.get("/receptionist/dashboard");
    return data;
  },

  async getTodayReservations() {
    const { data } = await apiClient.get("/receptionist/today-reservations");
    return data;
  },

  async getCheckedInBookings() {
    const { data } = await apiClient.get("/receptionist/checked-in-bookings");
    return data;
  },

  async getCheckOutReservations(params = {}) {
    // Get checked-in bookings for check-out
    const { data } = await apiClient.get("/receptionist/checked-in-bookings", { params });
    return data;
  },

  async getReservations() {
    const { data } = await apiClient.get("/receptionist/reservations");
    // Transform backend data to frontend format
    if (Array.isArray(data)) {
      return data.map(reservation => ({
        bookingId: reservation.bookingId || reservation.id || reservation.BookingId,
        id: reservation.bookingId || reservation.id || reservation.BookingId,
        guest: reservation.customer ? `${reservation.customer.firstName || ''} ${reservation.customer.lastName || ''}`.trim() :
               reservation.guest || reservation.Guest || "Unknown",
        room: reservation.room?.roomNumber?.toString() || reservation.roomNumber?.toString() || reservation.room || "N/A",
        roomType: reservation.room?.roomType?.typeName || reservation.roomType || "Standard",
        checkInDate: reservation.checkInDate || reservation.checkIn || reservation.CheckInDate,
        checkOutDate: reservation.checkOutDate || reservation.checkOut || reservation.CheckOutDate,
        status: reservation.bookingStatus || reservation.status || reservation.BookingStatus || "Pending",
        totalPrice: reservation.totalPrice || reservation.total || reservation.TotalPrice || 0,
        customer: reservation.customer || reservation.Customer,
        room: reservation.room || reservation.Room
      }));
    }
    return data || [];
  },

  async getRoomAvailability() {
    const { data } = await apiClient.get("/receptionist/room-availability");
    // Transform backend data to frontend format
    if (Array.isArray(data)) {
      return data.map(room => ({
        id: room.id || room.Id || room.roomId || room.RoomId,
        roomId: room.id || room.Id || room.roomId || room.RoomId,
        type: room.type || room.Type || "Standard",
        status: room.status || room.Status || "available",
        floor: room.floor || room.Floor || Math.floor((room.id || room.Id || 0) / 100),
        capacity: room.capacity || room.Capacity || 2,
        price: room.price || room.Price || room.currentPrice || room.CurrentPrice || 0,
        amenities: room.amenities || room.Amenities || [],
        lastCleaned: room.lastCleaned || room.LastCleaned || "Today 10:00 AM",
        nextCheckout: room.nextCheckout || room.NextCheckout || null,
        guest: room.guest || room.Guest,
        checkIn: room.checkIn || room.CheckIn,
        checkOut: room.checkOut || room.CheckOut
      }));
    }
    return data || [];
  },

  async getCustomerRequests() {
    const { data } = await apiClient.get("/receptionist/customer-requests");
    return data;
  },

  async getPendingApprovals() {
    const { data } = await apiClient.get("/receptionist/pending-approvals");
    return data;
  },

  async checkIn(bookingId, data) {
    const response = await apiClient.post(`/receptionist/check-in/${bookingId}`, data);
    return response.data;
  },

  async checkOut(bookingId, data) {
    const response = await apiClient.post(`/receptionist/check-out/${bookingId}`, data);
    return response.data;
  },

  async approveRefund(id, type = "room") {
    const { data } = await apiClient.post(`/receptionist/refund-requests/${id}/approve?type=${type}`);
    return data;
  },

  async declineRefund(id, type = "room", reason = "") {
    const { data } = await apiClient.post(`/receptionist/refund-requests/${id}/decline?type=${type}`, { reason });
    return data;
  },

  async updateReservationStatus(bookingId, status) {
    const { data } = await apiClient.put(`/receptionist/reservations/${bookingId}/status`, { status });
    return data;
  },

  async getTravelBookings() {
    const { data } = await apiClient.get("/receptionist/travel-bookings");
    // Transform backend data to frontend format
    if (Array.isArray(data)) {
      return data.map(booking => ({
        id: `TRV-${booking.travelBookingId || booking.id || booking.TravelBookingId}`,
        travelBookingId: booking.travelBookingId || booking.id || booking.TravelBookingId,
        guest: booking.customer ? `${booking.customer.firstName || ''} ${booking.customer.lastName || ''}`.trim() :
               booking.guest || booking.Guest || "Unknown",
        room: booking.roomNumber?.toString() || booking.room || "N/A",
        attraction: booking.attractionName || booking.attraction || booking.AttractionName || "",
        date: booking.travelDate ? new Date(booking.travelDate).toISOString().split('T')[0] : booking.date || booking.TravelDate,
        time: booking.time || booking.Time || "9:00 AM",
        duration: booking.duration || booking.Duration || "Full Day",
        participants: booking.numberOfParticipants || booking.participants || booking.NumberOfParticipants || 1,
        price: booking.totalPrice || booking.price || booking.TotalPrice || 0,
        status: booking.bookingStatus || booking.status || booking.BookingStatus || "Pending",
        phone: booking.phone || booking.Phone || booking.customer?.phoneNumber || "",
        email: booking.email || booking.Email || booking.customer?.email || "",
        pickupLocation: booking.pickupLocation || booking.PickupLocation || "Hotel Lobby",
        notes: booking.notes || booking.Notes || "",
        category: booking.attractionType || booking.category || booking.AttractionType || "Adventure"
      }));
    }
    return data || [];
  },
};
