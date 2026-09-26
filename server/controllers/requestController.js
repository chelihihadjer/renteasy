import Message from '../models/Message.js';
import Property from '../models/Property.js';
import RentalRequest from '../models/RentalRequest.js';
import { HttpError } from '../middleware/error.js';
import { assertObjectId, str } from '../utils/helpers.js';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function createRequest(req, res) {
  const body = req.body ?? {};
  const propertyId = req.params.propertyId || str(body.propertyId);
  assertObjectId(propertyId, 'Identifiant de logement');

  const property = await Property.findById(propertyId);
  if (!property) throw new HttpError(404, 'Logement introuvable');
  if (!property.available) throw new HttpError(409, "Ce logement n'est plus disponible");
  if (property.owner.equals(req.user._id)) {
    throw new HttpError(403, 'Vous ne pouvez pas louer votre propre logement');
  }

  const active = await RentalRequest.exists({
    property: property._id,
    tenant: req.user._id,
    status: { $in: ['pending', 'accepted'] },
  });
  if (active) throw new HttpError(409, 'Vous avez déjà une demande active pour ce logement');

  const errors = {};
  const startDate = new Date(str(body.startDate));
  if (Number.isNaN(startDate.getTime())) errors.startDate = 'Date de début invalide';
  else if (startDate < startOfToday()) errors.startDate = 'La date de début doit être aujourd’hui ou plus tard';
  const duration = Number(body.duration);
  if (!Number.isInteger(duration) || duration < 1 || duration > 36) {
    errors.duration = 'La durée doit être comprise entre 1 et 36 mois';
  }
  const message = str(body.message);
  if (message.length > 1000) errors.message = 'Message trop long (1000 caractères max)';
  if (Object.keys(errors).length) throw new HttpError(400, 'Données invalides', errors);

  const request = await RentalRequest.create({
    property: property._id,
    tenant: req.user._id,
    owner: property.owner,
    startDate,
    duration,
    message,
  });
  res.status(201).json({ request });
}

export async function myRequests(req, res) {
  const items = await RentalRequest.find({ tenant: req.user._id })
    .sort({ createdAt: -1 })
    .populate('property', 'title city price images available')
    .populate('owner', 'firstName lastName');
  res.json({ items });
}

export async function ownerRequests(req, res) {
  const filter = { owner: req.user._id };
  const status = str(req.query.status);
  if (['pending', 'accepted', 'rejected'].includes(status)) filter.status = status;

  const items = await RentalRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate('property', 'title city price images available')
    .populate('tenant', 'firstName lastName email phone');
  res.json({ items });
}

export async function updateRequestStatus(req, res) {
  assertObjectId(req.params.id, 'Identifiant de demande');
  const status = str(req.body?.status);
  if (!['accepted', 'rejected'].includes(status)) {
    throw new HttpError(400, 'Statut invalide : accepted ou rejected attendu');
  }

  const request = await RentalRequest.findById(req.params.id);
  if (!request) throw new HttpError(404, 'Demande introuvable');
  if (!request.owner.equals(req.user._id)) {
    throw new HttpError(403, 'Cette demande ne concerne pas vos annonces');
  }
  if (request.status !== 'pending') throw new HttpError(409, 'Cette demande a déjà été traitée');

  request.status = status;
  await request.save();

  let autoRejected = 0;
  let propertyUpdated = false;
  if (status === 'accepted' && req.body?.markUnavailable !== false) {
    await Property.updateOne({ _id: request.property }, { available: false });
    const result = await RentalRequest.updateMany(
      { property: request.property, status: 'pending', _id: { $ne: request._id } },
      { status: 'rejected' }
    );
    autoRejected = result.modifiedCount;
    propertyUpdated = true;
  }

  await request.populate([
    { path: 'property', select: 'title city price images available' },
    { path: 'tenant', select: 'firstName lastName email phone' },
  ]);
  res.json({ request, autoRejected, propertyUpdated });
}

export async function cancelRequest(req, res) {
  assertObjectId(req.params.id, 'Identifiant de demande');
  const request = await RentalRequest.findById(req.params.id);
  if (!request) throw new HttpError(404, 'Demande introuvable');
  if (!request.tenant.equals(req.user._id)) throw new HttpError(403, 'Cette demande ne vous appartient pas');
  if (request.status !== 'pending') {
    throw new HttpError(409, 'Seule une demande en attente peut être annulée');
  }
  await Message.deleteMany({ request: request._id });
  await request.deleteOne();
  res.json({ message: 'Demande annulée', id: request._id });
}
