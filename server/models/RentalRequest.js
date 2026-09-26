import mongoose from 'mongoose';

const { Schema } = mongoose;

export const REQUEST_STATUSES = ['pending', 'accepted', 'rejected'];

const rentalRequestSchema = new Schema(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    tenant: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, trim: true, maxlength: [1000, 'Message trop long (1000 caractères max)'] },
    startDate: { type: Date, required: [true, 'La date de début est obligatoire'] },
    duration: {
      type: Number,
      required: [true, 'La durée est obligatoire'],
      validate: {
        validator: (v) => Number.isInteger(v) && v >= 1 && v <= 36,
        message: 'La durée doit être comprise entre 1 et 36 mois',
      },
    },
    status: { type: String, enum: REQUEST_STATUSES, default: 'pending' },
  },
  { timestamps: true }
);

rentalRequestSchema.index(
  { tenant: 1, property: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

rentalRequestSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('RentalRequest', rentalRequestSchema);
