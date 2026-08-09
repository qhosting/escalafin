'use client';

/**
 * DigitalVault — EscalaFin v3.1.0
 * Bóveda Digital de Documentos KYC para clientes.
 *
 * Features:
 * - 8 tipos de documentos con slots visuales
 * - Drag & Drop + click para subir
 * - Preview inline de imágenes/PDFs
 * - Estados: PENDING → UPLOADED → REVIEWING → APPROVED / REJECTED
 * - Subida a Google Drive (preparado)
 * - Progreso visual de la bóveda
 */

import { useState, useRef, useCallback } from 'react';
import {
  FileText, Upload, Eye, CheckCircle2, XCircle, Clock, AlertCircle,
  CloudUpload, Trash2, ZoomIn, Loader2, ShieldCheck, IdCard,
  Home, Briefcase, FileCheck, Baby, Users, FileSignature
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Tipos de documentos KYC ──────────────────────────────────────────────────
export type DocStatus = 'PENDING' | 'UPLOADED' | 'REVIEWING' | 'APPROVED' | 'REJECTED';

export interface DocumentSlot {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
  file?: File;
  previewUrl?: string;
  status: DocStatus;
  driveUrl?: string;
  rejectionReason?: string;
}

const DOCUMENT_TYPES: Omit<DocumentSlot, 'status'>[] = [
  {
    id: 'ine_front',
    label: 'INE Frontal',
    description: 'Frente de la credencial para votar vigente',
    icon: IdCard,
    required: true,
  },
  {
    id: 'ine_back',
    label: 'INE Reverso',
    description: 'Reverso de la credencial para votar',
    icon: IdCard,
    required: true,
  },
  {
    id: 'comprobante_domicilio',
    label: 'Comprobante de Domicilio',
    description: 'Recibo de luz, agua o teléfono (máx. 3 meses)',
    icon: Home,
    required: true,
  },
  {
    id: 'comprobante_ingresos',
    label: 'Comprobante de Ingresos',
    description: 'Recibo de nómina o estados de cuenta',
    icon: Briefcase,
    required: false,
  },
  {
    id: 'curp',
    label: 'CURP',
    description: 'Clave Única de Registro de Población',
    icon: FileCheck,
    required: false,
  },
  {
    id: 'acta_nacimiento',
    label: 'Acta de Nacimiento',
    description: 'Acta de nacimiento original o copia certificada',
    icon: Baby,
    required: false,
  },
  {
    id: 'foto_aval',
    label: 'Foto del Aval',
    description: 'Foto y/o identificación del aval',
    icon: Users,
    required: false,
  },
  {
    id: 'contrato_firmado',
    label: 'Contrato Firmado',
    description: 'Pagaré o contrato de crédito con firma',
    icon: FileSignature,
    required: false,
  },
];

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; icon: React.ElementType }> = {
  PENDING:   { label: 'Pendiente',  color: 'bg-slate-100 text-slate-600 border-slate-200',    icon: Clock },
  UPLOADED:  { label: 'Cargado',    color: 'bg-blue-100 text-blue-700 border-blue-200',        icon: Upload },
  REVIEWING: { label: 'En Revisión',color: 'bg-amber-100 text-amber-700 border-amber-200',     icon: Eye },
  APPROVED:  { label: 'Aprobado',   color: 'bg-green-100 text-green-700 border-green-200',     icon: CheckCircle2 },
  REJECTED:  { label: 'Rechazado',  color: 'bg-red-100 text-red-700 border-red-200',           icon: XCircle },
};

interface DigitalVaultProps {
  driveEnabled?: boolean;
  onChange?: (docs: DocumentSlot[]) => void;
}

export function DigitalVault({ driveEnabled = false, onChange }: DigitalVaultProps) {
  const [documents, setDocuments] = useState<DocumentSlot[]>(
    DOCUMENT_TYPES.map((d) => ({ ...d, status: 'PENDING' }))
  );
  const [previewDoc, setPreviewDoc] = useState<DocumentSlot | null>(null);
  const [uploadingDrive, setUploadingDrive] = useState<string | null>(null);
  const [draggingOver, setDraggingOver] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const updateDoc = useCallback((id: string, patch: Partial<DocumentSlot>) => {
    setDocuments((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, ...patch } : d));
      onChange?.(updated);
      return updated;
    });
  }, [onChange]);

  // ─── Subida de archivo ───────────────────────────────────────────────────────
  const handleFile = (id: string, file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Solo se permiten imágenes o PDF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo supera 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      updateDoc(id, {
        file,
        previewUrl: url,
        status: 'UPLOADED',
      });
      toast.success(`${file.name} cargado`);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(id, file);
  };

  // ─── Drag & Drop ─────────────────────────────────────────────────────────────
  const handleDrop = (id: string, e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOver(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(id, file);
  };

  // ─── Acciones de revisión ──────────────────────────────────────────────────
  const approveDoc = (id: string) => {
    updateDoc(id, { status: 'APPROVED', rejectionReason: undefined });
    toast.success('Documento aprobado');
  };

  const rejectDoc = (id: string) => {
    const reason = prompt('Motivo del rechazo (opcional):') || 'No cumple requisitos';
    updateDoc(id, { status: 'REJECTED', rejectionReason: reason });
    toast.error('Documento rechazado');
  };

  const setReviewing = (id: string) => {
    updateDoc(id, { status: 'REVIEWING' });
  };

  const removeDoc = (id: string) => {
    updateDoc(id, { file: undefined, previewUrl: undefined, status: 'PENDING', driveUrl: undefined });
    if (fileInputRefs.current[id]) fileInputRefs.current[id]!.value = '';
  };

  // ─── Google Drive upload (preparado) ─────────────────────────────────────────
  const uploadToDrive = async (id: string) => {
    if (!driveEnabled) {
      toast.info('Configure Google Drive en /admin/config');
      return;
    }
    setUploadingDrive(id);
    try {
      // TODO: await fetch('/api/drive/upload-document', { method: 'POST', body: formData })
      await new Promise((r) => setTimeout(r, 1500));
      updateDoc(id, { driveUrl: 'https://drive.google.com/pending' });
      toast.success('Subido a Google Drive');
    } catch {
      toast.error('Error al subir a Drive');
    } finally {
      setUploadingDrive(null);
    }
  };

  // ─── Progreso ─────────────────────────────────────────────────────────────────
  const uploadedCount = documents.filter((d) => d.status !== 'PENDING').length;
  const approvedCount = documents.filter((d) => d.status === 'APPROVED').length;
  const requiredDocs = documents.filter((d) => d.required);
  const requiredApproved = requiredDocs.filter((d) => d.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Header con progreso */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {uploadedCount}/{documents.length} documentos cargados
            </span>
          </div>
          <div className="flex gap-2 text-xs">
            <Badge className="bg-green-100 text-green-700 border-green-200">
              {approvedCount} aprobados
            </Badge>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
              {requiredApproved}/{requiredDocs.length} requeridos
            </Badge>
          </div>
        </div>
        <Progress value={(uploadedCount / documents.length) * 100} className="h-2" />
      </div>

      {/* Grid de documentos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {documents.map((doc) => {
          const StatusIcon = STATUS_CONFIG[doc.status].icon;
          const DocIcon = doc.icon;
          const isDragging = draggingOver === doc.id;

          return (
            <div
              key={doc.id}
              className={cn(
                'relative flex flex-col rounded-2xl border-2 transition-all duration-200 overflow-hidden bg-white dark:bg-slate-900',
                isDragging
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20 scale-[1.02]'
                  : doc.status === 'APPROVED'
                  ? 'border-green-300 shadow-green-100 shadow-md'
                  : doc.status === 'REJECTED'
                  ? 'border-red-300'
                  : doc.status === 'UPLOADED' || doc.status === 'REVIEWING'
                  ? 'border-blue-300'
                  : 'border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-300'
              )}
              onDragOver={(e) => { e.preventDefault(); setDraggingOver(doc.id); }}
              onDragLeave={() => setDraggingOver(null)}
              onDrop={(e) => handleDrop(doc.id, e)}
            >
              {/* Preview o placeholder */}
              <div
                className="relative h-28 flex items-center justify-center bg-slate-50 dark:bg-slate-800 cursor-pointer group"
                onClick={() => doc.previewUrl ? setPreviewDoc(doc) : fileInputRefs.current[doc.id]?.click()}
              >
                {doc.previewUrl ? (
                  doc.file?.type === 'application/pdf' ? (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <FileText className="w-10 h-10 text-red-500" />
                      <span className="text-xs font-medium truncate max-w-[90%]">{doc.file.name}</span>
                    </div>
                  ) : (
                    <>
                      <img src={doc.previewUrl} alt={doc.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <ZoomIn className="w-6 h-6 text-white" />
                      </div>
                    </>
                  )
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <DocIcon className="w-8 h-8" />
                    <span className="text-xs text-center px-2">{doc.description}</span>
                    {isDragging && (
                      <span className="text-xs text-blue-600 font-medium">Suelta aquí</span>
                    )}
                  </div>
                )}

                {/* Required badge */}
                {doc.required && (
                  <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-orange-500 text-white rounded-full px-1.5 py-0.5">
                    REQ
                  </span>
                )}
              </div>

              {/* Info + controles */}
              <div className="flex flex-col gap-2 p-3">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {doc.label}
                  </span>
                  <Badge className={cn('text-[10px] px-1.5 py-0 h-5 border', STATUS_CONFIG[doc.status].color)}>
                    <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                    {STATUS_CONFIG[doc.status].label}
                  </Badge>
                </div>

                {doc.rejectionReason && (
                  <p className="text-[10px] text-red-600 italic">{doc.rejectionReason}</p>
                )}

                {/* Acciones */}
                <div className="flex gap-1 flex-wrap">
                  {doc.status === 'PENDING' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1 gap-1"
                      onClick={() => fileInputRefs.current[doc.id]?.click()}
                    >
                      <Upload className="w-3 h-3" />
                      Cargar
                    </Button>
                  )}

                  {doc.status === 'UPLOADED' && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs flex-1 gap-1 bg-amber-500 hover:bg-amber-600"
                        onClick={() => setReviewing(doc.id)}
                      >
                        <Eye className="w-3 h-3" />
                        Revisar
                      </Button>
                    </>
                  )}

                  {doc.status === 'REVIEWING' && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs flex-1 gap-1 bg-green-600 hover:bg-green-700"
                        onClick={() => approveDoc(doc.id)}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        OK
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs gap-1 bg-red-600 hover:bg-red-700"
                        onClick={() => rejectDoc(doc.id)}
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </>
                  )}

                  {(doc.status === 'APPROVED' || doc.status === 'REJECTED') && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1 gap-1"
                      onClick={() => fileInputRefs.current[doc.id]?.click()}
                    >
                      <Upload className="w-3 h-3" />
                      Reemplazar
                    </Button>
                  )}

                  {doc.status !== 'PENDING' && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className={cn('h-7 text-xs gap-1', doc.driveUrl ? 'text-blue-600' : '')}
                        onClick={() => uploadToDrive(doc.id)}
                        disabled={uploadingDrive === doc.id || !!doc.driveUrl}
                        title={!driveEnabled ? 'Configure Google Drive' : ''}
                      >
                        {uploadingDrive === doc.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CloudUpload className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-red-500 hover:text-red-700"
                        onClick={() => removeDoc(doc.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Input oculto */}
              <input
                ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => handleInputChange(doc.id, e)}
              />
            </div>
          );
        })}
      </div>

      {/* Modal de previsualización */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <previewDoc.icon className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-slate-800 dark:text-white">{previewDoc.label}</span>
                <Badge className={cn('text-xs border', STATUS_CONFIG[previewDoc.status].color)}>
                  {STATUS_CONFIG[previewDoc.status].label}
                </Badge>
              </div>
              <div className="flex gap-2">
                {previewDoc.status === 'UPLOADED' && (
                  <Button size="sm" className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => { setReviewing(previewDoc.id); setPreviewDoc(null); }}>
                    <Eye className="w-4 h-4" /> Marcar en Revisión
                  </Button>
                )}
                {previewDoc.status === 'REVIEWING' && (
                  <>
                    <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => { approveDoc(previewDoc.id); setPreviewDoc(null); }}>
                      <CheckCircle2 className="w-4 h-4" /> Aprobar
                    </Button>
                    <Button size="sm" className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => { rejectDoc(previewDoc.id); setPreviewDoc(null); }}>
                      <XCircle className="w-4 h-4" /> Rechazar
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={() => setPreviewDoc(null)}>✕</Button>
              </div>
            </div>
            <div className="p-4 max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-50 dark:bg-slate-800">
              {previewDoc.file?.type === 'application/pdf' ? (
                <iframe src={previewDoc.previewUrl} className="w-full h-[60vh] rounded-lg" />
              ) : (
                <img
                  src={previewDoc.previewUrl}
                  alt={previewDoc.label}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leyenda */}
      {!driveEnabled && (
        <p className="text-xs text-slate-500 text-center">
          <AlertCircle className="w-3 h-3 inline mr-1" />
          Google Drive no configurado — los documentos se guardarán localmente.{' '}
          <a href="/admin/config" className="text-blue-500 underline">Configurar Drive</a>
        </p>
      )}
    </div>
  );
}
