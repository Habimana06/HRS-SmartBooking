import { useEffect, useState } from 'react';
import { Settings, Shield, Bell, Database, Mail, AlertTriangle, Save, RefreshCw, Server, Zap, Activity, HardDrive } from 'lucide-react';
import { adminService } from "../services/adminService.js";

const initialToggles = [
  { id: 1, label: "Maintenance Mode", enabled: false, description: "Put system in maintenance mode", icon: AlertTriangle, color: "text-orange-500" },
  { id: 2, label: "Email Notifications", enabled: true, description: "Send email alerts to users", icon: Mail, color: "text-blue-500" },
  { id: 3, label: "Two-Factor Authentication", enabled: true, description: "Require 2FA for all accounts", icon: Shield, color: "text-green-500" },
  { id: 4, label: "Auto-Backup", enabled: true, description: "Automatic daily backups", icon: Database, color: "text-purple-500" },
];

export default function AdminSystemConfiguration() {
  const [toggles, setToggles] = useState(initialToggles);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await adminService.getSystemConfig();
        if (cfg) {
          setToggles(toggles.map(t => {
            const key = t.label.toLowerCase().replace(/\s+/g, "");
            return { ...t, enabled: cfg[key] ?? t.enabled };
          }));
        }
      } catch (e) {
        console.error("Failed to load config", e);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = (id) => {
    setToggles(toggles.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        maintenancemode: toggles.find(t => t.label === "Maintenance Mode")?.enabled ?? false,
        emailnotifications: toggles.find(t => t.label === "Email Notifications")?.enabled ?? true,
        twofactorauthentication: toggles.find(t => t.label === "Two-Factor Authentication")?.enabled ?? true,
        autobackup: toggles.find(t => t.label === "Auto-Backup")?.enabled ?? true,
      };
      await adminService.updateSystemConfig(payload);
      setHasChanges(false);
    } catch (e) {
      alert("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setToggles(initialToggles);
      setHasChanges(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              System Configuration
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage platform settings and integrations</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button 
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-lg ${
                hasChanges 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Status Banner */}
        {hasChanges && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-yellow-800 dark:text-yellow-200 font-medium">You have unsaved changes. Click "Save Changes" to apply them.</p>
          </div>
        )}

        {/* System Status Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <Server className="w-8 h-8 text-green-500" />
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-full text-xs font-semibold">Online</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">99.9%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-blue-500" />
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-xs font-semibold">Normal</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">24ms</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Response Time</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <HardDrive className="w-8 h-8 text-purple-500" />
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-full text-xs font-semibold">75%</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">375 GB</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Storage Used</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-8 h-8 text-orange-500" />
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 rounded-full text-xs font-semibold">Secure</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">SSL</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Certificate Valid</p>
          </div>
        </div>

        {/* System Toggles */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            System Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {toggles.map((item) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    item.enabled 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                      : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => handleToggle(item.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className={`w-5 h-5 mt-0.5 ${item.color}`} />
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white font-semibold">{item.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                      </div>
                    </div>
                    <button
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        item.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(item.id);
                      }}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          item.enabled ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}