import { useEffect, useState } from 'react';
import { PROPERTY_TYPES } from '../utils/format.js';

const EMPTY = { type: '', maxPrice: '', bedrooms: '', sort: 'recent' };

export default function Filters({ values, onApply }) {
  const [draft, setDraft] = useState({ ...EMPTY, ...values });
  useEffect(() => {
  setDraft({ ...EMPTY, ...values });
}, [values]);

  const update = (field) => (event) => setDraft((d) => ({ ...d, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    onApply(draft);
  };

  const reset = () => {
    setDraft(EMPTY);
    onApply(EMPTY);
  };

  return (
    <form className="filters" onSubmit={submit}>
      <div className="field">
        <label htmlFor="f-type">Type</label>
        <select id="f-type" value={draft.type} onChange={update('type')}>
          <option value="">Tous les types</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="f-price">Loyer maximum (DA)</label>
        <input
          id="f-price"
          type="number"
          min="0"
          step="1000"
          inputMode="numeric"
          placeholder="Sans limite"
          value={draft.maxPrice}
          onChange={update('maxPrice')}
        />
      </div>

      <div className="field">
        <label htmlFor="f-rooms">Chambres</label>
        <select id="f-rooms" value={draft.bedrooms} onChange={update('bedrooms')}>
          <option value="">Indifférent</option>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>{n} ou plus</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="f-sort">Trier par</label>
        <select id="f-sort" value={draft.sort} onChange={update('sort')}>
          <option value="recent">Plus récents</option>
          <option value="price_asc">Loyer croissant</option>
          <option value="price_desc">Loyer décroissant</option>
          <option value="rating">Mieux notés</option>
        </select>
      </div>

      <div className="filters-actions">
        <button type="submit" className="btn btn-dark">Filtrer</button>
        <button type="button" className="btn btn-ghost" onClick={reset}>Réinitialiser</button>
      </div>
    </form>
  );
}
