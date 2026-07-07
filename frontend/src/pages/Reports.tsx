import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Calendar as CalendarIcon,
  CreditCard,
  Users,
  Scissors,
  Award,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface SummaryData {
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  totalBillsToday: number;
  cashCollectionToday: number;
  onlineCollectionToday: number;
  totalCustomersToday: number;
  totalServicesToday: number;
  hairCutsToday: number;
  beardStylingToday: number;
  hairSpaToday: number;
  hairColourToday: number;
  facialToday: number;
}

interface ServicePerformance {
  name: string;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

export const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [services, setServices] = useState<ServicePerformance[]>([]);

  const loadReports = async () => {
    try {
      const res = await api.get('/reports');
      if (res.data.success) {
        setSummary(res.data.data.summary);
        setServices(res.data.data.servicePerformance);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-[#3f51b5]" />
        <span className="text-xs font-bold uppercase tracking-wider">Loading Analytics...</span>
      </div>
    );
  }

  const s = summary || {
    todaySales: 0,
    weeklySales: 0,
    monthlySales: 0,
    totalBillsToday: 0,
    cashCollectionToday: 0,
    onlineCollectionToday: 0,
    totalCustomersToday: 0,
    totalServicesToday: 0,
    hairCutsToday: 0,
    beardStylingToday: 0,
    hairSpaToday: 0,
    hairColourToday: 0,
    facialToday: 0
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header title */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Business Analytics Dashboard</h2>
        <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Realtime dynamic performance indicators</p>
      </div>

      {/* Summary KPI Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {/* Today's Sales */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Sales</span>
          <h4 className="text-lg font-black text-slate-800 mt-1">₹{s.todaySales}</h4>
        </motion.div>

        {/* Weekly Sales */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Sales</span>
          <h4 className="text-lg font-black text-slate-800 mt-1">₹{s.weeklySales}</h4>
        </motion.div>

        {/* Monthly Sales */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Sales</span>
          <h4 className="text-lg font-black text-slate-800 mt-1">₹{s.monthlySales}</h4>
        </motion.div>

        {/* Total Bills Today */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Bills Today</span>
          <h4 className="text-lg font-black text-slate-800 mt-1">{s.totalBillsToday}</h4>
        </motion.div>

        {/* Cash Collection Today */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash Collection Today</span>
          <h4 className="text-lg font-black text-emerald-600 mt-1">₹{s.cashCollectionToday}</h4>
        </motion.div>

        {/* Online Collection Today */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Online Collection Today</span>
          <h4 className="text-lg font-black text-indigo-600 mt-1">₹{s.onlineCollectionToday}</h4>
        </motion.div>

        {/* Total Customers Today */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Customers Today</span>
          <h4 className="text-lg font-black text-slate-800 mt-1">{s.totalCustomersToday}</h4>
        </motion.div>

        {/* Total Services Done Today */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Services Done</span>
          <h4 className="text-lg font-black text-slate-800 mt-1">{s.totalServicesToday}</h4>
        </motion.div>

        {/* Specific categories count */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between border-l-4 border-l-purple-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hair Cuts Today</span>
          <h4 className="text-base font-black text-slate-800 mt-1">{s.hairCutsToday}</h4>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Beard Styling Today</span>
          <h4 className="text-base font-black text-slate-800 mt-1">{s.beardStylingToday}</h4>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hair Spa Today</span>
          <h4 className="text-base font-black text-slate-800 mt-1">{s.hairSpaToday}</h4>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between border-l-4 border-l-rose-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hair Colour Today</span>
          <h4 className="text-base font-black text-slate-800 mt-1">{s.hairColourToday}</h4>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between border-l-4 border-l-blue-500 md:col-span-1 col-span-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facial Today</span>
          <h4 className="text-base font-black text-slate-800 mt-1">{s.facialToday}</h4>
        </motion.div>
      </motion.div>

      {/* SERVICE PERFORMANCE REPORT TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Service Performance Report</h3>
        </div>

        <div className="overflow-x-auto">
          {services.length > 0 ? (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-500 uppercase font-black text-[9px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Service Name</th>
                  <th className="px-5 py-3 text-center">Today Count</th>
                  <th className="px-5 py-3 text-center">Weekly Count</th>
                  <th className="px-5 py-3 text-center">Monthly Count</th>
                  <th className="px-5 py-3 text-right">Today Revenue</th>
                  <th className="px-5 py-3 text-right">Weekly Revenue</th>
                  <th className="px-5 py-3 text-right">Monthly Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {services.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-800">{item.name}</td>
                    <td className="px-5 py-3 text-center font-mono">{item.todayCount}</td>
                    <td className="px-5 py-3 text-center font-mono">{item.weekCount}</td>
                    <td className="px-5 py-3 text-center font-mono">{item.monthCount}</td>
                    <td className="px-5 py-3 text-right font-mono text-emerald-600">₹{item.todayRevenue}</td>
                    <td className="px-5 py-3 text-right font-mono text-emerald-600">₹{item.weekRevenue}</td>
                    <td className="px-5 py-3 text-right font-mono text-emerald-600">₹{item.monthRevenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-wider">
              No service transactions registered in database
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
