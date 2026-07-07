import { Schema, model, Document } from 'mongoose';

interface IPurchaseOrderItem {
  product: Schema.Types.ObjectId; // References Product
  quantity: number;
  costPrice: number;
}

export interface IPurchaseOrder extends Document {
  supplier: Schema.Types.ObjectId; // References Supplier
  branch: Schema.Types.ObjectId; // References Branch
  items: IPurchaseOrderItem[];
  totalAmount: number;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  orderDate: Date;
  receivedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseOrderItemSchema = new Schema<IPurchaseOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  costPrice: { type: Number, required: true }
});

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    items: [purchaseOrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'ordered', 'received', 'cancelled'],
      default: 'draft'
    },
    orderDate: { type: Date, default: Date.now },
    receivedDate: { type: Date }
  },
  { timestamps: true }
);

export const PurchaseOrder = model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);
export default PurchaseOrder;
