import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Scissors, IndianRupee,
  Banknote, Smartphone, Calendar, Download, Printer,
  RefreshCw, Star, Award, Target, ChevronDown, Filter,
  BarChart2, PieChart as PieChartIcon, FileText, Clock,
  ArrowUpRight, ArrowDownRight, Sparkles
} from 'lucide-react';

/* ─── Colours ─── */
const GOLD   = '#D4AF37';
const DARK   = '#0f172a';
const PIE_COLORS = ['#D4AF37', '#0f172a', '#64748b', '#22c55e', '#ef4444', '#3b82f6'];

/* ─── Period options ─── */
const PERIODS = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7',     label: 'Last 7 Days' },
  { key: 'last30',    label: 'Last 30 Days' },
  { key: 'month',     label: 'This Month' },
  { key: 'prevmonth', label: 'Prev Month' },
  { key: 'year',      label: 'This Year' },
  { key: 'custom',    label: 'Custom Range' },
];

/* ─── Types ─── */
interface Summary { revenue: number; cash: number; online: number; bills: number; customers: number; services: number; hairCuts: number; beardStyling: number; hairSpa: number; hairColour: number; facial: number; }
interface FullSummary { today: Summary; week: Summary; month: Summary; }

/* ─── Metric Card ─── */
const MetricCard: React.FC<{
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; gold?: boolean; small?: boolean;
}> = ({ label, value, sub, icon, gold, small }) => (
  <div className={`rounded-2xl p-4 flex flex-col gap-2 shadow-sm border transition-all hover:shadow-md ${
    gold ? 'bg-[#D4AF37] border-[#D4AF37] text-white' : 'bg-white border-slate-200 text-slate-800'
  }`}>
    <div className="flex justify-between items-start">
      <p className={`text-[9px] font-black uppercase tracking-widest ${gold ? 'text-white/70' : 'text-slate-400'}`}>{label}</p>
      <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${gold ? 'bg-white/20' : 'bg-[#D4AF37]/10'}`}>
        <span className={gold ? 'text-white' : 'text-[#D4AF37]'}>{icon}</span>
      </div>
    </div>
    <p className={`font-black leading-none ${small ? 'text-base' : 'text-2xl'} ${gold ? 'text-white' : 'text-slate-900'}`}>{value}</p>
    {sub && <p className={`text-[9px] font-bold ${gold ? 'text-white/60' : 'text-slate-400'}`}>{sub}</p>}
  </div>
);

/* ─── Section Header ─── */
const SectionHeader: React.FC<{ title: string; icon: React.ReactNode; }> = ({ title, icon }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-8 h-8 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37]">{icon}</div>
    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">{title}</h2>
  </div>
);

/* ─── Empty State ─── */
const EmptyState: React.FC<{ msg: string }> = ({ msg }) => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-300 gap-2">
    <BarChart2 className="w-10 h-10" />
    <p className="font-bold text-sm text-slate-400">{msg}</p>
    <p className="text-xs text-slate-300">No data available for this period</p>
  </div>
);

/* ════════════════════════════════════════════════════
   MAIN REPORTS PAGE
════════════════════════════════════════════════════ */
export const Reports: React.FC = () => {
  const [period,    setPeriod]    = useState('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo,   setCustomTo]   = useState('');
  const [activeTab,  setActiveTab]  = useState<'overview'|'services'|'staff'|'customers'|'payments'|'bills'>('overview');
  const [loading,    setLoading]    = useState(true);

  /* ── Data states ── */
  const [summary,       setSummary]       = useState<FullSummary | null>(null);
  const [serviceData,   setServiceData]   = useState<any[]>([]);
  const [staffData,     setStaffData]     = useState<any[]>([]);
  const [customerData,  setCustomerData]  = useState<any>(null);
  const [paymentData,   setPaymentData]   = useState<any>(null);
  const [salesChart,    setSalesChart]    = useState<any>(null);
  const [recentBills,   setRecentBills]   = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any>(null);
  const [payFilter,     setPayFilter]     = useState('');

  const printRef = useRef<HTMLDivElement>(null);

  /* ── Build query params ── */
  const buildParams = (extra = {}) => {
    const p: any = { period, ...extra };
    if (period === 'custom') { p.from = customFrom; p.to = customTo; }
    return new URLSearchParams(p).toString();
  };

  /* ── Fetch all data ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildParams();
      const [sumRes, svcRes, stfRes, custRes, payRes, chartRes, billRes, topRes] = await Promise.all([
        api.get(`/reports/summary?${qs}`),
        api.get(`/reports/services?${qs}`),
        api.get(`/reports/staff?${qs}`),
        api.get(`/reports/customers?${qs}`),
        api.get(`/reports/payments?${qs}`),
        api.get(`/reports/sales-chart?${qs}`),
        api.get(`/reports/recent-bills?${qs}&limit=100${payFilter ? `&payment=${payFilter}` : ''}`),
        api.get(`/reports/top-performers?${qs}`),
      ]);

      if (sumRes.data.success)   setSummary(sumRes.data.data);
      if (svcRes.data.success)   setServiceData(svcRes.data.data);
      if (stfRes.data.success)   setStaffData(stfRes.data.data);
      if (custRes.data.success)  setCustomerData(custRes.data.data);
      if (payRes.data.success)   setPaymentData(payRes.data.data);
      if (chartRes.data.success) setSalesChart(chartRes.data.data);
      if (billRes.data.success)  setRecentBills(billRes.data.data);
      if (topRes.data.success)   setTopPerformers(topRes.data.data);
    } catch (err) { console.error('Reports fetch error', err); }
    setLoading(false);
  }, [period, customFrom, customTo, payFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Export helpers ── */
  const handlePrint = () => window.print();
  const handleExportCSV = () => {
    if (!recentBills.length) return;
    const headers = ['Invoice No', 'Customer', 'Amount', 'Payment', 'Date'];
    const rows = recentBills.map(b => [
      b.invoiceNumber,
      b.customer?.name || b.customerName || 'Walk-in',
      b.totalAmount,
      b.payments?.map((p: any) => p.method).join('/') || '',
      new Date(b.createdAt).toLocaleString('en-IN')
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `salon-report-${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Tab Bar ─── */
  const TABS: { key: typeof activeTab; label: string }[] = [
    { key: 'overview',  label: 'Overview'  },
    { key: 'services',  label: 'Services'  },
    { key: 'staff',     label: 'Staff'     },
    { key: 'customers', label: 'Customers' },
    { key: 'payments',  label: 'Payments'  },
    { key: 'bills',     label: 'Recent Bills' },
  ];

  const fmt  = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const s    = summary;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" ref={printRef}>

      {/* ── Top Bar ── */}
      <div className="bg-[#0f172a] px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between print:hidden">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <h1 className="text-white font-black text-sm uppercase tracking-widest">Business Analytics</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                period === p.key
                  ? 'bg-[#D4AF37] text-white shadow-md'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {p.label}
            </button>
          ))}

          {/* Custom date */}
          {period === 'custom' && (
            <>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="bg-white/10 text-white text-[10px] rounded-xl px-3 py-1.5 border border-white/20 focus:outline-none" />
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="bg-white/10 text-white text-[10px] rounded-xl px-3 py-1.5 border border-white/20 focus:outline-none" />
            </>
          )}

          {/* Action buttons */}
          <button onClick={fetchAll} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleExportCSV} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors" title="Export CSV">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={handlePrint} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors" title="Print">
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="bg-white border-b border-slate-100 px-6 flex gap-1 overflow-x-auto print:hidden">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-3 text-[10px] font-black uppercase tracking-wider whitespace-nowrap border-b-2 transition-all ${
              activeTab === t.key
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="p-6 space-y-8 max-w-7xl mx-auto">

        {loading ? (
          <div className="flex items-center justify-center py-32 gap-3 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-[#D4AF37]" />
            <span className="font-bold text-sm">Loading analytics...</span>
          </div>
        ) : (

          <>
            {/* ══════════ OVERVIEW ══════════ */}
            {(activeTab === 'overview') && (
              <div className="space-y-8">

                {/* Summary Cards — Today / Week / Month */}
                <div>
                  <SectionHeader title="Today's Summary" icon={<Calendar className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    <MetricCard label="Today's Sales"    value={fmt(s?.today.revenue  || 0)} icon={<IndianRupee className="w-3.5 h-3.5" />} gold />
                    <MetricCard label="Bills Today"      value={s?.today.bills    || 0}      icon={<FileText     className="w-3.5 h-3.5" />} />
                    <MetricCard label="Cash Collection"  value={fmt(s?.today.cash    || 0)}  icon={<Banknote     className="w-3.5 h-3.5" />} />
                    <MetricCard label="Online Collection" value={fmt(s?.today.online   || 0)} icon={<Smartphone   className="w-3.5 h-3.5" />} />
                    <MetricCard label="Customers Today"  value={s?.today.customers || 0}    icon={<Users        className="w-3.5 h-3.5" />} />
                    <MetricCard label="Services Done"    value={s?.today.services  || 0}    icon={<Scissors     className="w-3.5 h-3.5" />} />
                  </div>
                </div>

                {/* Service Category Counts */}
                <div>
                  <SectionHeader title="Services by Category — Today" icon={<Scissors className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <MetricCard label="Hair Cuts"      value={s?.today.hairCuts      || 0} icon={<Scissors className="w-3.5 h-3.5" />} small />
                    <MetricCard label="Beard Styling"  value={s?.today.beardStyling  || 0} icon={<Star     className="w-3.5 h-3.5" />} small />
                    <MetricCard label="Hair Spa"       value={s?.today.hairSpa       || 0} icon={<Sparkles className="w-3.5 h-3.5" />} small />
                    <MetricCard label="Hair Colour"    value={s?.today.hairColour    || 0} icon={<Target   className="w-3.5 h-3.5" />} small />
                    <MetricCard label="Facial / D-Tan" value={s?.today.facial        || 0} icon={<Award    className="w-3.5 h-3.5" />} small />
                  </div>
                </div>

                {/* Weekly vs Monthly */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-3">Weekly Summary</p>
                    <div className="space-y-2 text-xs">
                      {[
                        ['Revenue',   fmt(s?.week.revenue  || 0)],
                        ['Bills',     String(s?.week.bills    || 0)],
                        ['Cash',      fmt(s?.week.cash    || 0)],
                        ['Online',    fmt(s?.week.online   || 0)],
                        ['Customers', String(s?.week.customers || 0)],
                        ['Services',  String(s?.week.services  || 0)],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                          <span className="text-slate-500 font-medium">{k}</span>
                          <span className="font-black text-slate-800">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-3">Monthly Summary</p>
                    <div className="space-y-2 text-xs">
                      {[
                        ['Revenue',   fmt(s?.month.revenue  || 0)],
                        ['Bills',     String(s?.month.bills    || 0)],
                        ['Cash',      fmt(s?.month.cash    || 0)],
                        ['Online',    fmt(s?.month.online   || 0)],
                        ['Customers', String(s?.month.customers || 0)],
                        ['Services',  String(s?.month.services  || 0)],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                          <span className="text-slate-500 font-medium">{k}</span>
                          <span className="font-black text-[#D4AF37]">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top Performers */}
                {topPerformers && (
                  <div>
                    <SectionHeader title="Top Performers" icon={<Award className="w-4 h-4" />} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Top Staff',       val: topPerformers.topStaff?.name    || 'N/A', sub: fmt(topPerformers.topStaff?.revenue  || 0) },
                        { label: 'Top Service',     val: topPerformers.topService?.name  || 'N/A', sub: `${topPerformers.topService?.count  || 0} times` },
                        { label: 'Best Sales Day',  val: topPerformers.bestDay?.date     || 'N/A', sub: fmt(topPerformers.bestDay?.revenue   || 0) },
                        { label: 'Top Customer',    val: topPerformers.topCustomer?.name || 'N/A', sub: fmt(topPerformers.topCustomer?.spent  || 0) },
                      ].map(({ label, val, sub }) => (
                        <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">{label}</p>
                          <p className="font-black text-slate-800 text-sm leading-tight truncate">{val}</p>
                          <p className="text-[10px] text-[#D4AF37] font-bold mt-1">{sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sales Charts */}
                {salesChart && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <SectionHeader title="Daily Revenue Trend" icon={<TrendingUp className="w-4 h-4" />} />
                      {salesChart.dailyData?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={salesChart.dailyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }}
                              tickFormatter={v => v.split('-').slice(1).join('/')} />
                            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => `₹${v}`} />
                            <Tooltip formatter={(v: any) => [`₹${v}`, 'Revenue']} labelStyle={{ fontSize: 10 }} contentStyle={{ fontSize: 10 }} />
                            <Line type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : <EmptyState msg="No sales data for this period" />}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <SectionHeader title="Revenue by Day (Bar)" icon={<BarChart2 className="w-4 h-4" />} />
                      {salesChart.dailyData?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={salesChart.dailyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }}
                              tickFormatter={v => v.split('-').slice(1).join('/')} />
                            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => `₹${v}`} />
                            <Tooltip formatter={(v: any) => [`₹${v}`, 'Revenue']} contentStyle={{ fontSize: 10 }} />
                            <Bar dataKey="revenue" fill={GOLD} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : <EmptyState msg="No data" />}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════ SERVICES ══════════ */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                <SectionHeader title="Service Performance Report" icon={<Scissors className="w-4 h-4" />} />

                {/* Service Revenue Chart */}
                {serviceData.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-4">Monthly Revenue by Service</p>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={serviceData.slice(0, 12)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => `₹${v}`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} width={130} />
                        <Tooltip formatter={(v: any) => [`₹${v}`, 'Revenue']} contentStyle={{ fontSize: 10 }} />
                        <Bar dataKey="monthRevenue" fill={GOLD} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Service Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left px-4 py-3 font-black text-[9px] uppercase tracking-wider text-slate-400">Service</th>
                          <th className="text-center px-3 py-3 font-black text-[9px] uppercase tracking-wider text-slate-400">Today</th>
                          <th className="text-center px-3 py-3 font-black text-[9px] uppercase tracking-wider text-slate-400">Week</th>
                          <th className="text-center px-3 py-3 font-black text-[9px] uppercase tracking-wider text-slate-400">Month</th>
                          <th className="text-right px-3 py-3 font-black text-[9px] uppercase tracking-wider text-slate-400">Today Rev.</th>
                          <th className="text-right px-3 py-3 font-black text-[9px] uppercase tracking-wider text-slate-400">Week Rev.</th>
                          <th className="text-right px-4 py-3 font-black text-[9px] uppercase tracking-wider text-slate-400">Month Rev.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceData.length === 0 ? (
                          <tr><td colSpan={7}><EmptyState msg="No service data for this period" /></td></tr>
                        ) : serviceData.map((s, i) => (
                          <tr key={s.name} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                            <td className="px-4 py-2.5 font-bold text-slate-800">{s.name}</td>
                            <td className="px-3 py-2.5 text-center font-bold text-slate-600">{s.todayCount}</td>
                            <td className="px-3 py-2.5 text-center font-bold text-slate-600">{s.weekCount}</td>
                            <td className="px-3 py-2.5 text-center font-black text-[#D4AF37]">{s.monthCount}</td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-600">₹{s.todayRevenue}</td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-600">₹{s.weekRevenue}</td>
                            <td className="px-4 py-2.5 text-right font-mono font-black text-[#D4AF37]">₹{s.monthRevenue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Most Popular Services Pie */}
                {serviceData.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <SectionHeader title="Most Popular Services" icon={<PieChartIcon className="w-4 h-4" />} />
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={serviceData.slice(0, 6)} dataKey="monthCount" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}>
                          {serviceData.slice(0, 6).map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any, name: any) => [v, name]} contentStyle={{ fontSize: 10 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* ══════════ STAFF ══════════ */}
            {activeTab === 'staff' && (
              <div className="space-y-6">
                <SectionHeader title="Staff Performance Report" icon={<Users className="w-4 h-4" />} />

                {/* Staff Bar Chart */}
                {staffData.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-4">Staff Revenue Comparison</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={staffData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => `₹${v}`} />
                        <Tooltip formatter={(v: any, k: any) => [`₹${v}`, k]} contentStyle={{ fontSize: 10 }} />
                        <Bar dataKey="revenue" name="Revenue" fill={GOLD}    radius={[4, 4, 0, 0]} />
                        <Bar dataKey="cash"    name="Cash"    fill={DARK}    radius={[4, 4, 0, 0]} />
                        <Bar dataKey="online"  name="Online"  fill="#64748b" radius={[4, 4, 0, 0]} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Staff Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['Staff', 'Bills', 'Services', 'Hair Cuts', 'Revenue', 'Cash', 'Online', 'Avg Bill'].map(h => (
                            <th key={h} className="px-4 py-3 font-black text-[9px] uppercase tracking-wider text-slate-400 text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {staffData.length === 0 ? (
                          <tr><td colSpan={8}><EmptyState msg="No staff data. Generate some bills first." /></td></tr>
                        ) : staffData.map((st, i) => (
                          <tr key={st.staffId} className={`border-b border-slate-50 hover:bg-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl flex items-center justify-center font-black text-[10px]">
                                  {st.name.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="font-bold text-slate-800">{st.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-600">{st.bills}</td>
                            <td className="px-4 py-3 font-bold text-slate-600">{st.services}</td>
                            <td className="px-4 py-3 font-bold text-slate-600">{st.hairCuts}</td>
                            <td className="px-4 py-3 font-black text-[#D4AF37] font-mono">₹{st.revenue}</td>
                            <td className="px-4 py-3 font-bold text-slate-600 font-mono">₹{st.cash}</td>
                            <td className="px-4 py-3 font-bold text-slate-600 font-mono">₹{st.online}</td>
                            <td className="px-4 py-3 font-bold text-emerald-600 font-mono">₹{st.avgBillValue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ CUSTOMERS ══════════ */}
            {activeTab === 'customers' && customerData && (
              <div className="space-y-6">
                <SectionHeader title="Customer Analytics" icon={<Users className="w-4 h-4" />} />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MetricCard label="Total Customers"     value={customerData.totalCustomers || 0}  icon={<Users className="w-3.5 h-3.5" />} gold />
                  <MetricCard label="New (This Period)"   value={customerData.newCustomers    || 0}  icon={<ArrowUpRight className="w-3.5 h-3.5" />} />
                  <MetricCard label="Returning"           value={customerData.returningCustomers || 0} icon={<RefreshCw className="w-3.5 h-3.5" />} />
                  <MetricCard label="Walk-ins"            value={customerData.walkinCustomers || 0}  icon={<Star className="w-3.5 h-3.5" />} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top by spend */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Highest Spending Customers</p>
                    </div>
                    {customerData.topBySpend?.length === 0 ? (
                      <EmptyState msg="No customer data" />
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {customerData.topBySpend?.map((c: any, i: number) => (
                          <div key={i} className="flex items-center justify-between px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black ${i === 0 ? 'bg-[#D4AF37] text-white' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                              <div>
                                <p className="font-bold text-xs text-slate-800">{c.name || 'Walk-in'}</p>
                                <p className="text-[9px] text-slate-400 font-mono">{c.phone}</p>
                              </div>
                            </div>
                            <span className="font-black text-[#D4AF37] text-xs font-mono">₹{c.spent}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Top by visits */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Most Frequent Visitors</p>
                    </div>
                    {customerData.topByVisits?.length === 0 ? (
                      <EmptyState msg="No customer data" />
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {customerData.topByVisits?.map((c: any, i: number) => (
                          <div key={i} className="flex items-center justify-between px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black ${i === 0 ? 'bg-[#D4AF37] text-white' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                              <div>
                                <p className="font-bold text-xs text-slate-800">{c.name || 'Walk-in'}</p>
                                <p className="text-[9px] text-slate-400 font-mono">{c.phone}</p>
                              </div>
                            </div>
                            <span className="font-black text-slate-800 text-xs">{c.visits} visits</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ PAYMENTS ══════════ */}
            {activeTab === 'payments' && paymentData && (
              <div className="space-y-6">
                <SectionHeader title="Payment Analysis" icon={<Banknote className="w-4 h-4" />} />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MetricCard label="Total Revenue" value={fmt(paymentData.total   || 0)} icon={<IndianRupee className="w-3.5 h-3.5" />} gold />
                  <MetricCard label="Cash"          value={fmt(paymentData.cash    || 0)} icon={<Banknote    className="w-3.5 h-3.5" />} sub={`${paymentData.cashPct}%`} />
                  <MetricCard label="UPI / QR"      value={fmt(paymentData.upi     || 0)} icon={<QrCodeIcon  className="w-3.5 h-3.5" />} sub={`${paymentData.upiPct}%`} />
                  <MetricCard label="Card"          value={fmt(paymentData.card    || 0)} icon={<Smartphone  className="w-3.5 h-3.5" />} sub={`${paymentData.cardPct}%`} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pie chart */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <SectionHeader title="Cash vs Online Split" icon={<PieChartIcon className="w-4 h-4" />} />
                    {paymentData.total === 0 ? <EmptyState msg="No payments found" /> : (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Cash',   value: paymentData.cash  || 0 },
                              { name: 'UPI',    value: paymentData.upi   || 0 },
                              { name: 'Card',   value: paymentData.card  || 0 },
                              { name: 'Other',  value: paymentData.other || 0 },
                            ].filter(d => d.value > 0)}
                            dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                          </Pie>
                          <Tooltip formatter={(v: any) => [`₹${v}`, '']} contentStyle={{ fontSize: 10 }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Payment summary table */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <SectionHeader title="Payment Breakdown" icon={<BarChart2 className="w-4 h-4" />} />
                    <div className="space-y-3">
                      {[
                        { label: 'Cash',  amount: paymentData.cash,  pct: paymentData.cashPct  },
                        { label: 'UPI / QR', amount: paymentData.upi, pct: paymentData.upiPct  },
                        { label: 'Card',  amount: paymentData.card,  pct: paymentData.cardPct  },
                        { label: 'Other', amount: paymentData.other, pct: paymentData.otherPct },
                      ].map((p, i) => (
                        <div key={p.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold text-slate-600">{p.label}</span>
                            <span className="font-black text-slate-800 font-mono">₹{p.amount || 0} <span className="text-slate-400">({p.pct || 0}%)</span></span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${p.pct || 0}%`, backgroundColor: PIE_COLORS[i] }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ RECENT BILLS ══════════ */}
            {activeTab === 'bills' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <SectionHeader title="Recent Bills" icon={<FileText className="w-4 h-4" />} />
                  <div className="flex gap-2">
                    <select
                      value={payFilter}
                      onChange={e => setPayFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="">All Payments</option>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                    </select>
                    <button onClick={handleExportCSV} className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-1.5 hover:bg-[#D4AF37]/20 transition-colors">
                      <Download className="w-3 h-3" /> Export CSV
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['Invoice No', 'Customer', 'Services', 'Staff', 'Payment', 'Amount', 'Date', 'Time'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-black text-[9px] uppercase tracking-wider text-slate-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recentBills.length === 0 ? (
                          <tr><td colSpan={8}><EmptyState msg="No bills found for this period" /></td></tr>
                        ) : recentBills.map((bill, i) => {
                          const custName = bill.customer?.name || bill.customerName || 'Walk-in';
                          const services = bill.items?.filter((it: any) => it.itemType === 'service').map((it: any) => it.name).join(', ') || '—';
                          const staffName = bill.billedBy?.name || '—';
                          const payment  = bill.payments?.map((p: any) => p.method.toUpperCase()).join(' + ') || '—';
                          const dt       = new Date(bill.createdAt);
                          return (
                            <tr key={bill._id} className={`border-b border-slate-50 hover:bg-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                              <td className="px-4 py-2.5 font-mono font-bold text-[#D4AF37]">{bill.invoiceNumber}</td>
                              <td className="px-4 py-2.5 font-bold text-slate-800">{custName}</td>
                              <td className="px-4 py-2.5 text-slate-500 max-w-[180px] truncate">{services}</td>
                              <td className="px-4 py-2.5 font-bold text-slate-600">{staffName}</td>
                              <td className="px-4 py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                  payment.includes('CASH') ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                }`}>{payment}</span>
                              </td>
                              <td className="px-4 py-2.5 font-black text-slate-800 font-mono">₹{bill.totalAmount}</td>
                              <td className="px-4 py-2.5 text-slate-500 font-mono">{dt.toLocaleDateString('en-IN')}</td>
                              <td className="px-4 py-2.5 text-slate-500 font-mono">{dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {recentBills.length > 0 && (
                    <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center">
                      <p className="text-[10px] text-slate-400 font-medium">{recentBills.length} bills shown</p>
                      <p className="text-[10px] font-black text-[#D4AF37]">Total: ₹{recentBills.reduce((a, b) => a + b.totalAmount, 0).toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@media print { .print\\:hidden { display: none !important; } }`}</style>
    </div>
  );
};

/* QR Code icon shim */
const QrCodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3z"/><path d="M17 17h4v4h-4z"/>
  </svg>
);

export default Reports;
