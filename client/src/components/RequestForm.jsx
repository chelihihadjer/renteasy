import { useState } from 'react';
import { api } from '../services/api.js';
import { todayISO } from '../utils/format.js';
import { Alert } from './Feedback.jsx';

export default function RequestForm({ propertyId, onSent }) {
  const [form, setForm] = useState({ startDate: '', duration: 12, message: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  const validate = () => {
    const e = {};
    if (!form.startDate) e.startDate = 'Choisissez une date de début';
    else if (form.startDate < todayISO()) e.startDate = 'La date doit être aujourd’hui ou plus tard';
    const d = Number(form.duration);
    if (!Number.isInteger(d) || d < 1 || d > 36) e.duration = 'Entre 1 et 36 mois';
    if (form.message.length > 1000) e.message = '1000 caractères maximum';
    return e;
  };

  const submit = async (event) => {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSending(true);
    setError('');
    try {
      const { request } = await api.sendRequest(propertyId, { ...form, duration: Number(form.duration) });
      onSent?.(request);
    } catch (err) {
      setErrors(err.details);
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="request-form" onSubmit={submit} noValidate>
      <h3>Demander à louer</h3>
      <Alert>{error}</Alert>

      <div className="field-row">
        <div className="field">
          <label htmlFor="r-start">Date d’entrée souhaitée</label>
          <input id="r-start" type="date" min={todayISO()} value={form.startDate} onChange={update('startDate')} />
          {errors.startDate && <p className="field-error">{errors.startDate}</p>}
        </div>
        <div className="field">
          <label htmlFor="r-duration">Durée (mois)</label>
          <input id="r-duration" type="number" min="1" max="36" value={form.duration} onChange={update('duration')} />
          {errors.duration && <p className="field-error">{errors.duration}</p>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="r-message">Message au propriétaire</label>
        <textarea
          id="r-message"
          rows="4"
          maxLength={1000}
          placeholder="Présentez-vous en quelques lignes : situation, nombre de personnes, disponibilités pour une visite."
          value={form.message}
          onChange={update('message')}
        />
        {errors.message && <p className="field-error">{errors.message}</p>}
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={sending}>
        {sending ? 'Envoi en cours…' : 'Envoyer la demande'}
      </button>
    </form>
  );
}
