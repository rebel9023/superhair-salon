import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Package,
  Search,
  Plus,
  RefreshCw,
  Sliders,
  AlertTriangle
} from 'lucide-react';

interface StockItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    sku: string;
    barcode: string;
    price: number;
    costPrice: number;
    minStockAlert: number;
  };
  branch: {
    _id: string;
    name: string;
  };
  quantity: number;
}

export const Inventory: React.FC = () => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Adjustment form fields
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustNotes, setAdjustNotes] = useState('');

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory');
      if (res.data.success) {
        setStock(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/inventory', {
        productId: selectedProductId,
        branchId: selectedBranchId,
        quantity: adjustQty,
        notes: adjustNotes
      });
      if (res.data.success) {
        setShowAdjustForm(false);
        setAdjustNotes('');
        fetchStock();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Adjustment failed');
    }
  };

  // Filter list based on search term
  const filteredStock = stock.filter(item => {
    if (!item.product) return false;
    const nameMatch = item.product.name.toLowerCase().includes(search.toLowerCase());
    const skuMatch = item.product.sku.toLowerCase().includes(search.toLowerCase());
    const barcodeMatch = item.product.barcode.includes(search);
    return nameMatch || skuMatch || barcodeMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Inventory Control Ledger</h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold uppercase">Stock Levels, SKUs & Adjustments</p>
        </div>
        <button
          onClick={() => {
            if (stock.length > 0) {
              setSelectedProductId(stock[0].product?._id || '');
              setSelectedBranchId(stock[0].branch?._id || '');
            }
            setShowAdjustForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#8b5cf6]/20"
        >
          <Sliders className="w-4 h-4" />
          Adjust Stock
        </button>
      </div>

      {/* Filter and alerts summary banner */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, barcode, name..."
            className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-[#8b5cf6] text-white placeholder-slate-500 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm">Querying inventory catalog...</div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-[#0f0f12]/30">
                  <th className="p-4">Product Name</th>
                  <th className="p-4">SKU Code</th>
                  <th className="p-4">Barcode</th>
                  <th className="p-4">Branch Location</th>
                  <th className="p-4">Retail Price</th>
                  <th className="p-4 text-right">Available Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {filteredStock.length > 0 ? (
                  filteredStock.map((item) => {
                    const isLow = item.quantity <= (item.product?.minStockAlert || 5);
                    return (
                      <tr key={item._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-semibold text-white flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-500" />
                          {item.product?.name}
                        </td>
                        <td className="p-4 font-mono text-slate-400">{item.product?.sku}</td>
                        <td className="p-4 font-mono text-slate-400">{item.product?.barcode}</td>
                        <td className="p-4 text-xs font-semibold text-slate-300">
                          {item.branch?.name.split('-')[1] || item.branch?.name}
                        </td>
                        <td className="p-4 text-[#eab308] font-bold">₹{item.product?.price}</td>
                        <td className="p-4 text-right">
                          <span className={`inline-flex items-center gap-1 font-bold ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>
                            {isLow && <AlertTriangle className="w-3.5 h-3.5" />}
                            {item.quantity} units
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">No items match filter query.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Overlay Modal */}
      {showAdjustForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#101014] border border-white/5 p-6 rounded-2xl shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">Manual Inventory Adjustment</h3>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Select Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-[#16161a] border border-white/5 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                >
                  {stock.map(item => (
                    <option key={item._id} value={item.product?._id}>
                      {item.product?.name} ({item.product?.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Salon Branch</label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-[#16161a] border border-white/5 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                >
                  {/* Extract unique branches from stock list */}
                  {Array.from(new Set(stock.map(s => s.branch?._id))).map(bId => {
                    const bName = stock.find(s => s.branch?._id === bId)?.branch?.name;
                    return (
                      <option key={bId} value={bId}>
                        {bName}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">New Absolute Quantity</label>
                <input
                  type="number"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  placeholder="e.g. 25"
                  className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Audit Notes</label>
                <input
                  type="text"
                  required
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Refill supply / adjustments..."
                  className="w-full bg-[#16161a] border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-[#8b5cf6]/10"
                >
                  Adjust Quantity
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdjustForm(false)}
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

export default Inventory;
