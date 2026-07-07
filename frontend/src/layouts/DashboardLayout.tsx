import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { PrinterService } from '../services/printerService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Grid,
  FileText,
  CreditCard,
  ShoppingCart,
  Layers,
  ClipboardList,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Package,
  Users,
  Utensils,
  UserCheck,
  Smile,
  Settings as SettingsIcon,
  Crown
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [printerStatus, setPrinterStatus] = useState(PrinterService.getInstance().getStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      setPrinterStatus(PrinterService.getInstance().getStatus());
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const ezoMenuItems = [
    { name: 'Dashboard', path: '/', emoji: '🏠' },
    { name: 'New Bill', path: '/pos', emoji: '🧾' },
    { name: 'Bills History', path: '/reports', emoji: '📄' },
    { name: 'Customers', path: '/customers', emoji: '👥' },
    { name: 'Services', path: '/services', emoji: '✂️' },
    { name: 'Staff', path: '/staff', emoji: '👨‍💼' },
    { name: 'Reports', path: '/reports', emoji: '📊' },
    { name: 'Settings', path: '/settings', emoji: '⚙️' }
  ];

  const bottomNavItems = [
    { name: 'Dashboard', path: '/', emoji: '🏠' },
    { name: 'New Bill', path: '/pos', emoji: '🧾' },
    { name: 'Customers', path: '/customers', emoji: '👥' },
    { name: 'Staff', path: '/staff', emoji: '👨💼' },
    { name: 'Settings', path: '/settings', emoji: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-800 flex flex-col overflow-x-hidden">
      {/* Top Header Navbar */}
      <header className="h-14 ezo-header text-white px-4 flex items-center justify-between shadow-md shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-white/10 rounded-lg transition-all"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
          <div>
            <h2 className="font-bold text-sm tracking-wide">Super Hair Art Unisex Saloon</h2>
            <span className="text-[10px] opacity-75 font-semibold font-mono">FAST v39.14 | 9725946629</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {/* Printer status display */}
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-mono border border-white/10 font-bold max-w-[160px] md:max-w-none truncate">
            <span className={`w-2 h-2 rounded-full shrink-0 ${printerStatus.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="truncate">{printerStatus.isConnected ? `${printerStatus.printerName} (${printerStatus.paperSize})` : 'No Printer'}</span>
          </div>

          {user && (
            <span className="bg-white/10 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider text-[10px]">
              {user.role}
            </span>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleLogout}
            className="hover:bg-white/10 p-1.5 rounded-lg text-red-200 hover:text-red-100 transition-colors"
          >
            Logout
          </motion.button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex relative">
        {location.pathname !== '/pos' && (
          <>
            {/* Animated Sidebar Overlay for Mobile */}
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 z-30 md:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
            </AnimatePresence>

            {/* Sliding Sidebar Menu */}
            <aside
              className={`w-64 bg-white border-r border-slate-200 flex flex-col justify-between fixed md:sticky top-14 h-[calc(100vh-3.5rem)] z-30 transition-transform duration-300 transform ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
              } shrink-0`}
            >
              {/* Sidebar User Banner */}
              <div className="p-4 bg-[#4F46E5] text-white flex flex-col items-center gap-2">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-12 h-12 rounded-full bg-white/15 border border-white/20 flex items-center justify-center font-bold text-white uppercase text-base shadow-sm"
                >
                  {user?.name.slice(0, 2)}
                </motion.div>
                <div className="text-center overflow-hidden w-full">
                  <h4 className="text-sm font-semibold truncate">{user?.name}</h4>
                  <p className="text-[10px] opacity-75 font-mono truncate">{user?.email}</p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {ezoMenuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                        isActive
                          ? 'bg-[#4F46E5]/10 text-[#4F46E5] border-l-4 border-[#4F46E5] rounded-l-none'
                          : 'text-slate-600 hover:text-[#4F46E5] hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm">{item.emoji}</span>
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </>
        )}

        {/* Content Outlet */}
        <main className={`flex-1 min-w-0 overflow-y-auto ${
          location.pathname === '/pos' 
            ? 'p-0 pb-0 md:pb-0 bg-[#F8FAFC]' 
            : 'p-4 md:p-6 pb-20 md:pb-6 bg-[#f5f7fa]'
        }`}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation Sticky Bar */}
      {location.pathname !== '/pos' && (
        <nav className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-200 flex justify-around items-center z-40 md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className="flex flex-col items-center gap-1 text-[10px] font-bold"
              >
                <motion.div
                  whileTap={{ scale: 0.8 }}
                  className={`flex flex-col items-center gap-0.5 ${
                    isActive ? 'text-[#4F46E5]' : 'text-slate-400'
                  }`}
                >
                  <span className="text-base">{item.emoji}</span>
                  {item.name}
                </motion.div>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
};

export default DashboardLayout;
