import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Sale } from '../../types';
import {
  DollarSign,
  Users,
  Clock,
  ShoppingCart,
  Receipt,
  UserCheck,
  ChevronRight,
  Sparkles,
  Plus,
  PackagePlus,
} from 'lucide-react';
import ReceiptModal from '../common/ReceiptModal';
import AddProductModal from '../common/AddProductModal';

export const CashierDashboard: React.FC = () => {
  const { currentCashier, sales, settings, setCashierTab, role } = useStore();
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Check permission to add product (granted by owner or owner role)
  const canAddProducts = currentCashier?.canAddProducts || role === 'OWNER';

  // Filter sales processed by this cashier today
  const todaySales = sales.filter(s => {
    const isToday = new Date(s.createdAt).toDateString() === new Date().toDateString();
    return s.cashierId === currentCashier.id && isToday;
  });

  const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const customerCount = todaySales.length;

  return (
    <div className="space-y-3.5 pb-16">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Widget 1: Today's Sales */}
        <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold mb-1">
            <span>Today's Total</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-emerald-400">
            {settings.currencySymbol}{todayRevenue.toFixed(2)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Processed today</p>
        </div>

        {/* Widget 2: Customers Served */}
        <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold mb-1">
            <span>Customers Served</span>
            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-white">{customerCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Receipts generated</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          onClick={() => setCashierTab(1)}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs sm:text-sm font-bold leading-none">START NEW POS SALE</div>
              <div className="text-[10px] text-emerald-100 mt-0.5">Scan products or browse store catalog</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white" />
        </button>

        {canAddProducts && (
          <button
            onClick={() => setShowAddProductModal(true)}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <PackagePlus className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-bold leading-none">ADD NEW PRODUCT</div>
                <div className="text-[10px] text-indigo-100 mt-0.5">Owner Granted Permission • Register Item</div>
              </div>
            </div>
            <Plus className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Recent Transactions List */}
      <div className="p-3.5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-100">My Recent POS Sales</h3>
            <p className="text-[10px] text-slate-400">Completed checkout transactions</p>
          </div>
          <button
            onClick={() => setCashierTab(3)}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            Full History →
          </button>
        </div>

        <div className="space-y-2">
          {todaySales.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              No sales completed yet on this shift. Click "Start New Sale" above.
            </div>
          ) : (
            todaySales.slice(0, 5).map(sale => (
              <div
                key={sale.id}
                onClick={() => setSelectedReceiptSale(sale)}
                className="p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-800 rounded-lg flex items-center justify-between cursor-pointer transition-all"
              >
                <div>
                  <div className="font-mono text-[11px] font-bold text-indigo-400">{sale.receiptNo}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {sale.items.length} items ({sale.paymentMethod})
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xs text-emerald-400">
                    {settings.currencySymbol}{sale.totalAmount.toFixed(2)}
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium">Receipt</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        sale={selectedReceiptSale}
        isOpen={!!selectedReceiptSale}
        onClose={() => setSelectedReceiptSale(null)}
      />

      {/* Add Product Modal (if cashier has permission) */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
      />
    </div>
  );
};

export default CashierDashboard;
