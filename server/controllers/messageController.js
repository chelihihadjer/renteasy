import Message from '../models/Message.js';
import RentalRequest from '../models/RentalRequest.js';
import { HttpError } from '../middleware/error.js';
import { assertObjectId, str } from '../utils/helpers.js';

async function loadThread(requestId, user) {
  assertObjectId(requestId, 'Identifiant de demande');
  const request = await RentalRequest.findById(requestId)
    .populate('property', 'title city images')
    .populate('tenant', 'firstName lastName')
    .populate('owner', 'firstName lastName');
  if (!request) throw new HttpError(404, 'Demande introuvable');

  const isTenant = request.tenant?._id.equals(user._id);
  const isOwner = request.owner?._id.equals(user._id);
  if (!isTenant && !isOwner) throw new HttpError(403, 'Cette conversation ne vous concerne pas');

  return { request, other: isTenant ? request.owner : request.tenant };
}

export async function unreadCounts(req, res) {
  const rows = await Message.aggregate([
    { $match: { recipient: req.user._id, readAt: null } },
    { $group: { _id: '$request', count: { $sum: 1 } } },
  ]);
  const byRequest = Object.fromEntries(rows.map((r) => [String(r._id), r.count]));
  res.json({ total: rows.reduce((sum, r) => sum + r.count, 0), byRequest });
}

export async function getThread(req, res) {
  const { request, other } = await loadThread(req.params.requestId, req.user);
  await Message.updateMany(
    { request: request._id, recipient: req.user._id, readAt: null },
    { readAt: new Date() }
  );
  const items = await Message.find({ request: request._id }).sort({ createdAt: 1 }).limit(500);
  res.json({
    request: {
      _id: request._id,
      status: request.status,
      startDate: request.startDate,
      duration: request.duration,
      property: request.property,
    },
    other,
    items,
  });
}

export async function sendMessage(req, res) {
  const { request, other } = await loadThread(req.params.requestId, req.user);
  if (request.status === 'rejected') {
    throw new HttpError(409, 'Cette demande a été refusée, la conversation est fermée');
  }
  const body = str(req.body?.body);
  if (!body) throw new HttpError(400, 'Le message est vide', { body: 'Écrivez un message' });

  const message = await Message.create({
    request: request._id,
    sender: req.user._id,
    recipient: other._id,
    body,
  });
  res.status(201).json({ message });
}
