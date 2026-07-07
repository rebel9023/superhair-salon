import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PrinterService } from '../services/printerService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle,
  User, Printer, ChevronRight, ChevronLeft, ArrowRight,
  Clock, Sparkles, Banknote, Smartphone, CreditCard,
  QrCode, RefreshCw, X, ReceiptText, Home, UserCheck
} from 'lucide-react';

/* ─────────── Types ─────────── */
interface Customer { _id: string; name: string; phone: string; loyaltyPoints: number; }
interface Service  { _id: string; name: string; price: number; duration: number; taxRate: number; category: any; }
interface CartItem { itemId: string; name: string; price: number; quantity: number; itemType: 'service'; stylistId?: string; stylistName?: string; }
interface Stylist  { _id: string; user: { _id: string; name: string; }; rating: number; }

/* ─────────── Step Enum ─────────── */
type Step = 'staff' | 'customer' | 'services' | 'payment' | 'done';

const STEPS: { key: Step; label: string; num: number }[] = [
  { key: 'staff',    label: 'Select Staff',    num: 1 },
  { key: 'customer', label: 'Customer',        num: 2 },
  { key: 'services', label: 'Select Services', num: 3 },
  { key: 'payment',  label: 'Payment',         num: 4 },
];

export const POS: React.FC = () => {
  const navigate = useNavigate();

  /* ── Data ── */
  const [services,   setServices]   = useState<Service[]>([]);
  const [stylists,   setStylists]   = useState<Stylist[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [invoices,   setInvoices]   = useState<any[]>([]);

  /* ── Step Flow ── */
  const [step, setStep] = useState<Step>('staff');

  /* ── Staff ── */
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);

  /* ── Customer ── */
  const [searchPhone,      setSearchPhone]      = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerMessage,  setCustomerMessage]  = useState('');
  const [walkinName,       setWalkinName]       = useState('Walk-in Customer');
  const [walkinPhone,      setWalkinPhone]       = useState('');

  /* ── Services ── */
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [cart,           setCart]           = useState<CartItem[]>([]);

  /* ── Payment ── */
  const [paymentMode,    setPaymentMode]    = useState<'cash' | 'upi' | 'card' | 'qr'>('cash');
  const [billingNotes,   setBillingNotes]   = useState('');

  /* ── Done ── */
  const [checkoutSuccess, setCheckoutSuccess] = useState<any | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  /* ─────── Load ─────── */
  const loadData = async () => {
    try {
      const [sRes, stRes, catRes, invRes] = await Promise.all([
        api.get('/services'),
        api.get('/staff'),
        api.get('/categories'),
        api.get('/invoices'),
      ]);
      if (sRes.data.success)   setServices(sRes.data.data);
      if (stRes.data.success)  setStylists(stRes.data.data);
      if (catRes.data.success && catRes.data.data.length > 0) {
        setCategories(catRes.data.data);
        setActiveCategory(catRes.data.data[0]._id);
      }
      if (invRes.data.success) setInvoices(invRes.data.data);
    } catch (err) { console.error('POS load error', err); }
  };

  useEffect(() => { loadData(); }, []);

  /* ─────── Customer search ─────── */
  const handleCustomerSearch = async () => {
    if (!searchPhone.trim()) return;
    setCustomerMessage('');
    try {
      const res = await api.get(`/customers?search=${searchPhone}`);
      if (res.data.success && res.data.data.length > 0) {
        setSelectedCustomer(res.data.data[0]);
        setCustomerMessage(`✓ Found: ${res.data.data[0].name}`);
      } else {
        setSelectedCustomer(null);
        setCustomerMessage('Not found — will bill as walk-in.');
      }
    } catch { setCustomerMessage('Search error. Try again.'); }
  };

  /* ─────── Cart helpers ─────── */
  const addToCart = (s: Service) => {
    const ex = cart.find(c => c.itemId === s._id);
    if (ex) {
      setCart(cart.map(c => c.itemId === s._id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        itemId: s._id, name: s.name, price: s.price, quantity: 1,
        itemType: 'service',
        stylistId:   selectedStylist?.user._id,
        stylistName: selectedStylist?.user.name,
      }]);
    }
  };
  const adjustQty = (itemId: string, delta: number) => {
    const ex = cart.find(c => c.itemId === itemId);
    if (!ex) return;
    if (ex.quantity + delta <= 0) setCart(cart.filter(c => c.itemId !== itemId));
    else setCart(cart.map(c => c.itemId === itemId ? { ...c, quantity: c.quantity + delta } : c));
  };
  const removeFromCart = (itemId: string) => setCart(cart.filter(c => c.itemId !== itemId));

  /* ─────── Calculations ─────── */
  const subtotal     = cart.reduce((a, c) => a + c.price * c.quantity, 0);
  const finalPayable = Math.max(0, Math.round(subtotal));

  /* ─────── Checkout ─────── */
  const handleCheckout = async () => {
    if (cart.length === 0) { alert('Please add at least one service.'); return; }
    const payload = {
      customerId:    selectedCustomer ? selectedCustomer._id : undefined,
      customerName:  selectedCustomer ? undefined : walkinName,
      customerPhone: selectedCustomer ? undefined : walkinPhone,
      items: cart.map(c => ({ itemType: c.itemType, itemId: c.itemId, quantity: c.quantity, price: c.price, stylistId: c.stylistId })),
      payments: [{ method: paymentMode, amount: finalPayable }],
      notes: billingNotes,
    };
    try {
      const res = await api.post('/invoices', payload);
      if (res.data.success) {
        setCheckoutSuccess(res.data.data);
        setStep('done');

        // Auto-print
        const ps = PrinterService.getInstance();
        if (ps.getSettings().autoPrint && ps.getStatus().isConnected) {
          setIsPrinting(true);
          try { await ps.printInvoice(res.data.data); } catch {}
          setIsPrinting(false);
        }
        loadData();
      }
    } catch (err: any) { alert(err.response?.data?.message || 'Checkout failed. Try again.'); }
  };

  /* ─────── Reset for new bill ─────── */
  const resetBill = () => {
    setCart([]); setSelectedCustomer(null); setSearchPhone(''); setCustomerMessage('');
    setWalkinName('Walk-in Customer'); setWalkinPhone(''); setBillingNotes('');
    setPaymentMode('cash'); setCheckoutSuccess(null); setSelectedStylist(null);
    setStep('staff');
  };

  /* ─────── Stylist stats ─────── */
  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = invoices.filter(inv => inv.createdAt?.split('T')[0] === todayStr && inv.status === 'paid');
  const getStylistStats = (userId: string) => {
    let bills = 0, revenue = 0;
    todayInvoices.forEach(inv => {
      let hit = false;
      inv.items?.forEach((it: any) => { if (it.stylist === userId) { hit = true; revenue += it.subtotal || 0; } });
      if (hit) bills++;
    });
    return { bills, revenue };
  };

  /* ─────── Filtered services ─────── */
  const filteredServices = services.filter(s => {
    const catMatch = s.category?._id === activeCategory || s.category === activeCategory;
    const qMatch   = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && qMatch;
  });

  /* ─────── Step progress bar ─────── */
  const StepBar = () => (
    <div className="flex items-center gap-0 px-6 py-3 bg-[#0f172a] border-b border-white/5">
      {STEPS.map((s, i) => {
        const stepOrder: Step[] = ['staff', 'customer', 'services', 'payment'];
        const curIdx = stepOrder.indexOf(step === 'done' ? 'payment' : step);
        const sIdx   = stepOrder.indexOf(s.key);
        const done   = sIdx < curIdx || step === 'done';
        const active = sIdx === curIdx && step !== 'done';
        return (
          <React.Fragment key={s.key}>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                done ? 'bg-[#D4AF37] text-white' : active ? 'bg-white text-[#0f172a]' : 'bg-white/10 text-white/40'
              }`}>
                {done ? '✓' : s.num}
              </div>
              <span className={`text-[10px] font-bold hidden sm:block ${active ? 'text-white' : done ? 'text-[#D4AF37]' : 'text-white/30'}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 transition-all ${done ? 'bg-[#D4AF37]/60' : 'bg-white/10'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  /* ══════════════════════════════════════
     STEP 1: SELECT STAFF
  ══════════════════════════════════════ */
  if (step === 'staff') return (
    <div className="h-[calc(100vh-3.5rem)] w-full flex flex-col bg-slate-50 overflow-hidden">
      <StepBar />
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start py-10 px-4">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 text-[#D4AF37] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Step 1 of 4
            </div>
            <h1 className="text-2xl font-black text-slate-900">Who is serving today?</h1>
            <p className="text-slate-400 text-sm mt-1">Select the staff member for this bill</p>
          </div>

          {stylists.length === 0 ? (
            <div className="text-center text-slate-400 py-20">
              <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No staff found</p>
              <p className="text-xs mt-1">Add staff members from the Staff module</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {stylists.map(st => {
                const isActive = selectedStylist?._id === st._id;
                const stats    = getStylistStats(st.user._id);
                const initials = st.user.name.slice(0, 2).toUpperCase();
                return (
                  <motion.button
                    key={st._id}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelectedStylist(st)}
                    className={`relative flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all shadow-sm ${
                      isActive
                        ? 'bg-[#D4AF37] border-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/20'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-[#D4AF37]/40'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-[#D4AF37]" />
                      </div>
                    )}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black ${
                      isActive ? 'bg-white/25 text-white' : 'bg-[#D4AF37]/10 text-[#D4AF37]'
                    }`}>
                      {initials}
                    </div>
                    <div className="text-center">
                      <h3 className={`font-black text-sm ${isActive ? 'text-white' : 'text-slate-800'}`}>{st.user.name}</h3>
                      <p className={`text-[9px] uppercase tracking-wider font-bold mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-400'}`}>Stylist</p>
                    </div>
                    <div className={`w-full text-[9px] font-bold border-t pt-2 flex justify-between ${isActive ? 'border-white/15 text-white/80' : 'border-slate-100 text-slate-500'}`}>
                      <span>Bills: {stats.bills}</span>
                      <span>₹{stats.revenue}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { if (!selectedStylist) { alert('Please select a staff member'); return; } setStep('customer'); }}
              className="bg-[#D4AF37] hover:bg-[#C5A028] text-white font-black px-10 py-4 rounded-2xl flex items-center gap-2.5 text-sm shadow-lg shadow-[#D4AF37]/20 transition-colors"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════
     STEP 2: CUSTOMER
  ══════════════════════════════════════ */
  if (step === 'customer') return (
    <div className="h-[calc(100vh-3.5rem)] w-full flex flex-col bg-slate-50 overflow-hidden">
      <StepBar />
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start py-10 px-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 text-[#D4AF37] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-3">
              <User className="w-3.5 h-3.5" /> Step 2 of 4
            </div>
            <h1 className="text-2xl font-black text-slate-900">Customer Details</h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">Optional — search existing or continue as walk-in</p>
          </div>

          {/* Staff badge */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4AF37] text-white rounded-xl flex items-center justify-center font-black text-sm">
              {selectedStylist?.user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Serving Staff</p>
              <p className="font-black text-slate-800">{selectedStylist?.user.name}</p>
            </div>
            <button onClick={() => setStep('staff')} className="ml-auto text-[10px] text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1">
              <ChevronLeft className="w-3 h-3" /> Change
            </button>
          </div>

          {/* Customer lookup */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-[#D4AF37]" /> Search Existing Customer
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchPhone}
                onChange={e => setSearchPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCustomerSearch()}
                placeholder="Enter phone number..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors font-medium"
              />
              <button
                onClick={handleCustomerSearch}
                className="bg-[#D4AF37]/10 hover:bg-[#D4AF37] hover:text-white text-[#D4AF37] font-black px-5 rounded-xl border border-[#D4AF37]/20 transition-colors text-sm"
              >
                Search
              </button>
            </div>
            {customerMessage && (
              <p className={`text-xs font-bold ${customerMessage.startsWith('✓') ? 'text-emerald-600' : 'text-amber-600'}`}>{customerMessage}</p>
            )}

            {selectedCustomer ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-black text-sm">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-slate-800">{selectedCustomer.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{selectedCustomer.phone}</p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-0.5">★ {selectedCustomer.loyaltyPoints} loyalty points</p>
                </div>
                <button onClick={() => { setSelectedCustomer(null); setCustomerMessage(''); setSearchPhone(''); }} className="ml-auto text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">— Or bill as Walk-in —</p>
                <input
                  type="text"
                  value={walkinName}
                  onChange={e => setWalkinName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] font-medium"
                />
                <input
                  type="text"
                  value={walkinPhone}
                  onChange={e => setWalkinPhone(e.target.value)}
                  placeholder="Phone number (optional)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] font-medium"
                />
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between">
            <button onClick={() => setStep('staff')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep('services')}
              className="bg-[#D4AF37] hover:bg-[#C5A028] text-white font-black px-10 py-4 rounded-2xl flex items-center gap-2.5 text-sm shadow-lg shadow-[#D4AF37]/20 transition-colors"
            >
              Select Services <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════
     STEP 3: SELECT SERVICES
  ══════════════════════════════════════ */
  if (step === 'services') return (
    <div className="h-[calc(100vh-3.5rem)] w-full flex flex-col overflow-hidden bg-slate-50">
      <StepBar />
      <div className="flex-1 flex overflow-hidden">
        {/* Categories sidebar */}
        <div className="w-[180px] shrink-0 bg-white border-r border-slate-100 overflow-y-auto">
          <div className="p-3 border-b border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Categories</p>
          </div>
          <div className="p-2 space-y-1">
            {categories.map(cat => {
              const isActive = activeCategory === cat._id;
              return (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-wide ${
                    isActive
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-l-4 border-[#D4AF37] rounded-l-none'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {cat.name.split(' & ')[0]}
                  <span className={`ml-1 text-[8px] ${isActive ? 'text-[#D4AF37]' : 'text-slate-300'}`}>
                    ({services.filter(s => s.category?._id === cat._id || s.category === cat._id).length})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Services grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 bg-white border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search services..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div className="text-[10px] text-slate-500 font-bold">
              Staff: <span className="text-[#D4AF37] font-black">{selectedStylist?.user.name}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredServices.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                <Search className="w-10 h-10 mb-2 opacity-30" />
                <p className="font-bold text-sm">No services found</p>
              </div>
            ) : filteredServices.map(s => (
              <motion.div
                key={s._id}
                whileHover={{ scale: 1.02, y: -2 }}
                className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-32 hover:border-[#D4AF37]/40 hover:shadow-md transition-all"
              >
                <div>
                  <h5 className="font-extrabold text-xs text-slate-800 leading-snug">{s.name}</h5>
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 font-bold">
                    <Clock className="w-2.5 h-2.5 text-[#D4AF37]" />{s.duration} min
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-2.5">
                  <span className="text-xs font-black text-slate-800">₹{s.price}</span>
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={() => addToCart(s)}
                    className="bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-white px-3 py-1 rounded-lg text-[9px] font-black transition-colors border border-[#D4AF37]/20 flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Cart panel */}
        <div className="w-[300px] shrink-0 bg-white border-l border-slate-100 flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-[#D4AF37]" /> Current Bill
              </h4>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-[9px] text-red-400 hover:text-red-600 font-bold">Clear</button>
              )}
            </div>
            <p className="text-[9px] text-slate-400 mt-1 font-medium">
              {selectedCustomer ? `${selectedCustomer.name}` : walkinName} · {selectedStylist?.user.name}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2 py-10">
                <ShoppingCart className="w-8 h-8" />
                <p className="text-[9px] font-black uppercase tracking-wider">Add services</p>
              </div>
            ) : cart.map(item => (
              <div key={item.itemId} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex justify-between items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-[10px] text-slate-800 truncate">{item.name}</p>
                  <p className="text-[8px] text-[#D4AF37] font-black">₹{item.price}</p>
                </div>
                <div className="flex items-center gap-1.5 border border-slate-200 bg-white rounded-lg px-1.5 py-0.5">
                  <button onClick={() => adjustQty(item.itemId, -1)} className="text-slate-400 hover:text-slate-700">
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-[9px] font-bold font-mono w-3 text-center">{item.quantity}</span>
                  <button onClick={() => adjustQty(item.itemId, 1)} className="text-slate-400 hover:text-slate-700">
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
                <span className="text-[10px] font-black text-slate-800 font-mono w-10 text-right">₹{item.price * item.quantity}</span>
                <button onClick={() => removeFromCart(item.itemId)} className="text-slate-300 hover:text-red-500 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100 space-y-3">
            <div className="flex justify-between text-xs font-black text-slate-800">
              <span>Total Payable:</span>
              <span className="text-[#D4AF37] text-base font-black">₹{finalPayable}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('customer')} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-[9px] font-black transition-all flex items-center justify-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Back
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { if (cart.length === 0) { alert('Add at least one service'); return; } setStep('payment'); }}
                className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-white font-black py-2.5 rounded-xl text-[9px] tracking-wider transition-colors shadow-md shadow-[#D4AF37]/15 flex items-center justify-center gap-1"
              >
                Payment <ArrowRight className="w-3 h-3" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════
     STEP 4: PAYMENT
  ══════════════════════════════════════ */
  if (step === 'payment') return (
    <div className="h-[calc(100vh-3.5rem)] w-full flex flex-col bg-slate-50 overflow-hidden">
      <StepBar />
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start py-10 px-4">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 text-[#D4AF37] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-3">
              <ReceiptText className="w-3.5 h-3.5" /> Step 4 of 4
            </div>
            <h1 className="text-2xl font-black text-slate-900">Select Payment Method</h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">Review bill and confirm payment</p>
          </div>

          {/* Bill summary */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Customer</p>
                <p className="font-black text-slate-800">{selectedCustomer ? selectedCustomer.name : walkinName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Staff</p>
                <p className="font-black text-[#D4AF37]">{selectedStylist?.user.name}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              {cart.map(item => (
                <div key={item.itemId} className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">{item.quantity}× {item.name}</span>
                  <span className="font-bold text-slate-800 font-mono">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-200 mt-4 pt-4 flex justify-between items-center">
              <span className="text-sm font-black text-slate-800">Total Payable</span>
              <span className="text-3xl font-black text-[#D4AF37] font-mono">₹{finalPayable}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">Choose Payment Mode</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { method: 'cash',  label: 'Cash',   icon: Banknote },
                { method: 'upi',   label: 'UPI / QR', icon: QrCode },
                { method: 'card',  label: 'Card',   icon: CreditCard },
                { method: 'qr',    label: 'Online', icon: Smartphone },
              ] as const).map(({ method, label, icon: Icon }) => {
                const active = paymentMode === method;
                return (
                  <motion.button
                    key={method}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPaymentMode(method)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                      active
                        ? 'bg-[#D4AF37] border-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-[#D4AF37]/40'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-[#D4AF37]'}`} />
                    {label}
                    {active && <CheckCircle className="w-4 h-4 ml-auto" />}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
            <input
              type="text"
              value={billingNotes}
              onChange={e => setBillingNotes(e.target.value)}
              placeholder="Add a note (optional)..."
              className="w-full text-sm text-slate-700 bg-transparent focus:outline-none font-medium placeholder:text-slate-300"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('services')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors px-4 py-4 rounded-2xl border border-slate-200 hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCheckout}
              className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2.5 text-sm shadow-lg shadow-[#D4AF37]/20 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              Generate Bill & Save
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════
     STEP 5: DONE — RECEIPT + PRINT
  ══════════════════════════════════════ */
  if (step === 'done' && checkoutSuccess) return (
    <div className="h-[calc(100vh-3.5rem)] w-full flex flex-col items-center justify-center bg-slate-50 overflow-y-auto py-8 px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm"
      >
        {/* Success badge */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex w-16 h-16 bg-emerald-500 rounded-full items-center justify-center mb-3 shadow-lg shadow-emerald-500/30"
          >
            <CheckCircle className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-xl font-black text-slate-900">Bill Generated!</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Saved to database successfully</p>
        </div>

        {/* Thermal receipt */}
        <div className="bg-white border-4 border-[#D4AF37] rounded-3xl p-6 font-mono text-xs shadow-xl shadow-[#D4AF37]/10 mb-5">
          <div className="text-center border-b border-dashed border-slate-200 pb-4 mb-4">
            <h2 className="font-black text-base uppercase tracking-wide">Super Hair Art</h2>
            <h3 className="font-bold text-sm">Unisex Salon</h3>
            <p className="text-[10px] text-slate-500 mt-1">Hill Road, Bandra West, Mumbai</p>
            <p className="text-[10px] text-slate-500">Mo: 9723290486</p>
          </div>

          <div className="space-y-0.5 text-[10px] mb-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice</span>
              <span className="font-bold">{checkoutSuccess.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-bold">{new Date(checkoutSuccess.createdAt).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Client</span>
              <span className="font-bold">{checkoutSuccess.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Stylist</span>
              <span className="font-bold text-[#D4AF37]">{selectedStylist?.user.name}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 pt-3 pb-3 space-y-1.5">
            {checkoutSuccess.items.map((it: any, idx: number) => (
              <div key={idx} className="flex justify-between text-[10px]">
                <span>{it.quantity}× {it.name}</span>
                <span className="font-bold">₹{it.price * it.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-200 pt-3 space-y-1 text-right text-[10px]">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>₹{checkoutSuccess.subtotal}</span></div>
            {checkoutSuccess.discountTotal > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-₹{checkoutSuccess.discountTotal}</span></div>}
            <div className="flex justify-between text-sm font-black"><span>TOTAL</span><span>₹{checkoutSuccess.totalAmount}</span></div>
            <div className="flex justify-between font-bold text-[#D4AF37]">
              <span>Paid via</span>
              <span>{checkoutSuccess.payments?.map((p: any) => p.method.toUpperCase()).join(' + ')}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 mt-4 pt-3 text-center text-[10px] text-slate-500">
            <p>Thank you for your visit!</p>
            <p className="font-bold">Please come again 🙏</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={async () => {
              const ps = PrinterService.getInstance();
              if (ps.getStatus().isConnected) {
                setIsPrinting(true);
                try { await ps.printInvoice(checkoutSuccess); } catch (e: any) { alert(`Print error: ${e.message}`); }
                setIsPrinting(false);
              } else { window.print(); }
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md transition-colors"
          >
            <Printer className="w-4 h-4" />
            {isPrinting ? 'Printing...' : 'Print Receipt to EZO Printer'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={resetBill}
            className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-[#D4AF37]/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Bill
          </motion.button>

          <button
            onClick={() => { resetBill(); navigate('/'); }}
            className="w-full py-3 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" /> Return to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );

  return null;
};

export default POS;
