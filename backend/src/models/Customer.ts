import { Schema, model, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  email?: string;
  phone: string;
  birthday?: Date;
  anniversary?: Date;
  notes?: string;
  loyaltyPoints: number;
  status: 'active' | 'blocked';
  branch: Schema.Types.ObjectId; // References Branch
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, required: true, trim: true },
    birthday: { type: Date },
    anniversary: { type: Date },
    notes: { type: String, default: '' },
    loyaltyPoints: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true }
  },
  { timestamps: true }
);

// Index phone per branch or globally (let's do global indexing for lookup)
customerSchema.index({ phone: 1 });
customerSchema.index({ branch: 1 });

export const Customer = model<ICustomer>('Customer', customerSchema);
export default Customer;
