import { Schema, model, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string; // Unique coupon code, e.g. FESTIVAL20
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minBillAmount: number;
  maxDiscount?: number; // Caps max discount amount if discountType is percentage
  startDate: Date;
  endDate: Date;
  usageLimit: number;
  usedCount: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'flat'], required: true },
    discountValue: { type: Number, required: true },
    minBillAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Coupon = model<ICoupon>('Coupon', couponSchema);
export default Coupon;
