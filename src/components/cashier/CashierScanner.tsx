import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, CheckCircle2, AlertCircle, ShoppingCart, Flashlight } from 'lucide-react';
import { playSound } from '../../utils/exportUtils';

export const CashierScanner: React.FC = () => {
  const { products, addToCart, setCashierTab } = useStore();
  const [manualCode, setManualCode] = useState('');
  const [scannedMessage, setScannedMessage] = useState<{ text: string; type: 'SUCCESS' | 'ERROR' } | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'cashier-live-scanner',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (scannedCode) => {
        handleCodeScan(scannedCode);
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(err => console.error(err));
    };
  }, [products]);

  const handleCodeScan = (code: string) => {
    const match = products.find(p => p.barcode === code || p.id === code);
    if (match) {
      if (match.stockQuantity <= 0) {
        playSound('alert');
        setScannedMessage({ text: `Out of stock: ${match.name}`, type: 'ERROR' });
      } else {
        addToCart(match);
        playSound('beep');
        setScannedMessage({ text: `Added to cart: ${match.name}`, type: 'SUCCESS' });
      }
    } else {
      playSound('alert');
      setScannedMessage({ text: `No product found for barcode: ${code}`, type: 'ERROR' });
    }

    setTimeout(() => setScannedMessage(null), 3000);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCodeScan(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <div className="space-y-3 pb-16 max-w-md mx-auto">
      <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-100 text-xs sm:text-sm flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-emerald-400" />
            POS Barcode Scanner
          </h2>
          <p className="text-[10px] text-slate-400">Scan product barcode to automatically add to cart</p>
        </div>
        <button
          onClick={() => setCashierTab(1)}
          className="px-2.5 py-1 bg-indigo-600 text-white font-bold text-[11px] rounded-lg flex items-center gap-1"
        >
          <ShoppingCart className="w-3.5 h-3.5" /> Cart
        </button>
      </div>

      {/* Camera Container */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 overflow-hidden relative">
        <div id="cashier-live-scanner" className="w-full rounded-lg overflow-hidden bg-slate-950"></div>
      </div>

      {/* Toast Feedback */}
      {scannedMessage && (
        <div
          className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold animate-bounce ${
            scannedMessage.type === 'SUCCESS'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}
        >
          {scannedMessage.type === 'SUCCESS' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{scannedMessage.text}</span>
        </div>
      )}

      {/* Manual Barcode Input Fallback */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
        <label className="block text-xs font-semibold text-slate-400">Manual Barcode Key-In</label>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Type code e.g. 890123456789"
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            className="flex-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs"
          />
          <button type="submit" className="px-4 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl">
            Add
          </button>
        </form>
      </div>
    </div>
  );
};

export default CashierScanner;
