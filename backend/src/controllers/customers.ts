import { Request, Response, NextFunction } from 'express';
import Customer from '../models/Customer';
import LoyaltyTransaction from '../models/LoyaltyTransaction';
import Invoice from '../models/Invoice';
import ErrorHandler from '../utils/ErrorHandler';

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, birthday, anniversary, notes, branch } = req.body;

    const existing = await Customer.findOne({ phone });
    if (existing) {
      return next(new ErrorHandler('Customer with this phone number already exists', 400));
    }

    const customer = await Customer.create({
      name,
      email,
      phone,
      birthday,
      anniversary,
      notes,
      branch
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, branch, status } = req.query;
    const filter: any = {};

    if (branch) filter.branch = branch;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!customer) return next(new ErrorHandler('Customer not found', 404));
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return next(new ErrorHandler('Customer not found', 404));
    res.status(200).json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    next(error);
  }
};

// Customer visit and invoice history
export const getCustomerHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoices = await Invoice.find({ customer: req.params.id })
      .populate('branch')
      .populate('items.stylist')
      .sort({ createdAt: -1 });

    const loyaltyTxns = await LoyaltyTransaction.find({ customer: req.params.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        invoices,
        loyaltyTransactions: loyaltyTxns
      }
    });
  } catch (error) {
    next(error);
  }
};

// Redeem loyalty points manually or check status
export const redeemLoyaltyPoints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { points, description } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) return next(new ErrorHandler('Customer not found', 404));
    if (customer.loyaltyPoints < points) {
      return next(new ErrorHandler('Insufficient loyalty points', 400));
    }

    customer.loyaltyPoints -= points;
    await customer.save();

    const transaction = await LoyaltyTransaction.create({
      customer: customer._id,
      type: 'redeem',
      points,
      description: description || 'Loyalty Points Manual Redemption'
    });

    res.status(200).json({
      success: true,
      message: 'Points redeemed successfully',
      data: {
        balancePoints: customer.loyaltyPoints,
        transaction
      }
    });
  } catch (error) {
    next(error);
  }
};
