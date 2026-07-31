import React from 'react';
import { Sale } from '../../types';
import { useStore } from '../../context/StoreContext';
import { printElementHtml } from '../../utils/exportUtils';
import { X, Printer, Share2, CheckCircle2, QrCode } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, isOpen, onClose }) => {
  const { settings } = useStore();

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    const itemsHtml = sale.items
      .map(
        i => `
      <tr>
        <td>${i.productName} x${i.quantity}</td>
        <td class="right">$${i.subtotal.toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <div class="text-center">
        <h2 style="margin: 0; font-size: 20px;">${settings.storeName}</h2>
        <p style="margin: 4px 0; font-size: 12px; color: #555;">${settings.address}</p>
        <p style="margin: 2px 0; font-size: 12px; color: #555;">Tel: ${settings.phone}</p>
        <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
        <p class="font-bold my-2">${settings.receiptHeaderMessage}</p>
        <div style="text-align: left; font-size: 12px; margin: 8px 0;">
          <div>Receipt #: <strong>${sale.receiptNo}</strong></div>
          <div>Date: ${new Date(sale.createdAt).toLocaleString()}</div>
          <div>Cashier: ${sale.cashierName}</div>
          <div>Payment Method: ${sale.paymentMethod}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div style="border-top: 1px solid #000; padding-top: 8px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>$${sale.subtotal.toFixed(2)}</span></div>
        ${sale.discountAmount > 0 ? `<div style="display: flex; justify-content: space-between; color: green;"><span>Discount:</span><span>-$${sale.discountAmount.toFixed(2)}</span></div>` : ''}
        <div style="display: flex; justify-content: space-between;"><span>Tax (${settings.taxPercent}%):</span><span>$${sale.taxAmount.toFixed(2)}</span></div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 6px;"><span>GRAND TOTAL:</span><span>$${sale.totalAmount.toFixed(2)}</span></div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px;"><span>Tendered:</span><span>$${sale.amountTendered.toFixed(2)}</span></div>
        <div style="display: flex; justify-content: space-between; font-size: 12px;"><span>Change:</span><span>$${sale.changeGiven.toFixed(2)}</span></div>
      </div>
      <div class="text-center my-4 font-bold" style="font-size: 12px;">
        ${settings.receiptFooterMessage}
      </div>
    `;

    printElementHtml(`Receipt - ${sale.receiptNo}`, html);
  };

  const handleShareWhatsApp = () => {
    const text = `*Receipt from ${settings.storeName}*\nReceipt: ${sale.receiptNo}\nTotal: ${sale.totalAmount.toFixed(2)} ${settings.currencySymbol}\nCashier: ${sale.cashierName}\nThank you for shopping!`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-slate-100 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center border-b border-slate-800 pb-4 mb-4">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-100">{settings.storeName}</h3>
          <p className="text-xs text-slate-400">{settings.address}</p>
          <p className="text-[11px] text-slate-500 mt-1">{settings.receiptHeaderMessage}</p>
        </div>

        {/* Receipt Meta */}
        <div className="text-xs text-slate-300 space-y-1 mb-4 bg-slate-800/60 p-3 rounded-xl border border-slate-800">
          <div className="flex justify-between">
            <span className="text-slate-400">Receipt No:</span>
            <span className="font-mono font-semibold">{sale.receiptNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Date & Time:</span>
            <span>{new Date(sale.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Cashier:</span>
            <span>{sale.cashierName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Payment:</span>
            <span className="font-semibold text-indigo-400">{sale.paymentMethod}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 mb-4 border-b border-slate-800 pb-3">
          {sale.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-xs">
              <div>
                <div className="font-medium text-slate-200">{item.productName}</div>
                <div className="text-[10px] text-slate-500">
                  {item.quantity} x {item.unitPrice.toFixed(2)} {settings.currencySymbol}
                </div>
              </div>
              <div className="font-semibold text-slate-200">
                {item.subtotal.toFixed(2)} {settings.currencySymbol}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1.5 text-xs text-slate-300 mb-5">
          <div className="flex justify-between">
            <span className="text-slate-400">Subtotal</span>
            <span>{sale.subtotal.toFixed(2)} {settings.currencySymbol}</span>
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Discount</span>
              <span>-{sale.discountAmount.toFixed(2)} {settings.currencySymbol}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Tax ({settings.taxPercent}%)</span>
            <span>{sale.taxAmount.toFixed(2)} {settings.currencySymbol}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-slate-800">
            <span>TOTAL</span>
            <span className="text-emerald-400">{sale.totalAmount.toFixed(2)} {settings.currencySymbol}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 pt-1">
            <span>Amount Tendered</span>
            <span>{sale.amountTendered.toFixed(2)} {settings.currencySymbol}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Change Returned</span>
            <span>{sale.changeGiven.toFixed(2)} {settings.currencySymbol}</span>
          </div>
        </div>

        {settings.enableQrOnReceipt && (
          <div className="flex flex-col items-center justify-center p-3 bg-slate-800/80 rounded-xl mb-5 border border-slate-700/60 text-center">
            <QrCode className="w-12 h-12 text-slate-300 mb-1" />
            <span className="text-[10px] text-slate-400">Scan QR to verify electronic receipt</span>
          </div>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handlePrint}
            className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Share2 className="w-4 h-4" />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
