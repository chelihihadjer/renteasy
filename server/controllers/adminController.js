import Property from '../models/Property.js';
import RentalRequest from '../models/RentalRequest.js';
import User from '../models/User.js';
import { HttpError } from '../middleware/error.js';
import { removePropertyCascade } from '../services/propertyService.js';
import { assertObjectId, escapeRegex, str } from '../utils/helpers.js';

export async function overview(req, res) {
  const [tenants, owners, listings, available, pending] = await Promise.all([
    User.countDocuments({ role: 'tenant' }),
    User.countDocuments({ role: 'owner' }),
    Property.countDocuments(),
    Property.countDocuments({ available: true }),
    RentalRequest.countDocuments({ status: 'pending' }),
  ]);
  res.json({ tenants, owners, listings, available, pending });
}

export async function listUsers(req, res) {
  const filter = {};
  const role = str(req.query.role);
  if (['tenant', 'owner', 'admin'].includes(role)) filter.role = role;
  const q = str(req.query.q).slice(0, 60);
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
  const counts = await Property.aggregate([
    { $match: { owner: { $in: users.map((u) => u._id) } } },
    { $group: { _id: '$owner', count: { $sum: 1 } } },
  ]);
  const byOwner = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  res.json({
    items: users.map((u) => ({ ...u.toJSON(), listings: byOwner[String(u._id)] || 0 })),
  });
}

export async function listAllProperties(req, res) {
  const filter = {};
  const q = str(req.query.q).slice(0, 60);
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: rx }, { city: rx }];
  }
  const items = await Property.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('owner', 'firstName lastName email');
  res.json({ items });
}

export async function removeProperty(req, res) {
  assertObjectId(req.params.id, 'Identifiant de logement');
  const property = await Property.findById(req.params.id);
  if (!property) throw new HttpError(404, 'Logement introuvable');
  await removePropertyCascade(property);
  console.info(`[admin] ${req.user.email} a retiré l'annonce ${property._id} (${property.title}).`);
  res.json({ message: 'Annonce retirée', id: property._id });
}
