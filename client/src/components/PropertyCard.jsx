import { Link } from 'react-router';
import { formatPrice, handleImgError, resolveImage, roomsLabel } from '../utils/format.js';
import { RatingSummary } from './Rating.jsx';

export default function PropertyCard({ property, isFavorite, onToggleFavorite, showStatus = false }) {
  const {
    _id, title, city, price, type, bedrooms, surface, images, available, ratingAverage, ratingCount,
  } = property;

  return (
    <article className="card">
      <Link to={`/logement/${_id}`} className="card-media">
        <img src={resolveImage(images?.[0])} alt="" loading="lazy" onError={handleImgError} />
        <span className="price-tag">
          {formatPrice(price)}
          <small>/ mois</small>
        </span>
        {showStatus && !available && <span className="card-flag">Indisponible</span>}
      </Link>

      <div className="card-body">
        <div className="card-heading">
          <h3>
            <Link to={`/logement/${_id}`}>{title}</Link>
          </h3>
          {onToggleFavorite && (
            <button
              type="button"
              className={`fav-btn ${isFavorite ? 'is-active' : ''}`}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              onClick={() => onToggleFavorite(_id)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.5 1.2 4.2 2.4.7-1.2 2.1-2.4 4.2-2.4 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" />
              </svg>
            </button>
          )}
        </div>
        <p className="card-city">
          {city}
          <RatingSummary average={ratingAverage} count={ratingCount} />
        </p>
        <ul className="card-facts">
          <li>{type}</li>
          <li>{roomsLabel(bedrooms)}</li>
          {surface ? <li>{surface} m²</li> : null}
        </ul>
      </div>
    </article>
  );
}
