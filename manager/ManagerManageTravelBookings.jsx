import { useState, useEffect } from 'react';
import { managerService } from '../services/managerService.js';
import { formatRWF } from '../utils/currency.js';

export default function ManagerManageTravelBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("All Dates");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewMode, setViewMode] = useState("table");

  useEffect(() => {
    fetchTravelBookings();
  }, []);

  const fetchTravelBookings = async () => {
    try {
      setLoading(true);
      const data = await managerService.getTravelBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching travel bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === "Confirmed").length,
    pending: bookings.filter(b => b.status === "Pending").length,
    cancelled: bookings.filter(b => b.status === "Cancelled").length,
    totalRevenue: bookings.filter(b => b.status === "Confirmed").reduce((sum, b) => sum + (b.amount || 0), 0),
    totalParticipants: bookings.filter(b => b.status === "Confirmed").reduce((sum, b) => sum + (b.participants || 0), 0),
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = statusFilter === "All Status" || booking.status === statusFilter;
    const matchesSearch = booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.attraction.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.guide?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      // TODO: Implement status update API call
      // await managerService.updateTravelBookingStatus(bookingId, newStatus);
      setBookings(bookings.map(b => {
        if (b.id === bookingId || b.travelBookingId === bookingId) {
          const updatedAmount = newStatus === "Cancelled" ? 0 : b.amount || b.totalPrice || 80000;
          return { ...b, status: newStatus, amount: updatedAmount };
        }
        return b;
      }));
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Failed to update booking status");
    }
  };

  const handleDeleteTravelBooking = async (bookingId) => {
    const actualId = bookings.find(b => b.id === bookingId || b.travelBookingId === bookingId)?.travelBookingId || bookingId;
    if (!window.confirm("Are you sure you want to delete this travel booking? This action cannot be undone.")) {
      return;
    }
    try {
      await managerService.deleteTravelBooking(actualId);
      await fetchTravelBookings();
      alert("Travel booking deleted successfully");
    } catch (error) {
      console.error("Error deleting travel booking:", error);
      alert("Failed to delete travel booking");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Confirmed": return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200";
      case "Pending": return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200";
      case "Cancelled": return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200";
      default: return "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading travel bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Travel Bookings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage tours, excursions, and travel requests</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => {
                const headers = ['ID', 'Attraction', 'Customer', 'Date', 'Participants', 'Total Price', 'Status', 'Payment Status'];
                const rows = filteredBookings.map(b => [
                  b.travelBookingId || b.id || '',
                  b.attractionName || b.attraction || '',
                  b.customer?.firstName && b.customer?.lastName ? `${b.customer.firstName} ${b.customer.lastName}` : b.customer?.email || '',
                  b.travelDate || b.date || '',
                  b.numberOfParticipants || b.participants || '',
                  b.totalPrice || b.amount || '',
                  b.bookingStatus || b.status || '',
                  b.paymentStatus || ''
                ]);

                const csvContent = [
                  headers.join(','),
                  ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `travel-bookings-${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              📊 Export
            </button>
            <button className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              📄 Print
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              ➕ Create Booking
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Bookings", value: stats.total, icon: "📋", color: "blue" },
            { label: "Confirmed", value: stats.confirmed, icon: "✅", color: "green" },
            { label: "Pending", value: stats.pending, icon: "⏳", color: "yellow" },
            { label: "Cancelled", value: stats.cancelled, icon: "❌", color: "red" },
            { label: "Total Participants", value: stats.totalParticipants, icon: "👥", color: "purple" },
            { label: "Total Revenue", value: `${(stats.totalRevenue / 1000000).toFixed(1)}M`, icon: "💰", color: "emerald" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-3 flex-1 w-full md:w-auto">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by ID, attraction, or guide..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              >
                <option>All Status</option>
                <option>Confirmed</option>
                <option>Pending</option>
                <option>Cancelled</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              >
                <option>All Dates</option>
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
              </select>
            </div>
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded ${viewMode === "table" ? "bg-white dark:bg-gray-800 shadow-sm" : ""} text-gray-700 dark:text-gray-300 transition-all`}
              >
                📋 Table
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1.5 rounded ${viewMode === "cards" ? "bg-white dark:bg-gray-800 shadow-sm" : ""} text-gray-700 dark:text-gray-300 transition-all`}
              >
                🎯 Cards
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </div>

        {/* Table View */}
        {viewMode === "table" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Booking ID</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Attraction</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Date</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Participants</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Guide</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Amount</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900 dark:text-white">{booking.id}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{booking.duration}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">{booking.attraction}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">📍 {booking.location}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-900 dark:text-white">{new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <span>👥</span>
                          <span className="font-semibold">{booking.participants}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300">{booking.guide}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{booking.contact}</div>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${getStatusColor(booking.status)}`}
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Pending">Pending</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{formatRWF(booking.amount)}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedBooking(booking)}
                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors text-sm font-medium"
                          >
                            View
                          </button>
                          <button className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteTravelBooking(booking.id || booking.travelBookingId)}
                            className="px-3 py-1.5 bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-200 rounded hover:bg-red-100 dark:hover:bg-red-800 transition-colors text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cards View */}
        {viewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{booking.attraction}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{booking.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">📍</span>
                    <span className="text-gray-700 dark:text-gray-300">{booking.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">📅</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {new Date(booking.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">⏱️</span>
                    <span className="text-gray-700 dark:text-gray-300">{booking.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">👥</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{booking.participants} participants</span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tour Guide</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.guide}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{booking.contact}</div>
                </div>

                {booking.notes && (
                  <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3 mb-4">
                    <div className="text-xs text-blue-600 dark:text-blue-300">{booking.notes}</div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{formatRWF(booking.amount)}</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedBooking(booking)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteTravelBooking(booking.id || booking.travelBookingId)}
                    className="px-3 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking Detail Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedBooking(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedBooking.attraction}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{selectedBooking.id}</p>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">×</button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{formatRWF(selectedBooking.amount)}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Date</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(selectedBooking.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duration</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{selectedBooking.duration}</div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Location</div>
                <div className="text-gray-900 dark:text-white font-medium">📍 {selectedBooking.location}</div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Participants</div>
                <div className="text-gray-900 dark:text-white font-semibold">👥 {selectedBooking.participants} people</div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 mb-4">
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">Tour Guide Information</div>
                <div className="text-lg font-semibold text-blue-900 dark:text-blue-200">{selectedBooking.guide}</div>
                <div className="text-sm text-blue-600 dark:text-blue-300 mt-1">📞 {selectedBooking.contact}</div>
              </div>

              {selectedBooking.notes && (
                <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4 mb-4">
                  <div className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Notes</div>
                  <div className="text-yellow-900 dark:text-yellow-200">{selectedBooking.notes}</div>
                </div>
              )}

              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Edit Booking
                </button>
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">
                  Print Voucher
                </button>
                <button className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}