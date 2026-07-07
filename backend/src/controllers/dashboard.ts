import { Request, Response, NextFunction } from 'express';
import Invoice from '../models/Invoice';
import Customer from '../models/Customer';
import Appointment from '../models/Appointment';
import Inventory from '../models/Inventory';
import Expense from '../models/Expense';
import Staff from '../models/Staff';
import Service from '../models/Service';
import ErrorHandler from '../utils/ErrorHandler';
import mongoose from 'mongoose';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branch } = req.query;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const branchFilter: any = {};
    if (branch) {
      branchFilter.branch = new mongoose.Types.ObjectId(branch as string);
    }

    // 1. Today's Revenue
    const todayInvoices = await Invoice.find({
      ...branchFilter,
      status: 'paid',
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });
    const todayRevenue = todayInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);

    // 2. Monthly Revenue
    const monthlyInvoices = await Invoice.find({
      ...branchFilter,
      status: 'paid',
      createdAt: { $gte: monthStart }
    });
    const monthlyRevenue = monthlyInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);

    // 3. Total Customers
    const totalCustomers = await Customer.countDocuments(branchFilter);

    // 4. Today's Appointments
    const todayAppointments = await Appointment.countDocuments({
      ...branchFilter,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    // 5. Low Inventory alert items
    const lowStockItems = await Inventory.find(branch ? { branch } : {})
      .populate('product')
      .populate('branch');

    const lowStockAlerts = lowStockItems.filter((item: any) => {
      return item.product && item.quantity <= (item.product.minStockAlert || 5);
    });

    // 6. Top Services Aggregation
    const topServices = await Invoice.aggregate([
      { $match: { ...branchFilter, status: 'paid' } },
      { $unwind: '$items' },
      { $match: { 'items.itemType': 'service' } },
      {
        $group: {
          _id: '$items.itemId',
          name: { $first: '$items.name' },
          count: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // 7. Monthly Sales Trend (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrends = await Invoice.aggregate([
      {
        $match: {
          ...branchFilter,
          status: 'paid',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 8. Expense Chart Aggregation
    const opexBreakdown = await Expense.aggregate([
      { $match: branch ? { branch: new mongoose.Types.ObjectId(branch as string) } : {} },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        cards: {
          todayRevenue,
          monthlyRevenue,
          totalCustomers,
          todayAppointments,
          lowStockCount: lowStockAlerts.length
        },
        charts: {
          topServices,
          monthlyTrends: monthlyTrends.map(t => ({
            month: new Date(t._id.year, t._id.month - 1).toLocaleString('default', { month: 'short' }),
            revenue: t.revenue
          })),
          opexBreakdown: opexBreakdown.map(e => ({
            category: e._id,
            value: e.totalAmount
          }))
        },
        lowStockItems: lowStockAlerts.slice(0, 5)
      }
    });
  } catch (error) {
    next(error);
  }
};
