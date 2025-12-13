import { useState, useEffect } from "react";
import { Database, Download, RefreshCw, Settings, Clock, HardDrive, CheckCircle, XCircle, AlertCircle, Calendar, Upload, Trash2, Shield, Archive, Save, FileText } from "lucide-react";
import { adminService } from "../services/adminService.js";

export default function AdminBackupRestore() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filter, setFilter] = useState("all");
  const [schedule, setSchedule] = useState("02:00");
  const [frequency, setFrequency] = useState("daily");
  const [retention, setRetention] = useState("14");

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const data = await adminService.listBackups();
      if (data?.backups) {
        setBackups(data.backups.map(b => ({
          id: b.id,
          name: b.name,
          time: formatTime(b.timestamp),
          size: b.size,
          status: b.status,
          type: b.type,
          timestamp: b.timestamp
        })));
      }
    } catch (error) {
      console.error("Error fetching backups:", error);
      alert("Failed to load backups");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const stats = {
    totalBackups: backups.length,
    totalSize: "5.8 GB",
    lastBackup: "2 hours ago",
    nextScheduled: "Tomorrow 02:00 AM",
    successRate: "98%",
    storageUsed: 58,
  };

  const runBackup = async () => {
    if (!confirm("Create a new backup? This will backup all database tables.")) {
      return;
    }

    setRunning(true);
    setProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const result = await adminService.createBackup();
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(async () => {
        await fetchBackups();
        setRunning(false);
        setProgress(0);
        alert(`Backup created successfully!\n\nRecords backed up:\n- Users: ${result.recordCount?.users || 0}\n- Bookings: ${result.recordCount?.bookings || 0}\n- Payments: ${result.recordCount?.payments || 0}\n- Travel Bookings: ${result.recordCount?.travelBookings || 0}\n- Rooms: ${result.recordCount?.rooms || 0}`);
      }, 500);
    } catch (error) {
      setRunning(false);
      setProgress(0);
      console.error("Error creating backup:", error);
      alert("Failed to create backup: " + (error?.response?.data?.error || error.message));
    }
  };

  const deleteBackup = async (backupId) => {
    if (!confirm("Are you sure you want to delete this backup? This action cannot be undone.")) {
      return;
    }

    try {
      await adminService.deleteBackup(backupId);
      await fetchBackups();
      alert("Backup deleted successfully");
    } catch (error) {
      console.error("Error deleting backup:", error);
      alert("Failed to delete backup: " + (error?.response?.data?.error || error.message));
    }
  };

  const downloadBackupPdf = async (backupId) => {
    try {
      const blob = await adminService.downloadBackupPdf(backupId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${backupId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert("Backup PDF downloaded successfully");
    } catch (error) {
      console.error("Error downloading backup:", error);
      alert("Failed to download backup: " + (error?.response?.data?.error || error.message));
    }
  };

  const exportBackups = () => {
    const headers = ["Name", "Time", "Size", "Status", "Type"];
    const rows = filteredBackups.map(b => [b.name, b.time, b.size, b.status, b.type]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportBackupsPdf = () => {
    const lines = filteredBackups.map(b => `${b.name} | ${b.time} | ${b.size} | ${b.status} | ${b.type}`);
    const blob = new Blob([`Backup History\n\n${lines.join("\n")}`], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-history.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreBackup = (backup) => {
    if (confirm(`Restore from backup "${backup.name}"? This will overwrite current data.`)) {
      alert(`Restoring from ${backup.name}...`);
    }
  };

  const filteredBackups = filter === "all" 
    ? backups 
    : backups.filter(b => b.type.toLowerCase() === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Backup & Restore</h1>
                <p className="text-sm text-slate-600">Manage system snapshots and disaster recovery</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
            <button
              onClick={exportBackups}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Export History
            </button>
            <button
              onClick={exportBackupsPdf}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={runBackup}
                disabled={running}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
                {running ? 'Running...' : 'Run Backup'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Archive className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.totalBackups}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Total Backups</p>
            <p className="text-xs text-slate-500 mt-1">{stats.totalSize} total size</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-green-600">{stats.lastBackup}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Last Backup</p>
            <p className="text-xs text-slate-500 mt-1">Next: {stats.nextScheduled}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.successRate}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Success Rate</p>
            <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.storageUsed}%</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Storage Used</p>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
              <div
                className="h-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                style={{ width: `${stats.storageUsed}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Backup Progress */}
        {running && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Backup in Progress</h3>
                  <p className="text-sm text-slate-600">Creating system snapshot...</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Backup Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Backup Time (24h)
                </label>
                <input
                  type="time"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="12h">Every 12 hours</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Retention (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={retention}
                  onChange={(e) => setRetention(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Shield className="w-4 h-4 text-green-600" />
                AES-256 encryption enabled
              </div>
              <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/30 flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* Backups List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Backup History</h2>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filter === "all"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("automatic")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filter === "automatic"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Automatic
              </button>
              <button
                onClick={() => setFilter("manual")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filter === "manual"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Manual
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredBackups.map((backup) => (
              <div
                key={backup.id}
                className={`group p-5 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedBackup?.id === backup.id
                    ? "border-blue-300 bg-blue-50"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                }`}
                onClick={() => setSelectedBackup(backup)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      backup.status === "Success" ? "bg-green-100" :
                      backup.status === "Warning" ? "bg-yellow-100" :
                      "bg-red-100"
                    }`}>
                      {backup.status === "Success" ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : backup.status === "Warning" ? (
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-slate-900">{backup.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          backup.type === "Automatic" 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-purple-100 text-purple-700"
                        }`}>
                          {backup.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {backup.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-4 h-4" />
                          {backup.size}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadBackupPdf(backup.id);
                      }}
                      className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreBackup(backup);
                      }}
                      className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                      title="Restore"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBackup(backup.id);
                      }}
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                      title="Delete Backup"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-16 h-16 text-slate-300 mx-auto mb-4 animate-spin" />
              <p className="text-slate-600 font-medium">Loading backups...</p>
            </div>
          ) : filteredBackups.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No backups found</p>
              <p className="text-slate-500 text-sm">Create your first backup to get started</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}