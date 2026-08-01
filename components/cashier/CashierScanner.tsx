import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/context/StoreContext';
import jsQR from 'jsqr';
import { QrCode, CheckCircle2, AlertCircle, ShoppingCart, Camera, RefreshCw, Play, Zap } from 'lucide-react';
import { playSound } from '@/lib/utils/exportUtils';

export const CashierScanner: React.FC = () => {
  const { products, addToCart, setCashierTab } = useStore();
  const [manualCode, setManualCode] = useState('');
  const [scannedMessage, setScannedMessage] = useState<{ text: string; type: 'SUCCESS' | 'ERROR' } | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isScanningActiveRef = useRef<boolean>(false);
  const lastScannedTimeRef = useRef<number>(0);

  // Stop media stream and cleanup animation frames
  const stopCameraStream = () => {
    isScanningActiveRef.current = false;

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
      } catch (e) {
        console.warn('Error stopping tracks:', e);
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch (e) {}
    }

    setIsCameraActive(false);
  };

  // Process barcode scan match
  const handleBarcodeDetected = (code: string) => {
    const now = Date.now();
    // Debounce scan calls by 1.5 seconds to prevent multi-triggering
    if (now - lastScannedTimeRef.current < 1500) return;
    lastScannedTimeRef.current = now;

    // Pause scanner briefly on match
    stopCameraStream();

    const trimmed = code.trim();
    const match = products.find(p => p.barcode === trimmed || p.id === trimmed);

    if (match) {
      if (match.stockQuantity <= 0) {
        playSound('alert');
        setScannedMessage({ text: `Out of stock: ${match.name}`, type: 'ERROR' });
        setTimeout(() => {
          startRearCamera();
        }, 1500);
      } else {
        addToCart(match);
        playSound('beep');
        setScannedMessage({ text: `Added to cart: ${match.name} (${match.sellingPrice.toFixed(2)} Birr)`, type: 'SUCCESS' });
        setTimeout(() => {
          setCashierTab(1); // Redirect to POS Cart
        }, 400);
      }
    } else {
      playSound('alert');
      setScannedMessage({ text: `No product found for barcode: ${trimmed}`, type: 'ERROR' });
      setTimeout(() => {
        startRearCamera();
      }, 1800);
    }
  };

  // Continuous frame scanner loop
  const startScanningLoop = () => {
    isScanningActiveRef.current = true;

    // Check if native BarcodeDetector API is available
    const hasNativeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    let barcodeDetector: any = null;

    if (hasNativeDetector) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'code_39', 'code_93', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e', 'itf', 'data_matrix']
        });
      } catch (e) {
        console.warn('BarcodeDetector format init error:', e);
      }
    }

    const scanFrame = async () => {
      if (!isScanningActiveRef.current || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
        let scannedCode: string | null = null;

        // Try 1: Native BarcodeDetector
        if (barcodeDetector) {
          try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              scannedCode = barcodes[0].rawValue;
            }
          } catch (err) {
            // Native detect frame error, fallback silently
          }
        }

        // Try 2: jsQR decoding via hidden canvas
        if (!scannedCode && canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrMatch = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });
            if (qrMatch && qrMatch.data) {
              scannedCode = qrMatch.data;
            }
          }
        }

        if (scannedCode) {
          handleBarcodeDetected(scannedCode);
          return;
        }
      }

      if (isScanningActiveRef.current) {
        animFrameIdRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(scanFrame);
  };

  // Start Rear Camera strictly using facingMode "environment"
  const startRearCamera = async () => {
    try {
      setIsStarting(true);
      setCameraError(null);

      stopCameraStream();
      await new Promise(res => setTimeout(res, 150));

      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera hardware access is not supported by this browser.');
      }

      // Constraints strictly set to back / rear camera
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Safely play video avoiding play() promise rejection errors
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('Video play safely caught:', err);
          });
        }
      }

      setIsCameraActive(true);
      setIsStarting(false);
      setCameraError(null);

      startScanningLoop();
    } catch (err: any) {
      console.warn('Rear camera access error:', err);
      setIsStarting(false);
      setIsCameraActive(false);
      setCameraError(
        'Could not start back camera. Please allow camera permissions in your browser, or enter the barcode manually.'
      );
    }
  };

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        startRearCamera();
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopCameraStream();
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleBarcodeDetected(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <div className="space-y-3 pb-16 max-w-md mx-auto">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header */}
      <div className="p-3.5 bg-slate-900 border border-slate-800/80 rounded-2xl flex items-center justify-between shadow-md">
        <div>
          <h2 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-emerald-400" />
            Rear Barcode Scanner
          </h2>
          <p className="text-[11px] text-slate-400">Uses back camera only • Auto-redirects to cart</p>
        </div>
        <button
          onClick={() => setCashierTab(1)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-transform"
        >
          <ShoppingCart className="w-3.5 h-3.5" /> Cart Page
        </button>
      </div>

      {/* Camera Live Stream Viewfinder */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 overflow-hidden relative shadow-lg">
        <div className="w-full min-h-[280px] rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center relative border border-slate-800/80">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover min-h-[280px] ${isCameraActive ? 'block' : 'hidden'}`}
          />

          {/* Scanner Overlay Line & Targeting Box */}
          {isCameraActive && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-48 border-2 border-emerald-400/70 rounded-2xl relative shadow-[0_0_20px_rgba(52,211,153,0.3)] bg-emerald-500/5">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-sm" />
                {/* Laser scan animation line */}
                <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#10b981] absolute top-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-300 mt-3 bg-slate-950/80 px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-sm flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400 animate-bounce" /> Align barcode inside box
              </span>
            </div>
          )}

          {isStarting && (
            <div className="text-center p-6 space-y-2">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-300">Connecting back camera...</p>
            </div>
          )}

          {!isCameraActive && !isStarting && !cameraError && (
            <div className="text-center p-6 space-y-3">
              <Camera className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Back camera is stopped.</p>
              <button
                onClick={startRearCamera}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 mx-auto shadow-lg shadow-emerald-600/20"
              >
                <Play className="w-3.5 h-3.5" /> Start Rear Camera
              </button>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold mt-3 space-y-2">
            <p>{cameraError}</p>
            <button
              onClick={startRearCamera}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Back Camera
            </button>
          </div>
        )}
      </div>

      {/* Toast Feedback */}
      {scannedMessage && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
            scannedMessage.type === 'SUCCESS'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-950/20'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-950/20'
          }`}
        >
          {scannedMessage.type === 'SUCCESS' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{scannedMessage.text}</span>
        </div>
      )}

      {/* Manual Key-in Barcode */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5">
        <label className="block text-xs font-semibold text-slate-300">Manual Barcode Entry</label>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Type barcode e.g. 890100100101"
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            className="flex-1 p-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-transform"
          >
            Scan & Cart
          </button>
        </form>
      </div>

      {/* Quick Barcode Test Buttons */}
      <div className="p-3 bg-slate-900/60 border border-slate-800/60 rounded-2xl">
        <span className="text-[11px] font-semibold text-slate-400 block mb-2">Instant Test Barcodes:</span>
        <div className="flex flex-wrap gap-1.5">
          {products.slice(0, 5).map(p => (
            <button
              key={p.id}
              onClick={() => handleBarcodeDetected(p.barcode)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg border border-slate-700 font-mono active:scale-95 transition-transform"
            >
              {p.barcode} ({p.name.slice(0, 10)})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CashierScanner;
