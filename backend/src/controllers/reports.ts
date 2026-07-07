import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Invoice from '../models/Invoice';
import Staff from '../models/Staff';
import Customer from '../models/Customer';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';

/* ─── Date Range helpers ─── */
const getDateRange = (period: string, from?: string, to?: string) => {
  const now = new Date();
  let start: Date, end: Date;

  end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case 'today':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last7':
      start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case 'last30':
      start = new Date(now);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'prevmonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'custom':
      start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
      end   = to   ? new Date(to)   : new Date(now);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
  }
  return { start, end };
};

/* ══════════════════════════════════════════════════
   GET /api/v1/reports/summary
══════════════════════════════════════════════════ */
export const getSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'today';
    const { start, end } = getDateRange(period, req.query.from as string, req.query.to as string);

    // Also compute weekly/monthly regardless of period for the top cards
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const weekStart  = new Date(); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1); monthStart.setHours(0, 0, 0, 0);

    const [todayInv, weekInv, monthInv] = await Promise.all([
      Invoice.find({ status: 'paid', createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
      Invoice.find({ status: 'paid', createdAt: { $gte: weekStart,  $lte: todayEnd } }).lean(),
      Invoice.find({ status: 'paid', createdAt: { $gte: monthStart, $lte: todayEnd } }).lean(),
    ]);

    const calcSummary = (invoices: any[]) => {
      let revenue = 0, cash = 0, online = 0, services = 0;
      let hairCuts = 0, beardStyling = 0, hairSpa = 0, hairColour = 0, facial = 0;
      const custSet = new Set<string>();
      let walkins = 0;

      invoices.forEach(inv => {
        revenue += inv.totalAmount;
        inv.payments?.forEach((p: any) => {
          if (p.method === 'cash') cash += p.amount;
          else online += p.amount;
        });
        if (inv.customer) custSet.add(inv.customer.toString());
        else walkins++;

        inv.items?.forEach((it: any) => {
          if (it.itemType === 'service') {
            services += it.quantity;
            const n = (it.name || '').toLowerCase();
            if (n.includes('hair cut') || n.includes('haircut') || n === 'round cut') hairCuts += it.quantity;
            if (n.includes('beard styling') || n.includes('clean shave') || n.includes('beard colour')) beardStyling += it.quantity;
            if (n.includes('hair spa') || n.includes('scalp') || n.includes('dandruff')) hairSpa += it.quantity;
            if (n.includes('colour') || n.includes('color') || n.includes('highlight')) hairColour += it.quantity;
            if (n.includes('clean up') || n.includes('facial') || n.includes('d-tan') || n.includes('scrub')) facial += it.quantity;
          }
        });
      });

      return {
        revenue, cash, online,
        bills: invoices.length,
        customers: custSet.size + walkins,
        services, hairCuts, beardStyling, hairSpa, hairColour, facial
      };
    };

    const todayData  = calcSummary(todayInv);
    const weekData   = calcSummary(weekInv);
    const monthData  = calcSummary(monthInv);

    res.status(200).json({
      success: true,
      data: { today: todayData, week: weekData, month: monthData }
    });
  } catch (error) { next(error); }
};

/* ══════════════════════════════════════════════════
   GET /api/v1/reports/services
══════════════════════════════════════════════════ */
export const getServiceReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'month';
    const { start, end } = getDateRange(period, req.query.from as string, req.query.to as string);

    const invoices = await Invoice.find({
      status: 'paid',
      createdAt: { $gte: start, $lte: end }
    }).lean();

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const weekStart  = new Date(); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0, 0, 0, 0);

    const map: Record<string, any> = {};

    invoices.forEach(inv => {
      const dt = new Date(inv.createdAt);
      const isToday = dt >= todayStart && dt <= todayEnd;
      const isWeek  = dt >= weekStart;

      inv.items?.forEach((it: any) => {
        if (it.itemType !== 'service') return;
        if (!map[it.name]) {
          map[it.name] = { name: it.name, todayCount: 0, weekCount: 0, monthCount: 0, todayRevenue: 0, weekRevenue: 0, monthRevenue: 0 };
        }
        const sub = it.price * it.quantity;
        map[it.name].monthCount   += it.quantity;
        map[it.name].monthRevenue += sub;
        if (isWeek)  { map[it.name].weekCount   += it.quantity; map[it.name].weekRevenue  += sub; }
        if (isToday) { map[it.name].todayCount  += it.quantity; map[it.name].todayRevenue += sub; }
      });
    });

    const servicePerformance = Object.values(map).sort((a: any, b: any) => b.monthRevenue - a.monthRevenue);

    res.status(200).json({ success: true, data: servicePerformance });
  } catch (error) { next(error); }
};

/* ══════════════════════════════════════════════════
   GET /api/v1/reports/staff
══════════════════════════════════════════════════ */
export const getStaffReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'month';
    const { start, end } = getDateRange(period, req.query.from as string, req.query.to as string);

    const invoices = await Invoice.find({
      status: 'paid',
      createdAt: { $gte: start, $lte: end }
    }).populate('billedBy', 'name').lean();

    const staffList = await Staff.find().populate('user', 'name').lean();
    const staffMap: Record<string, any> = {};

    staffList.forEach((st: any) => {
      staffMap[st.user._id.toString()] = {
        staffId: st._id.toString(),
        name: st.user.name,
        bills: 0, services: 0, hairCuts: 0,
        revenue: 0, cash: 0, online: 0
      };
    });

    invoices.forEach(inv => {
      inv.items?.forEach((it: any) => {
        if (it.itemType !== 'service') return;
        const uid = it.stylist?.toString();
        if (!uid || !staffMap[uid]) return;

        const entry = staffMap[uid];
        entry.services  += it.quantity;
        entry.revenue   += it.price * it.quantity;
        const n = (it.name || '').toLowerCase();
        if (n.includes('hair cut') || n.includes('haircut') || n === 'round cut') entry.hairCuts += it.quantity;
      });

      // Attribute bill + payments to first stylist found in items
      const firstStylistId = inv.items?.find((it: any) => it.stylist)?.stylist?.toString();
      if (firstStylistId && staffMap[firstStylistId]) {
        staffMap[firstStylistId].bills++;
        inv.payments?.forEach((p: any) => {
          if (p.method === 'cash') staffMap[firstStylistId].cash += p.amount;
          else staffMap[firstStylistId].online += p.amount;
        });
      }
    });

    const staffReport = Object.values(staffMap)
      .map((s: any) => ({ ...s, avgBillValue: s.bills > 0 ? Math.round(s.revenue / s.bills) : 0 }))
      .sort((a: any, b: any) => b.revenue - a.revenue);

    res.status(200).json({ success: true, data: staffReport });
  } catch (error) { next(error); }
};

/* ══════════════════════════════════════════════════
   GET /api/v1/reports/customers
══════════════════════════════════════════════════ */
export const getCustomerReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'month';
    const { start, end } = getDateRange(period, req.query.from as string, req.query.to as string);

    const invoices = await Invoice.find({
      status: 'paid',
      createdAt: { $gte: start, $lte: end }
    }).lean();

    const totalCustomers = await Customer.countDocuments();
    const newCustomers   = await Customer.countDocuments({ createdAt: { $gte: start, $lte: end } });

    const custSpend: Record<string, { name: string; phone: string; visits: number; spent: number }> = {};
    let walkins = 0;

    invoices.forEach(inv => {
      if (inv.customer) {
        const id = inv.customer.toString();
        if (!custSpend[id]) custSpend[id] = { name: inv.customerName || 'Customer', phone: inv.customerPhone || '', visits: 0, spent: 0 };
        custSpend[id].visits++;
        custSpend[id].spent += inv.totalAmount;
      } else {
        walkins++;
      }
    });

    const custArray  = Object.values(custSpend);
    const returning  = custArray.filter(c => c.visits > 1).length;
    const topBySpend = [...custArray].sort((a, b) => b.spent - a.spent).slice(0, 10);
    const topByVisit = [...custArray].sort((a, b) => b.visits - a.visits).slice(0, 10);

    // Enrich with names from Customer collection
    const custIds = Object.keys(custSpend).filter(id => mongoose.isValidObjectId(id));
    const custDocs = await Customer.find({ _id: { $in: custIds } }, 'name phone').lean();
    custDocs.forEach((c: any) => {
      if (custSpend[c._id.toString()]) {
        custSpend[c._id.toString()].name  = c.name;
        custSpend[c._id.toString()].phone = c.phone;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalCustomers, newCustomers,
        returningCustomers: returning,
        walkinCustomers: walkins,
        periodCustomers: custArray.length,
        topBySpend: topBySpend.slice(0, 10),
        topByVisits: topByVisit.slice(0, 10)
      }
    });
  } catch (error) { next(error); }
};

/* ══════════════════════════════════════════════════
   GET /api/v1/reports/payments
══════════════════════════════════════════════════ */
export const getPaymentReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'month';
    const { start, end } = getDateRange(period, req.query.from as string, req.query.to as string);

    const invoices = await Invoice.find({
      status: 'paid',
      createdAt: { $gte: start, $lte: end }
    }).lean();

    let cash = 0, upi = 0, card = 0, other = 0;
    invoices.forEach(inv => {
      inv.payments?.forEach((p: any) => {
        if (p.method === 'cash') cash += p.amount;
        else if (p.method === 'upi' || p.method === 'qr') upi += p.amount;
        else if (p.method === 'card') card += p.amount;
        else other += p.amount;
      });
    });

    const total = cash + upi + card + other;
    res.status(200).json({
      success: true,
      data: {
        cash, upi, card, other, total,
        cashPct:  total > 0 ? Math.round((cash  / total) * 100) : 0,
        upiPct:   total > 0 ? Math.round((upi   / total) * 100) : 0,
        cardPct:  total > 0 ? Math.round((card  / total) * 100) : 0,
        otherPct: total > 0 ? Math.round((other / total) * 100) : 0,
      }
    });
  } catch (error) { next(error); }
};

/* ══════════════════════════════════════════════════
   GET /api/v1/reports/sales-chart
══════════════════════════════════════════════════ */
export const getSalesChart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'last30';
    const { start, end } = getDateRange(period, req.query.from as string, req.query.to as string);

    const invoices = await Invoice.find({
      status: 'paid',
      createdAt: { $gte: start, $lte: end }
    }).select('createdAt totalAmount').lean();

    // Group by day
    const dayMap: Record<string, { date: string; revenue: number; bills: number }> = {};
    invoices.forEach(inv => {
      const d = new Date(inv.createdAt).toISOString().split('T')[0];
      if (!dayMap[d]) dayMap[d] = { date: d, revenue: 0, bills: 0 };
      dayMap[d].revenue += inv.totalAmount;
      dayMap[d].bills++;
    });

    const dailyData = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

    // Group by month (last 12 months)
    const monthMap: Record<string, { month: string; revenue: number; bills: number }> = {};
    invoices.forEach(inv => {
      const d = new Date(inv.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { month: label, revenue: 0, bills: 0 };
      monthMap[key].revenue += inv.totalAmount;
      monthMap[key].bills++;
    });

    const monthlyData = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    res.status(200).json({ success: true, data: { dailyData, monthlyData } });
  } catch (error) { next(error); }
};

/* ══════════════════════════════════════════════════
   GET /api/v1/reports/recent-bills
══════════════════════════════════════════════════ */
export const getRecentBills = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'today';
    const limit  = parseInt(req.query.limit as string) || 50;
    const staffFilter   = req.query.staff   as string;
    const paymentFilter = req.query.payment as string;

    const { start, end } = getDateRange(period, req.query.from as string, req.query.to as string);

    const query: any = { status: 'paid', createdAt: { $gte: start, $lte: end } };

    const bills = await Invoice
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('customer', 'name phone')
      .populate('billedBy', 'name')
      .lean();

    // Filter by payment method in memory
    let filtered = paymentFilter
      ? bills.filter(b => b.payments?.some((p: any) => p.method === paymentFilter))
      : bills;

    res.status(200).json({ success: true, data: filtered });
  } catch (error) { next(error); }
};

/* ══════════════════════════════════════════════════
   GET /api/v1/reports/top-performers
══════════════════════════════════════════════════ */
export const getTopPerformers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'month';
    const { start, end } = getDateRange(period, req.query.from as string, req.query.to as string);

    const invoices = await Invoice.find({
      status: 'paid',
      createdAt: { $gte: start, $lte: end }
    }).lean();

    // Top staff by revenue
    const staffRevMap: Record<string, number> = {};
    // Top service by count
    const serviceCountMap: Record<string, number> = {};
    // Best day
    const dayRevMap: Record<string, number> = {};
    // Top customer by spend
    const custSpendMap: Record<string, { name: string; spent: number }> = {};

    invoices.forEach(inv => {
      const day = new Date(inv.createdAt).toISOString().split('T')[0];
      dayRevMap[day] = (dayRevMap[day] || 0) + inv.totalAmount;

      if (inv.customer) {
        const id = inv.customer.toString();
        if (!custSpendMap[id]) custSpendMap[id] = { name: inv.customerName || 'Customer', spent: 0 };
        custSpendMap[id].spent += inv.totalAmount;
      }

      inv.items?.forEach((it: any) => {
        if (it.itemType !== 'service') return;
        const uid = it.stylist?.toString();
        if (uid) staffRevMap[uid] = (staffRevMap[uid] || 0) + it.price * it.quantity;
        serviceCountMap[it.name] = (serviceCountMap[it.name] || 0) + it.quantity;
      });
    });

    // Resolve top staff name
    const topStaffId = Object.keys(staffRevMap).sort((a, b) => staffRevMap[b] - staffRevMap[a])[0];
    let topStaffName = 'N/A', topStaffRevenue = 0;
    if (topStaffId) {
      const u = await User.findById(topStaffId, 'name').lean();
      topStaffName    = (u as any)?.name || 'Unknown';
      topStaffRevenue = staffRevMap[topStaffId];
    }

    const topServiceEntry = Object.keys(serviceCountMap).sort((a, b) => serviceCountMap[b] - serviceCountMap[a])[0];
    const bestDayEntry    = Object.keys(dayRevMap).sort((a, b) => dayRevMap[b] - dayRevMap[a])[0];
    const topCustEntry    = Object.values(custSpendMap).sort((a, b) => b.spent - a.spent)[0];

    res.status(200).json({
      success: true,
      data: {
        topStaff:    { name: topStaffName,  revenue: topStaffRevenue },
        topService:  { name: topServiceEntry  || 'N/A', count: topServiceEntry  ? serviceCountMap[topServiceEntry]  : 0 },
        bestDay:     { date: bestDayEntry    || 'N/A', revenue: bestDayEntry    ? dayRevMap[bestDayEntry]    : 0 },
        topCustomer: topCustEntry ? { name: topCustEntry.name, spent: topCustEntry.spent } : { name: 'N/A', spent: 0 }
      }
    });
  } catch (error) { next(error); }
};

/* Legacy single endpoint — kept for backwards compat */
export const getReportsData = getSummary;
