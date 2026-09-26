import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import Filters from '../components/Filters.jsx';
import { Alert, EmptyState, Loader } from '../components/Feedback.jsx';
import MapView from '../components/MapView.jsx';
import Pagination from '../components/Pagination.jsx';
import PropertyCard from '../components/PropertyCard.jsx';
import Hero from '../components/Hero.jsx';
import { useFavorites } from '../hooks/useFavorites.js';
import { api } from '../services/api.js';
import { plural } from '../utils/format.js';

const FILTER_KEYS = ['type', 'maxPrice', 'bedrooms', 'sort'];
const RADII = [2, 5, 10, 25, 50];
const shortPrice = (p) => (p >= 1000 ? `${Math.round(p / 1000)} k` : String(p));

export default function Home() {
  const [params, setParams] = useSearchParams();
  const query = useMemo(() => Object.fromEntries(params.entries()), [params]);
  const view = query.view === 'map' ? 'map' : 'list';
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [geoMessage, setGeoMessage] = useState('');
  const mapCenter = useRef(null);
  const favorites = useFavorites();

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    const apiQuery = { ...query };
    delete apiQuery.view;
    const request = view === 'map' ? { ...apiQuery, page: 1, limit: 100 } : { ...apiQuery, limit: 12 };
    api
      .listProperties(request)
      .then((res) => !ignore && setData(res))
      .catch((err) => !ignore && setError(err.message))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [query, view]);

  const updateParams = (patch) => {
    const next = { ...query, ...patch, page: patch.page ?? '' };
    Object.keys(next).forEach((k) => (next[k] === '' || next[k] == null) && delete next[k]);
    setParams(next);
  };

  const filterValues = useMemo(
    () => Object.fromEntries(FILTER_KEYS.map((k) => [k, query[k] || ''])),
    [query]
  );

  const handleFavorite = async (id) => {
    try {
      await favorites.toggle(id);
    } catch (err) {
      setError(err.message);
    }
  };

  const searchAround = (lat, lng) =>
    updateParams({ near: `${lat.toFixed(4)},${lng.toFixed(4)}`, radius: query.radius || '10', view: 'map' });

  const aroundMe = () => {
    setGeoMessage('');
    if (!navigator.geolocation) {
      setGeoMessage('La géolocalisation n’est pas disponible sur ce navigateur.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => searchAround(pos.coords.latitude, pos.coords.longitude),
      () => setGeoMessage('Position refusée. Autorisez la localisation ou déplacez la carte puis cherchez dans cette zone.'),
      { timeout: 10000 }
    );
  };

  const markers = useMemo(
    () =>
      data.items
        .filter((p) => p.location?.coordinates)
        .map((p) => ({
          id: p._id,
          lat: p.location.coordinates[1],
          lng: p.location.coordinates[0],
          label: shortPrice(p.price),
          title: p.title,
          active: p._id === selectedId,
        })),
    [data.items, selectedId]
  );

  const zone = useMemo(() => {
    const [lat, lng] = (query.near || '').split(',').map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, radius: (Number(query.radius) || 10) * 1000 };
  }, [query.near, query.radius]);

  const selected = data.items.find((p) => p._id === selectedId);
  const unlocated = data.items.length - markers.length;
  const hasCriteria = Boolean(query.q || query.near || FILTER_KEYS.some((k) => k !== 'sort' && query[k]));

  const cards = (items) => (
    <div className="grid">
      {items.map((p) => (
        <PropertyCard
          key={p._id}
          property={p}
          isFavorite={favorites.isFavorite(p._id)}
          onToggleFavorite={favorites.enabled ? handleFavorite : undefined}
        />
      ))}
    </div>
  );

  return (
    <>
      <Hero query={query.q || ''} onSearch={(q) => updateParams({ q })} />

      <section className="container listing">
        <Filters values={filterValues} onApply={(values) => updateParams(values)} />

        <div className="listing-head">
          <div>
            <h2>
              {loading ? 'Recherche…' : plural(data.total, 'logement disponible', 'logements disponibles')}
            </h2>
            {query.q && <p className="muted">pour « {query.q} »</p>}
            {zone && (
              <p className="zone-note">
                Dans un rayon de {query.radius || 10} km
                <button type="button" className="link-btn" onClick={() => updateParams({ near: '', radius: '' })}>
                  Retirer la zone
                </button>
              </p>
            )}
          </div>
          <div className="view-switch" role="group" aria-label="Affichage">
            <button type="button" aria-pressed={view === 'list'} onClick={() => updateParams({ view: '' })}>Liste</button>
            <button type="button" aria-pressed={view === 'map'} onClick={() => updateParams({ view: 'map' })}>Carte</button>
          </div>
        </div>

        <Alert>{error}</Alert>
        <Alert type="info">{geoMessage}</Alert>

        {view === 'map' && (
          <div className="map-layout">
            <div className="geo-bar">
              <button type="button" className="btn btn-dark btn-sm" onClick={aroundMe}>Autour de moi</button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => mapCenter.current && searchAround(mapCenter.current.lat, mapCenter.current.lng)}
              >
                Chercher dans cette zone
              </button>
              <label className="field inline">
                <span>Rayon</span>
                <select value={query.radius || '10'} onChange={(e) => updateParams({ radius: e.target.value, view: 'map' })}>
                  {RADII.map((r) => <option key={r} value={r}>{r} km</option>)}
                </select>
              </label>
            </div>
            <MapView
              markers={markers}
              circle={zone}
              zoom={zone ? 12 : 6}
              onSelect={setSelectedId}
              onMoveEnd={(lat, lng) => { mapCenter.current = { lat, lng }; }}
              height={520}
              label="Carte des logements"
            />
            {unlocated > 0 && !loading && (
              <p className="muted small">
                {unlocated > 1
                  ? `${unlocated} annonces ne sont pas localisées et n’apparaissent pas sur la carte.`
                  : 'Une annonce n’est pas localisée et n’apparaît pas sur la carte.'}
              </p>
            )}
            {selected && <div className="map-selected">{cards([selected])}</div>}
          </div>
        )}

        {view === 'list' && (
          <>
            {loading ? (
              <Loader />
            ) : error ? null : data.items.length === 0 ? (
              <EmptyState title="Aucun logement ne correspond">
                {hasCriteria
                  ? 'Élargissez le loyer maximum, le rayon ou retirez un filtre pour voir plus d’annonces.'
                  : 'Aucune annonce n’est encore publiée.'}
              </EmptyState>
            ) : (
              cards(data.items)
            )}
            <Pagination page={data.page} pages={data.pages} onChange={(page) => updateParams({ page: String(page) })} />
          </>
        )}
      </section>
    </>
  );
}
