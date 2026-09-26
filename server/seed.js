import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import Message from './models/Message.js';
import Property from './models/Property.js';
import RentalRequest from './models/RentalRequest.js';
import Review from './models/Review.js';
import { refreshRating } from './services/propertyService.js';
import User from './models/User.js';

dotenv.config({ quiet: true });
const at = (lat, lng) => ({ type: 'Point', coordinates: [lng, lat] });
const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

await connectDB(process.env.MONGO_URI);
await Promise.all([User.deleteMany({}), Property.deleteMany({}), RentalRequest.deleteMany({}), Message.deleteMany({}), Review.deleteMany({})]);
try {
  await Promise.all([User, Property, RentalRequest, Message, Review].map((m) => m.syncIndexes()));
} catch (err) {
  console.warn('Index non créé (base non compatible ?) :', err.message);
}

const password = 'Password123';
const [, owner1, owner2, tenant1, tenant2] = await User.create([
  { firstName: 'Amel', lastName: 'Admin', email: 'admin@renteasy.dz', password, phone: '0550 00 00 00', role: 'admin' },
  { firstName: 'Karim', lastName: 'Benali', email: 'owner@renteasy.dz', password, phone: '0550 12 34 56', role: 'owner' },
  { firstName: 'Nadia', lastName: 'Haddad', email: 'owner2@renteasy.dz', password, phone: '0661 98 76 54', role: 'owner' },
  { firstName: 'Yacine', lastName: 'Mansouri', email: 'tenant@renteasy.dz', password, phone: '0770 11 22 33', role: 'tenant' },
  { firstName: 'Lina', lastName: 'Saadi', email: 'tenant2@renteasy.dz', password, phone: '0555 44 55 66', role: 'tenant' },
]);

const properties = await Property.create([
  {
    title: 'F3 lumineux proche du centre-ville',
    description: 'Appartement traversant au 3e étage avec ascenseur, séjour ouvert sur balcon, cuisine équipée. Quartier calme, commerces et transports à pied.',
    price: 45000, city: 'Constantine', address: 'Cité Daksi, bloc 12', type: 'Appartement',
    surface: 85, bedrooms: 2, bathrooms: 1,
    images: [img('photo-1502672260266-1c1ef2d93688'), img('photo-1522708323590-d24dbb6b0267')],
    amenities: ['Wi-Fi', 'Climatisation', 'Ascenseur', 'Balcon'], location: at(36.3565, 6.6389), views: 184, owner: owner1._id,
  },
  {
    title: 'Studio meublé pour étudiant',
    description: 'Studio entièrement meublé à dix minutes de l’université. Idéal pour un étudiant ou un jeune actif. Charges comprises.',
    price: 22000, city: 'Batna', address: 'Route de Tazoult', type: 'Studio',
    surface: 32, bedrooms: 0, bathrooms: 1,
    images: [img('photo-1493809842364-78817add7ffb')],
    amenities: ['Meublé', 'Wi-Fi', 'Chauffage'], location: at(35.5402, 6.1612), views: 96, owner: owner1._id,
  },
  {
    title: 'Maison avec jardin et garage',
    description: 'Maison individuelle de plain-pied, grand jardin clos, garage deux voitures. Parfaite pour une famille.',
    price: 90000, city: 'Sétif', address: 'Cité El Hidhab', type: 'Maison',
    surface: 160, bedrooms: 4, bathrooms: 2,
    images: [img('photo-1512917774080-9991f1c4c750'), img('photo-1600596542815-ffad4c1539a9')],
    amenities: ['Parking', 'Jardin', 'Chauffage', 'Climatisation'], location: at(36.1740, 5.4250), views: 142, owner: owner2._id,
  },
  {
    title: 'Duplex vue mer',
    description: 'Duplex récent avec terrasse et vue dégagée sur la baie. Deux salles de bain, cuisine américaine, résidence sécurisée.',
    price: 130000, city: 'Oran', address: 'Front de mer, résidence Les Andalouses', type: 'Duplex',
    surface: 140, bedrooms: 3, bathrooms: 2,
    images: [img('photo-1600585154340-be6161a56a0c')],
    amenities: ['Parking', 'Climatisation', 'Terrasse', 'Gardiennage'], location: at(35.7080, -0.6250), views: 231, owner: owner2._id,
  },
  {
    title: 'F2 rénové à Bab Ezzouar',
    description: 'Appartement entièrement rénové, proche du tramway et de l’USTHB. Double vitrage, chauffe-eau neuf.',
    price: 55000, city: 'Alger', address: 'Cité 5 Juillet, Bab Ezzouar', type: 'Appartement',
    surface: 65, bedrooms: 1, bathrooms: 1,
    images: [img('photo-1560448204-e02f11c3d0e2')],
    amenities: ['Wi-Fi', 'Chauffage'], location: at(36.7200, 3.1830), views: 77, owner: owner1._id,
  },
  {
    title: 'Villa familiale avec piscine',
    description: 'Grande villa sur deux niveaux, piscine, cuisine d’été et jardin arboré. Location longue durée uniquement.',
    price: 180000, city: 'Annaba', address: 'Seraïdi', type: 'Villa',
    surface: 280, bedrooms: 5, bathrooms: 3,
    images: [img('photo-1560185007-cde436f6a4d0')],
    amenities: ['Piscine', 'Parking', 'Jardin', 'Climatisation'], location: at(36.9230, 7.6710), views: 58, owner: owner2._id, available: false,
  },
]);

const inDays = (n) => new Date(Date.now() + n * 86400000);
const requests = await RentalRequest.create([
  { property: properties[0]._id, tenant: tenant1._id, owner: owner1._id, startDate: inDays(20), duration: 12, message: 'Bonjour, je suis intéressé pour une location à l’année. Je peux visiter samedi.' },
  { property: properties[1]._id, tenant: tenant2._id, owner: owner1._id, startDate: inDays(10), duration: 9, message: 'Étudiante en master, je cherche pour l’année universitaire.' },
  { property: properties[2]._id, tenant: tenant1._id, owner: owner2._id, startDate: inDays(30), duration: 24, message: 'Famille de quatre personnes, emploi stable.', status: 'rejected' },
  { property: properties[3]._id, tenant: tenant2._id, owner: owner2._id, startDate: inDays(-90), duration: 3, message: 'Location pour l’été.', status: 'accepted' },
]);

await Message.create([
  { request: requests[0]._id, sender: tenant1._id, recipient: owner1._id, body: 'Bonjour, le logement est-il toujours disponible pour une visite samedi matin ?' },
  { request: requests[0]._id, sender: owner1._id, recipient: tenant1._id, body: 'Bonjour Yacine, oui, samedi 10 h me convient. Je vous envoie l’adresse exacte la veille.' },
]);

await Review.create({ property: properties[3]._id, tenant: tenant2._id, rating: 5, comment: 'Duplex conforme aux photos, propriétaire très réactif. Vue magnifique.' });
await refreshRating(properties[3]._id);
tenant1.favorites = [properties[0]._id, properties[3]._id];
await tenant1.save();

console.log('Données de test créées.');
await mongoose.disconnect();
