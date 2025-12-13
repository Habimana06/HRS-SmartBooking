import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Download, FileText, Clock, CreditCard, Users, AlertCircle } from "lucide-react";
import { managerService } from "../services/managerService.js";
import { formatRWF } from "../utils/currency.js";

export default function ManagerFinancialReports() {
  const [dateRange, setDateRange] = useState("thisMonth");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);

  useEffect(() => {
    fetchFinancialReports();
  }, [dateRange]);

  const fetchFinancialReports = async () => {
    try {
      setLoading(true);
      const data = await managerService.getFinancialReports();
      setFinancials(data?.financials || []);
      setBookings(data?.bookings || []);
      setRecentTransactions(data?.recentTransactions || []);
      setMonthlyRevenue(data?.monthlyRevenue || []);
    } catch (error) {
      console.error("Error fetching financial reports:", error);
      setFinancials([]);
      setBookings([]);
      setRecentTransactions([]);
      setMonthlyRevenue([]);
    } finally {
      setLoading(false);
    }
  };

  const totalBookings = bookings.reduce((acc, i) => acc + (i.value || 0), 0);
  const totalRevenue = financials.reduce((acc, i) => acc + (i.value || 0), 0);

  const getStatusColor = (status) => {
    return status === "Completed" 
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  };

  const exportData = (format) => {
    try {
      setShowExportMenu(false);
      
      if (format === "CSV") {
        // Export financial data as CSV
        const headers = ["Metric", "Value", "Trend"];
        const rows = financials.map(f => [
          f.name || "",
          f.value?.toString() || "0",
          f.trend || ""
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `financial-reports-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === "Excel") {
        // For Excel, we'll create a CSV (can be opened in Excel)
        exportData("CSV");
        alert("CSV file downloaded. You can open it in Excel.");
      } else if (format === "PDF") {
        // For PDF, we'll create a formatted text file
        const pdfContent = `Financial Reports - ${new Date().toLocaleDateString()}\n\n`;
        const reportText = financials.map(f => 
          `${f.name || ""}: ${formatRWF(f.value || 0)} (${f.trend || ""})`
        ).join("\n");

        const blob = new Blob([pdfContent + reportText], { type: "text/plain" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `financial-reports-${new Date().toISOString().split('T')[0]}.txt`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert("Report downloaded as text file. You can convert it to PDF using your system's print to PDF feature.");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading financial reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Financial Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track revenue, payments, and booking analytics
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="today">Today</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
            
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                  <button
                    onClick={() => exportData("CSV")}
                    className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => exportData("Excel")}
                    className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Export as Excel
                  </button>
                  <button
                    onClick={() => exportData("PDF")}
                    className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {financials.map((f) => {
            const Icon = f.icon;
            const isPositive = f.change > 0;
            return (
              <div key={f.name} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}>
                    <Icon className={`w-6 h-6 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
                  </div>
                  {f.change !== 0 && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      isPositive 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {f.trend}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{f.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatRWF(f.value)}</p>
                {f.change === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{f.trend}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Revenue Trend</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Last 6 Months</span>
            </div>
          </div>
          
          <div className="relative h-64">
            <div className="absolute inset-0 flex items-end justify-between gap-2">
              {monthlyRevenue.map((item) => {
                const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));
                const height = (item.revenue / maxRevenue) * 100;
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full relative group">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-300 hover:from-indigo-700 hover:to-indigo-500 cursor-pointer"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatRWF(item.revenue)}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Mix */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Booking Mix</h2>
              <span className="text-sm text-gray-600 dark:text-gray-400">{totalBookings} total</span>
            </div>
            
            <div className="space-y-4">
              {bookings.map((b) => {
                const pct = totalBookings ? Math.round((b.value / totalBookings) * 100) : 0;
                return (
                  <div key={b.label}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${b.color}`}></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{b.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{b.value} bookings</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div 
                        className={`h-full ${b.color} transition-all duration-500 ease-out`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              {bookings.map((b) => (
                <div key={b.label} className={`${b.lightColor} rounded-lg p-3`}>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{b.label}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{b.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Stats</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">248</p>
                  </div>
                </div>
                <span className="text-green-600 dark:text-green-400 text-sm font-medium">+18%</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Transaction</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatRWF(64000)}</p>
                  </div>
                </div>
                <span className="text-green-600 dark:text-green-400 text-sm font-medium">+8%</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatRWF(totalRevenue)}</p>
                  </div>
                </div>
                <span className="text-green-600 dark:text-green-400 text-sm font-medium">+12%</span>
              </div>

              <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">3 pending payments</span> require attention
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
              <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
                View All
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                          {transaction.customer.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{transaction.customer}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400">
                      {transaction.type}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                      {formatRWF(transaction.amount)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400">
                      {transaction.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}