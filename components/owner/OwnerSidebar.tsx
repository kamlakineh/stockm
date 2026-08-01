import React from 'react';
import { useStore } from '@/context/StoreContext';
import {
  LayoutDashboard,
  Package,
  Receipt,
  BarChart3,
  MoreHorizontal,
  ChevronRight,
  Shield,
  AlertTriangle,
} from 'lucide-react';

export const OwnerSidebar: React.FC = () => {
  const { ownerTab, setOwnerTab, getLowStockProducts, getOutOfStockProducts, notifications } = useStore();

  const lowStockCount = getLowStockProducts().length + getOutOfStockProducts().length;
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const tabs = [
    { id: 0, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 1, label: 'Inventory', icon: Package, badge: lowStockCount > 0 ? lowStockCount : null, badgeColor: 'bg-amber-500' },
    { id: 2, label: 'Sales Overview', icon: Receipt, badge: null },
    { id: 3, label: 'Reports & Analytics', icon: BarChart3, badge: null },
    { id: 4, label: 'More & Settings', icon: MoreHorizontal, badge: unreadNotifs > 0 ? unreadNotifs : null, badgeColor: 'bg-rose-500' },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] p-4 text-slate-300">
      <div className="space-y-6">
        {/* Role Header Badge */}
        <div className="px-3 py-2.5 bg-indigo-950/50 border border-indigo-800/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">Owner Control</span>
              <span className="text-[10px] text-indigo-300 font-medium">Desktop Side Navigation</span>
            </div>
          </div>
        </div>

        {/* Fixed 5 Navigation Tabs */}
        <nav className="space-y-1.5">
          <div className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Main Navigation (5 Tabs)
          </div>
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = ownerTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setOwnerTab(t.id)}
                className={`w-full px-3.5 py-3 rounded-xl flex items-center justify-between transition-all font-medium text-xs ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{t.label}</span>
                </div>
                {t.badge !== null ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${t.badgeColor || 'bg-indigo-500'}`}>
                    {t.badge}
                  </span>
                ) : (
                  <ChevronRight className={`w-3.5 h-3.5 opacity-40 ${isActive ? 'opacity-100 text-white' : ''}`} />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Low Stock Warning Box */}
      {lowStockCount > 0 && (
        <div className="p-3.5 bg-amber-950/40 border border-amber-800/50 rounded-2xl text-amber-200">
          <div className="flex items-center gap-2 font-semibold text-xs text-amber-400 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Stock Warning</span>
          </div>
          <p className="text-[11px] text-amber-300/80 leading-tight">
            {lowStockCount} product(s) are low or out of stock. Check Inventory tab.
          </p>
        </div>
      )}
    </aside>
  );
};

export default OwnerSidebar;
