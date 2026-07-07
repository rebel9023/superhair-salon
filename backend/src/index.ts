import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import errorMiddleware from './middlewares/error';

// Import Routes
import authRoutes from './routes/auth';
import branchRoutes from './routes/branches';
import categoryRoutes from './routes/categories';
import serviceRoutes from './routes/services';
import customerRoutes from './routes/customers';
import membershipRoutes from './routes/memberships';
import staffRoutes from './routes/staff';
import attendanceRoutes from './routes/attendance';
import productRoutes from './routes/products';
import supplierRoutes from './routes/suppliers';
import inventoryRoutes from './routes/inventory';
import couponRoutes from './routes/coupons';
import expenseRoutes from './routes/expenses';
import invoiceRoutes from './routes/invoices';
import appointmentRoutes from './routes/appointments';
import payrollRoutes from './routes/payroll';
import dashboardRoutes from './routes/dashboard';
import reportsRoutes from './routes/reports';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io initialization
export const io = new Server(server, {
  cors: {
    origin: (process.env.FRONTEND_URL || 'http://localhost:5173').split(','),
    credentials: true
  }
});

// Real-time operations listener
io.on('connection', (socket) => {
  console.log(`Socket Client Connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket Client Disconnected: ${socket.id}`);
  });
});

// DB Connection
connectDB();

// Global Middlewares
app.use(helmet());
app.use(cookieParser());
app.use(
  cors({
    origin: (process.env.FRONTEND_URL || 'http://localhost:5173').split(','),
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', apiLimiter);

// Bind API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/branches', branchRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/memberships', membershipRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportsRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Global Error Handler Middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Salon ERP Backend Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
