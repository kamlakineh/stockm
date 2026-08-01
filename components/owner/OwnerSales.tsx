import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Sale } from '@/types';
import {
  Search,
  Download,
  RotateCcw,
  Clock,
  X,
} from 'lucide-react';
import ReceiptModal from '../common/ReceiptModal';
import ExportModal from '../common/ExportModal';

export const OwnerSales: React.FC = () => {
  const { sales, heldSales, cashiers, settings, processRefund, deleteHeldSale } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [cashierFilter, setCashierFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'REFUNDED'>('ALL');

  // Modals
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);
  const [refundTargetSale, setRefundTargetSale] = useState<Sale | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundRestock, setRefundRestock] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  // Active sub tab: All Sales vs Held Sales
  const [activeTab, setActiveTab] = useState<'ALL_SALES' | 'HELD_SALES'>('ALL_SALES');

  // Filter Sales
  const filteredSales = sales.filter(s => {
    const matchesSearch = s.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) || s.cashierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCashier = cashierFilter === 'ALL' || s.cashierId === cashierFilter;
    const matchesPayment = paymentFilter === 'ALL' || s.paymentMethod === paymentFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

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

    return matchesSearch && matchesCashier && matchesPayment && matchesStatus && matchesDate;
  });

  const handleConfirmRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTargetSale) return;
    processRefund(refundTargetSale.id, refundReason || 'Owner approved refund', refundRestock);
    setRefundTargetSale(null);
    setRefundReason('');
    alert('Refund processed successfully and inventory updated.');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            Sales & Transaction Audit
          </h2>
          <p className="text-xs text-slate-400">
            Cross-cashier transaction logs, refund approvals, held sales, & exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub Tab Switcher */}
          <div className="bg-slate-800 p-1 rounded-xl border border-slate-700/80 flex items-center text-xs font-semibold">
            <button
              onClick={() => setActiveTab('ALL_SALES')}
              className={`px-3 py-2 rounded-lg transition-all ${
                activeTab === 'ALL_SALES' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Completed Sales ({sales.length})
            </button>
            <button
              onClick={() => setActiveTab('HELD_SALES')}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'HELD_SALES' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Held Sales ({heldSales.length})
            </button>
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
          >
            <Download className="w-4 h-4" />
            Export Log
          </button>
        </div>
      </div>

      {activeTab === 'ALL_SALES' && (
        <div className="space-y-4">
          {/* Filters Row */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by receipt number e.g. REC-2026..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <select
              value={cashierFilter}
              onChange={e => setCashierFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl focus:outline-none"
            >
              <option value="ALL">All Cashiers</option>
              {cashiers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl focus:outline-none"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center text-xs">
              {(['TODAY', 'WEEK', 'MONTH', 'ALL'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDateFilter(d)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    dateFilter === d ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d === 'TODAY' ? 'Today' : d === 'WEEK' ? '7 Days' : d === 'MONTH' ? '30 Days' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Sales Table */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-3">Receipt No</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Cashier</th>
                  <th className="py-3 px-3">Items Count</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Gross Profit</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-400">{sale.receiptNo}</td>
                    <td className="py-3 px-3 text-slate-400">{new Date(sale.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-3 font-medium text-slate-200">{sale.cashierName}</td>
                    <td className="py-3 px-3 text-slate-400">{sale.items.length} items</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-semibold text-slate-300">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-400">
                      {sale.totalAmount.toFixed(2)} {settings.currencySymbol}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-300">
                      {sale.profitAmount.toFixed(2)} {settings.currencySymbol}
                    </td>
                    <td className="py-3 px-3">
                      {sale.status === 'COMPLETED' ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold text-[10px] rounded-md border border-emerald-500/30">
                          COMPLETED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 font-bold text-[10px] rounded-md border border-rose-500/30">
                          REFUNDED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => setSelectedReceiptSale(sale)}
                        className="px-2.5 py-1 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded-lg font-semibold text-[11px]"
                      >
                        Receipt
                      </button>
                      {sale.status === 'COMPLETED' && (
                        <button
                          onClick={() => setRefundTargetSale(sale)}
                          className="px-2.5 py-1 bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white rounded-lg font-semibold text-[11px]"
                        >
                          Approve Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HELD SALES LIST */}
      {activeTab === 'HELD_SALES' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <h3 className="font-bold text-slate-100 text-sm">Currently Held POS Cart Transactions</h3>
            <p className="text-xs text-slate-400">Transactions paused by cashiers during checkout</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {heldSales.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                No sales currently held.
              </div>
            ) : (
              heldSales.map(h => (
                <div key={h.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-400">HELD ID: #{h.id.slice(-6)}</span>
                    <span className="text-[10px] text-slate-500">{new Date(h.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    <div>Cashier: <span className="font-semibold">{h.cashierName}</span></div>
                    <div>Items: <span className="font-semibold">{h.items.length} items</span></div>
                    {h.note && <div className="text-amber-300/80 italic mt-1 font-mono">"{h.note}"</div>}
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-400">
                      {h.subtotal.toFixed(2)} {settings.currencySymbol}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm('Cancel and clear held sale?')) deleteHeldSale(h.id);
                      }}
                      className="px-3 py-1 bg-rose-950/60 text-rose-300 hover:bg-rose-900 rounded-lg text-xs font-semibold"
                    >
                      Cancel Held Sale
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* REFUND APPROVAL MODAL */}
      {refundTargetSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 relative">
            <button
              onClick={() => setRefundTargetSale(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-100">Approve Refund Request</h3>
                <p className="text-xs text-slate-400">Receipt #{refundTargetSale.receiptNo}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmRefund} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
                <div className="flex justify-between font-semibold text-slate-200">
                  <span>Refund Amount:</span>
                  <span className="text-rose-400 font-bold">{refundTargetSale.totalAmount.toFixed(2)} {settings.currencySymbol}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Cashier: {refundTargetSale.cashierName} • {refundTargetSale.items.length} item(s)
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Reason for Refund</label>
                <input
                  type="text"
                  placeholder="e.g. Customer returned defective item"
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="restockCheck"
                  checked={refundRestock}
                  onChange={e => setRefundRestock(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <label htmlFor="restockCheck" className="text-slate-300 font-medium">
                  Automatically restock returned items back into inventory
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRefundTargetSale(null)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30"
                >
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        sale={selectedReceiptSale}
        isOpen={!!selectedReceiptSale}
        onClose={() => setSelectedReceiptSale(null)}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultReportType="SALES"
      />
    </div>
  );
};

export default OwnerSales;
