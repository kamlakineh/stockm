import JsBarcode from 'jsbarcode';

// Audio chime generator using Web Audio API for cross-platform zero-dependency sounds
export function playSound(type: 'beep' | 'success' | 'alert' | 'click') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'beep') {
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.2); // C6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'click') {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    }
  } catch (e) {
    console.warn('Audio play exception', e);
  }
}

// Generate SVG string or Canvas for Barcodes
export function renderBarcodeSVG(element: SVGElement | null, code: string) {
  if (!element || !code) return;
  try {
    JsBarcode(element, code, {
      format: 'CODE128',
      lineColor: '#111827',
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 14,
      margin: 10,
    });
  } catch (err) {
    console.error('Barcode render error:', err);
  }
}

// Download CSV helper
export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  if (typeof window === 'undefined') return;
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Print Window Helper for Receipts or Reports
export function printElementHtml(title: string, htmlContent: string) {
  if (typeof window === 'undefined') return;
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #111; max-width: 600px; margin: 0 auto; }
          .receipt-box { border: 1px dashed #ccc; padding: 20px; border-radius: 8px; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .my-2 { margin: 8px 0; }
          .my-4 { margin: 16px 0; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th, td { text-align: left; padding: 6px 0; border-bottom: 1px solid #eee; }
          th.right, td.right { text-align: right; }
          .total-row td { border-top: 2px solid #000; font-weight: bold; font-size: 1.1em; }
          @media print {
            body { padding: 0; }
            .receipt-box { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          ${htmlContent}
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
