import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Alert, EmptyState, Loader } from '../components/Feedback.jsx';
import MapView from '../components/MapView.jsx';
import { RatingSummary } from '../components/Rating.jsx';
import RequestForm from '../components/RequestForm.jsx';
import Reviews from '../components/Reviews.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../hooks/useFavorites.js';
import { api } from '../services/api.js';
import {
  formatDate, formatPrice, handleImgError, plural, resolveImage, roomsLabel,
} from '../utils/format.js';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isTenant } = useAuth();
  const favorites = useFavorites();

  const [property, setProperty] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(
    (initial = false) =>
      api.getProperty(id).then((res) => {
        setProperty(res.property);
        setViewer(res.viewer);
        if (initial) setActiveImage(0);
      }),
    [id]
  );

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    load(true)
      .catch((err) => !ignore && setError(err.message))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [load, user?._id]);

  const area = useMemo(() => {
    const c = property?.location?.coordinates;
    return c ? { lat: c[1], lng: c[0], radius: 300 } : null;
  }, [property?.location]);

  if (loading) return <Loader />;
  if (error && !property) {
    return (
      <div className="container page">
        <EmptyState title="Annonce introuvable" action={<Link className="btn btn-dark" to="/">Voir les logements</Link>}>
          {error}
        </EmptyState>
      </div>
    );
  }

  const images = property.images?.length ? property.images.map(resolveImage) : [resolveImage()];
  const isOwner = viewer?.isOwner;
  const isFav = favorites.isFavorite(property._id);

  const handleDelete = async () => {
    if (!window.confirm('Supprimer définitivement cette annonce et les demandes associées ?')) return;
    try {
      await api.deleteProperty(property._id);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFavorite = async () => {
    try {
      const now = await favorites.toggle(property._id);
      setNotice(now ? 'Ajouté à vos favoris.' : 'Retiré de vos favoris.');
    } catch (err) {
      setError(err.message);
    }
  };

  const onRequestSent = (request) => {
    setViewer((v) => ({ ...v, activeRequest: request }));
    setNotice('Demande envoyée. Suivez sa réponse dans « Mes demandes ».');
  };

  return (
    <div className="container page detail">
      <Link to="/" className="back-link">Retour aux logements</Link>

      <div className="detail-gallery">
        <img className="detail-main" src={images[activeImage]} alt={property.title} onError={handleImgError} />
        {images.length > 1 && (
          <div className="detail-thumbs">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                className={i === activeImage ? 'is-active' : ''}
                onClick={() => setActiveImage(i)}
                aria-label={`Afficher la photo ${i + 1}`}
              >
                <img src={src} alt="" onError={handleImgError} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="detail-layout">
        <div className="detail-main-col">
          <div className="detail-title">
            <p className="muted">{property.type} à {property.city}</p>
            <h1>{property.title}</h1>
            <p className="muted">{property.address}</p>
            <RatingSummary average={property.ratingAverage} count={property.ratingCount} />
          </div>

          <p className="detail-price">
            {formatPrice(property.price)}
            <small>par mois</small>
          </p>

          <dl className="facts">
            <div><dt>Surface</dt><dd>{property.surface ? `${property.surface} m²` : 'Non précisée'}</dd></div>
            <div><dt>Chambres</dt><dd>{roomsLabel(property.bedrooms)}</dd></div>
            <div><dt>Salles de bain</dt><dd>{plural(property.bathrooms, 'salle', 'salles')}</dd></div>
            <div>
              <dt>Disponibilité</dt>
              <dd className={property.available ? 'ok' : 'ko'}>
                {property.available ? 'Disponible' : 'Déjà loué'}
              </dd>
            </div>
          </dl>

          <section>
            <h2>Description</h2>
            <p className="prose">{property.description}</p>
          </section>

          {property.amenities?.length > 0 && (
            <section>
              <h2>Équipements</h2>
              <ul className="chips">
                {property.amenities.map((a) => <li key={a} className="chip">{a}</li>)}
              </ul>
            </section>
          )}

          {area && (
            <section>
              <h2>Quartier</h2>
              <p className="muted small">
                {isOwner
                  ? 'Vous voyez la position exacte. Les visiteurs voient seulement cette zone approximative.'
                  : 'Zone approximative. L’adresse exacte est communiquée par le propriétaire.'}
              </p>
              <MapView circle={area} zoom={15} height={320} label="Localisation approximative du logement" />
            </section>
          )}

          <Reviews
            propertyId={property._id}
            average={property.ratingAverage}
            count={property.ratingCount}
            canReview={viewer?.canReview}
            myReview={viewer?.myReview}
            onChange={() => load().catch(() => {})}
          />
        </div>

        <aside className="detail-side">
          <Alert type="success">{notice}</Alert>
          <Alert>{error}</Alert>

          <div className="panel owner-panel">
            <h3>Propriétaire</h3>
            <p className="owner-name">{property.owner?.firstName} {property.owner?.lastName}</p>
            {property.owner?.phone ? (
              <p className="owner-contact">
                <a href={`tel:${property.owner.phone}`}>{property.owner.phone}</a>
                <a href={`mailto:${property.owner.email}`}>{property.owner.email}</a>
              </p>
            ) : (
              <p className="muted">
                <Link to="/connexion" state={{ from: location.pathname }}>Connectez-vous</Link> pour voir ses coordonnées.
              </p>
            )}
          </div>

          {isOwner && (
            <div className="panel">
              <h3>Votre annonce</h3>
              <div className="stack">
                <Link className="btn btn-dark btn-block" to={`/modifier/${property._id}`}>Modifier l’annonce</Link>
                <button type="button" className="btn btn-danger btn-block" onClick={handleDelete}>Supprimer l’annonce</button>
              </div>
            </div>
          )}

          {isTenant && (
            <>
              <button type="button" className={`btn btn-block ${isFav ? 'btn-fav-on' : 'btn-ghost'}`} onClick={handleFavorite}>
                {isFav ? 'Dans vos favoris' : 'Ajouter aux favoris'}
              </button>

              {viewer?.activeRequest ? (
                <div className="panel">
                  <h3>Votre demande</h3>
                  <p><StatusBadge status={viewer.activeRequest.status} /></p>
                  <p className="muted">
                    Entrée le {formatDate(viewer.activeRequest.startDate)}, pour {plural(viewer.activeRequest.duration, 'mois', 'mois')}.
                  </p>
                  <div className="stack">
                    <Link className="btn btn-dark btn-block" to={`/messages/${viewer.activeRequest._id}`}>
                      Écrire au propriétaire
                    </Link>
                    <Link to="/mes-demandes">Suivre mes demandes</Link>
                  </div>
                </div>
              ) : property.available ? (
                <div className="panel">
                  <RequestForm propertyId={property._id} onSent={onRequestSent} />
                </div>
              ) : (
                <div className="panel"><p className="muted">Ce logement n’accepte plus de demandes.</p></div>
              )}
            </>
          )}

          {!user && property.available && (
            <div className="panel">
              <h3>Ce logement vous intéresse ?</h3>
              <p className="muted">Créez un compte locataire pour envoyer une demande et enregistrer vos favoris.</p>
              <div className="stack">
                <Link className="btn btn-primary btn-block" to="/inscription">Créer un compte</Link>
                <Link className="btn btn-ghost btn-block" to="/connexion" state={{ from: location.pathname }}>Se connecter</Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
