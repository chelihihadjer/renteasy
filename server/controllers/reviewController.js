import Property from '../models/Property.js';
import RentalRequest from '../models/RentalRequest.js';
import Review from '../models/Review.js';
import { HttpError } from '../middleware/error.js';
import { refreshRating } from '../services/propertyService.js';
import { assertObjectId, str } from '../utils/helpers.js';

export async function listReviews(req, res) {
  assertObjectId(req.params.id, 'Identifiant de logement');
  const items = await Review.find({ property: req.params.id })
    .sort({ createdAt: -1 })
    .populate('tenant', 'firstName lastName');
  res.json({
    items: items.map((r) => {
      const data = r.toJSON();
      data.author = r.tenant ? `${r.tenant.firstName} ${r.tenant.lastName?.[0] || ''}.` : 'Ancien locataire';
      delete data.tenant;
      return data;
    }),
  });
}

export async function createReview(req, res) {
  assertObjectId(req.params.id, 'Identifiant de logement');
  const property = await Property.findById(req.params.id);
  if (!property) throw new HttpError(404, 'Logement introuvable');

  const stay = await RentalRequest.exists({
    property: property._id,
    tenant: req.user._id,
    status: 'accepted',
    startDate: { $lte: new Date() },
  });
  if (!stay) {
    throw new HttpError(403, 'Seul un locataire ayant séjourné dans ce logement peut laisser un avis');
  }
  if (await Review.exists({ property: property._id, tenant: req.user._id })) {
    throw new HttpError(409, 'Vous avez déjà laissé un avis sur ce logement');
  }

  const review = await Review.create({
    property: property._id,
    tenant: req.user._id,
    rating: Number(req.body?.rating),
    comment: str(req.body?.comment),
  });
  await refreshRating(property._id);
  res.status(201).json({ review });
}

export async function deleteMyReview(req, res) {
  assertObjectId(req.params.id, 'Identifiant de logement');
  const review = await Review.findOneAndDelete({ property: req.params.id, tenant: req.user._id });
  if (!review) throw new HttpError(404, 'Aucun avis à supprimer');
  await refreshRating(review.property);
  res.json({ message: 'Avis supprimé' });
}
