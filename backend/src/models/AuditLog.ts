import { Schema, model, Document } from 'mongoose';

export interface IAuditLog extends Document {
  user?: Schema.Types.ObjectId; // References User
  action: string; // e.g. delete:invoice, update:salary
  ipAddress?: string;
  userAgent?: string;
  details?: Schema.Types.Map; // extra raw JSON details
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    details: { type: Map, of: Schema.Types.Mixed }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;
