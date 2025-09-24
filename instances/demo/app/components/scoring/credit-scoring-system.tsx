
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
}

const CreditScoringSystem: React.FC<{
  clientId?: string;
  applicationId?: string;
  onScoreCalculated?: (result: ScoringResult) => void;
}> = ({ clientId, applicationId, onScoreCalculated }) => {
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 65) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackgroundColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 65) return 'bg-blue-100';
    if (score >= 50) return 'bg-yellow-100';
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Sistema de Scoring Crediticio
          </CardTitle>
          <CardDescription>
            Evaluación automática del riesgo crediticio basada en múltiples factores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Información Personal</TabsTrigger>
              <TabsTrigger value="financial">Información Financiera</TabsTrigger>
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
                    value={factors.income}
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
                    value={factors.expenses}
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
                    value={factors.existingDebts}
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
                    value={factors.requestedAmount}
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

              {factors.requestedAmount > 0 && factors.income > 0 && (
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    Ratio monto/ingreso anual: {((factors.requestedAmount / (factors.income * 12)) * 100).toFixed(1)}%
                    <br />
                    Pago mensual estimado: {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN'
                    }).format(factors.requestedAmount / factors.requestedTerm)}
                  </AlertDescription>
                </Alert>
              )}
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
              {calculating ? 'Calculando...' : 'Calcular Score Crediticio'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Score Principal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Score Crediticio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className={`text-6xl font-bold ${getScoreColor(result.score)} ${getScoreBackgroundColor(result.score)} rounded-full w-32 h-32 flex items-center justify-center mx-auto`}>
                  {result.score}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Puntaje de 0 a 100
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Nivel de Riesgo</span>
                  <div className="flex items-center gap-2">
                    {getRiskIcon(result.risk)}
                    <Badge variant={result.risk === 'LOW' ? 'default' : 'secondary'}>
                      {result.risk}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Recomendación</span>
                  <div className="flex items-center gap-2">
                    {getRecommendationIcon(result.recommendation)}
                    <Badge variant={result.recommendation === 'APPROVE' ? 'default' : 'destructive'}>
                      {result.recommendation}
                    </Badge>
                  </div>
                </div>
              </div>

              {result.maxAmount && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Monto Máximo Recomendado</Label>
                  <div className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN'
                    }).format(result.maxAmount)}
                  </div>
                </div>
              )}

              {result.recommendedRate && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tasa de Interés Recomendada</Label>
                  <div className="text-xl font-bold text-blue-600">
                    {(result.recommendedRate * 100).toFixed(2)}% anual
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Desglose de Factores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análisis de Factores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(result.factors).map(([factor, score]) => {
                const factorNames: Record<string, string> = {
                  income: 'Ingresos',
                  debt_to_income: 'Ratio Deuda/Ingreso',
                  credit_history: 'Historial Crediticio',
                  employment: 'Situación Laboral',
                  age: 'Edad',
                  amount_requested: 'Monto Solicitado'
                };

                return (
                  <div key={factor} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">
                        {factorNames[factor] || factor}
                      </Label>
                      <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                        {score}/100
                      </span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                );
              })}

              <Separator className="my-4" />

              <Alert>
                <DollarSign className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Interpretación:</strong>
                  <br />
                  • 80-100: Excelente (Bajo riesgo)
                  <br />
                  • 65-79: Bueno (Riesgo medio)
                  <br />
                  • 50-64: Regular (Alto riesgo)
                  <br />
                  • 0-49: Malo (Muy alto riesgo)
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
