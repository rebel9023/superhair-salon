import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors, Plus, Search, Edit2, Trash2, X, Check,
  Clock, IndianRupee, Tag, ChevronRight, Sparkles, RefreshCw
} from 'lucide-react';

interface Category { _id: string; name: string; description: string; }
interface Service {
  _id: string; name: string; price: number; duration: number;
  taxRate: number; discount: number; description: string;
  category: Category | string; isActive: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Hair Cut & Treatments': '✂️',
  'Shaving & Grooming':    '🪒',
  'Spa':                   '💆',
  'Hair Colour':           '🎨',
  'D-Tan':                 '✨',
  'Clean Up':              '🌿',
};

export const Services: React.FC = () => {
  const [categories,      setCategories]      = useState<Category[]>([]);
  const [services,        setServices]        = useState<Service[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [activeCategory,  setActiveCategory]  = useState<string>('all');
  const [showModal,       setShowModal]       = useState(false);
  const [editingService,  setEditingService]  = useState<Service | null>(null);
  const [deleteConfirm,   setDeleteConfirm]   = useState<string | null>(null);
  const [saving,          setSaving]          = useState(false);

  const [form, setForm] = useState({
    name: '', price: '', duration: '', taxRate: '0',
    discount: '0', description: '', category: '', isActive: true
  });

  /* ─── Load ─── */
  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, svcRes] = await Promise.all([
        api.get('/categories'),
        api.get('/services'),
      ]);
      if (catRes.data.success) setCategories(catRes.data.data);
      if (svcRes.data.success) setServices(svcRes.data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  /* ─── Filtered services ─── */
  const filtered = services.filter(s => {
    const catId = typeof s.category === 'object' ? s.category._id : s.category;
    const qMatch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const cMatch = activeCategory === 'all' || catId === activeCategory;
    return qMatch && cMatch;
  });

  /* ─── Grouped by category ─── */
  const grouped = categories.map(cat => ({
    cat,
    items: filtered.filter(s => {
      const catId = typeof s.category === 'object' ? s.category._id : s.category;
      return catId === cat._id;
    })
  })).filter(g => g.items.length > 0 || activeCategory === g.cat._id);

  /* ─── Open modal ─── */
  const openAdd = () => {
    setEditingService(null);
    setForm({ name: '', price: '', duration: '', taxRate: '0', discount: '0', description: '', category: categories[0]?._id || '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (s: Service) => {
    setEditingService(s);
    setForm({
      name:        s.name,
      price:       String(s.price),
      duration:    String(s.duration),
      taxRate:     String(s.taxRate),
      discount:    String(s.discount),
      description: s.description || '',
      category:    typeof s.category === 'object' ? s.category._id : s.category,
      isActive:    s.isActive !== false
    });
    setShowModal(true);
  };

  /* ─── Save ─── */
  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.category) {
      alert('Please fill Name, Price, and Category.');
      return;
    }
    setSaving(true);
    const payload = {
      name:        form.name.trim(),
      price:       Number(form.price),
      duration:    Number(form.duration) || 30,
      taxRate:     Number(form.taxRate) || 0,
      discount:    Number(form.discount) || 0,
      description: form.description.trim(),
      category:    form.category,
      isActive:    form.isActive,
    };
    try {
      if (editingService) {
        await api.put(`/services/${editingService._id}`, payload);
      } else {
        await api.post('/services', payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Save failed');
    }
    setSaving(false);
  };

  /* ─── Delete ─── */
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/services/${id}`);
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  /* ─── Helpers ─── */
  const getCatName = (s: Service) => typeof s.category === 'object' ? s.category.name : '';

  const totalRevenue = services.reduce((a, s) => a + s.price, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* ── Header ── */}
      <div className="bg-[#0f172a] px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <h1 className="text-white font-black text-lg tracking-wide">Service Menu</h1>
            </div>
            <p className="text-white/40 text-[11px] font-medium">Super Hair Art Unisex Salon — The Gentleman's Standard</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={openAdd}
              className="bg-[#D4AF37] hover:bg-[#C5A028] text-white font-black px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm shadow-lg shadow-[#D4AF37]/20 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Service
            </motion.button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Total Services',  value: services.length },
            { label: 'Categories',      value: categories.length },
            { label: 'Active Services', value: services.filter(s => s.isActive !== false).length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border-b border-slate-100 px-6 py-3 flex flex-wrap items-center gap-2 sticky top-14 z-20 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search services..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
              activeCategory === 'all'
                ? 'bg-[#D4AF37] text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            All ({services.length})
          </button>
          {categories.map(cat => {
            const count = services.filter(s => {
              const cid = typeof s.category === 'object' ? s.category._id : s.category;
              return cid === cat._id;
            }).length;
            return (
              <button
                key={cat._id}
                onClick={() => setActiveCategory(cat._id)}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                  activeCategory === cat._id
                    ? 'bg-[#D4AF37] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {CATEGORY_ICONS[cat.name] || '💈'} {cat.name.split(' & ')[0]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-32 gap-3 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-[#D4AF37]" />
            <span className="font-bold">Loading services...</span>
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
            <Scissors className="w-14 h-14 opacity-20" />
            <p className="font-black text-lg">No services found</p>
            <p className="text-sm">Click "Add Service" to get started</p>
            <button onClick={openAdd} className="mt-2 bg-[#D4AF37] text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Your First Service
            </button>
          </div>
        ) : (
          <div className="space-y-8 max-w-6xl mx-auto">
            {(activeCategory === 'all' ? grouped : grouped.filter(g => g.cat._id === activeCategory)).map(({ cat, items }) => (
              <div key={cat._id}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-[#D4AF37] rounded-2xl flex items-center justify-center text-lg shadow-sm">
                    {CATEGORY_ICONS[cat.name] || '💈'}
                  </div>
                  <div>
                    <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider">{cat.name}</h2>
                    <p className="text-[10px] text-slate-400 font-medium">{items.length} services</p>
                  </div>
                  <div className="flex-1 h-px bg-slate-200 ml-2" />
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {items.map(s => (
                    <motion.div
                      key={s._id}
                      whileHover={{ y: -2, shadow: 'md' }}
                      className={`bg-white border rounded-2xl p-4 flex flex-col gap-3 shadow-sm transition-all hover:shadow-md hover:border-[#D4AF37]/30 ${
                        s.isActive === false ? 'opacity-50 border-dashed' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-black text-slate-800 text-sm leading-tight flex-1 pr-2">{s.name}</h3>
                        {s.isActive === false && (
                          <span className="text-[8px] bg-red-100 text-red-500 font-black px-1.5 py-0.5 rounded-full uppercase">Off</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#D4AF37]" /> {s.duration} min
                        </span>
                        {s.discount > 0 && (
                          <span className="flex items-center gap-1 text-emerald-500">
                            <Tag className="w-3 h-3" /> {s.discount}% off
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                        <div>
                          <p className="text-xl font-black text-slate-900">₹{s.price}</p>
                          {s.discount > 0 && (
                            <p className="text-[9px] text-emerald-500 font-bold">Save ₹{Math.round(s.price * s.discount / 100)}</p>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEdit(s)}
                            className="w-7 h-7 bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-white rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(s._id)}
                            className="w-7 h-7 bg-red-50 hover:bg-red-500 text-red-400 hover:text-white rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════ ADD / EDIT MODAL ═══════════ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-black text-slate-800 text-base">
                  {editingService ? '✏️ Edit Service' : '➕ New Service'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Service Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Hair Cut"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Select category...</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Price + Duration row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      placeholder="e.g. 130"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Duration (min)</label>
                    <input
                      type="number"
                      value={form.duration}
                      onChange={e => setForm({ ...form, duration: e.target.value })}
                      placeholder="e.g. 30"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Discount (%)</label>
                  <input
                    type="number"
                    value={form.discount}
                    onChange={e => setForm({ ...form, discount: e.target.value })}
                    placeholder="0"
                    min="0" max="100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional description..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#D4AF37] resize-none"
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                  <span className="text-xs font-bold text-slate-600 flex-1">Active (visible on POS billing screen)</span>
                  <button
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.isActive ? 'bg-[#D4AF37]' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-white font-black py-3 rounded-2xl text-sm shadow-md shadow-[#D4AF37]/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingService ? 'Update Service' : 'Add Service'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ DELETE CONFIRM ═══════════ */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-black text-slate-800">Delete Service?</h3>
                <p className="text-slate-500 text-sm mt-1">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-500 hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-sm transition-colors">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Services;
