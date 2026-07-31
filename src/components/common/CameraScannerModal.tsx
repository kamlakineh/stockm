import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import jsQR from 'jsqr';
import { X, Camera, Barcode, CheckCircle, Search, RefreshCw, Play, Zap } from 'lucide-react';
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

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isScanningActiveRef = useRef<boolean>(false);
  const lastScannedTimeRef = useRef<number>(0);

  // Stop camera media stream safely
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
    if (now - lastScannedTimeRef.current < 1200) return;
    lastScannedTimeRef.current = now;

    playSound('beep');
    const trimmed = code.trim();
    const match = products.find(p => p.barcode === trimmed);

    if (match) {
      setLastScannedProduct(`Scanned: ${match.name} (${match.sellingPrice.toFixed(2)} Birr)`);
    } else {
      setLastScannedProduct(`Scanned Code: ${trimmed}`);
    }

    onScanSuccess(trimmed);
  };

  // Continuous frame scanning loop
  const startScanningLoop = () => {
    isScanningActiveRef.current = true;

    const hasNativeDetector = 'BarcodeDetector' in window;
    let barcodeDetector: any = null;

    if (hasNativeDetector) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'code_39', 'code_93', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e', 'itf', 'data_matrix']
        });
      } catch (e) {
        console.warn('BarcodeDetector init error:', e);
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
            // Ignore frame detect error
          }
        }

        // Try 2: jsQR decoding
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
        }
      }

      if (isScanningActiveRef.current) {
        animFrameIdRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(scanFrame);
  };

  // Start rear / back camera stream
  const startRearCamera = async () => {
    try {
      setIsStarting(true);
      setCameraError(null);

      stopCameraStream();
      await new Promise(res => setTimeout(res, 150));

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera hardware access is not supported by this browser.');
      }

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
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('Modal video play safely caught:', err);
          });
        }
      }

      setIsCameraActive(true);
      setIsStarting(false);
      setCameraError(null);

      startScanningLoop();
    } catch (err: any) {
      console.warn('Rear camera start error in modal:', err);
      setIsStarting(false);
      setIsCameraActive(false);
      setCameraError(
        'Could not start back camera. Please allow camera permissions, or enter barcode manually.'
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startRearCamera();
      }, 200);

      return () => {
        clearTimeout(timer);
        stopCameraStream();
      };
    } else {
      stopCameraStream();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    handleBarcodeDetected(manualCode.trim());
    setManualCode('');
  };

  const handleClose = () => {
    stopCameraStream();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100">Rear Barcode Scanner</h3>
            <p className="text-xs text-slate-400">Back camera active • Align barcode within frame</p>
          </div>
        </div>

        {/* Camera Scanner Viewfinder */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 mb-4 min-h-[240px] flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover min-h-[240px] ${isCameraActive ? 'block' : 'hidden'}`}
          />

          {/* Scanner Overlay Box */}
          {isCameraActive && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-56 h-40 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(52,211,153,0.3)] bg-emerald-500/5">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-sm" />
                <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#10b981] absolute top-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-300 mt-2.5 bg-slate-950/80 px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-sm flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400 animate-bounce" /> Align barcode inside box
              </span>
            </div>
          )}

          {isStarting && (
            <div className="text-center p-4">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-300">Starting rear camera...</p>
            </div>
          )}

          {!isCameraActive && !isStarting && !cameraError && (
            <div className="text-center p-4 space-y-2">
              <Camera className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Rear camera is stopped.</p>
              <button
                onClick={startRearCamera}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 mx-auto shadow-md"
              >
                <Play className="w-3.5 h-3.5" /> Start Rear Camera
              </button>
            </div>
          )}

          {/* Toast Overlay for scan feedback */}
          {lastScannedProduct && (
            <div className="absolute bottom-3 left-3 right-3 bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg animate-bounce z-10">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{lastScannedProduct}</span>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold mb-4 space-y-2">
            <p>{cameraError}</p>
            <button
              onClick={startRearCamera}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Back Camera
            </button>
          </div>
        )}

        {/* Manual Barcode Search Fallback */}
        <form onSubmit={handleManualSubmit} className="space-y-2.5">
          <label className="block text-xs font-semibold text-slate-400">
            Manual Barcode Search
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Enter barcode e.g. 890100100101"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-indigo-600/30 active:scale-95 transition-transform"
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
                onClick={() => handleBarcodeDetected(p.barcode)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg border border-slate-700 font-mono active:scale-95 transition-transform"
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
