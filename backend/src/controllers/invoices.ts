import { Request, Response, NextFunction } from 'express';
import Invoice from '../models/Invoice';
import Customer from '../models/Customer';
import Product from '../models/Product';
import Service from '../models/Service';
import Inventory from '../models/Inventory';
import StockMovement from '../models/StockMovement';
import Coupon from '../models/Coupon';
import CustomerMembership from '../models/CustomerMembership';
import LoyaltyTransaction from '../models/LoyaltyTransaction';
import Branch from '../models/Branch';
import ErrorHandler from '../utils/ErrorHandler';
import { AuthRequest } from '../middlewares/auth';

export const checkoutInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      items,
      couponCode,
      payments,
      notes,
      appointmentId
    } = req.body;

    if (!req.user) return next(new ErrorHandler('Unauthorized', 401));
    const branchId = req.user.branch;
    if (!branchId) {
      return next(new ErrorHandler('Manager or receptionist must belong to a branch to checkout', 400));
    }

    const branch = await Branch.findById(branchId);
    if (!branch) return next(new ErrorHandler('Branch not found', 404));

    // 1. Check Customer Membership discounts
    let serviceDiscountPct = 0;
    let productDiscountPct = 0;
    let customerDoc: any = null;

    if (customerId) {
      customerDoc = await Customer.findById(customerId);
      if (!customerDoc) return next(new ErrorHandler('Customer not found', 404));

      // Query active membership
      const activeSubscription = await CustomerMembership.findOne({
        customer: customerId,
        status: 'active',
        endDate: { $gt: new Date() }
      }).populate('membership');

      if (activeSubscription) {
        const membership = activeSubscription.membership as any;
        serviceDiscountPct = membership.benefits.discountPercentageOnServices || 0;
        productDiscountPct = membership.benefits.discountPercentageOnProducts || 0;
      }
    }

    // 2. Process Items
    const invoiceItems: any[] = [];
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    for (const item of items) {
      if (item.itemType === 'service') {
        const service = await Service.findById(item.itemId);
        if (!service) return next(new ErrorHandler(`Service ${item.itemId} not found`, 404));

        const basePrice = service.price;
        // Apply membership discount or default discount
        const membershipDiscount = basePrice * (serviceDiscountPct / 100);
        const itemDiscount = Math.max(membershipDiscount, service.discount || 0);

        const taxableValue = Math.max(0, basePrice - itemDiscount);
        const taxRate = 0;
        const taxAmount = 0;

        const itemSubtotal = taxableValue * item.quantity;

        subtotal += basePrice * item.quantity;
        discountTotal += itemDiscount * item.quantity;
        taxTotal += 0;

        invoiceItems.push({
          itemType: 'service',
          itemId: service._id,
          name: service.name,
          quantity: item.quantity,
          price: basePrice,
          taxAmount: taxAmount * item.quantity,
          discountAmount: itemDiscount * item.quantity,
          stylist: item.stylistId || undefined,
          subtotal: itemSubtotal
        });
      } else if (item.itemType === 'product') {
        const product = await Product.findById(item.itemId);
        if (!product) return next(new ErrorHandler(`Product ${item.itemId} not found`, 404));

        // Verify stock levels at this branch
        const inventory = await Inventory.findOne({ product: product._id, branch: branchId });
        if (!inventory || inventory.quantity < item.quantity) {
          return next(new ErrorHandler(`Insufficient stock for product ${product.name}. Available: ${inventory ? inventory.quantity : 0}`, 400));
        }

        const basePrice = product.price;
        // Apply product membership discount
        const itemDiscount = basePrice * (productDiscountPct / 100);

        const taxableValue = Math.max(0, basePrice - itemDiscount);
        const taxRate = 0;
        const taxAmount = 0;

        const itemSubtotal = taxableValue * item.quantity;

        subtotal += basePrice * item.quantity;
        discountTotal += itemDiscount * item.quantity;
        taxTotal += 0;

        invoiceItems.push({
          itemType: 'product',
          itemId: product._id,
          name: product.name,
          quantity: item.quantity,
          price: basePrice,
          taxAmount: taxAmount * item.quantity,
          discountAmount: itemDiscount * item.quantity,
          subtotal: itemSubtotal
        });

        // Deduct Inventory Stock
        inventory.quantity -= item.quantity;
        await inventory.save();

        // Log StockMovement
        await StockMovement.create({
          product: product._id,
          branch: branchId,
          quantity: -item.quantity,
          type: 'sale',
          performedBy: req.user.id,
          notes: `POS Checkout Invoice generation`
        });
      }
    }

    // 3. Process Coupon Discount
    let couponDoc: any = null;
    let couponDiscount = 0;
    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase(), status: 'active' });
      if (!couponDoc) {
        return next(new ErrorHandler('Invalid or inactive coupon code', 400));
      }
      const now = new Date();
      if (now < couponDoc.startDate || now > couponDoc.endDate) {
        return next(new ErrorHandler('Coupon code has expired', 400));
      }

      const totalBilledSoFar = subtotal - discountTotal + taxTotal;
      if (totalBilledSoFar < couponDoc.minBillAmount) {
        return next(new ErrorHandler(`Minimum bill amount to use coupon is ₹${couponDoc.minBillAmount}`, 400));
      }

      if (couponDoc.discountType === 'flat') {
        couponDiscount = couponDoc.discountValue;
      } else {
        const calculatedDiscount = totalBilledSoFar * (couponDoc.discountValue / 100);
        couponDiscount = couponDoc.maxDiscount ? Math.min(calculatedDiscount, couponDoc.maxDiscount) : calculatedDiscount;
      }

      discountTotal += couponDiscount;
      couponDoc.usedCount += 1;
      await couponDoc.save();
    }

    // 4. Calculate final payable amount
    const netPayable = Math.max(0, subtotal - discountTotal + taxTotal);
    const roundOff = Math.round(netPayable) - netPayable;
    const finalAmount = Math.round(netPayable);

    // 5. Verify Payments
    const totalPaid = payments.reduce((acc: number, curr: any) => acc + curr.amount, 0);
    let invoiceStatus: 'paid' | 'partially_paid' | 'unpaid' = 'unpaid';

    if (totalPaid >= finalAmount) {
      invoiceStatus = 'paid';
    } else if (totalPaid > 0) {
      invoiceStatus = 'partially_paid';
    }

    // 6. Generate Unique Invoice Number (Prefix + timestamp suffix)
    const suffix = Date.now().toString().slice(-6) + Math.floor(10 + Math.random() * 90);
    const invoiceNumber = `${branch.invoicePrefix || 'INV-'}${suffix}`;

    // 7. Accumulate Loyalty Points (e.g. 5% of service/product values paid)
    if (customerDoc && invoiceStatus === 'paid') {
      const earnedPoints = Math.floor(finalAmount / 20); // 1 point per 20 rupees
      customerDoc.loyaltyPoints += earnedPoints;
      await customerDoc.save();

      await LoyaltyTransaction.create({
        customer: customerDoc._id,
        type: 'earn',
        points: earnedPoints,
        description: `Loyalty Points Earned on Invoice ${invoiceNumber}`
      });
    }

    const invoice = await Invoice.create({
      invoiceNumber,
      branch: branchId,
      customer: customerId || undefined,
      customerName: customerId ? customerDoc.name : customerName || 'Walk-in Customer',
      customerPhone: customerId ? customerDoc.phone : customerPhone || '',
      appointment: appointmentId || undefined,
      items: invoiceItems,
      coupon: couponDoc ? couponDoc._id : undefined,
      subtotal,
      taxTotal,
      discountTotal,
      roundOff,
      totalAmount: finalAmount,
      status: invoiceStatus,
      payments,
      paymentStatus: totalPaid >= finalAmount ? 'completed' : 'pending',
      billedBy: req.user.id,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Invoice checked out successfully',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branch, search } = req.query;
    const filter: any = {};
    if (branch) filter.branch = branch;

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(filter)
      .populate('branch')
      .populate('billedBy', 'name')
      .populate('items.stylist', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('branch')
      .populate('billedBy', 'name')
      .populate('items.stylist', 'name');

    if (!invoice) return next(new ErrorHandler('Invoice not found', 404));
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

export const refundInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return next(new ErrorHandler('Invoice not found', 404));

    if (invoice.status === 'refunded') {
      return next(new ErrorHandler('Invoice is already refunded', 400));
    }

    // Refund stock quantities if products were sold
    for (const item of invoice.items) {
      if (item.itemType === 'product') {
        const inventory = await Inventory.findOne({ product: item.itemId, branch: invoice.branch });
        if (inventory) {
          inventory.quantity += item.quantity;
          await inventory.save();
        }
      }
    }

    invoice.status = 'refunded';
    invoice.paymentStatus = 'failed';
    await invoice.save();

    res.status(200).json({ success: true, message: 'Invoice refunded successfully', data: invoice });
  } catch (error) {
    next(error);
  }
};
