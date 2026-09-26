import mongoose from 'mongoose';
import { HttpError } from '../middleware/error.js';

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const str = (v) => (typeof v === 'string' ? v.trim() : '');

export function assertObjectId(id, label = 'Identifiant') {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, `${label} invalide`);
}

const PROPERTY_FIELDS = [
  'title', 'description', 'price', 'city', 'address', 'type',
  'surface', 'bedrooms', 'bathrooms', 'images', 'amenities', 'available',
];

const toList = (v) =>
  (Array.isArray(v) ? v : String(v).split(/[\n,]/))
    .map((s) => String(s).trim())
    .filter(Boolean);

export function pickPropertyFields(body = {}) {
  const data = {};
  for (const field of PROPERTY_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  if (data.images !== undefined) data.images = toList(data.images);
  if (data.amenities !== undefined) data.amenities = [...new Set(toList(data.amenities))];
  if (data.surface === '' || data.surface === null) data.surface = undefined;

  if (body.lat !== undefined || body.lng !== undefined) {
    const empty = (v) => v === '' || v === null || v === undefined;
    if (empty(body.lat) && empty(body.lng)) {
      data.location = undefined;
    } else {
      const lat = Number(body.lat);
      const lng = Number(body.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        throw new HttpError(400, 'Données invalides', { location: 'Latitude ou longitude invalide' });
      }
      data.location = { type: 'Point', coordinates: [lng, lat] };
    }
  }
  return data;
}

export function approximateLocation(location) {
  if (!location?.coordinates) return location;
  const [lng, lat] = location.coordinates;
  return { type: 'Point', coordinates: [Number(lng.toFixed(3)), Number(lat.toFixed(3))] };
}
