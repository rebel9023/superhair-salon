import { Schema, model, Document } from 'mongoose';

interface IAppointmentService {
  service: Schema.Types.ObjectId; // References Service
  stylist: Schema.Types.ObjectId; // References User
  price: number;
  duration: number; // in minutes
}

export interface IAppointment extends Document {
  customer?: Schema.Types.ObjectId; // References Customer (can be null for anonymous walk-ins)
  branch: Schema.Types.ObjectId; // References Branch
  date: Date; // e.g. YYYY-MM-DD
  startTime: string; // e.g., "10:30"
  endTime: string; // e.g., "11:00"
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
  services: IAppointmentService[];
  notes?: string;
  bookingChannel: 'online' | 'walk-in' | 'call';
  createdAt: Date;
  updatedAt: Date;
}

const appointmentServiceSchema = new Schema<IAppointmentService>({
  service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  stylist: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true }
});

const appointmentSchema = new Schema<IAppointment>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'],
      default: 'pending'
    },
    services: [appointmentServiceSchema],
    notes: { type: String, default: '' },
    bookingChannel: { type: String, enum: ['online', 'walk-in', 'call'], default: 'walk-in' }
  },
  { timestamps: true }
);

// Indexes to speed calendar searches
appointmentSchema.index({ branch: 1, date: 1, startTime: 1 });
appointmentSchema.index({ customer: 1 });

export const Appointment = model<IAppointment>('Appointment', appointmentSchema);
export default Appointment;
