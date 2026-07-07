import { Schema, model, Document } from 'mongoose';

export interface ILoyaltyTransaction extends Document {
  customer: Schema.Types.ObjectId; // References Customer
  type: 'earn' | 'redeem' | 'expire';
  points: number;
  invoice?: Schema.Types.ObjectId; // References Invoice
  description: string;
  createdAt: Date;
}

const loyaltyTransactionSchema = new Schema<ILoyaltyTransaction>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    type: { type: String, enum: ['earn', 'redeem', 'expire'], required: true },
    points: { type: Number, required: true },
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    description: { type: String, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const LoyaltyTransaction = model<ILoyaltyTransaction>('LoyaltyTransaction', loyaltyTransactionSchema);
export default LoyaltyTransaction;
