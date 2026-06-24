import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusiness } from '../business/BusinessContext.jsx';
import { useManagedSession } from '../business/ManagedSessionContext.jsx';
import { useCart } from '../cart/CartContext.jsx';
import { describeOptions } from '../cart/line.js';
import { api } from '../api/client.js';
import { formatPrice } from '../utils/money.js';
import PhoneVerification from '../components/PhoneVerification.jsx';
import AddressForm from '../components/AddressForm.jsx';
import StepIndicator from '../components/StepIndicator.jsx';

const EMPTY_ADDRESS = {
  street: '',
  exteriorNumber: '',
  interiorNumber: '',
  neighborhood: '',
  city: '',
  postalCode: '',
  references: '',
};

// Multi-step checkout: verify phone → details → (address) → payment → review.
export default function CheckoutPage() {
  const { items, totalCents, orderToken, clear } = useCart();
  const { slug } = useBusiness();
  const { managed } = useManagedSession();
  const navigate = useNavigate();
  const base = `/b/${slug}`;

  // When arriving via a manager link, the phone is already verified — start at
  // the details step with the grant + phone prefilled.
  const [step, setStep] = useState(managed?.grant ? 1 : 0);
  const [grant, setGrant] = useState(managed?.grant ?? null);
  const [phone, setPhone] = useState(managed?.phone ?? '');
  const [customerName, setCustomerName] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState('pickup');
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Prefill returning-customer details when the phone is already verified
  // through a manager link.
  useEffect(() => {
    if (managed?.grant && managed?.phone) {
      prefillCustomer(managed.phone, managed.grant);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <section>
        <h2 className="page-title">Pago</h2>
        <p className="notice">Tu carrito está vacío.</p>
        <Link to={base} className="button button--block">
          Ver el menú
        </Link>
      </section>
    );
  }

  const isDelivery = fulfillmentType === 'delivery';
  const stages = [
    'phone',
    'details',
    ...(isDelivery ? ['address'] : []),
    'payment',
    'review',
  ];
  const stageLabels = stages.map((s) =>
    s === 'phone'
      ? 'Teléfono'
      : s === 'details'
        ? 'Datos'
        : s === 'address'
          ? 'Dirección'
          : s === 'payment'
            ? 'Pago'
            : 'Revisar',
  );
  const stage = stages[Math.min(step, stages.length - 1)];

  function next() {
    setStep((s) => Math.min(s + 1, stages.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  // Prefills name + last address for a returning customer (best-effort).
  async function prefillCustomer(verifiedPhone, verifiedGrant) {
    try {
      const result = await api.lookupCustomer(verifiedPhone, verifiedGrant);
      if (result.registered) {
        if (result.name) setCustomerName(result.name);
        if (result.lastAddress) {
          setAddress({
            street: result.lastAddress.street ?? '',
            exteriorNumber: result.lastAddress.exteriorNumber ?? '',
            interiorNumber: result.lastAddress.interiorNumber ?? '',
            neighborhood: result.lastAddress.neighborhood ?? '',
            city: result.lastAddress.city ?? '',
            postalCode: result.lastAddress.postalCode ?? '',
            references: result.lastAddress.references ?? '',
          });
        }
      }
    } catch {
      // Lookup is best-effort; the customer can still fill everything in.
    }
  }

  // After the phone is verified, prefill returning customers' details.
  async function handleVerified(newGrant, verifiedPhone) {
    setGrant(newGrant);
    setPhone(verifiedPhone);
    await prefillCustomer(verifiedPhone, newGrant);
    next();
  }

  const addressComplete =
    address.street.trim() &&
    address.exteriorNumber.trim() &&
    address.neighborhood.trim() &&
    address.city.trim() &&
    address.postalCode.trim();

  async function placeOrder() {
    setSubmitting(true);
    setError(null);
    try {
      // The token is normally minted when the cart got its first item; create
      // one now as a fallback if that request hadn't completed.
      let token = orderToken;
      if (!token) token = (await api.createDraft(slug)).orderToken;

      const order = await api.confirmOrder(
        {
          orderToken: token,
          managedSessionToken: managed?.token,
          phone,
          customerName,
          fulfillmentType,
          paymentMethod,
          address: isDelivery
            ? {
                street: address.street,
                exteriorNumber: address.exteriorNumber,
                interiorNumber: address.interiorNumber || undefined,
                neighborhood: address.neighborhood,
                city: address.city,
                postalCode: address.postalCode,
                references: address.references || undefined,
              }
            : undefined,
          items: items.map((line) => ({
            menuItemId: line.menuItemId,
            quantity: line.quantity,
            selectedOptions: line.selectedOptions.map((o) => ({
              groupId: o.groupId,
              optionId: o.optionId,
            })),
          })),
        },
        grant,
      );
      clear();
      navigate(`${base}/orders/${order.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2 className="page-title">Pago</h2>
      <StepIndicator steps={stageLabels} current={step} />

      {stage === 'phone' && (
        <div>
          {grant ? (
            <>
              <p className="notice notice--success">
                Teléfono verificado: {phone}
              </p>
              <button className="button button--block" onClick={next}>
                Continuar
              </button>
            </>
          ) : (
            <>
              <p className="notice">
                Te enviaremos un código por WhatsApp para verificar tu número.
              </p>
              <PhoneVerification onVerified={handleVerified} />
            </>
          )}
        </div>
      )}

      {stage === 'details' && (
        <div className="form">
          <label className="field">
            <span>Tu nombre</span>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </label>

          <fieldset className="choice-group">
            <legend>¿Cómo quieres tu pedido?</legend>
            <label className="choice">
              <input
                type="radio"
                name="fulfillment"
                checked={fulfillmentType === 'pickup'}
                onChange={() => setFulfillmentType('pickup')}
              />
              <span>Recoger</span>
            </label>
            <label className="choice">
              <input
                type="radio"
                name="fulfillment"
                checked={fulfillmentType === 'delivery'}
                onChange={() => setFulfillmentType('delivery')}
              />
              <span>A domicilio</span>
            </label>
          </fieldset>

          <div className="wizard-nav">
            <button className="link-button" onClick={back}>
              Atrás
            </button>
            <button
              className="button"
              onClick={next}
              disabled={customerName.trim().length < 2}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {stage === 'address' && (
        <div>
          <AddressForm value={address} onChange={setAddress} />
          <div className="wizard-nav">
            <button className="link-button" onClick={back}>
              Atrás
            </button>
            <button
              className="button"
              onClick={next}
              disabled={!addressComplete}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {stage === 'payment' && (
        <div className="form">
          <fieldset className="choice-group">
            <legend>¿Cómo vas a pagar?</legend>
            <label className="choice">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
              />
              <span>Efectivo</span>
            </label>
            <label className="choice">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
              />
              <span>Tarjeta</span>
            </label>
          </fieldset>
          <div className="wizard-nav">
            <button className="link-button" onClick={back}>
              Atrás
            </button>
            <button className="button" onClick={next}>
              Revisar pedido
            </button>
          </div>
        </div>
      )}

      {stage === 'review' && (
        <div>
          <ul className="cart-list">
            {items.map((line) => (
              <li key={line.key} className="cart-line">
                <div className="cart-line__info">
                  <p className="cart-line__name">
                    {line.quantity}× {line.name}
                  </p>
                  {line.selectedOptions.length > 0 && (
                    <p className="cart-line__options">
                      {describeOptions(line.selectedOptions)}
                    </p>
                  )}
                </div>
                <span>{formatPrice(line.unitPriceCents * line.quantity)}</span>
              </li>
            ))}
          </ul>

          <dl className="review">
            <div>
              <dt>Nombre</dt>
              <dd>{customerName}</dd>
            </div>
            <div>
              <dt>Teléfono</dt>
              <dd>{phone}</dd>
            </div>
            <div>
              <dt>Entrega</dt>
              <dd>{isDelivery ? 'A domicilio' : 'Recoger'}</dd>
            </div>
            {isDelivery && (
              <div>
                <dt>Dirección</dt>
                <dd>
                  {address.street} {address.exteriorNumber}
                  {address.interiorNumber ? ` int. ${address.interiorNumber}` : ''},{' '}
                  {address.neighborhood}, {address.city} {address.postalCode}
                </dd>
              </div>
            )}
            <div>
              <dt>Pago</dt>
              <dd>{paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}</dd>
            </div>
          </dl>

          <div className="cart-total">
            <span>Total</span>
            <strong>{formatPrice(totalCents)}</strong>
          </div>

          {error && <p className="notice notice--error">{error}</p>}

          <div className="wizard-nav">
            <button className="link-button" onClick={back} disabled={submitting}>
              Atrás
            </button>
            <button
              className="button"
              onClick={placeOrder}
              disabled={submitting}
            >
              {submitting ? 'Enviando pedido…' : 'Realizar pedido'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
