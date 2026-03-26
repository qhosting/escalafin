
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
  Table as TableIcon
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
    expectedWeeklyPayment: '', // para POR_MIL_120
    monthlyPayment: '',
    initialPayment: '', // pago inicial (informativo)
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
        monthlyPayment: currentCalc.monthlyPayment,
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
    let currentY = 22;
    
    // Header con logo si existe
    if (tenantData?.logo) {
      try {
        const base64Logo = await imageUrlToBase64(tenantData.logo);
        doc.addImage(base64Logo, 'PNG', margin, 15, 30, 15); // logo de 30x15mm aprox
        currentY = 35;
      } catch (err) {
        console.warn('Could not load logo for PDF:', err);
      }
    }

    // Tenant info
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Primary Blue
    doc.text(tenantData?.name || 'EscalaFin', tenantData?.logo ? 50 : margin, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Proyección de Crédito - Folio: APP-${format(new Date(), 'yyyyMMdd')}`, margin, currentY);
    currentY += 10;
    
    doc.setFontSize(8);
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, currentY);
    currentY += 15;
    
    // Horizontal Line
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, currentY, 196, currentY);
    currentY += 10;
    
    doc.setTextColor(0, 0, 0);

    // Client Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Información del Cliente', margin, currentY);
    currentY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nombre: ${selectedClient.firstName} ${selectedClient.lastName}`, margin, currentY);
    currentY += 5;
    doc.text(`Teléfono: ${selectedClient.phone}`, margin, currentY);
    currentY += 15;
    
    // Loan Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen del Préstamo', margin, currentY);
    currentY += 8;
    
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
      styles: { fontSize: 9, cellPadding: 1 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Amortization Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Cronograma Proyectado de Pagos', margin, currentY);
    currentY += 5;
    
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
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 8 },
      columnStyles: { 
        0: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' },
        5: { halign: 'right' }
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
    <div className="p-8">
      <span className="text-2xl font-bold">Diagnóstico: El error estaba en el cuerpo.</span>
    </div>
  );
}