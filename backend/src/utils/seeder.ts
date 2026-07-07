import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Branch from '../models/Branch';
import Role from '../models/Role';
import User from '../models/User';
import Staff from '../models/Staff';
import Category from '../models/Category';
import Service from '../models/Service';
import Product from '../models/Product';
import Inventory from '../models/Inventory';
import Coupon from '../models/Coupon';
import Customer from '../models/Customer';
import Membership from '../models/Membership';
import Invoice from '../models/Invoice';
import Appointment from '../models/Appointment';
import Expense from '../models/Expense';
import LoyaltyTransaction from '../models/LoyaltyTransaction';
import StockMovement from '../models/StockMovement';
import Payroll from '../models/Payroll';
import Attendance from '../models/Attendance';

dotenv.config();

const seedDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salon_erp';
    await mongoose.connect(connUri);
    console.log('MongoDB Connected for seeding...');

    // 1. Clear existing collections
    await Branch.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});
    await Staff.deleteMany({});
    await Category.deleteMany({});
    await Service.deleteMany({});
    await Product.deleteMany({});
    await Inventory.deleteMany({});
    await Coupon.deleteMany({});
    await Customer.deleteMany({});
    await Membership.deleteMany({});
    await Invoice.deleteMany({});
    await Appointment.deleteMany({});
    await Expense.deleteMany({});
    await LoyaltyTransaction.deleteMany({});
    await StockMovement.deleteMany({});
    await Payroll.deleteMany({});
    await Attendance.deleteMany({});
    console.log('Cleared existing collections.');

    // 2. Seed Branches
    const branches = await Branch.create([
      {
        name: 'Primary Art Salon - Bandra',
        code: 'BR001',
        address: {
          street: '45 Hill Road, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          zip: '400050',
          country: 'India'
        },
        contact: '+912211223344',
        email: 'bandra@superartsalon.com',
        gstNumber: '27AAAAA1111A1Z1',
        invoicePrefix: 'INV-BR1-',
        status: 'active',
        settings: { currency: '₹', timezone: 'Asia/Kolkata', taxRate: 18 }
      },
      {
        name: 'Super Art Salon - Juhu',
        code: 'BR002',
        address: {
          street: '12 Juhu Tara Road, Juhu',
          city: 'Mumbai',
          state: 'Maharashtra',
          zip: '400049',
          country: 'India'
        },
        contact: '+912222334455',
        email: 'juhu@superartsalon.com',
        gstNumber: '27BBBBB2222B2Z2',
        invoicePrefix: 'INV-BR2-',
        status: 'active',
        settings: { currency: '₹', timezone: 'Asia/Kolkata', taxRate: 18 }
      }
    ]);
    const branch1 = branches[0];
    console.log('Seeded Branches.');

    // 3. Seed Roles
    const roles = await Role.create([
      {
        name: 'super_admin',
        description: 'Super administrator with access to entire system and all tenants.',
        permissions: ['*']
      },
      {
        name: 'salon_owner',
        description: 'Salon Owner who manages settings, staff, inventory and reviews reports.',
        permissions: [
          'branches:view', 'branches:edit',
          'services:view', 'services:edit',
          'customers:view', 'customers:edit', 'customers:delete',
          'staff:view', 'staff:edit', 'staff:attendance',
          'payroll:view', 'payroll:process',
          'inventory:view', 'inventory:edit', 'inventory:purchase',
          'billing:create', 'billing:view', 'billing:void',
          'reports:view', 'reports:export',
          'settings:view', 'settings:edit'
        ]
      },
      {
        name: 'manager',
        description: 'Salon Branch Manager managing operations, staff, checkouts, and calendar.',
        permissions: [
          'branches:view',
          'services:view',
          'customers:view', 'customers:edit',
          'staff:view', 'staff:attendance',
          'inventory:view', 'inventory:edit',
          'billing:create', 'billing:view',
          'reports:view'
        ]
      },
      {
        name: 'receptionist',
        description: 'Frontdesk staff scheduling appointments, searching customers, and billing.',
        permissions: [
          'services:view',
          'customers:view', 'customers:edit',
          'staff:view',
          'inventory:view',
          'billing:create', 'billing:view',
          'payroll:view', 'payroll:process'
        ]
      },
      {
        name: 'stylist',
        description: 'Stylist/Therapist providing salon services.',
        permissions: [
          'services:view',
          'customers:view',
          'staff:view'
        ]
      },
      {
        name: 'accountant',
        description: 'Finance specialist tracking opex, sales, and payroll.',
        permissions: [
          'payroll:view',
          'billing:view',
          'reports:view', 'reports:export'
        ]
      }
    ]);
    const superAdminRole = roles.find(r => r.name === 'super_admin')!;
    const ownerRole = roles.find(r => r.name === 'salon_owner')!;
    const managerRole = roles.find(r => r.name === 'manager')!;
    const receptionistRole = roles.find(r => r.name === 'receptionist')!;
    const stylistRole = roles.find(r => r.name === 'stylist')!;
    console.log('Seeded Roles.');

    // 4. Seed Users
    const userAdmin = await User.create({
      name: 'Global Administrator',
      email: 'superadmin@salonerp.com',
      password: 'admin123', // Will be hashed automatically by userSchema pre-save hook
      phone: '+919999999900',
      role: superAdminRole._id,
      status: 'active',
      isEmailVerified: true
    });

    const userOwner = await User.create({
      name: 'Rajesh Kumar',
      email: 'owner@salonerp.com',
      password: 'owner123',
      phone: '+919999999901',
      role: ownerRole._id,
      branch: branch1._id,
      status: 'active',
      isEmailVerified: true
    });

    const userManager = await User.create({
      name: 'Anita Sharma',
      email: 'manager@salonerp.com',
      password: 'manager123',
      phone: '+919999999902',
      role: managerRole._id,
      branch: branch1._id,
      status: 'active',
      isEmailVerified: true
    });

    const userReceptionist = await User.create({
      name: 'Shiraj Salmani',
      email: 'Shirajsalmani7866@gmail.com',
      password: 'receptionist123',
      phone: '9723290486',
      role: receptionistRole._id,
      branch: branch1._id,
      status: 'active',
      isEmailVerified: true
    });

    const userNafiz = await User.create({
      name: 'Nafiz',
      email: 'nafiz@salonerp.com',
      password: 'stylist123',
      phone: '+919999999904',
      role: stylistRole._id,
      branch: branch1._id,
      status: 'active',
      isEmailVerified: true
    });

    const userAasif = await User.create({
      name: 'Aasif',
      email: 'aasif@salonerp.com',
      password: 'stylist123',
      phone: '+919999999905',
      role: stylistRole._id,
      branch: branch1._id,
      status: 'active',
      isEmailVerified: true
    });

    const userSubhan = await User.create({
      name: 'Subhan',
      email: 'subhan@salonerp.com',
      password: 'stylist123',
      phone: '+919999999906',
      role: stylistRole._id,
      branch: branch1._id,
      status: 'active',
      isEmailVerified: true
    });

    const userShakir = await User.create({
      name: 'Shakir',
      email: 'shakir@salonerp.com',
      password: 'stylist123',
      phone: '+919999999907',
      role: stylistRole._id,
      branch: branch1._id,
      status: 'active',
      isEmailVerified: true
    });

    const userFarman = await User.create({
      name: 'Farman',
      email: 'farman@salonerp.com',
      password: 'stylist123',
      phone: '+919999999908',
      role: stylistRole._id,
      branch: branch1._id,
      status: 'active',
      isEmailVerified: true
    });
    console.log('Seeded Users.');

    // 5. Seed Staff sheets for Stylists
    await Staff.create([
      { user: userNafiz._id, baseSalary: 25000, commissionRate: 15.0, rating: 4.8 },
      { user: userAasif._id, baseSalary: 22000, commissionRate: 12.0, rating: 4.9 },
      { user: userSubhan._id, baseSalary: 20000, commissionRate: 15.0, rating: 4.7 },
      { user: userShakir._id, baseSalary: 24000, commissionRate: 15.0, rating: 4.8 },
      { user: userFarman._id, baseSalary: 21000, commissionRate: 12.0, rating: 4.9 }
    ]);
    console.log('Seeded Staff profiles.');

    // 6. Seed Categories
    const categories = await Category.create([
      { name: 'Hair Cut & Treatments', description: 'Hair cuts, straightening, botox, keratin, etc.' },
      { name: 'Shaving & Grooming', description: 'Beard clean shave, styling, colour, threading' },
      { name: 'Spa', description: 'Anti-dandruff and nourishing scalp spas' },
      { name: 'Hair Colour', description: 'Global colour, ammonia free, cap highlights' },
      { name: 'D-Tan', description: 'Tan removal for face, neck, hands, body scrub' },
      { name: 'Clean Up', description: 'Clean ups as per skin consultation' }
    ]);
    console.log('Seeded Categories.');

    // 7. Seed Services
    const services = await Service.create([
      // Hair Cut & Treatments
      { name: 'Hair Cut', category: categories[0]._id, duration: 30, price: 130, taxRate: 18, discount: 0 },
      { name: 'Razor Hair Cut', category: categories[0]._id, duration: 30, price: 180, taxRate: 18, discount: 0 },
      { name: 'Round Cut', category: categories[0]._id, duration: 15, price: 50, taxRate: 18, discount: 0 },
      { name: 'Hair Wash', category: categories[0]._id, duration: 15, price: 50, taxRate: 18, discount: 0 },
      { name: 'Hair Styling', category: categories[0]._id, duration: 20, price: 50, taxRate: 18, discount: 0 },
      { name: 'Head Massage', category: categories[0]._id, duration: 20, price: 50, taxRate: 18, discount: 0 },
      { name: 'Head & Back', category: categories[0]._id, duration: 30, price: 100, taxRate: 18, discount: 0 },
      { name: 'Hair Straightening', category: categories[0]._id, duration: 90, price: 1500, taxRate: 18, discount: 0 },
      { name: 'Botox Treatment', category: categories[0]._id, duration: 90, price: 2000, taxRate: 18, discount: 0 },
      { name: 'Hair Perming', category: categories[0]._id, duration: 90, price: 2000, taxRate: 18, discount: 0 },
      { name: 'Kera Smooth', category: categories[0]._id, duration: 120, price: 2500, taxRate: 18, discount: 0 },
      { name: 'Keratin Treatment', category: categories[0]._id, duration: 120, price: 2000, taxRate: 18, discount: 0 },

      // Shaving & Grooming
      { name: 'Clean Shave', category: categories[1]._id, duration: 15, price: 50, taxRate: 18, discount: 0 },
      { name: 'Beard Styling', category: categories[1]._id, duration: 20, price: 70, taxRate: 18, discount: 0 },
      { name: 'Beard Colour', category: categories[1]._id, duration: 25, price: 150, taxRate: 18, discount: 0 },
      { name: 'Threading', category: categories[1]._id, duration: 15, price: 50, taxRate: 18, discount: 0 },

      // Spa
      { name: 'Dandruff Treatment', category: categories[2]._id, duration: 40, price: 500, taxRate: 18, discount: 0 },
      { name: 'Scalp Advance Hair Spa', category: categories[2]._id, duration: 60, price: 650, taxRate: 18, discount: 0 },
      { name: 'Hair Spa', category: categories[2]._id, duration: 45, price: 600, taxRate: 18, discount: 0 },

      // Hair Colour
      { name: 'Hair Colour with Wash', category: categories[3]._id, duration: 45, price: 350, taxRate: 18, discount: 0 },
      { name: 'Ammonia Free Hair Colour', category: categories[3]._id, duration: 45, price: 450, taxRate: 18, discount: 0 },
      { name: 'Highlight as per Strip', category: categories[3]._id, duration: 20, price: 150, taxRate: 18, discount: 0 },
      { name: 'Highlight With Cap (Basic)', category: categories[3]._id, duration: 60, price: 800, taxRate: 18, discount: 0 },
      { name: 'Highlight With Cap (Medium)', category: categories[3]._id, duration: 75, price: 1000, taxRate: 18, discount: 0 },
      { name: 'Highlight With Cap (Premium)', category: categories[3]._id, duration: 90, price: 1200, taxRate: 18, discount: 0 },

      // D-Tan
      { name: 'D-Tan Face', category: categories[4]._id, duration: 20, price: 350, taxRate: 18, discount: 0 },
      { name: 'D-Tan Neck', category: categories[4]._id, duration: 15, price: 200, taxRate: 18, discount: 0 },
      { name: 'D-Tan Half Hand', category: categories[4]._id, duration: 25, price: 300, taxRate: 18, discount: 0 },
      { name: 'D-Tan Full Hand', category: categories[4]._id, duration: 40, price: 500, taxRate: 18, discount: 0 },
      { name: 'D-Tan Scrub (Basic)', category: categories[4]._id, duration: 15, price: 150, taxRate: 18, discount: 0 },
      { name: 'D-Tan Scrub (Premium)', category: categories[4]._id, duration: 20, price: 200, taxRate: 18, discount: 0 },

      // Clean Up
      { name: 'Clean Up (Skin Consultation)', category: categories[5]._id, duration: 30, price: 750, taxRate: 18, discount: 0 },
      { name: 'Clean Up (Standard)', category: categories[5]._id, duration: 45, price: 1200, taxRate: 18, discount: 0 },
      { name: 'Clean Up (Premium)', category: categories[5]._id, duration: 60, price: 1500, taxRate: 18, discount: 0 },
      { name: 'Clean Up (Luxury)', category: categories[5]._id, duration: 75, price: 2000, taxRate: 18, discount: 0 }
    ]);
    console.log('Seeded Services.');

    // 8. Seed Products
    const products = await Product.create([
      {
        name: 'Matte Clay Hair Wax',
        sku: 'WAX001',
        barcode: '8901234567890',
        category: 'Hair Styling',
        price: 500,
        costPrice: 220,
        minStockAlert: 5
      },
      {
        name: 'Argan Oil Nourishing Shampoo',
        sku: 'SHM001',
        barcode: '8901234567891',
        category: 'Hair Care',
        price: 850,
        costPrice: 400,
        minStockAlert: 5
      },
      {
        name: 'Hydrating Face Serum',
        sku: 'SRM001',
        barcode: '8901234567892',
        category: 'Skincare',
        price: 1200,
        costPrice: 650,
        minStockAlert: 3
      }
    ]);
    console.log('Seeded Products.');

    // 9. Seed Inventory stock levels for Bandra Branch
    await Inventory.create([
      { product: products[0]._id, branch: branch1._id, quantity: 20 },
      { product: products[1]._id, branch: branch1._id, quantity: 15 },
      { product: products[2]._id, branch: branch1._id, quantity: 8 }
    ]);
    console.log('Seeded Inventory.');

    // 10. Seed Coupons
    await Coupon.create([
      {
        code: 'WELCOME100',
        discountType: 'flat',
        discountValue: 100,
        minBillAmount: 500,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-12-31'),
        usageLimit: 1000,
        status: 'active'
      },
      {
        code: 'FESTIVAL20',
        discountType: 'percentage',
        discountValue: 20, // 20%
        minBillAmount: 1000,
        maxDiscount: 400, // cap discount at 400
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-12-31'),
        usageLimit: 500,
        status: 'active'
      }
    ]);
    console.log('Seeded Coupons.');

    // 11. Seed Customers
    await Customer.create([
      {
        name: 'John Doe',
        email: 'john.doe@gmail.com',
        phone: '9876543210',
        birthday: new Date('1990-05-15'),
        notes: 'Regular men haircut customer, prefers Rohan.',
        loyaltyPoints: 120,
        branch: branch1._id
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@gmail.com',
        phone: '9876543211',
        birthday: new Date('1993-11-20'),
        anniversary: new Date('2018-02-14'),
        notes: 'Enjoys luxury services. Prefers Deepa.',
        loyaltyPoints: 340,
        branch: branch1._id
      }
    ]);
    console.log('Seeded Customers.');

    // 12. Seed Memberships
    await Membership.create([
      {
        name: 'Salon Gold Club',
        price: 2999,
        durationMonths: 12,
        benefits: {
          discountPercentageOnServices: 15.0, // 15% discount
          discountPercentageOnProducts: 10.0 // 10% discount
        },
        status: 'active'
      },
      {
        name: 'Royal VIP Premium',
        price: 5999,
        durationMonths: 12,
        benefits: {
          discountPercentageOnServices: 25.0, // 25% discount
          discountPercentageOnProducts: 15.0 // 15% discount
        },
        status: 'active'
      }
    ]);
    console.log('Seeded Memberships.');

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
