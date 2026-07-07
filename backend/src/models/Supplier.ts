import { Schema, model, Document } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  contactName?: string;
  phone: string;
  email?: string;
  gstin?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, trim: true },
    contactName: { type: String, default: '' },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true, default: '' },
    gstin: { type: String, uppercase: true, trim: true, default: '' },
    address: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Supplier = model<ISupplier>('Supplier', supplierSchema);
export default Supplier;
