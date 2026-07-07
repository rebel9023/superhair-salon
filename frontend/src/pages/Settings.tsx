import React, { useState, useEffect } from 'react';
import { Save, Info, Shield, HelpCircle, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { PrinterService } from '../services/printerService';
import type { PrinterSettings } from '../services/printerService';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'printer'>('profile');

  // Salon Profile State
  const [salonName, setSalonName] = useState('Super Hair Art Unisex Saloon');
  const [phone, setPhone] = useState('+91 9725946629');
  const [email, setEmail] = useState('contact@superartsalon.com');
  const [prefix, setPrefix] = useState('INV-');

  // Printer Settings State
  const printerService = PrinterService.getInstance();
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(printerService.getSettings());
  const [printerStatus, setPrinterStatus] = useState(printerService.getStatus());
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setPrinterStatus(printerService.getStatus());
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Salon profile configurations saved successfully!');
  };

  const handleSavePrinterSettings = (e: React.FormEvent) => {
    e.preventDefault();
    printerService.saveSettings(printerSettings);
    alert('Printer configurations updated successfully!');
  };

  const handleConnectBluetooth = async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      const name = await printerService.connectBluetooth();
      alert(`Connected successfully to: ${name}`);
    } catch (err: any) {
      setConnectError(err.message || 'Failed to scan or connect Bluetooth device.');
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectUSB = async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      const name = await printerService.connectUSB();
      alert(`Connected successfully to: ${name}`);
    } catch (err: any) {
      setConnectError(err.message || 'Failed to scan or connect USB device.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectPrinter = async () => {
    await printerService.disconnect();
    alert('Printer disconnected.');
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">System Configurations</h2>
        <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase">Salon Parameters & Billing Templates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation Tabs */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1 h-fit">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'profile'
                ? 'bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/15'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Salon Profile
          </button>
          <button
            onClick={() => setActiveTab('printer')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'printer'
                ? 'bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/15'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            EZO Thermal Printer
          </button>
        </div>

        {/* Tab 1: Salon Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 space-y-5">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
                General Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Salon Name</label>
                  <input
                    type="text"
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 font-bold focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Contact Hotline</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Business Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#4F46E5] hover:bg-[#303f9f] text-white font-bold rounded-xl py-2.5 px-6 text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-[#4F46E5]/15"
              >
                Save Profile
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: EZO Printer */}
        {activeTab === 'printer' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 space-y-6">
            {/* Status overview */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">Connection Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${printerStatus.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <h4 className="text-xs font-black text-slate-800">
                    {printerStatus.isConnected ? `${printerStatus.printerName} (🟢 Connected)` : 'Disconnected'}
                  </h4>
                </div>
              </div>

              {printerStatus.isConnected && (
                <button
                  onClick={handleDisconnectPrinter}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              )}
            </div>

            {/* Scan triggers */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Connect Printer</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleConnectBluetooth}
                  disabled={connecting}
                  className="flex items-center justify-center gap-2 bg-[#4F46E5] hover:bg-[#303f9f] text-white py-3 rounded-xl text-xs font-bold shadow-md shadow-[#4F46E5]/10 disabled:opacity-50"
                >
                  <Smartphone className="w-4 h-4" />
                  Scan Bluetooth
                </button>

                <button
                  onClick={handleConnectUSB}
                  disabled={connecting}
                  className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 py-3 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  <Monitor className="w-4 h-4" />
                  Scan USB / Serial
                </button>
              </div>

              {connectError && (
                <p className="text-[10px] text-red-600 font-semibold font-mono">{connectError}</p>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* Config parameters form */}
            <form onSubmit={handleSavePrinterSettings} className="space-y-4">
              <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Printer Configurations</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Paper Size</label>
                  <select
                    value={printerSettings.paperSize}
                    onChange={(e) => setPrinterSettings({ ...printerSettings, paperSize: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 text-slate-700 font-bold focus:outline-none"
                  >
                    <option value="58mm">58mm (Receipt)</option>
                    <option value="80mm">80mm (Wide)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Auto Print Receipt</label>
                  <select
                    value={printerSettings.autoPrint ? 'on' : 'off'}
                    onChange={(e) => setPrinterSettings({ ...printerSettings, autoPrint: e.target.value === 'on' })}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 text-slate-700 font-bold focus:outline-none"
                  >
                    <option value="on">Enabled (Auto)</option>
                    <option value="off">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Number of Copies</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={printerSettings.copies}
                    onChange={(e) => setPrinterSettings({ ...printerSettings, copies: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Paper Cutting</label>
                  <select
                    value={printerSettings.cutPaper ? 'on' : 'off'}
                    onChange={(e) => setPrinterSettings({ ...printerSettings, cutPaper: e.target.value === 'on' })}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 text-slate-700 font-bold focus:outline-none"
                  >
                    <option value="on">Cut after print</option>
                    <option value="off">No cut</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#4F46E5] hover:bg-[#303f9f] text-white font-bold rounded-xl py-2.5 px-6 text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-[#4F46E5]/15"
              >
                Save Configurations
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
