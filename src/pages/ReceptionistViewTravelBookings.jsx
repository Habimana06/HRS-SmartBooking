import { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, Clock, DollarSign, CheckCircle, XCircle, AlertCircle, Phone, Mail, Eye, Edit, Plus, Search, Filter, Map, Mountain, Building2, Palmtree, Camera } from 'lucide-react';
import { receptionistService } from '../services/receptionistService.js';

export default function ReceptionistViewTravelBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All Status");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    fetchTravelBookings();
  }, []);

  const fetchTravelBookings = async () => {
    try {
      setLoading(true);
      const data = await receptionistService.getTravelBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching travel bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = filter === "All Status" || booking.status === filter;
    const matchesCategory = categoryFilter === "All" || booking.category === categoryFilter;
    const matchesSearch = searchQuery === "" || 
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.attraction.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === "Confirmed").length,
    pending: bookings.filter(b => b.status === "Pending").length,
    cancelled: bookings.filter(b => b.status === "Cancelled").length,
    revenue: bookings.filter(b => b.status === "Confirmed").reduce((sum, b) => sum + b.price, 0)
  };

  const getStatusConfig = (status) => {
    const configs = {
      Confirmed: {
        color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
        icon: CheckCircle,
        iconColor: "text-emerald-500"
      },
      Pending: {
        color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
        icon: AlertCircle,
        iconColor: "text-amber-500"
      },
      Cancelled: {
        color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
        icon: XCircle,
        iconColor: "text-red-500"
      }
    };
    return configs[status] || configs.Pending;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Adventure: Mountain,
      Wildlife: Palmtree,
      Culture: Building2,
      Nature: Map
    };
    return icons[category] || MapPin;
  };

  const handleStatusUpdate = (id, newStatus) => {
    setBookings(bookings.map(b => 
      b.id === id ? { ...b, status: newStatus } : b
    ));
    setSelectedBooking(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading travel bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-600" />
              Travel Bookings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage tours and activities for guests</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg">
            <Plus className="w-5 h-5" />
            New Booking
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Confirmed</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cancelled</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.cancelled}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">${stats.revenue}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ID, guest name, or attraction..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option>All Status</option>
                <option>Confirmed</option>
                <option>Pending</option>
                <option>Cancelled</option>
              </select>

              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option>All</option>
                <option>Adventure</option>
                <option>Wildlife</option>
                <option>Culture</option>
                <option>Nature</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings Cards */}
        <div className="grid gap-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">No bookings found</p>
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const statusConfig = getStatusConfig(booking.status);
              const StatusIcon = statusConfig.icon;
              const CategoryIcon = getCategoryIcon(booking.category);
              
              return (
                <div
                  key={booking.id}
                  className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-wrap">
                          <CategoryIcon className="w-5 h-5 text-blue-600" />
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {booking.attraction}
                          </h3>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig.color}`}>
                            {booking.status}
                          </span>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            {booking.category}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Users className="w-4 h-4" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Guest</p>
                            <p className="font-medium text-gray-900 dark:text-white">{booking.guest}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Date & Time</p>
                            <p className="font-medium text-gray-900 dark:text-white">{booking.date}</p>
                            <p className="text-xs">{booking.time}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Duration</p>
                            <p className="font-medium text-gray-900 dark:text-white">{booking.duration}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <DollarSign className="w-4 h-4" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Price</p>
                            <p className="font-medium text-gray-900 dark:text-white">${booking.price}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {booking.participants} participants
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Room {booking.room}
                        </span>
                        <span className="text-gray-500">ID: {booking.id}</span>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="flex-1 lg:flex-initial px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      {booking.status !== "Cancelled" && (
                        <button
                          className="flex-1 lg:flex-initial px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Edit className="w-4 h-4" />
                          Update
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  {(() => {
                    const Icon = getCategoryIcon(selectedBooking.category);
                    return <Icon className="w-8 h-8 text-blue-600" />;
                  })()}
                  {selectedBooking.attraction}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Booking ID: {selectedBooking.id}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${getStatusConfig(selectedBooking.status).color}`}>
                {selectedBooking.status}
              </span>
            </div>

            <div className="space-y-6">
              {/* Guest Information */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Guest Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedBooking.guest}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Room Number</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedBooking.room}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedBooking.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedBooking.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <Calendar className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedBooking.date}</p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <Clock className="w-5 h-5 text-purple-600 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedBooking.time}</p>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                  <Clock className="w-5 h-5 text-emerald-600 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedBooking.duration}</p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <Users className="w-5 h-5 text-amber-600 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Participants</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedBooking.participants}</p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <DollarSign className="w-5 h-5 text-green-600 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Price</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">${selectedBooking.price}</p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <MapPin className="w-5 h-5 text-red-600 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pickup</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedBooking.pickupLocation}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Notes</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {selectedBooking.status === "Pending" && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(selectedBooking.id, "Confirmed")}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Confirm Booking
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedBooking.id, "Cancelled")}
                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Cancel Booking
                    </button>
                  </>
                )}
                {selectedBooking.status === "Confirmed" && (
                  <button
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Booking
                  </button>
                )}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}