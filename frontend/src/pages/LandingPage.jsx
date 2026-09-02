import { Link } from 'react-router-dom';
import { DEFAULT_BUSINESS_SLUG } from '../business/BusinessContext.jsx';

// Página de bienvenida en la URL base ("/"). Presenta QuickOrder de forma
// genérica (no el nombre de ningún restaurante en particular) y lleva al
// visitante a hacer su pedido. Hoy solo hay un negocio activo
// (DEFAULT_BUSINESS_SLUG); cuando haya varios, este es el lugar para dejar
// elegir uno en vez de enlazar directo al menú.
export default function LandingPage() {
  const menuHref = `/b/${DEFAULT_BUSINESS_SLUG}`;

  return (
    <div className="landing">
      <section className="landing__hero">
        <p className="landing__eyebrow">Pedidos para llevar</p>
        <h1 className="landing__title">QuickOrder</h1>
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
          <span className="landing__feature-icon" aria-hidden="true">🍽️</span>
          <div>
            <p className="landing__feature-title">Personaliza tu platillo</p>
            <p className="landing__feature-desc">
              Elige opciones, extras y todo a tu gusto antes de pagar.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
