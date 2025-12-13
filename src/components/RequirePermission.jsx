import { useEffect, useState } from "react";
import { usePermissions } from "../hooks/usePermissions.jsx";
import PermissionDenied from "./PermissionDenied.jsx";
import { useAuth } from "../hooks/useAuth.jsx";

export default function RequirePermission({ 
  children, 
  permission, 
  permissionName,
  fallback = null 
}) {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, checkPermission } = usePermissions();
  const [hasAccess, setHasAccess] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyPermission = async () => {
      if (!user || authLoading) {
        setChecking(true);
        return;
      }

      setChecking(true);
      
      // First check synchronously
      const syncCheck = hasPermission(permission);
      
      // Then verify asynchronously for more accurate check
      try {
        const asyncCheck = await checkPermission(permission);
        setHasAccess(asyncCheck);
      } catch (error) {
        console.error("Error checking permission:", error);
        // Fallback to sync check
        setHasAccess(syncCheck);
      } finally {
        setChecking(false);
      }
    };

    verifyPermission();
  }, [user, permission, authLoading, hasPermission, checkPermission]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return fallback || <PermissionDenied permissionName={permissionName || permission} />;
  }

  if (hasAccess === false) {
    return <PermissionDenied permissionName={permissionName || permission} />;
  }

  if (hasAccess === true) {
    return children;
  }

  // Default: show denied if we can't determine access
  return <PermissionDenied permissionName={permissionName || permission} />;
}

