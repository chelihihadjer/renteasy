import mongoose from 'mongoose';

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    tenant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: {
      type: Number,
      required: [true, 'La note est obligatoire'],
      validate: {
        validator: (v) => Number.isInteger(v) && v >= 1 && v <= 5,
        message: 'La note doit être un entier de 1 à 5',
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Commentaire trop long (1000 caractères max)'],
    },
  },
  { timestamps: true }
);

reviewSchema.index({ property: 1, tenant: 1 }, { unique: true });

reviewSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Review', reviewSchema);
