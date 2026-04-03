
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShieldAlert, 
  ShieldCheck,
  ShieldX, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  CreditCard, 
  Trash2, 
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  XCircle
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CierrePenalizaciones } from '@/components/admin/operations/cierre-penalizaciones';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function PenaltiesAdminPage() {
    const { data: session } = useSession();
    const [penalties, setPenalties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPenalty, setSelectedPenalty] = useState<any>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchPenalties = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10'
            });
            if (statusFilter) params.append('status', statusFilter);
            
            const response = await fetch(`/api/admin/penalties?${params.toString()}`);
            if (!response.ok) throw new Error('Error al cargar penalizaciones');
            
            const data = await response.json();
            setPenalties(data.penalties);
            setPagination(data.pagination);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchPenalties();
    }, [fetchPenalties]);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/admin/penalties/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Error al actualizar estado');
            
            toast.success(`Penalización marcada como ${newStatus}`);
            fetchPenalties(pagination.currentPage);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async () => {
        if (!selectedPenalty) return;
        try {
            setDeleteLoading(true);
            const response = await fetch(`/api/admin/penalties/${selectedPenalty.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Error al eliminar');
            
            toast.success('Penalización eliminada permanentemente');
            setIsDeleteModalOpen(false);
            fetchPenalties(pagination.currentPage);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setDeleteLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Pendiente</Badge>;
            case 'COMPLETED': return <Badge className="bg-green-100 text-green-700 border-green-200">Pagado</Badge>;
            case 'CANCELLED': return <Badge className="bg-gray-100 text-gray-500 border-gray-200">Cancelado</Badge>;
            case 'REFUNDED': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Condonado</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header Premium */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-orange-600 p-2 rounded-xl text-white">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <Badge className="bg-orange-50 text-orange-700 border-orange-100 font-black uppercase tracking-widest text-[10px]">Control de Incumplimiento</Badge>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2 italic">Penalizaciones Únicas</h1>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Historial de cobros por mora y desacato
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <CierrePenalizaciones />
                    <Button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-14 lg:w-48 rounded-[1.5rem] bg-orange-600 text-white font-black hover:bg-orange-700 uppercase tracking-widest text-xs gap-3 shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Manual
                    </Button>
                </div>
            </div>

            {/* Quick Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="rounded-[2.5rem] border-0 shadow-xl bg-white dark:bg-gray-950 p-6 flex flex-col justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Recaudación Pendiente</p>
                    <div className="flex items-baseline gap-2">
                        <h4 className="text-3xl font-black text-orange-600 italic">
                            ${penalties.filter(p => p.status === 'PENDING').reduce((acc, p) => acc + Number(p.amount), 0).toLocaleString()}
                        </h4>
                        <span className="text-xs font-bold text-gray-400">MXN</span>
                    </div>
                </Card>
                
                <Card className="rounded-[2.5rem] border-0 shadow-xl bg-white dark:bg-gray-950 p-6 flex flex-col justify-between border-l-4 border-l-green-500">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Multas Pagadas</p>
                    <div className="flex items-baseline gap-2">
                        <h4 className="text-3xl font-black text-green-600 italic">
                            {penalties.filter(p => p.status === 'COMPLETED').length}
                        </h4>
                        <span className="text-xs font-bold text-gray-400">Registros</span>
                    </div>
                </Card>

                <Card className="rounded-[2.5rem] border-0 shadow-xl bg-white dark:bg-gray-950 p-6 flex flex-col justify-between border-l-4 border-l-blue-500">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Efectividad Cobro</p>
                    <div className="flex items-baseline gap-2">
                        <h4 className="text-3xl font-black text-blue-600 italic">82%</h4>
                        <span className="text-xs font-bold text-gray-400">Ratio Prom.</span>
                    </div>
                </Card>

                <Card className="rounded-[2.5rem] border-0 shadow-xl bg-white dark:bg-gray-950 p-6 flex flex-col justify-between bg-gradient-to-br from-orange-600 to-red-600 text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2 text-white">Próximo Cierre</p>
                    <div className="flex items-center gap-2">
                        <h4 className="text-2xl font-black italic">Hoy 20:00</h4>
                        <RefreshCw className="h-4 w-4 animate-spin opacity-50" />
                    </div>
                </Card>
            </div>

            {/* List & Filters */}
            <Card className="rounded-[2.5rem] border-0 shadow-2xl bg-white dark:bg-gray-950 overflow-hidden">
                <CardHeader className="p-8 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                            <Input 
                                placeholder="Buscar por cliente o folio..." 
                                className="pl-12 h-12 rounded-2xl border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/20 transition-all font-bold"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant={statusFilter === '' ? 'secondary' : 'outline'}
                                className={cn("rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-4", statusFilter === '' && "bg-orange-600 text-white hover:bg-orange-700")}
                                onClick={() => setStatusFilter('')}
                            >Todas</Button>
                            <Button 
                                variant={statusFilter === 'PENDING' ? 'secondary' : 'outline'}
                                className={cn("rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-4", statusFilter === 'PENDING' && "bg-orange-600 text-white hover:bg-orange-700")}
                                onClick={() => setStatusFilter('PENDING')}
                            >Pendientes</Button>
                            <Button 
                                variant={statusFilter === 'COMPLETED' ? 'secondary' : 'outline'}
                                className={cn("rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-4", statusFilter === 'COMPLETED' && "bg-orange-600 text-white hover:bg-orange-700")}
                                onClick={() => setStatusFilter('COMPLETED')}
                            >Pagadas</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                    <th className="px-8 py-6 text-left">Cliente / Préstamo</th>
                                    <th className="px-8 py-6 text-left">Monto</th>
                                    <th className="px-8 py-6 text-left">Razón / Concepto</th>
                                    <th className="px-8 py-6 text-left">Fecha</th>
                                    <th className="px-8 py-6 text-left">Estado</th>
                                    <th className="px-8 py-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Cargando registros del sistema...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : penalties.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-bold italic">
                                            No se encontraron penalizaciones registradas.
                                        </td>
                                    </tr>
                                ) : penalties.filter(p => !searchTerm || (p.loan?.client?.firstName + ' ' + p.loan?.client?.lastName).toLowerCase().includes(searchTerm.toLowerCase()) || p.loan?.loanNumber.includes(searchTerm)).map((penalty) => (
                                    <tr key={penalty.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-900/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-black">
                                                    {penalty.loan?.client?.firstName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 dark:text-white leading-none mb-1">
                                                        {penalty.loan?.client?.firstName} {penalty.loan?.client?.lastName}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-gray-400 flex items-center gap-2">
                                                        <CreditCard className="h-3 w-3" /> {penalty.loan?.loanNumber}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xl font-black text-gray-900 dark:text-white leading-none">${Number(penalty.amount).toLocaleString()}</p>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-1">MXN LIQUIDACIÓN</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{penalty.reason || 'Sin razón especificada'}</p>
                                            {penalty.installment && (
                                                <p className="text-[9px] font-black text-orange-500 uppercase tracking-tighter mt-1">
                                                    Cuota {penalty.installment.paymentNumber} Vencida
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                {format(new Date(penalty.createdAt), "dd/MM/yyyy", { locale: es })}
                                            </p>
                                            <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest mt-1">
                                                {format(new Date(penalty.createdAt), "HH:mm 'hrs'", { locale: es })}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            {getStatusBadge(penalty.status)}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 group-hover:bg-white transition-all">
                                                        <MoreVertical className="h-5 w-5 text-gray-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-2xl border-0 shadow-2xl p-2 w-48 animate-in zoom-in-95 duration-200">
                                                    <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-3 py-2">Administrar Multa</DropdownMenuLabel>
                                                    <DropdownMenuSeparator className="bg-gray-100" />
                                                    {penalty.status === 'PENDING' && (
                                                        <>
                                                            <DropdownMenuItem className="rounded-xl px-3 py-3 font-bold text-sm flex items-center gap-3 cursor-pointer text-green-600 focus:bg-green-50 focus:text-green-700 transition-colors" onClick={() => handleUpdateStatus(penalty.id, 'COMPLETED')}>
                                                                <ShieldCheck className="h-4 w-4" /> Registrar Pago
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="rounded-xl px-3 py-3 font-bold text-sm flex items-center gap-3 cursor-pointer text-blue-600 focus:bg-blue-50 focus:text-blue-700 transition-colors" onClick={() => handleUpdateStatus(penalty.id, 'REFUNDED')}>
                                                                <ShieldX className="h-4 w-4" /> Condonar Multa
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    <DropdownMenuItem 
                                                        className="rounded-xl px-3 py-3 font-bold text-sm flex items-center gap-3 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 transition-colors"
                                                        onClick={() => {
                                                            setSelectedPenalty(penalty);
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Eliminar Definitivo
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-8 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-400">Mostrando {penalties.length} de {pagination.totalCount} registros</p>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="rounded-xl h-10 w-10 border-gray-100 disabled:opacity-50"
                                disabled={pagination.currentPage === 1 || loading}
                                onClick={() => fetchPenalties(pagination.currentPage - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="bg-orange-50 text-orange-600 h-10 px-4 flex items-center justify-center rounded-xl font-black text-xs">
                                Pág. {pagination.currentPage} / {pagination.totalPages}
                            </div>
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="rounded-xl h-10 w-10 border-gray-100 disabled:opacity-50"
                                disabled={pagination.currentPage === pagination.totalPages || loading}
                                onClick={() => fetchPenalties(pagination.currentPage + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Manual Creation Modal (To be implemented) */}
            <ManualPenaltyDialog 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={() => {
                    fetchPenalties();
                    setIsCreateModalOpen(false);
                }}
            />

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-0 shadow-2xl max-w-md">
                    <div className="p-8 bg-red-600 text-white text-center">
                        <div className="bg-white/20 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                            <Trash2 className="h-8 w-8" />
                        </div>
                        <h3 className="text-3xl font-black uppercase italic leading-none mb-2">Eliminar Multa</h3>
                        <p className="text-red-100 text-xs font-bold uppercase tracking-widest opacity-80">Esta acción no se puede deshacer.</p>
                    </div>
                    <div className="p-8 space-y-4 text-center">
                        <p className="text-gray-600 font-bold">
                            ¿Estás seguro de que deseas eliminar permanentemente esta penalización de <span className="text-red-600">$200</span> para <span className="text-gray-900 font-black">{selectedPenalty?.loan?.client?.firstName}</span>?
                        </p>
                    </div>
                    <DialogFooter className="p-8 border-t bg-gray-50 flex gap-3 sm:flex-row flex-col">
                        <Button 
                            variant="ghost" 
                            className="flex-1 rounded-2xl h-12 font-black uppercase text-xs tracking-widest"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={deleteLoading}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            className="flex-1 rounded-2xl h-12 bg-red-600 hover:bg-red-700 font-black uppercase text-xs tracking-widest shadow-lg shadow-red-500/20"
                            onClick={handleDelete}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Confirmar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Sub-component for Manual Penalty
function ManualPenaltyDialog({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
    const [loanId, setLoanId] = useState('');
    const [amount, setAmount] = useState('200');
    const [reason, setReason] = useState('Incumplimiento de términos / Protocolo');
    const [loading, setLoading] = useState(false);
    const [loans, setLoans] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    const searchLoans = async (term: string) => {
        if (term.length < 3) return;
        try {
            setSearching(true);
            const response = await fetch(`/api/loans?search=${term}`);
            if (response.ok) {
                const data = await response.json();
                setLoans(Array.isArray(data) ? data : (data.loans || []));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSearching(false);
        }
    };

    const handleCreate = async () => {
        if (!loanId || !amount || !reason) {
            toast.error('Faltan campos obligatorios');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/admin/penalties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    loanId,
                    amount: parseFloat(amount),
                    reason
                })
            });

            if (!response.ok) throw new Error('Error al crear');

            toast.success('Penalización registrada manualmente');
            onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-0 shadow-2xl max-w-lg">
                <DialogHeader className="p-8 bg-orange-600 text-white relative">
                    <div className="absolute top-[-20%] right-[-10%] w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                    <DialogTitle className="text-3xl font-black tracking-tight leading-none uppercase italic relative z-10">Carga Manual</DialogTitle>
                    <DialogDescription className="text-orange-100 font-bold opacity-80 underline underline-offset-4 decoration-orange-300 relative z-10">Registro de penalización extrajudicial</DialogDescription>
                </DialogHeader>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-gray-400">Buscar Préstamo / Cliente</Label>
                             <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                                <Input 
                                    placeholder="Nombre o Folio..." 
                                    className="pl-12 h-14 rounded-2xl bg-gray-50 border-0 focus:ring-4 focus:ring-orange-100 font-bold"
                                    onChange={(e) => searchLoans(e.target.value)}
                                />
                                {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-orange-500" />}
                             </div>
                             
                             {loans.length > 0 && !loanId && (
                                <div className="max-h-40 overflow-y-auto rounded-2xl border border-orange-100 bg-white p-2 shadow-lg animate-in slide-in-from-top-2 duration-300">
                                    {loans.map(loan => (
                                        <div 
                                            key={loan.id} 
                                            className="p-3 hover:bg-orange-50 rounded-xl cursor-copy flex justify-between items-center transition-colors border border-transparent hover:border-orange-200"
                                            onClick={() => setLoanId(loan.id)}
                                        >
                                            <span className="font-black text-sm">{loan.client?.firstName} {loan.client?.lastName}</span>
                                            <Badge className="bg-orange-600 text-white font-mono text-[9px]">{loan.loanNumber}</Badge>
                                        </div>
                                    ))}
                                </div>
                             )}

                             {loanId && (
                                <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-200 flex items-center justify-between animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        <span className="font-black text-green-800">
                                            Préstamo Seleccionado: {loans.find(l => l.id === loanId)?.loanNumber}
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setLoanId('')} className="h-8 w-8 p-0 rounded-full text-green-700 hover:bg-green-100">
                                        <XCircle className="h-5 w-5" />
                                    </Button>
                                </div>
                             )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400">Monto (MXN)</Label>
                                <Input 
                                    type="number" 
                                    value={amount} 
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="h-14 rounded-2xl bg-gray-50 border-0 text-xl font-black text-orange-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400">Frecuencia</Label>
                                <div className="h-14 flex items-center px-4 rounded-2xl bg-gray-100/50 text-gray-400 font-black text-xs uppercase tracking-widest italic">Cargo Único</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-gray-400">Razón de Sanción</Label>
                            <Input 
                                value={reason} 
                                onChange={(e) => setReason(e.target.value)}
                                className="h-14 rounded-2xl bg-gray-50 border-0 font-bold"
                                placeholder="Ej: No se encontró al aval, falta de firma..."
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 border-t bg-gray-50/50">
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="rounded-2xl h-14 font-black uppercase text-xs tracking-widest"
                    >Cancelar</Button>
                    <Button 
                        onClick={handleCreate}
                        disabled={loading || !loanId}
                        className="rounded-2xl h-14 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-xs tracking-widest px-8 shadow-xl shadow-orange-500/20"
                    >
                        {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <ShieldAlert className="h-4 w-4 mr-2" />}
                        Registrar Penalización
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
