import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
export function useFavorites() {
  const { user, isTenant, setFavorites } = useAuth();
  const ids = user?.favorites || [];

  const isFavorite = useCallback((id) => ids.includes(id), [ids]);

  const toggle = useCallback(
    async (id) => {
      const { isFavorite: now, favorites } = await api.toggleFavorite(id);
      setFavorites(favorites);
      return now;
    },
    [setFavorites]
  );

  return { enabled: isTenant, isFavorite, toggle };
}
