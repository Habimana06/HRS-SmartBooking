import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');

  // Apply theme to document and persist per user
  useEffect(() => {
    const storageKey = user ? `theme:${user.id || user.userId || user.email}` : 'theme:guest';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(storageKey, theme);
  }, [theme, user]);

  // Load guest theme on first render (before user known)
  useEffect(() => {
    if (!user) {
      const guestTheme = localStorage.getItem('theme:guest');
      if (guestTheme) setTheme(guestTheme);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 3000); // Max 3 seconds loading
    
    authService
      .me()
      .then(u => {
        clearTimeout(timeoutId);
        if (isMounted) {
          setUser(u);
          const storageKey = u ? `theme:${u.id || u.userId || u.email}` : 'theme:guest';
          const savedTheme = localStorage.getItem(storageKey);
          setTheme(savedTheme || 'light');
          setLoading(false);
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      });
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const toggleTheme = () => {
    // Persist theme per user (falls back to guest)
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      const storageKey = user ? `theme:${user.id || user.userId || user.email}` : 'theme:guest';
      localStorage.setItem(storageKey, next);
      return next;
    });
  };

  const value = {
    user,
    setUser,
    loading,
    theme,
    setTheme,
    toggleTheme
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


