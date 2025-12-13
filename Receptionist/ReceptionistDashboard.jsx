import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { receptionistService } from "../services/receptionistService.js";
import { formatRWF } from "../utils/currency.js";

export default function ReceptionistDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [todayReservations, setTodayReservations] = useState([]);
  const [checkedInList, setCheckedInList] = useState([]);
  const [checkOutList, setCheckOutList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const defaultNotifications = [
    { id: 1, type: "checkin", message: "3 guests arriving in the next 2 hours", time: "now", urgent: true },
    { id: 2, type: "maintenance", message: "Room 305 maintenance completed", time: "5m ago", urgent: false },
    { id: 3, type: "booking", message: "New booking: Premium Suite", time: "10m ago", urgent: false },
  ];
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDashboard();
    fetchTodayReservations();
    fetchCheckedIn();
    fetchCheckOuts();
    
    // Listen for booking updates (checkout, check-in, etc.)
    const handleBookingUpdate = () => {
      fetchDashboard();
      fetchTodayReservations();
      fetchCheckedIn();
      fetchCheckOuts();
    };
    
    window.addEventListener('bookingUpdated', handleBookingUpdate);
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      fetchDashboard();
      fetchCheckedIn();
      fetchCheckOuts();
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('bookingUpdated', handleBookingUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await receptionistService.getDashboard();
      console.log("Fetched receptionist dashboard data:", data); // Debug log
      setDashboard(data);
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : defaultNotifications);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      console.error("Error details:", error.response?.data || error.message);
      setDashboard({
        totalBookings: 0,
        todayCheckIns: 0,
        todayCheckOuts: 0,
        pendingArrivals: 0,
        urgentIssues: 0,
      });
      setNotifications(defaultNotifications);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayReservations = async () => {
    try {
      const data = await receptionistService.getTodayReservations();
      setTodayReservations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      setTodayReservations([]);
    }
  };

  const fetchCheckedIn = async () => {
    try {
      const data = await receptionistService.getCheckedInBookings();
      setCheckedInList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching checked-in bookings:", error);
      setCheckedInList([]);
    }
  };

  const fetchCheckOuts = async () => {
    try {
      const data = await receptionistService.getCheckOutReservations?.();
      setCheckOutList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching check-out reservations:", error);
      setCheckOutList([]);
    }
  };

  const handleQuickSearch = (e) => {
    setSearchQuery(e.target.value);
    // Implement search logic here
  };

  const dismissNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-primary-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Bookings",
      value: dashboard?.totalBookings || 0,
      icon: "📅",
      color: "from-blue-500 to-blue-600",
      change: "",
      trend: "neutral",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Currently Checked-In",
      value: dashboard?.currentlyCheckedIn || 0,
      icon: "🛎️",
      color: "from-teal-500 to-teal-600",
      change: "",
      trend: "neutral",
      bgColor: "bg-teal-50 dark:bg-teal-900/20",
    },
    {
      title: "Today Check-Ins",
      value: dashboard?.todayCheckIns || 0,
      icon: "✅",
      color: "from-emerald-500 to-emerald-600",
      change: "",
      trend: "neutral",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      title: "Today Check-Outs",
      value: dashboard?.todayCheckOuts || 0,
      icon: "🚪",
      color: "from-amber-500 to-amber-600",
      change: "",
      trend: "neutral",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      title: "Pending Arrivals",
      value: dashboard?.pendingArrivals || 0,
      icon: "⏳",
      color: "from-purple-500 to-purple-600",
      change: "",
      trend: "neutral",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "Urgent Issues",
      value: dashboard?.urgentIssues || 0,
      icon: "⚠️",
      color: "from-rose-500 to-rose-600",
      change: "",
      trend: "neutral",
      bgColor: "bg-rose-50 dark:bg-rose-900/20",
    },
  ];

  const occupancyRate = dashboard?.occupancyRate ?? Math.round(((dashboard?.occupiedRooms || 0) / Math.max(dashboard?.totalRooms || 1, 1)) * 100);
  const availableRooms = dashboard?.availableRooms ?? Math.max((dashboard?.totalRooms || 0) - (dashboard?.occupiedRooms || 0) - (dashboard?.maintenanceRooms || 0), 0);
  const maintenanceRooms = dashboard?.maintenanceRooms ?? 0;
  const revenueToday = dashboard?.todayRevenue ?? 0;

  const activityFeed = Array.isArray(dashboard?.recentActivity) && dashboard.recentActivity.length
    ? dashboard.recentActivity.map((activity, index) => ({
        id: activity.id || index + 1,
        type: activity.type || "booking",
        title: activity.title || "Activity",
        time: activity.time || new Date(activity.createdAt || Date.now()).toLocaleString(),
        detail: activity.detail || ""
      }))
    : [];
  const getActivityStyle = (type) => {
    switch (type) {
      case "booking":
        return { bg: "from-emerald-50 to-emerald-50/50 dark:from-emerald-900/10 dark:to-emerald-900/5", border: "border-emerald-100 dark:border-emerald-900/30", icon: "📅" };
      case "checkin":
        return { bg: "from-blue-50 to-blue-50/50 dark:from-blue-900/10 dark:to-blue-900/5", border: "border-blue-100 dark:border-blue-900/30", icon: "✅" };
      case "checkout":
        return { bg: "from-amber-50 to-amber-50/50 dark:from-amber-900/10 dark:to-amber-900/5", border: "border-amber-100 dark:border-amber-900/30", icon: "🚪" };
      case "maintenance":
        return { bg: "from-purple-50 to-purple-50/50 dark:from-purple-900/10 dark:to-purple-900/5", border: "border-purple-100 dark:border-purple-900/30", icon: "🛠️" };
      default:
        return { bg: "from-gray-50 to-gray-50/50 dark:from-gray-800/10 dark:to-gray-800/5", border: "border-gray-200 dark:border-gray-700", icon: "ℹ️" };
    }
  };

  const today = new Date();
  today.setHours(0,0,0,0);
  const todayArrivals = todayReservations.filter((r) => {
    const checkIn = new Date(r.checkInDate);
    checkIn.setHours(0,0,0,0);
    return checkIn.getTime() === today.getTime();
  });

  // Prefer dedicated checkout list; fallback to checked-in list if missing
  const checkOutSource = Array.isArray(checkOutList) && checkOutList.length > 0 ? checkOutList : checkedInList;

  const todayDepartures = checkOutSource.filter((r) => {
    const checkOut = new Date(r.checkOutDate);
    checkOut.setHours(0,0,0,0);
    return checkOut.getTime() === today.getTime();
  });

  // Backward-compatible aliases for existing render sections
  const upcomingCheckIns = todayArrivals;
  const upcomingCheckOuts = todayDepartures;
  const currentlyCheckedIn = checkedInList;

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Receptionist Hub</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live · {currentTime}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search guests, rooms..."
                  value={searchQuery}
                  onChange={handleQuickSearch}
                  className="w-64 pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white placeholder-gray-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div key={notif.id} className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${notif.urgent ? 'bg-rose-50 dark:bg-rose-900/10' : ''}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.message}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.time}</p>
                            </div>
                            <button
                              onClick={() => dismissNotification(notif.id)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Stats Grid with Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
              <div className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 ${stat.bgColor} rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    {stat.icon}
                  </div>
                  {stat.trend === "up" && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      {stat.change}
                    </span>
                  )}
                  {stat.trend === "down" && (
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30 px-3 py-1.5 rounded-full">
                      {stat.change}
                    </span>
                  )}
                  {stat.trend === "neutral" && (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full">
                      {stat.change}
                    </span>
                  )}
                </div>
                <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold uppercase tracking-wide">
                  {stat.title}
                </h3>
                <p className="text-4xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Tabs */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
          <div className="flex gap-2">
            {["overview", "check-ins", "check-outs"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`flex-1 px-6 py-3 font-semibold rounded-xl transition-all duration-300 ${
                  selectedTab === tab
                    ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {selectedTab === "overview" && (
              <>
                {/* Quick Actions with Enhanced Design */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Most used</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                      to="/receptionist/check-in"
                      className="group relative p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 transform hover:scale-105 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <div className="relative flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
                          ✅
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg mb-1">Check-In Guest</h3>
                          <p className="text-sm text-emerald-100">Process new arrivals</p>
                        </div>
                        <svg className="w-6 h-6 text-white opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                    <Link
                      to="/receptionist/check-out"
                      className="group relative p-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl hover:shadow-2xl hover:shadow-amber-500/30 transition-all duration-300 transform hover:scale-105 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <div className="relative flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
                          🚪
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg mb-1">Check-Out Guest</h3>
                          <p className="text-sm text-amber-100">Process departures</p>
                        </div>
                        <svg className="w-6 h-6 text-white opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                    <Link
                      to="/receptionist/manage-reservations"
                      className="group relative p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <div className="relative flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
                          📅
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg mb-1">Manage Reservations</h3>
                          <p className="text-sm text-blue-100">View all bookings</p>
                        </div>
                        <svg className="w-6 h-6 text-white opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                    <Link
                      to="/receptionist/room-availability"
                      className="group relative p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <div className="relative flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
                          🛏️
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg mb-1">Room Availability</h3>
                          <p className="text-sm text-purple-100">Check room status</p>
                        </div>
                        <svg className="w-6 h-6 text-white opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Today's Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Today's Activity</h2>
                  <div className="space-y-4">
                    <div className="group flex items-center justify-between p-5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-2xl hover:shadow-md transition-all border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {upcomingCheckIns.length}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-lg">Check-Ins Scheduled</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            Today
                          </p>
                        </div>
                      </div>
                      <Link to="/receptionist/check-in" className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors shadow-md">
                        View All →
                      </Link>
                    </div>
                    <div className="group flex items-center justify-between p-5 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-2xl hover:shadow-md transition-all border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {upcomingCheckOuts.length}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-lg">Check-Outs Scheduled</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                            Today
                          </p>
                        </div>
                      </div>
                      <Link to="/receptionist/check-out" className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors shadow-md">
                        View All →
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedTab === "check-ins" && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Today's Check-Ins</h2>
                  <span className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-bold">
                    {upcomingCheckIns.length} guests
                  </span>
                </div>
                {upcomingCheckIns.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingCheckIns.map((reservation) => (
                      <div key={reservation.bookingId} className="group p-5 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold">
                              {reservation.customer?.firstName?.[0]}{reservation.customer?.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white text-lg">
                                {reservation.customer?.firstName} {reservation.customer?.lastName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Room: {reservation.room?.roomNumber || "TBD"} · Booking #{reservation.bookingId}
                              </p>
                            </div>
                          </div>
                          <Link
                            to={`/receptionist/check-in?bookingId=${reservation.bookingId}`}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                          >
                            Process Check-In
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                      ✅
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">No check-ins scheduled for today</p>
                  </div>
                )}
              </div>
            )}

            {selectedTab === "check-outs" && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Today's Check-Outs</h2>
                  <span className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-bold">
                    {upcomingCheckOuts.length} guests
                  </span>
                </div>
                {upcomingCheckOuts.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingCheckOuts.map((reservation) => (
                      <div key={reservation.bookingId} className="group p-5 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold">
                              {reservation.customer?.firstName?.[0]}{reservation.customer?.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white text-lg">
                                {reservation.customer?.firstName} {reservation.customer?.lastName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Room: {reservation.room?.roomNumber || "N/A"} · Booking #{reservation.bookingId}
                              </p>
                            </div>
                          </div>
                          <Link
                            to={`/receptionist/check-out?bookingId=${reservation.bookingId}`}
                            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                          >
                            Process Check-Out
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                      🚪
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">No check-outs scheduled for today</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Recent Activity
              </h3>
              <div className="space-y-3">
                {activityFeed.map((activity) => {
                  const style = getActivityStyle(activity.type);
                  return (
                    <div
                      key={activity.id || activity.title}
                      className={`group flex items-start gap-3 p-4 bg-gradient-to-r ${style.bg} rounded-xl hover:shadow-md transition-all border ${style.border}`}
                    >
                      <div className="w-8 h-8 bg-white/70 dark:bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 text-base">
                        {style.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{activity.title || activity.action}</p>
                        {activity.detail && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">{activity.detail}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="group p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl hover:shadow-md transition-all border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Occupancy Rate</span>
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{occupancyRate}%</span>
                    {dashboard?.occupancyChange && (
                      <span className="text-sm text-blue-500 dark:text-blue-400 mb-1">↑ {dashboard.occupancyChange}%</span>
                    )}
                  </div>
                  <div className="mt-3 bg-blue-200 dark:bg-blue-900/50 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-1000" style={{width: `${Math.min(occupancyRate, 100)}%`}}></div>
                  </div>
                </div>
                <div className="group p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl hover:shadow-md transition-all border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Available Rooms</span>
                    <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{availableRooms}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">of {dashboard?.totalRooms || "—"} rooms</span>
                  </div>
                </div>
                <div className="group p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl hover:shadow-md transition-all border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Maintenance</span>
                    <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">{maintenanceRooms}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">rooms</span>
                  </div>
                </div>
                <div className="group p-4 bg-gradient-to-r from-rose-50 to-rose-100/50 dark:from-rose-900/20 dark:to-rose-800/10 rounded-xl hover:shadow-md transition-all border border-rose-200 dark:border-rose-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Revenue Today</span>
                    <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-rose-600 dark:text-rose-400">{formatRWF(revenueToday)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Guest Satisfaction</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">4.8/5.0</span>
                  </div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((star) => (
                      <svg key={star} className={`w-5 h-5 ${star <= 4 ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Average Check-in Time</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">3.2 min</span>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full" style={{width: '65%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}