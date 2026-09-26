import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { Alert } from '../components/Feedback.jsx';
import { HOME_BY_ROLE } from '../components/ProtectedRoute.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (user) {
    const target = location.state?.from || HOME_BY_ROLE[user.role] || '/';
    return <Navigate to={target} replace />;
  }

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError('Saisissez votre email et votre mot de passe.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await login(form.email.trim(), form.password);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="container auth-page">
      <div className="auth-card">
        <h1>Se connecter</h1>
        <p className="muted">Pas encore de compte ? <Link to="/inscription">Créer un compte</Link></p>
        <Alert>{error}</Alert>

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" value={form.email} onChange={update('email')} />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input id="password" type="password" autoComplete="current-password" value={form.password} onChange={update('password')} />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={saving}>
            {saving ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
