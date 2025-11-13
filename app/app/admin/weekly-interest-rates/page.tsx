
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { PencilIcon, TrashIcon, PlusIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WeeklyInterestRate {
  id: string;
  minAmount: number;
  maxAmount: number;
  weeklyInterestRate: number;
  weeklyInterestAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function WeeklyInterestRatesPage() {
  const [rates, setRates] = useState<WeeklyInterestRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<WeeklyInterestRate | null>(null);
  const [formData, setFormData] = useState({
    minAmount: '',
    maxAmount: '',
    weeklyInterestRate: '',
    weeklyInterestAmount: '',
    isActive: true
  });

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/weekly-interest-rates');
      if (!response.ok) throw new Error('Error al cargar tasas');
      const data = await response.json();
      setRates(data);
    } catch (error) {
      console.error('Error al cargar tasas:', error);
      toast.error('Error al cargar las tasas de interés');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (rate?: WeeklyInterestRate) => {
    if (rate) {
      setEditingRate(rate);
      setFormData({
        minAmount: rate.minAmount.toString(),
        maxAmount: rate.maxAmount.toString(),
        weeklyInterestRate: rate.weeklyInterestRate.toString(),
        weeklyInterestAmount: rate.weeklyInterestAmount.toString(),
        isActive: rate.isActive
      });
    } else {
      setEditingRate(null);
      setFormData({
        minAmount: '',
        maxAmount: '',
        weeklyInterestRate: '',
        weeklyInterestAmount: '',
        isActive: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRate(null);
    setFormData({
      minAmount: '',
      maxAmount: '',
      weeklyInterestRate: '',
      weeklyInterestAmount: '',
      isActive: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingRate
        ? `/api/admin/weekly-interest-rates/${editingRate.id}`
        : '/api/admin/weekly-interest-rates';
      
      const method = editingRate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar tasa');
      }

      toast.success(editingRate ? 'Tasa actualizada correctamente' : 'Tasa creada correctamente');
      handleCloseDialog();
      loadRates();
    } catch (error) {
      console.error('Error al guardar tasa:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar tasa');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta tasa?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/weekly-interest-rates/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar tasa');
      }

      toast.success('Tasa eliminada correctamente');
      loadRates();
    } catch (error) {
      console.error('Error al eliminar tasa:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar tasa');
    }
  };

  const handleToggleActive = async (rate: WeeklyInterestRate) => {
    try {
      const response = await fetch(`/api/admin/weekly-interest-rates/${rate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !rate.isActive
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar tasa');
      }

      toast.success('Estado actualizado correctamente');
      loadRates();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar estado');
    }
  };

  const calculatePercentage = (amount: number, weeklyInterest: number): number => {
    if (amount === 0) return 0;
    return (weeklyInterest / amount) * 100;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Configuración de Tasas de Interés Semanales</h1>
        <p className="text-muted-foreground">
          Gestiona las tasas de interés semanales para préstamos con método de cálculo "Interés Semanal"
        </p>
      </div>

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-1">Sobre las tasas de interés semanales:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Estas tasas se aplican automáticamente cuando se crea un préstamo con método "Interés Semanal"</li>
              <li>El sistema busca la tasa correspondiente al monto del préstamo</li>
              <li>Si no encuentra una tasa exacta, calcula proporcionalmente o usa el 4% por defecto</li>
              <li>Solo las tasas activas se usan en los cálculos</li>
            </ul>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasas Configuradas</CardTitle>
              <CardDescription>
                {rates.length} {rates.length === 1 ? 'tasa configurada' : 'tasas configuradas'}
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nueva Tasa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando tasas...</p>
            </div>
          ) : rates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No hay tasas configuradas</p>
              <Button onClick={() => handleOpenDialog()}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Crear Primera Tasa
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rango de Montos</TableHead>
                  <TableHead>Interés Semanal</TableHead>
                  <TableHead>Porcentaje</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">
                      ${rate.minAmount.toLocaleString()} - ${rate.maxAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold">${rate.weeklyInterestAmount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">por semana</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {calculatePercentage(rate.minAmount, rate.weeklyInterestAmount).toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rate.isActive}
                          onCheckedChange={() => handleToggleActive(rate)}
                        />
                        <span className={rate.isActive ? 'text-green-600' : 'text-gray-400'}>
                          {rate.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(rate)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rate.id)}
                        >
                          <TrashIcon className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingRate ? 'Editar Tasa' : 'Nueva Tasa'}
              </DialogTitle>
              <DialogDescription>
                Configura los detalles de la tasa de interés semanal
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minAmount">Monto Mínimo *</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    step="0.01"
                    placeholder="3000"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAmount">Monto Máximo *</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    step="0.01"
                    placeholder="3000"
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weeklyInterestAmount">Interés Semanal (Pesos) *</Label>
                <Input
                  id="weeklyInterestAmount"
                  type="number"
                  step="0.01"
                  placeholder="170"
                  value={formData.weeklyInterestAmount}
                  onChange={(e) => {
                    setFormData({ ...formData, weeklyInterestAmount: e.target.value });
                    // Auto-calcular porcentaje si hay monto mínimo
                    if (formData.minAmount) {
                      const percentage = (parseFloat(e.target.value) / parseFloat(formData.minAmount)) * 100;
                      setFormData(prev => ({
                        ...prev,
                        weeklyInterestAmount: e.target.value,
                        weeklyInterestRate: percentage.toFixed(2)
                      }));
                    }
                  }}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Monto en pesos que se cobrará semanalmente
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weeklyInterestRate">Porcentaje Semanal *</Label>
                <Input
                  id="weeklyInterestRate"
                  type="number"
                  step="0.01"
                  placeholder="5.67"
                  value={formData.weeklyInterestRate}
                  onChange={(e) => setFormData({ ...formData, weeklyInterestRate: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Porcentaje de interés semanal (solo informativo)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Tasa activa</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingRate ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
