import { Schema, model, Document } from 'mongoose';

interface IInvoiceItem {
  itemType: 'service' | 'product';
  itemId: Schema.Types.ObjectId; // References Service or Product
  name: string;
  quantity: number;
  price: number;
  taxAmount: number; // calculated tax on this line item
  discountAmount: number; // calculated discount on this line item
  stylist?: Schema.Types.ObjectId; // References User (stylist who performed the service)
  subtotal: number; // price * quantity - discountAmount + taxAmount
}

interface IPaymentItem {
  method: 'cash' | 'card' | 'upi' | 'wallet' | 'gift_card';
  amount: number;
  transactionId?: string;
  paidAt: Date;
}

export interface IInvoice extends Document {
  invoiceNumber: string; // e.g. INV-BR001-1004
  branch: Schema.Types.ObjectId; // References Branch
  customer?: Schema.Types.ObjectId; // References Customer (optional for walk-ins)
  customerName?: string; // For walk-ins
  customerPhone?: string; // For walk-ins
  appointment?: Schema.Types.ObjectId; // References Appointment (optional)
  items: IInvoiceItem[];
  coupon?: Schema.Types.ObjectId; // References Coupon
  subtotal: number; // sum of price * quantity
  taxTotal: number;
  discountTotal: number;
  roundOff: number;
  totalAmount: number; // subtotal - discountTotal + taxTotal + roundOff
  status: 'paid' | 'partially_paid' | 'unpaid' | 'void' | 'refunded';
  payments: IPaymentItem[];
  paymentStatus: 'completed' | 'pending' | 'failed';
  billedBy: Schema.Types.ObjectId; // References User (receptionist/manager)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>({
  itemType: { type: String, enum: ['service', 'product'], required: true },
  itemId: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  stylist: { type: Schema.Types.ObjectId, ref: 'User' },
  subtotal: { type: Number, required: true }
});

const paymentItemSchema = new Schema<IPaymentItem>({
  method: { type: String, enum: ['cash', 'card', 'upi', 'wallet', 'gift_card'], required: true },
  amount: { type: Number, required: true },
  transactionId: { type: String, default: '' },
  paidAt: { type: Date, default: Date.now }
});

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    items: [invoiceItemSchema],
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    subtotal: { type: Number, required: true },
    taxTotal: { type: Number, required: true },
    discountTotal: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['paid', 'partially_paid', 'unpaid', 'void', 'refunded'],
      default: 'unpaid'
    },
    payments: [paymentItemSchema],
    paymentStatus: { type: String, enum: ['completed', 'pending', 'failed'], default: 'pending' },
    billedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

invoiceSchema.index({ branch: 1, invoiceNumber: 1 });
invoiceSchema.index({ customer: 1 });

export const Invoice = model<IInvoice>('Invoice', invoiceSchema);
export default Invoice;
