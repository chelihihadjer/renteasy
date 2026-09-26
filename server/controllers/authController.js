import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from '../middleware/error.js';
import { str } from '../utils/helpers.js';

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export async function register(req, res) {
  const body = req.body ?? {};
  const data = {
    firstName: str(body.firstName),
    lastName: str(body.lastName),
    email: str(body.email).toLowerCase(),
    password: typeof body.password === 'string' ? body.password : '',
    phone: str(body.phone),
    role: str(body.role),
  };

  const errors = {};
  if (!data.firstName) errors.firstName = 'Le prénom est obligatoire';
  if (!data.lastName) errors.lastName = 'Le nom est obligatoire';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Email invalide';
  if (data.password.length < 8) errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
  if (!/^\+?[0-9\s.-]{8,20}$/.test(data.phone)) errors.phone = 'Numéro de téléphone invalide';
  if (!['tenant', 'owner'].includes(data.role)) errors.role = 'Choisissez Locataire ou Propriétaire';
  if (Object.keys(errors).length) throw new HttpError(400, 'Données invalides', errors);

  if (await User.exists({ email: data.email })) {
    throw new HttpError(409, 'Cet email est déjà utilisé', { email: 'Cet email est déjà utilisé' });
  }

  const user = await User.create(data);
  res.status(201).json({ user, token: signToken(user) });
}

export async function login(req, res) {
  const email = str(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) throw new HttpError(400, 'Email et mot de passe obligatoires');

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new HttpError(401, 'Email ou mot de passe incorrect');
  }
  res.json({ user, token: signToken(user) });
}

export function me(req, res) {
  res.json({ user: req.user });
}
