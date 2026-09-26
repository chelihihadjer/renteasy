import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
export function useUnread() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [unread, setUnread] = useState({ total: 0, byRequest: {} });
  const enabled = user && user.role !== 'admin';

  const refresh = useCallback(() => {
    if (!enabled) return;
    api.unread().then(setUnread).catch(() => {});
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setUnread({ total: 0, byRequest: {} });
      return undefined;
    }
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, [enabled, pathname, refresh]);

  return { ...unread, refresh };
}
