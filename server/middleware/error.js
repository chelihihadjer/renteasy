export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(req, res) {
  res.status(404).json({ message: `Route introuvable : ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }
  if (err.name === 'ValidationError') {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, e.message])
    );
    return res.status(400).json({ message: 'Données invalides', details });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: `Valeur invalide pour le champ « ${err.path} »`,
      details: { [err.path]: 'Format invalide' },
    });
  }
  if (err.code === 11000) {
    let message = 'Une demande en attente existe déjà pour ce logement';
    if (err.keyValue?.email) message = 'Cet email est déjà utilisé';
    else if (/reviews/.test(err.message)) message = 'Vous avez déjà laissé un avis sur ce logement';
    return res.status(409).json({ message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Corps de requête JSON invalide' });
  }
  console.error(err);
  res.status(500).json({ message: 'Erreur interne du serveur' });
}
