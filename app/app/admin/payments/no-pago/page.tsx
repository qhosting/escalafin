
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Navigation, 
  Search, 
  User, 
  MapPin, 
  AlertTriangle,
  ChevronRight,
  Clock
} from 'lucide-react';
import { NonPaymentModal } from '@/components/loans/non-payment-modal';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NoPagoPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchLoans();
  }, []);

  const filteredLoans = loans.filter(loan => 
    loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${loan.client.firstName} ${loan.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-100">
              <Navigation className="h-7 w-7 text-white" />
            </div>
            Gestión de No Pagos
          </h1>
          <p className="text-muted-foreground mt-1 font-medium italic">
            Registra incidencias, ausencias o negativas de pago detectadas en campo.
          </p>
        </div>
      </div>

      <Card className="rounded-[2rem] border-none shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <CardHeader className="bg-gray-50/50 pb-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
            <Input
              placeholder="Buscar por cliente o número de préstamo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 pl-12 rounded-2xl bg-white border-gray-100 focus:border-red-500 text-lg shadow-inner-sm transition-all"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {loading ? (
               <div className="p-20 text-center flex flex-col items-center gap-4">
                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
                 <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Sincronizando cartera activa...</p>
               </div>
            ) : filteredLoans.length > 0 ? (
              filteredLoans.map((loan) => (
                <div 
                  key={loan.id}
                  onClick={() => {
                    setSelectedLoan(loan);
                    setIsModalOpen(true);
                  }}
                  className="p-6 hover:bg-red-50/30 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-4 border-white shadow-sm group-hover:scale-105 transition-transform">
                      <AvatarFallback className="bg-red-50 text-red-600 font-black text-lg">
                        {loan.client.firstName[0]}{loan.client.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">PROYECTO: {loan.loanNumber}</span>
                        <Badge variant="outline" className="text-[9px] border-red-100 bg-red-50 text-red-600 font-bold px-2 py-0">ACTIVO</Badge>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase leading-none">
                        {loan.client.firstName} {loan.client.lastName}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-gray-500 font-medium text-sm">
                        <div className="flex items-center gap-1">
                           <Clock className="h-3.5 w-3.5" />
                           Vencimiento: {format(new Date(loan.startDate), 'MMM dd, yyyy', { locale: es })}
                        </div>
                        <div className="hidden md:flex items-center gap-1">
                           <MapPin className="h-3.5 w-3.5" />
                           {loan.client.city || 'Ubicación no especificada'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden lg:flex flex-col items-end mr-4">
                       <span className="text-[10px] font-black text-gray-400 uppercase">Saldo Actual</span>
                       <span className="text-lg font-black text-gray-900">${loan.balanceRemaining.toLocaleString()}</span>
                    </div>
                    <Button className="h-14 w-14 rounded-full bg-white hover:bg-red-600 text-gray-400 hover:text-white transition-all shadow-sm group-hover:shadow-red-200 border-gray-100 group-hover:border-red-600">
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <AlertTriangle className="h-12 w-12 text-gray-200" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No se encontraron préstamos activos para este criterio</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedLoan && (
        <NonPaymentModal 
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          loan={selectedLoan}
          onSuccess={() => {
            // Refrescar lista si es necesario
          }}
        />
      )}
    </div>
  );
}
