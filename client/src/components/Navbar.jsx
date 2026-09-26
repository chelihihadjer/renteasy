import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useUnread } from '../hooks/useUnread.js';

const ROLE_LABELS = { owner: 'Propriétaire', tenant: 'Locataire', admin: 'Administration' };

function Badge({ count }) {
  if (!count) return null;
  return (
    <span className="nav-badge">
      {count}
      <span className="sr-only"> message{count > 1 ? 's' : ''} non lu{count > 1 ? 's' : ''}</span>
    </span>
  );
}

export default function Navbar() {
  const { user, isOwner, isTenant, logout } = useAuth();
  const { total: unread } = useUnread();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    close();
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={close}>
          <img src="/logo.svg" alt="" width="34" height="34" />
          RentEasy
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
          <Badge count={unread} />
        </button>

        <nav id="main-nav" className={`nav-links ${open ? 'is-open' : ''}`}>
          <NavLink to="/" end onClick={close}>Logements</NavLink>

          {isTenant && (
            <>
              <NavLink to="/favoris" onClick={close}>Mes favoris</NavLink>
              <NavLink to="/mes-demandes" onClick={close}>
                Mes demandes <Badge count={unread} />
              </NavLink>
            </>
          )}

          {isOwner && (
            <>
              <NavLink to="/dashboard" onClick={close}>
                Tableau de bord <Badge count={unread} />
              </NavLink>
              <NavLink to="/ajouter" onClick={close} className="nav-cta">Publier une annonce</NavLink>
            </>
          )}

          {isAdmin && <NavLink to="/admin" onClick={close}>Administration</NavLink>}

          {user ? (
            <div className="nav-user">
              <span className="nav-user-name">
                {user.firstName}
                <small>{ROLE_LABELS[user.role]}</small>
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Se déconnecter
              </button>
            </div>
          ) : (
            <>
              <NavLink to="/connexion" onClick={close}>Se connecter</NavLink>
              <NavLink to="/inscription" onClick={close} className="nav-cta">Créer un compte</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
