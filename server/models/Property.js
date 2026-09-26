import mongoose from 'mongoose';

const { Schema } = mongoose;

export const PROPERTY_TYPES = ['Appartement', 'Maison', 'Studio', 'Villa', 'Duplex', 'Chambre'];

const pointSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: ([lng, lat] = []) =>
          Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90,
        message: 'Coordonnées invalides',
      },
    },
  },
  { _id: false }
);

const nonNegativeInteger = {
  validator: (v) => Number.isInteger(v) && v >= 0,
  message: 'Doit être un entier positif ou nul',
};

const propertySchema = new Schema(
  {
    title: { type: String, required: [true, 'Le titre est obligatoire'], trim: true, maxlength: 120 },
    description: {
      type: String,
      required: [true, 'La description est obligatoire'],
      trim: true,
      maxlength: [3000, 'Description trop longue (3000 caractères max)'],
    },
    price: {
      type: Number,
      required: [true, 'Le prix mensuel est obligatoire'],
      min: [1, 'Le prix doit être supérieur à 0'],
    },
    city: { type: String, required: [true, 'La ville est obligatoire'], trim: true, maxlength: 80 },
    address: { type: String, required: [true, "L'adresse est obligatoire"], trim: true, maxlength: 200 },
    type: {
      type: String,
      required: [true, 'Le type de logement est obligatoire'],
      enum: { values: PROPERTY_TYPES, message: 'Type de logement invalide' },
    },
    surface: { type: Number, min: [1, 'La surface doit être supérieure à 0'] },
    bedrooms: { type: Number, required: [true, 'Le nombre de chambres est obligatoire'], validate: nonNegativeInteger },
    bathrooms: { type: Number, required: [true, 'Le nombre de salles de bain est obligatoire'], validate: nonNegativeInteger },
    images: {
      type: [{ type: String, trim: true, match: [/^(https?:\/\/\S+|\/uploads\/[\w.-]+)$/i, "URL d'image invalide"] }],
      validate: { validator: (arr) => arr.length <= 10, message: '10 images maximum' },
    },
    amenities: [{ type: String, trim: true, maxlength: 40 }],
    available: { type: Boolean, default: true },
    location: { type: pointSchema, default: undefined },
    views: { type: Number, default: 0 },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

propertySchema.index({ available: 1, city: 1, price: 1 });
propertySchema.index({ available: 1, createdAt: -1 });
propertySchema.index({ location: '2dsphere' });

propertySchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Property', propertySchema);
