import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { managerService } from '../services/managerService.js';
import { formatRWF } from '../utils/currency.js';

export default function ManagerManageRooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [viewMode, setViewMode] = useState("table");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await managerService.getRooms();
      console.log("Fetched rooms data:", data); // Debug log
      const roomsArray = Array.isArray(data) ? data : [];
      console.log("Processed rooms:", roomsArray.length); // Debug log
      setRooms(roomsArray);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      console.error("Error details:", error.response?.data || error.message);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      await managerService.updateRoom(roomId, { status: newStatus.toLowerCase() });
      setRooms(rooms.map(r => r.id === roomId || r.roomId === roomId ? { ...r, status: newStatus } : r));
    } catch (error) {
      console.error("Error updating room status:", error);
      alert("Failed to update room status");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
      return;
    }
    try {
      await managerService.deleteRoom(roomId);
      await fetchRooms(); // Refresh the list
      if (selectedRoom && (selectedRoom.id === roomId || selectedRoom.roomId === roomId)) {
        setSelectedRoom(null);
      }
      if (editingRoom && (editingRoom.id === roomId || editingRoom.roomId === roomId)) {
        setEditingRoom(null);
      }
      alert("Room deleted successfully");
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Failed to delete room");
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setSelectedRoom(null);
  };

  const filteredRooms = rooms.filter(room => {
    const roomStatus = (room.status || "").toLowerCase();
    const filterStatus = statusFilter === "All Status" ? "" : statusFilter.toLowerCase();
    const matchesStatus = !filterStatus || roomStatus === filterStatus || 
                         (filterStatus === "available" && roomStatus === "available") ||
                         (filterStatus === "occupied" && roomStatus === "occupied") ||
                         (filterStatus === "maintenance" && roomStatus === "maintenance");
    const matchesType = typeFilter === "All Types" || room.type === typeFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
                         (room.id && room.id.toString().includes(searchQuery)) ||
                         (room.roomNumber && room.roomNumber.toString().includes(searchQuery)) ||
                         (room.type && room.type.toLowerCase().includes(searchLower)) ||
                         (room.guestName && room.guestName.toLowerCase().includes(searchLower));
    return matchesStatus && matchesType && matchesSearch;
  });

  const sortedRooms = [...filteredRooms].sort((a, b) => {
    const aId = a.id || a.roomId || 0;
    const bId = b.id || b.roomId || 0;
    if (sortBy === "id") return aId - bId;
    if (sortBy === "price") return (b.price || 0) - (a.price || 0);
    if (sortBy === "floor") return (a.floor || 0) - (b.floor || 0);
    return 0;
  });

  const stats = {
    total: rooms.length,
    available: rooms.filter(r => {
      const status = (r.status || "").toLowerCase();
      return status === "available" || status === "Available";
    }).length,
    occupied: rooms.filter(r => {
      const status = (r.status || "").toLowerCase();
      return status === "occupied" || status === "Occupied";
    }).length,
    maintenance: rooms.filter(r => {
      const status = (r.status || "").toLowerCase();
      return status === "maintenance" || status === "Maintenance";
    }).length,
    revenue: rooms.filter(r => {
      const status = (r.status || "").toLowerCase();
      return status === "occupied" || status === "Occupied";
    }).reduce((sum, r) => sum + (r.price || 0), 0),
    occupancyRate: rooms.length > 0 ? Math.round((rooms.filter(r => {
      const status = (r.status || "").toLowerCase();
      return status === "occupied" || status === "Occupied";
    }).length / rooms.length) * 100) : 0
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Room Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage inventory, availability, and pricing</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => navigate('/manager/add-room')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Add Room
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Rooms", value: stats.total, icon: "🏠", color: "blue" },
            { label: "Available", value: stats.available, icon: "✓", color: "green" },
            { label: "Occupied", value: stats.occupied, icon: "👤", color: "purple" },
            { label: "Maintenance", value: stats.maintenance, icon: "🔧", color: "yellow" },
            { label: "Occupancy Rate", value: `${stats.occupancyRate}%`, icon: "📊", color: "indigo" },
            { label: "Daily Revenue", value: `${(stats.revenue / 1000).toFixed(0)}K`, icon: "💰", color: "emerald" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900 text-${stat.color}-700 dark:text-${stat.color}-300`}>
                  {stat.color}
                </span>
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
                  placeholder="Search by room, type, or guest..."
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
                <option>Available</option>
                <option>Occupied</option>
                <option>Maintenance</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              >
                <option>All Types</option>
                <option>Standard</option>
                <option>Deluxe</option>
                <option>Suite</option>
                <option>Executive</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              >
                <option value="id">Sort by Room #</option>
                <option value="price">Sort by Price</option>
                <option value="floor">Sort by Floor</option>
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
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded ${viewMode === "grid" ? "bg-white dark:bg-gray-800 shadow-sm" : ""} text-gray-700 dark:text-gray-300 transition-all`}
              >
                🎯 Grid
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {sortedRooms.length} of {rooms.length} rooms
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading rooms...</p>
            </div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">No rooms found</p>
            <button onClick={fetchRooms} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Refresh
            </button>
          </div>
        ) : (
          <>
        {/* Table View */}
        {viewMode === "table" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Room</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Type</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Price/Night</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Floor</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Capacity</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Guest/Info</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRooms.map((room) => {
                    const roomId = room.id || room.roomId;
                    const displayNumber = room.roomNumber || roomId;
                    return (
                    <tr key={roomId} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900 dark:text-white">#{displayNumber}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{(room.amenities || []).slice(0, 2).join(", ")}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm font-medium">
                          {room.type || room.roomType}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={room.status}
                          onChange={(e) => handleStatusChange(roomId, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${
                            room.status === "Available"
                              ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200"
                              : room.status === "Occupied"
                              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                              : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200"
                          }`}
                        >
                          <option value="Available">Available</option>
                          <option value="Occupied">Occupied</option>
                          <option value="Maintenance">Maintenance</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{formatRWF(room.price || 0)}</div>
                      </td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{room.floor || "N/A"}</td>
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">👤 {room.capacity || room.maxOccupancy || "N/A"}</td>
                      <td className="py-4 px-4">
                        {room.status === "Occupied" || room.status === "occupied" ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">{room.guestName || room.currentGuest || "N/A"}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Out: {room.checkOut || room.checkOutDate || "N/A"}</div>
                          </div>
                        ) : room.status === "Maintenance" || room.status === "maintenance" ? (
                          <div className="text-sm text-yellow-600 dark:text-yellow-400">{room.issue || room.maintenanceIssue || "Maintenance"}</div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">Ready</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedRoom(room)}
                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors text-sm font-medium"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleEditRoom(room)}
                            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteRoom(roomId)}
                            className="px-3 py-1.5 bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-200 rounded hover:bg-red-100 dark:hover:bg-red-800 transition-colors text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedRooms.map((room) => {
              const roomId = room.id || room.roomId;
              return (
              <div key={roomId} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Room #{roomId}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Floor {room.floor || "N/A"} • {room.type || room.roomType}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    room.status === "Available" || room.status === "available"
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200"
                      : room.status === "Occupied" || room.status === "occupied"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                      : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200"
                  }`}>
                    {room.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Price per night:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatRWF(room.price || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                    <span className="text-gray-900 dark:text-white">👤 {room.capacity || room.maxOccupancy || "N/A"} guests</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Amenities:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(room.amenities || []).map((amenity, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {(room.status === "Occupied" || room.status === "occupied") && (
                  <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3 mb-4">
                    <div className="text-sm font-medium text-blue-900 dark:text-blue-200">{room.guestName || room.currentGuest || "N/A"}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-300">Check-out: {room.checkOut || room.checkOutDate || "N/A"}</div>
                  </div>
                )}

                {(room.status === "Maintenance" || room.status === "maintenance") && (
                  <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-3 mb-4">
                    <div className="text-sm font-medium text-yellow-900 dark:text-yellow-200">⚠️ {room.issue || room.maintenanceIssue || "Maintenance"}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedRoom(room)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleEditRoom(room)}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteRoom(roomId)}
                    className="px-3 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
          </>
        )}

        {/* Room Detail Modal */}
        {selectedRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedRoom(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Room #{selectedRoom.id || selectedRoom.roomId}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{selectedRoom.type || selectedRoom.roomType} Suite</p>
                </div>
                <button onClick={() => setSelectedRoom(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">×</button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedRoom.status === "Available"
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200"
                      : selectedRoom.status === "Occupied"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                      : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200"
                  }`}>
                    {selectedRoom.status}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Price per Night</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{formatRWF(selectedRoom.price || 0)}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Floor</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">Floor {selectedRoom.floor || "N/A"}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Capacity</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">👤 {selectedRoom.capacity || selectedRoom.maxOccupancy || "N/A"} guests</div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Amenities</div>
                <div className="flex flex-wrap gap-2">
                  {(selectedRoom.amenities || []).map((amenity, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {selectedRoom.lastCleaned && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Cleaned</div>
                  <div className="text-gray-900 dark:text-white">{selectedRoom.lastCleaned}</div>
                </div>
              )}

              {(selectedRoom.status === "Occupied" || selectedRoom.status === "occupied") && (
                <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 mb-4">
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">Current Guest</div>
                  <div className="text-lg font-semibold text-blue-900 dark:text-blue-200">{selectedRoom.guestName || selectedRoom.currentGuest || "N/A"}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-300 mt-1">Check-out: {selectedRoom.checkOut || selectedRoom.checkOutDate || "N/A"}</div>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => handleEditRoom(selectedRoom)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Edit Room
                </button>
                <button 
                  onClick={() => handleDeleteRoom(selectedRoom.id || selectedRoom.roomId)}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors font-medium"
                >
                  Delete Room
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Print Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Room Modal */}
        {editingRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setEditingRoom(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Room #{editingRoom.id || editingRoom.roomId}</h2>
                <button onClick={() => setEditingRoom(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">×</button>
              </div>
              <EditRoomForm 
                room={editingRoom} 
                onSave={async (updatedRoom) => {
                  try {
                    await managerService.updateRoom(editingRoom.id || editingRoom.roomId, updatedRoom);
                    await fetchRooms();
                    setEditingRoom(null);
                    alert("Room updated successfully!");
                  } catch (error) {
                    console.error("Error updating room:", error);
                    alert("Failed to update room");
                  }
                }}
                onCancel={() => setEditingRoom(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EditRoomForm({ room, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    roomNumber: room.roomNumber || '',
    floorNumber: room.floor || '',
    status: room.status || 'available',
    currentPrice: room.price || '',
    description: room.description || '',
    imageUrls: room.imageUrls || []
  });
  const [images, setImages] = useState(room.imageUrls || []);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      setUploading(true);
      const urls = await managerService.uploadRoomImages(files);
      setImages(prev => [...prev, ...urls]);
      setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...urls] }));
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setFormData(prev => ({ ...prev, imageUrls: newImages }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.roomNumber.trim()) newErrors.roomNumber = 'Required';
    if (!formData.currentPrice) newErrors.currentPrice = 'Required';
    if (!formData.description.trim()) newErrors.description = 'Required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      roomNumber: formData.roomNumber,
      floorNumber: formData.floorNumber ? parseInt(formData.floorNumber) : null,
      status: formData.status.toLowerCase(),
      currentPrice: parseFloat(formData.currentPrice),
      description: formData.description,
      imageUrls: images
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Room Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.roomNumber}
            onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
            className={`w-full px-4 py-2 rounded-lg border ${errors.roomNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          />
          {errors.roomNumber && <p className="text-red-500 text-sm mt-1">{errors.roomNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Floor
          </label>
          <input
            type="number"
            value={formData.floorNumber}
            onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Price per Night <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.currentPrice}
            onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
            className={`w-full px-4 py-2 rounded-lg border ${errors.currentPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          />
          {errors.currentPrice && <p className="text-red-500 text-sm mt-1">{errors.currentPrice}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className={`w-full px-4 py-2 rounded-lg border ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Images
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mt-4">
            {images.map((url, index) => (
              <div key={index} className="relative">
                <img src={url} alt={`Room ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}