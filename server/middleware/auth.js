import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from './error.js';

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

async function resolveUser(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(payload.sub);
}

export async function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) throw new HttpError(401, 'Authentification requise');
  let user;
  try {
    user = await resolveUser(token);
  } catch {
    throw new HttpError(401, 'Session invalide ou expirée, reconnectez-vous');
  }
  if (!user) throw new HttpError(401, 'Utilisateur introuvable');
  req.user = user;
  next();
}

export async function optionalAuth(req, res, next) {
  const token = readToken(req);
  if (token) {
    try {
      req.user = (await resolveUser(token)) || undefined;
    } catch {
      req.user = undefined;
    }
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const labels = { tenant: 'locataires', owner: 'propriétaires', admin: 'administrateurs' };
      throw new HttpError(403, `Action réservée aux ${roles.map((r) => labels[r]).join(' et ')}`);
    }
    next();
  };
}
