import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { downloadCSV, printElementHtml } from '../../utils/exportUtils';
import { X, FileText, Download, Printer, Table } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultReportType?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  defaultReportType = 'SALES',
}) => {
  const { sales, products, settings, suppliers, cashiers } = useStore();
  const [reportType, setReportType] = useState(defaultReportType);
  const [datePreset, setDatePreset] = useState('30DAYS');

  if (!isOpen) return null;

  const handleExportCSV = () => {
    if (reportType === 'SALES') {
      const headers = ['Receipt No', 'Date', 'Cashier', 'Items Count', 'Subtotal', 'Tax', 'Discount', 'Total Amount', 'Payment Method', 'Status'];
      const rows = sales.map(s => [
        s.receiptNo,
        new Date(s.createdAt).toLocaleString(),
        s.cashierName,
        s.items.length,
        s.subtotal.toFixed(2),
        s.taxAmount.toFixed(2),
        s.discountAmount.toFixed(2),
        s.totalAmount.toFixed(2),
        s.paymentMethod,
        s.status,
      ]);
      downloadCSV(`sales_report_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    } else if (reportType === 'INVENTORY') {
      const headers = ['Barcode', 'Product Name', 'Category', 'Supplier', 'Cost Price', 'Selling Price', 'Stock Qty', 'Min Level', 'Stock Value', 'Status'];
      const rows = products.map(p => [
        p.barcode,
        p.name,
        p.categoryName,
        p.supplierName,
        p.costPrice.toFixed(2),
        p.sellingPrice.toFixed(2),
        p.stockQuantity,
        p.minStockLevel,
        (p.costPrice * p.stockQuantity).toFixed(2),
        p.stockQuantity <= 0 ? 'Out of Stock' : p.stockQuantity <= p.minStockLevel ? 'Low Stock' : 'In Stock',
      ]);
      downloadCSV(`inventory_report_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    } else if (reportType === 'CASHIER') {
      const headers = ['Cashier ID', 'Name', 'Phone', 'Shift Status', 'Today Sales Count', 'Today Sales Total'];
      const rows = cashiers.map(c => [
        c.employeeId,
        c.name,
        c.phone,
        c.currentShiftStartedAt ? 'ON SHIFT' : 'OFF SHIFT',
        c.todaySalesCount,
        c.todaySalesTotal.toFixed(2),
      ]);
      downloadCSV(`cashier_report_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    }
    onClose();
  };

  const handlePrintPDF = () => {
    let content = '';
    if (reportType === 'SALES') {
      const totalRev = sales.reduce((acc, s) => acc + s.totalAmount, 0);
      const totalProf = sales.reduce((acc, s) => acc + s.profitAmount, 0);

      const rowsHtml = sales
        .map(
          s => `
        <tr>
          <td>${s.receiptNo}</td>
          <td>${new Date(s.createdAt).toLocaleDateString()}</td>
          <td>${s.cashierName}</td>
          <td>$${s.totalAmount.toFixed(2)}</td>
          <td>$${s.profitAmount.toFixed(2)}</td>
          <td>${s.paymentMethod}</td>
        </tr>
      `
        )
        .join('');

      content = `
        <h2>${settings.storeName} - Financial Sales Report</h2>
        <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
        <div style="display: flex; gap: 20px; margin: 15px 0;">
          <div style="background: #f3f4f6; padding: 10px 15px; border-radius: 6px;"><strong>Total Revenue:</strong> $${totalRev.toFixed(2)}</div>
          <div style="background: #dcfce7; padding: 10px 15px; border-radius: 6px;"><strong>Total Profit:</strong> $${totalProf.toFixed(2)}</div>
          <div style="background: #e0e7ff; padding: 10px 15px; border-radius: 6px;"><strong>Total Orders:</strong> ${sales.length}</div>
        </div>
        <table>
          <thead>
            <tr><th>Receipt #</th><th>Date</th><th>Cashier</th><th>Total</th><th>Profit</th><th>Payment</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      `;
    } else {
      const totalInvVal = products.reduce((acc, p) => acc + p.costPrice * p.stockQuantity, 0);
      const rowsHtml = products
        .map(
          p => `
        <tr>
          <td>${p.barcode}</td>
          <td>${p.name}</td>
          <td>${p.categoryName}</td>
          <td>$${p.costPrice.toFixed(2)}</td>
          <td>$${p.sellingPrice.toFixed(2)}</td>
          <td>${p.stockQuantity}</td>
          <td>$${(p.costPrice * p.stockQuantity).toFixed(2)}</td>
        </tr>
      `
        )
        .join('');

      content = `
        <h2>${settings.storeName} - Inventory Stock Valuation Report</h2>
        <p><strong>Total Inventory Asset Value:</strong> $${totalInvVal.toFixed(2)}</p>
        <table>
          <thead>
            <tr><th>Barcode</th><th>Name</th><th>Category</th><th>Cost</th><th>Price</th><th>Stock</th><th>Valuation</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      `;
    }

    printElementHtml(`${reportType} Report - ${settings.storeName}`, content);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100">Export Business Report</h3>
            <p className="text-xs text-slate-400">Download formatted CSV or print PDF document</p>
          </div>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Report Type</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="SALES">Sales & Transaction Log Report</option>
              <option value="INVENTORY">Inventory Valuation & Stock Audit</option>
              <option value="CASHIER">Cashier Shift & Performance Report</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Time Frame Filter</label>
            <div className="grid grid-cols-3 gap-2">
              {['TODAY', '7DAYS', '30DAYS'].map(preset => (
                <button
                  key={preset}
                  onClick={() => setDatePreset(preset)}
                  className={`py-2 px-3 text-xs rounded-xl font-medium border transition-all ${
                    datePreset === preset
                      ? 'bg-indigo-600 border-indigo-500 text-white font-semibold'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {preset === 'TODAY' ? 'Today' : preset === '7DAYS' ? 'Last 7 Days' : 'Last 30 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportCSV}
            className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Table className="w-4 h-4" />
            Export CSV / Excel
          </button>
          <button
            onClick={handlePrintPDF}
            className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print PDF Document
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
