import { Request, Response, NextFunction } from 'express';
import Coupon from '../models/Coupon';
import ErrorHandler from '../utils/ErrorHandler';

export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

export const getCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await Coupon.find();
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
};

// Validate and fetch coupon details during POS checkout
export const validateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, amount } = req.query;

    if (!code || !amount) {
      return next(new ErrorHandler('Coupon code and bill amount are required', 400));
    }

    const coupon = await Coupon.findOne({ code: (code as string).toUpperCase(), status: 'active' });
    if (!coupon) {
      return next(new ErrorHandler('Invalid or inactive coupon code', 404));
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return next(new ErrorHandler('Coupon has expired or is not yet active', 400));
    }

    const billAmt = Number(amount);
    if (billAmt < coupon.minBillAmount) {
      return next(new ErrorHandler(`Minimum bill amount to use coupon is ₹${coupon.minBillAmount}`, 400));
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return next(new ErrorHandler('Coupon usage limit reached', 400));
    }

    let discount = 0;
    if (coupon.discountType === 'flat') {
      discount = coupon.discountValue;
    } else {
      discount = billAmt * (coupon.discountValue / 100);
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Coupon is valid',
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discount),
        finalAmount: Math.round(billAmt - discount)
      }
    });
  } catch (error) {
    next(error);
  }
};
