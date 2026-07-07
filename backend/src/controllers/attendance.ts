import { Request, Response, NextFunction } from 'express';
import Attendance from '../models/Attendance';
import ErrorHandler from '../utils/ErrorHandler';
import { AuthRequest } from '../middlewares/auth';

export const clockIn = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new ErrorHandler('Unauthorized', 401));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      user: req.user.id,
      date: today
    });

    if (existing) {
      return next(new ErrorHandler('Already clocked in for today', 400));
    }

    const attendance = await Attendance.create({
      user: req.user.id,
      branch: req.user.branch || req.body.branch, // fallback
      date: today,
      clockIn: new Date(),
      status: 'present'
    });

    res.status(201).json({ success: true, message: 'Clocked in successfully', data: attendance });
  } catch (error) {
    next(error);
  }
};

export const clockOut = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new ErrorHandler('Unauthorized', 401));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: req.user.id,
      date: today
    });

    if (!attendance) {
      return next(new ErrorHandler('No clock-in record found for today', 400));
    }

    if (attendance.clockOut) {
      return next(new ErrorHandler('Already clocked out for today', 400));
    }

    attendance.clockOut = new Date();
    // Calculate total hours, optionally update status to half_day if hours < 4
    await attendance.save();

    res.status(200).json({ success: true, message: 'Clocked out successfully', data: attendance });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branch, month, year } = req.query;
    const filter: any = {};

    if (branch) filter.branch = branch;
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(filter).populate('user');
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};
