import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Search,
  Plus,
  User,
  Award
} from 'lucide-react';

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  notes?: string;
  loyaltyPoints: number;
  createdAt: string;
}

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New Customer Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [notes, setNotes] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/customers?search=${search}`);
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/customers', {
        name,
        phone,
        email: email || undefined,
        birthday: birthday || undefined,
        notes,
        branch: 'BR001' // default test branch reference
      });
      if (res.data.success) {
        // Clear fields
        setName('');
        setPhone('');
        setEmail('');
        setBirthday('');
        setNotes('');
        setShowAddForm(false);
        fetchCustomers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add customer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Customer Relationship Management (CRM)</h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold uppercase">Client Visits & Loyalty Ledger</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#8b5cf6]/20"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Search Filter input */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name, phone or email..."
          className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-[#8b5cf6] text-white placeholder-slate-500 transition-all"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm">Querying customer ledger...</div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-[#0f0f12]/30">
                  <th className="p-4">Name</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Loyalty Points</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4">Client Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {customers.length > 0 ? (
                  customers.map((c) => (
                    <tr key={c._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-semibold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        {c.name}
                      </td>
                      <td className="p-4 font-mono">{c.phone}</td>
                      <td className="p-4 text-slate-400">{c.email || '-'}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          <Award className="w-3.5 h-3.5" />
                          {c.loyaltyPoints} pts
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-xs text-slate-400 truncate max-w-xs">{c.notes || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">No customers matched query criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Client Dialog Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#101014] border border-white/5 p-6 rounded-2xl shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">Add Customer Profile</h3>

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@doe.com"
                  className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Birthday (optional)</label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Consultation / Client Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Client preferences, hair type, allergies..."
                  className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none h-20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-[#8b5cf6]/10"
                >
                  Save Profile
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

export default Customers;
