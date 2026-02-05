
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Target,
  BarChart3,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

interface ScoringFactors {
  income: number;
  expenses: number;
  existingDebts: number;
  creditHistory: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'NONE';
  employmentStatus: 'EMPLOYED' | 'SELF_EMPLOYED' | 'UNEMPLOYED' | 'RETIRED';
  employmentYears: number;
  age: number;
  requestedAmount: number;
  requestedTerm: number;
}

interface ScoringResult {
  score: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
  maxAmount?: number;
  recommendedRate?: number;
  factors: {
    income: number;
    debt_to_income: number;
    credit_history: number;
    employment: number;
    age: number;
    amount_requested: number;
  };
  aiInsights?: {
    score: number;
    probabilityOfDefault: number;
    riskLevel: string;
    factors: string[];
    maxRecommendedAmount: number;
  };
}

const CreditScoringSystem: React.FC<{
  clientId?: string;
  applicationId?: string;
  onScoreCalculated?: (result: ScoringResult) => void;
}> = ({ clientId, applicationId, onScoreCalculated }) => {
  // ... (mantener estados iguales hasta el return)
  const [factors, setFactors] = useState<ScoringFactors>({
    income: 0,
    expenses: 0,
    existingDebts: 0,
    creditHistory: 'NONE',
    employmentStatus: 'EMPLOYED',
    employmentYears: 0,
    age: 25,
    requestedAmount: 0,
    requestedTerm: 12,
  });

  const [result, setResult] = useState<ScoringResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const handleInputChange = (field: keyof ScoringFactors, value: string | number) => {
    setFactors(prev => ({
      ...prev,
      [field]: typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value
    }));
  };

  const calculateScore = async () => {
    setCalculating(true);
    try {
      const response = await fetch('/api/scoring/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          factors,
          clientId,
          applicationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al calcular el score');
      }

      const scoringResult = await response.json();
      setResult(scoringResult);
      onScoreCalculated?.(scoringResult);
      toast.success('Score crediticio calculado exitosamente');
    } catch (error) {
      console.error('Error calculating score:', error);
      toast.error('Error al calcular el score crediticio');
    } finally {
      setCalculating(false);
    }
  };

  const getScoreColor = (score: number, isAI: boolean = false) => {
    const high = isAI ? 750 : 80;
    const mid = isAI ? 650 : 65;
    const low = isAI ? 550 : 50;

    if (score >= high) return 'text-green-600';
    if (score >= mid) return 'text-blue-600';
    if (score >= low) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackgroundColor = (score: number, isAI: boolean = false) => {
    const high = isAI ? 750 : 80;
    const mid = isAI ? 650 : 65;
    const low = isAI ? 550 : 50;

    if (score >= high) return 'bg-green-100';
    if (score >= mid) return 'bg-blue-100';
    if (score >= low) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'MEDIUM':
        return <Shield className="h-5 w-5 text-blue-500" />;
      case 'HIGH':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'VERY_HIGH':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'APPROVE':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'REVIEW':
        return <Shield className="h-5 w-5 text-yellow-500" />;
      case 'REJECT':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const debtToIncomeRatio = factors.income > 0 ? ((factors.expenses + factors.existingDebts) / factors.income) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Sistema de Scoring Crediticio
          </CardTitle>
          <CardDescription>
            Evaluación automática del riesgo basada en reglas de negocio y modelos predictivos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* ... (TABS CONTENT MANTIENE IGUAL HASTA EL BOTÓN DE CALCULAR) */}
          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="financial">Financiero</TabsTrigger>
              <TabsTrigger value="employment">Empleo</TabsTrigger>
              <TabsTrigger value="loan">Solicitud</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Edad</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="80"
                    value={factors.age}
                    onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creditHistory">Historial Crediticio</Label>
                  <Select
                    value={factors.creditHistory}
                    onValueChange={(value: any) => handleInputChange('creditHistory', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXCELLENT">Excelente</SelectItem>
                      <SelectItem value="GOOD">Bueno</SelectItem>
                      <SelectItem value="FAIR">Regular</SelectItem>
                      <SelectItem value="POOR">Malo</SelectItem>
                      <SelectItem value="NONE">Sin historial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="income">Ingresos Mensuales</Label>
                  <Input
                    id="income"
                    type="number"
                    step="0.01"
                    min="0"
                    value={factors.income || ''}
                    onChange={(e) => handleInputChange('income', parseFloat(e.target.value) || 0)}
                    placeholder="15000.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenses">Gastos Mensuales</Label>
                  <Input
                    id="expenses"
                    type="number"
                    step="0.01"
                    min="0"
                    value={factors.expenses || ''}
                    onChange={(e) => handleInputChange('expenses', parseFloat(e.target.value) || 0)}
                    placeholder="8000.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="existingDebts">Deudas Existentes</Label>
                  <Input
                    id="existingDebts"
                    type="number"
                    step="0.01"
                    min="0"
                    value={factors.existingDebts || ''}
                    onChange={(e) => handleInputChange('existingDebts', parseFloat(e.target.value) || 0)}
                    placeholder="2000.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ratio Deuda/Ingreso</Label>
                  <div className="p-2 bg-muted rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">{debtToIncomeRatio.toFixed(1)}%</span>
                      <span className={`text-sm ${debtToIncomeRatio <= 30 ? 'text-green-600' : debtToIncomeRatio <= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {debtToIncomeRatio <= 30 ? 'Excelente' : debtToIncomeRatio <= 50 ? 'Aceptable' : 'Alto riesgo'}
                      </span>
                    </div>
                    <Progress value={Math.min(debtToIncomeRatio, 100)} className="h-2" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="employment" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employmentStatus">Estado Laboral</Label>
                  <Select
                    value={factors.employmentStatus}
                    onValueChange={(value: any) => handleInputChange('employmentStatus', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYED">Empleado</SelectItem>
                      <SelectItem value="SELF_EMPLOYED">Trabajador Independiente</SelectItem>
                      <SelectItem value="UNEMPLOYED">Desempleado</SelectItem>
                      <SelectItem value="RETIRED">Jubilado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employmentYears">Años en el Empleo</Label>
                  <Input
                    id="employmentYears"
                    type="number"
                    min="0"
                    max="50"
                    value={factors.employmentYears}
                    onChange={(e) => handleInputChange('employmentYears', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="loan" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requestedAmount">Monto Solicitado</Label>
                  <Input
                    id="requestedAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={factors.requestedAmount || ''}
                    onChange={(e) => handleInputChange('requestedAmount', parseFloat(e.target.value) || 0)}
                    placeholder="50000.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requestedTerm">Plazo (meses)</Label>
                  <Input
                    id="requestedTerm"
                    type="number"
                    min="1"
                    max="240"
                    value={factors.requestedTerm}
                    onChange={(e) => handleInputChange('requestedTerm', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <div className="flex justify-center">
            <Button
              onClick={calculateScore}
              disabled={calculating || factors.income <= 0 || factors.requestedAmount <= 0}
              className="flex items-center gap-2"
              size="lg"
            >
              {calculating ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Calculator className="h-5 w-5" />
              )}
              {calculating ? 'Analizando...' : 'Calcular Scoring Crediticio'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
          {/* Análisis Predictivo IA (SI EXISTE) */}
          {result.aiInsights && (
            <Card className="shadow-lg border-2 border-indigo-200 bg-gradient-to-b from-indigo-50/30 to-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-indigo-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    Análisis Predictivo (IA)
                  </CardTitle>
                  <Badge className="bg-indigo-600">Fase 4 Beta</Badge>
                </div>
                <CardDescription>Basado en historial conductual y recurrencia</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="text-center space-y-2">
                  <div className={`text-5xl font-black ${getScoreColor(result.aiInsights.score, true)} bg-white shadow-inner rounded-2xl p-6 inline-block border-2 border-indigo-100`}>
                    {result.aiInsights.score}
                  </div>
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-tighter">Probabilidad de Pago: {((1 - result.aiInsights.probabilityOfDefault) * 100).toFixed(1)}%</p>
                </div>

                <div className="space-y-3">
                  {result.aiInsights.factors.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-white/50 p-2 rounded-md border border-indigo-50">
                      {result.aiInsights!.score > 600 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      {f}
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-indigo-900 text-white rounded-xl shadow-md">
                  <p className="text-xs opacity-70 uppercase font-bold mb-1 tracking-widest">Capacidad de Pago IA</p>
                  <p className="text-2xl font-black">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(result.aiInsights.maxRecommendedAmount)}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultado basado en Reglas */}
          <Card className={result.aiInsights ? 'xl:col-span-1 shadow-md' : 'md:col-span-1 shadow-md'}>
            <CardHeader>
              <CardTitle className="text-center">Score de Negocio</CardTitle>
              <CardDescription className="text-center text-xs">Evaluación por política estándar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className={`text-6xl font-black ${getScoreColor(result.score)} ${getScoreBackgroundColor(result.score)} rounded-full w-32 h-32 flex items-center justify-center mx-auto shadow-inner`}>
                  {result.score}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg border">
                  <span className="text-sm font-semibold">Riesgo</span>
                  <div className="flex items-center gap-2">
                    {getRiskIcon(result.risk)}
                    <span className="font-bold text-sm">{result.risk}</span>
                  </div>
                </div>

                <div className="flex justify-between p-3 bg-slate-50 rounded-lg border">
                  <span className="text-sm font-semibold">Decisión</span>
                  <div className="flex items-center gap-2">
                    {getRecommendationIcon(result.recommendation)}
                    <span className="font-bold text-sm tracking-tight">{result.recommendation}</span>
                  </div>
                </div>
              </div>

              {result.maxAmount && (
                <div className="p-4 rounded-xl border-2 border-dashed border-slate-200">
                  <Label className="text-xs font-bold text-slate-400 uppercase">Aprobación Sugerida</Label>
                  <div className="text-2xl font-black text-slate-800">
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(result.maxAmount)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Desglose de Factores */}
          <Card className={result.aiInsights ? 'xl:col-span-1 shadow-md' : 'md:col-span-1 shadow-md'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-slate-500" />
                Desglose Métrico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(result.factors).map(([factor, score]) => {
                const factorNames: Record<string, string> = {
                  income: 'Ingresos',
                  debt_to_income: 'Ratio Deuda/Gasto',
                  credit_history: 'Historial',
                  employment: 'Antigüedad Lab.',
                  age: 'Perfil de Edad',
                  amount_requested: 'Exposición'
                };

                return (
                  <div key={factor} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-600 uppercase tracking-tighter">
                        {factorNames[factor] || factor}
                      </span>
                      <span className={`font-black ${getScoreColor(score)}`}>
                        {score}%
                      </span>
                    </div>
                    <Progress value={score} className="h-1.5" />
                  </div>
                );
              })}

              <Alert className="mt-8 bg-slate-50 border-none">
                <Shield className="h-4 w-4 text-slate-400" />
                <AlertDescription className="text-[10px] leading-tight text-slate-500 font-medium">
                  Este análisis es una sugerencia automatizada. La decisión final recae en el comité de crédito tras la verificación física de documentos.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CreditScoringSystem;
