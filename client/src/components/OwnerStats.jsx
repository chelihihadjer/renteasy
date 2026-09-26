import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../services/api.js';
import { formatPrice, formatRating, monthLabel } from '../utils/format.js';
import { Alert, Loader } from './Feedback.jsx';

function MonthlyChart({ months }) {
  const max = Math.max(1, ...months.map((m) => m.count));
  const w = 560;
  const h = 200;
  const pad = { top: 24, bottom: 28, side: 8 };
  const slot = (w - pad.side * 2) / months.length;
  const barW = Math.min(56, slot * 0.6);
  const plotH = h - pad.top - pad.bottom;

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-labelledby="chart-title chart-desc">
        <title id="chart-title">Demandes reçues par mois</title>
        <desc id="chart-desc">{months.map((m) => `${monthLabel(m.month)} : ${m.count}`).join(', ')}</desc>
        <line x1={pad.side} x2={w - pad.side} y1={h - pad.bottom} y2={h - pad.bottom} className="chart-axis" />
        {months.map((m, i) => {
          const barH = (m.count / max) * plotH;
          const x = pad.side + slot * i + (slot - barW) / 2;
          const y = h - pad.bottom - barH;
          const last = i === months.length - 1;
          return (
            <g key={m.month}>
              <rect x={x} y={y} width={barW} height={Math.max(barH, m.count ? 2 : 0)} rx="4" className={last ? 'bar bar-current' : 'bar'} />
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="chart-value">{m.count}</text>
              <text x={x + barW / 2} y={h - 8} textAnchor="middle" className="chart-label">{monthLabel(m.month)}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="muted small">Demandes reçues sur les six derniers mois, mois en cours en bleu.</figcaption>
    </figure>
  );
}

function StatusSplit({ status }) {
  const total = status.pending + status.accepted + status.rejected;
  if (!total) return <p className="muted">Aucune demande reçue pour l’instant.</p>;
  const parts = [
    { key: 'accepted', label: 'Acceptées', value: status.accepted },
    { key: 'pending', label: 'En attente', value: status.pending },
    { key: 'rejected', label: 'Refusées', value: status.rejected },
  ];
  return (
    <div>
      <div className="split-bar" role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(', ')}>
        {parts.map((p) => p.value > 0 && (
          <span key={p.key} className={`split-${p.key}`} style={{ flexGrow: p.value }} />
        ))}
      </div>
      <ul className="split-legend">
        {parts.map((p) => (
          <li key={p.key}><span className={`dot split-${p.key}`} aria-hidden="true" />{p.label} : {p.value}</li>
        ))}
      </ul>
    </div>
  );
}

export default function OwnerStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.ownerStats().then(setStats).catch((err) => setError(err.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!stats) return <Loader />;
  const { totals } = stats;

  return (
    <section className="owner-stats">
      <dl className="stats stats-4">
        <div><dt>Vues des annonces</dt><dd>{totals.views}</dd></div>
        <div><dt>Demandes reçues</dt><dd>{totals.requests}</dd></div>
        <div>
          <dt>Taux d’acceptation</dt>
          <dd className={totals.acceptanceRate === null ? 'dd-small' : ''}>
            {totals.acceptanceRate === null ? 'Aucune décision' : `${totals.acceptanceRate} %`}
          </dd>
        </div>
        <div><dt>Loyer moyen</dt><dd className="dd-small">{formatPrice(totals.averageRent)}</dd></div>
      </dl>

      <div className="stats-grid">
        <div className="panel"><MonthlyChart months={stats.months} /></div>
        <div className="panel">
          <h3>Répartition des demandes</h3>
          <StatusSplit status={stats.status} />
        </div>
      </div>

      <h3 className="section-title">Performance par annonce</h3>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Annonce</th>
              <th scope="col">Vues</th>
              <th scope="col">Demandes</th>
              <th scope="col">Transformation</th>
              <th scope="col">Note</th>
            </tr>
          </thead>
          <tbody>
            {stats.listings.map((l) => (
              <tr key={l._id}>
                <td>
                  <Link to={`/logement/${l._id}`} className="table-title">{l.title}</Link>
                  <span className="muted small">{l.city}{l.available ? '' : ', indisponible'}</span>
                </td>
                <td>{l.views}</td>
                <td>{l.requests}{l.pending ? ` (${l.pending} en attente)` : ''}</td>
                <td>{l.views ? `${Math.round((l.requests / l.views) * 100)} %` : 'Pas encore de vue'}</td>
                <td>{l.ratingCount ? `${formatRating(l.ratingAverage)} sur 5 (${l.ratingCount})` : 'Aucun avis'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small">La transformation rapporte le nombre de demandes au nombre de consultations de l’annonce.</p>
    </section>
  );
}
