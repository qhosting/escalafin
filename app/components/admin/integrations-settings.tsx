
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
    Key,
    Webhook,
    Plus,
    Trash2,
    Copy,
    Eye,
    EyeOff,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Activity,
    ExternalLink,
    Terminal,
    Settings2,
    History,
    Play,
    ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

export function IntegrationsSettings() {
    const [loading, setLoading] = useState(true);
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [webhooks, setWebhooks] = useState<any[]>([]);
    const [availableScopes, setAvailableScopes] = useState<any[]>([]);
    const [availableEvents, setAvailableEvents] = useState<any[]>([]);

    // Create Form States
    const [showKeyForm, setShowKeyForm] = useState(false);
    const [showWebhookForm, setShowWebhookForm] = useState(false);
    const [newKey, setNewKey] = useState({ name: '', scopes: [] as string[] });
    const [newWebhook, setNewWebhook] = useState({ url: '', description: '', events: [] as string[] });

    // Result State
    const [generatedKey, setGeneratedKey] = useState<{ key: string, prefix: string } | null>(null);
    const [generatedWebhookSecret, setGeneratedWebhookSecret] = useState<string | null>(null);

    // UI Helpers
    const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const fetchIntegrations = async () => {
        setLoading(true);
        try {
            const [keysRes, hooksRes] = await Promise.all([
                fetch('/api/api-keys'),
                fetch('/api/webhooks/endpoints')
            ]);

            if (keysRes.ok) {
                const data = await keysRes.json();
                setApiKeys(data.apiKeys || []);
                setAvailableScopes(data.availableScopes || []);
            }

            if (hooksRes.ok) {
                const data = await hooksRes.json();
                setWebhooks(data.endpoints || []);
                setAvailableEvents(data.availableEvents || []);
            }
        } catch (error) {
            console.error('Error fetching integrations:', error);
            toast.error('Error al cargar integraciones');
        } finally {
            setLoading(false);
        }
    };

    // --- API KEYS LOGIC ---
    const createApiKey = async () => {
        if (!newKey.name || newKey.scopes.length === 0) {
            toast.error('Nombre y permisos son obligatorios');
            return;
        }

        try {
            const res = await fetch('/api/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newKey)
            });

            if (res.ok) {
                const data = await res.json();
                setGeneratedKey({ key: data.secretKey, prefix: data.apiKey.keyPrefix });
                toast.success('API Key generada exitosamente');
                fetchIntegrations();
                setShowKeyForm(false);
                setNewKey({ name: '', scopes: [] });
            } else {
                const error = await res.json();
                toast.error(error.error || 'Error al crear API Key');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    const deleteApiKey = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta API Key? Las integraciones que la usen dejarán de funcionar.')) return;

        try {
            const res = await fetch(`/api/api-keys?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('API Key eliminada');
                fetchIntegrations();
            }
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    // --- WEBHOOKS LOGIC ---
    const createWebhook = async () => {
        if (!newWebhook.url || newWebhook.events.length === 0) {
            toast.error('URL y eventos son obligatorios');
            return;
        }

        try {
            const res = await fetch('/api/webhooks/endpoints', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newWebhook)
            });

            if (res.ok) {
                const data = await res.json();
                setGeneratedWebhookSecret(data.endpoint.secret);
                toast.success('Webhook creado exitosamente');
                fetchIntegrations();
                setShowWebhookForm(false);
                setNewWebhook({ url: '', description: '', events: [] });
            } else {
                const error = await res.json();
                toast.error(error.error || 'Error al crear Webhook');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    const deleteWebhook = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este webhook?')) return;

        try {
            const res = await fetch(`/api/webhooks/endpoints/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Webhook eliminado');
                fetchIntegrations();
            }
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const toggleWebhook = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/webhooks/endpoints/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            if (res.ok) {
                toast.success(currentStatus ? 'Webhook desactivado' : 'Webhook activado');
                fetchIntegrations();
            }
        } catch (error) {
            toast.error('Error al actualizar estado');
        }
    };

    const testWebhook = async (id: string) => {
        setTestingWebhookId(id);
        try {
            const res = await fetch(`/api/webhooks/endpoints/${id}/test`, { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                toast.success(`Prueba exitosa (Status ${data.statusCode}) en ${data.duration}ms`);
            } else {
                toast.error(`La prueba falló: ${data.error || 'Status ' + data.statusCode}`);
            }
        } catch (error) {
            toast.error('Error al conectar con el endpoint');
        } finally {
            setTestingWebhookId(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copiado al portapapeles');
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="apikeys">
                <TabsList>
                    <TabsTrigger value="apikeys" className="flex gap-2">
                        <Key className="w-4 h-4" /> API Keys
                    </TabsTrigger>
                    <TabsTrigger value="webhooks" className="flex gap-2">
                        <Webhook className="w-4 h-4" /> Webhooks
                    </TabsTrigger>
                </TabsList>

                {/* API KEYS CONTENT */}
                <TabsContent value="apikeys" className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold">Llaves de API</h3>
                            <p className="text-sm text-gray-500">Usa estas llaves para autenticar peticiones desde tus propios sistemas.</p>
                        </div>
                        <Button onClick={() => setShowKeyForm(true)} size="sm">
                            <Plus className="w-4 h-4 mr-2" /> Nueva Llave
                        </Button>
                    </div>

                    {generatedKey && (
                        <Card className="bg-emerald-50 border-emerald-200">
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm flex items-center gap-2 text-emerald-800">
                                    <ShieldCheck className="w-4 h-4" />
                                    Guarda tu API Key ahora
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-xs text-emerald-700">Por seguridad, solo mostramos esta clave una vez. Si la pierdes, deberás generar una nueva.</p>
                                <div className="flex gap-2">
                                    <code className="flex-1 p-2 bg-white rounded border border-emerald-200 font-mono text-sm break-all text-emerald-900">
                                        {generatedKey.key}
                                    </code>
                                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(generatedKey.key)}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setGeneratedKey(null)} className="text-emerald-800">
                                    Ya la guardé
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {showKeyForm && (
                        <Card className="border-primary shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-md">Crear nueva API Key</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nombre de la llave (ej: Servidor ERP)</Label>
                                    <Input
                                        value={newKey.name}
                                        onChange={e => setNewKey({ ...newKey, name: e.target.value })}
                                        placeholder="Mi integración externa"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Permisos (Scopes)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg border">
                                        {availableScopes.map(s => (
                                            <div key={s.scope} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={s.scope}
                                                    className="w-4 h-4 text-primary accent-primary"
                                                    checked={newKey.scopes.includes(s.scope)}
                                                    onChange={e => {
                                                        const scopes = e.target.checked
                                                            ? [...newKey.scopes, s.scope]
                                                            : newKey.scopes.filter(x => x !== s.scope);
                                                        setNewKey({ ...newKey, scopes });
                                                    }}
                                                />
                                                <label htmlFor={s.scope} className="text-xs cursor-pointer select-none">
                                                    {s.description}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" onClick={() => setShowKeyForm(false)}>Cancelar</Button>
                                    <Button onClick={createApiKey}>Generar API Key</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid gap-4">
                        {apiKeys.length === 0 && !loading && !showKeyForm && (
                            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                <Key className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500">No tienes API keys activas.</p>
                            </div>
                        )}

                        {apiKeys.map(key => (
                            <Card key={key.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="flex items-center justify-between py-4 px-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">{key.name}</span>
                                            {key.isActive ? (
                                                <Badge variant="success" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 uppercase text-[10px]">Activa</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="uppercase text-[10px]">Inactiva</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono font-bold text-gray-700">{key.keyPrefix}</code>
                                            <span className="flex items-center gap-1">
                                                <Activity className="w-3 h-3 text-gray-400" />
                                                Creada el {new Date(key.createdAt).toLocaleDateString()}
                                            </span>
                                            {key.lastUsedAt && (
                                                <span className="flex items-center gap-1 text-primary">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Último uso: {new Date(key.lastUsedAt).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600" onClick={() => deleteApiKey(key.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* WEBHOOKS CONTENT */}
                <TabsContent value="webhooks" className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold">Webhooks Industriales</h3>
                            <p className="text-sm text-gray-500">Conecta EscalaFin con tus servidores para recibir eventos en tiempo real.</p>
                        </div>
                        <Button onClick={() => setShowWebhookForm(true)} size="sm">
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Endpoint
                        </Button>
                    </div>

                    {generatedWebhookSecret && (
                        <Card className="bg-indigo-50 border-indigo-200">
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm flex items-center gap-2 text-indigo-800">
                                    <ShieldCheck className="w-4 h-4" />
                                    Webhook Secret
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-xs text-indigo-700">Usa este secreto para verificar que los webhooks provienen de EscalaFin usando la firma <code>X-Webhook-Signature</code> (HMAC-SHA256).</p>
                                <div className="flex gap-2">
                                    <code className="flex-1 p-2 bg-white rounded border border-indigo-200 font-mono text-sm break-all text-indigo-900">
                                        {generatedWebhookSecret}
                                    </code>
                                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(generatedWebhookSecret)}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setGeneratedWebhookSecret(null)} className="text-indigo-800">
                                    Entendido
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {showWebhookForm && (
                        <Card className="border-primary shadow-lg bg-white">
                            <CardHeader>
                                <CardTitle className="text-md">Configurar Webhook</CardTitle>
                                <CardDescription>EscalaFin enviará un POST JSON a esta URL cada vez que ocurra un evento.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Endpoint URL</Label>
                                        <Input
                                            value={newWebhook.url}
                                            onChange={e => setNewWebhook({ ...newWebhook, url: e.target.value })}
                                            placeholder="https://tu-sistema.com/webhooks/escalafin"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Descripción (opcional)</Label>
                                        <Input
                                            value={newWebhook.description}
                                            onChange={e => setNewWebhook({ ...newWebhook, description: e.target.value })}
                                            placeholder="ERP Interno / Servidor de Análisis"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Eventos para notificar</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg border max-h-60 overflow-y-auto">
                                        <div className="flex items-center space-x-2 border-b pb-2 mb-2 col-span-full">
                                            <input
                                                type="checkbox"
                                                id="event-all"
                                                className="w-4 h-4 text-primary"
                                                checked={newWebhook.events.includes('*')}
                                                onChange={e => {
                                                    const events = e.target.checked ? ['*'] : [];
                                                    setNewWebhook({ ...newWebhook, events });
                                                }}
                                            />
                                            <label htmlFor="event-all" className="text-sm font-bold cursor-pointer">
                                                Todos los eventos (*)
                                            </label>
                                        </div>
                                        {availableEvents.map(ev => (
                                            <div key={ev.event} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`ev-${ev.event}`}
                                                    className="w-4 h-4 text-primary accent-primary"
                                                    disabled={newWebhook.events.includes('*')}
                                                    checked={newWebhook.events.includes(ev.event)}
                                                    onChange={e => {
                                                        const events = e.target.checked
                                                            ? [...newWebhook.events, ev.event]
                                                            : newWebhook.events.filter(x => x !== ev.event);
                                                        setNewWebhook({ ...newWebhook, events });
                                                    }}
                                                />
                                                <label htmlFor={`ev-${ev.event}`} className="text-xs cursor-pointer select-none">
                                                    {ev.description}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button variant="ghost" onClick={() => setShowWebhookForm(false)}>Cancelar</Button>
                                    <Button onClick={createWebhook}>Crear Webhook</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid gap-4">
                        {webhooks.length === 0 && !loading && !showWebhookForm && (
                            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-gray-50/50">
                                <Webhook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h4 className="font-medium text-gray-900">No hay webhooks configurados</h4>
                                <p className="text-gray-500 text-sm mt-1">Automatiza tu flujo de trabajo recibiendo eventos en tiempo real.</p>
                                <Button onClick={() => setShowWebhookForm(true)} variant="outline" size="sm" className="mt-4">
                                    <Plus className="w-4 h-4 mr-2" /> Configurar primer webhook
                                </Button>
                            </div>
                        )}

                        {webhooks.map(ep => (
                            <Card key={ep.id} className="overflow-hidden border-gray-200">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
                                        {/* Status & Info */}
                                        <div className="flex-1 p-5 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-gray-900 font-mono text-sm break-all">{ep.url}</h4>
                                                        <Badge variant={ep.isActive ? "success" : "secondary"} className="text-[10px] uppercase">
                                                            {ep.isActive ? "Escuchando" : "Pausado"}
                                                        </Badge>
                                                    </div>
                                                    {ep.description && <p className="text-xs text-gray-500">{ep.description}</p>}
                                                </div>
                                                <Switch
                                                    checked={ep.isActive}
                                                    onCheckedChange={() => toggleWebhook(ep.id, ep.isActive)}
                                                />
                                            </div>

                                            <div className="flex flex-wrap gap-1.5">
                                                {ep.events.map((e: string) => (
                                                    <Badge key={e} variant="outline" className="text-[10px] font-mono bg-gray-50">
                                                        {e}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Stats & Actions */}
                                        <div className="w-full md:w-72 bg-gray-50/50 p-5 flex flex-col justify-between space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase font-bold text-gray-400">Último Código</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-2 h-2 rounded-full ${ep.lastStatusCode && ep.lastStatusCode < 300
                                                                ? 'bg-emerald-500'
                                                                : ep.lastStatusCode ? 'bg-rose-500' : 'bg-gray-300'
                                                            }`} />
                                                        <span className="font-mono text-sm font-bold">
                                                            {ep.lastStatusCode || '---'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <p className="text-[10px] uppercase font-bold text-gray-400">Fallos</p>
                                                    <p className={`text-sm font-bold ${ep.failureCount > 0 ? 'text-rose-600' : 'text-gray-900'}`}>{ep.failureCount}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 w-full">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 h-8 text-[11px] font-bold"
                                                    onClick={() => testWebhook(ep.id)}
                                                    disabled={testingWebhookId === ep.id}
                                                >
                                                    {testingWebhookId === ep.id ? (
                                                        <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                                                    ) : (
                                                        <Play className="w-3 h-3 mr-1.5" />
                                                    )}
                                                    Probar
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="w-8 h-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                    onClick={() => deleteWebhook(ep.id)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200 flex gap-4">
                        <Terminal className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                            <h5 className="text-sm font-bold text-amber-900">Guía de Firmas</h5>
                            <p className="text-xs text-amber-800 leading-relaxed mt-1">
                                Por seguridad, cada request incluye un header <code>X-Webhook-Signature</code>.
                                Debes calcular el HMAC-SHA256 del raw body usando tu secreto y compararlo para validar que el request viene de EscalaFin.
                            </p>
                            <Button variant="link" className="p-0 h-auto text-[11px] text-amber-900 font-bold mt-2" size="sm">
                                <Settings2 className="w-3 h-3 mr-1" /> Ver documentación técnica
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

