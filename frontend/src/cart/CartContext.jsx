import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { api } from '../api/client.js';
import { useBusiness } from '../business/BusinessContext.jsx';
import { buildCartLine } from './line.js';

// Holds the visitor's cart in memory for the duration of the session.
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { slug } = useBusiness();
  // Map of lineKey -> cart line (see cart/line.js for the line shape).
  const [lines, setLines] = useState({});
  // Order-session token, minted the moment the cart gets its first item.
  const [orderToken, setOrderToken] = useState(null);
  // Guards against firing the draft request twice while one is in flight.
  const creatingDraft = useRef(false);

  // Adds a customised item. If an identical variant is already in the cart,
  // its quantity goes up instead of creating a duplicate line.
  function addLine(item, selectedOptions, quantity = 1) {
    const line = buildCartLine(item, selectedOptions, quantity);
    setLines((current) => {
      const existing = current[line.key];
      const nextQuantity = existing ? existing.quantity + quantity : quantity;
      return { ...current, [line.key]: { ...line, quantity: nextQuantity } };
    });
  }

  function setQuantity(key, quantity) {
    setLines((current) => {
      if (!current[key]) return current;
      if (quantity <= 0) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: { ...current[key], quantity } };
    });
  }

  function removeLine(key) {
    setQuantity(key, 0);
  }

  function clear() {
    setLines({});
    setOrderToken(null);
  }

  const items = Object.values(lines);
  const totalCents = items.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0,
  );
  const itemCount = items.reduce((sum, line) => sum + line.quantity, 0);

  // Start an order session as soon as the cart has something in it. The token
  // is created once and reused for the rest of the session.
  useEffect(() => {
    if (itemCount > 0 && !orderToken && !creatingDraft.current) {
      creatingDraft.current = true;
      api
        .createDraft(slug)
        .then((draft) => setOrderToken(draft.orderToken))
        .catch(() => {
          // Leave the token unset; checkout will retry creating one.
        })
        .finally(() => {
          creatingDraft.current = false;
        });
    }
  }, [itemCount, orderToken, slug]);

  const value = useMemo(
    () => ({
      items,
      totalCents,
      itemCount,
      orderToken,
      addLine,
      setQuantity,
      removeLine,
      clear,
    }),
    [lines, orderToken],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Convenience hook so components don't import the context directly.
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
