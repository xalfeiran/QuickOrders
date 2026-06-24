import { createContext, useContext, useState } from 'react';

// Holds a manager-link pre-verification ({ token, phone, grant }) so checkout
// can skip the SMS/OTP step. Set by SessionEntry when a /s/:token link opens.
const ManagedSessionContext = createContext(null);

export function ManagedSessionProvider({ children }) {
  const [managed, setManaged] = useState(null);
  return (
    <ManagedSessionContext.Provider value={{ managed, setManaged }}>
      {children}
    </ManagedSessionContext.Provider>
  );
}

export function useManagedSession() {
  const context = useContext(ManagedSessionContext);
  if (!context) {
    throw new Error(
      'useManagedSession must be used within a ManagedSessionProvider',
    );
  }
  return context;
}
