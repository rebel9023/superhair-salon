import { Request, Response, NextFunction } from 'express';
import Invoice from '../models/Invoice';

export const getReportsData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Query month paid invoices
    const monthInvoices = await Invoice.find({
      status: 'paid',
      createdAt: { $gte: monthStart }
    });

    const weekInvoices = monthInvoices.filter(inv => inv.createdAt >= weekStart);
    const todayInvoices = monthInvoices.filter(inv => inv.createdAt >= todayStart && inv.createdAt <= todayEnd);

    // Summary calculations
    const todaySales = todayInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const weeklySales = weekInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const monthlySales = monthInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalBillsToday = todayInvoices.length;

    let cashCollectionToday = 0;
    let onlineCollectionToday = 0;
    todayInvoices.forEach(inv => {
      inv.payments.forEach(p => {
        if (p.method === 'cash') {
          cashCollectionToday += p.amount;
        } else {
          onlineCollectionToday += p.amount;
        }
      });
    });

    // Unique customers count today
    const uniqueCustIds = new Set();
    let walkinCount = 0;
    todayInvoices.forEach(inv => {
      if (inv.customer) {
        uniqueCustIds.add(inv.customer.toString());
      } else {
        walkinCount++;
      }
    });
    const totalCustomersToday = uniqueCustIds.size + walkinCount;

    // Specific category calculations
    let totalServicesToday = 0;
    let hairCutsToday = 0;
    let beardStylingToday = 0;
    let hairSpaToday = 0;
    let hairColourToday = 0;
    let facialToday = 0;

    todayInvoices.forEach(inv => {
      inv.items.forEach((it: any) => {
        if (it.itemType === 'service') {
          totalServicesToday += it.quantity;
          const nameLower = it.name.toLowerCase();
          if (nameLower.includes('hair cut') || nameLower.includes('haircut') || nameLower.includes('cut')) {
            hairCutsToday += it.quantity;
          }
          if (nameLower.includes('beard styling') || nameLower.includes('shave') || nameLower.includes('beard')) {
            beardStylingToday += it.quantity;
          }
          if (nameLower.includes('hair spa') || nameLower.includes('spa')) {
            hairSpaToday += it.quantity;
          }
          if (nameLower.includes('hair colour') || nameLower.includes('colour') || nameLower.includes('color')) {
            hairColourToday += it.quantity;
          }
          if (nameLower.includes('facial') || nameLower.includes('clean up') || nameLower.includes('scrub') || nameLower.includes('tan')) {
            facialToday += it.quantity;
          }
        }
      });
    });

    // Service performance table data
    const servicePerformanceMap: Record<string, {
      name: string;
      todayCount: number;
      weekCount: number;
      monthCount: number;
      todayRevenue: number;
      weekRevenue: number;
      monthRevenue: number;
    }> = {};

    monthInvoices.forEach(inv => {
      const isToday = inv.createdAt >= todayStart && inv.createdAt <= todayEnd;
      const isWeek = inv.createdAt >= weekStart;

      inv.items.forEach((it: any) => {
        if (it.itemType === 'service') {
          if (!servicePerformanceMap[it.name]) {
            servicePerformanceMap[it.name] = {
              name: it.name,
              todayCount: 0,
              weekCount: 0,
              monthCount: 0,
              todayRevenue: 0,
              weekRevenue: 0,
              monthRevenue: 0
            };
          }
          const data = servicePerformanceMap[it.name];
          const itemSubtotal = it.price * it.quantity;

          data.monthCount += it.quantity;
          data.monthRevenue += itemSubtotal;

          if (isWeek) {
            data.weekCount += it.quantity;
            data.weekRevenue += itemSubtotal;
          }
          if (isToday) {
            data.todayCount += it.quantity;
            data.todayRevenue += itemSubtotal;
          }
        }
      });
    });

    const servicePerformance = Object.values(servicePerformanceMap);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          todaySales,
          weeklySales,
          monthlySales,
          totalBillsToday,
          cashCollectionToday,
          onlineCollectionToday,
          totalCustomersToday,
          totalServicesToday,
          hairCutsToday,
          beardStylingToday,
          hairSpaToday,
          hairColourToday,
          facialToday
        },
        servicePerformance
      }
    });
  } catch (error) {
    next(error);
  }
};
