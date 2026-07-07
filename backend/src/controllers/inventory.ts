import { Request, Response, NextFunction } from 'express';
import Inventory from '../models/Inventory';
import StockMovement from '../models/StockMovement';
import PurchaseOrder from '../models/PurchaseOrder';
import ErrorHandler from '../utils/ErrorHandler';
import { AuthRequest } from '../middlewares/auth';

export const getInventoryByBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branch } = req.query;
    const filter: any = {};
    if (branch) filter.branch = branch;

    const stock = await Inventory.find(filter)
      .populate('product')
      .populate('branch');

    res.status(200).json({ success: true, data: stock });
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, branchId, quantity, notes } = req.body;
    if (!req.user) return next(new ErrorHandler('Unauthorized', 401));

    let inventory = await Inventory.findOne({ product: productId, branch: branchId });
    if (!inventory) {
      inventory = new Inventory({
        product: productId,
        branch: branchId,
        quantity: 0
      });
    }

    const previousQty = inventory.quantity;
    inventory.quantity = quantity; // set absolute quantity
    await inventory.save();

    const diff = quantity - previousQty;

    // Log stock movement
    await StockMovement.create({
      product: productId,
      branch: branchId,
      quantity: diff,
      type: 'adjustment',
      performedBy: req.user.id,
      notes: notes || 'Manual inventory adjustment'
    });

    res.status(200).json({ success: true, message: 'Stock adjusted', data: inventory });
  } catch (error) {
    next(error);
  }
};

export const transferStock = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, fromBranchId, toBranchId, quantity, notes } = req.body;
    if (!req.user) return next(new ErrorHandler('Unauthorized', 401));

    // 1. Check sender stock
    const sourceInventory = await Inventory.findOne({ product: productId, branch: fromBranchId });
    if (!sourceInventory || sourceInventory.quantity < quantity) {
      return next(new ErrorHandler('Insufficient stock at source branch', 400));
    }

    // 2. Adjust sender stock
    sourceInventory.quantity -= quantity;
    await sourceInventory.save();

    // 3. Adjust receiver stock
    let targetInventory = await Inventory.findOne({ product: productId, branch: toBranchId });
    if (!targetInventory) {
      targetInventory = new Inventory({
        product: productId,
        branch: toBranchId,
        quantity: 0
      });
    }
    targetInventory.quantity += quantity;
    await targetInventory.save();

    // 4. Log movements
    await StockMovement.create({
      product: productId,
      branch: fromBranchId,
      quantity: -quantity,
      type: 'transfer_out',
      performedBy: req.user.id,
      notes: notes || `Stock transfer to branch ${toBranchId}`
    });

    await StockMovement.create({
      product: productId,
      branch: toBranchId,
      quantity: quantity,
      type: 'transfer_in',
      performedBy: req.user.id,
      notes: notes || `Stock transfer from branch ${fromBranchId}`
    });

    res.status(200).json({ success: true, message: 'Stock transferred successfully' });
  } catch (error) {
    next(error);
  }
};

export const createPurchaseOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { supplier, branch, items, totalAmount } = req.body;

    const po = await PurchaseOrder.create({
      supplier,
      branch,
      items,
      totalAmount,
      status: 'draft'
    });

    res.status(201).json({ success: true, data: po });
  } catch (error) {
    next(error);
  }
};

export const receivePurchaseOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new ErrorHandler('Unauthorized', 401));
    const po = await PurchaseOrder.findById(req.params.id);

    if (!po) return next(new ErrorHandler('Purchase Order not found', 404));
    if (po.status === 'received') {
      return next(new ErrorHandler('Purchase Order already marked as received', 400));
    }

    po.status = 'received';
    po.receivedDate = new Date();
    await po.save();

    // Stock in products to inventory
    for (const item of po.items) {
      let inv = await Inventory.findOne({ product: item.product, branch: po.branch });
      if (!inv) {
        inv = new Inventory({
          product: item.product,
          branch: po.branch,
          quantity: 0
        });
      }
      inv.quantity += item.quantity;
      await inv.save();

      // Log movement
      await StockMovement.create({
        product: item.product,
        branch: po.branch,
        quantity: item.quantity,
        type: 'purchase',
        referenceId: po._id,
        performedBy: req.user.id,
        notes: `Purchase Order ${po._id} Received`
      });
    }

    res.status(200).json({ success: true, message: 'Purchase Order received & stock updated', data: po });
  } catch (error) {
    next(error);
  }
};
