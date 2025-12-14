import { useState, useEffect } from "react";
import { receptionistService } from "../services/receptionistService.js";

export default function ReceptionistManageReservations() {
  const [reservations, setReservations] = useState([]);
  const [travelBookings, setTravelBookings] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("room"); // room, travel, refund
  const [filter, setFilter] = useState("all"); // all, today, upcoming, past
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("checkInDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedReservations, setSelectedReservations] = useState(new Set());
  const [showDetails, setShowDetails] = useState(null);
  const [stats, setStats] = useState({ total: 0, today: 0, upcoming: 0, checkedIn: 0 });

  useEffect(() => {
    fetchReservations();
    fetchTravelBookings();
    fetchRefundRequests();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [reservations]);

  const calculateStats = () => {
    const today = new Date().toDateString();
    const normalizeStatus = (r) => (r.bookingStatus || r.status || "").toLowerCase();
    setStats({
      total: reservations.length,
      today: reservations.filter(r => new Date(r.checkInDate).toDateString() === today).length,
      upcoming: reservations.filter(r => new Date(r.checkInDate) > new Date()).length,
      checkedIn: reservations.filter(r => normalizeStatus(r) === "checked-in").length
    });
  };

  const fetchReservations = async () => {
    try {
      const data = await receptionistService.getReservations();
      // Filter out cancelled bookings - they should go to refund tab
      const activeReservations = Array.isArray(data) 
        ? data.filter(r => {
            const status = (r.bookingStatus || r.status || "").toLowerCase();
            return status !== "cancelled" && !r.refundRequested;
          })
        : [];
      setReservations(activeReservations);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTravelBookings = async () => {
    try {
      const data = await receptionistService.getTravelBookings();
      // Filter out cancelled travel bookings
      const activeTravel = Array.isArray(data)
        ? data.filter(t => {
            const status = (t.status || "").toLowerCase();
            return status !== "cancelled" && !t.refundRequested;
          })
        : [];
      setTravelBookings(activeTravel);
    } catch (error) {
      console.error("Error fetching travel bookings:", error);
      setTravelBookings([]);
    }
  };

  const fetchRefundRequests = async () => {
    try {
      const data = await receptionistService.getCustomerRequests();
      setRefundRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching refund requests:", error);
      setRefundRequests([]);
    }
  };

  const filteredReservations = reservations.filter((res) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const bookingId = res.bookingId || res.travelBookingId || res.id;
      const customerName = `${res.customer?.firstName || ''} ${res.customer?.lastName || ''}`.toLowerCase();
      const email = (res.customer?.email || '').toLowerCase();
      const roomOrAttraction = res.type === "travel" 
        ? (res.attractionName || '').toLowerCase()
        : (res.room?.roomNumber?.toString() || '').toLowerCase();
      
      if (
        !customerName.includes(query) &&
        !bookingId?.toString().includes(query) &&
        !email.includes(query) &&
        !roomOrAttraction.includes(query)
      ) {
        return false;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = res.type === "travel" 
      ? new Date(res.travelDate || res.createdAt)
      : new Date(res.checkInDate || res.createdAt);
    checkIn.setHours(0, 0, 0, 0);

    if (filter === "today") {
      return checkIn.getTime() === today.getTime();
    } else if (filter === "upcoming") {
      return checkIn > today;
    } else if (filter === "past") {
      return checkIn < today;
    }
    return true;
  }).sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === "customer") {
      aVal = `${a.customer?.firstName} ${a.customer?.lastName}`;
      bVal = `${b.customer?.firstName} ${b.customer?.lastName}`;
    } else if (sortField === "checkInDate") {
      aVal = a.type === "travel" ? (a.travelDate || a.createdAt) : (a.checkInDate || a.createdAt);
      bVal = b.type === "travel" ? (b.travelDate || b.createdAt) : (b.checkInDate || b.createdAt);
    }
    
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await receptionistService.updateReservationStatus(bookingId, newStatus);
      setReservations(prev => 
        prev.map(r => r.bookingId === bookingId ? { ...r, bookingStatus: newStatus } : r)
      );
      // If cancelled, move to refund tab
      if (newStatus.toLowerCase() === "cancelled") {
        await fetchRefundRequests();
        setActiveTab("refund");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update reservation status");
    }
  };

  const handleApproveRefund = async (id, type) => {
    try {
      await receptionistService.approveRefund(id, type);
      await fetchRefundRequests();
      await fetchReservations();
      await fetchTravelBookings();
      alert("Refund approved successfully!");
    } catch (error) {
      console.error("Error approving refund:", error);
      alert("Failed to approve refund. Please try again.");
    }
  };

  const handleDeclineRefund = async (id, type, reason) => {
    if (!reason || reason.trim() === '') {
      alert("Please provide a reason for declining the refund.");
      return;
    }
    try {
      await receptionistService.declineRefund(id, type, reason);
      await fetchRefundRequests();
      await fetchReservations();
      await fetchTravelBookings();
      alert("Refund declined.");
    } catch (error) {
      console.error("Error declining refund:", error);
      alert("Failed to decline refund. Please try again.");
    }
  };

  const handleCheckIn = async (reservation) => {
    if (!window.confirm(`Check in guest ${reservation.customer?.firstName} ${reservation.customer?.lastName} for booking #${reservation.bookingId}?`)) {
      return;
    }
    
    try {
      // Check if booking already has a room assigned
      const roomNumber = reservation.room?.roomNumber || prompt("Enter room number:");
      if (!roomNumber) {
        alert("Room number is required for check-in");
        return;
      }

      await receptionistService.checkIn(reservation.bookingId, {
        roomNumber: roomNumber.toString(),
        paymentMethod: "card",
        notes: ""
      });
      
      alert("Check-in successful! Guest has been checked in.");
      // Refresh reservations
      await fetchReservations();
    } catch (error) {
      console.error("Error checking in:", error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          (error.response?.status === 404 ? "Booking not found. Please refresh the page." : 
                           error.response?.status === 500 ? "Server error occurred. Please try again." :
                           "Failed to check in guest. Please try again.");
      alert(errorMessage);
    }
  };

  const handleCheckOut = async (reservation, isAutoCheckout = false) => {
    if (!isAutoCheckout && !window.confirm(`Check out guest ${reservation.customer?.firstName} ${reservation.customer?.lastName} from room ${reservation.room?.roomNumber || "N/A"}? The room will be made available.`)) {
      return;
    }
    
    try {
      await receptionistService.checkOut(reservation.bookingId, {
        action: "checkout",
        paymentMethod: "card",
        notes: isAutoCheckout ? "Automatic checkout - checkout date has passed" : ""
      });
      
      if (!isAutoCheckout) {
        alert("Check-out successful! Room is now available.");
      }
      
      // Dispatch custom event to notify other pages to refresh
      window.dispatchEvent(new CustomEvent('bookingUpdated', { 
        detail: { type: 'checkout', bookingId: reservation.bookingId } 
      }));
      
      // Refresh reservations to update room availability
      await fetchReservations();
    } catch (error) {
      console.error("Error checking out:", error);
      console.error("Error details:", error.response?.data);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          (error.response?.status === 404 ? "Booking not found. Please refresh the page." :
                           error.response?.status === 500 ? "Server error occurred. Please try again." :
                           "Failed to check out guest. Please try again.");
      alert(errorMessage);
    }
  };

  // Check if a booking is overdue (checkout date has passed)
  const isOverdue = (reservation) => {
    if (reservation.type === "travel" || !reservation.checkOutDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkOut = new Date(reservation.checkOutDate);
    checkOut.setHours(0, 0, 0, 0);
    return checkOut < today;
  };

  // Check if booking is checked in (case-insensitive)
  const isCheckedIn = (reservation) => {
    const status = (reservation.bookingStatus || reservation.status || "").toLowerCase();
    return status === "checked-in" || status === "checked in";
  };

  // Check if booking checkout date has passed but wasn't checked in
  const isOverdueNotCheckedIn = (reservation) => {
    if (reservation.type === "travel" || !reservation.checkOutDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkOut = new Date(reservation.checkOutDate);
    checkOut.setHours(0, 0, 0, 0);
    const status = (reservation.bookingStatus || reservation.status || "").toLowerCase();
    const checkedOut = status === "checked-out" || status === "checked out" || status === "completed" || status === "cancelled";
    return checkOut < today && !isCheckedIn(reservation) && !checkedOut;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleSelectAll = () => {
    if (selectedReservations.size === filteredReservations.length) {
      setSelectedReservations(new Set());
    } else {
      setSelectedReservations(new Set(filteredReservations.map(r => r.bookingId)));
    }
  };

  const toggleSelect = (bookingId) => {
    const newSelected = new Set(selectedReservations);
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId);
    } else {
      newSelected.add(bookingId);
    }
    setSelectedReservations(newSelected);
  };

  const handleBulkAction = (action) => {
    alert(`Bulk ${action} for ${selectedReservations.size} reservations will be implemented with backend integration`);
  };

  const exportToCSV = () => {
    const headers = ["Type", "Booking ID", "Guest Name", "Email", "Room/Attraction", "Check-In/Travel Date", "Check-Out", "Status", "Amount"];
    const rows = filteredReservations.map(r => {
      if (r.type === "travel") {
        return [
          "Travel",
          r.travelBookingId || r.id,
          `${r.customer?.firstName || ''} ${r.customer?.lastName || ''}`.trim(),
          r.customer?.email || '',
          r.attractionName || '',
          new Date(r.travelDate || r.createdAt).toLocaleDateString(),
          'N/A',
          r.bookingStatus || r.status || 'Pending',
          r.totalPrice || 0
        ];
      } else {
        return [
          "Room",
          r.bookingId || r.id,
          `${r.customer?.firstName || ''} ${r.customer?.lastName || ''}`.trim(),
          r.customer?.email || '',
          r.room?.roomNumber || "TBD",
          new Date(r.checkInDate || r.createdAt).toLocaleDateString(),
          new Date(r.checkOutDate || r.createdAt).toLocaleDateString(),
          r.bookingStatus || r.status || 'Pending',
          r.totalPrice || 0
        ];
      }
    });
    
    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservations-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    const statusKey = status || "";
    const colors = {
      "Pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      "Confirmed": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "Checked-In": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "Checked-Out": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      "Completed": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      "Cancelled": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      "Cancellation Pending": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    };
    return colors[statusKey] || colors[statusKey.charAt(0).toUpperCase() + statusKey.slice(1).toLowerCase()] || colors["Pending"];
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === "asc" ? (
      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-secondary-900 dark:to-secondary-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Manage Reservations
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                View and manage all hotel reservations
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="btn-secondary flex items-center gap-2 self-start md:self-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("room")}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === "room"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Room Bookings ({reservations.length})
            </button>
            <button
              onClick={() => setActiveTab("travel")}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === "travel"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Travel Bookings ({travelBookings.length})
            </button>
            <button
              onClick={() => setActiveTab("refund")}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === "refund"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Refund Requests ({refundRequests.length})
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Reservations</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Today's Check-Ins</p>
                <p className="text-3xl font-bold">{stats.today}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">Upcoming</p>
                <p className="text-3xl font-bold">{stats.upcoming}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">Currently Checked-In</p>
                <p className="text-3xl font-bold">{stats.checkedIn}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, booking ID, or email..."
                  className="input-field pl-10"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex gap-2 flex-wrap">
                {["all", "today", "upcoming", "past"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      filter === f
                        ? "bg-primary-500 text-white shadow-lg scale-105"
                        : "bg-gray-200 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-secondary-600"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {selectedReservations.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  {selectedReservations.size} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkAction("confirm")}
                    className="btn-secondary text-xs py-1 px-3"
                  >
                    Bulk Confirm
                  </button>
                  <button
                    onClick={() => handleBulkAction("cancel")}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                  >
                    Bulk Cancel
                  </button>
                  <button
                    onClick={() => setSelectedReservations(new Set())}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reservations Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-secondary-800">
                <tr className="border-b border-gray-200 dark:border-secondary-700">
                  <th className="text-left py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedReservations.size === filteredReservations.length && filteredReservations.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                    />
                  </th>
                  <th 
                    className="text-left py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
                    onClick={() => handleSort("bookingId")}
                  >
                    <div className="flex items-center gap-2">
                      Booking ID
                      <SortIcon field="bookingId" />
                    </div>
                  </th>
                  <th 
                    className="text-left py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
                    onClick={() => handleSort("customer")}
                  >
                    <div className="flex items-center gap-2">
                      Guest
                      <SortIcon field="customer" />
                    </div>
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Type
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Room/Attraction
                  </th>
                  <th 
                    className="text-left py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
                    onClick={() => handleSort("checkInDate")}
                  >
                    <div className="flex items-center gap-2">
                      {activeTab === "refund" ? "Requested Date" : "Check-In/Travel Date"}
                      <SortIcon field="checkInDate" />
                    </div>
                  </th>
                  <th 
                    className="text-left py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
                    onClick={() => handleSort("checkOutDate")}
                  >
                    <div className="flex items-center gap-2">
                      {activeTab === "refund" ? "Refund Amount" : "Check-Out"}
                      <SortIcon field="checkOutDate" />
                    </div>
                  </th>
                  <th 
                    className="text-left py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
                    onClick={() => handleSort("bookingStatus")}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <SortIcon field="bookingStatus" />
                    </div>
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === "room" ? filteredReservations : 
                  activeTab === "travel" ? travelBookings.filter((res) => {
                    if (searchQuery) {
                      const query = searchQuery.toLowerCase();
                      const bookingId = res.travelBookingId || res.id;
                      const customerName = `${res.customer?.firstName || ''} ${res.customer?.lastName || ''}`.toLowerCase();
                      const email = (res.customer?.email || '').toLowerCase();
                      const attraction = (res.attraction || res.attractionName || '').toLowerCase();
                      
                      if (
                        !customerName.includes(query) &&
                        !bookingId?.toString().includes(query) &&
                        !email.includes(query) &&
                        !attraction.includes(query)
                      ) {
                        return false;
                      }
                    }
                    return true;
                  }) :
                  refundRequests.filter((req) => {
                    if (searchQuery) {
                      const query = searchQuery.toLowerCase();
                      const bookingId = req.bookingId || req.travelBookingId || req.id;
                      const customerName = `${req.customer?.firstName || ''} ${req.customer?.lastName || ''}`.toLowerCase();
                      const email = (req.customer?.email || '').toLowerCase();
                      
                      if (
                        !customerName.includes(query) &&
                        !bookingId?.toString().includes(query) &&
                        !email.includes(query)
                      ) {
                        return false;
                      }
                    }
                    return true;
                  })).map((reservation) => {
                  const bookingId = reservation.bookingId || reservation.travelBookingId || reservation.id;
                  const isTravel = activeTab === "travel" || reservation.type === "travel";
                  const isRefund = activeTab === "refund";
                  const overdue = !isRefund && isOverdue(reservation);
                  return (
                    <tr
                      key={bookingId}
                      className={`border-b transition-colors ${
                        overdue
                          ? "border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50/50 dark:hover:bg-red-900/20"
                          : "border-gray-200 dark:border-secondary-700 hover:bg-gray-50 dark:hover:bg-secondary-800"
                      }`}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedReservations.has(bookingId)}
                          onChange={() => toggleSelect(bookingId)}
                          className="w-4 h-4 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          #{bookingId}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                            {reservation.customer?.firstName?.[0]}{reservation.customer?.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {reservation.customer?.firstName} {reservation.customer?.lastName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {reservation.customer?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          isTravel 
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        }`}>
                          {isTravel ? "Travel" : "Room"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-secondary-700 text-gray-900 dark:text-white font-medium">
                          {isTravel ? (reservation.attractionName || reservation.attraction || "N/A") : (reservation.room?.roomNumber || "TBD")}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">
                          {isRefund 
                            ? (reservation.refundRequestedAt ? new Date(reservation.refundRequestedAt).toLocaleDateString() : "N/A")
                            : isTravel 
                            ? new Date(reservation.travelDate || reservation.date || reservation.createdAt).toLocaleDateString()
                            : new Date(reservation.checkInDate || reservation.createdAt).toLocaleDateString()
                          }
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">
                          {isRefund 
                            ? `$${(reservation.amount || 0).toFixed(2)}`
                            : isTravel ? "N/A" : new Date(reservation.checkOutDate || reservation.createdAt).toLocaleDateString()
                          }
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {(() => {
                            if (isRefund) {
                              const status = reservation.status || reservation.refundApproved === true ? "Approved" : reservation.refundApproved === false ? "Declined" : "Pending";
                              return (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                                  {status}
                                </span>
                              );
                            }
                            const isCancellationPending = reservation.refundRequested && reservation.refundApproved == null;
                            const displayStatus = isCancellationPending ? "Cancellation Pending" : (reservation.bookingStatus || reservation.status || "Pending");
                            return (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(displayStatus)}`}>
                                {displayStatus}
                              </span>
                            );
                          })()}
                          {overdue && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200" title="Checkout date has passed">
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowDetails(bookingId)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-lg transition-all"
                            title="View Details"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {isRefund && (reservation.status === "Pending" || reservation.refundApproved == null) && (
                            <>
                              <button
                                onClick={() => {
                                  const id = reservation.bookingId || reservation.travelBookingId || reservation.id;
                                  const type = reservation.type || "room";
                                  handleApproveRefund(id, type);
                                }}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium transition-colors"
                                title="Approve Refund"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt("Please provide a reason for declining the refund:");
                                  if (reason) {
                                    const id = reservation.bookingId || reservation.travelBookingId || reservation.id;
                                    const type = reservation.type || "room";
                                    handleDeclineRefund(id, type, reason);
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg font-medium transition-colors"
                                title="Decline Refund"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {!isTravel && !isRefund && (
                            <>
                              {isCheckedIn(reservation) ? (
                                // Booking is checked in - show checkout button
                                <>
                                  {isOverdue(reservation) ? (
                                    <button
                                      onClick={() => handleCheckOut(reservation, true)}
                                      className="bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded-lg font-medium transition-colors"
                                      title="Checkout date has passed - Click to check out automatically"
                                    >
                                      Auto Check-Out
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleCheckOut(reservation)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded-lg font-medium transition-colors"
                                      title="Check out guest and make room available"
                                    >
                                      Check-Out
                                    </button>
                                  )}
                                </>
                              ) : isOverdueNotCheckedIn(reservation) ? (
                                // Checkout date passed but never checked in - allow direct checkout
                                <button
                                  onClick={() => handleCheckOut(reservation, true)}
                                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs py-2 px-3 rounded-lg font-medium transition-colors"
                                  title="Checkout date has passed - Check out directly to make room available"
                                >
                                  Check-Out (Overdue)
                                </button>
                              ) : (
                                // Normal booking - show check-in button
                                <button
                                  onClick={() => handleCheckIn(reservation)}
                                  className="btn-secondary text-xs py-2 px-3"
                                disabled={(reservation.bookingStatus || reservation.status || "").toLowerCase() === "checked-out" || 
                                         (reservation.bookingStatus || reservation.status || "").toLowerCase() === "completed" ||
                                         (reservation.bookingStatus || reservation.status || "").toLowerCase() === "cancelled" ||
                                         (reservation.bookingStatus || reservation.status || "").toLowerCase().includes("cancellation") ||
                                         (reservation.refundRequested && reservation.refundApproved == null)}
                                >
                                  Check-In
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredReservations.length === 0 && (
              <div className="text-center py-16">
                <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                  No reservations found
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                  Try adjusting your filters or search query
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Details Modal */}
        {showDetails && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Reservation Details
                </h2>
                <button
                  onClick={() => setShowDetails(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {reservations.find(r => r.bookingId === showDetails) && (
                <div className="space-y-4">
                  {(() => {
                    const res = reservations.find(r => r.bookingId === showDetails);
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Booking ID</p>
                            <p className="font-semibold text-gray-900 dark:text-white">#{res.bookingId}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(res.bookingStatus)}`}>
                              {res.bookingStatus}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Guest Name</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {res.customer?.firstName} {res.customer?.lastName}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{res.customer?.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{res.customer?.phone || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Room Number</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{res.room?.roomNumber || "TBD"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Check-In Date</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {new Date(res.checkInDate).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Check-Out Date</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {new Date(res.checkOutDate).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Number of Nights</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {Math.ceil((new Date(res.checkOutDate) - new Date(res.checkInDate)) / (1000 * 60 * 60 * 24))} nights
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Number of Guests</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{res.numberOfGuests || "N/A"}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Special Requests</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {res.specialRequests || "None"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-200 dark:border-secondary-700 pt-4 mt-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
                          <div className="flex flex-wrap gap-3">
                            <a
                              href={`/receptionist/check-in?bookingId=${res.bookingId}`}
                              className="btn-primary flex items-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                              </svg>
                              Check-In
                            </a>
                            <a
                              href={`/receptionist/check-out?bookingId=${res.bookingId}`}
                              className="btn-accent flex items-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              Check-Out
                            </a>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to cancel reservation #${res.bookingId}?`)) {
                                  handleStatusChange(res.bookingId, 'Cancelled');
                                }
                              }}
                              className="btn-secondary flex items-center gap-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancel Reservation
                            </button>
                            <button
                              onClick={() => {
                                const mailto = `mailto:${res.customer?.email}?subject=Your Reservation #${res.bookingId}`;
                                window.location.href = mailto;
                              }}
                              className="btn-secondary flex items-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Email Guest
                            </button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}