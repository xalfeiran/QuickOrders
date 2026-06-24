import { useState } from 'react';
import { api } from '../api/client.js';
import { useAdminBusiness } from './useAdminBusiness.js';

export default function AdminLinksPage() {
  const { isSuper, businesses, slug, setSlug } = useAdminBusiness();
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [links, setLinks] = useState([]); // generated this session
  const [copied, setCopied] = useState(null);

  async function generate(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.adminCreateOrderLink(slug, phone);
      const url = `${window.location.origin}${res.path}`;
      setLinks((l) => [{ ...res, url }, ...l]);
      setPhone('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copy(url) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard may be unavailable; the link is selectable anyway.
    }
  }

  return (
    <section>
      <h2 className="page-title">Enlaces de pedido</h2>
      <p className="notice">
        Genera un enlace para un cliente por su teléfono. Al abrirlo, podrá
        ordenar sin verificar por SMS. El enlace es de un solo uso.
      </p>

      <form className="inv-new" onSubmit={generate}>
        {isSuper && (
          <select value={slug} onChange={(e) => setSlug(e.target.value)}>
            {businesses.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        )}
        <input
          type="tel"
          placeholder="+52 55 1234 5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button className="button" type="submit" disabled={busy || phone.trim().length < 7}>
          {busy ? 'Generando…' : 'Generar enlace'}
        </button>
      </form>

      {error && <p className="notice notice--error">{error}</p>}

      {links.map((link) => (
        <div key={link.token} className="link-card">
          <div className="link-card__info">
            <strong>{link.phone}</strong>
            <a href={link.url} className="link-card__url">
              {link.url}
            </a>
          </div>
          <button className="button" onClick={() => copy(link.url)}>
            {copied === link.url ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      ))}
    </section>
  );
}
