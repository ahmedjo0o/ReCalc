import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { getUserProfile, setUserCurrency, DEFAULT_CURRENCY } from '../lib/firestoreService.js';

const CurrencyContext = createContext(null);

// "123.50 EGP", or just "123.50" when no currency is known.
export function formatMoney(amount, currency) {
  const text = Number(amount || 0).toFixed(2);
  return currency ? `${text} ${currency}` : text;
}

// The signed-in user's chosen currency (Manage > Account), shown next to
// amounts across the app. Guests have no profile, so they get plain numbers
// rather than a guessed currency.
export function CurrencyProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [currency, setCurrencyState] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!uid) {
      setCurrencyState('');
      return undefined;
    }
    setCurrencyState(DEFAULT_CURRENCY);
    getUserProfile(uid)
      .then((profile) => {
        if (!cancelled && profile?.currency) setCurrencyState(profile.currency);
      })
      .catch((err) => console.warn('Could not load currency:', err));
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Optimistic: the UI switches at once and reverts if saving fails.
  const setCurrency = useCallback(
    async (next) => {
      if (!uid) return;
      const previous = currency;
      setCurrencyState(next);
      try {
        await setUserCurrency(uid, next);
      } catch (err) {
        setCurrencyState(previous);
        throw err;
      }
    },
    [uid, currency],
  );

  const value = useMemo(
    () => ({ currency, setCurrency, money: (amount, override) => formatMoney(amount, override ?? currency) }),
    [currency, setCurrency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
