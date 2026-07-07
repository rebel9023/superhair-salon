import { Schema, model, Document } from 'mongoose';

export interface IMembership extends Document {
  name: string; // e.g., Gold membership, VIP membership
  price: number;
  durationMonths: number;
  benefits: {
    discountPercentageOnServices: number; // e.g., 10 for 10% off
    discountPercentageOnProducts: number;
  };
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>(
  {
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    durationMonths: { type: Number, required: true, default: 12 },
    benefits: {
      discountPercentageOnServices: { type: Number, default: 0 },
      discountPercentageOnProducts: { type: Number, default: 0 }
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  { timestamps: true }
);

export const Membership = model<IMembership>('Membership', membershipSchema);
export default Membership;
