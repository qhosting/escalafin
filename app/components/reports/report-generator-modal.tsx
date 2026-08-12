'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileSpreadsheet, FileText, Calendar, Filter, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  template?: any;
  defaultDataSource?: string;
  defaultTitle?: string;
}

export function ReportGeneratorModal({
  isOpen,
  onOpenChange,
  template,
  defaultDataSource = 'loans',
  defaultTitle = 'Reporte de Préstamos'
}: ReportGeneratorModalProps) {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30days');
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [status, setStatus] = useState('all');
  const [advisorId, setAdvisorId] = useState('all');
  const [advisors, setAdvisors] = useState<any[]>([]);

  useEffect(() => {
    fetchAdvisors();
  }, []);

  const fetchAdvisors = async () => {
    try {
      const res = await fetch('/api/users?role=ASESOR');
      const data = await res.json();
      if (Array.isArray(data)) setAdvisors(data);
      else if (data.users) setAdvisors(data.users);
    } catch (e) {
      console.error('Error fetching advisors:', e);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const type = template?.config
        ? (typeof template.config === 'string' ? JSON.parse(template.config).dataSource : template.config.dataSource)
        : defaultDataSource;

      const params = new URLSearchParams({
        type: type || 'loans',
        timeRange,
        format,
        ...(status !== 'all' && { status }),
        ...(advisorId !== 'all' && { advisorId })
      });

      const exportUrl = `/api/reports/export?${params.toString()}`;
      window.open(exportUrl, '_blank');
      toast.success('Generando descarga del reporte...');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast.error('Error al solicitar la descarga del reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            Parametrizar Exportación
          </DialogTitle>
          <DialogDescription>
            {template ? template.name : defaultTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Período de Tiempo */}
          <div className="space-y-2">
            <Label className="font-bold text-xs">Período de Tiempo</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 días</SelectItem>
                <SelectItem value="30days">Últimos 30 días</SelectItem>
                <SelectItem value="90days">Últimos 90 días (Trimestre)</SelectItem>
                <SelectItem value="1year">Último Año</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Asesor */}
          <div className="space-y-2">
            <Label className="font-bold text-xs">Filtrar por Asesor</Label>
            <Select value={advisorId} onValueChange={setAdvisorId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Todos los asesores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los asesores</SelectItem>
                {advisors.map(adv => (
                  <SelectItem key={adv.id} value={adv.id}>
                    {adv.firstName} {adv.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Estado */}
          <div className="space-y-2">
            <Label className="font-bold text-xs">Estado de Registro</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="COMPLETED">Completado / Pagado</SelectItem>
                <SelectItem value="DEFAULTED">En Mora / Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Formato de Descarga */}
          <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
            <Label className="font-bold text-xs">Formato de Descarga</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={format === 'excel' ? 'default' : 'outline'}
                onClick={() => setFormat('excel')}
                className={`rounded-xl font-bold text-xs gap-2 ${
                  format === 'excel' ? 'bg-emerald-600 text-white' : ''
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" /> Excel (.xlsx)
              </Button>

              <Button
                type="button"
                variant={format === 'pdf' ? 'default' : 'outline'}
                onClick={() => setFormat('pdf')}
                className={`rounded-xl font-bold text-xs gap-2 ${
                  format === 'pdf' ? 'bg-red-600 text-white' : ''
                }`}
              >
                <FileText className="h-4 w-4" /> PDF Documento
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-5 gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Descargar Reporte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
