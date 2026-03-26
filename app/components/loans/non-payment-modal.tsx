
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Navigation,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface NonPaymentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  loan: {
    id: string;
    loanNumber: string;
    client: {
      id: string;
      firstName: string;
      lastName: string;
    };
  } | null;
  onSuccess?: () => void;
}

const VISIT_OUTCOMES = [
  { value: 'NOT_FOUND', label: '🏠 No se encontró al cliente', color: 'text-gray-600' },
  { value: 'NO_MONEY', label: '💸 No cuenta con el dinero', color: 'text-red-600' },
  { value: 'WILL_PAY_LATER', label: '🕒 Promesa de pago posterior', color: 'text-blue-600' },
  { value: 'REFUSED_TO_PAY', label: '🚫 Se negó a pagar', color: 'text-purple-600' },
  { value: 'HOUSE_CLOSED', label: '🔒 Domicilio cerrado', color: 'text-orange-600' },
  { value: 'OTHER', label: '📝 Otro motivo (especificar en notas)', color: 'text-gray-500' }
];

export function NonPaymentModal({ isOpen, onOpenChange, loan, onSuccess }: NonPaymentModalProps) {
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    outcome: 'NOT_FOUND',
    notes: '',
    promiseDate: '',
    location: 'Capturando GPS...'
  });

  // Capturar GPS al abrir
  React.useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({ ...prev, location: `${pos.coords.latitude}, ${pos.coords.longitude}` }));
        },
        () => {
          setFormData(prev => ({ ...prev, location: 'GPS no disponible' }));
        }
      );
    }
  }, [isOpen]);

  if (!loan) return null;

  const handleSubmit = async () => {
    if (!formData.notes && formData.outcome === 'OTHER') {
      toast.error('Por favor especifica el motivo en las notas');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/loans/${loan.id}/visits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: loan.client.id,
          outcome: formData.outcome,
          notes: formData.notes,
          promiseDate: formData.promiseDate || null,
          location: formData.location,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al registrar la visita');
      }

      toast.success('Visita registrada correctamente');
      onSuccess?.();
      onOpenChange(false);
      setFormData({
        outcome: 'NOT_FOUND',
        notes: '',
        promiseDate: '',
        location: 'Capturando GPS...'
      });
    } catch (error) {
      console.error(error);
      toast.error('No se pudo guardar el registro');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] gap-0 p-0 overflow-hidden border-0 shadow-2xl">
        <div className="bg-red-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Navigation className="h-6 w-6 text-white" />
            </div>
            <Badge className="bg-white/20 text-white border-0 font-black text-[10px] uppercase tracking-widest px-2">
              Gestión de Incidencias
            </Badge>
          </div>
          <DialogTitle className="text-3xl font-black tracking-tight leading-none mb-2">
            Registro No Pago
          </DialogTitle>
          <DialogDescription className="text-red-100 font-medium">
            Registre el motivo por el cual no se realizó el cobro para {loan.client.firstName}.
          </DialogDescription>
        </div>

        <div className="p-8 space-y-6 bg-white dark:bg-gray-950">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-gray-400">Resultado de la Visita</Label>
            <Select 
              value={formData.outcome} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, outcome: val }))}
            >
              <SelectTrigger className="h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 border-gray-100 font-bold text-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {VISIT_OUTCOMES.map((outcome) => (
                  <SelectItem key={outcome.value} value={outcome.value} className={cn("font-bold py-3", outcome.color)}>
                    {outcome.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-gray-400">¿Promesa de Pago?</Label>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                    <Input 
                      type="date"
                      className="h-14 rounded-2xl bg-gray-50 border-gray-100 pl-12 font-bold"
                      value={formData.promiseDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, promiseDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                </div>
            </div>
            <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-gray-400">Ubicación GPS</Label>
                <div className="flex items-center gap-2 h-14 bg-gray-50 px-4 rounded-2xl border border-dashed border-gray-200">
                    <MapPin className={cn("h-4 w-4", formData.location.includes(',') ? "text-green-500" : "text-orange-500 animate-pulse")} />
                    <span className="text-[10px] font-bold text-gray-500 truncate uppercase tracking-tighter">
                        {formData.location}
                    </span>
                </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-gray-400">Notas y Evidencia</Label>
            <Textarea 
              placeholder="Describa brevemente lo sucedido..."
              className="rounded-2xl bg-gray-50 border-gray-100 min-h-[100px] text-lg font-medium"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <DialogFooter className="pt-4 flex-col sm:flex-row gap-3">
            <Button 
                variant="outline" 
                className="h-14 rounded-2xl font-black w-full sm:flex-1"
                onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
                className="h-14 rounded-2xl font-black uppercase tracking-widest bg-red-600 hover:bg-red-700 shadow-xl shadow-red-500/20 active:scale-95 transition-all text-white w-full sm:flex-1"
                onClick={handleSubmit}
                disabled={submitting}
            >
              {submitting ? (
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-5 w-5 mr-2" />
              )}
              {submitting ? 'Guardando...' : 'Registrar Incidencia'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
