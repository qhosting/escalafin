
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Brain, CheckCircle2, AlertTriangle, Play, RefreshCw, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MLModel {
  id: string;
  version: string;
  trainingSize: number;
  isActive: boolean;
  trainedAt: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  notes: string;
}

export default function MLDashboard() {
  const [models, setModels] = useState<MLModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetraining, setIsRetraining] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/ml/models');
      const data = await response.json();
      if (data.success) {
        setModels(data.models);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los modelos de ML',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetrain = async () => {
    try {
      setIsRetraining(true);
      const response = await fetch('/api/admin/ml/retrain', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Reentrenamiento completado con éxito',
        });
        fetchModels();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al reentrenar el modelo',
        variant: 'destructive',
      });
    } finally {
      setIsRetraining(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/ml/models/${id}/activate`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Modelo activado correctamente',
        });
        fetchModels();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo activar el modelo',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeModel = models.find(m => m.isActive);

  return (
    <div className="space-y-6">
      {/* Resumen del Modelo Activo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  Modelo Activo: {activeModel?.version || 'Ninguno'}
                </CardTitle>
                <CardDescription>
                  Este modelo procesa actualmente todas las evaluaciones de crédito
                </CardDescription>
              </div>
              <Badge variant={activeModel ? "default" : "outline"} className="px-3 py-1">
                {activeModel ? 'EN PRODUCCIÓN' : 'SIN MODELO'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {activeModel ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold">{(activeModel.metrics.accuracy * 100).toFixed(1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Precision</p>
                  <p className="text-2xl font-bold">{(activeModel.metrics.precision * 100).toFixed(1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Recall</p>
                  <p className="text-2xl font-bold">{(activeModel.metrics.recall * 100).toFixed(1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">F1 Score</p>
                  <p className="text-2xl font-bold">{(activeModel.metrics.f1Score * 100).toFixed(2)}</p>
                </div>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center text-center">
                <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
                <p className="text-muted-foreground">No hay un modelo de inteligencia artificial activo.</p>
                <p className="text-sm text-muted-foreground mt-1">Haga clic en reentrenar para generar el primer modelo.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2">
            <Button
              onClick={handleRetrain}
              disabled={isRetraining}
              className="gap-2"
            >
              {isRetraining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrenando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Reentrenar Modelo Ahora
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Dataset
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Total registros</span>
              <span className="font-medium">{models.reduce((acc, m) => Math.max(acc, m.trainingSize), 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Último entrenamiento</span>
              <span className="font-medium">
                {activeModel ? new Date(activeModel.trainedAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Próximo auto-entreno</span>
              <span className="font-medium text-primary">01/03/2026</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Historial de Modelos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Modelos</CardTitle>
          <CardDescription>
            Registro de todas las versiones del modelo IA entrenadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Versión</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Dataset Size</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.length > 0 ? (
                models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">{model.version}</TableCell>
                    <TableCell>{new Date(model.trainedAt).toLocaleDateString()}</TableCell>
                    <TableCell>{model.trainingSize} registros</TableCell>
                    <TableCell>{(model.metrics.accuracy * 100).toFixed(1)}%</TableCell>
                    <TableCell>
                      {model.isActive ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="outline">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!model.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleActivate(model.id)}
                          className="gap-1"
                        >
                          <Play className="h-3 w-3" />
                          Activar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se han encontrado modelos entrenados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
