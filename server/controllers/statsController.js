import Property from '../models/Property.js';
import RentalRequest from '../models/RentalRequest.js';

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

function lastMonths(n) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1));
}

export async function ownerStats(req, res) {
  const owner = req.user._id;
  const [properties, requests] = await Promise.all([
    Property.find({ owner }).select('title city price available views ratingAverage ratingCount').lean(),
    RentalRequest.find({ owner }).select('property status createdAt').lean(),
  ]);

  const status = { pending: 0, accepted: 0, rejected: 0 };
  const perProperty = {};
  const perMonth = {};
  for (const r of requests) {
    status[r.status] += 1;
    const key = String(r.property);
    perProperty[key] ??= { requests: 0, accepted: 0, pending: 0 };
    perProperty[key].requests += 1;
    if (r.status === 'accepted') perProperty[key].accepted += 1;
    if (r.status === 'pending') perProperty[key].pending += 1;
    const m = monthKey(new Date(r.createdAt));
    perMonth[m] = (perMonth[m] || 0) + 1;
  }
  const decided = status.accepted + status.rejected;

  res.json({
    totals: {
      listings: properties.length,
      available: properties.filter((p) => p.available).length,
      views: properties.reduce((sum, p) => sum + (p.views || 0), 0),
      requests: requests.length,
      acceptanceRate: decided ? Math.round((status.accepted / decided) * 100) : null,
      averageRent: properties.length
        ? Math.round(properties.reduce((sum, p) => sum + p.price, 0) / properties.length)
        : 0,
    },
    status,
    months: lastMonths(6).map((d) => ({ month: monthKey(d), count: perMonth[monthKey(d)] || 0 })),
    listings: properties
      .map((p) => ({
        _id: p._id,
        title: p.title,
        city: p.city,
        available: p.available,
        views: p.views || 0,
        ratingAverage: p.ratingAverage || 0,
        ratingCount: p.ratingCount || 0,
        requests: 0,
        accepted: 0,
        pending: 0,
        ...perProperty[String(p._id)],
      }))
      .sort((a, b) => b.requests - a.requests || b.views - a.views),
  });
}
