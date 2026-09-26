import Property from '../models/Property.js';
import User from '../models/User.js';
import { HttpError } from '../middleware/error.js';
import { assertObjectId } from '../utils/helpers.js';

export function profile(req, res) {
  res.json({ user: req.user });
}

export async function getFavorites(req, res) {
  const user = await User.findById(req.user._id).populate('favorites');
  res.json({ items: user.favorites.filter(Boolean) });
}

async function ensureProperty(id) {
  assertObjectId(id, 'Identifiant de logement');
  if (!(await Property.exists({ _id: id }))) throw new HttpError(404, 'Logement introuvable');
}

async function setFavorite(user, propertyId, add) {
  const update = add ? { $addToSet: { favorites: propertyId } } : { $pull: { favorites: propertyId } };
  await User.updateOne({ _id: user._id }, update);
  const updated = await User.findById(user._id).select('favorites');
  return { isFavorite: add, favorites: updated.favorites };
}

export async function toggleFavorite(req, res) {
  const { propertyId } = req.params;
  await ensureProperty(propertyId);
  const isFavorite = req.user.favorites.some((f) => f.equals(propertyId));
  res.json(await setFavorite(req.user, propertyId, !isFavorite));
}

export async function addFavorite(req, res) {
  await ensureProperty(req.params.propertyId);
  res.json(await setFavorite(req.user, req.params.propertyId, true));
}

export async function removeFavorite(req, res) {
  assertObjectId(req.params.propertyId, 'Identifiant de logement');
  res.json(await setFavorite(req.user, req.params.propertyId, false));
}
