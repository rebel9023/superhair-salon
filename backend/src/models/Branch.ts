import { Schema, model, Document } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  code: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  contact: string;
  email: string;
  gstNumber?: string;
  invoicePrefix: string;
  status: 'active' | 'inactive';
  settings: {
    currency: string;
    timezone: string;
    taxRate: number; // default global tax percentage
  };
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, required: true }
    },
    contact: { type: String, required: true },
    email: { type: String, required: true },
    gstNumber: { type: String, default: '' },
    invoicePrefix: { type: String, default: 'INV-' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    settings: {
      currency: { type: String, default: '₹' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      taxRate: { type: Number, default: 18 } // Standard GST rate of 18%
    }
  },
  { timestamps: true }
);

export const Branch = model<IBranch>('Branch', branchSchema);
export default Branch;
