import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  DollarSign,
  TrendingUp,
  Printer,
  Plus,
  RefreshCw
} from 'lucide-react';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount: number;
  status: string;
  payments: {
    method: 'cash' | 'card' | 'upi' | 'wallet' | 'gift_card';
    amount: number;
  }[];
  createdAt: string;
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

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/invoices');
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  // Calculations for Today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = invoices.filter(inv => {
    return inv.createdAt.split('T')[0] === todayStr;
  });

  const todaySales = todayInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const todayMoneyIn = todayInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="space-y-5 pb-24">
      {/* Top Action Row */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm"
      >
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Overview Dashboard</h3>
          <span className="text-[10px] text-slate-400 font-semibold font-mono">
            Last Updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3f51b5]/10 text-[#3f51b5] border border-[#3f51b5]/20 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </motion.div>

      {/* Giant touch New Bill banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1, transition: { type: 'spring', delay: 0.1 } }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => navigate('/pos')}
        className="bg-[#3f51b5] text-white p-6 rounded-2xl shadow-lg shadow-[#3f51b5]/15 cursor-pointer flex flex-col items-center justify-center gap-2 border border-[#3f51b5] text-center"
      >
        <span className="text-4xl filter drop-shadow">➕</span>
        <h2 className="text-lg font-black uppercase tracking-wider">New Bill</h2>
        <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold font-mono">
          Tap to start customer checkout immediately
        </p>
      </motion.div>

      {/* KPI Cards Row (Animated staggered) */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        {/* Reports Card */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/customers')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-[#3f51b5]/30 transition-all flex justify-between items-center"
        >
          <div>
            <span className="text-xs text-slate-500 font-bold">Reports</span>
            <h4 className="text-sm font-bold text-slate-800 mt-0.5">Check Reports</h4>
          </div>
          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
            <FileText className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Sale (TDY) Card */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center"
        >
          <div>
            <span className="text-xs text-slate-500 font-bold">Sale (TDY)</span>
            <h4 className="text-base font-black text-slate-800 mt-0.5">₹ {todaySales}</h4>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
        </motion.div>

        {/* MoneyIn (TDY) Card */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center"
        >
          <div>
            <span className="text-xs text-slate-500 font-bold">MoneyIn (TDY)</span>
            <h4 className="text-base font-black text-slate-800 mt-0.5">₹ {todayMoneyIn}</h4>
          </div>
          <div className="p-2 bg-[#3f51b5]/10 text-[#3f51b5] rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
        </motion.div>
      </motion.div>

      {/* RECENT SALE TRANSACTIONS */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Recent Sale Transactions
        </h4>

        {loading ? (
          <div className="text-center py-10 text-slate-400 text-xs">Loading sales...</div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            <AnimatePresence>
              {invoices.length > 0 ? (
                invoices.map((inv) => {
                  const isPaid = inv.status === 'paid';
                  const formattedDate = new Date(inv.createdAt).toLocaleDateString('en-GB');

                  // Dominant payment type
                  const payMethod = inv.payments[0]?.method || 'cash';
                  const isUpi = payMethod === 'upi';
                  const isCash = payMethod === 'cash';
                  const isCard = payMethod === 'card' || payMethod === 'wallet' || payMethod === 'gift_card';

                  return (
                    <motion.div
                      key={inv._id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.01 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 transition-colors hover:border-[#3f51b5]/20"
                    >
                      <div className="flex justify-between items-start text-xs border-b border-slate-100 pb-2">
                        <div>
                          <h5 className="font-bold text-slate-800">{inv.customerName || 'Cash Sale'}</h5>
                          <span className="text-[10px] text-slate-500">Sale: ₹{inv.totalAmount}</span>
                        </div>
                        <div className="text-right text-[10px] font-mono text-slate-400">
                          <p className="font-semibold text-slate-600">{inv.invoiceNumber}</p>
                          <p>{formattedDate}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-slate-500">MoneyIn: </span>
                          <span className="font-bold text-emerald-600">₹{isPaid ? inv.totalAmount : 0}</span>
                        </div>

                        {/* Payment indicators */}
                        <div className="flex gap-2">
                          <span
                            className={`px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                              isUpi
                                ? 'bg-[#3f51b5] text-white border-[#3f51b5]'
                                : 'bg-white text-slate-500 border-slate-200'
                            }`}
                          >
                            UPI/BANK
                          </span>
                          <span
                            className={`px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                              isCash
                                ? 'bg-[#3f51b5] text-white border-[#3f51b5]'
                                : 'bg-white text-slate-500 border-slate-200'
                            }`}
                          >
                            CASH
                          </span>
                          <span
                            className={`px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                              isCard
                                ? 'bg-[#3f51b5] text-white border-[#3f51b5]'
                                : 'bg-white text-slate-500 border-slate-200'
                            }`}
                          >
                            CARD
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  variants={itemVariants}
                  className="text-center py-10 bg-white border border-slate-200 rounded-xl text-slate-400 text-xs"
                >
                  No recent transactions found. Create a sale invoice to begin.
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Floating Bottom connect bar & Action button (Slide up transition) */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0, transition: { type: 'spring', damping: 15, delay: 0.3 } }}
        className="fixed bottom-16 md:bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-sm px-4 flex flex-col items-center gap-1.5"
      >
        {/* Printer connectivity bar */}
        <div className="bg-[#101014] text-white text-[9px] py-1 px-4 rounded-full flex items-center gap-1.5 border border-white/10 shadow-md">
          <Printer className="w-3 h-3 text-[#eab308] animate-bounce" />
          <span>CONNECT PRINTER: PERMISSION | BLUETOOTH | LOCATION</span>
        </div>

        {/* Big Create Invoice button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/pos')}
          className="w-full bg-[#3f51b5] hover:bg-[#303f9f] text-white font-bold rounded-full py-3.5 shadow-xl shadow-[#3f51b5]/30 flex items-center justify-center gap-2 border-2 border-white text-xs uppercase tracking-wider transition-shadow hover:shadow-2xl"
        >
          <Plus className="w-4 h-4" />
          Sale Invoice
          <Plus className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Dashboard;
