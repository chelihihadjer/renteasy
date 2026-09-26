import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET manquant dans server/.env');
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 5050;

await connectDB(process.env.MONGO_URI);
createApp().listen(PORT, () => console.log(`API RentEasy sur http://localhost:${PORT}`));
