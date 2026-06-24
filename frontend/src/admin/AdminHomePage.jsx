import { useAdminAuth } from './AdminAuthContext.jsx';

// Dashboard landing. Orders and menu management arrive in the next phases.
export default function AdminHomePage() {
  const { user } = useAdminAuth();

  return (
    <section>
      <h2 className="page-title">Bienvenido, {user.name}</h2>
      <p className="notice">
        {user.role === 'superadmin'
          ? 'Tienes acceso a todos los negocios.'
          : 'Administras tu negocio.'}{' '}
        Aquí aparecerán los pedidos y la gestión del menú.
      </p>
    </section>
  );
}
