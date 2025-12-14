import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Download, Upload, Shield, Users, Lock, Eye, Edit2, Trash2, MoreVertical, CheckCircle, XCircle, AlertCircle, Settings, History, Filter } from "lucide-react";
import { adminService } from "../services/adminService.js";
import { clearPermissionsCache } from "../hooks/usePermissions.jsx";

const allPermissions = [
  // Admin
  { id: "admin:dashboard:view", name: "Admin Dashboard", category: "System", description: "View admin dashboard" },
  { id: "admin:users:manage", name: "Manage Users", category: "System", description: "Create, update, and deactivate users" },
  { id: "admin:roles:manage", name: "Manage Roles", category: "System", description: "Configure roles and permissions" },
  { id: "admin:staff:manage", name: "Manage Staff", category: "System", description: "Create and update staff records" },
  { id: "admin:payments:view", name: "View Payments", category: "Financial", description: "View all payment records" },
  { id: "admin:reports:view", name: "View Reports", category: "Analytics", description: "View analytics and reports" },
  { id: "admin:reports:download", name: "Download Reports", category: "Analytics", description: "Export or download reports" },
  { id: "admin:audit:view", name: "View Audit Logs", category: "Security", description: "Inspect audit and security logs" },
  { id: "admin:config:manage", name: "System Config", category: "System", description: "Manage system configuration" },
  { id: "admin:security:manage", name: "Security Settings", category: "Security", description: "Manage security settings" },
  { id: "admin:backup:manage", name: "Backup & Restore", category: "System", description: "Manage backups and restores" },
  { id: "admin:profile:update", name: "Update Profile", category: "User", description: "Update own profile" },

  // Manager
  { id: "manager:dashboard:view", name: "Manager Dashboard", category: "Operations", description: "View manager dashboard" },
  { id: "manager:rooms:view", name: "View Rooms", category: "Operations", description: "View room inventory" },
  { id: "manager:rooms:manage", name: "Manage Rooms", category: "Operations", description: "Edit room details and status" },
  { id: "manager:rooms:create", name: "Create Room", category: "Operations", description: "Add new rooms" },
  { id: "manager:bookings:view", name: "View Bookings", category: "Operations", description: "View bookings" },
  { id: "manager:bookings:manage", name: "Manage Bookings", category: "Operations", description: "Modify bookings" },
  { id: "manager:travel:manage", name: "Manage Travel", category: "Operations", description: "Manage travel bookings" },
  { id: "manager:reports:view", name: "View Reports", category: "Analytics", description: "View manager reports" },
  { id: "manager:reports:download", name: "Download Reports", category: "Analytics", description: "Export/download reports" },
  { id: "manager:staff:view", name: "View Staff", category: "System", description: "View staff directory" },
  { id: "manager:profile:update", name: "Update Profile", category: "User", description: "Update own profile" },

  // Receptionist
  { id: "receptionist:dashboard:view", name: "Receptionist Dashboard", category: "Operations", description: "View receptionist dashboard" },
  { id: "receptionist:bookings:view", name: "View Bookings", category: "Operations", description: "View guest bookings" },
  { id: "receptionist:bookings:manage", name: "Manage Bookings", category: "Operations", description: "Modify guest bookings" },
  { id: "receptionist:checkin", name: "Check-in Guests", category: "Operations", description: "Perform guest check-ins" },
  { id: "receptionist:checkout", name: "Check-out Guests", category: "Operations", description: "Perform guest check-outs" },
  { id: "receptionist:travel:view", name: "View Travel", category: "Operations", description: "View travel bookings" },
  { id: "receptionist:requests:handle", name: "Handle Requests", category: "Operations", description: "Handle customer requests" },
  { id: "receptionist:profile:update", name: "Update Profile", category: "User", description: "Update own profile" },

  // Customer
  { id: "customer:dashboard:view", name: "Customer Dashboard", category: "User", description: "View customer dashboard" },
  { id: "customer:booking:create", name: "Create Booking", category: "Operations", description: "Create room bookings" },
  { id: "customer:booking:view", name: "View Bookings", category: "Operations", description: "View own bookings" },
  { id: "customer:payments:pay", name: "Pay for Booking", category: "Financial", description: "Make payments" },
  { id: "customer:profile:update", name: "Update Profile", category: "User", description: "Update own profile" },

  // Login & Authentication (Common for all roles)
  { id: "auth:login", name: "Login Access", category: "Authentication", description: "Ability to login to the system" },
  { id: "auth:logout", name: "Logout Access", category: "Authentication", description: "Ability to logout from the system" },
  { id: "auth:session:manage", name: "Manage Sessions", category: "Authentication", description: "Manage active sessions" },
  { id: "auth:password:change", name: "Change Password", category: "Authentication", description: "Change own password" },
  { id: "auth:password:reset", name: "Reset Password", category: "Authentication", description: "Reset forgotten password" },
  { id: "auth:2fa:enable", name: "Enable 2FA", category: "Authentication", description: "Enable two-factor authentication" },
  { id: "auth:2fa:disable", name: "Disable 2FA", category: "Authentication", description: "Disable two-factor authentication" },
  { id: "auth:account:lock", name: "Account Lock", category: "Authentication", description: "Lock/unlock account access" },
];

export default function AdminRolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");
  const [viewMode, setViewMode] = useState("cards"); // cards or table
  const [activityLog, setActivityLog] = useState([]);
  const [savingRole, setSavingRole] = useState(false);
  const [roleStatusLoading, setRoleStatusLoading] = useState({});
  const [dirty, setDirty] = useState(false);
  const [userToggleLoading, setUserToggleLoading] = useState({});
  const [userPermissions, setUserPermissions] = useState({}); // userId -> { permissionId: enabled }
  const [expandedUsers, setExpandedUsers] = useState({}); // userId -> boolean
  const [permissionLoading, setPermissionLoading] = useState({}); // { userId-permissionId: boolean }

  useEffect(() => {
    fetchRoles();
    fetchUsers();
    loadUserPermissions();
  }, []);

  const loadUserPermissions = () => {
    const saved = localStorage.getItem("user-permissions");
    if (saved) {
      try {
        setUserPermissions(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading user permissions:", e);
      }
    }
  };

  const saveUserPermissions = (permissions) => {
    localStorage.setItem("user-permissions", JSON.stringify(permissions));
    setUserPermissions(permissions);
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await adminService.getRoles();
      const baseRoles = Array.isArray(data?.roles) ? data.roles : [];
      const saved = JSON.parse(localStorage.getItem("role-permissions") || "[]");
      const merged = baseRoles.map(r => {
        const found = saved.find(s => s.id === r.id || s.name === r.name);
        return found ? { ...r, permissions: found.permissions || r.permissions, disabled: found.disabled || false } : r;
      });
      setRoles(merged);
      setActivityLog(Array.isArray(data?.activityLog) ? data.activityLog : []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
      setActivityLog([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await adminService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const totalUsers = useMemo(() => roles.reduce((acc, r) => acc + (r.users || 0), 0), [roles]);
  const rolePermissionsMap = useMemo(() => {
    const map = {};
    roles.forEach(r => { map[r.name] = r.permissions || []; });
    return map;
  }, [roles]);
  
  const filteredRoles = useMemo(() => {
    return roles.filter(role => 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  const categories = ["All", "System", "Operations", "Financial", "Analytics", "User"];

  const getColorClasses = (color) => {
    const colors = {
      red: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      green: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
      purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    };
    return colors[color] || colors.blue;
  };

  const handleDeleteRole = (roleId) => {
    if (confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter(r => r.id !== roleId));
      setDirty(true);
    }
  };

  const togglePermission = async (roleId, permissionName) => {
    const updated = roles.map(r => {
      if (r.id !== roleId) return r;
      const has = r.permissions.includes(permissionName);
      const permissions = has
        ? r.permissions.filter(p => p !== permissionName)
        : [...r.permissions, permissionName];
      return { ...r, permissions };
    });
    setRoles(updated);
    setDirty(true);
  };

  const toggleRoleEnabled = async (roleName, enabled) => {
    setRoleStatusLoading(prev => ({ ...prev, [roleName]: true }));
    try {
      await adminService.setRoleStatus(roleName, enabled);
      setRoles(prev => prev.map(r => r.name === roleName ? { ...r, disabled: !enabled } : r));
      setDirty(true);
    } catch (error) {
      console.error("Error updating role status", error);
      alert("Failed to update role status");
    } finally {
      setRoleStatusLoading(prev => ({ ...prev, [roleName]: false }));
    }
  };

  const handleAssignRole = async (userId, roleName) => {
    try {
      await adminService.assignRole({ userId, role: roleName });
      alert("Role assigned");
    } catch (error) {
      console.error("Error assigning role", error);
      alert("Failed to assign role");
    }
  };

  const persistRoles = () => {
    localStorage.setItem("role-permissions", JSON.stringify(roles.map(r => ({
      id: r.id,
      name: r.name,
      permissions: r.permissions,
      disabled: r.disabled || false
    }))));
  };

  const saveRoles = async () => {
    setSavingRole(true);
    try {
      const payload = roles.map(r => ({
        name: r.name,
        description: r.description || "",
        color: r.color || "blue",
        permissions: r.permissions || [],
        disabled: r.disabled || false
      }));
      
      if (payload.length === 0) {
        alert("No roles to save");
        return;
      }
      
      await adminService.upsertRoles(payload);
      persistRoles();
      
      // Clear permissions cache to force refresh
      clearPermissionsCache();
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('permissionsUpdated'));
      
      setDirty(false);
      alert("Roles saved successfully! Changes will take effect immediately.");
    } catch (error) {
      console.error("Error saving roles", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save roles";
      alert(`Failed to save roles: ${errorMessage}`);
    } finally {
      setSavingRole(false);
    }
  };

  const getUserPermissions = (userRole) => {
    return rolePermissionsMap[userRole] || [];
  };

  const getUserEffectivePermissions = (userId, userRole) => {
    const rolePerms = getUserPermissions(userRole);
    const userOverrides = userPermissions[userId] || {};
    
    // Start with role permissions, then apply user-specific overrides
    return rolePerms.map(perm => {
      const permId = perm.id || perm;
      // If user has explicit override, use it; otherwise use role default (true)
      if (userOverrides.hasOwnProperty(permId)) {
        return { ...perm, enabled: userOverrides[permId] };
      }
      return { ...perm, enabled: true }; // Default enabled from role
    });
  };

  const toggleUserPermission = async (userId, permissionId, enabled) => {
    const key = `${userId}-${permissionId}`;
    setPermissionLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      const current = { ...userPermissions };
      if (!current[userId]) {
        current[userId] = {};
      }
      current[userId][permissionId] = enabled;
      saveUserPermissions(current);
      setDirty(true);
    } catch (error) {
      console.error("Error toggling permission", error);
      alert("Failed to update permission");
    } finally {
      setPermissionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const saveUserPermissionsToBackend = async () => {
    try {
      const saved = localStorage.getItem("user-permissions");
      if (saved) {
        const permissionsData = JSON.parse(saved);
        
        // Save to backend
        await adminService.saveUserPermissions(permissionsData);
        
        // Clear permissions cache to force refresh
        clearPermissionsCache();
        
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('permissionsUpdated'));
        
        setDirty(false);
        alert("User permissions saved successfully! Changes will take effect immediately. Users with disabled login access will be blocked from logging in.");
      } else {
        alert("No user permissions to save");
      }
    } catch (error) {
      console.error("Error saving user permissions", error);
      alert("Failed to save user permissions: " + (error?.response?.data?.message || error.message));
    }
  };

  const toggleUserExpanded = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleToggleUserActive = async (user) => {
    const isActive = (user.status || user.isActive) !== "Inactive" && (user.status || user.isActive) !== false;
    setUserToggleLoading(prev => ({ ...prev, [user.userId]: true }));
    try {
      await adminService.updateUser(user.userId, {
        userId: user.userId,
        email: user.email,
        password: null,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isActive: !isActive,
        isVerified: user.isVerified ?? true
      });
      setUsers(prev => prev.map(u => u.userId === user.userId ? { ...u, status: !isActive ? "Active" : "Inactive", isActive: !isActive } : u));
    } catch (error) {
      console.error("Error toggling user active state", error);
      alert("Failed to update user status");
    } finally {
      setUserToggleLoading(prev => ({ ...prev, [user.userId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading roles and permissions...</p>
        </div>
      </div>
    );
  }

  const handleCreateRole = (newRole) => {
    setRoles([...roles, { ...newRole, id: roles.length + 1 }]);
    setShowRoleModal(false);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setShowRoleModal(true);
  };

  const exportRoles = () => {
    const headers = ["Role", "Description", "Users", "Permissions", "Created"];
    const rows = filteredRoles.map(r => [
      r.name,
      r.description,
      r.users,
      r.permissions.join(";"),
      r.createdAt
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roles.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewRole = (role) => {
    setSelectedRole(role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Roles & Permissions
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Manage access control and security settings
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={() => setShowActivityLog(!showActivityLog)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <History className="w-4 h-4" />
              Activity
            </button>
            <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={exportRoles}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={saveRoles}
              disabled={!dirty || savingRole}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium ${
                dirty 
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {savingRole ? "Saving..." : "Save Roles"}
            </button>
            <button 
              onClick={() => setShowRoleModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Role
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalUsers}</p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Roles</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{roles.length}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Permissions</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{allPermissions.length}</p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Recent Changes</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{activityLog.length}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <History className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === "cards" ? "table" : "cards")}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
              >
                {viewMode === "cards" ? "Table View" : "Card View"}
              </button>
            </div>
          </div>
        </div>

        {/* User Permissions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Permissions
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Enable or disable individual permissions per user. Override role-based permissions. Login permissions are available for all users.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200"
                />
              </div>
              <button
                onClick={saveUserPermissionsToBackend}
                disabled={!dirty}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium ${
                  dirty 
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Lock className="w-4 h-4" />
                Save User Permissions
              </button>
            </div>
          </div>

          {usersLoading ? (
            <div className="py-10 text-center text-gray-600 dark:text-gray-300">Loading users...</div>
          ) : (
            <div className="space-y-4">
              {users
                .filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()))
                .map(user => {
                  const userId = user.userId || user.id;
                  const rolePerms = getUserPermissions(user.role);
                  const isExpanded = expandedUsers[userId] || false;
                  const isActive = (user.status || user.isActive) !== "Inactive" && (user.status || user.isActive) !== false;
                  
                  // Get all available permissions for this role
                  // Role permissions are strings (permission IDs), match with allPermissions
                  // Also include login/auth permissions for all users
                  const loginPermissions = allPermissions.filter(p => p.category === "Authentication");
                  const roleBasedPermissions = allPermissions.filter(p => {
                    return rolePerms.some(rp => {
                      // rp is a string (permission ID), p.id is the permission ID
                      const rpId = typeof rp === 'string' ? rp : (rp.id || rp);
                      return rpId === p.id;
                    });
                  });
                  
                  // Combine role permissions with login permissions (login permissions available to all)
                  const availablePermissions = [...roleBasedPermissions, ...loginPermissions];
                  
                  // Remove duplicates based on permission ID
                  const uniquePermissions = availablePermissions.filter((p, index, self) =>
                    index === self.findIndex(perm => perm.id === p.id)
                  );

                  return (
                    <div
                      key={userId}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      {/* User Header */}
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {user.email}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded">
                              {user.role}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            }`}>
                              {isActive ? "Active" : "Disabled"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleUserExpanded(userId)}
                          className="ml-4 px-3 py-1 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition"
                        >
                          {isExpanded ? "Hide Permissions" : "Show Permissions"}
                        </button>
                      </div>

                      {/* Permissions List */}
                      {isExpanded && (
                        <div className="p-4 bg-white dark:bg-gray-800">
                          {uniquePermissions.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                              No permissions available for this role
                            </p>
                          ) : (
                            <div className="space-y-3">
                              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                                Individual Permissions ({uniquePermissions.length})
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {uniquePermissions.map(permission => {
                                  const permId = permission.id;
                                  const key = `${userId}-${permId}`;
                                  const isLoading = permissionLoading[key] || false;
                                  
                                  // Check if permission is enabled for this user
                                  const userOverride = userPermissions[userId]?.[permId];
                                  const isEnabled = userOverride !== undefined ? userOverride : true; // Default enabled from role
                                  
                                  return (
                                    <div
                                      key={permId}
                                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                          {permission.name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                          {permission.description}
                                        </div>
                                        <div className="mt-1">
                                          <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                            {permission.category}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="ml-4 flex-shrink-0">
                                        <button
                                          onClick={() => toggleUserPermission(userId, permId, !isEnabled)}
                                          disabled={isLoading || !isActive}
                                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                            isEnabled && isActive
                                              ? "bg-indigo-600 dark:bg-indigo-500"
                                              : "bg-gray-300 dark:bg-gray-600"
                                          } ${isLoading || !isActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                        >
                                          <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                              isEnabled && isActive ? "translate-x-6" : "translate-x-1"
                                            }`}
                                          />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              
              {users.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No users found matching your search.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Activity Log */}
        {showActivityLog && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {activityLog.map((log, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    log.type === "create" ? "bg-green-100 dark:bg-green-900/30" :
                    log.type === "edit" ? "bg-blue-100 dark:bg-blue-900/30" :
                    log.type === "delete" ? "bg-red-100 dark:bg-red-900/30" :
                    "bg-purple-100 dark:bg-purple-900/30"
                  }`}>
                    {log.type === "create" ? <Plus className="w-5 h-5 text-green-600 dark:text-green-400" /> :
                     log.type === "edit" ? <Edit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" /> :
                     log.type === "delete" ? <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" /> :
                     <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{log.user}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{log.action}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedRole ? 'Edit Role' : 'Create New Role'}
              </h3>
              <button 
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedRole(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <XCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  defaultValue={selectedRole?.name || ''}
                  placeholder="Enter role name"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  defaultValue={selectedRole?.description || ''}
                  placeholder="Enter role description"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color Theme
                </label>
                <div className="flex gap-2">
                  {['red', 'blue', 'green', 'purple'].map((color) => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-lg border-2 ${
                        selectedRole?.color === color ? 'border-indigo-600 dark:border-indigo-400' : 'border-transparent'
                      } ${getColorClasses(color)}`}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Permissions
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {allPermissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={selectedRole?.permissions.includes(permission.name)}
                        className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {permission.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {permission.description}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {permission.category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedRole(null);
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition text-gray-700 dark:text-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateRole({
                  name: 'New Role',
                  users: 0,
                  permissions: [],
                  color: 'blue',
                  description: 'New role description',
                  createdAt: new Date().toISOString().split('T')[0]
                })}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium"
              >
                {selectedRole ? 'Save Changes' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}