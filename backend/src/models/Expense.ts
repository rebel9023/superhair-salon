import { Schema, model, Document } from 'mongoose';

export interface IExpense extends Document {
  branch: Schema.Types.ObjectId; // References Branch
  category: 'electricity' | 'rent' | 'salary' | 'marketing' | 'internet' | 'water' | 'misc';
  amount: number;
  date: Date;
  description: string;
  receiptUrl?: string; // Cloudinary URL
  recordedBy: Schema.Types.ObjectId; // References User
  createdAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    category: {
      type: String,
      enum: ['electricity', 'rent', 'salary', 'marketing', 'internet', 'water', 'misc'],
      required: true
    },
    amount: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, default: '' },
    receiptUrl: { type: String, default: '' },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

expenseSchema.index({ branch: 1, date: 1 });

export const Expense = model<IExpense>('Expense', expenseSchema);
export default Expense;
