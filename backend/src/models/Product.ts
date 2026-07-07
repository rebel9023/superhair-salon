import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  sku: string;
  barcode: string;
  category: string;
  price: number; // selling price
  costPrice: number; // purchase price
  minStockAlert: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true },
    barcode: { type: String, required: true, unique: true },
    category: { type: String, required: true, default: 'Retail' },
    price: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    minStockAlert: { type: Number, default: 5 }
  },
  { timestamps: true }
);

productSchema.index({ barcode: 1 });
productSchema.index({ sku: 1 });

export const Product = model<IProduct>('Product', productSchema);
export default Product;
