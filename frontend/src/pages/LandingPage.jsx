import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { DEFAULT_BUSINESS_SLUG } from '../business/BusinessContext.jsx';

// Página de bienvenida en la URL base ("/"). Presenta el restaurante y
// lleva al visitante al menú del negocio activo (DEFAULT_BUSINESS_SLUG).
// Cuando haya varios negocios, este es el lugar para dejar elegir uno.
export default function LandingPage() {
  const [business, setBusiness] = useState({ name: '', loading: true });
  const menuHref = `/b/${DEFAULT_BUSINESS_SLUG}`;

  useEffect(() => {
    let active = true;
    api
      .getBusiness(DEFAULT_BUSINESS_SLUG)
      .then((b) => {
        if (active) setBusiness({ name: b.name, phone: b.phone, loading: false });
      })
      .catch(() => {
        if (active) setBusiness({ name: '', loading: false, error: true });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="landing">
      <section className="landing__hero">
        <p className="landing__eyebrow">Pedidos para llevar</p>
        <h1 className="landing__title">
          {business.loading ? 'Bienvenido' : business.name || 'Bienvenido'}
        </h1>
        <p className="landing__subtitle">
          Arma tu pedido, elige tus platillos favoritos y pasa a recogerlo sin
          filas ni esperas.
        </p>
        <Link to={menuHref} className="button button--block landing__cta">
          Ver menú y ordenar
        </Link>
      </section>

      <section className="landing__features">
        <div className="landing__feature">
          <span className="landing__feature-icon" aria-hidden="true">📱</span>
          <div>
            <p className="landing__feature-title">Ordena desde tu celular</p>
            <p className="landing__feature-desc">
              Sin apps que instalar, todo desde el navegador.
            </p>
          </div>
        </div>
        <div className="landing__feature">
          <span className="landing__feature-icon" aria-hidden="true">⏱️</span>
          <div>
            <p className="landing__feature-title">Listo para recoger</p>
            <p className="landing__feature-desc">
              Te avisamos en cuanto tu pedido esté en camino a la ventanilla.
            </p>
          </div>
        </div>
        <div className="landing__feature">
          <span className="landing__feature-icon" aria-hidden="true">🌶️</span>
          <div>
            <p className="landing__feature-title">Personaliza tu platillo</p>
            <p className="landing__feature-desc">
              Elige salsas, extras y todo a tu gusto antes de pagar.
            </p>
          </div>
        </div>
      </section>

      {business.phone && (
        <p className="landing__contact">
          ¿Dudas? Llámanos al{' '}
          <a href={`tel:${business.phone}`}>{business.phone}</a>
        </p>
      )}
    </div>
  );
}
