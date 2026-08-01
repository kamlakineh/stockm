import React, { useEffect, useRef } from 'react';
import { renderBarcodeSVG, printElementHtml } from '@/lib/utils/exportUtils';
import { X, Printer, Download, Barcode as BarcodeIcon } from 'lucide-react';

interface BarcodeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  barcode: string;
  price: number;
}

export const BarcodeGeneratorModal: React.FC<BarcodeGeneratorModalProps> = ({
  isOpen,
  onClose,
  productName,
  barcode,
  price,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (isOpen && svgRef.current && barcode) {
      renderBarcodeSVG(svgRef.current, barcode);
    }
  }, [isOpen, barcode]);

  if (!isOpen) return null;

  const handlePrintLabel = () => {
    const html = `
      <div style="text-align: center; border: 1px solid #000; padding: 15px; border-radius: 8px; width: 280px; margin: 0 auto;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${productName}</div>
        <div style="font-weight: bold; font-size: 18px; color: #111; margin-bottom: 8px;">$${price.toFixed(2)}</div>
        <div>${svgRef.current ? svgRef.current.outerHTML : ''}</div>
      </div>
    `;
    printElementHtml(`Barcode Label - ${productName}`, html);
  };

  const handlePrintSheet = () => {
    const labelHtml = `
      <div style="border: 1px dashed #ccc; padding: 10px; text-align: center; border-radius: 6px;">
        <div style="font-weight: bold; font-size: 11px;">${productName}</div>
        <div style="font-weight: bold; font-size: 14px; margin: 2px 0;">$${price.toFixed(2)}</div>
        ${svgRef.current ? svgRef.current.outerHTML : ''}
      </div>
    `;

    const labelsGrid = Array(12).fill(labelHtml).join('');
    const fullHtml = `
      <h2 style="text-align: center; margin-bottom: 20px;">Barcode Label Sheet (12 Stickers)</h2>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
        ${labelsGrid}
      </div>
    `;
    printElementHtml(`Barcode Sheet - ${productName}`, fullHtml);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
            <BarcodeIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100">Barcode Label Generator</h3>
            <p className="text-xs text-slate-400">Standard Code 128 Format</p>
          </div>
        </div>

        {/* Preview Box */}
        <div className="bg-white p-6 rounded-xl text-slate-900 flex flex-col items-center justify-center my-5 shadow-inner">
          <div className="font-bold text-sm text-center mb-1 text-slate-800">{productName}</div>
          <div className="font-black text-xl text-emerald-600 mb-2">${price.toFixed(2)}</div>
          <svg ref={svgRef} className="max-w-full"></svg>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handlePrintLabel}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Single Label
          </button>
          <button
            onClick={handlePrintSheet}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Print Label Sheet (12 Stickers)
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeGeneratorModal;
