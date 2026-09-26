import { formatRating } from '../utils/format.js';

export function Stars({ value = 0, size = 'md' }) {
  const rounded = Math.round(value);
  return (
    <span className={`stars stars-${size}`} role="img" aria-label={`${formatRating(value) || 0} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} aria-hidden="true" className={i <= rounded ? 'on' : ''}>★</span>
      ))}
    </span>
  );
}

export function RatingSummary({ average, count }) {
  if (!count) return null;
  return (
    <span className="rating-summary">
      <Stars value={average} size="sm" />
      <span>{formatRating(average)} ({count} avis)</span>
    </span>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <fieldset className="star-input">
      <legend className="sr-only">Note sur 5</legend>
      {[1, 2, 3, 4, 5].map((i) => (
        <label key={i} className={i <= value ? 'on' : ''}>
          <input type="radio" name="rating" value={i} checked={value === i} onChange={() => onChange(i)} />
          <span aria-hidden="true">★</span>
          <span className="sr-only">{i} sur 5</span>
        </label>
      ))}
    </fieldset>
  );
}
