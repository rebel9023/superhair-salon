import { Schema, model, Document } from 'mongoose';

export interface IOffer extends Document {
  title: string;
  description: string;
  bannerUrl: string;
  type: 'festival' | 'birthday' | 'referral' | 'weekend';
  discountPercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    bannerUrl: { type: String, default: '' },
    type: { type: String, enum: ['festival', 'birthday', 'referral', 'weekend'], required: true },
    discountPercentage: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Offer = model<IOffer>('Offer', offerSchema);
export default Offer;
