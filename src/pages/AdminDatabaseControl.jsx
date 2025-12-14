import { useState } from "react";
import { Database, Activity, HardDrive, Clock, AlertCircle, CheckCircle, Camera, RotateCcw, Zap, Power, FileText, TrendingUp, Server, CloudDownload, Settings, RefreshCw } from "lucide-react";

export default function AdminDatabaseControl() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState("");
  const [logs, setLogs] = useState([
    { time: "14:32:01", type: "info", message: "Database health check completed successfully" },
    { time: "14:15:22", type: "success", message: "Backup completed: backup_2024_12_09.sql" },
    { time: "13:45:10", type: "warning", message: "High query latency detected (120ms)" },
    { time: "12:30:05", type: "info", message: "Tables optimized successfully" },
  ]);

  const statuses = [
    { label: "Primary DB", value: "Online", status: "healthy", icon: Database, color: "green", detail: "All systems operational" },
    { label: "Read Replica", value: "Online", status: "healthy", icon: Server, color: "green", detail: "Synced 2 seconds ago" },
    { label: "Latency", value: "42 ms", status: "good", icon: Activity, color: "blue", detail: "Average response time" },
    { label: "Last Backup", value: "02:00 AM", status: "recent", icon: CloudDownload, color: "yellow", detail: "Daily automated backup" },
  ];

  const metrics = [
    { label: "Active Connections", value: "127", max: "500", percentage: 25 },
    { label: "CPU Usage", value: "34%", max: "100%", percentage: 34 },
    { label: "Memory Usage", value: "4.2 GB", max: "16 GB", percentage: 26 },
    { label: "Storage Used", value: "156 GB", max: "500 GB", percentage: 31 },
  ];

  const snapshots = [
    { id: "snap_001", name: "Pre-Migration Backup", size: "2.4 GB", date: "2024-12-09 02:00", status: "Complete" },
    { id: "snap_002", name: "Weekly Backup", size: "2.3 GB", date: "2024-12-08 02:00", status: "Complete" },
    { id: "snap_003", name: "Manual Snapshot", size: "2.4 GB", date: "2024-12-07 14:30", status: "Complete" },
  ];

  const handleAction = (action) => {
    setModalAction(action);
    setShowModal(true);
  };

  const confirmAction = () => {
    setIsProcessing(true);
    const newLog = {
      time: new Date().toLocaleTimeString(),
      type: "info",
      message: `${modalAction} initiated...`,
    };
    setLogs([newLog, ...logs]);
    
    setTimeout(() => {
      setIsProcessing(false);
      setShowModal(false);
      const successLog = {
        time: new Date().toLocaleTimeString(),
        type: "success",
        message: `${modalAction} completed successfully`,
      };
      setLogs([successLog, ...logs]);
    }, 2000);
  };

  const getStatusColor = (color) => {
    switch(color) {
      case "green": return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
      case "blue": return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "yellow": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
      case "red": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
      default: return "";
    }
  };

  const getLogIcon = (type) => {
    switch(type) {
      case "success": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning": return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "error": return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Database Control Center</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor, manage, and optimize database operations</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">View Logs</span>
            </button>
            <button 
              onClick={() => handleAction("Health Check")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Health Check</span>
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statuses.map((status) => {
            const Icon = status.icon;
            return (
              <div key={status.label} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${status.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' : status.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                    <Icon className={`w-5 h-5 ${status.color === 'green' ? 'text-green-600 dark:text-green-400' : status.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status.color)}`}>
                    {status.value}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{status.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{status.detail}</p>
              </div>
            );
          })}
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Performance Metrics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric) => (
              <div key={metric.label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{metric.label}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{metric.value}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${metric.percentage > 70 ? 'bg-red-500' : metric.percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${metric.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{metric.max} capacity</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button 
              onClick={() => handleAction("Create Snapshot")}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <Camera className="w-4 h-4" />
              Create Snapshot
            </button>
            <button 
              onClick={() => handleAction("Restore Snapshot")}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Restore Snapshot
            </button>
            <button 
              onClick={() => handleAction("Optimize Tables")}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors font-medium"
            >
              <Settings className="w-4 h-4" />
              Optimize Tables
            </button>
            <button 
              onClick={() => handleAction("Restart Service")}
              className="flex items-center gap-2 px-4 py-3 border-2 border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors font-medium"
            >
              <Power className="w-4 h-4" />
              Restart Service
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Snapshots */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Snapshots</h2>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {snapshots.map((snapshot) => (
                <div key={snapshot.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{snapshot.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {snapshot.size} • {snapshot.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-semibold">
                      {snapshot.status}
                    </span>
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <RotateCcw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Logs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Activity Logs</h2>
              </div>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  {getLogIcon(log.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">{log.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => !isProcessing && setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Action</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to execute <strong>{modalAction}</strong>? This action may affect database operations.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={confirmAction}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
              <button 
                onClick={() => setShowModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}