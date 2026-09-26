import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Alert, EmptyState, Loader } from '../components/Feedback.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useUnread } from '../hooks/useUnread.js';
import { api } from '../services/api.js';
import { formatDate, formatPrice, handleImgError, plural, resolveImage } from '../utils/format.js';

export default function MyRequests() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const { byRequest } = useUnread();

  useEffect(() => {
    api
      .myRequests()
      .then(({ items: list }) => setItems(list))
      .catch((err) => setError(err.message));
  }, []);

  const cancel = async (id) => {
    if (!window.confirm('Annuler cette demande ? La conversation associée sera supprimée.')) return;
    try {
      await api.cancelRequest(id);
      setItems((list) => list.filter((r) => r._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container page">
      <h1>Mes demandes</h1>
      <Alert>{error}</Alert>
      {!items && !error && <Loader />}
      {items?.length === 0 && (
        <EmptyState title="Aucune demande envoyée" action={<Link className="btn btn-primary" to="/">Trouver un logement</Link>}>
          Depuis la fiche d’un logement disponible, envoyez une demande au propriétaire.
        </EmptyState>
      )}
      {items?.length > 0 && (
        <ul className="request-list">
          {items.map((r) => {
            const unread = byRequest[r._id] || 0;
            return (
              <li key={r._id} className="request-item">
                <div className="request-thumb">
                  <img src={resolveImage(r.property?.images?.[0])} alt="" onError={handleImgError} />
                </div>
                <div className="request-info">
                  <h3>
                    {r.property ? <Link to={`/logement/${r.property._id}`}>{r.property.title}</Link> : 'Annonce supprimée'}
                  </h3>
                  {r.property && <p className="muted">{r.property.city}, {formatPrice(r.property.price)} par mois</p>}
                  <p>Entrée le {formatDate(r.startDate)}, pour {plural(r.duration, 'mois', 'mois')}.</p>
                  <p className="muted small">Envoyée le {formatDate(r.createdAt)}</p>
                </div>
                <div className="request-actions">
                  <StatusBadge status={r.status} />
                  <Link to={`/messages/${r._id}`} className="btn btn-ghost btn-sm">
                    Messagerie{unread ? ` (${unread})` : ''}
                  </Link>
                  {r.status === 'pending' && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => cancel(r._id)}>
                      Annuler la demande
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
