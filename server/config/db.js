import mongoose from 'mongoose';

export async function connectDB(uri) {
  if (!uri) {
    console.error('MONGO_URI manquant dans server/.env');
    process.exit(1);
  }
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connecté : ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error('Connexion MongoDB impossible :', err.message);
    console.error('Vérifiez que MongoDB tourne (local ou Atlas) et que MONGO_URI est correct.');
    process.exit(1);
  }
}
