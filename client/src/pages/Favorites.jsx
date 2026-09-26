import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Alert, EmptyState, Loader } from '../components/Feedback.jsx';
import PropertyCard from '../components/PropertyCard.jsx';
import { useFavorites } from '../hooks/useFavorites.js';
import { api } from '../services/api.js';

export default function Favorites() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const favorites = useFavorites();

  useEffect(() => {
    api
      .favorites()
      .then(({ items: list }) => setItems(list))
      .catch((err) => setError(err.message));
  }, []);

  const remove = async (id) => {
    try {
      await favorites.toggle(id);
      setItems((list) => list.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container page">
      <h1>Mes favoris</h1>
      <Alert>{error}</Alert>
      {!items && !error && <Loader />}
      {items?.length === 0 && (
        <EmptyState title="Aucun favori pour l’instant" action={<Link className="btn btn-primary" to="/">Parcourir les logements</Link>}>
          Touchez le cœur sur une annonce pour la retrouver ici.
        </EmptyState>
      )}
      {items?.length > 0 && (
        <div className="grid">
          {items.map((p) => (
            <PropertyCard key={p._id} property={p} isFavorite onToggleFavorite={remove} showStatus />
          ))}
        </div>
      )}
    </div>
  );
}
