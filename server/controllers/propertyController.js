import Property, { PROPERTY_TYPES } from '../models/Property.js';
import RentalRequest from '../models/RentalRequest.js';
import Review from '../models/Review.js';
import { HttpError } from '../middleware/error.js';
import { removePropertyCascade } from '../services/propertyService.js';
import {
  approximateLocation, assertObjectId, escapeRegex, pickPropertyFields, str,
} from '../utils/helpers.js';

const EARTH_RADIUS_KM = 6378.1;

const SORTS = {
  recent: { createdAt: -1 },
  price_asc: { price: 1, createdAt: -1 },
  price_desc: { price: -1, createdAt: -1 },
  rating: { ratingAverage: -1, ratingCount: -1 },
};

function buildFilter(query) {
  const filter = { available: true };

  const search = str(query.q || query.search).slice(0, 60);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: rx }, { city: rx }];
  }

  const city = str(query.city).slice(0, 60);
  if (city) filter.city = new RegExp(escapeRegex(city), 'i');

  const type = str(query.type);
  if (type && PROPERTY_TYPES.includes(type)) filter.type = type;

  const price = {};
  const maxPrice = Number(str(query.maxPrice));
  const minPrice = Number(str(query.minPrice));
  if (str(query.maxPrice) && Number.isFinite(maxPrice)) price.$lte = maxPrice;
  if (str(query.minPrice) && Number.isFinite(minPrice)) price.$gte = minPrice;
  if (Object.keys(price).length) filter.price = price;

  const bedrooms = Number(str(query.bedrooms));
  if (str(query.bedrooms) && Number.isFinite(bedrooms)) filter.bedrooms = { $gte: bedrooms };

  const near = str(query.near).split(',').map(Number);
  if (near.length === 2 && near.every(Number.isFinite)) {
    const [lat, lng] = near;
    const radius = Math.min(200, Math.max(0.5, Number(str(query.radius)) || 10));
    filter.location = { $geoWithin: { $centerSphere: [[lng, lat], radius / EARTH_RADIUS_KM] } };
  }

  return filter;
}

async function findOwnedProperty(id, user) {
  assertObjectId(id, 'Identifiant de logement');
  const property = await Property.findById(id);
  if (!property) throw new HttpError(404, 'Logement introuvable');
  if (!property.owner.equals(user._id)) {
    throw new HttpError(403, 'Vous ne pouvez gérer que vos propres annonces');
  }
  return property;
}

const publicCard = (doc) => {
  const data = doc.toJSON();
  data.location = approximateLocation(data.location);
  return data;
};

export async function listProperties(req, res) {
  const filter = buildFilter(req.query);
  const page = Math.max(1, parseInt(str(req.query.page), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(str(req.query.limit), 10) || 12));
  const sort = SORTS[str(req.query.sort)] || SORTS.recent;

  const [items, total] = await Promise.all([
    Property.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
    Property.countDocuments(filter),
  ]);

  res.json({
    items: items.map(publicCard),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    types: PROPERTY_TYPES,
  });
}

export async function getProperty(req, res) {
  assertObjectId(req.params.id, 'Identifiant de logement');
  const property = await Property.findById(req.params.id).populate(
    'owner',
    'firstName lastName email phone'
  );
  if (!property) throw new HttpError(404, 'Logement introuvable');

  const isOwner = Boolean(req.user && property.owner._id.equals(req.user._id));
  if (!isOwner) {
    Property.updateOne({ _id: property._id }, { $inc: { views: 1 } }).catch(() => {});
  }

  const data = property.toJSON();
  if (!isOwner) {
    data.location = approximateLocation(data.location);
    delete data.views;
  }
  if (!req.user) {
    data.owner = { _id: data.owner?._id, firstName: data.owner?.firstName, lastName: data.owner?.lastName };
  }

  let viewer = null;
  if (req.user) {
    viewer = {
      isOwner,
      isFavorite: req.user.favorites.some((f) => f.equals(property._id)),
      activeRequest: null,
      canReview: false,
      myReview: null,
    };
    if (req.user.role === 'tenant') {
      const [activeRequest, stay, myReview] = await Promise.all([
        RentalRequest.findOne({
          property: property._id,
          tenant: req.user._id,
          status: { $in: ['pending', 'accepted'] },
        }).select('status startDate duration createdAt'),
        RentalRequest.exists({
          property: property._id,
          tenant: req.user._id,
          status: 'accepted',
          startDate: { $lte: new Date() },
        }),
        Review.findOne({ property: property._id, tenant: req.user._id }),
      ]);
      viewer.activeRequest = activeRequest;
      viewer.myReview = myReview;
      viewer.canReview = Boolean(stay) && !myReview;
    }
  }

  res.json({ property: data, viewer });
}

export async function myProperties(req, res) {
  const items = await Property.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json({ items });
}

export async function createProperty(req, res) {
  const data = pickPropertyFields(req.body);
  const property = await Property.create({ ...data, owner: req.user._id });
  res.status(201).json({ property });
}

export async function updateProperty(req, res) {
  const property = await findOwnedProperty(req.params.id, req.user);
  property.set(pickPropertyFields(req.body));
  await property.save();
  res.json({ property });
}

export async function deleteProperty(req, res) {
  const property = await findOwnedProperty(req.params.id, req.user);
  await removePropertyCascade(property);
  res.json({ message: 'Annonce supprimée', id: property._id });
}
