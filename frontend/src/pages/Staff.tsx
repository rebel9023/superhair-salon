import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import {
  User,
  Star,
  DollarSign,
  Percent,
  CheckCircle,
  FileText,
  Loader2
} from 'lucide-react';

interface StaffMember {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: {
      name: string;
    };
  };
  baseSalary: number;
  commissionRate: number;
  rating: number;
  specialties: { _id: string; name: string }[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

export const Staff: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Payroll Calculator Form state
  const [selectedStaffUserId, setSelectedStaffUserId] = useState('');
  const [payMonth, setPayMonth] = useState('7'); // July default
  const [payYear, setPayYear] = useState('2026');
  const [payrollData, setPayrollData] = useState<any | null>(null);
  const [payrollLoading, setPayrollLoading] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff');
      if (res.data.success) {
        setStaffList(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedStaffUserId(res.data.data[0].user._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffUserId) return;
    setPayrollLoading(true);
    setPayrollData(null);

    try {
      const res = await api.post('/payroll', {
        userId: selectedStaffUserId,
        month: Number(payMonth),
        year: Number(payYear)
      });
      if (res.data.success) {
        setPayrollData(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate payroll sheet');
    } finally {
      setPayrollLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">Stylist Directory & Payroll</h2>
        <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase">Performance, Specialties & Commission Ledger</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Directories List - Takes 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Stylist Roster</h3>
          {loading ? (
            <div className="h-[40vh] flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#3f51b5]" />
              <span className="text-[10px] font-bold uppercase">Querying stylist roster...</span>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {staffList.map((member) => (
                <motion.div
                  key={member._id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:border-[#3f51b5]/30 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#3f51b5]/10 flex items-center justify-center font-bold text-[#3f51b5] uppercase text-sm">
                        {member.user.name.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{member.user.name}</h4>
                        <span className="text-[9px] text-[#3f51b5] font-bold uppercase tracking-wider">
                          {member.user.role?.name.replace('_', ' ') || 'Stylist'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[#eab308] bg-[#eab308]/10 px-2 py-0.5 rounded text-xs font-bold border border-[#eab308]/15">
                      <Star className="w-3.5 h-3.5 fill-[#eab308]" />
                      {member.rating}
                    </div>
                  </div>

                  {/* Specialties List */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase">Specialties</span>
                    <div className="flex flex-wrap gap-1.5">
                      {member.specialties && member.specialties.length > 0 ? (
                        member.specialties.map(spec => (
                          <span key={spec._id} className="text-[9px] font-bold px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-600">
                            {spec.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500">General Treatment Stylist</span>
                      )}
                    </div>
                  </div>


                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Interactive Payroll Slip Generator - Takes 1 col */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#3f51b5]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Slip Calculator
            </h3>
          </div>

          <form onSubmit={handleGeneratePayroll} className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Select Stylist</label>
              <select
                value={selectedStaffUserId}
                onChange={(e) => setSelectedStaffUserId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 text-slate-700 font-bold focus:outline-none focus:border-[#3f51b5] transition-all"
              >
                {staffList.map(member => (
                  <option key={member._id} value={member.user._id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Month</label>
                <select
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 text-slate-700 font-bold focus:outline-none focus:border-[#3f51b5] transition-all"
                >
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Year</label>
                <select
                  value={payYear}
                  onChange={(e) => setPayYear(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 text-slate-700 font-bold focus:outline-none focus:border-[#3f51b5] transition-all"
                >
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={payrollLoading}
              className="w-full bg-[#3f51b5] hover:bg-[#303f9f] text-white font-bold rounded-xl py-3 text-xs tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#3f51b5]/15 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {payrollLoading ? 'Processing...' : 'Generate Payslip Ledger'}
            </motion.button>
          </form>

          {/* Generated payslip display card */}
          {payrollData && (
            <div className="bg-slate-50 p-4 rounded-xl border border-[#eab308]/20 text-xs space-y-4 shadow-inner">
              <div className="flex items-center gap-1.5 text-[#eab308]">
                <CheckCircle className="w-4 h-4" />
                <span className="font-bold uppercase tracking-wider text-[9px]">Payslip generated</span>
              </div>

              <div className="space-y-1.5 border-b border-slate-200 pb-3">
                <div className="flex justify-between text-slate-500">
                  <span>Commissionable Sales:</span>
                  <span className="font-bold text-slate-800 font-mono">₹{payrollData.commissionableSales}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Days Logged:</span>
                  <span className="font-bold text-slate-800 font-mono">{payrollData.workingDays} days</span>
                </div>
              </div>

              <div className="space-y-2 text-slate-500">
                <div className="flex justify-between">
                  <span>Base Salary:</span>
                  <span className="font-bold text-slate-800 font-mono">₹{payrollData.payroll.baseSalary}</span>
                </div>
                <div className="flex justify-between text-[#eab308]">
                  <span>Earned Commission:</span>
                  <span className="font-bold font-mono">+₹{payrollData.payroll.commission}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Tax Deductions (TDS):</span>
                  <span className="font-bold font-mono">-₹{payrollData.payroll.tax}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-xs font-black text-slate-800">
                  <span>Net Payout:</span>
                  <span className="text-[#3f51b5] font-black font-mono">₹{payrollData.payroll.netSalary}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Staff;
