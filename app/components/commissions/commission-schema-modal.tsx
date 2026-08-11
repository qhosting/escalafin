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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Save, Percent, DollarSign, Layers } from 'lucide-react';
import { toast } from 'sonner';

interface CommissionSchemaModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  schemaToEdit?: any;
}

export function CommissionSchemaModal({
  isOpen,
  onOpenChange,
  onSuccess,
  schemaToEdit,
}: CommissionSchemaModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'ORIGINATION' | 'COLLECTION' | 'BONUS'>('ORIGINATION');
  const [ruleType, setRuleType] = useState<'PERCENTAGE' | 'FIXED' | 'TIERS'>('PERCENTAGE');
  const [percentage, setPercentage] = useState<string>('3');
  const [fixedAmount, setFixedAmount] = useState<string>('200');
  const [minAmount, setMinAmount] = useState<string>('0');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [tiers, setTiers] = useState<Array<{ minAmount: number; maxAmount: number; percentage: number }>>([
    { minAmount: 1, maxAmount: 10000, percentage: 2 },
    { minAmount: 10001, maxAmount: 50000, percentage: 3 },
  ]);

  useEffect(() => {
    if (schemaToEdit) {
      setName(schemaToEdit.name || '');
      setDescription(schemaToEdit.description || '');
      setType(schemaToEdit.type || 'ORIGINATION');
      let rules = schemaToEdit.rules;
      if (typeof rules === 'string') {
        try {
          rules = JSON.parse(rules);
        } catch (e) {
          rules = {};
        }
      }
      if (rules.tiers && rules.tiers.length > 0) {
        setRuleType('TIERS');
        setTiers(rules.tiers);
      } else if (rules.fixedAmount) {
        setRuleType('FIXED');
        setFixedAmount(rules.fixedAmount.toString());
      } else {
        setRuleType('PERCENTAGE');
        setPercentage((rules.percentage || 3).toString());
      }
      setMinAmount((rules.minAmount || 0).toString());
      setMaxAmount(rules.maxAmount ? rules.maxAmount.toString() : '');
    } else {
      setName('');
      setDescription('');
      setType('ORIGINATION');
      setRuleType('PERCENTAGE');
      setPercentage('3');
      setFixedAmount('200');
      setMinAmount('0');
      setMaxAmount('');
      setTiers([
        { minAmount: 1, maxAmount: 10000, percentage: 2 },
        { minAmount: 10001, maxAmount: 50000, percentage: 3 },
      ]);
    }
  }, [schemaToEdit, isOpen]);

  const handleAddTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier ? lastTier.maxAmount + 1 : 1;
    setTiers([...tiers, { minAmount: newMin, maxAmount: newMin + 20000, percentage: 4 }]);
  };

  const handleRemoveTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: string, value: number) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setTiers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre del esquema es obligatorio');
      return;
    }

    setLoading(true);

    try {
      const rulesData: any = {
        type,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      };

      if (ruleType === 'PERCENTAGE') {
        rulesData.percentage = parseFloat(percentage) || 0;
      } else if (ruleType === 'FIXED') {
        rulesData.fixedAmount = parseFloat(fixedAmount) || 0;
      } else if (ruleType === 'TIERS') {
        rulesData.tiers = tiers;
      }

      const url = schemaToEdit
        ? `/api/commissions/schemas/${schemaToEdit.id}`
        : '/api/commissions/schemas';

      const method = schemaToEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          type,
          rules: rulesData,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar el esquema');
      }

      toast.success(schemaToEdit ? 'Esquema actualizado correctamente' : 'Esquema creado exitosamente');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving schema:', error);
      toast.error(error.message || 'Error al guardar el esquema');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
            {schemaToEdit ? 'Editar Esquema de Comisión' : 'Nuevo Esquema de Comisión'}
          </DialogTitle>
          <DialogDescription>
            Configura las reglas para el cálculo automático de comisiones de asesores.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-xs">Nombre del Esquema *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Comisión Originación Estándar 3%"
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs">Tipo de Evento *</Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORIGINATION">Originación de Préstamo</SelectItem>
                  <SelectItem value="COLLECTION">Cobranza de Cuota / Pago</SelectItem>
                  <SelectItem value="BONUS">Bono Especial / Incentivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-xs">Descripción Opcional</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre cuándo aplica este esquema..."
              rows={2}
              className="rounded-xl text-xs"
            />
          </div>

          {/* Tipo de Regla */}
          <div className="space-y-3 border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/50">
            <Label className="font-bold text-xs block text-slate-700 dark:text-slate-300">
              Modo de Cálculo de Comisión
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={ruleType === 'PERCENTAGE' ? 'default' : 'outline'}
                onClick={() => setRuleType('PERCENTAGE')}
                className={`rounded-xl text-xs font-bold gap-1 h-9 ${
                  ruleType === 'PERCENTAGE' ? 'bg-blue-600 text-white' : ''
                }`}
              >
                <Percent className="h-3.5 w-3.5" /> Porcentaje
              </Button>

              <Button
                type="button"
                variant={ruleType === 'FIXED' ? 'default' : 'outline'}
                onClick={() => setRuleType('FIXED')}
                className={`rounded-xl text-xs font-bold gap-1 h-9 ${
                  ruleType === 'FIXED' ? 'bg-indigo-600 text-white' : ''
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" /> Fijo ($)
              </Button>

              <Button
                type="button"
                variant={ruleType === 'TIERS' ? 'default' : 'outline'}
                onClick={() => setRuleType('TIERS')}
                className={`rounded-xl text-xs font-bold gap-1 h-9 ${
                  ruleType === 'TIERS' ? 'bg-purple-600 text-white' : ''
                }`}
              >
                <Layers className="h-3.5 w-3.5" /> Escalas (Tiers)
              </Button>
            </div>

            {/* Inputs por Tipo de Regla */}
            {ruleType === 'PERCENTAGE' && (
              <div className="space-y-2 pt-2">
                <Label className="font-bold text-xs">Porcentaje de Comisión (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    placeholder="3.0"
                    className="rounded-xl pr-8 font-bold"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>
            )}

            {ruleType === 'FIXED' && (
              <div className="space-y-2 pt-2">
                <Label className="font-bold text-xs">Monto Fijo por Operación ($ MXN)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                  <Input
                    type="number"
                    min="0"
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(e.target.value)}
                    placeholder="200"
                    className="rounded-xl pl-7 font-bold"
                  />
                </div>
              </div>
            )}

            {ruleType === 'TIERS' && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <Label className="font-bold text-xs">Escalas por Monto de Operación</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleAddTier}
                    className="text-xs text-blue-600 h-7"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Añadir Rango
                  </Button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {tiers.map((tier, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <Input
                        type="number"
                        placeholder="Mínimo $"
                        value={tier.minAmount}
                        onChange={(e) => handleTierChange(idx, 'minAmount', parseFloat(e.target.value) || 0)}
                        className="rounded-lg h-8 text-xs"
                      />
                      <span>a</span>
                      <Input
                        type="number"
                        placeholder="Máximo $"
                        value={tier.maxAmount}
                        onChange={(e) => handleTierChange(idx, 'maxAmount', parseFloat(e.target.value) || 0)}
                        className="rounded-lg h-8 text-xs"
                      />
                      <span>=</span>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="%"
                        value={tier.percentage}
                        onChange={(e) => handleTierChange(idx, 'percentage', parseFloat(e.target.value) || 0)}
                        className="rounded-lg h-8 w-20 text-xs font-bold text-blue-600"
                      />
                      <span>%</span>
                      {tiers.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTier(idx)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Límites de Monto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-xs">Monto Mínimo Operación ($)</Label>
              <Input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="0"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs">Comisión Máxima Tope ($)</Label>
              <Input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="Sin tope (opcional)"
                className="rounded-xl text-xs"
              />
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
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-5"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {schemaToEdit ? 'Actualizar Esquema' : 'Guardar Esquema'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
