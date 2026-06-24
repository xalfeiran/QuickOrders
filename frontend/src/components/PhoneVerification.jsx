import { useState } from 'react';
import { api } from '../api/client.js';

// Two-step phone verification: enter number → receive a WhatsApp code → enter
// the code. On success calls onVerified(grant, phone) with the grant the rest
// of checkout uses for address lookup and order placement.
export default function PhoneVerification({ onVerified }) {
  const [stage, setStage] = useState('phone'); // 'phone' | 'code'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  async function sendCode() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await api.requestVerification(phone);
      setStage('code');
      setInfo('Enviamos un código de 6 dígitos a tu WhatsApp.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    try {
      const { grant } = await api.confirmVerification(phone, code);
      onVerified(grant, phone);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form">
      {stage === 'phone' && (
        <>
          <label className="field">
            <span>Número de teléfono</span>
            <input
              type="tel"
              autoComplete="tel"
              placeholder="+52 55 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <button
            className="button button--block"
            onClick={sendCode}
            disabled={busy || phone.trim().length < 7}
          >
            {busy ? 'Enviando…' : 'Enviar código'}
          </button>
        </>
      )}

      {stage === 'code' && (
        <>
          <p className="notice">
            Código enviado a {phone}.{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setStage('phone');
                setCode('');
                setInfo(null);
              }}
            >
              Cambiar
            </button>
          </p>
          <label className="field">
            <span>Código de verificación</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </label>
          <button
            className="button button--block"
            onClick={verifyCode}
            disabled={busy || code.length !== 6}
          >
            {busy ? 'Verificando…' : 'Verificar'}
          </button>
          <button
            type="button"
            className="link-button"
            onClick={sendCode}
            disabled={busy}
          >
            Reenviar código
          </button>
        </>
      )}

      {info && <p className="notice notice--success">{info}</p>}
      {error && <p className="notice notice--error">{error}</p>}
    </div>
  );
}
