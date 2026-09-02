// Página de bienvenida en la URL base ("/"). Muestra QuickOrder como
// producto: pedir para recoger o a domicilio en tus lugares favoritos.
// Por ahora es solo informativa (sin enlace al menú); cuando haya un
// listado de negocios público, aquí es donde se dejará elegir uno.
export default function LandingPage() {
  return (
    <div className="landing">
      <section className="landing__hero">
        <p className="landing__eyebrow">Recoger o a domicilio</p>
        <h1 className="landing__title">QuickOrder</h1>
        <p className="landing__subtitle">
          Pide en tus lugares favoritos y decide cómo lo recibes: para
          recoger o a domicilio. Todo desde tu celular, sin filas ni
          esperas.
        </p>
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
          <span className="landing__feature-icon" aria-hidden="true">🛵</span>
          <div>
            <p className="landing__feature-title">Recoge o pide a domicilio</p>
            <p className="landing__feature-desc">
              Elige cómo quieres recibir tu pedido, como prefieras.
            </p>
          </div>
        </div>
        <div className="landing__feature">
          <span className="landing__feature-icon" aria-hidden="true">🍽️</span>
          <div>
            <p className="landing__feature-title">Personaliza tu pedido</p>
            <p className="landing__feature-desc">
              Elige opciones y extras a tu gusto antes de pagar.
            </p>
          </div>
        </div>
        <div className="landing__feature">
          <span className="landing__feature-icon" aria-hidden="true">📍</span>
          <div>
            <p className="landing__feature-title">Sigue tu pedido en vivo</p>
            <p className="landing__feature-desc">
              Entérate de cada paso, desde que se prepara hasta que llega.
            </p>
          </div>
        </div>
      </section>

      <footer className="landing__footer">
        <a
          href="https://mindware.com.mx"
          target="_blank"
          rel="noopener noreferrer"
        >
          Un producto de Mindware
        </a>
      </footer>
    </div>
  );
}
