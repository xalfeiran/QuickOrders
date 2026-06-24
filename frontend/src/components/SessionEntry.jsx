import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useManagedSession } from '../business/ManagedSessionContext.jsx';

// Lands the customer from a manager link (/b/:slug/s/:token): resolves the
// token into a pre-verification, stores it, and sends them to the menu.
export default function SessionEntry() {
  const { slug, token } = useParams();
  const navigate = useNavigate();
  const { setManaged } = useManagedSession();
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .resolveSession(token)
      .then((s) => {
        setManaged({ token: s.token, phone: s.phone, grant: s.grant });
        navigate(`/b/${slug}`, { replace: true });
      })
      .catch((err) => setError(err.message || 'Enlace inválido'));
  }, [token, slug]);

  if (error) {
    return (
      <section>
        <p className="notice notice--error">{error}</p>
        <Link to={`/b/${slug}`} className="button button--block">
          Ver el menú
        </Link>
      </section>
    );
  }
  return <p className="notice">Abriendo tu pedido…</p>;
}
