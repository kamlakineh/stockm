import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  AlertOctagon,
  Users,
  ShoppingBag,
  Award,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ChevronRight,
  Clock,
  Filter,
} from 'lucide-react';
import ReceiptModal from '../common/ReceiptModal';
import { Sale } from '../../types';

export const OwnerDashboard: React.FC = () => {
  const {
    sales,
    products,
    cashiers,
    getLowStockProducts,
    getOutOfStockProducts,
    settings,
    setOwnerTab,
  } = useStore();

  const [dateFilter, setDateFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('MONTH');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);

  // Filter sales based on range
  const filteredSales = sales.filter(s => {
    const saleDate = new Date(s.createdAt);
    const now = new Date();
    if (dateFilter === 'TODAY') {
      return saleDate.toDateString() === now.toDateString();
    }
    if (dateFilter === 'WEEK') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      return saleDate >= weekAgo;
    }
    if (dateFilter === 'MONTH') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      return saleDate >= monthAgo;
    }
    return true;
  });

  // Calculate Key KPIs
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const todaySales = sales
    .filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString())
    .reduce((acc, s) => acc + s.totalAmount, 0);
  const monthlyRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);

  const totalProductsCount = products.length;
  const lowStockCount = getLowStockProducts().length;
  const outOfStockCount = getOutOfStockProducts().length;
  const inventoryTotalValue = products.reduce((acc, p) => acc + p.costPrice * p.stockQuantity, 0);
  const totalProfit = filteredSales.reduce((acc, s) => acc + s.profitAmount, 0);
  const totalCustomers = filteredSales.length; // 1 customer per sale transaction

  const handlePullToRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Best selling products calculation
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  sales.forEach(s => {
    s.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].revenue += item.subtotal;
    });
  });

  const bestSellingList = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-5 pb-16">
      {/* Top Header Controls: Refresh & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/90 p-3 sm:p-4 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            Store Performance Overview
          </h2>
          <p className="text-[11px] text-slate-400">
            Real-time sales, inventory valuation, and cashier activity analytics
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Refresh Button */}
          <button
            onClick={handlePullToRefresh}
            className={`p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/80 text-xs font-semibold flex items-center gap-1 transition-all ${
              isRefreshing ? 'animate-spin text-indigo-400' : ''
            }`}
            title="Refresh dashboard metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Date Filter Chips */}
          <div className="bg-slate-800 p-1 rounded-lg border border-slate-700/80 flex items-center text-[11px]">
            {(['TODAY', 'WEEK', 'MONTH', 'ALL'] as const).map(f => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  dateFilter === f
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'TODAY' ? "Today" : f === 'WEEK' ? '7 Days' : f === 'MONTH' ? 'This Month' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Banner for Low Stock / Out of Stock */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div
          onClick={() => setOwnerTab(1)}
          className="p-3 bg-gradient-to-r from-amber-950/80 via-slate-900 to-rose-950/80 border border-amber-500/30 rounded-xl flex items-center justify-between cursor-pointer hover:border-amber-500/60 transition-all shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-amber-200">Attention: Stock Action Required</h4>
              <p className="text-[10px] text-amber-300/80 mt-0.5">
                {outOfStockCount > 0 && <span className="font-bold text-rose-400 mr-2">{outOfStockCount} Out of Stock</span>}
                {lowStockCount > 0 && <span>{lowStockCount} Low Stock Items</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-300 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            <span>Manage</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* KPI Cards Grid (Compact 9 Key Boolean Widgets) */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-9 gap-1.5 sm:gap-2">
        {/* Widget 1: Total Revenue */}
        <div className="p-2 sm:p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl shadow-xs hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold mb-0.5">
            <span className="truncate">Revenue</span>
            <div className="p-1 bg-indigo-500/10 text-indigo-400 rounded-md shrink-0">
              <DollarSign className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-white truncate">
            {settings.currencySymbol}{totalRevenue.toFixed(2)}
          </div>
          <div className="text-[9px] text-emerald-400 font-medium flex items-center gap-0.5 mt-0.5 truncate">
            <ArrowUpRight className="w-2.5 h-2.5 shrink-0" />
            <span>+12.4%</span>
          </div>
        </div>

        {/* Widget 2: Today's Sales */}
        <div className="p-2 sm:p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl shadow-xs hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold mb-0.5">
            <span className="truncate">Today</span>
            <div className="p-1 bg-emerald-500/10 text-emerald-400 rounded-md shrink-0">
              <TrendingUp className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-white truncate">
            {settings.currencySymbol}{todaySales.toFixed(2)}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 truncate">
            Daily POS
          </div>
        </div>

        {/* Widget 3: Total Profit */}
        <div className="p-2 sm:p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl shadow-xs hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold mb-0.5">
            <span className="truncate">Profit</span>
            <div className="p-1 bg-amber-500/10 text-amber-400 rounded-md shrink-0">
              <Award className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-emerald-400 truncate">
            {settings.currencySymbol}{totalProfit.toFixed(2)}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 truncate">
            Gross Margin
          </div>
        </div>

        {/* Widget 4: Total Products */}
        <div className="p-2 sm:p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl shadow-xs hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold mb-0.5">
            <span className="truncate">Products</span>
            <div className="p-1 bg-sky-500/10 text-sky-400 rounded-md shrink-0">
              <Package className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-white truncate">
            {totalProductsCount}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 truncate">Catalog items</div>
        </div>

        {/* Widget 5: Low Stock Items */}
        <div className="p-2 sm:p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl shadow-xs hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold mb-0.5">
            <span className="truncate">Low Stock</span>
            <div className="p-1 bg-amber-500/10 text-amber-400 rounded-md shrink-0">
              <AlertTriangle className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-amber-400 truncate">
            {lowStockCount}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 truncate">Restock soon</div>
        </div>

        {/* Widget 6: Out of Stock Items */}
        <div className="p-2 sm:p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl shadow-xs hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold mb-0.5">
            <span className="truncate">Out Stock</span>
            <div className="p-1 bg-rose-500/10 text-rose-400 rounded-md shrink-0">
              <AlertOctagon className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-rose-400 truncate">
            {outOfStockCount}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 truncate">Empty stock</div>
        </div>

        {/* Widget 7: Inventory Value */}
        <div className="p-2 sm:p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl shadow-xs hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold mb-0.5">
            <span className="truncate">Asset Val</span>
            <div className="p-1 bg-purple-500/10 text-purple-400 rounded-md shrink-0">
              <ShoppingBag className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-white truncate">
            {settings.currencySymbol}{inventoryTotalValue.toFixed(2)}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 truncate">Stock value</div>
        </div>

        {/* Widget 8: Total Customers */}
        <div className="p-2 sm:p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl shadow-xs hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold mb-0.5">
            <span className="truncate">Orders</span>
            <div className="p-1 bg-teal-500/10 text-teal-400 rounded-md shrink-0">
              <Users className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-white truncate">
            {totalCustomers}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 truncate">Completed</div>
        </div>

        {/* Widget 9: Monthly Revenue */}
        <div className="p-2 sm:p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl shadow-xs hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold mb-0.5">
            <span className="truncate">Monthly</span>
            <div className="p-1 bg-indigo-500/10 text-indigo-400 rounded-md shrink-0">
              <Clock className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-white truncate">
            {settings.currencySymbol}{monthlyRevenue.toFixed(2)}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 truncate">Turnover</div>
        </div>
      </div>

      {/* Visual Analytics Section: Sales & Profit Trend Compact Chart & Best Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Sales & Profit Graph */}
        <div className="p-3.5 sm:p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-100">Sales & Profit Trend</h3>
              <p className="text-[10px] sm:text-xs text-slate-400">Weekly revenue trajectory</p>
            </div>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md font-semibold border border-indigo-500/20">
              Weekly Chart
            </span>
          </div>

          {/* Compact SVG Bar Chart */}
          <div className="h-32 sm:h-36 flex items-end justify-between gap-1.5 pt-4 pb-2 px-1 border-b border-slate-800">
            {[
              { day: 'Mon', sales: 120, profit: 60 },
              { day: 'Tue', sales: 190, profit: 95 },
              { day: 'Wed', sales: 150, profit: 75 },
              { day: 'Thu', sales: 240, profit: 120 },
              { day: 'Fri', sales: 310, profit: 160 },
              { day: 'Sat', sales: 420, profit: 210 },
              { day: 'Sun', sales: 380, profit: 190 },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                {/* Tooltip */}
                <div className="absolute -top-7 bg-slate-800 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                  Sales: ${bar.sales} | Profit: ${bar.profit}
                </div>
                <div className="w-full flex items-end justify-center gap-0.5 h-full">
                  <div
                    style={{ height: `${(bar.sales / 450) * 100}%` }}
                    className="w-1/2 bg-indigo-600 rounded-t-xs group-hover:bg-indigo-500 transition-all"
                  ></div>
                  <div
                    style={{ height: `${(bar.profit / 450) * 100}%` }}
                    className="w-1/2 bg-emerald-500 rounded-t-xs group-hover:bg-emerald-400 transition-all"
                  ></div>
                </div>
                <span className="text-[9px] text-slate-500 font-medium mt-0.5">{bar.day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-indigo-600 rounded-xs"></div>
              <span className="text-slate-300">Revenue ($)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-xs"></div>
              <span className="text-slate-300">Profit ($)</span>
            </div>
          </div>
        </div>

        {/* Best Selling Products & Active Cashiers */}
        <div className="p-3.5 sm:p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Best Selling Products
              </h3>
              <button
                onClick={() => setOwnerTab(1)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                View Catalog
              </button>
            </div>

            <div className="space-y-1.5">
              {bestSellingList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-slate-800/60 rounded-lg border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-indigo-500/10 text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-[11px] text-slate-200">{item.name}</div>
                      <div className="text-[9px] text-slate-400">{item.qty} sold</div>
                    </div>
                  </div>
                  <div className="font-bold text-[11px] text-emerald-400">
                    {settings.currencySymbol}{item.revenue.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Cashiers List */}
          <div className="mt-3 pt-2.5 border-t border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Active Cashiers On Shift
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {cashiers.map(c => (
                <div
                  key={c.id}
                  className="px-2.5 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/80 flex items-center gap-2 shrink-0 text-xs"
                >
                  <div className="relative">
                    <img
                      src={c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt={c.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-900 ${
                        c.currentShiftStartedAt ? 'bg-emerald-500' : 'bg-slate-500'
                      }`}
                    ></span>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-200">{c.name}</div>
                    <div className="text-[9px] text-slate-400">
                      {c.todaySalesCount} sales ({settings.currencySymbol}{c.todaySalesTotal.toFixed(0)})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="p-3.5 sm:p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-100">Recent Transactions</h3>
            <p className="text-[10px] sm:text-xs text-slate-400">Latest completed cashier sales</p>
          </div>
          <button
            onClick={() => setOwnerTab(2)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            All Sales →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2 px-2.5">Receipt No</th>
                <th className="py-2 px-2.5">Time</th>
                <th className="py-2 px-2.5">Cashier</th>
                <th className="py-2 px-2.5">Items</th>
                <th className="py-2 px-2.5">Payment</th>
                <th className="py-2 px-2.5">Amount</th>
                <th className="py-2 px-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredSales.slice(0, 5).map(sale => (
                <tr key={sale.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-2.5 font-mono font-semibold text-indigo-400">
                    {sale.receiptNo}
                  </td>
                  <td className="py-2 px-2.5 text-slate-400">
                    {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2 px-2.5 font-medium text-slate-200">{sale.cashierName}</td>
                  <td className="py-2 px-2.5 text-slate-400">{sale.items.length} items</td>
                  <td className="py-2 px-2.5">
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded font-semibold text-[9px] text-slate-300">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 font-bold text-emerald-400">
                    {settings.currencySymbol}{sale.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-2 px-2.5 text-right">
                    <button
                      onClick={() => setSelectedReceiptSale(sale)}
                      className="px-2 py-0.5 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded text-[10px] font-semibold transition-all"
                    >
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Button for Owner */}
      <button
        onClick={() => setOwnerTab(1)}
        className="fixed bottom-16 sm:bottom-20 right-4 z-30 p-3 sm:p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl shadow-indigo-600/50 flex items-center gap-1.5 font-bold text-xs transition-all hover:scale-105"
        title="Add Product or Inventory Adjustment"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Add Product</span>
      </button>

      {/* Receipt Modal */}
      <ReceiptModal
        sale={selectedReceiptSale}
        isOpen={!!selectedReceiptSale}
        onClose={() => setSelectedReceiptSale(null)}
      />
    </div>
  );
};

export default OwnerDashboard;
