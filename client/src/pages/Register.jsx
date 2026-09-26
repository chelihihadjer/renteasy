import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import { Alert } from '../components/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = [
  { value: 'tenant', title: 'Je cherche un logement', text: 'Enregistrez des favoris et envoyez des demandes de location.' },
  { value: 'owner', title: 'Je loue un bien', text: 'Publiez vos annonces et répondez aux demandes reçues.' },
];

export default function Register() {
  const { user, register } = useAuth();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '', role: 'tenant',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (user) return <Navigate to={user.role === 'owner' ? '/dashboard' : '/'} replace />;

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Le prénom est obligatoire';
    if (!form.lastName.trim()) e.lastName = 'Le nom est obligatoire';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Email invalide';
    if (!/^\+?[0-9\s.-]{8,20}$/.test(form.phone.trim())) e.phone = 'Numéro invalide, par exemple 0550 12 34 56';
    if (form.password.length < 8) e.password = '8 caractères minimum';
    if (form.confirm !== form.password) e.confirm = 'Les mots de passe ne correspondent pas';
    return e;
  };

  const submit = async (event) => {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      delete payload.confirm;
      await register(payload);
    } catch (err) {
      setErrors(err.details || {});
      setError(err.message);
      setSaving(false);
    }
  };

  const fieldError = (name) => errors[name] && <p className="field-error">{errors[name]}</p>;

  return (
    <div className="container auth-page">
      <div className="auth-card auth-card-wide">
        <h1>Créer un compte</h1>
        <p className="muted">Déjà inscrit ? <Link to="/connexion">Se connecter</Link></p>
        <Alert>{error}</Alert>

        <form onSubmit={submit} noValidate>
          <fieldset className="role-picker">
            <legend>Type de compte</legend>
            {ROLES.map((r) => (
              <label key={r.value} className={`role-option ${form.role === r.value ? 'is-on' : ''}`}>
                <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={update('role')} />
                <strong>{r.title}</strong>
                <span>{r.text}</span>
              </label>
            ))}
          </fieldset>

          <div className="field-row">
            <div className="field">
              <label htmlFor="firstName">Prénom</label>
              <input id="firstName" autoComplete="given-name" value={form.firstName} onChange={update('firstName')} />
              {fieldError('firstName')}
            </div>
            <div className="field">
              <label htmlFor="lastName">Nom</label>
              <input id="lastName" autoComplete="family-name" value={form.lastName} onChange={update('lastName')} />
              {fieldError('lastName')}
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" value={form.email} onChange={update('email')} />
              {fieldError('email')}
            </div>
            <div className="field">
              <label htmlFor="phone">Téléphone</label>
              <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={update('phone')} />
              {fieldError('phone')}
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="password">Mot de passe</label>
              <input id="password" type="password" autoComplete="new-password" value={form.password} onChange={update('password')} />
              {fieldError('password')}
            </div>
            <div className="field">
              <label htmlFor="confirm">Confirmer le mot de passe</label>
              <input id="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={update('confirm')} />
              {fieldError('confirm')}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={saving}>
            {saving ? 'Création du compte…' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
