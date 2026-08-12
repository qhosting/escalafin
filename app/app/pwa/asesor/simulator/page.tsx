'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, RefreshCw } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function PWASimulatorPage() {
  const [amount, setAmount] = useState('10000');
  const [term, setTerm] = useState('12');
  const [rate, setRate] = useState('5');
  const [freq, setFreq] = useState('MENSUAL');
  const [calcType, setCalcType] = useState('INTERES');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/loans/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principalAmount: Number(amount),
          termMonths: Number(term),
          interestRate: Number(rate),
          paymentFrequency: freq,
          calculationType: calcType,
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 pt-12 pb-5 safe-area-top">
        <h1 className="text-xl font-black tracking-tight">Simulador de Crédito</h1>
        <p className="text-violet-200 text-xs mt-0.5">Calcula cuotas y montos en tiempo real</p>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-4">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-4 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Monto ($)</Label>
                <Input className="rounded-xl text-sm" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="10000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Plazo (meses)</Label>
                <Input className="rounded-xl text-sm" type="number" value={term} onChange={e => setTerm(e.target.value)} placeholder="12" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Tasa (%)</Label>
                <Input className="rounded-xl text-sm" type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="5" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Frecuencia</Label>
                <Select value={freq} onValueChange={setFreq}>
                  <SelectTrigger className="rounded-xl text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEMANAL">Semanal</SelectItem>
                    <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                    <SelectItem value="MENSUAL">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600">Tipo de Cálculo</Label>
              <Select value={calcType} onValueChange={setCalcType}>
                <SelectTrigger className="rounded-xl text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERES">Interés Simple</SelectItem>
                  <SelectItem value="TARIFA_FIJA">Tarifa Fija</SelectItem>
                  <SelectItem value="INTERES_SEMANAL">Interés Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={calculate}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl gap-2 h-11"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              Calcular Cuota
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="rounded-2xl border-0 shadow-sm border-l-4 border-l-violet-500">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-black text-slate-900">Resultado de la Simulación</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Cuota Periódica', value: fmt(result.monthlyPayment || 0), color: 'text-violet-600' },
                { label: 'Total a Pagar', value: fmt(result.totalAmount || 0), color: 'text-slate-800' },
                { label: 'Total Intereses', value: fmt(result.totalInterest || 0), color: 'text-amber-600' },
                { label: 'Monto Principal', value: fmt(Number(amount)), color: 'text-blue-600' },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 font-medium">{item.label}</p>
                  <p className={`text-base font-black ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
