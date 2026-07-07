import { Request, Response, NextFunction } from 'express';
import Membership from '../models/Membership';
import CustomerMembership from '../models/CustomerMembership';
import Customer from '../models/Customer';
import ErrorHandler from '../utils/ErrorHandler';

export const createMembership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const membership = await Membership.create(req.body);
    res.status(201).json({ success: true, data: membership });
  } catch (error) {
    next(error);
  }
};

export const getMemberships = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberships = await Membership.find();
    res.status(200).json({ success: true, data: memberships });
  } catch (error) {
    next(error);
  }
};

export const subscribeCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, membershipId } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) return next(new ErrorHandler('Customer not found', 404));

    const membership = await Membership.findById(membershipId);
    if (!membership) return next(new ErrorHandler('Membership tier not found', 404));

    // Expiry Date calculations
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + membership.durationMonths);

    // Cancel other active customer memberships
    await CustomerMembership.updateMany(
      { customer: customerId, status: 'active' },
      { status: 'cancelled' }
    );

    const subscription = await CustomerMembership.create({
      customer: customerId,
      membership: membershipId,
      startDate,
      endDate,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: `Subscribed ${customer.name} to ${membership.name} successfully.`,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

// Check if customer has active membership and return details
export const checkCustomerMembership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscription = await CustomerMembership.findOne({
      customer: req.params.customerId,
      status: 'active',
      endDate: { $gt: new Date() }
    }).populate('membership');

    res.status(200).json({
      success: true,
      active: !!subscription,
      data: subscription || null
    });
  } catch (error) {
    next(error);
  }
};
