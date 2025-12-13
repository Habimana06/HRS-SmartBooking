import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { authService } from "../services/authService.js";
import { useState } from "react";
import FeedbackForm from "../components/FeedbackForm.jsx";

function CustomerLayout() {
  const { user, theme, toggleTheme, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { title: "Home", path: "/customer/home", icon: "🏠" },
    { title: "Rooms", path: "/customer/rooms", icon: "🛏️" },
    { title: "Book Now", path: "/customer/booking", icon: "📅" },
    { title: "Services", path: "/customer/explore", icon: "⭐" },
    { title: "My Reservations", path: "/customer/my-bookings", icon: "📋" },
    { title: "Contact", path: "/customer/support", icon: "💬" },
    { title: "Profile", path: "/customer/profile", icon: "👤" },
  ];

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="bg-white dark:bg-secondary-800 shadow-sm border-b border-gray-200 dark:border-secondary-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/customer/home" className="text-2xl font-bold text-primary-500 dark:text-primary-400">
                HRS
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    location.pathname === item.path
                      ? "bg-primary-500 text-white dark:bg-primary-600"
                      : "text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-secondary-700"
                  }`}
                >
                  {item.title}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
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
              <div className="hidden md:block text-sm text-gray-700 dark:text-gray-300">
                {user?.firstName} {user?.lastName}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-xl transition-colors"
              >
                Logout
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-secondary-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-secondary-700 bg-white dark:bg-secondary-800">
            <nav className="px-4 py-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    location.pathname === item.path
                      ? "bg-primary-500 text-white dark:bg-primary-600"
                      : "text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-secondary-700"
                  }`}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-secondary-800 border-t border-gray-200 dark:border-secondary-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">HRS</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your trusted hotel reservation system</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link to="/customer/rooms" className="hover:text-primary-600 dark:hover:text-primary-400">Rooms</Link></li>
                <li><Link to="/customer/explore" className="hover:text-primary-600 dark:hover:text-primary-400">Explore</Link></li>
                <li><Link to="/customer/support" className="hover:text-primary-600 dark:hover:text-primary-400">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link to="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary-600 dark:hover:text-primary-400">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Contact</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email: support@hrs.com</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Phone: +250 788 123 456</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Share Your Feedback</h4>
              <FeedbackForm />
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-secondary-700 text-center text-sm text-gray-600 dark:text-gray-400">
            © 2024 HRS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CustomerLayout;
