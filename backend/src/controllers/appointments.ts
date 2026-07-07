import { Request, Response, NextFunction } from 'express';
import Appointment from '../models/Appointment';
import Staff from '../models/Staff';
import Customer from '../models/Customer';
import ErrorHandler from '../utils/ErrorHandler';
import { AuthRequest } from '../middlewares/auth';

// Helper to convert HH:MM string to minutes from midnight
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper to check stylist availability
const isStylistAvailable = async (
  stylistId: string,
  date: Date,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
): Promise<boolean> => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // 1. Check stylist working schedule for that day of week
  const staff = await Staff.findOne({ user: stylistId }).populate('user');
  if (!staff) return false;

  const dayOfWeek = targetDate.getDay();
  const scheduleDay = staff.schedule.find(s => s.dayOfWeek === dayOfWeek);

  if (!scheduleDay || !scheduleDay.isWorking) {
    return false; // Not working this day
  }

  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const workStartMin = timeToMinutes(scheduleDay.startTime);
  const workEndMin = timeToMinutes(scheduleDay.endTime);

  if (startMin < workStartMin || endMin > workEndMin) {
    return false; // Out of working hours
  }

  // 2. Check for overlapping appointments
  const query: any = {
    date: targetDate,
    status: { $in: ['pending', 'confirmed', 'checked_in'] },
    'services.stylist': stylistId
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const appointments = await Appointment.find(query);

  for (const appt of appointments) {
    const apptStartMin = timeToMinutes(appt.startTime);
    const apptEndMin = timeToMinutes(appt.endTime);

    // Overlap math: (start1 < end2) && (end1 > start2)
    if (startMin < apptEndMin && endMin > apptStartMin) {
      return false; // Overlap detected
    }
  }

  return true;
};

export const createAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { customerId, date, startTime, services, notes, bookingChannel } = req.body;
    if (!req.user) return next(new ErrorHandler('Unauthorized', 401));
    const branchId = req.user.branch || req.body.branch; // default

    if (!branchId) {
      return next(new ErrorHandler('Branch must be defined for appointments', 400));
    }

    const apptDate = new Date(date);
    apptDate.setHours(0, 0, 0, 0);

    // Calculate total duration and end time
    let totalDuration = 0;
    const items: any[] = [];

    for (const s of services) {
      totalDuration += s.duration;
      items.push({
        service: s.serviceId,
        stylist: s.stylistId,
        price: s.price,
        duration: s.duration
      });

      // Verify stylist availability
      const startMin = timeToMinutes(startTime);
      const endMin = startMin + s.duration;
      const hours = Math.floor(endMin / 60);
      const minutes = endMin % 60;
      const serviceEndTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

      const available = await isStylistAvailable(s.stylistId, apptDate, startTime, serviceEndTime);
      if (!available) {
        return next(new ErrorHandler(`Stylist is busy or unavailable during this slot.`, 400));
      }
    }

    const startMin = timeToMinutes(startTime);
    const endMin = startMin + totalDuration;
    const endHours = Math.floor(endMin / 60);
    const endMinutes = endMin % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

    const appointment = await Appointment.create({
      customer: customerId || undefined,
      branch: branchId,
      date: apptDate,
      startTime,
      endTime,
      services: items,
      notes,
      bookingChannel: bookingChannel || 'walk-in',
      status: 'pending'
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

export const getAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branch, date } = req.query;
    const filter: any = {};

    if (branch) filter.branch = branch;
    if (date) {
      const targetDate = new Date(date as string);
      targetDate.setHours(0, 0, 0, 0);
      filter.date = targetDate;
    }

    const appointments = await Appointment.find(filter)
      .populate('customer')
      .populate('branch')
      .populate('services.service')
      .populate('services.stylist', 'name')
      .sort({ startTime: 1 });

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!appointment) return next(new ErrorHandler('Appointment not found', 404));
    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

export const rescheduleAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, startTime } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) return next(new ErrorHandler('Appointment not found', 404));

    const apptDate = new Date(date);
    apptDate.setHours(0, 0, 0, 0);

    // Recheck availability for all items
    let totalDuration = 0;
    for (const s of appointment.services) {
      totalDuration += s.duration;
      const startMin = timeToMinutes(startTime);
      const endMin = startMin + s.duration;
      const hours = Math.floor(endMin / 60);
      const minutes = endMin % 60;
      const serviceEndTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

      const available = await isStylistAvailable(
        s.stylist.toString(),
        apptDate,
        startTime,
        serviceEndTime,
        appointment._id.toString()
      );
      if (!available) {
        return next(new ErrorHandler(`Stylist is busy or unavailable during rescheduled slot`, 400));
      }
    }

    const startMin = timeToMinutes(startTime);
    const endMin = startMin + totalDuration;
    const endHours = Math.floor(endMin / 60);
    const endMinutes = endMin % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

    appointment.date = apptDate;
    appointment.startTime = startTime;
    appointment.endTime = endTime;
    await appointment.save();

    res.status(200).json({ success: true, message: 'Appointment rescheduled', data: appointment });
  } catch (error) {
    next(error);
  }
};
