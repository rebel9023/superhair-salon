import { Schema, model, Document } from 'mongoose';

interface IScheduleDay {
  dayOfWeek: number; // 0 for Sunday, 1 for Monday, etc.
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "18:00"
  isWorking: boolean;
}

export interface IStaff extends Document {
  user: Schema.Types.ObjectId; // References User
  specialties: Schema.Types.ObjectId[]; // References Services
  baseSalary: number;
  commissionRate: number; // percentage, e.g. 10.0 for 10%
  joiningDate: Date;
  terminationDate?: Date;
  schedule: IScheduleDay[];
  documents: { name: string; url: string }[];
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const scheduleDaySchema = new Schema<IScheduleDay>({
  dayOfWeek: { type: Number, required: true },
  startTime: { type: String, default: '09:00' },
  endTime: { type: String, default: '19:00' },
  isWorking: { type: Boolean, default: true }
});

const staffSchema = new Schema<IStaff>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialties: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    baseSalary: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0 }, // 0% by default
    joiningDate: { type: Date, default: Date.now },
    terminationDate: { type: Date },
    schedule: {
      type: [scheduleDaySchema],
      default: () => {
        // default 6-day week, Sundays off (0)
        return Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i,
          startTime: '09:00',
          endTime: '19:00',
          isWorking: i !== 0 // Sunday off
        }));
      }
    },
    documents: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true }
      }
    ],
    rating: { type: Number, default: 5.0 }
  },
  { timestamps: true }
);

export const Staff = model<IStaff>('Staff', staffSchema);
export default Staff;
