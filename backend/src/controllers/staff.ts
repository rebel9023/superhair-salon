import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Staff from '../models/Staff';
import Service from '../models/Service';
import ErrorHandler from '../utils/ErrorHandler';

export const createStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, baseSalary, commissionRate, specialties, schedule } = req.body;

    const existing = await Staff.findOne({ user: userId });
    if (existing) {
      return next(new ErrorHandler('Staff details for this user already exists', 400));
    }

    const staff = await Staff.create({
      user: userId,
      baseSalary,
      commissionRate,
      specialties,
      schedule
    });

    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const getStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branch } = req.query;
    const filter: any = {};

    // Get all users who have stylist or staff roles first, or just list all Staff documents
    // Let's populate the user details. If we want branch-specific, we filter the user population.
    const staffMembers = await Staff.find()
      .populate({
        path: 'user',
        match: branch ? { branch } : {},
        populate: { path: 'role' }
      })
      .populate('specialties');

    // Filter out entries where the populated user is null (due to branch match criteria)
    const filteredStaff = staffMembers.filter(member => member.user !== null);

    res.status(200).json({ success: true, data: filteredStaff });
  } catch (error) {
    next(error);
  }
};

export const getStaffById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate('user')
      .populate('specialties');

    if (!staff) return next(new ErrorHandler('Staff details not found', 404));
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const updateStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('user');

    if (!staff) return next(new ErrorHandler('Staff details not found', 404));
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};
