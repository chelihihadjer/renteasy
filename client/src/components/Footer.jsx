import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';

export default function Footer() {
  const { user, isOwner, isTenant } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="brand brand-light">
            <img src="/logo.svg" alt="" width="34" height="34" />
            RentEasy
          </Link>
          <p>
            La plateforme qui met en relation locataires et propriétaires, de la recherche
            jusqu’à la réponse à la demande.
          </p>
        </div>

        <nav aria-label="Explorer">
          <h2>Explorer</h2>
          <ul>
            <li><Link to="/">Tous les logements</Link></li>
            <li><Link to="/?view=map">Voir sur la carte</Link></li>
            <li><Link to="/?sort=price_asc">Petits loyers d’abord</Link></li>
          </ul>
        </nav>

        <nav aria-label="Mon espace">
          <h2>Mon espace</h2>
          <ul>
            {!user && (
              <>
                <li><Link to="/connexion">Se connecter</Link></li>
                <li><Link to="/inscription">Créer un compte</Link></li>
              </>
            )}
            {isTenant && (
              <>
                <li><Link to="/favoris">Mes favoris</Link></li>
                <li><Link to="/mes-demandes">Mes demandes</Link></li>
              </>
            )}
            {isOwner && (
              <>
                <li><Link to="/dashboard">Tableau de bord</Link></li>
                <li><Link to="/ajouter">Publier une annonce</Link></li>
              </>
            )}
            {user?.role === 'admin' && <li><Link to="/admin">Administration</Link></li>}
          </ul>
        </nav>

        <div>
          <h2>À propos</h2>
          <ul>
            <li>Location longue durée entre particuliers</li>
            <li>Contact direct avec le propriétaire</li>
            <li>Suivi de vos demandes en temps réel</li>
            <li>
              Cartes ©{' '}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {year} RentEasy. Tous droits réservés.</span>
        <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          Retour en haut
        </a>
      </div>
    </footer>
  );
}