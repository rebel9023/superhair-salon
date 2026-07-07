import { Schema, model, Document } from 'mongoose';

export interface IStockMovement extends Document {
  product: Schema.Types.ObjectId; // References Product
  branch: Schema.Types.ObjectId; // References Branch
  quantity: number; // positive for stock-in, negative for stock-out
  type: 'purchase' | 'sale' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'expired';
  referenceId?: Schema.Types.ObjectId; // References Invoice, PurchaseOrder, or StockTransfer
  performedBy: Schema.Types.ObjectId; // References User
  notes?: string;
  createdAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    quantity: { type: Number, required: true },
    type: {
      type: String,
      enum: ['purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'expired'],
      required: true
    },
    referenceId: { type: Schema.Types.ObjectId },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, default: '' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

stockMovementSchema.index({ branch: 1, product: 1, type: 1 });

export const StockMovement = model<IStockMovement>('StockMovement', stockMovementSchema);
export default StockMovement;
