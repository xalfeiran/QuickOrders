import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Holds the logged-in admin user (or null) and exposes login/logout.
const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on first load.
  useEffect(() => {
    api
      .adminMe()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const u = await api.adminLogin(email, password);
    setUser(u);
    return u;
  }

  async function logout() {
    try {
      await api.adminLogout();
    } finally {
      setUser(null);
    }
  }

  return (
    <AdminAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
