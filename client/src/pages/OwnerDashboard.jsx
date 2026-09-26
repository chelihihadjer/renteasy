import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Alert, EmptyState, Loader } from '../components/Feedback.jsx';
import OwnerStats from '../components/OwnerStats.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useUnread } from '../hooks/useUnread.js';
import { api } from '../services/api.js';
import { formatDate, formatPrice, handleImgError, plural, resolveImage } from '../utils/format.js';

const TABS = [
  { id: 'requests', label: 'Demandes reçues' },
  { id: 'listings', label: 'Mes annonces' },
  { id: 'stats', label: 'Statistiques' },
];

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('requests');
  const [properties, setProperties] = useState(null);
  const [requests, setRequests] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [markUnavailable, setMarkUnavailable] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(null);
  const { byRequest } = useUnread();

  const load = useCallback(async () => {
    setError('');
    try {
      const [p, r] = await Promise.all([api.myProperties(), api.ownerRequests()]);
      setProperties(p.items);
      setRequests(r.items);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    if (!properties || !requests) return null;
    return {
      listings: properties.length,
      available: properties.filter((p) => p.available).length,
      pending: requests.filter((r) => r.status === 'pending').length,
    };
  }, [properties, requests]);

  const visibleRequests = useMemo(
    () => (requests || []).filter((r) => !statusFilter || r.status === statusFilter),
    [requests, statusFilter]
  );

  const decide = async (request, status) => {
    setBusy(request._id);
    setError('');
    setNotice('');
    try {
      const res = await api.updateRequestStatus(request._id, status, markUnavailable);
      if (status === 'accepted') {
        setNotice(
          res.propertyUpdated
            ? `Demande acceptée. L’annonce est passée en indisponible${res.autoRejected ? ` et ${plural(res.autoRejected, 'autre demande a été refusée', 'autres demandes ont été refusées')}` : ''}.`
            : 'Demande acceptée. L’annonce reste visible.'
        );
      } else {
        setNotice('Demande refusée.');
      }
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const toggleAvailability = async (property) => {
    setBusy(property._id);
    try {
      const { property: updated } = await api.updateProperty(property._id, { available: !property.available });
      setProperties((list) => list.map((p) => (p._id === updated._id ? updated : p)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (property) => {
    if (!window.confirm(`Supprimer « ${property.title} » et les demandes associées ?`)) return;
    setBusy(property._id);
    try {
      await api.deleteProperty(property._id);
      await load();
      setNotice('Annonce supprimée.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="container page dashboard">
      <div className="dashboard-head">
        <div>
          <h1>Bonjour {user.firstName}</h1>
          <p className="muted">Vos annonces et les demandes des locataires, au même endroit.</p>
        </div>
        <Link to="/ajouter" className="btn btn-primary">Publier une annonce</Link>
      </div>

      {stats && (
        <dl className="stats">
          <div><dt>Annonces</dt><dd>{stats.listings}</dd></div>
          <div><dt>Disponibles</dt><dd>{stats.available}</dd></div>
          <div className={stats.pending ? 'is-hot' : ''}><dt>Demandes en attente</dt><dd>{stats.pending}</dd></div>
        </dl>
      )}

      <Alert type="success">{notice}</Alert>
      <Alert>{error}</Alert>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'is-active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!properties && !error && <Loader />}

      {tab === 'stats' && <OwnerStats />}

      {tab === 'requests' && requests && (
        <section>
          <div className="toolbar">
            <label className="field inline">
              <span>Statut</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="pending">En attente</option>
                <option value="accepted">Acceptées</option>
                <option value="rejected">Refusées</option>
                <option value="">Toutes</option>
              </select>
            </label>
            <label className="switch">
              <input type="checkbox" checked={markUnavailable} onChange={(e) => setMarkUnavailable(e.target.checked)} />
              <span>En acceptant, passer le logement en indisponible</span>
            </label>
          </div>

          {visibleRequests.length === 0 ? (
            <EmptyState title="Aucune demande dans cette catégorie">
              Les demandes des locataires apparaîtront ici dès leur envoi.
            </EmptyState>
          ) : (
            <ul className="request-list">
              {visibleRequests.map((r) => (
                <li key={r._id} className="request-item">
                  <div className="request-thumb">
                    <img src={resolveImage(r.property?.images?.[0])} alt="" onError={handleImgError} />
                  </div>
                  <div className="request-info">
                    <h3>
                      {r.tenant?.firstName} {r.tenant?.lastName}
                      <span className="muted"> pour </span>
                      {r.property ? <Link to={`/logement/${r.property._id}`}>{r.property.title}</Link> : 'une annonce supprimée'}
                    </h3>
                    <p>Entrée le {formatDate(r.startDate)}, pour {plural(r.duration, 'mois', 'mois')}.</p>
                    {r.message && <blockquote>{r.message}</blockquote>}
                    <p className="muted small">
                      {r.tenant?.phone}, {r.tenant?.email}. Reçue le {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <div className="request-actions">
                    <StatusBadge status={r.status} />
                    <Link to={`/messages/${r._id}`} className="btn btn-ghost btn-sm">
                      Messagerie{byRequest[r._id] ? ` (${byRequest[r._id]})` : ''}
                    </Link>
                    {r.status === 'pending' && (
                      <>
                        <button type="button" className="btn btn-success btn-sm" disabled={busy === r._id} onClick={() => decide(r, 'accepted')}>
                          Accepter
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" disabled={busy === r._id} onClick={() => decide(r, 'rejected')}>
                          Refuser
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'listings' && properties && (
        <section>
          {properties.length === 0 ? (
            <EmptyState title="Vous n’avez pas encore d’annonce" action={<Link className="btn btn-primary" to="/ajouter">Publier une annonce</Link>}>
              Votre première annonce apparaîtra ici avec ses demandes.
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Annonce</th>
                    <th scope="col">Loyer</th>
                    <th scope="col">Demandes</th>
                    <th scope="col">Disponibilité</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p) => {
                    const count = requests?.filter((r) => r.property?._id === p._id && r.status === 'pending').length || 0;
                    return (
                      <tr key={p._id}>
                        <td>
                          <Link to={`/logement/${p._id}`} className="table-title">{p.title}</Link>
                          <span className="muted small">{p.city}</span>
                        </td>
                        <td>{formatPrice(p.price)}</td>
                        <td>{count ? plural(count, 'en attente', 'en attente') : 'Aucune'}</td>
                        <td>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={p.available}
                              disabled={busy === p._id}
                              onChange={() => toggleAvailability(p)}
                            />
                            <span>{p.available ? 'Disponible' : 'Indisponible'}</span>
                          </label>
                        </td>
                        <td className="table-actions">
                          <Link to={`/modifier/${p._id}`} className="btn btn-ghost btn-sm">Modifier</Link>
                          <button type="button" className="btn btn-danger btn-sm" disabled={busy === p._id} onClick={() => remove(p)}>
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
