import { Request, Response, NextFunction } from 'express';
import Service from '../models/Service';
import ErrorHandler from '../utils/ErrorHandler';

export const createService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

export const getServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, status } = req.query;
    const filter: any = {};
    if (category) filter.category = category;
    if (status) filter.status = status;

    const services = await Service.find(filter).populate('category');
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!service) return next(new ErrorHandler('Service not found', 404));
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return next(new ErrorHandler('Service not found', 404));
    res.status(200).json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
};
