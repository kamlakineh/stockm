import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Sale } from '../../types';
import { History, Search, Receipt, Calendar } from 'lucide-react';
import ReceiptModal from '../common/ReceiptModal';

export const CashierHistory: React.FC = () => {
  const { sales, currentCashier, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('TODAY');

  // Filter sales for this cashier
  const cashierSales = sales.filter(s => s.cashierId === currentCashier.id);

  const filteredSales = cashierSales.filter(s => {
    const matchesSearch = s.receiptNo.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesDate = true;
    const saleDate = new Date(s.createdAt);
    const now = new Date();

    if (dateFilter === 'TODAY') {
      matchesDate = saleDate.toDateString() === now.toDateString();
    } else if (dateFilter === 'WEEK') {
      matchesDate = saleDate >= new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    } else if (dateFilter === 'MONTH') {
      matchesDate = saleDate >= new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    }

    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-3 pb-16 max-w-2xl mx-auto">
      <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl">
        <h2 className="font-bold text-slate-100 text-xs sm:text-sm flex items-center gap-1.5">
          <History className="w-4 h-4 text-emerald-400" />
          My Terminal Sales History
        </h2>
        <p className="text-[10px] text-slate-400">View and reprint past sales receipts processed by you</p>
      </div>

      {/* Search & Date Filter Bar */}
      <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by receipt number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-white"
          />
        </div>

        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-[11px]">
          {(['TODAY', 'WEEK', 'MONTH', 'ALL'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDateFilter(d)}
              className={`flex-1 py-1 rounded-md font-semibold transition-all ${
                dateFilter === d ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {d === 'TODAY' ? 'Today' : d === 'WEEK' ? 'Week' : d === 'MONTH' ? 'Month' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Sales List */}
      <div className="space-y-2">
        {filteredSales.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs bg-slate-900 border border-slate-800/80 rounded-xl">
            No transaction records found for this period.
          </div>
        ) : (
          filteredSales.map(s => (
            <div
              key={s.id}
              onClick={() => setSelectedReceiptSale(s)}
              className="p-3 bg-slate-900 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl flex items-center justify-between cursor-pointer transition-all"
            >
              <div>
                <div className="font-mono font-bold text-xs text-indigo-400">{s.receiptNo}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(s.createdAt).toLocaleString()} • {s.items.length} items
                </div>
                <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-800 text-[9px] font-semibold text-slate-300 rounded">
                  {s.paymentMethod}
                </span>
              </div>

              <div className="text-right">
                <div className="font-bold text-xs sm:text-sm text-emerald-400">
                  {settings.currencySymbol}{s.totalAmount.toFixed(2)}
                </div>
                <span className="text-[9px] text-indigo-400 font-semibold flex items-center gap-1 justify-end mt-0.5">
                  <Receipt className="w-3 h-3" /> Receipt
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        sale={selectedReceiptSale}
        isOpen={!!selectedReceiptSale}
        onClose={() => setSelectedReceiptSale(null)}
      />
    </div>
  );
};

export default CashierHistory;
