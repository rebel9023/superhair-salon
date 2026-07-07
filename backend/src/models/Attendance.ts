import { Schema, model, Document } from 'mongoose';

export interface IAttendance extends Document {
  user: Schema.Types.ObjectId; // References User
  branch: Schema.Types.ObjectId; // References Branch
  date: Date;
  clockIn?: Date;
  clockOut?: Date;
  status: 'present' | 'absent' | 'leave' | 'half_day';
  leaveType?: 'sick' | 'casual' | 'unpaid' | 'other';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    date: { type: Date, required: true },
    clockIn: { type: Date },
    clockOut: { type: Date },
    status: { type: String, enum: ['present', 'absent', 'leave', 'half_day'], default: 'present' },
    leaveType: { type: String, enum: ['sick', 'casual', 'unpaid', 'other'] },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

// Index to quickly search user attendance logs for a month
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export const Attendance = model<IAttendance>('Attendance', attendanceSchema);
export default Attendance;
