import { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Users, Briefcase, DollarSign, BarChart3, Calendar, Clock, XCircle, AlertCircle, Download, RefreshCw, Search, Filter, ChevronRight, Activity, Eye, Bell, Settings } from "lucide-react";
import { adminService } from "../services/adminService.js";
import { formatRWF } from "../utils/currency.js";
import RequirePermission from "../components/RequirePermission.jsx";

function AdminDashboardContent() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");
  const [refreshing, setRefreshing] = useState(false);
  const [notifications] = useState(3);

  useEffect(() => {
    fetchDashboard();
  }, [timeRange]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboard({ range: timeRange });
      console.log("Fetched admin dashboard data:", data); // Debug log
      setDashboard(data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      console.error("Error details:", error.response?.data || error.message);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="text-lg font-medium text-slate-700">Loading dashboard...</p>
          <p className="text-sm text-slate-500 mt-1">Fetching latest analytics</p>
        </div>
      </div>
    );
  }

  const mainStats = [
    {
      title: "Total Users",
      value: dashboard?.totalUsers || 0,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      change: "+12.5%",
      trend: "up",
      subtext: "vs last month"
    },
    {
      title: "Active Staff",
      value: dashboard?.activeStaff || 0,
      icon: Briefcase,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      change: "+3",
      trend: "up",
      subtext: "new this week"
    },
    {
      title: "Total Revenue",
      value: formatRWF(dashboard?.totalRevenue || 0),
      icon: DollarSign,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      change: "+18.5%",
      trend: "up",
      subtext: "revenue growth"
    },
    {
      title: "Monthly Revenue",
      value: formatRWF(dashboard?.monthlyRevenue || 0),
      icon: BarChart3,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      change: "+15.2%",
      trend: "up",
      subtext: "this month"
    },
  ];

  const actionItems = [
    {
      title: "Pending Bookings",
      value: dashboard?.pendingBookings || 0,
      icon: Clock,
      color: "bg-amber-500",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
      action: "Review Now",
      priority: "medium"
    },
    {
      title: "Failed Transactions",
      value: dashboard?.failedTransactions || 0,
      icon: XCircle,
      color: "bg-red-500",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
      action: "Investigate",
      priority: "high"
    },
    {
      title: "Pending Verifications",
      value: dashboard?.pendingVerifications || 0,
      icon: AlertCircle,
      color: "bg-orange-500",
      textColor: "text-orange-700",
      bgColor: "bg-orange-50",
      action: "Verify",
      priority: "medium"
    },
    {
      title: "Today's Bookings",
      value: dashboard?.todayBookings || 0,
      icon: Calendar,
      color: "bg-green-500",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
      action: "View All",
      priority: "low"
    },
  ];

  const defaultRevenueData = [
    { month: "Jan", revenue: 4200000, bookings: 98 },
    { month: "Feb", revenue: 5100000, bookings: 115 },
    { month: "Mar", revenue: 6800000, bookings: 142 },
    { month: "Apr", revenue: 7200000, bookings: 156 },
    { month: "May", revenue: 8100000, bookings: 178 },
    { month: "Jun", revenue: 8950000, bookings: 189 },
  ];
  const revenueData = Array.isArray(dashboard?.revenueByMonth) && dashboard.revenueByMonth.length
    ? dashboard.revenueByMonth
    : defaultRevenueData;

  const paymentMethodsData = Array.isArray(dashboard?.paymentMethods) && dashboard.paymentMethods.length
    ? dashboard.paymentMethods
    : [
      { name: "Credit Card", value: 45, color: "#3B82F6" },
      { name: "Mobile Money", value: 30, color: "#10B981" },
      { name: "Bank Transfer", value: 18, color: "#F59E0B" },
      { name: "Cash", value: 7, color: "#EF4444" },
    ];

  const roomOccupancy = Array.isArray(dashboard?.roomOccupancy) && dashboard.roomOccupancy.length
    ? dashboard.roomOccupancy
    : [
      { type: "Standard", occupied: 32, total: 45, percentage: 71 },
      { type: "Deluxe", occupied: 18, total: 22, percentage: 82 },
      { type: "Suite", occupied: 12, total: 15, percentage: 80 },
      { type: "Executive", occupied: 8, total: 10, percentage: 80 },
    ];

  const recentActivities = Array.isArray(dashboard?.recentActivities) && dashboard.recentActivities.length
    ? dashboard.recentActivities
    : [
      { action: "New booking received", user: "John Doe", time: "2 min ago", type: "booking" },
      { action: "Payment processed", user: "Jane Smith", time: "5 min ago", type: "payment" },
      { action: "Staff member added", user: "Admin", time: "12 min ago", type: "staff" },
      { action: "Verification completed", user: "Mike Johnson", time: "18 min ago", type: "verify" },
      { action: "Booking cancelled", user: "Sarah Wilson", time: "25 min ago", type: "cancel" },
    ];

  const downloadReport = () => {
    const report = `
ADMIN DASHBOARD REPORT
Generated: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OVERVIEW METRICS
────────────────────────────────────────
Total Users: ${dashboard?.totalUsers || 0}
Active Staff: ${dashboard?.activeStaff || 0}
Total Revenue: ${formatRWF(dashboard?.totalRevenue || 0)}
Monthly Revenue: ${formatRWF(dashboard?.monthlyRevenue || 0)}
Occupancy Rate: ${dashboard?.occupancyRate || 0}%
Customer Satisfaction: ${dashboard?.customerSatisfaction || 0}/5.0

TODAY'S ACTIVITY
────────────────────────────────────────
Bookings Today: ${dashboard?.todayBookings || 0}
Pending Bookings: ${dashboard?.pendingBookings || 0}
Failed Transactions: ${dashboard?.failedTransactions || 0}
Pending Verifications: ${dashboard?.pendingVerifications || 0}

PAYMENT METHODS DISTRIBUTION
────────────────────────────────────────
${paymentMethodsData.map(m => `${m.name}: ${m.value}%`).join('\n')}

ROOM OCCUPANCY
────────────────────────────────────────
${roomOccupancy.map(r => `${r.type}: ${r.occupied}/${r.total} (${r.percentage}%)`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Report generated by Hotel Management System
    `;
    
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm text-slate-600">Welcome back, Administrator</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-slate-600" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {notifications}
                  </span>
                )}
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Time Range Selector */}
        <div className="flex items-center gap-2 mb-6">
          {["day", "week", "month", "year"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                timeRange === range
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mainStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-blue-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                  </div>
                  {stat.trend === "up" ? (
                    <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold">
                      <TrendingUp className="w-4 h-4" />
                      {stat.change}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-semibold">
                      <TrendingDown className="w-4 h-4" />
                      {stat.change}
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium text-slate-600 mb-1">
                  {stat.title}
                </h3>
                <p className="text-3xl font-bold text-slate-900 mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500">{stat.subtext}</p>
              </div>
            );
          })}
        </div>

        {/* Action Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {actionItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`${item.bgColor} rounded-2xl p-6 border-2 border-transparent hover:border-current transition-all cursor-pointer group`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-3xl font-bold ${item.textColor}`}>{item.value}</span>
                </div>
                <h3 className={`text-sm font-medium ${item.textColor} mb-2`}>{item.title}</h3>
                <button className={`text-sm font-semibold ${item.textColor} flex items-center gap-1 group-hover:gap-2 transition-all`}>
                  {item.action}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Trend - Spans 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Revenue & Bookings Trend</h2>
                <p className="text-sm text-slate-600 mt-1">Last 6 months performance</p>
              </div>
              <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Last 6 months</option>
                <option>Last year</option>
                <option>All time</option>
              </select>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" />
                  <YAxis 
                    stroke="#64748B"
                    tickFormatter={(value) => formatRWF(value, { showSymbol: false })}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                    }}
                    formatter={(value, name) => [
                      name === "revenue" ? formatRWF(value) : value,
                      name === "revenue" ? "Revenue" : "Bookings"
                    ]}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    fill="url(#colorRevenue)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bookings" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: "#10B981", r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Payment Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentMethodsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {paymentMethodsData.map((method, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: method.color }}></div>
                    <span className="text-sm font-medium text-slate-700">{method.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{method.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Performance */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Weekly Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { day: "Mon", bookings: 28, revenue: 1250000 },
                  { day: "Tue", bookings: 32, revenue: 1420000 },
                  { day: "Wed", bookings: 35, revenue: 1580000 },
                  { day: "Thu", bookings: 38, revenue: 1690000 },
                  { day: "Fri", bookings: 42, revenue: 1850000 },
                  { day: "Sat", bookings: 48, revenue: 2100000 },
                  { day: "Sun", bookings: 45, revenue: 1980000 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="day" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                    }}
                  />
                  <Legend />
                  <Bar dataKey="bookings" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Room Occupancy */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Room Occupancy</h3>
            <div className="space-y-4">
              {roomOccupancy.map((room, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">{room.type}</span>
                    <span className="text-sm font-bold text-slate-900">
                      {room.occupied}/{room.total} ({room.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${room.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
              <button className="text-sm text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'booking' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'payment' ? 'bg-green-100 text-green-600' :
                    activity.type === 'staff' ? 'bg-purple-100 text-purple-600' :
                    activity.type === 'verify' ? 'bg-orange-100 text-orange-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                    <p className="text-xs text-slate-600">{activity.user}</p>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <RequirePermission 
      permission="admin:dashboard:view" 
      permissionName="Admin Dashboard"
    >
      <AdminDashboardContent />
    </RequirePermission>
  );
}