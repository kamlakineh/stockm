import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Store,
  Bell,
  Smartphone,
  Monitor,
  UserCheck,
  Shield,
  ShoppingBag,
  RefreshCw,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import NotificationDrawer from './NotificationDrawer';

export const HeaderBar: React.FC = () => {
  const {
    role,
    settings,
    notifications,
    profiles,
    cashiers,
    currentCashier,
    isAuthenticated,
    logout,
  } = useStore();

  const ownerProfile = (profiles || cashiers || []).find(p => p.role === 'OWNER');

  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Store Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-900/30 overflow-hidden">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Store Logo" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-5 h-5" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-slate-100 flex items-center gap-2">
                {settings.storeName}
              </h1>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Store Management System v1.0
              </p>
            </div>
          </div>

          {/* Right: Controls & User Status */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifDrawer(true)}
              className="relative p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Authenticated User Badge & Logout */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                      role === 'OWNER'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {role === 'OWNER' ? <Shield className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  </div>
                  <div className="text-left hidden xs:block">
                    <div className="font-semibold leading-tight text-xs">
                      {role === 'OWNER' ? (ownerProfile?.name || 'Owner Admin') : currentCashier.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {role === 'OWNER' ? 'Owner Admin' : 'Cashier POS'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Logout from system"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Portal Login</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Drawer */}
      <NotificationDrawer isOpen={showNotifDrawer} onClose={() => setShowNotifDrawer(false)} />
    </>
  );
};

export default HeaderBar;
