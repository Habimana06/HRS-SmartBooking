import { useState, useEffect } from "react";
import { Search, Download, Filter, Calendar, TrendingUp, CreditCard, Clock, XCircle, CheckCircle, RefreshCw, Eye, MoreVertical, ArrowUpRight, ArrowDownRight, FileText } from "lucide-react";
import { adminService } from "../services/adminService.js";
import { formatRWF } from "../utils/currency.js";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPayments();
      console.log("Fetched payments data:", data); // Debug log
      const paymentsArray = Array.isArray(data) ? data : [];
      console.log("Processed payments:", paymentsArray.length); // Debug log
      setPayments(paymentsArray);
    } catch (error) {
      console.error("Error fetching payments:", error);
      console.error("Error details:", error.response?.data || error.message);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals and metrics
  const totals = {
    paid: payments.filter((p) => (p.status || "").toLowerCase() === "paid").reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0),
    pending: payments.filter((p) => (p.status || "").toLowerCase() === "pending").reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0),
    failed: payments.filter((p) => (p.status || "").toLowerCase() === "failed").reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0),
    processing: payments.filter((p) => (p.status || "").toLowerCase() === "processing").reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0),
    total: payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0),
    count: payments.length,
  };

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      (payment.id && payment.id.toString().toLowerCase().includes(searchLower)) ||
      (payment.customer && payment.customer.toLowerCase().includes(searchLower)) ||
      (payment.email && payment.email.toLowerCase().includes(searchLower));
    const matchesMethod = filterMethod === "all" || (payment.method || "").toLowerCase() === filterMethod.toLowerCase();
    const matchesStatus = filterStatus === "all" || (payment.status || "").toLowerCase() === filterStatus.toLowerCase();

    const paymentDate = payment.date ? new Date(payment.date) : null;
    const startOk = !startDate || (paymentDate && paymentDate >= new Date(startDate));
    const endOk = !endDate || (paymentDate && paymentDate <= new Date(endDate));

    return matchesSearch && matchesMethod && matchesStatus && startOk && endOk;
  });

  const exportCSV = () => {
    const headers = ["Invoice", "Customer", "Email", "Method", "Amount", "Status", "Date", "Time", "Type"];
    const rows = filteredPayments.map(p => [
      p.id || p.paymentId || "",
      p.customer || "",
      p.email || "",
      p.method || "",
      p.amount || "",
      p.status || "",
      p.date || "",
      p.time || "",
      p.type || ""
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const lines = filteredPayments.map(p =>
      `${p.id || p.paymentId || ""} | ${p.customer || ""} | ${p.amount || 0} | ${p.status || ""} | ${p.date || ""}`
    );
    const blob = new Blob([`Payments\n\n${lines.join("\n")}`], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "Paid": return <CheckCircle className="w-4 h-4" />;
      case "Pending": return <Clock className="w-4 h-4" />;
      case "Failed": return <XCircle className="w-4 h-4" />;
      case "Processing": return <RefreshCw className="w-4 h-4" />;
      case "Refunded": return <ArrowDownRight className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Paid": return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
      case "Pending": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
      case "Failed": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
      case "Processing": return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "Refunded": return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      default: return "";
    }
  };

  const successRate = totals.paid + totals.failed + totals.pending > 0 
    ? ((totals.paid / (totals.paid + totals.failed + totals.pending)) * 100).toFixed(1)
    : "0.0";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Payment Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and manage all transactions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{formatRWF(totals.total)}</p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">12.5% from last month</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid</p>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">{formatRWF(totals.paid)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{payments.filter(p => p.status === "Paid").length} transactions</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-400">{formatRWF(totals.pending)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{payments.filter(p => (p.status || "").toLowerCase() === "pending").length} awaiting</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{successRate}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Payment success ratio</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice, customer, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Methods</option>
                <option value="Card">Card</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Processing">Processing</option>
                <option value="Refunded">Refunded</option>
              </select>

              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Date Range</span>
              </button>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {(searchQuery || filterMethod !== "all" || filterStatus !== "all") && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Filter className="w-4 h-4" />
              <span>Showing {filteredPayments.length} of {payments.length} payments</span>
              {(searchQuery || filterMethod !== "all" || filterStatus !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterMethod("all");
                    setFilterStatus("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Payments Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Invoice</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Method</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Date</th>
                  <th className="py-4 px-6 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPayments.map((payment, index) => (
                  <tr key={payment.id || payment.paymentId || index} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-semibold text-gray-900 dark:text-white">{payment.id || payment.paymentId || "N/A"}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">{payment.customer || "Unknown"}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{payment.email || ""}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{payment.method || "N/A"}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-gray-900 dark:text-white">{formatRWF(payment.amount || 0)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(payment.status || "Pending")}`}>
                        {getStatusIcon(payment.status || "Pending")}
                        {payment.status || "Pending"}
                      </span>
                    </td>
                    <td className="py-4 px-6 hidden lg:table-cell">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{payment.date || "N/A"}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{payment.time || ""}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowDetails(true);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPayments.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">No payments found matching your criteria</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-medium">{filteredPayments.length}</span> results
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">
                Previous
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                2
              </button>
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Modal */}
      {showDetails && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDetails(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Details</h3>
              <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Invoice ID</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedPayment.id || selectedPayment.paymentId || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedPayment.status || "Pending")}`}>
                    {getStatusIcon(selectedPayment.status || "Pending")}
                    {selectedPayment.status || "Pending"}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedPayment.customer || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedPayment.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Payment Method</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedPayment.method || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">{formatRWF(selectedPayment.amount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedPayment.date || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedPayment.time || "N/A"}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Send Receipt
                </button>
                <button className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                  Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}