import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext.jsx';

const ROLE_LABELS = {
  superadmin: 'Superadministrador',
  business_admin: 'Administrador de negocio',
};

// Protects the dashboard: shows the chrome only when logged in, otherwise sends
// the user to the login screen.
export default function AdminLayout() {
  const { user, loading, logout } = useAdminAuth();

  if (loading) return <p className="notice">Cargando…</p>;
  if (!user) return <Navigate to="/admin/login" replace />;

  return (
    <div className="admin">
      <header className="admin__header">
        <div className="admin__nav">
          <span className="admin__brand">QuickOrder · Panel</span>
          <NavLink to="/admin" end className="admin__navlink">
            Pedidos
          </NavLink>
          <NavLink to="/admin/menu" className="admin__navlink">
            Menú
          </NavLink>
          <NavLink to="/admin/inventory" className="admin__navlink">
            Inventario
          </NavLink>
          <NavLink to="/admin/links" className="admin__navlink">
            Enlaces
          </NavLink>
        </div>
        <div className="admin__user">
          <span>
            {user.name} · {ROLE_LABELS[user.role] ?? user.role}
          </span>
          <button className="link-button" onClick={logout}>
            Salir
          </button>
        </div>
      </header>
      <main className="admin__main">
        <Outlet />
      </main>
    </div>
  );
}
