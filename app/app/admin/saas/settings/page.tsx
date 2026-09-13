'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Loader2,
    Save,
    Send,
    ShieldCheck,
    MessageSquare,
    Globe,
    ArrowLeft,
    RefreshCw,
    Server,
    Radio,
    KeyRound,
    CheckCircle2,
    AlertCircle,
    Mail,
    Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function GlobalSettingsPage() {
    const [configs, setConfigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const [testPhone, setTestPhone] = useState('');

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/system/config?category=GLOBAL_WAHA');
            if (res.ok) {
                const data = await res.json();
                setConfigs(data);
            } else {
                toast.error('Error al cargar configuración del sistema');
            }
        } catch {
            toast.error('Error de red al cargar configuración');
        } finally {
            setLoading(false);
        }
    };

    const getConfigValue = (key: string) => {
        return configs.find((c) => c.key === key)?.value || '';
    };

    const setConfigValue = (key: string, value: string) => {
        setConfigs((prev) => {
            const existing = prev.find((c) => c.key === key);
            if (existing) {
                return prev.map((c) => (c.key === key ? { ...c, value } : c));
            }
            return [...prev, { key, value, category: 'GLOBAL_WAHA' }];
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/system/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ configs }),
            });

            if (res.ok) {
                toast.success('Configuración global guardada correctamente');
            } else {
                const errorData = await res.json();
                toast.error(errorData.details || errorData.error || 'Error al guardar configuración');
            }
        } catch (error: any) {
            toast.error('Error de red: ' + (error.message || 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    };

    const handleTestMessage = async () => {
        if (!testPhone.trim()) {
            toast.error('Ingresa un número telefónico de prueba');
            return;
        }

        setTestLoading(true);
        try {
            const baseUrl = getConfigValue('global_waha_url');
            const apiKey = getConfigValue('global_waha_api_key');
            const session = getConfigValue('global_waha_session') || 'default';

            if (!baseUrl) {
                toast.error('Debes configurar la URL de WAHA antes de realizar pruebas');
                return;
            }

            const cleanUrl = baseUrl.replace(/\/+$/, '');
            const cleanPhone = testPhone.replace(/\D/g, '');

            const res = await fetch(`${cleanUrl}/api/sendText`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(apiKey ? { 'X-Api-Key': apiKey } : {}),
                },
                body: JSON.stringify({
                    chatId: `${cleanPhone}@c.us`,
                    text: 'Prueba de enlace exitosa: El motor de mensajería WAHA global de EscalaFin está sincronizado.',
                    session: session,
                }),
            });

            if (res.ok) {
                toast.success('Mensaje de prueba enviado con éxito');
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.message || 'Error en respuesta de WAHA');
            }
        } catch {
            toast.error('Error de conexión con la instancia de WAHA');
        } finally {
            setTestLoading(false);
        }
    };

    const wahaUrl = getConfigValue('global_waha_url');
    const wahaKey = getConfigValue('global_waha_api_key');
    const wahaSession = getConfigValue('global_waha_session') || 'default';
    const isWahaConfigured = Boolean(wahaUrl && wahaUrl.trim().length > 0);

    if (loading) {
        return (
            <div className="space-y-4 max-w-5xl mx-auto animate-pulse">
                <div className="h-12 bg-muted/60 rounded-2xl w-full" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-muted/50 rounded-2xl border border-border/50" />
                    ))}
                </div>
                <div className="h-80 bg-muted/40 rounded-2xl border border-border/50" />
                <div className="h-48 bg-muted/40 rounded-2xl border border-border/50" />
            </div>
        );
    }

    return (
        <div className="space-y-4 max-w-5xl mx-auto">
            {/* Executive Toolbar - Zero Redundant Titles */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card/60 backdrop-blur-sm border border-border/80 p-3 rounded-2xl shadow-xs">
                <div className="flex items-center gap-2 flex-wrap">
                    <Link href="/admin/saas">
                        <Button variant="ghost" size="sm" className="h-8 px-2.5 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                            <span className="text-xs font-medium">SaaS Core</span>
                        </Button>
                    </Link>
                    <span className="text-muted-foreground/30 text-xs">/</span>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Configuración Global de Plataforma</span>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-mono font-normal text-muted-foreground border-border/70 hidden sm:inline-flex">
                        GLOBAL_WAHA
                    </Badge>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchConfigs}
                        className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground border-border/70"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Recargar</span>
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="sm"
                        className="h-8 text-xs font-medium shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {saving ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Guardar Cambios
                    </Button>
                </div>
            </div>

            {/* High-Density KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="border border-border/80 bg-card/60 shadow-xs rounded-2xl hover:border-border transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3.5 px-4 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Gateway WAHA
                        </CardTitle>
                        <div className={`p-1.5 rounded-xl ${isWahaConfigured ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600'}`}>
                            {isWahaConfigured ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3.5 pt-1">
                        <div className="text-xl font-bold tracking-tight text-foreground truncate">
                            {isWahaConfigured ? 'Configurado' : 'Sin Configurar'}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {isWahaConfigured ? wahaUrl : 'Requiere URL de endpoint'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-card/60 shadow-xs rounded-2xl hover:border-border transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3.5 px-4 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Seguridad API
                        </CardTitle>
                        <div className={`p-1.5 rounded-xl ${wahaKey ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-slate-500/10 text-slate-500'}`}>
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3.5 pt-1">
                        <div className="text-xl font-bold tracking-tight text-foreground">
                            {wahaKey ? 'Protegido' : 'Público'}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            {wahaKey ? 'X-Api-Key vinculada' : 'Sin autenticación por token'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-card/60 shadow-xs rounded-2xl hover:border-border transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3.5 px-4 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Sesión Activa
                        </CardTitle>
                        <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Radio className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3.5 pt-1">
                        <div className="text-xl font-bold tracking-tight text-foreground font-mono">
                            {wahaSession}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Instancia dedicada a plataforma
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-card/60 shadow-xs rounded-2xl hover:border-border transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3.5 px-4 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Canal Notificaciones
                        </CardTitle>
                        <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <MessageSquare className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3.5 pt-1">
                        <div className="text-xl font-bold tracking-tight text-foreground">
                            WhatsApp
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Canal predeterminado para OTP
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Gateway Configuration Card */}
            <Card className="border-border/80 bg-card/60 shadow-xs rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border/70 pb-3 pt-3.5 px-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
                                <KeyRound className="h-4 w-4" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-semibold text-foreground">API WAHA (Global)</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Instancia de mensajería para alertas críticas, OTPs y recuperación de cuentas.
                                </CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-[11px] border-border/80 text-muted-foreground font-mono">
                            REST API
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="waha_url" className="text-xs font-medium text-foreground">
                                URL Base de WAHA
                            </Label>
                            <div className="relative">
                                <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    id="waha_url"
                                    placeholder="https://su-waha.com"
                                    value={getConfigValue('global_waha_url')}
                                    onChange={(e) => setConfigValue('global_waha_url', e.target.value)}
                                    className="pl-8 h-8 text-xs bg-background/80 border-border/80 rounded-xl"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Host donde corre el contenedor o cluster de WAHA.</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="waha_key" className="text-xs font-medium text-foreground">
                                API Key (X-Api-Key)
                            </Label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    id="waha_key"
                                    type="password"
                                    placeholder="Clave de acceso (opcional)"
                                    value={getConfigValue('global_waha_api_key')}
                                    onChange={(e) => setConfigValue('global_waha_api_key', e.target.value)}
                                    className="pl-8 h-8 text-xs bg-background/80 border-border/80 rounded-xl"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Token configurado en la variable WAHA_API_KEY.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="waha_session" className="text-xs font-medium text-foreground">
                                Sesión Administrativa
                            </Label>
                            <div className="relative">
                                <MessageSquare className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    id="waha_session"
                                    placeholder="default"
                                    value={getConfigValue('global_waha_session')}
                                    onChange={(e) => setConfigValue('global_waha_session', e.target.value)}
                                    className="pl-8 h-8 text-xs bg-background/80 border-border/80 rounded-xl"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Nombre de la sesión en WAHA dedicada a la plataforma SaaS.</p>
                        </div>
                    </div>

                    {/* Integrated Testing Panel */}
                    <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 mt-2">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <Send className="h-3.5 w-3.5 text-primary" />
                                Verificación y Prueba de Enlace
                            </h4>
                            <span className="text-[10px] text-muted-foreground font-mono">POST /api/sendText</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                                <Smartphone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Ej. 5214421234567"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                    className="h-8 pl-8 text-xs bg-background/90 border-border/80 rounded-xl font-mono"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleTestMessage}
                                disabled={testLoading || !isWahaConfigured}
                                className="h-8 text-xs gap-1.5 border-border/80 shrink-0"
                            >
                                {testLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Send className="h-3.5 w-3.5" />
                                )}
                                Probar Conexión
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                            Envía un mensaje de prueba con la plantilla oficial del sistema para certificar el enlace.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Notification & Recovery Channels */}
            <Card className="border-border/80 bg-card/60 shadow-xs rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border/70 pb-3 pt-3.5 px-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <Server className="h-4 w-4" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-semibold text-foreground">Canales de Recuperación y Alerta</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Vías autorizadas para la entrega de códigos de seguridad y notificaciones críticas.
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 space-y-2.5">
                    {/* Active WhatsApp Channel */}
                    <div className="flex items-center justify-between p-3 border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/30">
                                <MessageSquare className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-xs text-foreground">WhatsApp Gateway (WAHA)</p>
                                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] border-emerald-500/30">
                                        Activo • Predeterminado
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Canal principal para envío de OTP, enlaces de restablecimiento de clave y alertas de sesión.
                                </p>
                            </div>
                        </div>
                        <div className="h-4 w-4 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center">
                            <div className="h-1.5 w-1.5 bg-white rounded-full" />
                        </div>
                    </div>

                    {/* Future SMTP Channel */}
                    <div className="flex items-center justify-between p-3 border border-border/60 bg-muted/20 rounded-xl opacity-60">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-muted text-muted-foreground rounded-xl flex items-center justify-center shrink-0 border border-border/80">
                                <Mail className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-xs text-foreground">Correo Electrónico (SMTP)</p>
                                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/80">
                                        Próximamente
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Soporte para relay SMTP transaccional redundante (SendGrid / Amazon SES / Postmark).
                                </p>
                            </div>
                        </div>
                        <div className="h-4 w-4 rounded-full border border-border/80 bg-background" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
