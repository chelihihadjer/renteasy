import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: { type: String, required: [true, 'Le prénom est obligatoire'], trim: true, maxlength: 50 },
    lastName: { type: String, required: [true, 'Le nom est obligatoire'], trim: true, maxlength: 50 },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email invalide'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Le téléphone est obligatoire'],
      trim: true,
      match: [/^\+?[0-9\s.-]{8,20}$/, 'Numéro de téléphone invalide'],
    },
    role: {
      type: String,
      enum: { values: ['tenant', 'owner', 'admin'], message: 'Type de compte invalide' },
      required: [true, 'Le type de compte est obligatoire'],
    },
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
