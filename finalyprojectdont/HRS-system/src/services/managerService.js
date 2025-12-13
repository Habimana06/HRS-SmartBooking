import apiClient from "./apiClient.js";

export const managerService = {
  async getDashboard(timeRange = "today") {
    const { data } = await apiClient.get(`/manager/dashboard?timeRange=${timeRange}`);
    return data;
  },

  async getRooms() {
    try {
      const response = await apiClient.get("/manager/rooms");
      console.log("Full API response:", response);
      console.log("Response data:", response.data);
      console.log("Response data type:", typeof response.data);
      console.log("Is array?", Array.isArray(response.data));
      
      const data = response.data;
      
      // Handle both array and object responses
      let roomsArray = Array.isArray(data) ? data : (data?.data || data?.rooms || []);
      
      console.log("Processed roomsArray:", roomsArray);
      console.log("RoomsArray length:", roomsArray?.length);
      
      if (!Array.isArray(roomsArray) || roomsArray.length === 0) {
        console.warn("No rooms data received or empty array");
        console.warn("Data received:", data);
        return [];
      }
      
      // Log first room to see structure
      if (roomsArray.length > 0) {
        console.log("First room object:", roomsArray[0]);
        console.log("First room keys:", Object.keys(roomsArray[0]));
      }
      
      // Transform backend data to frontend format
      // Backend now returns camelCase, but we'll handle both for compatibility
      const transformed = roomsArray.map((room, index) => {
        // Prioritize camelCase (new format), fallback to PascalCase (old format)
        const roomId = room.roomId || room.RoomId || room.id || room._id;
        const roomNumber = room.roomNumber || room.RoomNumber || room.room_number || 0;
        const roomType = room.roomType || room.RoomType;
        const status = (room.status || room.Status || "available").toLowerCase();
        
        // Parse amenities if it's a string
        let amenities = [];
        if (roomType?.amenities) {
          if (typeof roomType.amenities === 'string') {
            // Handle JSON array string like "[\"WiFi\", \"TV\", \"AC\"]"
            try {
              amenities = JSON.parse(roomType.amenities);
            } catch {
              // If not JSON, treat as comma-separated
              amenities = roomType.amenities.split(',').map(a => a.trim().replace(/^["']|["']$/g, ''));
            }
          } else if (Array.isArray(roomType.amenities)) {
            amenities = roomType.amenities;
          }
        } else if (roomType?.Amenities) {
          if (typeof roomType.Amenities === 'string') {
            try {
              amenities = JSON.parse(roomType.Amenities);
            } catch {
              amenities = roomType.Amenities.split(',').map(a => a.trim().replace(/^["']|["']$/g, ''));
            }
          } else if (Array.isArray(roomType.Amenities)) {
            amenities = roomType.Amenities;
          }
        }
        
        const transformedRoom = {
          id: roomId,
          roomId: roomId,
          roomNumber: roomNumber,
          type: roomType?.typeName || roomType?.TypeName || "Standard",
          status: status === "occupied" ? "Occupied" : status === "available" ? "Available" : status === "maintenance" ? "Maintenance" : status.charAt(0).toUpperCase() + status.slice(1),
          price: parseFloat(room.currentPrice || room.CurrentPrice || room.current_price || 0),
          floor: room.floor || room.Floor || room.floor_number || Math.floor(roomNumber / 100),
          capacity: roomType?.maxOccupancy || roomType?.MaxOccupancy || 2,
          amenities: amenities,
          description: room.description || room.Description || "",
          imageUrls: room.imageUrls ? (typeof room.imageUrls === 'string' ? room.imageUrls.split(',').filter(url => url.trim()) : room.imageUrls) :
                    room.ImageUrls ? (typeof room.ImageUrls === 'string' ? room.ImageUrls.split(',').filter(url => url.trim()) : room.ImageUrls) : []
        };
        
        if (index === 0) {
          console.log("Transformed first room:", transformedRoom);
        }
        
        return transformedRoom;
      });
      
      console.log("Total transformed rooms:", transformed.length);
      return transformed;
    } catch (error) {
      console.error("Error in getRooms:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      throw error;
    }
  },

  async getRoom(id) {
    const { data } = await apiClient.get(`/manager/rooms/${id}`);
    return data;
  },

  async createRoom(room) {
    const { data } = await apiClient.post("/manager/rooms", room);
    return data;
  },

  async updateRoom(id, room) {
    const { data } = await apiClient.put(`/manager/rooms/${id}`, room);
    return data;
  },

  async uploadRoomImages(files) {
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    const { data } = await apiClient.post("/manager/rooms/upload-images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data?.urls || [];
  },

  async deleteRoom(id) {
    await apiClient.delete(`/manager/rooms/${id}`);
  },

  async deleteTravelBooking(id) {
    await apiClient.delete(`/manager/travel-bookings/${id}`);
  },

  async deleteBooking(id) {
    await apiClient.delete(`/manager/bookings/${id}`);
  },

  async getBookings() {
    try {
      const { data } = await apiClient.get("/manager/bookings");
      console.log("Raw bookings API response:", data);
      
      // Handle both array and object responses
      let bookingsArray = Array.isArray(data) ? data : (data?.data || data?.bookings || []);
      
      if (!Array.isArray(bookingsArray) || bookingsArray.length === 0) {
        console.warn("No bookings data received or empty array");
        return [];
      }
      
      // Transform backend data to frontend format
      return bookingsArray.map(booking => {
        const bookingId = booking.bookingId || booking.id || booking.BookingId;
        const customer = booking.customer || booking.Customer;
        const room = booking.room || booking.Room;
        const roomType = room?.roomType || room?.RoomType;
        
        // Format dates
        const formatDate = (dateStr) => {
          if (!dateStr) return "";
          const date = new Date(dateStr);
          return date.toISOString().split('T')[0];
        };
        
        return {
          id: `BK-${bookingId}`,
          bookingId: bookingId,
          guest: customer ? `${customer.firstName || customer.FirstName || ''} ${customer.lastName || customer.LastName || ''}`.trim() : 
                 booking.guest || booking.Guest || "Unknown Guest",
          email: customer?.email || customer?.Email || booking.email || booking.Email || "",
          phone: customer?.phoneNumber || customer?.PhoneNumber || booking.phone || booking.Phone || "",
          room: room?.roomNumber?.toString() || room?.RoomNumber?.toString() || booking.roomNumber?.toString() || booking.RoomNumber?.toString() || "N/A",
          roomType: roomType?.typeName || roomType?.TypeName || booking.roomType || booking.RoomType || "Standard",
          checkIn: formatDate(booking.checkInDate || booking.CheckInDate || booking.checkIn || booking.CheckIn),
          checkOut: formatDate(booking.checkOutDate || booking.CheckOutDate || booking.checkOut || booking.CheckOut),
          guests: booking.numberOfGuests || booking.NumberOfGuests || booking.guests || booking.Guests || 1,
          total: parseFloat(booking.totalPrice || booking.TotalPrice || booking.total || booking.Total || 0),
          status: (booking.bookingStatus || booking.BookingStatus || booking.status || booking.Status || "Pending").charAt(0).toUpperCase() + (booking.bookingStatus || booking.BookingStatus || booking.status || booking.Status || "Pending").slice(1).toLowerCase(),
          paymentStatus: (booking.paymentStatus || booking.PaymentStatus || "Pending").charAt(0).toUpperCase() + (booking.paymentStatus || booking.PaymentStatus || "Pending").slice(1).toLowerCase(),
          createdAt: booking.createdAt || booking.CreatedAt || new Date().toISOString()
        };
      });
    } catch (error) {
      console.error("Error in getBookings:", error);
      console.error("Error response:", error.response?.data);
      throw error;
    }
  },

  async getTravelBookings() {
    try {
      const { data } = await apiClient.get("/manager/travel-bookings");
      console.log("Raw travel bookings API response:", data);
      
      let bookingsArray = Array.isArray(data) ? data : (data?.data || data?.bookings || []);
      
      if (!Array.isArray(bookingsArray) || bookingsArray.length === 0) {
        console.warn("No travel bookings data received or empty array");
        return [];
      }
      
      return bookingsArray.map(booking => {
        const bookingId = booking.travelBookingId || booking.id || booking.TravelBookingId;
        const customer = booking.customer || booking.Customer;
        
        return {
          id: `TRV-${bookingId}`,
          travelBookingId: bookingId,
          attraction: booking.attractionName || booking.AttractionName || booking.attraction || "",
          date: booking.travelDate ? new Date(booking.travelDate).toISOString().split('T')[0] : 
                booking.TravelDate ? new Date(booking.TravelDate).toISOString().split('T')[0] : 
                booking.date || "",
          participants: booking.numberOfParticipants || booking.NumberOfParticipants || booking.participants || 1,
          status: (booking.bookingStatus || booking.BookingStatus || booking.status || "Pending").charAt(0).toUpperCase() + 
                 (booking.bookingStatus || booking.BookingStatus || booking.status || "Pending").slice(1).toLowerCase(),
          amount: parseFloat(booking.totalPrice || booking.TotalPrice || booking.amount || 0),
          guide: booking.guideName || booking.GuideName || booking.guide || "TBD",
          location: booking.location || booking.Location || "",
          duration: booking.duration || booking.Duration || "Full Day",
          contact: booking.contact || booking.Contact || "",
          notes: booking.notes || booking.Notes || "",
          guest: customer ? `${customer.firstName || customer.FirstName || ''} ${customer.lastName || customer.LastName || ''}`.trim() : 
                 booking.guest || booking.Guest || "Unknown",
          category: booking.attractionType || booking.AttractionType || booking.category || "Adventure"
        };
      });
    } catch (error) {
      console.error("Error in getTravelBookings:", error);
      console.error("Error response:", error.response?.data);
      throw error;
    }
  },

  async createTravelBooking(booking) {
    const { data } = await apiClient.post("/manager/travel-bookings", booking);
    return data;
  },

  async uploadTravelImages(files) {
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    const { data } = await apiClient.post("/manager/travel/upload-images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data?.urls || [];
  },

  async getAmenities() {
    try {
      const { data } = await apiClient.get("/manager/amenities");
      console.log("Raw amenities API response:", data);
      
      let amenitiesArray = Array.isArray(data) ? data : (data?.data || data?.amenities || []);
      
      if (!Array.isArray(amenitiesArray) || amenitiesArray.length === 0) {
        console.warn("No amenities data received or empty array");
        return [];
      }
      
      return amenitiesArray.map((amenity, index) => ({
        id: amenity.id || amenity.Id || index + 1,
        name: amenity.name || amenity.Name || amenity,
        type: amenity.type || amenity.Type || "Essential",
        status: (amenity.status || amenity.Status || "Active").charAt(0).toUpperCase() + 
               (amenity.status || amenity.Status || "Active").slice(1).toLowerCase(),
        description: amenity.description || amenity.Description || amenity.name || amenity.Name || amenity,
        icon: amenity.icon || amenity.Icon || amenity.name || amenity.Name || amenity
      }));
    } catch (error) {
      console.error("Error in getAmenities:", error);
      console.error("Error response:", error.response?.data);
      return [];
    }
  },

  async createAmenity(amenity) {
    const { data } = await apiClient.post("/manager/amenities", amenity);
    return data;
  },

  async updateAmenity(id, amenity) {
    const { data } = await apiClient.put(`/manager/amenities/${id}`, amenity);
    return data;
  },

  async deleteAmenity(id) {
    await apiClient.delete(`/manager/amenities/${id}`);
  },

  async getRoomTypes() {
    try {
      const { data } = await apiClient.get("/manager/room-types");
      console.log("Raw room types API response:", data);
      
      let roomTypesArray = Array.isArray(data) ? data : (data?.data || data?.roomTypes || []);
      
      if (!Array.isArray(roomTypesArray) || roomTypesArray.length === 0) {
        console.warn("No room types data received or empty array");
        return [];
      }
      
      return roomTypesArray.map(rt => ({
        id: rt.roomTypeId || rt.id || rt.RoomTypeId,
        name: rt.name || rt.Name || rt.typeName || rt.TypeName || "Standard",
        basePrice: parseFloat(rt.basePrice || rt.BasePrice || 0),
        capacity: rt.capacity || rt.Capacity || rt.maxOccupancy || rt.MaxOccupancy || 2,
        size: rt.size || rt.Size || "25m²",
        available: rt.available || rt.Available || 0,
        total: rt.total || rt.Total || 0,
        features: Array.isArray(rt.features) ? rt.features : 
                 Array.isArray(rt.Features) ? rt.Features :
                 (typeof rt.features === 'string' ? rt.features.split(',').map(f => f.trim()) : []) ||
                 (typeof rt.Features === 'string' ? rt.Features.split(',').map(f => f.trim()) : []) || [],
        status: (rt.status || rt.Status || "active").toLowerCase()
      }));
    } catch (error) {
      console.error("Error in getRoomTypes:", error);
      console.error("Error response:", error.response?.data);
      return [];
    }
  },

  async createRoomType(roomType) {
    const { data } = await apiClient.post("/manager/room-types", roomType);
    return data;
  },

  async deleteRoomType(id) {
    await apiClient.delete(`/manager/room-types/${id}`);
  },

  async getStaff() {
    try {
      const { data } = await apiClient.get("/manager/staff");
      console.log("Raw staff API response:", data);
      
      let staffArray = Array.isArray(data) ? data : (data?.data || data?.staff || []);
      
      if (!Array.isArray(staffArray) || staffArray.length === 0) {
        console.warn("No staff data received or empty array");
        return [];
      }
      
      return staffArray.map(staff => ({
        id: staff.userId || staff.id || staff.UserId,
        name: staff.name || staff.Name || `${staff.firstName || staff.FirstName || ''} ${staff.lastName || staff.LastName || ''}`.trim() || "Unknown",
        role: staff.role || staff.Role || "Staff",
        status: (staff.status || staff.Status || "Active").charAt(0).toUpperCase() + 
               (staff.status || staff.Status || "Active").slice(1).toLowerCase(),
        shift: staff.shift || staff.Shift || "Day",
        email: staff.email || staff.Email || "",
        phone: staff.phone || staff.Phone || "",
        joinDate: staff.joinDate || staff.JoinDate || staff.createdAt || staff.CreatedAt || new Date().toISOString().split('T')[0],
        performance: staff.performance || staff.Performance || 90,
        leaves: staff.leaves || staff.Leaves || 0
      }));
    } catch (error) {
      console.error("Error in getStaff:", error);
      console.error("Error response:", error.response?.data);
      return [];
    }
  },

  async getFinancialReports() {
    const { data } = await apiClient.get("/manager/financial-reports");
    // Return data as-is, it should already be in the correct format
    return data || {
      financials: [],
      bookings: [],
      recentTransactions: [],
      monthlyRevenue: []
    };
  },

  async getCustomerFeedback() {
    try {
      const { data } = await apiClient.get("/manager/customer-feedback");
      console.log("Raw customer feedback API response:", data);
      
      let feedbackArray = Array.isArray(data) ? data : (data?.data || data?.feedback || []);
      
      if (!Array.isArray(feedbackArray) || feedbackArray.length === 0) {
        console.warn("No customer feedback data received or empty array");
        return [];
      }
      
      return feedbackArray.map(feedback => ({
        id: feedback.reviewId || feedback.id || feedback.ReviewId,
        name: feedback.name || feedback.Name || "Anonymous",
        rating: parseInt(feedback.rating || feedback.Rating || 5),
        comment: feedback.comment || feedback.Comment || "",
        date: feedback.date || feedback.Date || "Today",
        category: feedback.category || feedback.Category || "Service",
        replied: feedback.replied || feedback.Replied || false,
        helpful: feedback.helpful || feedback.Helpful || 0
      }));
    } catch (error) {
      console.error("Error in getCustomerFeedback:", error);
      console.error("Error response:", error.response?.data);
      return [];
    }
  },

  async deleteStaff(id) {
    await apiClient.delete(`/manager/staff/${id}`);
  },

  async getProfile() {
    const { data } = await apiClient.get("/manager/profile");
    return data;
  },

  async updateProfile(profileData) {
    const { data } = await apiClient.put("/manager/profile", profileData);
    return data;
  },

  async updateBooking(bookingId, bookingData) {
    const { data } = await apiClient.put(`/manager/bookings/${bookingId}`, bookingData);
    return data;
  },
};
