import { useState, useEffect } from "react";
import { adminService } from "../services/adminService.js";
import { Download, Search, Filter as FilterIcon, FileText, RefreshCw } from "lucide-react";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [timeFilter, setTimeFilter] = useState("Last 24h");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAuditLogs();
      let parsed = Array.isArray(data) ? data : [];
      if (!parsed.length) {
        parsed = [{
          id: 0,
          actor: "System",
          action: "No audit records yet",
          target: "N/A",
          time: new Date().toISOString(),
          status: "Success"
        }];
      }
      setLogs(parsed);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setLogs([{
        id: -1,
        actor: "System",
        action: "Failed to load audit logs",
        target: "Audit",
        time: new Date().toISOString(),
        status: "Failed"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchQuery || 
      log.actor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All Status" || log.status === statusFilter;

    const logDate = log.time ? new Date(log.time) : null;
    const startOk = !startDate || (logDate && logDate >= new Date(startDate));
    const endOk = !endDate || (logDate && logDate <= new Date(endDate));

    return matchesSearch && matchesStatus && startOk && endOk;
  });

  const exportCsv = () => {
    const headers = ["Actor", "Action", "Target", "Time", "Status", "RecordId", "IP", "UserAgent"];
    const rows = filteredLogs.map(l => [
      l.actor,
      l.action,
      l.target,
      l.time,
      l.status,
      l.recordId || "",
      l.ipAddress || "",
      l.userAgent || ""
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const lines = filteredLogs.map(l => `${l.time} | ${l.actor} | ${l.action} | ${l.target} | ${l.status}`);
    const blob = new Blob([`Audit Logs\n\n${lines.join("\n")}`], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
            <p className="text-gray-600 dark:text-gray-400">Track critical events and changes</p>
          </div>
          <div className="flex gap-3">
              <button onClick={exportCsv} className="btn-secondary flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button onClick={exportPdf} className="btn-secondary flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Download PDF
              </button>
              <button onClick={fetchAuditLogs} className="btn-primary flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
          </div>
        </div>

        <div className="card">
          <div className="flex gap-3 mb-4 flex-wrap items-center">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                className="input-field w-64 pl-9" 
                placeholder="Search actor, action or target"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="input-field w-40"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Status</option>
              <option>Success</option>
              <option>Failed</option>
            </select>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 flex items-center gap-1 text-sm">
                <FilterIcon className="w-4 h-4" /> Date
              </span>
              <input
                type="date"
                className="input-field w-40"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                type="date"
                className="input-field w-40"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {(searchQuery || statusFilter !== "All Status" || startDate || endDate) && (
              <button
                onClick={() => { setSearchQuery(""); setStatusFilter("All Status"); setStartDate(""); setEndDate(""); }}
                className="text-blue-600 text-sm font-semibold"
              >
                Clear
              </button>
            )}
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading audit logs...</p>
              </div>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-secondary-700 text-left">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Actor</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Action</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Target</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Time</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-200 dark:border-secondary-700">
                    <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{log.actor}</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{log.action}</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{log.target}</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{log.time}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          log.status === "Success"
                            ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200"
                            : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
