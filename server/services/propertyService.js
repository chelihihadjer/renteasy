import fs from 'node:fs/promises';
import path from 'node:path';
import { UPLOAD_DIR } from '../config/paths.js';
import Property from '../models/Property.js';
import Message from '../models/Message.js';
import RentalRequest from '../models/RentalRequest.js';
import Review from '../models/Review.js';
import User from '../models/User.js';

export async function removePropertyCascade(property) {
  const requestIds = await RentalRequest.find({ property: property._id }).distinct('_id');
  await Promise.all([
    Message.deleteMany({ request: { $in: requestIds } }),
    RentalRequest.deleteMany({ property: property._id }),
    Review.deleteMany({ property: property._id }),
    User.updateMany({ favorites: property._id }, { $pull: { favorites: property._id } }),
  ]);
  await property.deleteOne();

  const localFiles = (property.images || [])
    .filter((url) => url.startsWith('/uploads/'))
    .map((url) => path.join(UPLOAD_DIR, path.basename(url)));
  await Promise.allSettled(localFiles.map((file) => fs.unlink(file)));
}

export async function refreshRating(propertyId) {
  const ratings = await Review.find({ property: propertyId }).select('rating').lean();
  const count = ratings.length;
  const average = count ? ratings.reduce((sum, r) => sum + r.rating, 0) / count : 0;
  await Property.updateOne(
    { _id: propertyId },
    { ratingAverage: Math.round(average * 10) / 10, ratingCount: count }
  );
}
