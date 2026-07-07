import { Request, Response, NextFunction } from 'express';
import Branch from '../models/Branch';
import ErrorHandler from '../utils/ErrorHandler';

export const createBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, address, contact, email, gstNumber, invoicePrefix, settings } = req.body;
    const existing = await Branch.findOne({ code });
    if (existing) {
      return next(new ErrorHandler('Branch with this code already exists', 400));
    }
    const branch = await Branch.create({
      name,
      code,
      address,
      contact,
      email,
      gstNumber,
      invoicePrefix,
      settings
    });
    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

export const getBranches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branches = await Branch.find();
    res.status(200).json({ success: true, data: branches });
  } catch (error) {
    next(error);
  }
};

export const getBranchById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return next(new ErrorHandler('Branch not found', 404));
    }
    res.status(200).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

export const updateBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!branch) {
      return next(new ErrorHandler('Branch not found', 404));
    }
    res.status(200).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

export const deleteBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return next(new ErrorHandler('Branch not found', 404));
    }
    res.status(200).json({ success: true, message: 'Branch deleted successfully' });
  } catch (error) {
    next(error);
  }
};
