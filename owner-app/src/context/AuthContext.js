// Holds the logged-in admin user (or null) and exposes login/logout — the
// mobile counterpart of frontend/src/admin/AdminAuthContext.jsx.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { loadStoredConfig } from '../api/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load: read the saved API URL, then ask the backend whether the
  // session cookie (if any) is still valid.
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      await loadStoredConfig();
      try {
        const me = await api.adminMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedInUser = await api.adminLogin(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.adminLogout();
    } finally {
      setUser(null);
    }
  }, []);

  // Lets a screen refresh /auth/me after switching API servers in Settings.
  const recheckSession = useCallback(async () => {
    setLoading(true);
    try {
      const me = await api.adminMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, recheckSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
