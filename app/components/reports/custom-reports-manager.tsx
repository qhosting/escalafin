
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    FileText,
    Download,
    RefreshCw,
    Plus,
    History,
    CheckCircle2,
    XCircle,
    Clock,
    ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';

interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
}

interface Generation {
    id: string;
    status: string;
    createdAt: string;
    generatedAt?: string;
    fileSize?: number;
    template: {
        name: string;
    };
}

export function CustomReportsManager() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [history, setHistory] = useState<Generation[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [templatesRes, historyRes] = await Promise.all([
                fetch('/api/reports/custom/templates'),
                fetch('/api/reports/custom/history')
            ]);

            if (templatesRes.ok) setTemplates(await templatesRes.json());
            if (historyRes.ok) setHistory(await historyRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error al cargar datos de reportes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleGenerate = async (templateId: string) => {
        try {
            toast.promise(
                fetch('/api/reports/custom/generate', {
                    method: 'POST',
                    body: JSON.stringify({ templateId }),
                    headers: { 'Content-Type': 'application/json' }
                }).then(async res => {
                    if (!res.ok) throw new Error(await res.text());
                    return res.json();
                }),
                {
                    loading: 'Iniciando generación de reporte...',
                    success: () => {
                        fetchData();
                        return 'Reporte solicitado correctamente';
                    },
                    error: (err) => `Error: ${err.message}`
                }
            );
        } catch (error) {
            console.error('Error generating report:', error);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'FAILED': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'GENERATING': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
            default: return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const formatSize = (bytes?: number) => {
        if (!bytes) return '-';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List of Templates */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Plantillas Disponibles
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((template) => (
                            <Card key={template.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-md">{template.name}</CardTitle>
                                        <Badge variant="outline">{template.category}</Badge>
                                    </div>
                                    <CardDescription>{template.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        className="w-full"
                                        size="sm"
                                        onClick={() => handleGenerate(template.id)}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Generar Reporte
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                        {templates.length === 0 && !loading && (
                            <p className="text-muted-foreground text-sm col-span-2 py-8 text-center border-2 border-dashed rounded-lg">
                                No hay plantillas configuradas. Contacta al administrador.
                            </p>
                        )}
                    </div>
                </div>

                {/* Quick Actions / Tips */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Acciones Rápidas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start" disabled>
                            <Plus className="h-4 w-4 mr-2" />
                            Crear Nueva Plantilla
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={fetchData}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Actualizar Todo
                        </Button>
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
                            <strong>Tip:</strong> Los reportes Excel generados se guardan por 7 días.
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* History Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Historial de Generaciones Recientes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Reporte</TableHead>
                                <TableHead>Solicitado el</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Tamaño</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((gen) => (
                                <TableRow key={gen.id}>
                                    <TableCell className="font-medium">{gen.template.name}</TableCell>
                                    <TableCell className="text-sm">
                                        {new Date(gen.createdAt).toLocaleString('es-MX')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(gen.status)}
                                            <span className="text-sm">{gen.status}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatSize(gen.fileSize)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {gen.status === 'COMPLETED' ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(`/api/reports/custom/download/${gen.id}`, '_blank')}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Descargar
                                            </Button>
                                        ) : gen.status === 'GENERATING' ? (
                                            <Badge variant="outline">En proceso...</Badge>
                                        ) : (
                                            <Button variant="ghost" size="sm" onClick={() => handleGenerate(gen.id)} disabled>
                                                Reintentar
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {history.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Aún no has solicitado ningún reporte personalizado.
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
