import { useState, useEffect } from "react";
import { Download, Filter, TrendingUp, DollarSign, Users, Briefcase, FileText, Eye, RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { adminService } from "../services/adminService.js";
import { formatRWF } from "../utils/currency.js";

export default function AdminReports() {
  const [filterType, setFilterType] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeChart, setActiveChart] = useState("revenue");
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await adminService.getReports();
      setReports(Array.isArray(data?.reports) ? data.reports : []);
      setRevenueData(Array.isArray(data?.revenueData) ? data.revenueData : []);
      setCategoryData(Array.isArray(data?.categoryData) ? data.categoryData : []);
      setUserGrowthData(Array.isArray(data?.userGrowthData) ? data.userGrowthData : []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports([]);
      setRevenueData([]);
      setCategoryData([]);
      setUserGrowthData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesType = filterType === "all" || report.type === filterType;
    const matchesPeriod = filterPeriod === "all" || report.period === filterPeriod;
    return matchesType && matchesPeriod;
  });

  const handleExportAll = () => {
    try {
      // Create CSV content
      const headers = ["Report Name", "Period", "Amount", "Type", "Status", "Last Generated", "Trend"];
      const rows = reports.map(r => [
        r.name || "",
        r.period || "",
        r.amount?.toString() || "0",
        r.type || "",
        r.status || "",
        r.lastGenerated || "",
        r.trend || ""
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `admin-reports-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting reports:", error);
      alert("Failed to export reports. Please try again.");
    }
  };

  const handleDownloadReport = (report) => {
    try {
      // Create CSV content for single report
      const headers = ["Field", "Value"];
      const rows = [
        ["Report Name", report.name || ""],
        ["Period", report.period || ""],
        ["Amount", report.amount?.toString() || "0"],
        ["Type", report.type || ""],
        ["Status", report.status || ""],
        ["Last Generated", report.lastGenerated || ""],
        ["Trend", report.trend || ""]
      ];

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${(report.name || "report").toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Failed to download report. Please try again.");
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case "Finance": return DollarSign;
      case "Operations": return Briefcase;
      case "Users": return Users;
      default: return FileText;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case "Finance": return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "Operations": return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
      case "Users": return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      default: return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  // Calculate stats from real data
  const monthlyRevenueReport = reports.find(r => r.name === "Monthly Revenue");
  const occupancyReport = reports.find(r => r.name === "Occupancy Summary");
  const totalUsers = categoryData.find(c => c.name === "Users")?.value || 0;
  const revenueTrend = monthlyRevenueReport?.trend || "+0%";
  
  const stats = [
    { label: "Total Reports", value: reports.length, icon: FileText, color: "blue", change: "+3 this month" },
    { label: "Monthly Revenue", value: formatRWF(monthlyRevenueReport?.amount || 0), icon: DollarSign, color: "green", change: revenueTrend + " from last month" },
    { label: "Active Users", value: totalUsers.toLocaleString(), icon: Users, color: "purple", change: "+210 this quarter" },
    { label: "Occupancy Rate", value: `${(occupancyReport?.amount || 0).toFixed(0)}%`, icon: TrendingUp, color: "yellow", change: "+5.2% this month" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive insights and data exports</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleExportAll}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export All</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${
                    stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                    stat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
                    'bg-yellow-100 dark:bg-yellow-900/30'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                      stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      stat.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                      'text-yellow-600 dark:text-yellow-400'
                    }`} />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.change}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Analytics Overview</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveChart("revenue")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeChart === "revenue"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveChart("category")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeChart === "category"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setActiveChart("users")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeChart === "users"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Users
              </button>
            </div>
          </div>

          <div className="h-80">
            {activeChart === "revenue" && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => formatRWF(value)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeChart === "category" && (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            )}

            {activeChart === "users" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="week" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="users" fill="#8B5CF6" name="New Users" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter Reports</span>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Types</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Users">Users</option>
              </select>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Periods</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="This Quarter">This Quarter</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReports.map((report) => {
            const Icon = getTypeIcon(report.type);
            const isPositive = report.trend.startsWith("+");
            return (
              <div key={report.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${report.type === 'Finance' ? 'bg-blue-100 dark:bg-blue-900/30' : report.type === 'Operations' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                      <Icon className={`w-5 h-5 ${report.type === 'Finance' ? 'text-blue-600 dark:text-blue-400' : report.type === 'Operations' ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'}`} />
                    </div>
                    <div className="flex-1">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border mb-2 ${getTypeColor(report.type)}`}>
                        {report.type}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{report.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{report.period}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {report.type === "Finance" ? formatRWF(report.amount) : `${report.amount}${report.unit || ''}`}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {report.trend}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setShowPreview(true);
                      }}
                      className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDownloadReport(report)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className={`w-2 h-2 rounded-full ${report.status === 'Ready' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {report.status} • Last generated: {report.lastGenerated}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredReports.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No reports found matching your filters</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowPreview(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Report Preview</h3>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <RefreshCw className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Report Name</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedReport.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedReport.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Period</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedReport.period}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Value</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">
                    {selectedReport.type === "Finance" ? formatRWF(selectedReport.amount) : `${selectedReport.amount}${selectedReport.unit || ''}`}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This is a preview of the {selectedReport.name} report. The full report includes detailed breakdowns, charts, and analytics for the {selectedReport.period.toLowerCase()} period.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleExportAll}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Full Report
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors font-medium">
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}