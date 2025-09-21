
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  User, 
  CreditCard, 
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Search,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  monthlyIncome?: number;
  creditScore?: number;
}

interface LoanCalculation {
  monthlyPayment: number;
  totalInterest: number;
  totalAmount: number;
  interestRate: number;
}

const LOAN_TYPES = {
  PERSONAL: 'Personal',
  BUSINESS: 'Empresarial',
  MORTGAGE: 'Hipotecario',
  AUTO: 'Automotriz',
  EDUCATION: 'Educativo'
};

const INTEREST_RATES = {
  PERSONAL: 0.18,
  BUSINESS: 0.15,
  MORTGAGE: 0.12,
  AUTO: 0.16,
  EDUCATION: 0.14
};

export function NewLoanForm() {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Form state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Loan form data
  const [formData, setFormData] = useState({
    clientId: '',
    loanType: '',
    principalAmount: '',
    termMonths: '', // meses
    interestRate: '',
    monthlyPayment: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    notes: ''
  });
  
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);
  const [showCalculation, setShowCalculation] = useState(false);

  // Load clients
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/clients');
        if (!response.ok) throw new Error('Error al cargar clientes');
        
        const data = await response.json();
        setClients(data.clients || []);
      } catch (error) {
        console.error('Error loading clients:', error);
        toast.error('Error al cargar la lista de clientes');
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  // Filter clients based on search
  const filteredClients = clients.filter(client => 
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  // Update interest rate when loan type changes
  useEffect(() => {
    if (formData.loanType) {
      const rate = INTEREST_RATES[formData.loanType as keyof typeof INTEREST_RATES] || 0.15;
      setFormData(prev => ({ ...prev, interestRate: (rate * 100).toString() }));
    }
  }, [formData.loanType]);

  // Calculate end date when start date or termMonths changes
  useEffect(() => {
    if (formData.startDate && formData.termMonths) {
      const startDate = new Date(formData.startDate);
      const endDate = addMonths(startDate, parseInt(formData.termMonths));
      setFormData(prev => ({ ...prev, endDate: format(endDate, 'yyyy-MM-dd') }));
    }
  }, [formData.startDate, formData.termMonths]);

  // Calculate loan payments
  const calculateLoan = () => {
    console.log('Iniciando cálculo del préstamo', formData);
    
    const principal = parseFloat(formData.principalAmount);
    const rate = parseFloat(formData.interestRate) / 100 / 12; // monthly rate
    const termMonths = parseInt(formData.termMonths);

    console.log('Valores parseados:', {
      principal,
      rate: parseFloat(formData.interestRate),
      termMonths,
      rateMonthly: rate
    });

    if (!principal || principal <= 0) {
      toast.error('Por favor ingresa un monto principal válido');
      return;
    }

    if (!parseFloat(formData.interestRate) || parseFloat(formData.interestRate) <= 0) {
      toast.error('Por favor ingresa una tasa de interés válida');
      return;
    }

    if (!termMonths || termMonths <= 0) {
      toast.error('Por favor ingresa un plazo válido en meses');
      return;
    }

    try {
      // Monthly payment calculation using PMT formula
      const monthlyPayment = principal * (rate * Math.pow(1 + rate, termMonths)) / (Math.pow(1 + rate, termMonths) - 1);
      const totalAmount = monthlyPayment * termMonths;
      const totalInterest = totalAmount - principal;

      const calc: LoanCalculation = {
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        interestRate: parseFloat(formData.interestRate)
      };

      console.log('Cálculo completado:', calc);

      setCalculation(calc);
      setFormData(prev => ({ ...prev, monthlyPayment: calc.monthlyPayment.toString() }));
      setShowCalculation(true);
      toast.success('¡Préstamo calculado exitosamente!');
      
    } catch (error) {
      console.error('Error en el cálculo:', error);
      toast.error('Error al calcular el préstamo. Verifica los valores ingresados.');
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, clientId: client.id }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient) {
      toast.error('Por favor selecciona un cliente');
      return;
    }

    if (!calculation) {
      toast.error('Por favor calcula el préstamo antes de enviarlo');
      return;
    }

    try {
      setSubmitting(true);
      
      const loanData = {
        clientId: formData.clientId,
        loanType: formData.loanType,
        principalAmount: parseFloat(formData.principalAmount),
        termMonths: parseInt(formData.termMonths),
        interestRate: parseFloat(formData.interestRate) / 100,
        monthlyPayment: calculation.monthlyPayment,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        status: 'ACTIVE'
      };

      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loanData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el préstamo');
      }

      const result = await response.json();
      
      toast.success('¡Préstamo creado exitosamente!');
      router.push(`/admin/loans/${result.loan.id}`);
      
    } catch (error) {
      console.error('Error creating loan:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear el préstamo');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Selección de Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Selección de Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedClient ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar cliente por nombre, email o teléfono..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Cargando clientes...</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleClientSelect(client)}
                    >
                      <div className="font-medium">{client.firstName} {client.lastName}</div>
                      <div className="text-sm text-muted-foreground">
                        {client.email} • {client.phone}
                      </div>
                      {client.monthlyIncome && (
                        <div className="text-xs text-muted-foreground">
                          Ingresos: {formatCurrency(client.monthlyIncome)}/mes
                          {client.creditScore && ` • Score: ${client.creditScore}`}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {filteredClients.length === 0 && searchTerm && (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No se encontraron clientes</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedClient.firstName} {selectedClient.lastName}</h3>
                  <p className="text-muted-foreground">{selectedClient.email} • {selectedClient.phone}</p>
                  {selectedClient.monthlyIncome && (
                    <div className="flex gap-4 mt-2">
                      <Badge variant="outline">
                        Ingresos: {formatCurrency(selectedClient.monthlyIncome)}/mes
                      </Badge>
                      {selectedClient.creditScore && (
                        <Badge variant="outline">
                          Score: {selectedClient.creditScore}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedClient(null);
                    setFormData(prev => ({ ...prev, clientId: '' }));
                  }}
                >
                  Cambiar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información del Préstamo */}
      {selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Información del Préstamo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de Préstamo */}
              <div className="space-y-2">
                <Label htmlFor="loanType">Tipo de Préstamo *</Label>
                <Select value={formData.loanType} onValueChange={(value) => handleInputChange('loanType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de préstamo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOAN_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Monto Principal */}
              <div className="space-y-2">
                <Label htmlFor="principalAmount">Monto Principal *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="principalAmount"
                    type="number"
                    placeholder="0.00"
                    className="pl-10"
                    value={formData.principalAmount}
                    onChange={(e) => handleInputChange('principalAmount', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Plazo en meses */}
              <div className="space-y-2">
                <Label htmlFor="termMonths">Plazo (meses) *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="termMonths"
                    type="number"
                    placeholder="12"
                    className="pl-10"
                    value={formData.termMonths}
                    onChange={(e) => handleInputChange('termMonths', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Tasa de Interés */}
              <div className="space-y-2">
                <Label htmlFor="interestRate">Tasa de Interés Anual (%) *</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  placeholder="15.00"
                  value={formData.interestRate}
                  onChange={(e) => handleInputChange('interestRate', e.target.value)}
                  required
                />
              </div>

              {/* Fecha de Inicio */}
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                />
              </div>

              {/* Fecha de Fin (calculada automáticamente) */}
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  Fecha de Fin 
                  {formData.startDate && formData.termMonths && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Calculada automáticamente)
                    </span>
                  )}
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  placeholder="Fecha de finalización del préstamo"
                />
                {formData.startDate && formData.termMonths && (
                  <p className="text-xs text-muted-foreground">
                    Fecha calculada: {formData.endDate ? format(new Date(formData.endDate), "dd 'de' MMMM, yyyy", { locale: es }) : 'N/A'}
                  </p>
                )}
              </div>
            </div>



            {/* Botón de Cálculo */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={calculateLoan}
                disabled={
                  !formData.principalAmount?.trim() || 
                  !formData.termMonths?.trim() || 
                  !formData.interestRate?.trim() ||
                  parseFloat(formData.principalAmount || '0') <= 0 ||
                  parseInt(formData.termMonths || '0') <= 0 ||
                  parseFloat(formData.interestRate || '0') <= 0
                }
              >
                <Calculator className="h-4 w-4" />
                Calcular Préstamo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cálculo del Préstamo */}
      {showCalculation && calculation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Cálculo del Préstamo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground">Pago Mensual</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(calculation.monthlyPayment)}
                </p>
              </div>
              
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <CreditCard className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-muted-foreground">Total a Pagar</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(calculation.totalAmount)}
                </p>
              </div>
              
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <AlertCircle className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <p className="text-sm text-muted-foreground">Total Intereses</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(calculation.totalInterest)}
                </p>
              </div>
              
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <FileText className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-muted-foreground">Tasa de Interés</p>
                <p className="text-xl font-bold text-foreground">
                  {calculation.interestRate.toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notas Adicionales */}
      {showCalculation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notas Adicionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Agrega notas adicionales sobre el préstamo..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones de Acción */}
      {showCalculation && calculation && (
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="min-w-[120px]"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creando...
              </div>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Crear Préstamo
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
