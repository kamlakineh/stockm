import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useStore } from '../../context/StoreContext';
import { X, Camera, Flashlight, Barcode, CheckCircle, Search } from 'lucide-react';
import { playSound } from '../../utils/exportUtils';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const { products } = useStore();
  const [manualCode, setManualCode] = useState('');
  const [lastScannedProduct, setLastScannedProduct] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize Html5QrcodeScanner
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 180 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
      };

      try {
        const scanner = new Html5QrcodeScanner('reader-container', config, false);
        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            playSound('beep');
            const match = products.find(p => p.barcode === decodedText);
            if (match) {
              setLastScannedProduct(`Added: ${match.name} ($${match.sellingPrice.toFixed(2)})`);
            } else {
              setLastScannedProduct(`Scanned Code: ${decodedText}`);
            }
            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Ignore benign frame scan misses
          }
        );
      } catch (e) {
        console.warn('Scanner camera init fallback', e);
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error('Scanner clear error', err));
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    playSound('beep');
    const match = products.find(p => p.barcode === manualCode.trim() || p.name.toLowerCase().includes(manualCode.toLowerCase()));
    if (match) {
      onScanSuccess(match.barcode);
      setLastScannedProduct(`Found: ${match.name}`);
    } else {
      onScanSuccess(manualCode.trim());
      setLastScannedProduct(`Code: ${manualCode.trim()}`);
    }
    setManualCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100">Live Barcode Scanner</h3>
            <p className="text-xs text-slate-400">Align barcode within rectangle frame</p>
          </div>
        </div>

        {/* Camera Scanner Viewfinder */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 mb-4 min-h-[220px] flex items-center justify-center">
          <div id="reader-container" className="w-full text-slate-900"></div>

          {/* Toast Overlay for scan feedback */}
          {lastScannedProduct && (
            <div className="absolute bottom-3 left-3 right-3 bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg animate-bounce">
              <CheckCircle className="w-4 h-4" />
              <span>{lastScannedProduct}</span>
            </div>
          )}
        </div>

        {/* Manual Barcode Search Fallback */}
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-400">
            Manual Barcode / Product Name Fallback
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Enter barcode e.g. 890100100101"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-indigo-600/30"
            >
              <Search className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </form>

        {/* Test Barcode Quick Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2">Quick Test Barcodes:</span>
          <div className="flex flex-wrap gap-1.5">
            {products.slice(0, 4).map(p => (
              <button
                key={p.id}
                onClick={() => {
                  playSound('beep');
                  onScanSuccess(p.barcode);
                  setLastScannedProduct(`Scanned: ${p.name}`);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg border border-slate-700 font-mono"
              >
                {p.barcode} ({p.name.slice(0, 10)}...)
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraScannerModal;
