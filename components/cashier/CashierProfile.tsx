import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Shield, Key } from 'lucide-react';

export const CashierProfile: React.FC = () => {
  const { currentCashier, settings, setRole, editCashier } = useStore();

  const [showPinModal, setShowPinModal] = useState(false);
  const [showSwitchOwnerModal, setShowSwitchOwnerModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [ownerPinInput, setOwnerPinInput] = useState('');

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      alert('PIN must be 4 digits.');
      return;
    }
    editCashier(currentCashier.id, { pin: newPin });
    alert('Terminal PIN updated successfully!');
    setShowPinModal(false);
    setNewPin('');
  };

  const handleSwitchToOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerPinInput === settings.ownerPin) {
      setRole('OWNER');
    } else {
      alert('Incorrect Owner PIN. Default PIN is 0000.');
    }
  };

  return (
    <div className="space-y-3 pb-16 max-w-md mx-auto">
      {/* Profile Card Header */}
      <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl text-center space-y-2">
        <div className="relative inline-block">
          <img
            src={currentCashier.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
            alt={currentCashier.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/30 mx-auto"
          />
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
        </div>

        <div>
          <h2 className="font-extrabold text-slate-100 text-sm sm:text-base">{currentCashier.name}</h2>
          <p className="text-[11px] text-slate-400">Terminal Cashier Operator</p>
          <span className="mt-1.5 inline-block px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold rounded-md">
            EMP ID: {currentCashier.employeeId}
          </span>
        </div>
      </div>

      {/* Permissions & Shift Info */}
      <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl space-y-2 text-[11px]">
        <h3 className="font-bold text-slate-200">Terminal Permissions & Limits</h3>
        <div className="p-2.5 bg-slate-800/60 rounded-lg space-y-1.5 text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Max POS Discount Allowed:</span>
            <span className="font-bold text-emerald-400">{currentCashier.maxDiscountPercent}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Refund Approval Required:</span>
            <span className="font-bold text-rose-400">Yes (Owner Only)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Inventory Price Edit:</span>
            <span className="font-bold text-amber-400">Restricted</span>
          </div>
        </div>
      </div>

      {/* Account Security Actions */}
      <div className="space-y-2 text-xs">
        <button
          onClick={() => setShowPinModal(true)}
          className="w-full p-2.5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl flex items-center justify-between font-semibold text-slate-200 transition-all"
        >
          <div className="flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span>Change Terminal PIN</span>
          </div>
          <span className="text-slate-500 text-[10px]">**** →</span>
        </button>

        <button
          onClick={() => setShowSwitchOwnerModal(true)}
          className="w-full p-2.5 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/40 rounded-xl flex items-center justify-between font-semibold text-amber-300 transition-all"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Switch to Owner App View</span>
          </div>
          <span className="text-amber-400 text-[10px]">PIN Required →</span>
        </button>
      </div>

      {/* PIN Change Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xs w-full p-6 text-slate-100 relative">
            <h3 className="font-bold text-base mb-3">Set New 4-Digit PIN</h3>
            <form onSubmit={handleChangePin} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                placeholder="4-digit PIN e.g. 5678"
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-center font-mono text-lg font-bold text-white tracking-widest"
                required
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs">
                  Update PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Switch to Owner Modal */}
      {showSwitchOwnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xs w-full p-6 text-slate-100 relative">
            <h3 className="font-bold text-base mb-2">Owner Mode Access</h3>
            <p className="text-xs text-slate-400 mb-4">Enter Owner Security PIN (Default: 0000)</p>
            <form onSubmit={handleSwitchToOwner} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                placeholder="0000"
                value={ownerPinInput}
                onChange={e => setOwnerPinInput(e.target.value)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-center font-mono text-lg font-bold text-white tracking-widest"
                required
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSwitchOwnerModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs">
                  Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierProfile;
