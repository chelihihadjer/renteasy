import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { formatDate } from '../utils/format.js';
import { Alert } from './Feedback.jsx';
import { RatingSummary, StarInput, Stars } from './Rating.jsx';

export default function Reviews({ propertyId, average, count, canReview, myReview, onChange }) {
  const [items, setItems] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.reviews(propertyId).then(({ items: list }) => setItems(list)).catch(() => {});

  useEffect(() => {
    load();
  }, [propertyId]);

  const submit = async (event) => {
    event.preventDefault();
    if (!rating) {
      setError('Choisissez une note de 1 à 5.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.addReview(propertyId, { rating, comment });
      setComment('');
      setRating(0);
      await load();
      onChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeMine = async () => {
    if (!window.confirm('Supprimer votre avis ?')) return;
    try {
      await api.deleteMyReview(propertyId);
      await load();
      onChange?.();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="reviews">
      <div className="reviews-head">
        <h2>Avis des locataires</h2>
        <RatingSummary average={average} count={count} />
      </div>

      <Alert>{error}</Alert>

      {canReview && (
        <form className="panel review-form" onSubmit={submit}>
          <h3>Votre séjour s’est bien passé ?</h3>
          <StarInput value={rating} onChange={setRating} />
          <div className="field">
            <label htmlFor="review-comment">Commentaire (facultatif)</label>
            <textarea
              id="review-comment"
              rows="3"
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="État du logement, réactivité du propriétaire, quartier…"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Publication…' : 'Publier mon avis'}
          </button>
        </form>
      )}

      {myReview && (
        <p className="muted small">
          Vous avez noté ce logement {myReview.rating} sur 5.{' '}
          <button type="button" className="link-btn" onClick={removeMine}>Supprimer mon avis</button>
        </p>
      )}

      {items.length === 0 ? (
        <p className="muted">Pas encore d’avis. Seuls les locataires ayant séjourné ici peuvent en laisser un.</p>
      ) : (
        <ul className="review-list">
          {items.map((r) => (
            <li key={r._id}>
              <div className="review-meta">
                <Stars value={r.rating} size="sm" />
                <strong>{r.author}</strong>
                <span className="muted small">{formatDate(r.createdAt)}</span>
              </div>
              {r.comment && <p>{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
