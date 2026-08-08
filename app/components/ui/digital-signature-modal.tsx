'use me';
'use client';

/**
 * Componente UI de Captura de Firma Digital NOM-151 (DigitalSignatureModal)
 * EscalaFin v3.0.0 - UI/UX Pro Max Standard
 * 
 * Permite la captura táctil/mouse de firma autógrafa digital con geolocalización GPS,
 * trazabilidad criptográfica SHA-256 y cumplimiento normativo NOM-151.
 */

import React, { useRef, useState, useEffect } from 'react';
import { 
  FileSignature, 
  ShieldCheck, 
  MapPin, 
  RotateCcw, 
  CheckCircle2, 
  X, 
  Loader2,
  Lock
} from 'lucide-react';
import { nom151SignatureService, Nom151AuditTrail } from '@/lib/nom151-signature';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string;
  tenantId: string;
  clientName: string;
  documentContent: string;
  onSignatureComplete: (auditTrail: Nom151AuditTrail) => void;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  loanId,
  tenantId,
  clientName,
  documentContent,
  onSignatureComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [geoStatus, setGeoStatus] = useState<'pending' | 'success' | 'denied'>('pending');

  useEffect(() => {
    if (isOpen) {
      // Capturar ubicación GPS del dispositivo
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCoords({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setGeoStatus('success');
          },
          () => setGeoStatus('denied'),
          { timeout: 10000, enableHighAccuracy: true }
        );
      } else {
        setGeoStatus('denied');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Manejo de dibujo en HTML5 Canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = '#0F172A'; // Slate-900 en claro, oscuro configurable
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();

    if (!hasSignature) setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSaveSignature = async () => {
    if (!hasSignature || !canvasRef.current) return;

    setIsSaving(true);
    try {
      const signatureBase64 = canvasRef.current.toDataURL('image/png');
      const timestamp = new Date().toISOString();
      const userAgent = navigator.userAgent;

      const biometrics = {
        signatureBase64,
        signerName: clientName,
        signerIp: '127.0.0.1', // Resuelto en API de producción
        latitude: coords.latitude,
        longitude: coords.longitude,
        userAgent,
        timestamp,
      };

      const auditTrail = nom151SignatureService.generateAuditTrail(
        loanId,
        tenantId,
        documentContent,
        biometrics
      );

      onSignatureComplete(auditTrail);
      onClose();
    } catch (err) {
      console.error('Error al guardar firma NOM-151:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const documentHash = nom151SignatureService.computeDocumentHash(documentContent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all">
        
        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Firma Digital de Pagaré (NOM-151)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acreditado: <span className="font-semibold text-slate-700 dark:text-slate-300">{clientName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-4">
          
          {/* Badge de Integridad y Hash */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 text-xs">
            <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
              <Lock className="w-4 h-4 text-indigo-500" />
              <span className="font-mono truncate max-w-[280px]">
                Hash SHA-256: {documentHash.slice(0, 16)}...{documentHash.slice(-8)}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-medium">
              <MapPin className={`w-3.5 h-3.5 ${geoStatus === 'success' ? 'text-emerald-500' : 'text-amber-500'}`} />
              <span className={geoStatus === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>
                {geoStatus === 'success' ? 'GPS Verificado' : 'Sin GPS'}
              </span>
            </div>
          </div>

          {/* Lienzo Canvas para la Firma */}
          <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={500}
              height={180}
              className="w-full h-[180px] touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 dark:text-slate-600 text-sm font-medium">
                Trace su firma aquí
              </div>
            )}
          </div>

          {/* Acciones de Lienzo */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={clearCanvas}
              disabled={!hasSignature}
              className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar firma</span>
            </button>

            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Protegido por NOM-151-SCFI-2016</span>
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveSignature}
            disabled={!hasSignature || isSaving}
            className="inline-flex items-center space-x-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-600/20 transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando Constancia...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Firmar Pagaré</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default DigitalSignatureModal;
