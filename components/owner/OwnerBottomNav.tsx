import React from 'react';
import { useStore } from '@/context/StoreContext';
import {
  LayoutDashboard,
  Package,
  Receipt,
  BarChart3,
  MoreHorizontal,
} from 'lucide-react';

export const OwnerBottomNav: React.FC = () => {
  const { ownerTab, setOwnerTab, getLowStockProducts, getOutOfStockProducts, notifications } = useStore();

  const lowStockCount = getLowStockProducts().length + getOutOfStockProducts().length;
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const tabs = [
    { id: 0, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 1, label: 'Inventory', icon: Package, badge: lowStockCount > 0 ? lowStockCount : null },
    { id: 2, label: 'Sales', icon: Receipt, badge: null },
    { id: 3, label: 'Reports', icon: BarChart3, badge: null },
    { id: 4, label: 'More', icon: MoreHorizontal, badge: unreadNotifs > 0 ? unreadNotifs : null },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around text-slate-400 shadow-2xl">
      {tabs.map(t => {
        const Icon = t.icon;
        const isActive = ownerTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setOwnerTab(t.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
              isActive ? 'text-indigo-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-indigo-400' : ''}`} />
              {t.badge && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center">
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

export default OwnerBottomNav;
