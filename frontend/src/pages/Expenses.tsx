import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  DollarSign,
  Plus,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';

interface Expense {
  _id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  recordedBy: {
    name: string;
  };
}

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // New Expense form
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState('electricity');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses');
      if (res.data.success) {
        setExpenses(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/expenses', {
        category,
        amount: Number(amount),
        description,
        date: new Date(date)
      });
      if (res.data.success) {
        setShowAddForm(false);
        setAmount('');
        setDescription('');
        fetchExpenses();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Record failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">OPEX Expense Ledger</h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold uppercase">Operational Cost Tracking & Auditing</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#8b5cf6]/20"
        >
          <Plus className="w-4 h-4" />
          Record Expense
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm">Querying expense ledger...</div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-[#0f0f12]/30">
                  <th className="p-4">Opex Category</th>
                  <th className="p-4">Amount Spent</th>
                  <th className="p-4">Record Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {expenses.length > 0 ? (
                  expenses.map((e) => (
                    <tr key={e._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-semibold text-white capitalize flex items-center gap-2">
                        <Layers className="w-4 h-4 text-slate-500" />
                        {e.category}
                      </td>
                      <td className="p-4 text-[#eab308] font-bold">₹{e.amount}</td>
                      <td className="p-4 text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        {new Date(e.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-slate-400 text-xs truncate max-w-xs">{e.description || '-'}</td>
                      <td className="p-4 text-xs font-bold text-slate-500">{e.recordedBy?.name || 'System'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">No expenses recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#101014] border border-white/5 p-6 rounded-2xl shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">Record Salon Expense</h3>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Expense Classification</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#16161a] border border-white/5 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="electricity">Electricity</option>
                  <option value="rent">Rent</option>
                  <option value="salary">Salary</option>
                  <option value="marketing">Marketing</option>
                  <option value="internet">Internet</option>
                  <option value="water">Water</option>
                  <option value="misc">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Amount Spent (₹)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Record Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Transaction Details</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Monthly high-speed wifi fee"
                  className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-[#8b5cf6]/10"
                >
                  Record Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 border border-white/5 hover:bg-white/5 text-slate-400 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
