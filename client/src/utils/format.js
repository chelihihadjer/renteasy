import { API_ORIGIN } from '../services/api.js';

const money = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export const formatPrice = (value) => `${money.format(value ?? 0)} DA`;
export const formatDate = (value) => (value ? date.format(new Date(value)) : '');
export const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

export const roomsLabel = (bedrooms) =>
  bedrooms === 0 ? 'Sans chambre séparée' : plural(bedrooms, 'chambre', 'chambres');

export const STATUS_LABELS = {
  pending: 'En attente',
  accepted: 'Acceptée',
  rejected: 'Refusée',
};

export const PROPERTY_TYPES = ['Appartement', 'Maison', 'Studio', 'Villa', 'Duplex', 'Chambre'];

export const COMMON_AMENITIES = [
  'Wi-Fi', 'Climatisation', 'Chauffage', 'Parking', 'Ascenseur',
  'Meublé', 'Balcon', 'Terrasse', 'Jardin', 'Piscine', 'Gardiennage',
];

export const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export const PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#E4E9F2"/><path d="M200 95 120 160h22v60h40v-40h36v40h40v-60h22z" fill="#B7C2D6"/></svg>'
  );

export const handleImgError = (event) => {
  if (event.currentTarget.src !== PLACEHOLDER_IMG) event.currentTarget.src = PLACEHOLDER_IMG;
};

export const resolveImage = (url) => {
  if (!url) return PLACEHOLDER_IMG;
  return url.startsWith('/uploads/') ? `${API_ORIGIN}${url}` : url;
};

export const formatRating = (value) => (value ? value.toFixed(1).replace('.', ',') : '');

export const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(y, m - 1, 1));
};

export const formatTime = (value) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));

export const DEFAULT_CENTER = [35.9, 4.5];
