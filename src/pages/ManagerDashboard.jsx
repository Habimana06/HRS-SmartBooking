import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { managerService } from "../services/managerService.js";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
import { formatRWF } from "../utils/currency.js";

export default function ManagerDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("today");
  const defaultNotifications = [
    { id: 1, type: "booking", title: "New booking received", description: "Room 205 - Deluxe Suite", time: "5 minutes ago", read: false },
    { id: 2, type: "staff", title: "Staff member added", description: "Receptionist - John Doe", time: "1 hour ago", read: false },
    { id: 3, type: "maintenance", title: "Maintenance request", description: "Room 312 - AC repair", time: "2 hours ago", read: true },
  ];
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await managerService.getDashboard(timeRange);
      console.log("Fetched manager dashboard data:", data); // Debug log
      setDashboard(data);
      // Use real notifications from API if available, otherwise use defaults
      const realNotifications = Array.isArray(data?.notifications) && data.notifications.length > 0
        ? data.notifications.map((n, idx) => ({
            id: n.id || idx + 1,
            type: n.type || n.category || 'info',
            title: n.title || n.message || 'Notification',
            description: n.description || n.message || '',
            time: n.time || n.createdAt || n.timestamp || 'Just now',
            read: n.read || false
          }))
        : defaultNotifications;
      setNotifications(realNotifications);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      console.error("Error details:", error.response?.data || error.message);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    // TODO: Call API to mark notifications as read
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    // TODO: Call API to mark specific notification as read
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 dark:border-primary-900 mx-auto"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-500 border-t-transparent absolute top-0 left-1/2 -ml-10"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-6 text-lg font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Rooms",
      value: dashboard?.totalRooms || 0,
      icon: "🛏️",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      subtitle: "All room types",
      trend: "+2 this month",
      trendUp: true,
    },
    {
      title: "Occupied Rooms",
      value: dashboard?.occupiedRooms || 0,
      icon: "🔒",
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800",
      subtitle: `${Math.round(((dashboard?.occupiedRooms || 0) / (dashboard?.totalRooms || 1)) * 100)}% occupancy`,
      trend: "+8% from last week",
      trendUp: true,
    },
    {
      title: "Maintenance",
      value: dashboard?.maintenanceRooms || 0,
      icon: "🔧",
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      subtitle: "Requires attention",
      trend: "-2 resolved today",
      trendUp: false,
    },
    {
      title: "Today Revenue",
      value: formatRWF(dashboard?.todayRevenue || 0),
      icon: "💰",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800",
      subtitle: "From bookings",
      trend: "+15% vs yesterday",
      trendUp: true,
    },
  ];

  const secondaryStats = [
    {
      title: "Monthly Revenue",
      value: formatRWF(dashboard?.monthlyRevenue || 0),
      icon: "📊",
      change: "+12.5%",
      changePositive: true,
    },
    {
      title: "Pending Requests",
      value: dashboard?.pendingRequests || 0,
      icon: "⏳",
      change: "-3",
      changePositive: true,
    },
    {
      title: "Total Staff",
      value: dashboard?.totalStaff || 0,
      icon: "👥",
      change: "+1",
      changePositive: true,
    },
    {
      title: "Avg Rating",
      value: dashboard?.averageRating?.toFixed(1) || "0.0",
      icon: "⭐",
      change: "+0.2",
      changePositive: true,
    },
  ];

  const occupancyRate = dashboard?.totalRooms
    ? Math.round(((dashboard.occupiedRooms || 0) / dashboard.totalRooms) * 100)
    : 0;

  const defaultRevenueData = [
    { month: "Jan", revenue: 45000, bookings: 42 },
    { month: "Feb", revenue: 52000, bookings: 48 },
    { month: "Mar", revenue: 48000, bookings: 45 },
    { month: "Apr", revenue: 61000, bookings: 55 },
    { month: "May", revenue: 55000, bookings: 50 },
    { month: "Jun", revenue: dashboard?.monthlyRevenue || 58000, bookings: 52 },
  ];
  const revenueData = Array.isArray(dashboard?.revenueByMonth) && dashboard.revenueByMonth.length
    ? dashboard.revenueByMonth
    : defaultRevenueData;

  const defaultOccupancyTrendData = [
    { day: "Mon", rate: 65 },
    { day: "Tue", rate: 72 },
    { day: "Wed", rate: 68 },
    { day: "Thu", rate: 85 },
    { day: "Fri", rate: 92 },
    { day: "Sat", rate: 95 },
    { day: "Sun", rate: occupancyRate },
  ];
  const occupancyTrendData = Array.isArray(dashboard?.occupancyTrend) && dashboard.occupancyTrend.length
    ? dashboard.occupancyTrend
    : defaultOccupancyTrendData;

  // Use real activity data from dashboard, with fallback to defaults
  const activityFeed = Array.isArray(dashboard?.recentActivity) && dashboard.recentActivity.length > 0
    ? dashboard.recentActivity.map((activity, idx) => ({
        id: activity.id || idx + 1,
        type: activity.type || activity.category || 'info',
        title: activity.title || activity.message || 'Activity',
        description: activity.description || activity.details || activity.message || '',
        time: activity.time || activity.createdAt || activity.timestamp || 'Just now'
      }))
    : Array.isArray(dashboard?.activities) && dashboard.activities.length > 0
    ? dashboard.activities.map((activity, idx) => ({
        id: activity.id || idx + 1,
        type: activity.type || activity.category || 'info',
        title: activity.title || activity.message || 'Activity',
        description: activity.description || activity.details || activity.message || '',
        time: activity.time || activity.createdAt || activity.timestamp || 'Just now'
      }))
    : [
        { id: 1, type: "booking", title: "No recent activity", description: "Activity feed will appear here", time: "Just now" }
      ];
  const getActivityStyle = (type) => {
    switch (type) {
      case "booking":
        return { bg: "from-green-50 to-transparent dark:from-green-900/10 dark:to-transparent", border: "border-green-200 dark:border-green-800/30", icon: "📅" };
      case "travel":
        return { bg: "from-cyan-50 to-transparent dark:from-cyan-900/10 dark:to-transparent", border: "border-cyan-200 dark:border-cyan-800/30", icon: "✈️" };
      case "payment":
        return { bg: "from-emerald-50 to-transparent dark:from-emerald-900/10 dark:to-transparent", border: "border-emerald-200 dark:border-emerald-800/30", icon: "💳" };
      case "cancel":
        return { bg: "from-red-50 to-transparent dark:from-red-900/10 dark:to-transparent", border: "border-red-200 dark:border-red-800/30", icon: "❌" };
      case "staff":
        return { bg: "from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent", border: "border-blue-200 dark:border-blue-800/30", icon: "👥" };
      case "maintenance":
        return { bg: "from-yellow-50 to-transparent dark:from-yellow-900/10 dark:to-transparent", border: "border-yellow-200 dark:border-yellow-800/30", icon: "🔧" };
      case "review":
        return { bg: "from-purple-50 to-transparent dark:from-purple-900/10 dark:to-transparent", border: "border-purple-200 dark:border-purple-800/30", icon: "⭐" };
      default:
        return { bg: "from-gray-50 to-transparent dark:from-gray-800/10 dark:to-transparent", border: "border-gray-200 dark:border-gray-700", icon: "ℹ️" };
    }
  };

  const roomStatusData = [
    { name: "Available", value: (dashboard?.totalRooms || 0) - (dashboard?.occupiedRooms || 0) - (dashboard?.maintenanceRooms || 0), color: "#10B981" },
    { name: "Occupied", value: dashboard?.occupiedRooms || 0, color: "#EF4444" },
    { name: "Maintenance", value: dashboard?.maintenanceRooms || 0, color: "#F59E0B" },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-primary-600 to-purple-600 dark:from-white dark:via-primary-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Manager Dashboard
                </h1>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 ml-15">
                Real-time overview of hotel operations • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Time Range Selector */}
              <div className="flex gap-2 bg-white dark:bg-secondary-800 p-1.5 rounded-2xl shadow-md border border-gray-200 dark:border-secondary-700">
                {["today", "week", "month"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                      timeRange === range
                        ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg scale-105"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-700"
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-3 bg-white dark:bg-secondary-800 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-secondary-700"
                >
                  <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-secondary-700 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 dark:border-secondary-700 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                      <button onClick={markAllAsRead} className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                        Mark all as read
                      </button>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-secondary-700">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            className={`p-4 hover:bg-gray-50 dark:hover:bg-secondary-700/50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                            onClick={() => !notif.read && markAsRead(notif.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                notif.type === 'booking' ? 'bg-green-100 dark:bg-green-900/30' :
                                notif.type === 'staff' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                notif.type === 'maintenance' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                'bg-gray-100 dark:bg-gray-900/30'
                              }`}>
                                {notif.type === 'booking' ? '📅' : notif.type === 'staff' ? '👤' : notif.type === 'maintenance' ? '🔧' : 'ℹ️'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{notif.title}</p>
                                  {!notif.read && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notif.id);
                                      }}
                                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                      Mark as read
                                    </button>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{notif.description}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{notif.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Primary Key Metrics - Enhanced Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${stat.bgColor} border-2 ${stat.borderColor} backdrop-blur-sm`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity`}></div>
              <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${stat.color} rounded-full -ml-12 -mb-12 opacity-10`}></div>
              
              <div className="relative z-10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center text-2xl shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                    {stat.icon}
                  </div>
                  {stat.trend && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      stat.trendUp ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {stat.trendUp ? '↗' : '↘'} {stat.trend}
                    </div>
                  )}
                </div>
                <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold uppercase tracking-wide">
                  {stat.title}
                </h3>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2 group-hover:scale-105 transition-transform">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-500 font-medium">
                  {stat.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Secondary Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {secondaryStats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-secondary-800 rounded-2xl p-5 shadow-md border border-gray-200 dark:border-secondary-700 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                  stat.changePositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide font-semibold">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Section - Enhanced Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue & Bookings Trend */}
          <div className="lg:col-span-2 bg-white dark:bg-secondary-800 rounded-3xl shadow-xl p-6 border border-gray-200 dark:border-secondary-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Performance Analytics
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Revenue and booking trends over time</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMetric("revenue")}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedMetric === "revenue"
                      ? "bg-primary-500 text-white shadow-md"
                      : "bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setSelectedMetric("bookings")}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedMetric === "bookings"
                      ? "bg-primary-500 text-white shadow-md"
                      : "bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Bookings
                </button>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3366FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3366FF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => selectedMetric === "revenue" ? formatRWF(value, { showSymbol: false }) : value}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value) => selectedMetric === "revenue" ? formatRWF(value) : `${value} bookings`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke={selectedMetric === "revenue" ? "#3366FF" : "#10B981"} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill={selectedMetric === "revenue" ? "url(#colorRevenue)" : "url(#colorBookings)"} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Room Status Distribution */}
          <div className="bg-white dark:bg-secondary-800 rounded-3xl shadow-xl p-6 border border-gray-200 dark:border-secondary-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Room Distribution
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Current status breakdown</p>
            <div className="h-48 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roomStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {roomStatusData.map((status, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: status.color }}></div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{status.name}</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{status.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Occupancy Trend */}
        <div className="bg-white dark:bg-secondary-800 rounded-3xl shadow-xl p-6 border border-gray-200 dark:border-secondary-700 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Weekly Occupancy Trend
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Track daily occupancy rates</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={occupancyTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Line type="monotone" dataKey="rate" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 5, fill: "#8B5CF6" }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Enhanced Quick Actions */}
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-secondary-800 dark:to-secondary-900 rounded-3xl shadow-xl p-6 border border-gray-200 dark:border-secondary-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Quick Actions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Manage your hotel operations</p>
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/manager/add-room"
                className="group relative overflow-hidden p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-green-200 dark:border-green-800"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-500 rounded-full -mr-10 -mt-10 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg group-hover:rotate-12 transition-transform">
                    ➕
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
                    Add Room
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Create new room</p>
                </div>
              </Link>
              <Link
                to="/manager/manage-rooms"
                className="group relative overflow-hidden p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-blue-200 dark:border-blue-800"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500 rounded-full -mr-10 -mt-10 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg group-hover:rotate-12 transition-transform">
                    🛏️
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
                    Manage Rooms
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">View all rooms</p>
                </div>
              </Link>
              <Link
                to="/manager/manage-bookings"
                className="group relative overflow-hidden p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-200 dark:border-purple-800"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500 rounded-full -mr-10 -mt-10 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg group-hover:rotate-12 transition-transform">
                    📅
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
                    Bookings
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Manage reservations</p>
                </div>
              </Link>
              <Link
                to="/manager/staff-management"
                className="group relative overflow-hidden p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-indigo-200 dark:border-indigo-800"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500 rounded-full -mr-10 -mt-10 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg group-hover:rotate-12 transition-transform">
                    👥
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
                    Staff
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Team management</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity & Insights */}
          <div className="bg-white dark:bg-secondary-800 rounded-3xl shadow-xl p-6 border border-gray-200 dark:border-secondary-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Recent Activity
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Latest updates and actions</p>
              </div>
              <button className="text-primary-500 hover:text-primary-600 text-sm font-semibold">View All</button>
            </div>
            <div className="space-y-3">
              {activityFeed.map((activity) => {
                const style = getActivityStyle(activity.type);
                return (
                  <div key={activity.id || activity.title} className={`flex items-start gap-4 p-4 bg-gradient-to-r ${style.bg} rounded-2xl border ${style.border} hover:shadow-md transition-all`}>
                    <div className="w-12 h-12 bg-white/70 dark:bg-white/5 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-md">
                      {style.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white">{activity.title || activity.action}</p>
                      {activity.description && <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Performance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-3xl shadow-xl p-6 border-2 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Customer Satisfaction</h3>
              <span className="text-3xl">⭐</span>
            </div>
            <div className="text-center mb-4">
              <div className="text-6xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-transparent mb-2">
                {dashboard?.averageRating?.toFixed(1) || "4.5"}
              </div>
              <div className="flex justify-center text-yellow-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Based on {dashboard?.newReviewsCount || 0} reviews this month
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/manager/reviews" className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold text-center transition-colors text-sm">
                View Reviews
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-3xl shadow-xl p-6 border-2 border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pending Requests</h3>
              <span className="text-3xl">⏳</span>
            </div>
            <div className="text-center mb-4">
              <div className="text-6xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-3">
                {dashboard?.pendingRequests || 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">
                Booking requests awaiting your approval
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/manager/manage-bookings" className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-center transition-colors text-sm">
                Review Now
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-3xl shadow-xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Staff Activity</h3>
              <span className="text-3xl">👥</span>
            </div>
            <div className="text-center mb-4">
              <div className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent mb-3">
                {dashboard?.totalStaff || 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">
                Active staff members in your team
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/manager/staff-management" className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold text-center transition-colors text-sm">
                Manage Team
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}