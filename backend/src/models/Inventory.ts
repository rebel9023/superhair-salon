import { Schema, model, Document } from 'mongoose';

export interface IInventory extends Document {
  product: Schema.Types.ObjectId; // References Product
  branch: Schema.Types.ObjectId; // References Branch
  quantity: number;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    quantity: { type: Number, required: true, default: 0 },
    expiryDate: { type: Date }
  },
  { timestamps: true }
);

// Enforce unique product per branch
inventorySchema.index({ branch: 1, product: 1 }, { unique: true });

export const Inventory = model<IInventory>('Inventory', inventorySchema);
export default Inventory;
