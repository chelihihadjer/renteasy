import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Alert, EmptyState, Loader } from '../components/Feedback.jsx';
import { api } from '../services/api.js';
import { formatDate, formatPrice } from '../utils/format.js';

const ROLE_LABELS = { tenant: 'Locataire', owner: 'Propriétaire', admin: 'Administrateur' };

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AdminPanel() {
  const [tab, setTab] = useState('properties');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState(null);
  const [properties, setProperties] = useState(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const q = useDebounced(search);

  const loadOverview = useCallback(() => api.adminOverview().then(setOverview).catch(() => {}), []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    setError('');
    if (tab === 'users') {
      api.adminUsers({ q, role }).then(({ items }) => setUsers(items)).catch((err) => setError(err.message));
    } else {
      api.adminProperties({ q }).then(({ items }) => setProperties(items)).catch((err) => setError(err.message));
    }
  }, [tab, q, role]);

  const remove = async (property) => {
    const ok = window.confirm(
      `Retirer « ${property.title} » ? L’annonce, ses demandes, ses messages et ses avis seront supprimés définitivement.`
    );
    if (!ok) return;
    try {
      await api.adminRemoveProperty(property._id);
      setProperties((list) => list.filter((p) => p._id !== property._id));
      setNotice(`Annonce « ${property.title} » retirée.`);
      loadOverview();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container page dashboard">
      <h1>Administration</h1>
      <p className="muted">Modération des annonces et vue d’ensemble des comptes.</p>

      {overview && (
        <dl className="stats stats-4">
          <div><dt>Locataires</dt><dd>{overview.tenants}</dd></div>
          <div><dt>Propriétaires</dt><dd>{overview.owners}</dd></div>
          <div><dt>Annonces (disponibles)</dt><dd>{overview.listings} <small>({overview.available})</small></dd></div>
          <div><dt>Demandes en attente</dt><dd>{overview.pending}</dd></div>
        </dl>
      )}

      <Alert type="success">{notice}</Alert>
      <Alert>{error}</Alert>

      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'properties'} className={tab === 'properties' ? 'is-active' : ''} onClick={() => setTab('properties')}>
          Annonces
        </button>
        <button type="button" role="tab" aria-selected={tab === 'users'} className={tab === 'users' ? 'is-active' : ''} onClick={() => setTab('users')}>
          Utilisateurs
        </button>
      </div>

      <div className="toolbar">
        <label className="field inline grow">
          <span>Rechercher</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'users' ? 'Nom ou email' : 'Titre ou ville'}
          />
        </label>
        {tab === 'users' && (
          <label className="field inline">
            <span>Rôle</span>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Tous</option>
              <option value="tenant">Locataires</option>
              <option value="owner">Propriétaires</option>
              <option value="admin">Administrateurs</option>
            </select>
          </label>
        )}
      </div>

      {tab === 'properties' && (!properties ? <Loader /> : properties.length === 0 ? (
        <EmptyState title="Aucune annonce trouvée" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Annonce</th>
                <th scope="col">Propriétaire</th>
                <th scope="col">Loyer</th>
                <th scope="col">Publiée le</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p._id}>
                  <td>
                    <Link to={`/logement/${p._id}`} className="table-title">{p.title}</Link>
                    <span className="muted small">{p.city}{p.available ? '' : ', indisponible'}</span>
                  </td>
                  <td>
                    {p.owner ? `${p.owner.firstName} ${p.owner.lastName}` : 'Compte supprimé'}
                    <span className="muted small block">{p.owner?.email}</span>
                  </td>
                  <td>{formatPrice(p.price)}</td>
                  <td>{formatDate(p.createdAt)}</td>
                  <td className="table-actions">
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(p)}>Retirer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {tab === 'users' && (!users ? <Loader /> : users.length === 0 ? (
        <EmptyState title="Aucun utilisateur trouvé" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Nom</th>
                <th scope="col">Contact</th>
                <th scope="col">Rôle</th>
                <th scope="col">Annonces</th>
                <th scope="col">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="table-title">{u.firstName} {u.lastName}</td>
                  <td>{u.email}<span className="muted small block">{u.phone}</span></td>
                  <td>{ROLE_LABELS[u.role]}</td>
                  <td>{u.role === 'owner' ? u.listings : ''}</td>
                  <td>{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
