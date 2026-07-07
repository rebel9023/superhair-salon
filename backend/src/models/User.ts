import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: Schema.Types.ObjectId; // References Role
  branch?: Schema.Types.ObjectId; // References Branch (can be null for super_admin)
  phone: string;
  status: 'active' | 'suspended' | 'pending';
  avatar?: string;
  isEmailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  refreshTokens: string[]; // Store multiple active refresh tokens if needed, or single
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', default: null },
    phone: { type: String, required: true },
    status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'pending' },
    avatar: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: '' },
    resetPasswordToken: { type: String, default: '' },
    resetPasswordExpires: { type: Date },
    refreshTokens: { type: [String], default: [] }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password || '', salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password helper
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password || '');
};

export const User = model<IUser>('User', userSchema);
export default User;
