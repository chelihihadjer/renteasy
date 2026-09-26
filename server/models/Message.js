import mongoose from 'mongoose';

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    request: { type: Schema.Types.ObjectId, ref: 'RentalRequest', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    body: {
      type: String,
      required: [true, 'Le message est vide'],
      trim: true,
      maxlength: [2000, 'Message trop long (2000 caractères max)'],
    },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ recipient: 1, readAt: 1 });

messageSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Message', messageSchema);
