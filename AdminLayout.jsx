import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { authService } from "../services/authService.js";
import { useState } from "react";

function AdminLayout() {
  const { user, theme, toggleTheme, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems = [
    { title: "Dashboard", path: "/admin/dashboard", icon: "📊" },
    { title: "Users", path: "/admin/users", icon: "👥" },
    { title: "Roles", path: "/admin/roles", icon: "🔐" },
    { title: "Staff", path: "/admin/staff", icon: "👔" },
    { title: "Payments", path: "/admin/payments", icon: "💳" },
    { title: "Reports", path: "/admin/reports", icon: "📈" },
    { title: "Backup", path: "/admin/backup", icon: "💾" },
    { title: "Security", path: "/admin/security", icon: "🔒" },
    { title: "Audit Logs", path: "/admin/audit", icon: "📋" },
    { title: "Config", path: "/admin/config", icon: "⚙️" },
    { title: "Profile", path: "/admin/profile", icon: "👤" },
  ];

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      navigate("/login");
    } catch (err) {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex">
      {/* Sidebar - Fixed and Full Height */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed left-0 top-0 ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'} bg-gradient-to-b from-secondary-900 via-secondary-800 to-secondary-900 text-white border-r border-secondary-700 h-screen z-50 transition-all duration-300 flex flex-col shadow-2xl`}>
        <div className="p-4 border-b border-secondary-700 flex items-center justify-between flex-shrink-0">
          {!sidebarCollapsed && (
            <div>
              <p className="text-xs uppercase tracking-wide text-secondary-300">HRS</p>
              <h2 className="text-xl font-extrabold text-white">Admin Portal</h2>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-2 rounded-xl hover:bg-secondary-700 transition-colors"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-link ${sidebarCollapsed ? 'justify-center px-3' : 'px-4'} ${
                location.pathname === item.path ? "active bg-primary-600 text-white shadow-lg" : "text-secondary-100 hover:bg-secondary-700"
              }`}
              title={sidebarCollapsed ? item.title : ""}
            >
              <span className="text-lg">{item.icon}</span>
              {!sidebarCollapsed && <span className="font-semibold">{item.title}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content - Offset for fixed sidebar */}
      <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} transition-all duration-300`}>
        <header className="sticky top-0 z-40 bg-white dark:bg-secondary-800 border-b border-gray-200 dark:border-secondary-700 px-4 py-4 shadow-sm">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-secondary-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
                title="Toggle theme"
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">{user?.firstName} {user?.lastName}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-xl transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default AdminLayout;
