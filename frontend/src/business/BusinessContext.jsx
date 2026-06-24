import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Slug the root path redirects to (the seeded business).
export const DEFAULT_BUSINESS_SLUG = 'alita-mia';

// Holds the business the customer is currently ordering from (resolved from the
// /b/:slug route). Loads the business's public info for the header.
const BusinessContext = createContext(null);

export function BusinessProvider({ slug, children }) {
  const [business, setBusiness] = useState({ slug, name: '', loading: true });

  useEffect(() => {
    let active = true;
    setBusiness({ slug, name: '', loading: true });
    api
      .getBusiness(slug)
      .then((b) => {
        if (active) {
          setBusiness({ slug, name: b.name, phone: b.phone, loading: false });
        }
      })
      .catch(() => {
        if (active) setBusiness({ slug, name: '', loading: false, error: true });
      });
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <BusinessContext.Provider value={business}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
