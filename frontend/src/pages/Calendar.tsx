import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Scissors
} from 'lucide-react';

interface Appointment {
  _id: string;
  customer?: {
    name: string;
    phone: string;
  };
  customerName?: string;
  startTime: string;
  endTime: string;
  status: string;
  services: {
    service: {
      name: string;
    };
    stylist: {
      _id: string;
      name: string;
    };
  }[];
}

interface Stylist {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
}

export const Calendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const stRes = await api.get('/staff');
      const apptRes = await api.get(`/appointments?date=${selectedDate}`);

      if (stRes.data.success) setStylists(stRes.data.data);
      if (apptRes.data.success) setAppointments(apptRes.data.data);
    } catch (err) {
      console.error('Calendar load failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [selectedDate]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await api.put(`/appointments/${id}/status`, { status });
      if (res.data.success) {
        fetchCalendar();
      }
    } catch (err) {
      alert('Status change failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar header row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Appointment Schedule</h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold uppercase">Daily Salon Slots & Bookings</p>
        </div>

        {/* Date Selector controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 bg-[#16161a] border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <CalendarIcon className="w-4 h-4" />
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#16161a] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#8b5cf6] text-white transition-all"
            />
          </div>
          <button
            onClick={handleNextDay}
            className="p-2 bg-[#16161a] border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm">Aggregating appointments...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stylists column grid agenda */}
          {stylists.length > 0 ? (
            stylists.map((st) => {
              // filter appointments assigned to this stylist
              const stAppts = appointments.filter((appt) =>
                appt.services.some((s) => s.stylist?._id === st.user._id)
              );

              return (
                <div key={st._id} className="glass-panel rounded-2xl border border-white/5 p-5 flex flex-col gap-4">
                  {/* Stylist Name Header */}
                  <div className="border-b border-white/5 pb-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center font-bold text-white uppercase text-xs">
                      {st.user.name.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{st.user.name}</h4>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Stylist</span>
                    </div>
                  </div>

                  {/* Stylist Appointments slot list */}
                  <div className="space-y-3 min-h-[300px]">
                    {stAppts.length > 0 ? (
                      stAppts.map((appt) => {
                        const firstService = appt.services[0]?.service?.name || 'Salon Treatment';
                        const statusColors: any = {
                          pending: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5',
                          confirmed: 'border-blue-500/30 text-blue-400 bg-blue-500/5',
                          checked_in: 'border-purple-500/30 text-purple-400 bg-purple-500/5',
                          completed: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
                          cancelled: 'border-red-500/30 text-red-400 bg-red-500/5'
                        };

                        return (
                          <div
                            key={appt._id}
                            className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${statusColors[appt.status] || 'border-white/5 text-slate-400 bg-white/5'}`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {appt.startTime} - {appt.endTime}
                              </span>
                              <select
                                value={appt.status}
                                onChange={(e) => handleStatusChange(appt._id, e.target.value)}
                                className="bg-[#141418] border border-white/5 text-[9px] font-bold rounded px-1 py-0.5 text-slate-300 focus:outline-none"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="checked_in">Check In</option>
                                <option value="completed">Complete</option>
                                <option value="cancelled">Cancel</option>
                              </select>
                            </div>

                            <div className="text-xs">
                              <h5 className="font-bold flex items-center gap-1 text-slate-100">
                                <User className="w-3.5 h-3.5" />
                                {appt.customer ? appt.customer.name : appt.customerName || 'Walk-in'}
                              </h5>
                              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-1">
                                <Scissors className="w-3 h-3 text-[#8b5cf6]" />
                                {firstService}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl py-20 text-slate-600 text-xs">
                        No appointments booked.
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-4 text-center py-20 text-slate-600 text-sm">No stylists available. Seed the staff details first.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Calendar;
