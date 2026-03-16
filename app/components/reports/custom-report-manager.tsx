
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, Download, FileText, Plus, Search, Calendar, Filter, Loader2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CustomReportManager() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const { toast } = useToast();

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
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los reportes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (templateId: string) => {
    try {
      setIsGenerating(templateId);
      const response = await fetch('/api/reports/custom/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Éxito', description: 'Reporte generado correctamente' });
        fetchData();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al generar el reporte',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleDownload = (id: string) => {
    window.open(`/api/reports/custom/download/${id}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Reportes Personalizados</h2>
          <p className="text-muted-foreground">Genere reportes detallados en Excel a partir de plantillas.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Plantilla
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plantillas Disponibles */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Plantillas de Reportes
            </CardTitle>
            <CardDescription>Seleccione una plantilla para generar el reporte con los últimos datos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                <div className="col-span-2 text-center py-8">Cargando plantillas...</div>
              ) : templates.length > 0 ? (
                templates.map((template) => (
                  <Card key={template.id} className="border-muted hover:border-primary/50 transition-colors">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {template.category}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {template._count.generations} usos
                        </div>
                      </div>
                      <CardTitle className="text-lg mt-2">{template.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2 min-h-[2.5rem]">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0">
                      <Button
                        onClick={() => handleGenerate(template.id)}
                        disabled={!!isGenerating}
                        className="w-full gap-2 text-xs"
                        size="sm"
                      >
                        {isGenerating === template.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                        Generar Reporte
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                  No hay plantillas creadas.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Historial Reciente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historial Reciente
            </CardTitle>
            <CardDescription>Reportes generados listos para descargar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-4">Cargando...</div>
              ) : history.length > 0 ? (
                history.map((gen) => (
                  <div key={gen.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Download className="h-4 w-4 text-green-700" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{gen.template.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(gen.createdAt).toLocaleDateString()} {new Date(gen.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(gen.id)}
                      disabled={gen.status !== 'COMPLETED'}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No hay historial disponible.
                </p>
              )}
            </div>
          </CardContent>
          {history.length > 0 && (
            <CardFooter>
              <Button variant="ghost" className="w-full text-xs" size="sm">Ver Todo el Historial</Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
