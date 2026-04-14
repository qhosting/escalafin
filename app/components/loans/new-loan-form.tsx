
'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
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
  TrendingUp,
  Download,
  Share2,
  RefreshCw,
  ShieldCheck,
  Table as TableIcon
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  calculateEndDate,
  calculatePorMil120,
  generateAmortizationSchedule,
  AmortizationEntry
} from '@/lib/loan-calculations';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

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

export function NewLoanForm({ loanId }: { loanId?: string }) {
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
    expectedWeeklyPayment: '', // para POR_MIL_120
    monthlyPayment: '',
    initialPayment: '', // pago inicial (informativo)
    insuranceAmount: '', // Seguro
    disbursementFee: '', // Cobro Final / Comisión
    disbursedAmount: '0', // Monto a entregar
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    notes: '',
    lateFeeType: 'DAILY_FIXED',
    lateFeeAmount: '200',
    lateFeeMaxWeekly: '800'
  });
  
  const [schedule, setSchedule] = useState<AmortizationEntry[]>([]);
  const [tenantData, setTenantData] = useState<{
    name: string;
    logo: string | null;
    primaryColor: string | null;
  } | null>(null);
  
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

  // Fetch branding
  useEffect(() => {
    fetch('/api/admin/branding')
      .then(res => res.json())
      .then(data => setTenantData(data))
      .catch(err => {
        console.error('Error fetching branding:', err);
        // Fallback to default name if error
        setTenantData({ name: 'EscalaFin', logo: null, primaryColor: null });
      });
  }, []);

  // Fetch loan data if editing
  useEffect(() => {
    const loadLoan = async () => {
      if (!loanId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/loans/${loanId}`);
        if (!response.ok) throw new Error('Error al cargar loan');
        
        const { loan } = await response.json();
        if (loan) {
          setSelectedClient(loan.client);
          setFormData({
            clientId: loan.clientId,
            loanType: loan.loanType,
            loanCalculationType: loan.loanCalculationType,
            principalAmount: loan.principalAmount.toString(),
            termMonths: loan.termMonths.toString(),
            paymentFrequency: loan.paymentFrequency,
            interestRate: (parseFloat(loan.interestRate.toString()) * 100).toString(),
            weeklyInterestAmount: loan.weeklyInterestAmount?.toString() || '',
            expectedWeeklyPayment: '', // No guardado, se recalcula si es necesario
            monthlyPayment: loan.monthlyPayment.toString(),
            initialPayment: loan.initialPayment?.toString() || '',
            startDate: format(new Date(loan.startDate), 'yyyy-MM-dd'),
            endDate: format(new Date(loan.endDate), 'yyyy-MM-dd'),
            notes: loan.notes || '',
            lateFeeType: loan.lateFeeType || 'DAILY_FIXED',
            lateFeeAmount: loan.lateFeeAmount?.toString() || '200',
            lateFeeMaxWeekly: loan.lateFeeMaxWeekly?.toString() || '800'
          });
          
          // Calcular automáticamente para mostrar el resumen
          // Nota: El cálculo se activará al cambiar el estado pero 
          // queremos asegurar que se vea el resumen de inmediato
          setCalculation({
             monthlyPayment: parseFloat(loan.monthlyPayment.toString()),
             totalInterest: parseFloat(loan.totalAmount.toString()) - parseFloat(loan.principalAmount.toString()),
             totalAmount: parseFloat(loan.totalAmount.toString()),
             interestRate: parseFloat(loan.interestRate.toString()) * 100
          });
          
          // Generar tabla
          const newSchedule = generateAmortizationSchedule({
            principalAmount: parseFloat(loan.principalAmount.toString()),
            numberOfPayments: loan.termMonths,
            paymentFrequency: loan.paymentFrequency,
            loanCalculationType: loan.loanCalculationType,
            annualInterestRate: parseFloat(loan.interestRate.toString()),
            weeklyInterestAmount: parseFloat(loan.weeklyInterestAmount?.toString() || '0'),
            startDate: new Date(loan.startDate),
            paymentAmount: parseFloat(loan.monthlyPayment.toString())
          });
          setSchedule(newSchedule);
          setShowCalculation(true);
        }
      } catch (error) {
        console.error('Error loading loan:', error);
        toast.error('No se pudieron cargar los datos del préstamo');
      } finally {
        setLoading(false);
      }
    };

    loadLoan();
  }, [loanId]);

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

  // Calculate disbursedAmount when principal, insurance or fee changes
  useEffect(() => {
    const principal = parseFloat(formData.principalAmount) || 0;
    const insurance = parseFloat(formData.insuranceAmount) || 0;
    const fee = parseFloat(formData.disbursementFee) || 0;
    const net = principal - insurance - fee;
    setFormData(prev => ({ ...prev, disbursedAmount: net.toString() }));
  }, [formData.principalAmount, formData.insuranceAmount, formData.disbursementFee]);

  // Calculate end date when start date, termMonths or frequency changes
  useEffect(() => {
    if (formData.startDate && formData.termMonths && formData.paymentFrequency) {
      const startDate = new Date(formData.startDate);
      const numPayments = parseInt(formData.termMonths);
      
      if (!isNaN(numPayments) && numPayments > 0) {
        const endDate = calculateEndDate(
          startDate, 
          numPayments, 
          formData.paymentFrequency as any
        );
        setFormData(prev => ({ ...prev, endDate: format(endDate, 'yyyy-MM-dd') }));
      }
    }
  }, [formData.startDate, formData.termMonths, formData.paymentFrequency]);

  // Calculate loan payments
  const calculateLoan = () => {
    console.log('Iniciando cálculo del préstamo', formData);
    
    const principal = parseFloat(formData.principalAmount);
    let numPayments = parseInt(formData.termMonths);
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

    if (calculationType === 'POR_MIL_120') {
      const expectedWeekly = parseFloat(formData.expectedWeeklyPayment);
      if (!expectedWeekly || expectedWeekly <= 0) {
        toast.error('Por favor ingresa un monto de pago semanal deseado mayor a 0');
        return;
      }
      
      const factor = principal / 1000;
      const totalFee = factor * 120;
      const totalAmt = principal + totalFee;
      
      // Calculate how many payments needed
      numPayments = Math.ceil(totalAmt / expectedWeekly);
      
      // Auto-update termMonths so the backend can receive it correctly
      setFormData(prev => ({ ...prev, termMonths: numPayments.toString() }));
    } else {
      if (!numPayments || numPayments <= 0) {
        toast.error('Por favor ingresa un número de pagos válido');
        return;
      }
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

      // Generar tabla de amortización preliminar con valores calculados LOCALMENTE
      // para evitar desfases con el estado asincrónico de React
      const newSchedule = generateAmortizationSchedule({
        principalAmount: principal,
        numberOfPayments: numPayments,
        paymentFrequency: frequency,
        loanCalculationType: calculationType as any,
        annualInterestRate: calculationType === 'INTERES' ? (parseFloat(formData.interestRate) / 100) : 0,
        weeklyInterestAmount: calculationType === 'INTERES_SEMANAL' 
          ? (parseFloat(formData.weeklyInterestAmount) || 0) // Si ya existe uno ingresado, usarlo
          : 0,
        startDate: new Date(formData.startDate),
        paymentAmount: calc.monthlyPayment
      });

      console.log('Tabla generada:', newSchedule.length, 'filas');

      setSchedule(newSchedule);
      setCalculation(calc);
      setFormData(prev => ({ ...prev, monthlyPayment: calc.monthlyPayment.toString() }));
      setShowCalculation(true);
      
      // Hacer scroll suave hacia el cálculo
      setTimeout(() => {
        const target = document.getElementById('calculation-result');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

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
      toast.error('Por favor pulsa "Calcular" antes de crear el préstamo');
      return;
    }

    const currentCalc = calculation;
    if (!currentCalc) return;

    try {
      setSubmitting(true);
      
      const parseSafeFloat = (val: any, def = 0) => {
        const num = parseFloat(val);
        return isNaN(num) ? def : num;
      };

      const loanData = {
        clientId: formData.clientId,
        loanType: formData.loanType,
        loanCalculationType: formData.loanCalculationType,
        principalAmount: parseSafeFloat(formData.principalAmount),
        termMonths: parseInt(formData.termMonths) || 0,
        paymentFrequency: formData.paymentFrequency,
        interestRate: formData.loanCalculationType === 'INTERES' 
          ? parseSafeFloat(formData.interestRate) / 100 
          : 0,
        weeklyInterestAmount: formData.loanCalculationType === 'INTERES_SEMANAL' && formData.weeklyInterestAmount
          ? parseSafeFloat(formData.weeklyInterestAmount)
          : null,
        monthlyPayment: currentCalc.monthlyPayment,
        initialPayment: formData.initialPayment ? parseSafeFloat(formData.initialPayment) : null,
        startDate: new Date(formData.startDate).toISOString(),
        status: 'ACTIVE',
        lateFeeType: formData.lateFeeType || 'DAILY_FIXED',
        lateFeeAmount: parseSafeFloat(formData.lateFeeAmount, 200),
        lateFeeMaxWeekly: parseSafeFloat(formData.lateFeeMaxWeekly, 800),
        insuranceAmount: formData.insuranceAmount ? parseSafeFloat(formData.insuranceAmount) : 0,
        disbursementFee: formData.disbursementFee ? parseSafeFloat(formData.disbursementFee) : 0,
        disbursedAmount: parseSafeFloat(formData.disbursedAmount)
      };

      const response = await fetch(loanId ? `/api/loans/${loanId}` : '/api/loans', {
        method: loanId ? 'PUT' : 'POST',
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
      
      toast.success(loanId ? '¡Préstamo actualizado exitosamente!' : '¡Préstamo creado exitosamente!');
      router.push(`/admin/loans/${loanId || result.loan.id}`);
      
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

  const imageUrlToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('Could not get canvas context');
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleDownloadPDF = async () => {
    if (!calculation || !selectedClient) return;

    const doc = new jsPDF();
    const margin = 14;
    let currentY = 15;
    
    // Header con logo si existe
    if (tenantData?.logo) {
      try {
        const base64Logo = await imageUrlToBase64(tenantData.logo);
        doc.addImage(base64Logo, 'PNG', margin, 12, 35, 18); // logo 
        
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235); // Primary Blue
        doc.text(tenantData?.name || 'EscalaFin', 52, 25);
        currentY = 38;
      } catch (err) {
        console.warn('Could not load logo for PDF:', err);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text(tenantData?.name || 'EscalaFin', margin, 25);
        currentY = 38;
      }
    } else {
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text(tenantData?.name || 'EscalaFin', margin, 25);
      currentY = 38;
    }

    // Subtitle & Folio (Movido hacia abajo para evitar choque)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Proyección de Crédito - Folio: APP-${format(new Date(), 'yyyyMMdd')}`, margin, currentY);
    currentY += 6;
    
    doc.setFontSize(8);
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, currentY);
    currentY += 10;
    
    // Horizontal Line
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, currentY, 196, currentY);
    currentY += 12;
    
    doc.setTextColor(0, 0, 0);

    // Client Info Section
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, 182, 30, 3, 3, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('INFORMACIÓN DEL CLIENTE', margin + 5, currentY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Nombre: ${selectedClient.firstName} ${selectedClient.lastName}`, margin + 5, currentY + 16);
    doc.text(`Teléfono: ${selectedClient.phone}`, margin + 5, currentY + 23);
    currentY += 40;
    
    // Loan Summary Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('RESUMEN DEL CRÉDITO', margin, currentY);
    currentY += 5;
    
    // Grid de resumen
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const summaryData = [
      ['Capital Solicitado:', formatCurrency(parseFloat(formData.principalAmount))],
      ['Tipo de Cálculo:', CALCULATION_TYPES[formData.loanCalculationType as keyof typeof CALCULATION_TYPES]],
      ['Frecuencia de Pagos:', PAYMENT_FREQUENCIES[formData.paymentFrequency as keyof typeof PAYMENT_FREQUENCIES]],
      ['Número total de pagos:', formData.termMonths],
      ['Cuota Periódica:', formatCurrency(calculation.monthlyPayment)],
      ['Monto Total a Devolver:', formatCurrency(calculation.totalAmount)],
      ['Costo de Interés:', formatCurrency(calculation.totalInterest)],
      ['Fecha de Primer Pago:', format(new Date(formData.startDate), 'dd/MM/yyyy')],
      ['Fecha de Finalización:', format(new Date(formData.endDate), 'dd/MM/yyyy')],
    ];

    autoTable(doc, {
      startY: currentY,
      body: summaryData,
      theme: 'plain',
      styles: { 
        fontSize: 9, 
        cellPadding: 3, 
        textColor: [30, 41, 59],
        lineColor: [241, 245, 249],
        lineWidth: 0.1
      },
      columnStyles: { 
        0: { fontStyle: 'bold', cellWidth: 50, textColor: [100, 116, 139] },
        1: { fontStyle: 'bold', halign: 'left', textColor: [15, 23, 42] }
      }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Titles
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('TABLA DE AMORTIZACIÓN PROYECTADA', margin, currentY);
    currentY += 6;
    
    const tableData = schedule.map(row => [
      row.paymentNumber.toString(),
      format(row.paymentDate, 'dd/MM/yyyy'),
      formatCurrency(row.principalPayment),
      formatCurrency(row.interestPayment),
      formatCurrency(row.totalPayment),
      formatCurrency(row.remainingBalance)
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [['#', 'Vencimiento', 'Capital', 'Interés', 'Cuota Total', 'Saldo Restante']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [37, 99, 235], 
        textColor: 255, 
        fontSize: 9, 
        fontStyle: 'bold',
        halign: 'center',
        padding: 3
      },
      styles: { 
        fontSize: 8,
        cellPadding: 2,
        valign: 'middle'
      },
      columnStyles: { 
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold', textColor: [37, 99, 235] },
        5: { halign: 'right' }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
        doc.text(`EscalaFin - El sistema líder en gestión de microcréditos`, margin, 285);
    }

    doc.save(`cotizacion_${selectedClient.lastName.toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success('PDF generado con éxito');
  };

  /*
  const handleShareWhatsApp = () => {
    if (!calculation || !selectedClient) return;

    const tenantPrefix = tenantData?.name ? `*${tenantData.name}*` : `*EscalaFin*`;

    const message = `${tenantPrefix}%0A` +
      `*Cotización de Préstamo*%0A%0A` +
      `👤 *Cliente:* ${selectedClient.firstName} ${selectedClient.lastName}%0A` +
      `💰 *Monto:* ${formatCurrency(parseFloat(formData.principalAmount))}%0A` +
      `🔢 *Pagos:* ${formData.termMonths} (${formData.paymentFrequency.toLowerCase()})%0A` +
      `💵 *Cuota:* ${formatCurrency(calculation.monthlyPayment)}%0A` +
      `📈 *Total:* ${formatCurrency(calculation.totalAmount)}%0A` +
      `📅 *Inicia:* ${format(new Date(formData.startDate), 'dd/MM/yyyy')}%0A` +
      `📅 *Termina:* ${format(new Date(formData.endDate), 'dd/MM/yyyy')}%0A%0A` +
      `¡Gracias por su preferencia!`;

    const url = `https://wa.me/${selectedClient.phone.replace(/\+/g, '')}?text=${message}`;
    window.open(url, '_blank');
  };
  */

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <Plus className="h-6 w-6 text-white" />
            </div>
            {loanId ? 'Editar Préstamo' : 'Nuevo Préstamo'}
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            {loanId ? 'Edita los parámetros de la línea de crédito activa.' : 'Configura y activa una nueva línea de crédito para un cliente.'}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="rounded-xl border-gray-200 hover:bg-gray-50 transition-all font-bold"
        >
          Cancelar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Columna Izquierda: Formulario ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta de Cliente */}
          <Card className="rounded-2xl border-none shadow-sm overflow-hidden ring-1 ring-gray-100">
            <CardHeader className="bg-gray-50/50 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Selección de Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {!selectedClient ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, teléfono o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-gray-50 border-gray-200 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                      <div className="col-span-2 py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                        Cargando clientes...
                      </div>
                    ) : filteredClients.length > 0 ? (
                      filteredClients.map(client => (
                        <div
                          key={client.id}
                          onClick={() => handleClientSelect(client)}
                          className="p-4 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all flex items-center gap-3 group"
                        >
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-gray-100">
                            <AvatarFallback className="bg-blue-100 h-full w-full flex items-center justify-center font-bold text-blue-700 text-xs">
                              {client.firstName[0]}{client.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 group-hover:text-blue-700 transition-colors uppercase truncate">
                              {client.firstName} {client.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <DollarSign className="h-3 w-3" /> {client.phone}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-8 text-center text-muted-foreground bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                        {searchTerm ? 'No se encontraron clientes.' : 'Comienza a escribir para buscar.'}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-4 border-white shadow-sm">
                      <AvatarFallback className="bg-blue-600 h-full w-full flex items-center justify-center font-bold text-white text-lg">
                        {selectedClient.firstName[0]}{selectedClient.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none">
                        {selectedClient.firstName} {selectedClient.lastName}
                      </p>
                      <p className="text-sm text-blue-600 font-bold mt-1">
                        ID: {selectedClient.id.substring(0, 8).toUpperCase()} • {selectedClient.phone}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                        setSelectedClient(null);
                        setCalculation(null);
                        setShowCalculation(false);
                        setSchedule([]);
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl font-bold"
                  >
                    Cambiar Cliente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuración del Préstamo */}
          <Card className={cn(
            "rounded-2xl border-none shadow-sm ring-1 ring-gray-100 overflow-hidden transition-all duration-300",
            !selectedClient && "opacity-50 pointer-events-none grayscale"
          )}>
            <CardHeader className="bg-gray-50/50 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                Parámetros Financieros
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Tipo de Préstamo</Label>
                  <EnhancedSelect
                    value={formData.loanType}
                    onValueChange={(val) => handleInputChange('loanType', val)}
                    placeholder="Selecciona el tipo..."
                    items={Object.entries(LOAN_TYPES).map(([k, v]) => ({ value: k, label: v }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Método de Cálculo</Label>
                  <EnhancedSelect
                    value={formData.loanCalculationType}
                    onValueChange={(val) => {
                      handleInputChange('loanCalculationType', val);
                      setCalculation(null);
                      setShowCalculation(false);
                    }}
                    placeholder="Tipo de cálculo..."
                    items={Object.entries(CALCULATION_TYPES).map(([k, v]) => ({ value: k, label: v }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
                <div className="space-y-2 lg:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Monto del Préstamo (Capital)</Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-blue-50 rounded-lg group-focus-within:bg-blue-600 transition-colors">
                      <DollarSign className="h-4 w-4 text-blue-600 group-focus-within:text-white" />
                    </div>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.principalAmount}
                      onChange={(e) => handleInputChange('principalAmount', e.target.value)}
                      className="h-14 pl-14 text-xl font-bold bg-white border-2 border-gray-100 focus:border-blue-500 rounded-2xl transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    {formData.loanCalculationType === 'POR_MIL_120' ? 'Pago Semanal Deseado' : 'Num. Pagos'}
                  </Label>
                  {formData.loanCalculationType === 'POR_MIL_120' ? (
                    <Input
                      type="number"
                      placeholder="Ej: 500"
                      value={formData.expectedWeeklyPayment}
                      onChange={(e) => handleInputChange('expectedWeeklyPayment', e.target.value)}
                      className="h-14 font-bold border-2 border-gray-100 focus:border-blue-500 rounded-2xl"
                    />
                  ) : (
                    <Input
                      type="number"
                      placeholder="Ej: 12"
                      value={formData.termMonths}
                      onChange={(e) => handleInputChange('termMonths', e.target.value)}
                      className="h-14 font-bold border-2 border-gray-100 focus:border-blue-500 rounded-2xl"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Frecuencia</Label>
                  <EnhancedSelect
                    value={formData.paymentFrequency}
                    onValueChange={(val) => handleInputChange('paymentFrequency', val)}
                    placeholder="Frecuencia..."
                    disabled={formData.loanCalculationType === 'INTERES_SEMANAL' || formData.loanCalculationType === 'POR_MIL_120'}
                    items={Object.entries(PAYMENT_FREQUENCIES).map(([k, v]) => ({ value: k, label: v }))}
                  />
                </div>
              </div>

              {/* Deducciones de Desembolso */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Seguro (Deducción)</Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 group-focus-within:text-blue-600">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <Input
                      type="number"
                      placeholder="Ej: 150"
                      value={formData.insuranceAmount}
                      onChange={(e) => handleInputChange('insuranceAmount', e.target.value)}
                      className="h-11 pl-10 font-bold bg-white border-gray-200 focus:border-blue-500 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Cobro Final / Comis.</Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 group-focus-within:text-blue-600">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <Input
                      type="number"
                      placeholder="Ej: 600"
                      value={formData.disbursementFee}
                      onChange={(e) => handleInputChange('disbursementFee', e.target.value)}
                      className="h-11 pl-10 font-bold bg-white border-gray-200 focus:border-blue-500 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-blue-700 ml-1">Total a Desembolsar</Label>
                  <div className="h-11 flex items-center px-4 bg-blue-100/50 border border-blue-200 rounded-xl text-lg font-black text-blue-800">
                    {formatCurrency(parseFloat(formData.disbursedAmount))}
                  </div>
                </div>
              </div>


              {/* Parámetros específicos según cálculo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/30 p-5 rounded-2xl border border-blue-50/50">
                {formData.loanCalculationType === 'INTERES' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-blue-600">
                      Tasa de Interés Anual (%)
                    </Label>
                    <div className="relative">
                      <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                      <Input
                        type="number"
                        placeholder="18.0"
                        value={formData.interestRate}
                        onChange={(e) => handleInputChange('interestRate', e.target.value)}
                        className="pl-10 h-11 font-bold border-blue-100"
                      />
                    </div>
                  </div>
                )}

                {formData.loanCalculationType === 'INTERES_SEMANAL' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-blue-600">
                      Monto de Interés Fijo (Semanal)
                    </Label>
                    <div className="relative">
                      <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                      <Input
                        type="number"
                        placeholder="Ej: 100"
                        value={formData.weeklyInterestAmount}
                        onChange={(e) => handleInputChange('weeklyInterestAmount', e.target.value)}
                        className="pl-10 h-11 font-bold border-blue-100"
                      />
                    </div>
                    {suggestedWeeklyRate && (
                      <p className="text-[10px] text-blue-600 font-bold ml-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Sugerido: {formatCurrency(suggestedWeeklyRate.amount)} ({suggestedWeeklyRate.rate}%)
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-blue-600">Fecha de Inicio / Primer Pago</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="pl-10 h-11 font-bold border-blue-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button"
                  onClick={calculateLoan}
                  className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 font-black text-lg transition-all"
                >
                  <Calculator className="h-5 w-5 mr-2" />
                  Calcular Préstamo
                </Button>
                {showCalculation && (
                   <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadPDF}
                    className="h-14 px-6 rounded-2xl border-gray-200 font-bold"
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Columna Derecha: Sticky Resumen ── */}
        <div className="space-y-6">
          {/* Configuración de Mora (Inline) */}
          <Card className={cn(
            "rounded-2xl border-none shadow-sm ring-1 ring-gray-100 overflow-hidden",
            !selectedClient && "opacity-50 pointer-events-none grayscale"
          )}>
            <CardHeader className="bg-orange-50/50 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Configuración de Moras
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Monto de Mora (Diario)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-orange-400" />
                  <Input
                    type="number"
                    value={formData.lateFeeAmount}
                    onChange={(e) => handleInputChange('lateFeeAmount', e.target.value)}
                    className="pl-8 h-9 font-bold bg-orange-50/20 border-orange-100 focus:border-orange-500 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Límite Semanal de Mora</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-orange-400" />
                  <Input
                    type="number"
                    value={formData.lateFeeMaxWeekly}
                    onChange={(e) => handleInputChange('lateFeeMaxWeekly', e.target.value)}
                    className="pl-8 h-9 font-bold bg-orange-50/20 border-orange-100 focus:border-orange-500 rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {showCalculation && calculation && (
            <div className="sticky top-6 space-y-6">
              <Card id="calculation-result" className="rounded-3xl border-none bg-gray-900 text-white shadow-2xl overflow-hidden ring-4 ring-white">
                <CardHeader className="pb-2">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Resumen de Proyección</p>
                  <CardTitle className="text-3xl font-black mt-1 flex items-baseline gap-2">
                    {formatCurrency(calculation.monthlyPayment)}
                    <span className="text-sm font-medium text-gray-400">/{formData.paymentFrequency.toLowerCase().substring(0, 3)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Capital</p>
                      <p className="text-sm font-black">{formatCurrency(parseFloat(formData.principalAmount))}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Interés Total</p>
                      <p className="text-sm font-black text-green-400">{formatCurrency(calculation.totalInterest)}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Num. Pagos</p>
                      <p className="text-sm font-black">{formData.termMonths}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Tasa Efectiva</p>
                      <p className="text-sm font-black text-blue-400">{calculation.interestRate.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="py-2">
                     <Separator className="bg-white/10" />
                  </div>
                  
                  <div className="flex justify-between items-center bg-blue-600/20 p-4 rounded-2xl border border-white/10 shadow-inner">
                    <span className="text-sm font-bold text-blue-100">MONTO TOTAL</span>
                    <span className="text-xl font-black text-white">{formatCurrency(calculation.totalAmount)}</span>
                  </div>

                  <Button 
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full h-14 rounded-2xl bg-white text-gray-900 hover:bg-gray-100 font-black text-lg transition-transform active:scale-95 shadow-xl"
                  >
                    {submitting ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                        {loanId ? 'Actualizar Préstamo' : 'Activar Préstamo'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-none bg-blue-50/50 p-4">
                <div className="flex gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-xs text-blue-900 leading-relaxed font-medium">
                    Al activar este préstamo, se generaráautomáticamente el plan de pagos y el cliente recibirá una notificación.
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabla de Amortización (Si hay cálculo) ── */}
      {showCalculation && schedule.length > 0 && (
        <Card className="rounded-2xl border-none shadow-sm ring-1 ring-gray-100 overflow-hidden mt-8">
          <CardHeader className="bg-gray-50/50 py-4 px-6 flex flex-row items-center justify-between border-b border-gray-100">
            <CardTitle className="text-base font-bold flex items-center gap-2 tracking-tight">
              <TableIcon className="h-4 w-4 text-blue-600" />
              Cronograma de Pagos Proyectado
            </CardTitle>
            <Badge variant="outline" className="bg-white font-black text-blue-700 rounded-full py-1">
              {schedule.length} CUOTAS
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-[80px] text-center font-bold text-[10px] uppercase">No.</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Vencimiento</TableHead>
                    <TableHead className="text-right font-bold text-[10px] uppercase">Capital</TableHead>
                    <TableHead className="text-right font-bold text-[10px] uppercase">Interés</TableHead>
                    <TableHead className="text-right font-bold text-[10px] uppercase">Cuota Total</TableHead>
                    <TableHead className="text-right font-bold text-[10px] uppercase">Saldo Final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((row) => (
                    <TableRow key={row.paymentNumber} className="hover:bg-blue-50/30 transition-colors border-gray-50">
                      <TableCell className="text-center font-bold text-gray-500">{row.paymentNumber}</TableCell>
                      <TableCell className="font-medium">{format(row.paymentDate, 'dd/MM/yyyy', { locale: es })}</TableCell>
                      <TableCell className="text-right text-gray-600">{formatCurrency(row.principalPayment)}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">{formatCurrency(row.interestPayment)}</TableCell>
                      <TableCell className="text-right font-black text-gray-900">{formatCurrency(row.totalPayment)}</TableCell>
                      <TableCell className="text-right font-semibold text-gray-400">{formatCurrency(row.remainingBalance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <div className="bg-gray-50 p-4 flex justify-center border-t border-gray-100">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDownloadPDF}
                className="text-blue-600 font-bold hover:bg-blue-100 rounded-xl"
            >
                <Download className="h-4 w-4 mr-2" />
                Descargar Tabla Completa (PDF)
            </Button>
          </div>
        </Card>
      )}
      
      {/* ── Padding inferior extra ── */}
      <div className="h-10" />
    </div>
  );
}