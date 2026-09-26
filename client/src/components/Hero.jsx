import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import SearchBar from './SearchBar.jsx';

const CITIES = ['Constantine', 'Alger', 'Oran', 'Batna', 'Sétif'];

export default function Hero({ query = '', onSearch }) {
  const { user, isOwner } = useAuth();

  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-text">
          <p className="hero-eyebrow">Location immobilière entre particuliers</p>
          <h1>Un logement à louer, sans détour.</h1>
          <p className="hero-sub">
            Comparez les annonces, gardez vos coups de cœur et écrivez directement au propriétaire.
          </p>

          <SearchBar value={query} onSearch={onSearch} />

          <div className="hero-cities">
            <span>Recherches rapides :</span>
            {CITIES.map((city) => (
              <button key={city} type="button" className="city-chip" onClick={() => onSearch(city)}>
                {city}
              </button>
            ))}
          </div>

          {!user && (
            <p className="hero-cta">
              Vous êtes propriétaire ? <Link to="/inscription">Publiez votre annonce gratuitement</Link>
            </p>
          )}
          {isOwner && (
            <p className="hero-cta">
              <Link to="/ajouter">Publier une nouvelle annonce</Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}