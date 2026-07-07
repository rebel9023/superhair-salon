import { Schema, model, Document } from 'mongoose';

export interface IService extends Document {
  name: string;
  category: Schema.Types.ObjectId; // References Category
  duration: number; // Duration in minutes
  price: number;
  taxRate: number; // percentage (e.g. 18.0)
  discount: number; // flat or percentage discount
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    duration: { type: Number, required: true, default: 30 }, // Default 30 min
    price: { type: Number, required: true },
    taxRate: { type: Number, default: 18 }, // Standard 18% tax rate
    discount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  { timestamps: true }
);

// Create compound index for faster category listing
serviceSchema.index({ category: 1, status: 1 });

export const Service = model<IService>('Service', serviceSchema);
export default Service;
