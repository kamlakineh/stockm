import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Profile } from '@/types';
import {
  Users,
  Store,
  Receipt,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Edit,
  X,
} from 'lucide-react';

export const OwnerMore: React.FC = () => {
  const {
    profiles,
    cashiers,
    addProfile,
    editProfile,
    settings,
    updateSettings,
    resetToDefaultData,
    exportDatabaseJSON,
    importDatabaseJSON,
    setRole,
  } = useStore();

  const userProfiles = profiles || cashiers;

  const [activeSection, setActiveSection] = useState<'CASHIERS' | 'SETTINGS' | 'RECEIPT' | 'BACKUP' | 'PROFILE'>('CASHIERS');

  // Profile modal
  const [showCashierModal, setShowCashierModal] = useState(false);
  const [editingCashier, setEditingCashier] = useState<Profile | null>(null);
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmpId, setCEmpId] = useState('');
  const [cPin, setCPin] = useState('');
  const [cRole, CRole] = useState<'OWNER' | 'CASHIER'>('CASHIER');
  const [cCanDiscount, setCCanDiscount] = useState(true);
  const [cMaxDiscount, setCMaxDiscount] = useState('15');
  const [cCanAddProducts, setCCanAddProducts] = useState(false);

  // Settings form
  const [storeName, setStoreName] = useState(settings.storeName);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [taxPercent, setTaxPercent] = useState(settings.taxPercent.toString());
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);

  // Receipt template form
  const [headerMsg, setHeaderMsg] = useState(settings.receiptHeaderMessage);
  const [footerMsg, setFooterMsg] = useState(settings.receiptFooterMessage);
  const [enableQr, setEnableQr] = useState(settings.enableQrOnReceipt);

  const openAddCashierModal = () => {
    setEditingCashier(null);
    setCName('');
    setCEmail('');
    setCPhone('');
    setCEmpId(`EMP-00${userProfiles.length + 1}`);
    setCPin('1234');
    CRole('CASHIER');
    setCCanDiscount(true);
    setCMaxDiscount('15');
    setCCanAddProducts(false);
    setShowCashierModal(true);
  };

  const openEditCashierModal = (profile: Profile) => {
    setEditingCashier(profile);
    setCName(profile.name);
    setCEmail(profile.email || '');
    setCPhone(profile.phone || '');
    setCEmpId(profile.employeeId);
    setCPin(profile.pin);
    CRole(profile.role || 'CASHIER');
    setCCanDiscount(profile.canGiveDiscount);
    setCMaxDiscount(profile.maxDiscountPercent.toString());
    setCCanAddProducts(profile.canAddProducts || false);
    setShowCashierModal(true);
  };

  const handleSaveCashier = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCashier) {
      editProfile(editingCashier.id, {
        name: cName,
        email: cEmail,
        phone: cPhone,
        pin: cPin,
        role: cRole,
        canGiveDiscount: cCanDiscount,
        maxDiscountPercent: parseInt(cMaxDiscount, 10) || 15,
        canAddProducts: cCanAddProducts,
      });
    } else {
      addProfile({
        name: cName,
        email: cEmail,
        phone: cPhone,
        employeeId: cEmpId,
        pin: cPin,
        role: cRole,
        isActive: true,
        canGiveDiscount: cCanDiscount,
        maxDiscountPercent: parseInt(cMaxDiscount, 10) || 15,
        canProcessRefund: cRole === 'OWNER',
        canAddProducts: cCanAddProducts || cRole === 'OWNER',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      });
    }
    setShowCashierModal(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      storeName,
      logoUrl,
      address,
      phone,
      email,
      taxPercent: parseFloat(taxPercent) || 0,
      currencySymbol,
    });
    alert('Store profile and general settings updated successfully!');
  };

  const handleSaveReceiptTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      receiptHeaderMessage: headerMsg,
      receiptFooterMessage: footerMsg,
      enableQrOnReceipt: enableQr,
    });
    alert('Receipt template saved successfully!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target?.result as string;
        if (content) {
          const success = importDatabaseJSON(content);
          if (success) {
            alert('Store database restored successfully!');
          } else {
            alert('Failed to parse backup JSON file.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            Store Management & App Settings
          </h2>
          <p className="text-xs text-slate-400">
            Cashiers, store profile, tax rules, receipt templates, & backups
          </p>
        </div>
      </div>

      {/* Menu Sections Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { id: 'CASHIERS', label: 'Cashier Staff', icon: Users },
          { id: 'SETTINGS', label: 'Store Profile', icon: Store },
          { id: 'RECEIPT', label: 'Receipt Template', icon: Receipt },
          { id: 'BACKUP', label: 'Backup & Restore', icon: Download },
          { id: 'PROFILE', label: 'Owner Account', icon: Shield },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: CASHIERS MANAGEMENT */}
      {activeSection === 'CASHIERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Cashier Employee Accounts</h3>
              <p className="text-xs text-slate-400">Manage cashier credentials, shift status, and permissions</p>
            </div>
            <button
              onClick={openAddCashierModal}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" /> Add Cashier
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userProfiles.map(c => (
              <div key={c.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt={c.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-100 text-sm">{c.name}</h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          c.role === 'OWNER'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}>
                          {c.role || 'CASHIER'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">ID: {c.employeeId} • PIN: ****</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Phone:</span>
                    <span className="text-slate-200">{c.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Max Discount:</span>
                    <span className="text-emerald-400 font-semibold">{c.maxDiscountPercent}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Add Product Permission:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        c.canAddProducts || c.role === 'OWNER'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700/50 text-slate-400'
                      }`}
                    >
                      {c.canAddProducts || c.role === 'OWNER' ? 'GRANTED' : 'DENIED'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditCashierModal(c)}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setRole('CASHIER');
                    }}
                    className="flex-1 py-2 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-semibold transition-all"
                  >
                    Test POS Terminal As {c.name.split(' ')[0]}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: STORE PROFILE & TAX SETTINGS */}
      {activeSection === 'SETTINGS' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto">
          <h3 className="font-bold text-slate-100 text-base mb-4">Store Details & Tax Rules</h3>
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Store Logo Image URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Tax Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={taxPercent}
                  onChange={e => setTaxPercent(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={e => setCurrencySymbol(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all mt-4"
            >
              Save Store Profile
            </button>
          </form>
        </div>
      )}

      {/* SECTION 3: RECEIPT TEMPLATE */}
      {activeSection === 'RECEIPT' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto">
          <h3 className="font-bold text-slate-100 text-base mb-4">Printable Receipt Template Editor</h3>
          <form onSubmit={handleSaveReceiptTemplate} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Header Welcome Greeting</label>
              <input
                type="text"
                value={headerMsg}
                onChange={e => setHeaderMsg(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Footer Thank You Message</label>
              <input
                type="text"
                value={footerMsg}
                onChange={e => setFooterMsg(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="qrCheck"
                checked={enableQr}
                onChange={e => setEnableQr(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <label htmlFor="qrCheck" className="text-slate-300 font-medium">
                Include Verification QR Code on printed receipt
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all mt-4"
            >
              Save Receipt Layout
            </button>
          </form>
        </div>
      )}

      {/* SECTION 4: BACKUP & RESTORE */}
      {activeSection === 'BACKUP' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto space-y-5">
          <div>
            <h3 className="font-bold text-slate-100 text-base">Store Data Backup & Restore</h3>
            <p className="text-xs text-slate-400">Export or import full JSON store snapshot</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={exportDatabaseJSON}
              className="p-4 bg-slate-800 border border-slate-700 rounded-2xl hover:bg-slate-700 flex flex-col items-center justify-center text-center gap-2"
            >
              <Download className="w-6 h-6 text-indigo-400" />
              <div>
                <span className="font-bold text-xs text-slate-100 block">Export Full JSON Backup</span>
                <span className="text-[10px] text-slate-400">Download complete database</span>
              </div>
            </button>

            <label className="p-4 bg-slate-800 border border-slate-700 rounded-2xl hover:bg-slate-700 flex flex-col items-center justify-center text-center gap-2 cursor-pointer">
              <Upload className="w-6 h-6 text-emerald-400" />
              <div>
                <span className="font-bold text-xs text-slate-100 block">Import / Restore Backup</span>
                <span className="text-[10px] text-slate-400">Upload JSON store file</span>
              </div>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                if (confirm('Reset store database to default seed state? All custom entries will be restored.')) {
                  resetToDefaultData();
                }
              }}
              className="w-full py-3 bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reset Seed Data
            </button>
          </div>
        </div>
      )}

      {/* SECTION 5: OWNER PROFILE */}
      {activeSection === 'PROFILE' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center font-bold text-xl border border-amber-500/30">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Sarah Jenkins</h3>
              <p className="text-xs text-slate-400">Store Owner & Super Administrator</p>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md font-mono mt-1 inline-block border border-amber-500/20">
                FULL OWNER PRIVILEGES
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs space-y-2">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Owner PIN Code:</span>
              <span className="font-mono font-bold">0000</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Security Role:</span>
              <span className="text-emerald-400 font-semibold">Authenticated</span>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT CASHIER MODAL */}
      {showCashierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 relative">
            <button
              onClick={() => setShowCashierModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base mb-4">
              {editingCashier ? 'Edit Cashier Account' : 'Register New Cashier Staff'}
            </h3>

            <form onSubmit={handleSaveCashier} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={cName}
                  onChange={e => setCName(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Account Role</label>
                <select
                  value={cRole}
                  onChange={e => CRole(e.target.value as 'OWNER' | 'CASHIER')}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                >
                  <option value="CASHIER">Cashier Staff</option>
                  <option value="OWNER">Store Owner</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={cEmpId}
                    onChange={e => setCEmpId(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Terminal PIN Code</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cPin}
                    onChange={e => setCPin(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center font-bold tracking-widest"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={cPhone}
                    onChange={e => setCPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Max Discount %</label>
                  <input
                    type="number"
                    value={cMaxDiscount}
                    onChange={e => setCMaxDiscount(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
              </div>

              {/* Permission: Can Add Products */}
              <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 text-xs block">Allow Adding Products to Inventory</span>
                    <span className="text-[10px] text-slate-400 block">Grants cashier permission to register new items in store inventory</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={cCanAddProducts}
                    onChange={e => setCCanAddProducts(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-700"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCashierModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  Save Cashier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerMore;
