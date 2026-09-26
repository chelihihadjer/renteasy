import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../services/api.js';

const AuthContext = createContext(null);
const USER_KEY = 'renteasy_user';

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [checking, setChecking] = useState(() => Boolean(tokenStore.get()));

  const persist = useCallback((next) => {
    setUser(next);
    if (next) localStorage.setItem(USER_KEY, JSON.stringify(next));
    else localStorage.removeItem(USER_KEY);
  }, []);

  const [signedOut, setSignedOut] = useState(false);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    persist(null);
  }, [persist]);

  const logout = useCallback(() => {
    setSignedOut(true);
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .me()
      .then(({ user: fresh }) => persist(fresh))
      .catch((err) => {
        if (err.status === 401) clearSession();
      })
      .finally(() => setChecking(false));
  }, [persist, clearSession]);

  useEffect(() => {
    window.addEventListener('renteasy:unauthorized', clearSession);
    return () => window.removeEventListener('renteasy:unauthorized', clearSession);
  }, [clearSession]);

  const login = useCallback(
    async (email, password) => {
      const { user: logged, token } = await api.login({ email, password });
      tokenStore.set(token);
      setSignedOut(false);
      persist(logged);
      return logged;
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const { user: created, token } = await api.register(payload);
      tokenStore.set(token);
      setSignedOut(false);
      persist(created);
      return created;
    },
    [persist]
  );

  const setFavorites = useCallback((favorites) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, favorites };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      checking,
      signedOut,
      isOwner: user?.role === 'owner',
      isTenant: user?.role === 'tenant',
      login,
      register,
      logout,
      setFavorites,
    }),
    [user, checking, signedOut, login, register, logout, setFavorites]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
