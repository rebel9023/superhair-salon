import { Schema, model, Document } from 'mongoose';

export interface IPayroll extends Document {
  user: Schema.Types.ObjectId; // References User
  month: number; // 1-12
  year: number;
  baseSalary: number;
  commission: number;
  bonus: number;
  deductions: number;
  tax: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
  paymentDate?: Date;
  payslipUrl?: string;
  createdAt: Date;
}

const payrollSchema = new Schema<IPayroll>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    baseSalary: { type: Number, required: true, default: 0 },
    commission: { type: Number, required: true, default: 0 },
    bonus: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'processed', 'paid'], default: 'pending' },
    paymentDate: { type: Date },
    payslipUrl: { type: String, default: '' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Index to prevent double payroll processing for same month/year
payrollSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

export const Payroll = model<IPayroll>('Payroll', payrollSchema);
export default Payroll;
