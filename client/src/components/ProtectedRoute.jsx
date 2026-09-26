import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader } from './Feedback.jsx';

export const HOME_BY_ROLE = { owner: '/dashboard', admin: '/admin', tenant: '/' };

export default function ProtectedRoute({ role, children }) {
  const { user, checking, signedOut } = useAuth();
  const location = useLocation();

  if (checking) return <Loader label="Vérification de la session…" />;
  if (!user) {
    if (signedOut) return <Navigate to="/" replace />;
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }
  const allowed = !role || (Array.isArray(role) ? role : [role]).includes(user.role);
  if (!allowed) return <Navigate to={HOME_BY_ROLE[user.role] || '/'} replace />;
  return children;
}
