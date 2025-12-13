import { useEffect, useMemo, useState } from "react";
import { adminService } from "../services/adminService.js";
import { Download, RefreshCw, Shield, Search } from "lucide-react";

const severities = {
  High: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200",
  Medium: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200",
  Info: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200",
};

export default function AdminSecurityCenter() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const logs = await adminService.getAuditLogs();
      const parsed = Array.isArray(logs) ? logs : [];
      const failedLogins = parsed
        .filter(l => (l.action || "").toLowerCase().includes("login") || (l.action || "").toLowerCase().includes("auth"))
        .map((l, idx) => ({
          id: l.id || idx,
          title: l.action || "Login event",
          severity: (l.status || "").toLowerCase() === "success" ? "Info" : "High",
          time: l.time || "",
          actor: l.actor || "Unknown",
          target: l.target || ""
        }));
      setAlerts(failedLogins);
    } catch (e) {
      console.error("security load", e);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.actor.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || a.severity === filter;
      return matchesSearch && matchesFilter;
    });
  }, [alerts, search, filter]);

  const exportCsv = () => {
    const headers = ["Title", "Actor", "Time", "Severity", "Target"];
    const rows = filtered.map(a => [a.title, a.actor, a.time, a.severity, a.target]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "security-events.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Security Center</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage protections and monitor alerts</p>
          </div>
          <div className="flex gap-3">
            <button onClick={load} className="btn-secondary flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button onClick={exportCsv} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex gap-3 flex-wrap items-center mb-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="input-field pl-9 w-64"
                placeholder="Search events"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input-field w-40"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Info">Info</option>
            </select>
            {(search || filter !== "all") && (
              <button
                onClick={() => { setSearch(""); setFilter("all"); }}
                className="text-blue-600 text-sm font-semibold"
              >
                Clear
              </button>
            )}
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => (
                <div key={a.id} className="p-4 rounded-xl bg-secondary-50 dark:bg-secondary-800/50 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-500" />
                      {a.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{a.actor} • {a.time}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${severities[a.severity] || severities.Info}`}>
                    {a.severity}
                  </span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No security events found
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
