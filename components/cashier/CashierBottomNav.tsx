import React from 'react';
import { useStore } from '@/context/StoreContext';
import {
  LayoutDashboard,
  ShoppingCart,
  QrCode,
  History,
  User,
} from 'lucide-react';

export const CashierBottomNav: React.FC = () => {
  const { cashierTab, setCashierTab, cart } = useStore();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const tabs = [
    { id: 0, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 1, label: 'New Sale', icon: ShoppingCart, badge: cartCount > 0 ? cartCount : null },
    { id: 2, label: 'Scanner', icon: QrCode, badge: null },
    { id: 3, label: 'History', icon: History, badge: null },
    { id: 4, label: 'Profile', icon: User, badge: null },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around text-slate-400 shadow-2xl">
      {tabs.map(t => {
        const Icon = t.icon;
        const isActive = cashierTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setCashierTab(t.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
              isActive ? 'text-emerald-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-emerald-400' : ''}`} />
              {t.badge && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-indigo-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
                  {t.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 font-medium tracking-tight">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default CashierBottomNav;
