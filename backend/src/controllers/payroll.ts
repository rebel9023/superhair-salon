import { Request, Response, NextFunction } from 'express';
import Payroll from '../models/Payroll';
import Staff from '../models/Staff';
import Invoice from '../models/Invoice';
import Attendance from '../models/Attendance';
import ErrorHandler from '../utils/ErrorHandler';

export const generateMonthlyPayroll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, month, year } = req.body;

    const staff = await Staff.findOne({ user: userId }).populate('user');
    if (!staff) return next(new ErrorHandler('Staff profile not found', 404));

    // Calculate dates for the month
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

    // 1. Calculate Commissions: find all paid invoices in the month for this stylist
    const invoices = await Invoice.find({
      status: 'paid',
      createdAt: { $gte: startDate, $lte: endDate },
      'items.stylist': userId
    });

    let totalServiceValue = 0;
    for (const inv of invoices) {
      for (const item of inv.items) {
        if (item.itemType === 'service' && item.stylist?.toString() === userId.toString()) {
          // Add service value before taxes and discounts
          totalServiceValue += item.price * item.quantity;
        }
      }
    }

    const commissionRate = staff.commissionRate || 0;
    const earnedCommission = totalServiceValue * (commissionRate / 100);

    // 2. Attendance count for salary deductions check
    const attendanceRecords = await Attendance.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    });

    const totalDaysInMonth = new Date(Number(year), Number(month), 0).getDate();
    const daysPresent = attendanceRecords.filter(r => r.status === 'present').length;
    const daysHalfDay = attendanceRecords.filter(r => r.status === 'half_day').length;
    const workingDaysCount = daysPresent + (daysHalfDay * 0.5);

    // Simple payroll formula: baseSalary + commission
    const baseSalary = staff.baseSalary || 0;
    const bonus = 0;
    const deductions = 0;
    const tax = Math.round((baseSalary + earnedCommission) * 0.1); // 10% TDS tax
    const netSalary = Math.round(baseSalary + earnedCommission + bonus - deductions - tax);

    // Update or Create payroll ledger record
    const payroll = await Payroll.findOneAndUpdate(
      { user: userId, month, year },
      {
        baseSalary,
        commission: Math.round(earnedCommission),
        bonus,
        deductions,
        tax,
        netSalary,
        status: 'processed'
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Payroll generated successfully',
      data: {
        payroll,
        workingDays: workingDaysCount,
        totalDays: totalDaysInMonth,
        commissionableSales: totalServiceValue
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month, year } = req.query;
    const filter: any = {};
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const payrolls = await Payroll.find(filter).populate({
      path: 'user',
      populate: { path: 'role' }
    });
    res.status(200).json({ success: true, data: payrolls });
  } catch (error) {
    next(error);
  }
};
