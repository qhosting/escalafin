
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Navigation, 
  Search, 
  User, 
  MapPin, 
  AlertTriangle,
  ChevronRight,
  Clock,
  History,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { NonPaymentModal } from '@/components/loans/non-payment-modal';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NoPagoPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [recentVisits, setRecentVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/loans?status=ACTIVE');
      if (!response.ok) throw new Error('Error al cargar préstamos');
      const data = await response.json();
      setLoans(data.loans || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentVisits = async () => {
    try {
      setLoadingVisits(true);
      const response = await fetch('/api/admin/visits?limit=10');
      if (!response.ok) throw new Error('Error al cargar visitas');
      const data = await response.json();
      setRecentVisits(data.visits || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingVisits(false);
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchRecentVisits();
  }, []);

  const filteredLoans = loans.filter(loan => 
    loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${loan.client.firstName} ${loan.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOutcomeLabel = (outcome: string) => {
    const labels: Record<string, string> = {
      'NOT_FOUND': 'No encontrado',
      'NO_MONEY': 'Sin dinero',
      'WILL_PAY_LATER': 'Pagará después',
      'REFUSED_TO_PAY': 'Se negó a pagar',
      'HOUSE_CLOSED': 'Cerrado',
      'OTHER': 'Otro'
    };
    return labels[outcome] || outcome;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <div className="p-4 bg-red-600 rounded-[2rem] shadow-xl shadow-red-100 ring-4 ring-red-50">
              <Navigation className="h-8 w-8 text-white" />
            </div>
            Gestión de no pagos
          </h1>
          <p className="text-gray-500 mt-2 font-bold italic text-lg lg:ml-20">
            Control de incidencias y visitas de cobranza en campo.
          </p>
        </div>
      </div>

      <Tabs defaultValue="register" className="w-full">
        <TabsList className="bg-gray-100 p-1.5 rounded-2xl h-16 w-full max-w-md mb-6">
          <TabsTrigger value="register" className="rounded-xl h-full font-black uppercase text-xs tracking-widest flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
             <Search className="h-4 w-4 mr-2" />
             Registrar Nuevo
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl h-full font-black uppercase text-xs tracking-widest flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
             <History className="h-4 w-4 mr-2" />
             Historial Reciente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="register">
           <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-gray-200/50 ring-1 ring-gray-100 overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-8 border-b border-gray-100">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                <Input
                  placeholder="Buscar por cliente o número de préstamo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-16 pl-14 rounded-2xl bg-white border-gray-100 focus:border-red-500 text-xl font-medium shadow-inner transition-all hover:bg-gray-50/50"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50">
                {loading ? (
                   <div className="p-24 text-center flex flex-col items-center gap-6">
                     <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-600"></div>
                     <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Consultando cartera activa...</p>
                   </div>
                ) : filteredLoans.length > 0 ? (
                  filteredLoans.map((loan) => (
                    <div 
                      key={loan.id}
                      onClick={() => {
                        setSelectedLoan(loan);
                        setIsModalOpen(true);
                      }}
                      className="p-8 hover:bg-red-50/40 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-6">
                        <Avatar className="h-16 w-16 border-4 border-white shadow-lg group-hover:scale-110 transition-transform">
                          <AvatarFallback className="bg-red-50 text-red-600 font-black text-xl">
                            {loan.client.firstName[0]}{loan.client.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-3 mb-1.5">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-2 py-0.5 rounded">FOLIO: {loan.loanNumber}</span>
                            <Badge className="bg-green-100 text-green-700 font-black text-[9px] uppercase tracking-widest border-0">AL CORRIENTE</Badge>
                          </div>
                          <h3 className="text-2xl font-black text-gray-900 group-hover:text-red-700 transition-colors uppercase leading-none italic">
                            {loan.client.firstName} {loan.client.lastName}
                          </h3>
                          <div className="flex items-center gap-4 mt-3 text-gray-400 font-bold text-xs uppercase tracking-tight">
                            <div className="flex items-center gap-1.5">
                               <MapPin className="h-4 w-4 text-gray-300" />
                               {loan.client.city || 'Zona Sur'}
                            </div>
                            <Separator orientation="vertical" className="h-4" />
                            <div className="flex items-center gap-1.5">
                               <Clock className="h-4 w-4 text-gray-300" />
                               Prox. Pago: {format(new Date(loan.startDate), 'dd MMM', { locale: es })}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end mr-6">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Saldo</span>
                           <span className="text-2xl font-black text-gray-900 flex items-baseline">
                             <span className="text-sm mr-1 font-bold text-gray-400">$</span>
                             {loan.balanceRemaining.toLocaleString()}
                           </span>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 group-hover:shadow-xl group-hover:rotate-6 transition-all shadow-sm">
                           <ChevronRight className="h-7 w-7" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-24 text-center flex flex-col items-center gap-4">
                    <AlertTriangle className="h-14 w-14 text-gray-100" />
                    <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Sin resultados para la búsqueda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-gray-200/50 ring-1 ring-gray-100 overflow-hidden">
            <CardHeader className="bg-red-600 p-8 text-white relative overflow-hidden">
               <div className="absolute top-[-20%] right-[-10%] w-60 h-60 bg-white/10 rounded-full blur-3xl" />
               <div className="flex items-center gap-4 mb-2">
                 <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md ring-1 ring-white/20">
                    <History className="h-6 w-6 text-white" />
                 </div>
                 <div className="space-y-0.5">
                    <CardTitle className="text-3xl font-black tracking-tighter uppercase italic">Visitas Recientes</CardTitle>
                    <CardDescription className="text-red-100 font-bold opacity-80">Últimas incidencias y promesas registradas en campo.</CardDescription>
                 </div>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               {loadingVisits ? (
                  <div className="p-24 text-center">
                     <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="h-12 w-12 bg-gray-100 rounded-full" />
                        <div className="h-4 w-32 bg-gray-50 rounded" />
                     </div>
                  </div>
               ) : recentVisits.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                     {recentVisits.map((visit) => (
                        <div key={visit.id} className="p-8 hover:bg-gray-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                           <div className="flex items-start gap-6">
                              <div className="bg-gray-100 h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:-rotate-3 transition-all border-2 border-white shadow-sm">
                                 <AlertCircle className="h-6 w-6 text-red-600" />
                              </div>
                              <div className="space-y-1">
                                 <div className="flex flex-wrap items-center gap-3">
                                    <h4 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">
                                      {visit.client.firstName} {visit.client.lastName}
                                    </h4>
                                    <Badge className="bg-red-50 text-red-700 border-red-100 font-black text-[9px] uppercase tracking-widest">
                                       {getOutcomeLabel(visit.outcome)}
                                    </Badge>
                                 </div>
                                 <p className="text-gray-500 font-bold text-sm leading-relaxed max-w-lg">
                                    {visit.notes || 'Sin observaciones adicionales registradas.'}
                                 </p>
                                 <div className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                                       <User className="h-3 w-3" />
                                       Asesor: {visit.advisor.firstName}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                                       <Calendar className="h-3 w-3" />
                                       {format(new Date(visit.visitDate), "d 'de' MMMM, HH:mm", { locale: es })}
                                    </div>
                                    {visit.promiseDate && (
                                       <div className="flex items-center gap-1.5 text-blue-600 font-black text-[10px] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                                          Promesa: {format(new Date(visit.promiseDate), "dd/MM/yyyy")}
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="p-24 text-center">
                     <AlertTriangle className="h-12 w-12 text-gray-100 mx-auto mb-4" />
                     <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No hay visitas registradas aún.</p>
                  </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedLoan && (
        <NonPaymentModal 
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          loan={selectedLoan}
          onSuccess={() => {
            fetchRecentVisits();
          }}
        />
      )}
    </div>
  );
}
