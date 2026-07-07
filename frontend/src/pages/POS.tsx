import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PrinterService } from '../services/printerService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  User,
  Ticket,
  Printer,
  ChevronLeft,
  UserCheck,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';

interface Customer {
  _id: string;
  name: string;
  phone: string;
  loyaltyPoints: number;
}

interface Service {
  _id: string;
  name: string;
  price: number;
  duration: number;
  taxRate: number;
  category: any;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
}

interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  itemType: 'service' | 'product';
  stylistId?: string;
  stylistName?: string;
}

interface Stylist {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  rating: number;
}

export const POS: React.FC = () => {
  const navigate = useNavigate();

  // Lists from APIs
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  // Selection states
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // CRM Search
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerMessage, setCustomerMessage] = useState('');
  const [walkinName, setWalkinName] = useState('Walk-in Customer');
  const [walkinPhone, setWalkinPhone] = useState('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  // Payment Selection
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online' | 'upi' | 'card' | 'qr'>('cash');
  const [billingNotes, setBillingNotes] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState<any | null>(null);

  // Fetch all data
  const loadPOSData = async () => {
    try {
      const sRes = await api.get('/services');
      const pRes = await api.get('/products');
      const stRes = await api.get('/staff');
      const catRes = await api.get('/categories');
      const invRes = await api.get('/invoices');

      if (sRes.data.success) setServices(sRes.data.data);
      if (pRes.data.success) setProducts(pRes.data.data);
      if (stRes.data.success) {
        setStylists(stRes.data.data);
        if (stRes.data.data.length > 0) {
          setSelectedStylist(stRes.data.data[0]);
        }
      }
      if (catRes.data.success && catRes.data.data.length > 0) {
        setCategories(catRes.data.data);
        setActiveCategory(catRes.data.data[0]._id);
      }
      if (invRes.data.success) {
        setInvoices(invRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load POS data', err);
    }
  };

  useEffect(() => {
    loadPOSData();
  }, []);

  // Search Customer CRM
  const handleCustomerSearch = async () => {
    if (!searchPhone) return;
    setCustomerMessage('');
    try {
      const res = await api.get(`/customers?search=${searchPhone}`);
      if (res.data.success && res.data.data.length > 0) {
        setSelectedCustomer(res.data.data[0]);
        setCustomerMessage(`Loaded client: ${res.data.data[0].name}`);
      } else {
        setSelectedCustomer(null);
        setCustomerMessage('No client found. Billed as walk-in.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add item to cart
  const addToCart = (item: Service | Product, type: 'service' | 'product') => {
    const existing = cart.find(c => c.itemId === item._id && c.itemType === type);

    if (existing) {
      setCart(cart.map(c =>
        c.itemId === item._id && c.itemType === type
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        itemId: item._id,
        name: item.name,
        price: item.price,
        quantity: 1,
        itemType: type,
        stylistId: type === 'service' && selectedStylist ? selectedStylist.user._id : undefined,
        stylistName: type === 'service' && selectedStylist ? selectedStylist.user.name : undefined
      }]);
    }
  };

  // Adjust Qty
  const adjustQty = (itemId: string, type: 'service' | 'product', amount: number) => {
    const existing = cart.find(c => c.itemId === itemId && c.itemType === type);
    if (!existing) return;

    if (existing.quantity + amount <= 0) {
      setCart(cart.filter(c => !(c.itemId === itemId && c.itemType === type)));
    } else {
      setCart(cart.map(c =>
        c.itemId === itemId && c.itemType === type
          ? { ...c, quantity: c.quantity + amount }
          : c
      ));
    }
  };

  // Validate coupon
  const handleValidateCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await api.get(`/coupons/validate?code=${couponCode}&amount=${subtotalTotal}`);
      if (res.data.success) {
        setCouponDiscount(res.data.data.discountAmount);
        setCouponApplied(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Invalid Coupon');
      setCouponDiscount(0);
      setCouponApplied(false);
    }
  };

  // Calculations
  const subtotalTotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const taxRate = 0;
  const rawTaxableValue = subtotalTotal - couponDiscount;
  const finalPayable = Math.max(0, Math.round(rawTaxableValue));

  // Perform checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    const payload = {
      customerId: selectedCustomer ? selectedCustomer._id : undefined,
      customerName: selectedCustomer ? undefined : walkinName,
      customerPhone: selectedCustomer ? undefined : walkinPhone,
      items: cart.map(c => ({
        itemType: c.itemType,
        itemId: c.itemId,
        quantity: c.quantity,
        price: c.price,
        stylistId: c.stylistId
      })),
      couponCode: couponApplied ? couponCode : undefined,
      payments: [
        {
          method: paymentMode,
          amount: finalPayable
        }
      ],
      notes: billingNotes
    };

    try {
      const res = await api.post('/invoices', payload);
      if (res.data.success) {
        setCheckoutSuccess(res.data.data);
        
        // Auto-print invoice receipt if configured
        const printerService = PrinterService.getInstance();
        const settings = printerService.getSettings();
        if (settings.autoPrint && printerService.getStatus().isConnected) {
          try {
            await printerService.printInvoice(res.data.data);
          } catch (err: any) {
            console.error('Auto-print failed', err);
            alert(`Auto-print failed: ${err.message || 'Check printer connection.'}`);
          }
        }

        // Clear / Reset cart state
        setCart([]);
        setSelectedCustomer(null);
        setSearchPhone('');
        setCouponApplied(false);
        setCouponDiscount(0);
        setCouponCode('');
        setCustomerMessage('');
        // Reload invoices to update stylist counts
        loadPOSData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Checkout failed');
    }
  };

  const handleClearBill = () => {
    setCart([]);
    setSelectedCustomer(null);
    setSearchPhone('');
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponCode('');
    setCustomerMessage('');
  };

  // Stylist daily aggregation calculator
  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = invoices.filter(
    inv => inv.createdAt.split('T')[0] === todayStr && inv.status === 'paid'
  );

  const getStylistStats = (userId: string) => {
    let billsCount = 0;
    let revenueSum = 0;

    todayInvoices.forEach(inv => {
      let isAssigned = false;
      inv.items.forEach((it: any) => {
        if (it.stylist === userId) {
          isAssigned = true;
          revenueSum += it.subtotal || 0;
        }
      });
      if (isAssigned) {
        billsCount++;
      }
    });

    return { billsCount, revenueSum };
  };

  // Get total services by category for badges
  const getCategoryCount = (categoryId: string) => {
    return services.filter(s => s.category?._id === categoryId || (s.category as any) === categoryId).length;
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full flex overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* COLUMN 1: STAFF SELECTOR (Luxury Gold Accents) */}
      <div className="w-[220px] shrink-0 bg-white border-r border-slate-100 flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              Stylist Roster
            </h4>
          </div>
          <div className="p-3 space-y-2.5">
            {stylists.map(st => {
              const isActive = selectedStylist?._id === st._id;
              const stats = getStylistStats(st.user._id);

              return (
                <button
                  key={st._id}
                  onClick={() => setSelectedStylist(st)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex flex-col gap-2 relative overflow-hidden ${
                    isActive
                      ? 'bg-[#D4AF37] text-white border-[#D4AF37] shadow-lg shadow-[#D4AF37]/15'
                      : 'bg-white text-slate-800 border-slate-100 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm shrink-0 border border-white" />
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                          isActive ? 'bg-white text-[#D4AF37]' : 'bg-[#D4AF37]/10 text-[#D4AF37]'
                        }`}
                      >
                        {st.user.name.slice(0, 2)}
                      </div>
                      <div>
                        <h5 className="font-extrabold text-xs leading-none">{st.user.name}</h5>
                        <p className={`text-[8px] font-black uppercase mt-0.5 tracking-wider ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                          Stylist
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 gap-1 border-t pt-2 text-[8px] font-bold ${
                    isActive ? 'border-white/10 text-white/80' : 'border-slate-100 text-slate-400'
                  }`}>
                    <div>
                      <span>Invoices: </span>
                      <span className={`font-mono ${isActive ? 'text-white' : 'text-slate-800'}`}>{stats.billsCount}</span>
                    </div>
                    <div className="text-right">
                      <span>Total: </span>
                      <span className={`font-mono ${isActive ? 'text-white' : 'text-slate-800'}`}>₹{stats.revenueSum}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* COLUMN 2: SERVICE CATEGORIES */}
      <div className="w-[220px] shrink-0 bg-white border-r border-slate-100 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Categories</h4>
        </div>
        <div className="p-3 space-y-1">
          {categories.map(cat => {
            const isActive = activeCategory === cat._id;
            const count = getCategoryCount(cat._id);
            return (
              <button
                key={cat._id}
                onClick={() => setActiveCategory(cat._id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex justify-between items-center ${
                  isActive
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-l-4 border-[#D4AF37] rounded-l-none font-black'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span>{cat.name.split(' & ')[0]}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-[#D4AF37] text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* COLUMN 3: SERVICES GRID */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        {/* Search bar */}
        <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services instantly..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-[#D4AF37] focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Services List scrollable grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 align-content-start">
          {services
            .filter(s => {
              const matchesCategory = s.category?._id === activeCategory || (s.category as any) === activeCategory;
              const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
              return matchesCategory && matchesSearch;
            })
            .map((s) => (
              <motion.div
                key={s._id}
                whileHover={{ scale: 1.02, y: -2 }}
                className="bg-white p-4.5 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-36 hover:border-[#D4AF37]/30 transition-all hover:shadow-md"
              >
                <div>
                  <h5 className="font-extrabold text-xs text-slate-800 leading-snug">{s.name}</h5>
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 font-bold uppercase">
                    <Clock className="w-3 h-3 text-[#D4AF37]" />
                    <span>{s.duration} min</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <span className="text-xs font-black text-slate-800">₹{s.price}</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(s, 'service')}
                    className="bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-white px-3.5 py-1.5 rounded-xl transition-colors border border-[#D4AF37]/10 text-[10px] font-black flex items-center gap-0.5 uppercase tracking-wide"
                  >
                    Add [ + ]
                  </motion.button>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* COLUMN 4: CURRENT BILL */}
      <div className="w-[360px] shrink-0 bg-white border-l border-slate-100 flex flex-col justify-between overflow-hidden shadow-sm">
        <div>
          {/* Customer CRM section */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Client lookup..."
                  className="w-full bg-white border border-slate-200 rounded-xl py-1.5 pl-8 pr-2 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <button
                onClick={handleCustomerSearch}
                className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-extrabold px-3.5 rounded-xl border border-[#D4AF37]/15 transition-colors"
              >
                Verify
              </button>
            </div>

            {customerMessage && (
              <p className="text-[9px] text-[#D4AF37] font-mono leading-none">{customerMessage}</p>
            )}

            {selectedCustomer ? (
              <div className="bg-white p-3 rounded-xl flex items-center gap-2 border border-[#D4AF37]/15 shadow-sm">
                <User className="w-4 h-4 text-[#D4AF37]" />
                <div className="text-[10px]">
                  <h4 className="font-extrabold text-slate-800">{selectedCustomer.name}</h4>
                  <p className="text-[9px] text-slate-500 font-mono">{selectedCustomer.phone}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  placeholder="Walk-in Client"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] focus:outline-none"
                />
                <input
                  type="text"
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  placeholder="Phone"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Cart item elements */}
          <div className="overflow-y-auto max-h-[32vh] p-4 space-y-2.5 border-b border-slate-100">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div key={`${item.itemId}-${item.itemType}`} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex justify-between items-center gap-2">
                  <div className="text-[10px] max-w-[55%]">
                    <h5 className="font-extrabold text-slate-800 truncate">{item.name}</h5>
                    <span className="text-[8px] text-[#D4AF37] font-black uppercase tracking-wider">
                      ₹{item.price} ({item.stylistName || 'Stylist'})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 border border-slate-200 bg-white rounded-lg px-2 py-0.5">
                      <button onClick={() => adjustQty(item.itemId, item.itemType, -1)} className="text-slate-500 hover:text-slate-800">
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-[9px] font-bold font-mono text-slate-800">{item.quantity}</span>
                      <button onClick={() => adjustQty(item.itemId, item.itemType, 1)} className="text-slate-500 hover:text-slate-800">
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <span className="text-[10px] font-black text-slate-800 font-mono">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 flex flex-col items-center justify-center text-slate-400 gap-1.5 opacity-55">
                <ShoppingCart className="w-7 h-7 text-slate-300" />
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Empty Invoice Cart</p>
              </div>
            )}
          </div>
        </div>

        {/* Coupon discount and calculation ledger totals */}
        <div className="p-4 space-y-4 bg-white border-t border-slate-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Apply coupon..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] uppercase focus:outline-none"
            />
            <button
              onClick={handleValidateCoupon}
              className="bg-[#D4AF37]/15 text-[#D4AF37] text-[9px] font-black px-3.5 rounded-xl border border-[#D4AF37]/15"
            >
              Apply
            </button>
          </div>

          <div className="text-[10px] space-y-1.5 text-slate-500 border-b border-slate-100 pb-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-800 font-bold">₹{subtotalTotal}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Coupon Discount:</span>
                <span className="font-mono">-₹{couponDiscount}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-2.5 text-xs font-black text-slate-800">
              <span>Total Payable:</span>
              <span className="text-[#D4AF37] font-black font-mono text-base">₹{finalPayable}</span>
            </div>
          </div>

          {/* Payment types selectors grid */}
          <div className="space-y-1.5">
            <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Select Payment Method</span>
            <div className="grid grid-cols-3 gap-2">
              {['cash', 'upi', 'card'].map((method) => {
                const isActive = paymentMode === method;
                return (
                  <button
                    key={method}
                    onClick={() => setPaymentMode(method as any)}
                    className={`py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${
                      isActive
                        ? 'bg-[#D4AF37] text-white border-[#D4AF37] shadow-md shadow-[#D4AF37]/15'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100/50'
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checkout action keys layout */}
          <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-100">
            <button
              onClick={handleClearBill}
              className="py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-[10px] font-black transition-all uppercase tracking-wider"
            >
              Clear Bill
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckout}
              className="bg-[#D4AF37] hover:bg-[#C5A880] text-white font-black rounded-2xl py-3 text-[10px] tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#D4AF37]/15 uppercase"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Complete Bill
            </motion.button>
          </div>
        </div>
      </div>

      {/* Printable Thermal Receipt modal */}
      {checkoutSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white text-black p-6 rounded-2xl shadow-2xl relative border-4 border-[#D4AF37] font-mono text-xs">
            <h2 className="text-center font-bold text-base uppercase">Super Hair Art Unisex Saloon</h2>
            <p className="text-center text-[10px] border-b border-dashed border-black pb-2">Hill Road, Bandra West, Mumbai</p>

            <div className="my-3 space-y-0.5 text-[10px]">
              <p>Invoice: {checkoutSuccess.invoiceNumber}</p>
              <p>Date: {new Date(checkoutSuccess.createdAt).toLocaleString()}</p>
              <p>Client: {checkoutSuccess.customerName}</p>
              <p className="border-b border-dashed border-black pb-2">Billed By: Pooja Patel</p>
            </div>

            {/* Receipt items list */}
            <div className="space-y-1 border-b border-dashed border-black pb-3">
              {checkoutSuccess.items.map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.quantity}x {it.name}</span>
                  <span>₹{it.price * it.quantity}</span>
                </div>
              ))}
            </div>

            <div className="my-3 space-y-1 text-right">
              <p>Subtotal: ₹{checkoutSuccess.subtotal}</p>
              {checkoutSuccess.discountTotal > 0 && <p>Discount: -₹{checkoutSuccess.discountTotal}</p>}
              <p className="font-bold text-sm">TOTAL AMOUNT: ₹{checkoutSuccess.totalAmount}</p>
            </div>

            <div className="border-t border-dashed border-black pt-2 text-center text-[10px]">
              <p>Thank you for visiting us!</p>
              <p className="mt-1 font-bold">Paid via {checkoutSuccess.payments.map((p: any) => p.method).join(' / ').toUpperCase()}</p>
            </div>

            <div className="mt-6 flex gap-3 no-print">
              <button
                onClick={async () => {
                  const printerService = PrinterService.getInstance();
                  if (printerService.getStatus().isConnected) {
                    try {
                      await printerService.printInvoice(checkoutSuccess);
                    } catch (err: any) {
                      alert(`Printing failed: ${err.message}. Please check connection.`);
                    }
                  } else {
                    window.print();
                  }
                }}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-bold"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                onClick={() => {
                  setCheckoutSuccess(null);
                  navigate('/');
                }}
                className="flex-1 border border-slate-900 hover:bg-slate-100 py-2 rounded-lg text-center text-[10px] font-bold"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
