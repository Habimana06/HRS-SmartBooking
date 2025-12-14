import { useState, useEffect } from "react";
import { Home, Users, Wrench, Sparkles, Search, Filter, Calendar, Clock, Eye, Edit, AlertCircle } from "lucide-react";
import { receptionistService } from "../services/receptionistService.js";
import { formatRWF } from "../utils/currency.js";

export default function ReceptionistRoomAvailability() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const displayPrice = (value) => {
    if (typeof value === "number") return formatRWF(value);
    if (typeof value === "string") {
      const parsed = parseFloat(value.replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed)) return formatRWF(parsed);
      return value;
    }
    return formatRWF(0);
  };

  useEffect(() => {
    fetchRoomAvailability();
    
    // Listen for booking updates (checkout, check-in, etc.) to refresh room availability
    const handleBookingUpdate = () => {
      fetchRoomAvailability();
    };
    
    window.addEventListener('bookingUpdated', handleBookingUpdate);
    
    // Also refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchRoomAvailability();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('bookingUpdated', handleBookingUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchRoomAvailability = async () => {
    try {
      setLoading(true);
      const data = await receptionistService.getRoomAvailability();
      setRooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching room availability:", error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      available: {
        color: "bg-emerald-500",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
        borderColor: "border-emerald-500",
        textColor: "text-emerald-800 dark:text-emerald-200",
        badgeColor: "bg-emerald-100 dark:bg-emerald-900",
        label: "Available",
        icon: Home
      },
      occupied: {
        color: "bg-red-500",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-500",
        textColor: "text-red-800 dark:text-red-200",
        badgeColor: "bg-red-100 dark:bg-red-900",
        label: "Occupied",
        icon: Users
      },
      cleaning: {
        color: "bg-amber-500",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        borderColor: "border-amber-500",
        textColor: "text-amber-800 dark:text-amber-200",
        badgeColor: "bg-amber-100 dark:bg-amber-900",
        label: "Cleaning",
        icon: Sparkles
      },
      maintenance: {
        color: "bg-orange-500",
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        borderColor: "border-orange-500",
        textColor: "text-orange-800 dark:text-orange-200",
        badgeColor: "bg-orange-100 dark:bg-orange-900",
        label: "Maintenance",
        icon: Wrench
      }
    };
    return configs[status] || configs.available;
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesFilter = filter === "all" || 
      (filter === "available" && room.status === "available") ||
      (filter === "occupied" && room.status === "occupied") ||
      (filter === "maintenance" && (room.status === "maintenance" || room.status === "cleaning"));
    
    const matchesSearch = searchQuery === "" || 
      room.id.toString().includes(searchQuery) ||
      room.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.guest && room.guest.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const groupedRooms = filteredRooms.reduce((acc, room) => {
    if (!acc[room.floor]) acc[room.floor] = [];
    acc[room.floor].push(room);
    return acc;
  }, {});

  const stats = {
    total: rooms.length,
    available: rooms.filter(r => r.status === "available").length,
    occupied: rooms.filter(r => r.status === "occupied").length,
    cleaning: rooms.filter(r => r.status === "cleaning").length,
    maintenance: rooms.filter(r => r.status === "maintenance").length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading room availability...</p>
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Room Availability
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time status of all hotel rooms
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <Home className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.available}</p>
              </div>
              <Home className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Occupied</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.occupied}</p>
              </div>
              <Users className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cleaning</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.cleaning}</p>
              </div>
              <Sparkles className="w-8 h-8 text-amber-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Maintenance</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.maintenance}</p>
              </div>
              <Wrench className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by room number, type, or guest..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {["all", "available", "occupied", "maintenance"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === f
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rooms Display */}
        {Object.keys(groupedRooms).length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">No rooms found matching your criteria</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedRooms).sort().map((floor) => (
              <div key={floor} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Home className="w-6 h-6" />
                  Floor {floor}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                    ({groupedRooms[floor].length} rooms)
                  </span>
                </h3>
                
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                  : "space-y-3"
                }>
                  {groupedRooms[floor].map((room) => {
                    const config = getStatusConfig(room.status);
                    const StatusIcon = config.icon;
                    
                    return viewMode === "grid" ? (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-105 hover:shadow-lg ${config.borderColor} ${config.bgColor}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-lg text-gray-900 dark:text-white">
                            {room.id}
                          </span>
                          <div className={`w-3 h-3 ${config.color} rounded-full animate-pulse`}></div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {room.type}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Users className="w-3 h-3" />
                            <span>{room.capacity} guests</span>
                          </div>
                          
                          <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${config.badgeColor} ${config.textColor}`}>
                            {config.label}
                          </span>
                          
                          {room.guest && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              Guest: {room.guest}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 ${config.color} rounded-full`}></div>
                              <span className="font-bold text-gray-900 dark:text-white">Room {room.id}</span>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{room.type}</span>
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${config.badgeColor} ${config.textColor}`}>
                              {config.label}
                            </span>
                            {room.guest && (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Guest: {room.guest}
                              </span>
                            )}
                          </div>
                          <Eye className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Room Details Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedRoom(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Room {selectedRoom.id}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedRoom.type} • Floor {selectedRoom.floor}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${getStatusConfig(selectedRoom.status).badgeColor} ${getStatusConfig(selectedRoom.status).textColor}`}>
                {getStatusConfig(selectedRoom.status).label}
              </span>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Capacity</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {selectedRoom.capacity} guests
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Price per night</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {displayPrice(selectedRoom.price)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRoom.amenities.map((amenity) => (
                    <span key={amenity} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {selectedRoom.guest && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Guest Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Name:</span> {selectedRoom.guest}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Check-in:</span> {selectedRoom.checkIn}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Check-out:</span> {selectedRoom.checkOut}
                    </p>
                  </div>
                </div>
              )}

              {selectedRoom.status === "cleaning" && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Estimated ready:</span> {selectedRoom.estimatedReady}
                  </p>
                </div>
              )}

              {selectedRoom.status === "maintenance" && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    <span className="font-medium">Reason:</span> {selectedRoom.maintenanceReason}
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2 mt-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Estimated completion:</span> {selectedRoom.estimatedReady}
                  </p>
                </div>
              )}

              {selectedRoom.lastCleaned && selectedRoom.status === "available" && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                  <p className="text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">Last cleaned:</span> {selectedRoom.lastCleaned}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {selectedRoom.status === "available" && (
                  <button className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                    <Edit className="w-5 h-5" />
                    Assign Guest
                  </button>
                )}
                <button
                  onClick={() => setSelectedRoom(null)}
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