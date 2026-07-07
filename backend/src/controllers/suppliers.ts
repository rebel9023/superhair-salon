import { Request, Response, NextFunction } from 'express';
import Supplier from '../models/Supplier';
import ErrorHandler from '../utils/ErrorHandler';

export const createSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

export const getSuppliers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!supplier) return next(new ErrorHandler('Supplier not found', 404));
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return next(new ErrorHandler('Supplier not found', 404));
    res.status(200).json({ success: true, message: 'Supplier deleted' });
  } catch (error) {
    next(error);
  }
};
