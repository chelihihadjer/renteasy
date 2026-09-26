import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../app.js';
import Property from '../models/Property.js';
import RentalRequest from '../models/RentalRequest.js';
import User from '../models/User.js';

process.env.JWT_SECRET ||= 'test-secret';
const MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/renteasy_test';

const app = createApp();
const api = () => request(app);
const auth = (token) => ({ Authorization: `Bearer ${token}` });

const tokens = {};
let geoSupported = true;
let propertyId;
let requestId;

const LISTING = {
  title: 'F3 test', description: 'Description de test', price: 40000, city: 'Constantine',
  address: 'Rue de test', type: 'Appartement', surface: 80, bedrooms: 2, bathrooms: 1,
  images: 'https://example.com/a.jpg', amenities: 'Wi-Fi, Parking, Wi-Fi', lat: 36.365, lng: 6.6147,
};

async function register(role, email) {
  const res = await api().post('/api/auth/register').send({
    firstName: 'Test', lastName: role, email, password: 'Password123', phone: '0550123456', role,
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(res.body.user.password, undefined);
  return res.body.token;
}

before(async () => {
  await mongoose.connect(MONGO_URI);
  await mongoose.connection.dropDatabase();
  for (const model of [User, Property, RentalRequest]) {
    try {
      await model.syncIndexes();
    } catch (err) {
      if (/2dsphere/.test(err.message)) geoSupported = false;
    }
  }
  tokens.owner = await register('owner', 'owner@test.dz');
  tokens.owner2 = await register('owner', 'owner2@test.dz');
  tokens.tenant = await register('tenant', 'tenant@test.dz');
  await User.create({
    firstName: 'Admin', lastName: 'Test', email: 'admin@test.dz', password: 'Password123', phone: '0550123456', role: 'admin',
  });
  tokens.admin = (await api().post('/api/auth/login').send({ email: 'admin@test.dz', password: 'Password123' })).body.token;
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('auth: duplicate email, wrong password, admin role cannot be self-assigned', async () => {
  assert.equal((await api().post('/api/auth/register').send({
    firstName: 'A', lastName: 'B', email: 'owner@test.dz', password: 'Password123', phone: '0550123456', role: 'owner',
  })).status, 409);
  assert.equal((await api().post('/api/auth/login').send({ email: 'owner@test.dz', password: 'bad' })).status, 401);
  assert.equal((await api().post('/api/auth/login').send({ email: { $ne: null }, password: 'x' })).status, 400);
  assert.equal((await api().post('/api/auth/register').send({
    firstName: 'A', lastName: 'B', email: 'x@test.dz', password: 'Password123', phone: '0550123456', role: 'admin',
  })).status, 400);
});

test('properties: only owners create, validation, whitelist of fields', async () => {
  assert.equal((await api().post('/api/properties').set(auth(tokens.tenant)).send(LISTING)).status, 403);
  assert.equal((await api().post('/api/properties').send(LISTING)).status, 401);
  const bad = await api().post('/api/properties').set(auth(tokens.owner)).send({ ...LISTING, price: -1, bedrooms: 1.5 });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.details.price && bad.body.details.bedrooms);

  const res = await api().post('/api/properties').set(auth(tokens.owner))
    .send({ ...LISTING, owner: new mongoose.Types.ObjectId() });
  assert.equal(res.status, 201);
  propertyId = res.body.property._id;
  assert.deepEqual(res.body.property.amenities, ['Wi-Fi', 'Parking']);
  assert.deepEqual(res.body.property.location.coordinates, [6.6147, 36.365]);
  const owner = await User.findOne({ email: 'owner@test.dz' });
  assert.equal(res.body.property.owner, String(owner._id));
});

test('properties: public list, filters and safe search', async () => {
  const list = await api().get('/api/properties').query({ q: 'const', maxPrice: 50000, bedrooms: 2 });
  assert.equal(list.body.total, 1);
  assert.equal((await api().get('/api/properties').query({ q: '(a+)+$' })).status, 200);
  assert.equal((await api().get('/api/properties').query({ maxPrice: 1000 })).body.total, 0);
});

test('properties: public detail hides contact and exact position', async () => {
  const anon = await api().get(`/api/properties/${propertyId}`);
  assert.equal(anon.body.property.owner.phone, undefined);
  assert.deepEqual(anon.body.property.location.coordinates, [6.615, 36.365]);
  const logged = await api().get(`/api/properties/${propertyId}`).set(auth(tokens.tenant));
  assert.ok(logged.body.property.owner.phone);
  const own = await api().get(`/api/properties/${propertyId}`).set(auth(tokens.owner));
  assert.equal(own.body.viewer.isOwner, true);
  assert.deepEqual(own.body.property.location.coordinates, [6.6147, 36.365]);
});

test('properties: geographic radius search', async (t) => {
  if (!geoSupported) {
    t.skip('this database does not support 2dsphere indexes');
    return;
  }
  const near = await api().get('/api/properties').query({ near: '36.36,6.61', radius: 5 });
  assert.equal(near.body.total, 1);
  const far = await api().get('/api/properties').query({ near: '35.70,-0.63', radius: 5 });
  assert.equal(far.body.total, 0);
});

test('properties: only the owner can edit or delete', async () => {
  assert.equal((await api().put(`/api/properties/${propertyId}`).set(auth(tokens.owner2)).send({ price: 1 })).status, 403);
  assert.equal((await api().delete(`/api/properties/${propertyId}`).set(auth(tokens.owner2))).status, 403);
  const ok = await api().put(`/api/properties/${propertyId}`).set(auth(tokens.owner)).send({ price: 42000 });
  assert.equal(ok.body.property.price, 42000);
});

test('favourites: no duplicates, toggle and idempotent variants', async () => {
  const put1 = await api().put(`/api/users/favorites/${propertyId}`).set(auth(tokens.tenant));
  const put2 = await api().put(`/api/users/favorites/${propertyId}`).set(auth(tokens.tenant));
  assert.equal(put1.body.favorites.length, 1);
  assert.equal(put2.body.favorites.length, 1);
  const toggle = await api().post(`/api/tenant/favorites/${propertyId}`).set(auth(tokens.tenant));
  assert.equal(toggle.body.isFavorite, false);
  assert.equal((await api().get('/api/users/favorites').set(auth(tokens.owner))).status, 403);
});

test('requests: validation, one active request, owner decision', async () => {
  const past = await api().post('/api/requests').set(auth(tokens.tenant))
    .send({ propertyId, startDate: '2020-01-01', duration: 0 });
  assert.equal(past.status, 400);

  const start = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const created = await api().post(`/api/tenant/requests/${propertyId}`).set(auth(tokens.tenant))
    .send({ startDate: start, duration: 6, message: 'Bonjour' });
  assert.equal(created.status, 201);
  requestId = created.body.request._id;

  const dup = await api().post('/api/requests').set(auth(tokens.tenant)).send({ propertyId, startDate: start, duration: 6 });
  assert.equal(dup.status, 409);

  assert.equal((await api().patch(`/api/requests/${requestId}`).set(auth(tokens.owner2)).send({ status: 'accepted' })).status, 403);
  const accepted = await api().patch(`/api/requests/${requestId}`).set(auth(tokens.owner)).send({ status: 'accepted' });
  assert.equal(accepted.body.request.status, 'accepted');
  assert.equal(accepted.body.propertyUpdated, true);
  assert.equal((await api().patch(`/api/requests/${requestId}`).set(auth(tokens.owner)).send({ status: 'rejected' })).status, 409);

  const again = await api().post('/api/requests').set(auth(tokens.tenant)).send({ propertyId, startDate: start, duration: 6 });
  assert.equal(again.status, 409, 'unavailable listing refuses new requests');
  assert.equal((await api().get('/api/properties')).body.total, 0);
});

test('messages: only the two parties, unread counter', async () => {
  const sent = await api().post(`/api/messages/${requestId}`).set(auth(tokens.tenant)).send({ body: 'Quand visiter ?' });
  assert.equal(sent.status, 201);
  assert.equal((await api().get(`/api/messages/${requestId}`).set(auth(tokens.owner2))).status, 403);
  const unread = await api().get('/api/messages/unread').set(auth(tokens.owner));
  assert.equal(unread.body.total, 1);
  const thread = await api().get(`/api/messages/${requestId}`).set(auth(tokens.owner));
  assert.equal(thread.body.items.length, 1);
  assert.equal((await api().get('/api/messages/unread').set(auth(tokens.owner))).body.total, 0);
});

test('reviews: only after an accepted stay has started, once', async () => {
  const early = await api().post(`/api/properties/${propertyId}/reviews`).set(auth(tokens.tenant)).send({ rating: 5 });
  assert.equal(early.status, 403, 'stay has not started yet');

  await RentalRequest.updateOne({ _id: requestId }, { startDate: new Date(Date.now() - 86400000) });
  const bad = await api().post(`/api/properties/${propertyId}/reviews`).set(auth(tokens.tenant)).send({ rating: 7 });
  assert.equal(bad.status, 400);
  const ok = await api().post(`/api/properties/${propertyId}/reviews`).set(auth(tokens.tenant)).send({ rating: 4, comment: 'Bien' });
  assert.equal(ok.status, 201);
  const twice = await api().post(`/api/properties/${propertyId}/reviews`).set(auth(tokens.tenant)).send({ rating: 5 });
  assert.equal(twice.status, 409);

  const detail = await api().get(`/api/properties/${propertyId}`);
  assert.equal(detail.body.property.ratingAverage, 4);
  assert.equal(detail.body.property.ratingCount, 1);
  const list = await api().get(`/api/properties/${propertyId}/reviews`);
  assert.equal(list.body.items[0].author, 'Test t.');
});

test('stats: owner indicators', async () => {
  const res = await api().get('/api/stats/owner').set(auth(tokens.owner));
  assert.equal(res.body.totals.listings, 1);
  assert.equal(res.body.status.accepted, 1);
  assert.equal(res.body.totals.acceptanceRate, 100);
  assert.equal(res.body.months.length, 6);
  assert.equal((await api().get('/api/stats/owner').set(auth(tokens.tenant))).status, 403);
});

test('admin: overview, users, removal with cascade', async () => {
  assert.equal((await api().get('/api/admin/users').set(auth(tokens.owner))).status, 403);
  const users = await api().get('/api/admin/users').set(auth(tokens.admin)).query({ role: 'owner' });
  assert.equal(users.body.items.length, 2);
  const removed = await api().delete(`/api/admin/properties/${propertyId}`).set(auth(tokens.admin));
  assert.equal(removed.status, 200);
  assert.equal(await RentalRequest.countDocuments({ property: propertyId }), 0);
  assert.equal((await api().get(`/api/properties/${propertyId}`)).status, 404);
});
