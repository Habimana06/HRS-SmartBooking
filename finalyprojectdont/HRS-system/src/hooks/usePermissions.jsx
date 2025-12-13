import { useMemo, useState, useEffect } from "react";
import { useAuth } from "./useAuth.jsx";
import { adminService } from "../services/adminService.js";

// Load user permissions from localStorage (synchronous for performance)
const loadUserPermissions = () => {
  try {
    const saved = localStorage.getItem("user-permissions");
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.error("Error loading user permissions:", e);
    return {};
  }
};

// Cache for role permissions map
let rolePermissionsCache = null;
let rolePermissionsCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get role permissions map (with caching)
export const getRolePermissionsMap = async (forceRefresh = false) => {
  const now = Date.now();
  
  if (!forceRefresh && rolePermissionsCache && rolePermissionsCacheTime && (now - rolePermissionsCacheTime) < CACHE_DURATION) {
    return rolePermissionsCache;
  }

  try {
    const data = await adminService.getRoles();
    const roles = Array.isArray(data?.roles) ? data.roles : [];
    const map = {};
    roles.forEach(r => {
      map[r.name] = r.permissions || [];
    });
    rolePermissionsCache = map;
    rolePermissionsCacheTime = now;
    return map;
  } catch (error) {
    console.error("Error loading role permissions:", error);
    return rolePermissionsCache || {};
  }
};

// Function to clear cache (call this when permissions are updated)
export const clearPermissionsCache = () => {
  rolePermissionsCache = null;
  rolePermissionsCacheTime = null;
};

export function usePermissions() {
  const { user } = useAuth();
  const [rolePermissionsMap, setRolePermissionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  
  const userPermissions = useMemo(() => {
    return loadUserPermissions();
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadRolePermissions = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const map = await getRolePermissionsMap();
        if (isMounted) {
          setRolePermissionsMap(map);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading role permissions:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    if (user) {
      loadRolePermissions();
    } else {
      setLoading(false);
    }

    // Listen for permission updates
    const handlePermissionsUpdate = () => {
      if (isMounted) {
        loadRolePermissions();
      }
    };

    window.addEventListener('permissionsUpdated', handlePermissionsUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('permissionsUpdated', handlePermissionsUpdate);
    };
  }, [user]);

  const checkPermission = async (permissionId) => {
    if (!user) return false;

    const userId = user.userId || user.id;
    const userOverrides = userPermissions[userId] || {};

    // Check if user has login permission (required for all other permissions)
    if (userOverrides["auth:login"] === false) {
      return false; // User cannot login, so no permissions
    }

    // Get user's role permissions
    const rolePerms = rolePermissionsMap[user.role] || [];

    // Check if permission exists in role
    const hasRolePermission = rolePerms.some(rp => {
      const rpId = typeof rp === 'string' ? rp : (rp.id || rp);
      return rpId === permissionId;
    });

    // Check for login/auth permissions (available to all roles)
    const isAuthPermission = permissionId.startsWith("auth:");

    if (!hasRolePermission && !isAuthPermission) {
      return false; // Permission not in role and not an auth permission
    }

    // Check user-specific override
    const userOverride = userOverrides[permissionId];
    
    // If user has explicit override, use it; otherwise default to enabled (true)
    if (userOverride !== undefined) {
      return userOverride;
    }

    // Default: permission is enabled
    return true;
  };

  const hasPermission = (permissionId) => {
    if (!user || loading) return true; // Allow access while loading to prevent flicker

    const userId = user.userId || user.id;
    const userOverrides = userPermissions[userId] || {};

    // Check login permission first
    if (userOverrides["auth:login"] === false) {
      return false;
    }

    // Check specific permission override
    const override = userOverrides[permissionId];
    if (override !== undefined) {
      return override;
    }

    // Check if permission exists in role (synchronous check)
    const rolePerms = rolePermissionsMap[user.role] || [];
    const hasRolePermission = rolePerms.some(rp => {
      const rpId = typeof rp === 'string' ? rp : (rp.id || rp);
      return rpId === permissionId;
    });

    const isAuthPermission = permissionId.startsWith("auth:");

    // If permission is in role or is auth permission, default to enabled
    if (hasRolePermission || isAuthPermission) {
      return true;
    }

    // Permission not found in role
    return false;
  };

  const getUserPermissions = () => {
    if (!user) return {};
    const userId = user.userId || user.id;
    return userPermissions[userId] || {};
  };

  return {
    checkPermission,
    hasPermission,
    getUserPermissions,
    userPermissions,
    loading
  };
}

