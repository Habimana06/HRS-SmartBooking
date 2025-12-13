import { useState, useEffect } from "react";
import { Search, Filter, Download, Eye, Edit, Trash2, Calendar, DoorOpen, X, Check, Clock, Ban, Mail, Phone, CreditCard, ArrowUpDown } from "lucide-react";
import { managerService } from "../services/managerService.js";
import { formatRWF } from "../utils/currency.js";

export default function EnhancedBookingManager() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [allRooms, setAllRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const loadAllRooms = async () => {
    try {
      setLoadingRooms(true);
      const rooms = await managerService.getRooms();
      setAllRooms(rooms);
    } catch (error) {
      console.error("Error loading rooms:", error);
      alert("Failed to load rooms");
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleEditClick = (booking) => {
    setSelectedBooking(booking);
    setEditMode(true);
    // Find the room ID from allRooms if available, or keep existing
    const existingRoom = allRooms.find(r => r.roomNumber?.toString() === booking.room?.toString());
    setEditFormData({
      roomId: booking.roomId || existingRoom?.roomId || existingRoom?.id || null,
      roomNumber: booking.room,
      roomType: booking.roomType,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      status: booking.status,
      guests: booking.guests,
      total: booking.total
    });
    loadAllRooms(); // Load all rooms when entering edit mode
  };

  const calculateNewTotal = (roomId, checkIn, checkOut) => {
    if (!roomId || !checkIn || !checkOut) return editFormData.total;
    
    const selectedRoom = allRooms.find(r => r.roomId === roomId || r.id === roomId);
    if (!selectedRoom) return editFormData.total;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) return editFormData.total;
    
    return selectedRoom.price * nights;
  };

  const handleSaveBooking = async () => {
    try {
      setSaving(true);
      const bookingId = selectedBooking.bookingId || selectedBooking.id?.replace('BK-', '');
      
      const updateData = {
        roomId: editFormData.roomId || selectedBooking.roomId,
        checkInDate: editFormData.checkIn || selectedBooking.checkIn,
        checkOutDate: editFormData.checkOut || selectedBooking.checkOut,
        bookingStatus: editFormData.status || selectedBooking.status,
        numberOfGuests: editFormData.guests || selectedBooking.guests,
        totalPrice: editFormData.total || selectedBooking.total
      };

      await managerService.updateBooking(bookingId, updateData);
      await fetchBookings();
      setEditMode(false);
      setSelectedBooking(null);
      alert("Booking updated successfully!");
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Failed to update booking: " + (error?.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await managerService.getBookings();
      console.log("Fetched bookings data:", data); // Debug log
      const bookingsArray = Array.isArray(data) ? data : [];
      console.log("Processed bookings:", bookingsArray.length); // Debug log
      setBookings(bookingsArray);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      console.error("Error details:", error.response?.data || error.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredBookings = bookings.filter(b => {
    const matchesStatus = statusFilter === "All Status" || b.status === statusFilter;
    const matchesSearch = b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    
    if (sortConfig.key === 'checkIn') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading bookings...</p>
        </div>
      </div>
    );
  }

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === "Confirmed").length,
    pending: bookings.filter(b => b.status === "Pending").length,
    checkedOut: bookings.filter(b => b.status === "Checked-out").length,
    cancelled: bookings.filter(b => b.status === "Cancelled").length,
    revenue: bookings.filter(b => b.status !== "Cancelled").reduce((sum, b) => sum + b.total, 0)
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "Confirmed": return <Check className="w-4 h-4" />;
      case "Pending": return <Clock className="w-4 h-4" />;
      case "Checked-out": return <Check className="w-4 h-4" />;
      case "Cancelled": return <Ban className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleStatusChange = (bookingId, newStatus) => {
    setBookings(bookings.map(b => 
      b.id === bookingId ? { ...b, status: newStatus } : b
    ));
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      // Find the actual booking ID (could be bookingId or id)
      const booking = bookings.find(b => b.id === bookingId || b.bookingId === bookingId);
      const actualId = booking?.bookingId || booking?.id || bookingId;
      
      await managerService.deleteBooking(actualId);
      await fetchBookings(); // Refresh the list
      setShowDeleteConfirm(null);
      if (selectedBooking?.id === bookingId || selectedBooking?.bookingId === bookingId) {
        setSelectedBooking(null);
      }
      alert("Booking deleted successfully");
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Failed to delete booking. Please try again.");
    }
  };

  const exportToCSV = () => {
    const headers = ['Booking ID', 'Guest', 'Email', 'Phone', 'Room', 'Check-in', 'Check-out', 'Nights', 'Guests', 'Status', 'Total', 'Payment Method'];
    const rows = filteredBookings.map(b => [
      b.id, b.guest, b.email, b.phone, b.room, 
      formatDate(b.checkIn), formatDate(b.checkOut), 
      b.nights, b.guests, b.status, b.total, b.paymentMethod
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Booking Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage all hotel reservations</p>
          </div>
          <button 
            onClick={exportToCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 w-fit transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Bookings</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confirmed</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.confirmed}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Checked Out</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.checkedOut}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatRWF(stats.revenue)}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, guest name, room, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-w-[150px]"
              >
                <option>All Status</option>
                <option>Pending</option>
                <option>Confirmed</option>
                <option>Checked-out</option>
                <option>Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center px-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{sortedBookings.length}</span> of <span className="font-semibold text-gray-900 dark:text-white">{bookings.length}</span> bookings
          </p>
        </div>

        {/* Bookings Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <th 
                    onClick={() => handleSort('id')}
                    className="py-4 px-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Booking ID
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Guest Info</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Room</th>
                  <th 
                    onClick={() => handleSort('checkIn')}
                    className="py-4 px-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Check-in
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Duration</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th 
                    onClick={() => handleSort('total')}
                    className="py-4 px-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Total
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedBookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No bookings found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-900 dark:text-white">{b.id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                            {b.guest.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{b.guest}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {b.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <DoorOpen className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{b.room}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-gray-700 dark:text-gray-300 font-medium">{formatDate(b.checkIn)}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">to {formatDate(b.checkOut)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-gray-700 dark:text-gray-300 font-medium">{b.nights} night{b.nights > 1 ? 's' : ''}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{b.guests} guest{b.guests > 1 ? 's' : ''}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                            b.status === "Confirmed"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : b.status === "Pending"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                              : b.status === "Checked-out"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {getStatusIcon(b.status)}
                          {b.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-gray-900 dark:text-white">{formatRWF(b.total)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(b)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Edit Booking"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(b.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Cancel Booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Booking Details/Edit Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => { setSelectedBooking(null); setEditMode(false); }}>
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editMode ? 'Edit Booking' : 'Booking Details'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">{selectedBooking.id}</p>
                </div>
                <button
                  onClick={() => { setSelectedBooking(null); setEditMode(false); }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Guest Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Guest Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Guest Name</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedBooking.guest}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email Address</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{selectedBooking.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone Number</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedBooking.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Number of Guests</p>
                      {editMode ? (
                        <input
                          type="number"
                          min="1"
                          value={editFormData.guests || selectedBooking.guests}
                          onChange={(e) => setEditFormData({...editFormData, guests: parseInt(e.target.value) || 1})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="font-semibold text-gray-900 dark:text-white">{selectedBooking.guests} guest{selectedBooking.guests > 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    Booking Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Room</p>
                      {editMode ? (
                        <div>
                          {loadingRooms ? (
                            <p className="text-sm text-gray-500">Loading rooms...</p>
                          ) : (
                            <select
                              value={editFormData.roomId || ""}
                              onChange={(e) => {
                                const roomId = parseInt(e.target.value);
                                const selectedRoom = allRooms.find(r => (r.roomId || r.id) === roomId);
                                const newTotal = calculateNewTotal(roomId, editFormData.checkIn, editFormData.checkOut);
                                setEditFormData({
                                  ...editFormData,
                                  roomId: roomId,
                                  roomNumber: selectedRoom?.roomNumber || "",
                                  roomType: selectedRoom?.type || "",
                                  total: newTotal
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Room</option>
                              {allRooms
                                .filter(r => r.status === "Available" || r.status === "available")
                                .map(room => (
                                  <option key={room.roomId || room.id} value={room.roomId || room.id}>
                                    {room.roomNumber} - {room.type} ({formatRWF(room.price)}/night)
                                  </option>
                                ))}
                            </select>
                          )}
                          {editFormData.roomId && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Selected: {editFormData.roomType} - {formatRWF(allRooms.find(r => (r.roomId || r.id) === editFormData.roomId)?.price || 0)}/night
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="font-semibold text-gray-900 dark:text-white">{selectedBooking.room} ({selectedBooking.roomType})</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Nights</p>
                      {editMode ? (
                        <input
                          type="number"
                          readOnly
                          value={(() => {
                            if (!editFormData.checkIn || !editFormData.checkOut) return selectedBooking.nights;
                            const checkIn = new Date(editFormData.checkIn);
                            const checkOut = new Date(editFormData.checkOut);
                            return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                          })()}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <p className="font-semibold text-gray-900 dark:text-white">{selectedBooking.nights}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Check-in Date</p>
                      {editMode ? (
                        <input
                          type="date"
                          value={editFormData.checkIn || ""}
                          onChange={(e) => {
                            const newTotal = calculateNewTotal(editFormData.roomId, e.target.value, editFormData.checkOut);
                            setEditFormData({
                              ...editFormData,
                              checkIn: e.target.value,
                              total: newTotal
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="font-semibold text-gray-900 dark:text-white">{formatDate(selectedBooking.checkIn)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Check-out Date</p>
                      {editMode ? (
                        <input
                          type="date"
                          value={editFormData.checkOut || ""}
                          onChange={(e) => {
                            const newTotal = calculateNewTotal(editFormData.roomId, editFormData.checkIn, e.target.value);
                            setEditFormData({
                              ...editFormData,
                              checkOut: e.target.value,
                              total: newTotal
                            });
                          }}
                          min={editFormData.checkIn || ""}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="font-semibold text-gray-900 dark:text-white">{formatDate(selectedBooking.checkOut)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payment Method</p>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <p className="font-semibold text-gray-900 dark:text-white">{selectedBooking.paymentMethod}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Status</p>
                      {editMode ? (
                        <select
                          value={selectedBooking.status}
                          onChange={(e) => {
                            handleStatusChange(selectedBooking.id, e.target.value);
                            setSelectedBooking({...selectedBooking, status: e.target.value});
                          }}
                          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                          <option>Pending</option>
                          <option>Confirmed</option>
                          <option>Checked-out</option>
                          <option>Cancelled</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                            selectedBooking.status === "Confirmed"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : selectedBooking.status === "Pending"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                              : selectedBooking.status === "Checked-out"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {getStatusIcon(selectedBooking.status)}
                          {selectedBooking.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    Payment Summary
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Rate per night</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatRWF(selectedBooking.total / selectedBooking.nights)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Number of nights</span>
                      <span className="font-semibold text-gray-900 dark:text-white">× {selectedBooking.nights}</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount</span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatRWF(editMode ? editFormData.total : selectedBooking.total)}
                      </span>
                    </div>
                    {editMode && editFormData.total !== selectedBooking.total && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-semibold">Price difference: </span>
                        {editFormData.total > selectedBooking.total ? (
                          <span className="text-red-600 dark:text-red-400">
                            +{formatRWF(editFormData.total - selectedBooking.total)} (upgrade)
                          </span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">
                            {formatRWF(editFormData.total - selectedBooking.total)} (downgrade)
                          </span>
                        )}
                      </div>
                    )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  {editMode ? (
                    <>
                      <button 
                        onClick={handleSaveBooking}
                        disabled={saving}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button 
                        onClick={() => { 
                          setEditMode(false); 
                          setEditFormData({});
                          setSelectedBooking(null); 
                        }}
                        disabled={saving}
                        className="px-6 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 rounded-lg transition-colors font-semibold disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => setEditMode(true)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors font-semibold shadow-sm flex items-center justify-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Booking
                      </button>
                      <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors font-semibold shadow-sm flex items-center justify-center gap-2">
                        <Mail className="w-4 h-4" />
                        Send Email
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(selectedBooking.id)}
                        className="px-6 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg transition-colors font-semibold shadow-sm"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cancel Booking</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to cancel booking <span className="font-semibold text-gray-900 dark:text-white">{showDeleteConfirm}</span>? 
                This will permanently cancel the reservation.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteBooking(showDeleteConfirm)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg transition-colors font-semibold"
                >
                  Yes, Cancel Booking
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2.5 rounded-lg transition-colors font-semibold"
                >
                  Keep Booking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}