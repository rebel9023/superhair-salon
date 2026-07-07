import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import ErrorHandler from '../utils/ErrorHandler';

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, sku, barcode, category, price, costPrice, minStockAlert } = req.body;

    const existingSku = await Product.findOne({ sku });
    if (existingSku) return next(new ErrorHandler('Product SKU already exists', 400));

    const existingBarcode = await Product.findOne({ barcode });
    if (existingBarcode) return next(new ErrorHandler('Product Barcode already exists', 400));

    const product = await Product.create({
      name,
      sku,
      barcode,
      category,
      price,
      costPrice,
      minStockAlert
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!product) return next(new ErrorHandler('Product not found', 404));
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return next(new ErrorHandler('Product not found', 404));
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};
