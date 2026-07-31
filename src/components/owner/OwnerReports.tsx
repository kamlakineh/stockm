import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  Users,
  Download,
  Calendar,
  FileSpreadsheet,
  Award,
  Clock,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import ExportModal from '../common/ExportModal';

export const OwnerReports: React.FC = () => {
  const { sales, products, cashiers, categories, settings } = useStore();
  const [reportCategory, setReportCategory] = useState<'FINANCE' | 'INVENTORY' | 'CASHIER' | 'TAX'>('FINANCE');
  const [dateRangePreset, setDateRangePreset] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [showExportModal, setShowExportModal] = useState(false);

  // Financial Calculations
  const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalCost = sales.reduce((acc, s) => acc + s.costAmount, 0);
  const totalGrossProfit = totalRevenue - totalCost;
  const estimatedOperatingExpenses = totalRevenue * 0.15; // 15% overhead estimate
  const totalNetProfit = Math.max(0, totalGrossProfit - estimatedOperatingExpenses);
  const totalTaxCollected = sales.reduce((acc, s) => acc + s.taxAmount, 0);
  const avgSaleValue = sales.length > 0 ? totalRevenue / sales.length : 0;

  // Category breakdown
  const categoryRevenueMap: Record<string, number> = {};
  sales.forEach(s => {
    s.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const catName = prod ? prod.categoryName : 'General';
      categoryRevenueMap[catName] = (categoryRevenueMap[catName] || 0) + item.subtotal;
    });
  });

  const categoryChartList = Object.entries(categoryRevenueMap).map(([name, val]) => ({ name, val }));

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-3 sm:p-4 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-1.5">
            Reports & Business Analytics
          </h2>
          <p className="text-[10px] text-slate-400">
            Financial statements, profit margins, tax logs, & cashier efficiency charts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Presets */}
          <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700/80 flex items-center text-[10px] sm:text-xs font-semibold">
            {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const).map(p => (
              <button
                key={p}
                onClick={() => setDateRangePreset(p)}
                className={`px-2 py-1 rounded transition-all ${
                  dateRangePreset === p ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-[11px] flex items-center gap-1 shadow-md shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Report Type Category Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { id: 'FINANCE', label: 'Financial & Profit', icon: DollarSign },
          { id: 'INVENTORY', label: 'Stock Valuation', icon: ShoppingBag },
          { id: 'CASHIER', label: 'Cashier Performance', icon: Users },
          { id: 'TAX', label: 'Tax & Compliance', icon: FileSpreadsheet },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = reportCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportCategory(tab.id as any)}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-xs font-bold ${
                isActive
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* FINANCE & PROFIT REPORT VIEW */}
      {reportCategory === 'FINANCE' && (
        <div className="space-y-4">
          {/* Summary Financial Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Gross Revenue</span>
              <div className="text-base sm:text-lg font-bold text-white">
                {totalRevenue.toFixed(2)} {settings.currencySymbol}
              </div>
              <span className="text-[9px] text-emerald-400 mt-0.5 block">100% turnover</span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Cost of Goods Sold</span>
              <div className="text-base sm:text-lg font-bold text-slate-300">
                {totalCost.toFixed(2)} {settings.currencySymbol}
              </div>
              <span className="text-[9px] text-slate-400 mt-0.5 block">Wholesale cost</span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Gross Profit Margin</span>
              <div className="text-base sm:text-lg font-bold text-emerald-400">
                {totalGrossProfit.toFixed(2)} {settings.currencySymbol}
              </div>
              <span className="text-[9px] text-emerald-400 mt-0.5 block">
                {((totalGrossProfit / (totalRevenue || 1)) * 100).toFixed(1)}% Gross Margin
              </span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Net Profit Estimate</span>
              <div className="text-base sm:text-lg font-bold text-indigo-400">
                {totalNetProfit.toFixed(2)} {settings.currencySymbol}
              </div>
              <span className="text-[9px] text-slate-400 mt-0.5 block">After overhead</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Revenue Breakdown Chart */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
              <h3 className="font-bold text-sm text-slate-100 mb-1">Revenue by Product Category</h3>
              <p className="text-xs text-slate-400 mb-4">Category sales share breakdown</p>

              <div className="space-y-3">
                {categoryChartList.map((cat, idx) => {
                  const percent = (cat.val / (totalRevenue || 1)) * 100;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{cat.name}</span>
                        <span className="text-emerald-400">{cat.val.toFixed(2)} {settings.currencySymbol} ({percent.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className="bg-indigo-600 h-full rounded-full"
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Peak Selling Hours Chart */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
              <h3 className="font-bold text-sm text-slate-100 mb-1">Peak POS Selling Hours</h3>
              <p className="text-xs text-slate-400 mb-4">Store foot traffic and sales volume by hour</p>

              <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-800">
                {[
                  { hour: '8am', val: 20 },
                  { hour: '10am', val: 65 },
                  { hour: '12pm', val: 95 },
                  { hour: '2pm', val: 80 },
                  { hour: '4pm', val: 120 },
                  { hour: '6pm', val: 150 },
                  { hour: '8pm', val: 90 },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      style={{ height: `${(item.val / 160) * 100}%` }}
                      className="w-full bg-emerald-500 rounded-t-md hover:bg-emerald-400 transition-all"
                    ></div>
                    <span className="text-[10px] text-slate-500 font-medium mt-1">{item.hour}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CASHIER PERFORMANCE REPORT VIEW */}
      {reportCategory === 'CASHIER' && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="font-bold text-slate-100 text-sm">Cashier Staff Efficiency & Sales Comparison</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cashiers.map(c => {
              const cashierSales = sales.filter(s => s.cashierId === c.id);
              const cashierRev = cashierSales.reduce((acc, s) => acc + s.totalAmount, 0);

              return (
                <div key={c.id} className="p-4 bg-slate-800/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt={c.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{c.name}</h4>
                      <span className="text-xs text-slate-400">ID: {c.employeeId}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-700/60">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Sales Processed</span>
                      <span className="font-bold text-white text-base">{cashierSales.length} orders</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Revenue Generated</span>
                      <span className="font-bold text-emerald-400 text-base">
                        {cashierRev.toFixed(2)} {settings.currencySymbol}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAX REPORT VIEW */}
      {reportCategory === 'TAX' && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Tax Collected Compliance Ledger</h3>
              <p className="text-xs text-slate-400">Configured Tax Rate: {settings.taxPercent}%</p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl font-bold text-lg">
              Total Tax: {totalTaxCollected.toFixed(2)} {settings.currencySymbol}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">Receipt No</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Subtotal</th>
                  <th className="py-2.5 px-3">Tax ({settings.taxPercent}%)</th>
                  <th className="py-2.5 px-3">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {sales.map(s => (
                  <tr key={s.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-400">{s.receiptNo}</td>
                    <td className="py-2.5 px-3 text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3">{s.subtotal.toFixed(2)} {settings.currencySymbol}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-400">{s.taxAmount.toFixed(2)} {settings.currencySymbol}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">{s.totalAmount.toFixed(2)} {settings.currencySymbol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultReportType="SALES"
      />
    </div>
  );
};

export default OwnerReports;
