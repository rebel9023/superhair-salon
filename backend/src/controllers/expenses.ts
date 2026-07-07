import { Request, Response, NextFunction } from 'express';
import Expense from '../models/Expense';
import ErrorHandler from '../utils/ErrorHandler';
import { AuthRequest } from '../middlewares/auth';

export const createExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category, amount, date, description, receiptUrl } = req.body;
    if (!req.user) return next(new ErrorHandler('Unauthorized', 401));

    const expense = await Expense.create({
      branch: req.user.branch || req.body.branch,
      category,
      amount,
      date,
      description,
      receiptUrl,
      recordedBy: req.user.id
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

export const getExpenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branch, category } = req.query;
    const filter: any = {};
    if (branch) filter.branch = branch;
    if (category) filter.category = category;

    const expenses = await Expense.find(filter)
      .populate('branch')
      .populate('recordedBy', 'name')
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
};
