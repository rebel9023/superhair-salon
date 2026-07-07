import { Schema, model, Document } from 'mongoose';

export interface ICustomerMembership extends Document {
  customer: Schema.Types.ObjectId; // References Customer
  membership: Schema.Types.ObjectId; // References Membership
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const customerMembershipSchema = new Schema<ICustomerMembership>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    membership: { type: Schema.Types.ObjectId, ref: 'Membership', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' }
  },
  { timestamps: true }
);

// Compound index to search active memberships fast
customerMembershipSchema.index({ customer: 1, status: 1 });

export const CustomerMembership = model<ICustomerMembership>('CustomerMembership', customerMembershipSchema);
export default CustomerMembership;
