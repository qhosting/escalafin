'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileSpreadsheet,
  Download,
  FileText,
  Plus,
  Calendar,
  Filter,
  Loader2,
  Play,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Users,
  Clock,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { ReportGeneratorModal } from './report-generator-modal';

export default function CustomReportManager() {
  const [activeTab, setActiveTab] = useState('quick');
  const [templates, setTemplates] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // Modal de Parametrización
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedDataSource, setSelectedDataSource] = useState<string>('loans');
  const [selectedTitle, setSelectedTitle] = useState<string>('Reporte de Préstamos');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [tRes, hRes] = await Promise.all([
        fetch('/api/reports/custom/templates'),
        fetch('/api/reports/custom/history')
      ]);
      const tData = await tRes.json();
      const hData = await hRes.json();
      setTemplates(tData.templates || []);
      setHistory(hData.history || []);
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('No se pudieron cargar los reportes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenGenerator = (template?: any, dataSource = 'loans', title = 'Reporte') => {
    setSelectedTemplate(template || null);
    setSelectedDataSource(dataSource);
    setSelectedTitle(title);
    setIsModalOpen(true);
  };

  const handleQuickDownload = (type: string, format: 'excel' | 'pdf') => {
    const url = `/api/reports/export?type=${type}&format=${format}&timeRange=30days`;
    window.open(url, '_blank');
    toast.success(`Descargando reporte en formato ${format.toUpperCase()}...`);
  };

  const handleGenerateAsync = async (templateId: string) => {
    try {
      setIsGenerating(templateId);
      const res = await fetch('/api/reports/custom/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar reporte');

      toast.success('Reporte generado en segundo plano');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error al generar reporte');
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header General */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileSpreadsheet className="h-7 w-7 text-blue-600" />
            Centro de Reportes & Exportaciones
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Descarga e inteligencia analítica de cartera, cobranza y rendimiento en Excel y PDF
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleOpenGenerator(undefined, 'loans', 'Reporte Personalizado')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs gap-2 shadow-md shadow-blue-500/20"
          >
            <Filter className="h-4 w-4" />
            Reporte con Filtros Avanzados
          </Button>
        </div>
      </div>

      {/* Tabs Principales con Colores de Estado */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden p-1.5 bg-slate-100/70 dark:bg-slate-900/60">
          <TabsList className="grid grid-cols-1 md:grid-cols-3 gap-1.5 bg-transparent h-auto p-0">
            <TabsTrigger
              value="quick"
              className="py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-500/30 data-[state=active]:scale-[1.02]"
            >
              <Sparkles className="h-4 w-4" />
              <span>1. Exportación Instantánea</span>
            </TabsTrigger>

            <TabsTrigger
              value="templates"
              className="py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:data-[state=active]:bg-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-500/30 data-[state=active]:scale-[1.02]"
            >
              <Layers className="h-4 w-4" />
              <span>2. Plantillas ({templates.length})</span>
            </TabsTrigger>

            <TabsTrigger
              value="history"
              className="py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 data-[state=active]:bg-emerald-600 data-[state=active]:text-white dark:data-[state=active]:bg-emerald-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-emerald-500/30 data-[state=active]:scale-[1.02]"
            >
              <Clock className="h-4 w-4" />
              <span>3. Historial de Descargas ({history.length})</span>
            </TabsTrigger>
          </TabsList>
        </Card>

        {/* ═══════════════════ PESTAÑA 1: EXPORTACIÓN INSTANTÁNEA ═══════════════════ */}
        <TabsContent value="quick" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Cartera General */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500/40 transition-all overflow-hidden">
              <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 border-b border-slate-100 dark:border-slate-800 p-5">
                <div className="flex items-center justify-between">
                  <Badge className="bg-blue-600 text-white font-bold rounded-lg text-[10px]">
                    Cartera General
                  </Badge>
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white mt-2">
                  Reporte General de Cartera y Préstamos
                </CardTitle>
                <CardDescription className="text-xs">
                  Detalle de préstamos otorgados, saldos por cobrar, tasas y estados de crédito.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    onClick={() => handleQuickDownload('loans', 'excel')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-2 h-10 shadow-xs"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel (.xlsx)
                  </Button>

                  <Button
                    onClick={() => handleQuickDownload('loans', 'pdf')}
                    variant="outline"
                    className="flex-1 border-red-200 hover:bg-red-50 text-red-700 font-bold rounded-xl text-xs gap-2 h-10"
                  >
                    <FileText className="h-4 w-4" />
                    PDF Documento
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 2. Cobranza y Pagos */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 transition-all overflow-hidden">
              <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-slate-100 dark:border-slate-800 p-5">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-600 text-white font-bold rounded-lg text-[10px]">
                    Cobranza Eficiente
                  </Badge>
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white mt-2">
                  Reporte de Cobranza & Ingresos Recibidos
                </CardTitle>
                <CardDescription className="text-xs">
                  Historial de abonos a capital, intereses, moratorios cobrados y método de pago.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    onClick={() => handleQuickDownload('payments', 'excel')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-2 h-10 shadow-xs"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel (.xlsx)
                  </Button>

                  <Button
                    onClick={() => handleQuickDownload('payments', 'pdf')}
                    variant="outline"
                    className="flex-1 border-red-200 hover:bg-red-50 text-red-700 font-bold rounded-xl text-xs gap-2 h-10"
                  >
                    <FileText className="h-4 w-4" />
                    PDF Documento
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 3. Cartera Vencida / Mora */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-500/40 transition-all overflow-hidden">
              <CardHeader className="bg-amber-50/50 dark:bg-amber-950/20 border-b border-slate-100 dark:border-slate-800 p-5">
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-600 text-white font-bold rounded-lg text-[10px]">
                    Control de Mora
                  </Badge>
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white mt-2">
                  Reporte de Préstamos Vencidos & Mora
                </CardTitle>
                <CardDescription className="text-xs">
                  Acreditados en estado vencido o mora para gestión de recuperación.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    onClick={() => handleQuickDownload('due-loans', 'excel')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-2 h-10 shadow-xs"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel (.xlsx)
                  </Button>

                  <Button
                    onClick={() => handleQuickDownload('due-loans', 'pdf')}
                    variant="outline"
                    className="flex-1 border-red-200 hover:bg-red-50 text-red-700 font-bold rounded-xl text-xs gap-2 h-10"
                  >
                    <FileText className="h-4 w-4" />
                    PDF Documento
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 4. Clientes y Asesores */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-500/40 transition-all overflow-hidden">
              <CardHeader className="bg-purple-50/50 dark:bg-purple-950/20 border-b border-slate-100 dark:border-slate-800 p-5">
                <div className="flex items-center justify-between">
                  <Badge className="bg-purple-600 text-white font-bold rounded-lg text-[10px]">
                    Directorio Comercial
                  </Badge>
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white mt-2">
                  Reporte de Clientes & Asignación de Asesores
                </CardTitle>
                <CardDescription className="text-xs">
                  Expediente básico, datos bancarios (CLABE), asesor responsable e ingresos.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    onClick={() => handleQuickDownload('clients', 'excel')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-2 h-10 shadow-xs"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel (.xlsx)
                  </Button>

                  <Button
                    onClick={() => handleQuickDownload('clients', 'pdf')}
                    variant="outline"
                    className="flex-1 border-red-200 hover:bg-red-50 text-red-700 font-bold rounded-xl text-xs gap-2 h-10"
                  >
                    <FileText className="h-4 w-4" />
                    PDF Documento
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════ PESTAÑA 2: PLANTILLAS ═══════════════════ */}
        <TabsContent value="templates" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <Card key={tpl.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400/50 transition-all overflow-hidden flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                      {tpl.category}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {tpl._count?.generations || 0} descargas
                    </span>
                  </div>
                  <CardTitle className="text-base font-black text-slate-900 dark:text-white pt-2">
                    {tpl.name}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2 min-h-[2.5rem]">
                    {tpl.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="p-4 pt-0">
                  <Button
                    onClick={() => handleOpenGenerator(tpl, undefined, tpl.name)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs gap-2 h-9"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Generar con Filtros
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══════════════════ PESTAÑA 3: HISTORIAL ═══════════════════ */}
        <TabsContent value="history" className="space-y-4 mt-0">
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <CardHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 p-4">
              <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                Historial de Reportes Generados
              </CardTitle>
              <CardDescription className="text-xs">
                Archivos procesados recientemente listos para descarga inmediata
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-xs">Plantilla / Nombre</TableHead>
                    <TableHead className="font-bold text-xs">Categoría</TableHead>
                    <TableHead className="font-bold text-xs">Fecha Generación</TableHead>
                    <TableHead className="font-bold text-xs">Estado</TableHead>
                    <TableHead className="text-right font-bold text-xs">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-400 font-medium">
                        Cargando historial de descargas...
                      </TableCell>
                    </TableRow>
                  ) : history.length > 0 ? (
                    history.map((gen) => (
                      <TableRow key={gen.id}>
                        <TableCell className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                          <span>{gen.template?.name || 'Reporte Personalizado'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase">
                            {gen.template?.category || 'General'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 font-medium">
                          {new Date(gen.createdAt).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          {gen.status === 'COMPLETED' ? (
                            <Badge className="bg-emerald-500 text-white font-bold text-[10px]">
                              Completado
                            </Badge>
                          ) : gen.status === 'GENERATING' ? (
                            <Badge className="bg-blue-500 text-white font-bold text-[10px]">
                              Procesando
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="font-bold text-[10px]">
                              Fallido
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {gen.filePath && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/api/reports/custom/download/${gen.id}`, '_blank')}
                              className="h-8 text-xs font-bold rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1"
                            >
                              <Download className="h-3.5 w-3.5" /> Descargar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-400 font-medium italic">
                        No hay reportes generados aún en el historial.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Parametrización */}
      <ReportGeneratorModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        template={selectedTemplate}
        defaultDataSource={selectedDataSource}
        defaultTitle={selectedTitle}
      />
    </div>
  );
}
