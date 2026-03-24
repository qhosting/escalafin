
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { EnhancedSelect } from '@/components/ui/enhanced-select';
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
  Plus,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  calculateInterestBasedPayment, 
  calculateFixedFeePayment,
  calculateWeeklyInterestPayment,
  getWeeklyInterestAmount,
  getPaymentsPerYear,
  calculateEndDate,
  calculatePorMil120
} from '@/lib/loan-calculations';

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

const PAYMENT_FREQUENCIES = {
  SEMANAL: 'Semanal (52 pagos/año)',
  CATORCENAL: 'Catorcenal (26 pagos/año)',
  QUINCENAL: 'Quincenal (24 pagos/año)',
  MENSUAL: 'Mensual (12 pagos/año)'
};

const CALCULATION_TYPES = {
  INTERES: 'Con Interés (Tasa Anual)',
  TARIFA_FIJA: 'Tarifa Fija por Monto',
  INTERES_SEMANAL: 'Interés Semanal sobre Capital',
  POR_MIL_120: '$120 por cada $1,000 de capital (Semanal)'
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
    loanCalculationType: 'INTERES', // INTERES, TARIFA_FIJA o INTERES_SEMANAL
    principalAmount: '',
    termMonths: '', // número de pagos
    paymentFrequency: 'MENSUAL',
    interestRate: '',
    weeklyInterestAmount: '', // para INTERES_SEMANAL
    monthlyPayment: '',
    initialPayment: '', // pago inicial (informativo)
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    notes: '',
    lateFeeType: 'DAILY_FIXED',
    lateFeeAmount: '200',
    lateFeeMaxWeekly: '800'
  });
  
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);
  const [showCalculation, setShowCalculation] = useState(false);
  const [suggestedWeeklyRate, setSuggestedWeeklyRate] = useState<{
    amount: number;
    rate: number;
    isCalculated: boolean;
  } | null>(null);

  // Fetch suggested weekly interest rate when amount changes
  useEffect(() => {
    const fetchSuggestedRate = async () => {
      if (formData.loanCalculationType !== 'INTERES_SEMANAL') {
        setSuggestedWeeklyRate(null);
        return;
      }

      const amount = parseFloat(formData.principalAmount);
      if (!amount || amount <= 0) {
        setSuggestedWeeklyRate(null);
        return;
      }

      try {
        const response = await fetch(`/api/admin/weekly-interest-rates/find-for-amount?amount=${amount}`);
        if (!response.ok) {
          console.warn('No se encontró tasa configurada para este monto');
          setSuggestedWeeklyRate(null);
          return;
        }

        const data = await response.json();
        setSuggestedWeeklyRate({
          amount: parseFloat(data.weeklyInterestAmount.toString()),
          rate: parseFloat(data.weeklyInterestRate?.toString() || '0'),
          isCalculated: data.isCalculated || false
        });

        // Auto-llenar si no hay valor previo
        if (!formData.weeklyInterestAmount) {
          setFormData(prev => ({
            ...prev,
            weeklyInterestAmount: data.weeklyInterestAmount.toString()
          }));
        }
      } catch (error) {
        console.error('Error al buscar tasa sugerida:', error);
        setSuggestedWeeklyRate(null);
      }
    };

    // Debounce para evitar múltiples llamadas
    const timer = setTimeout(fetchSuggestedRate, 500);
    return () => clearTimeout(timer);
  }, [formData.principalAmount, formData.loanCalculationType]);

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

  // Calculate end date when start date, termMonths or frequency changes
  useEffect(() => {
    if (formData.startDate && formData.termMonths && formData.paymentFrequency) {
      const startDate = new Date(formData.startDate);
      const numPayments = parseInt(formData.termMonths);
      
      // Calculate total months based on payment frequency
      let totalMonths = 0;
      switch (formData.paymentFrequency) {
        case 'SEMANAL':
          totalMonths = Math.ceil((numPayments * 7) / 30);
          break;
        case 'CATORCENAL':
          totalMonths = Math.ceil((numPayments * 14) / 30);
          break;
        case 'QUINCENAL':
          totalMonths = Math.ceil((numPayments * 15) / 30);
          break;
        case 'MENSUAL':
        default:
          totalMonths = numPayments;
          break;
      }
      
      const endDate = addMonths(startDate, totalMonths);
      setFormData(prev => ({ ...prev, endDate: format(endDate, 'yyyy-MM-dd') }));
    }
  }, [formData.startDate, formData.termMonths, formData.paymentFrequency]);

  // Calculate loan payments
  const calculateLoan = () => {
    console.log('Iniciando cálculo del préstamo', formData);
    
    const principal = parseFloat(formData.principalAmount);
    const numPayments = parseInt(formData.termMonths);
    const frequency = formData.paymentFrequency as 'SEMANAL' | 'CATORCENAL' | 'QUINCENAL' | 'MENSUAL';
    const calculationType = formData.loanCalculationType;

    let monthlyPayment = 0;
    let totalAmount = 0;
    let totalInterest = 0;
    let interestRate = 0;

    // Validaciones básicas
    if (!principal || principal <= 0) {
      toast.error('Por favor ingresa un monto principal válido');
      return;
    }

    if (!numPayments || numPayments <= 0) {
      toast.error('Por favor ingresa un número de pagos válido');
      return;
    }

    try {
      if (calculationType === 'INTERES') {
        // Método de interés tradicional
        const annualRate = parseFloat(formData.interestRate) / 100;
        
        if (!annualRate || annualRate < 0) {
          toast.error('Por favor ingresa una tasa de interés válida');
          return;
        }

        monthlyPayment = calculateInterestBasedPayment(
          principal,
          annualRate,
          numPayments,
          frequency
        );
        totalAmount = monthlyPayment * numPayments;
        totalInterest = totalAmount - principal;
        interestRate = parseFloat(formData.interestRate);

      } else if (calculationType === 'TARIFA_FIJA') {
        // Método de tarifa fija
        const result = calculateFixedFeePayment(principal, numPayments);
        monthlyPayment = result.paymentAmount;
        totalAmount = result.totalAmount;
        totalInterest = result.totalFee;
        
        // Calcular tasa efectiva para referencia
        if (totalInterest > 0) {
          interestRate = (totalInterest / principal) * 100;
        }
      } else if (calculationType === 'INTERES_SEMANAL') {
        // Método de interés semanal
        const weeklyInt = formData.weeklyInterestAmount 
          ? parseFloat(formData.weeklyInterestAmount)
          : undefined;
        
        const result = calculateWeeklyInterestPayment(principal, numPayments, weeklyInt);
        monthlyPayment = result.paymentAmount;
        totalAmount = result.totalAmount;
        totalInterest = result.totalCharge;
        interestRate = result.effectiveRate;

        // Actualizar el formulario con el interés semanal calculado
        if (!formData.weeklyInterestAmount) {
          setFormData(prev => ({ 
            ...prev, 
            weeklyInterestAmount: result.weeklyInterest.toString() 
          }));
        }
      } else if (calculationType === 'POR_MIL_120') {
        // Método de $120 por cada $1,000
        const result = calculatePorMil120(principal, numPayments);
        monthlyPayment = result.paymentAmount;
        totalAmount = result.totalAmount;
        totalInterest = result.totalFee;
        
        // Calcular tasa efectiva para referencia
        if (totalInterest > 0) {
          interestRate = (totalInterest / principal) * 100;
        }
      }

      const calc: LoanCalculation = {
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        interestRate: Math.round(interestRate * 100) / 100
      };

      console.log('Cálculo completado:', calc);

      setCalculation(calc);
      setFormData(prev => ({ ...prev, monthlyPayment: calc.monthlyPayment.toString() }));
      setShowCalculation(true);
      
      if (calculationType === 'TARIFA_FIJA') {
        toast.success(`¡Préstamo calculado! ${numPayments} pagos de $${calc.monthlyPayment.toFixed(2)}`);
      } else {
        toast.success('¡Préstamo calculado exitosamente!');
      }
      
    } catch (error) {
      console.error('Error en el cálculo:', error);
      toast.error('Error al calcular el préstamo. Verifica los valores ingresados.');
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, clientId: client.id }));

    // Fetch full client details for late fee settings
    fetch(`/api/clients/${client.id}`)
      .then(res => res.json())
      .then(data => {
        setFormData(prev => ({
          ...prev,
          lateFeeType: data.lateFeeType || 'DAILY_FIXED',
          lateFeeAmount: data.lateFeeAmount?.toString() || '200',
          lateFeeMaxWeekly: data.lateFeeMaxWeekly?.toString() || '800'
        }));
      })
      .catch(err => console.error('Error fetching client late fee settings:', err));
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
      const principal = parseFloat(formData.principalAmount);
      const numPayments = parseInt(formData.termMonths);
      
      if (principal > 0 && numPayments > 0) {
        // Intentar calcular automáticamente antes de fallar
        calculateLoan();
      } else {
        toast.error('Por favor completa los campos del préstamo y pulsa "Calcular"');
        return;
      }
    }

    try {
      setSubmitting(true);
      
      const loanData = {
        clientId: formData.clientId,
        loanType: formData.loanType,
        loanCalculationType: formData.loanCalculationType,
        principalAmount: parseFloat(formData.principalAmount),
        termMonths: parseInt(formData.termMonths),
        paymentFrequency: formData.paymentFrequency,
        interestRate: formData.loanCalculationType === 'INTERES' 
          ? parseFloat(formData.interestRate) / 100 
          : 0,
        weeklyInterestAmount: formData.loanCalculationType === 'INTERES_SEMANAL' && formData.weeklyInterestAmount
          ? parseFloat(formData.weeklyInterestAmount)
          : null,
        monthlyPayment: calculation.monthlyPayment,
        initialPayment: formData.initialPayment ? parseFloat(formData.initialPayment) : null,
        startDate: new Date(formData.startDate).toISOString(),
        status: 'ACTIVE',
        lateFeeType: formData.lateFeeType,
        lateFeeAmount: parseFloat(formData.lateFeeAmount),
        lateFeeMaxWeekly: parseFloat(formData.lateFeeMaxWeekly)
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
              <EnhancedSelect
                label="Tipo de Préstamo"
                required
                placeholder="Selecciona el tipo de préstamo"
                hint="El tipo determina la tasa de interés automáticamente"
                value={formData.loanType}
                onValueChange={(value) => handleInputChange('loanType', value)}
              >
                {Object.entries(LOAN_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </EnhancedSelect>

              {/* Tipo de Cálculo */}
              <EnhancedSelect
                label="Tipo de Cálculo"
                required
                placeholder="Selecciona el método de cálculo"
                hint="Interés: tasa anual. Tarifa Fija: cargo fijo por monto prestado"
                value={formData.loanCalculationType}
                onValueChange={(value) => {
                  handleInputChange('loanCalculationType', value);
                  // Si selecciona POR_MIL_120, poner frecuencia SEMANAL por defecto como pidió el usuario
                  if (value === 'POR_MIL_120') {
                    handleInputChange('paymentFrequency', 'SEMANAL');
                  }
                }}
              >
                {Object.entries(CALCULATION_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </EnhancedSelect>

              {/* Monto Principal */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="input-label required-field">Monto Principal</span>
                </div>
                <EnhancedInput
                  type="number"
                  step="0.01"
                  example="50000.00"
                  hint="Monto total del préstamo que se otorgará al cliente"
                  value={formData.principalAmount}
                  onChange={(e) => handleInputChange('principalAmount', e.target.value)}
                  required
                />
              </div>

              {/* Periodicidad de Pago */}
              <EnhancedSelect
                label="Periodicidad de Pago"
                required
                placeholder="Selecciona la periodicidad"
                hint="Frecuencia con la que se realizarán los pagos"
                value={formData.paymentFrequency}
                onValueChange={(value) => handleInputChange('paymentFrequency', value)}
              >
                {Object.entries(PAYMENT_FREQUENCIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </EnhancedSelect>

              {/* Número de Pagos */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="input-label required-field">Número de Pagos</span>
                </div>
                <EnhancedInput
                  type="number"
                  example="12"
                  hint={`Número total de pagos según periodicidad seleccionada (${PAYMENT_FREQUENCIES[formData.paymentFrequency as keyof typeof PAYMENT_FREQUENCIES]})`}
                  value={formData.termMonths}
                  onChange={(e) => handleInputChange('termMonths', e.target.value)}
                  required
                />
              </div>

              {/* Tasa de Interés - Solo para método de interés */}
              {formData.loanCalculationType === 'INTERES' && (
                <EnhancedInput
                  label="Tasa de Interés Anual (%)"
                  type="number"
                  step="0.01"
                  example="18.50"
                  hint="Tasa anual de interés (se calcula automáticamente según el tipo de préstamo)"
                  value={formData.interestRate}
                  onChange={(e) => handleInputChange('interestRate', e.target.value)}
                  required
                />
              )}

              {/* Info para Tarifa Fija */}
              {formData.loanCalculationType === 'TARIFA_FIJA' && (
                <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Sistema de Tarifa Fija
                  </h4>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• $3,000 o menos: $300 por pago</li>
                    <li>• $4,000: $425 por pago</li>
                    <li>• $5,000: $600 por pago</li>
                    <li>• Más de $5,000: +$120 por cada mil adicional</li>
                  </ul>
                </div>
              )}

              {/* Info para POR_MIL_120 */}
              {formData.loanCalculationType === 'POR_MIL_120' && (
                <div className="space-y-2 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-100 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Sistema de $120 por cada $1,000
                  </h4>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    Se cobra una cuota fija de $120 por cada $1,000 prestados en cada pago semanal.
                  </p>
                  <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1 mt-2">
                    <li>• $1,000 prestados = $120 de pago.</li>
                    <li>• $5,000 prestados = $600 de pago.</li>
                    <li>• $10,000 prestados = $1,200 de pago.</li>
                  </ul>
                </div>
              )}

              {/* Campo de Interés Semanal */}
              {formData.loanCalculationType === 'INTERES_SEMANAL' && (
                <div className="space-y-3">
                  {/* Mostrar tasa sugerida si está disponible */}
                  {suggestedWeeklyRate && (
                    <div className="space-y-2 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Tasa Sugerida {suggestedWeeklyRate.isCalculated && '(calculada proporcionalmente)'}
                      </h4>
                      <div className="space-y-1">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          <span className="font-semibold">Interés Semanal:</span> ${suggestedWeeklyRate.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Equivale al {suggestedWeeklyRate.rate.toFixed(2)}% del monto prestado
                        </p>
                        {suggestedWeeklyRate.isCalculated && (
                          <p className="text-xs text-green-600 dark:text-green-400 italic">
                            * Esta tasa fue calculada proporcionalmente ya que no hay una configuración exacta para este monto
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Si no hay tasa sugerida, mostrar tabla de referencia */}
                  {!suggestedWeeklyRate && formData.principalAmount && parseFloat(formData.principalAmount) > 0 && (
                    <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                      <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Tabla de Referencia
                      </h4>
                      <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                        <li>• $3,000: $170/semana (5.67%)</li>
                        <li>• $4,000: $200/semana (5.00%)</li>
                        <li>• $5,000: $230/semana (4.60%)</li>
                        <li>• $6,000: $260/semana (4.34%)</li>
                        <li>• $7,000: $291/semana (4.15%)</li>
                        <li>• $8,000+: proporcional (aprox. 4.00%)</li>
                      </ul>
                    </div>
                  )}
                  
                  <EnhancedInput
                    label="Interés Semanal (pesos)"
                    type="number"
                    step="0.01"
                    example={suggestedWeeklyRate ? suggestedWeeklyRate.amount.toString() : "170.00"}
                    hint={suggestedWeeklyRate 
                      ? "Tasa sugerida basada en configuración. Puedes modificarla si es necesario" 
                      : "Se calcula automáticamente según el monto, pero puedes modificarlo si es necesario"
                    }
                    value={formData.weeklyInterestAmount}
                    onChange={(e) => handleInputChange('weeklyInterestAmount', e.target.value)}
                  />
                </div>
              )}

              {/* Pago Inicial */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="input-label">Pago Inicial (Opcional)</span>
                </div>
                <EnhancedInput
                  type="number"
                  step="0.01"
                  example="5000.00"
                  hint="Depósito en garantía o pago inicial (informativo, no afecta el cálculo del préstamo)"
                  value={formData.initialPayment}
                  onChange={(e) => handleInputChange('initialPayment', e.target.value)}
                />
              </div>

              {/* Fecha de Inicio */}
              <EnhancedInput
                label="Fecha de Inicio"
                type="date"
                required
                hint="Fecha en que inicia el préstamo y se activa la primera cuota"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
              />

              {/* Fecha de Fin (calculada automáticamente) */}
              <div className="space-y-2">
                <Label htmlFor="endDate" className="input-label">
                  Fecha de Fin 
                  {formData.startDate && formData.termMonths && (
                    <span className="system-text ml-2">
                      (Calculada automáticamente)
                    </span>
                  )}
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  className="user-input"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  placeholder="Fecha de finalización del préstamo"
                />
                {formData.startDate && formData.termMonths && (
                  <p className="example-hint">
                    📅 Fecha calculada: {formData.endDate ? format(new Date(formData.endDate), "dd 'de' MMMM, yyyy", { locale: es }) : 'N/A'}
                  </p>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Configuración de Moratorios */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-orange-600">
                <TrendingUp className="h-4 w-4" />
                Configuración de Moratorios (Multas por impago)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <EnhancedSelect
                  label="Tipo de Moratorio"
                  value={formData.lateFeeType}
                  onValueChange={(value) => handleInputChange('lateFeeType', value)}
                >
                  <SelectItem value="DAILY_FIXED">Monto Fijo por Día</SelectItem>
                  <SelectItem value="PERCENTAGE">Porcentaje sobre Saldo</SelectItem>
                  <SelectItem value="NONE">Sin Moratorios</SelectItem>
                </EnhancedSelect>

                {formData.lateFeeType !== 'NONE' && (
                  <>
                    <EnhancedInput
                      label={formData.lateFeeType === 'DAILY_FIXED' ? 'Monto Pesos/Día' : 'Porcentaje (%)'}
                      type="number"
                      value={formData.lateFeeAmount}
                      onChange={(e) => handleInputChange('lateFeeAmount', e.target.value)}
                      placeholder={formData.lateFeeType === 'DAILY_FIXED' ? "200" : "5"}
                    />
                    
                    {formData.lateFeeType === 'DAILY_FIXED' && (
                      <EnhancedInput
                        label="Máximo por Semana ($)"
                        type="number"
                        value={formData.lateFeeMaxWeekly}
                        onChange={(e) => handleInputChange('lateFeeMaxWeekly', e.target.value)}
                        placeholder="800"
                        hint={`💡 Sugerido: $${formData.lateFeeMaxWeekly || '800'} por semana`}
                      />
                    )}
                  </>
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
                  parseFloat(formData.principalAmount || '0') <= 0 ||
                  parseInt(formData.termMonths || '0') <= 0 ||
                  (formData.loanCalculationType === 'INTERES' && (
                    !formData.interestRate?.trim() ||
                    parseFloat(formData.interestRate || '0') <= 0
                  ))
                }
              >
                <Calculator className="h-4 w-4" />
                {calculation ? 'Recalcular Préstamo' : 'Calcular Préstamo'}
              </Button>
            </div>
            
            {/* Mensaje de ayuda si el botón está desactivado */}
            {!calculation && (
              <p className="text-xs text-center text-muted-foreground mt-2 italic">
                {!formData.principalAmount || parseFloat(formData.principalAmount) <= 0 
                  ? "Ingresa el monto principal para habilitar el cálculo" 
                  : !formData.termMonths || parseInt(formData.termMonths) <= 0
                  ? "Ingresa el número de pagos para habilitar el cálculo"
                  : ""}
              </p>
            )}
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
                <p className="text-sm text-muted-foreground">
                  Monto por Pago ({PAYMENT_FREQUENCIES[formData.paymentFrequency as keyof typeof PAYMENT_FREQUENCIES].split(' ')[0]})
                </p>
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
                {formData.initialPayment && parseFloat(formData.initialPayment) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    + {formatCurrency(parseFloat(formData.initialPayment))} inicial
                  </p>
                )}
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
                <p className="text-sm text-muted-foreground">
                  {formData.loanCalculationType === 'INTERES' ? 'Tasa de Interés' : 'Tasa Efectiva'}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {calculation.interestRate.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.termMonths} pagos • {CALCULATION_TYPES[formData.loanCalculationType as keyof typeof CALCULATION_TYPES]}
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
              <Label htmlFor="notes" className="input-label">Notas Adicionales (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Ej: Cliente referido por Juan Pérez, historial crediticio excelente..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="user-input"
              />
              <p className="example-hint">
                💡 Incluye información relevante sobre el cliente, garantías, condiciones especiales, etc.
              </p>
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
