
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Send, ShieldCheck, WhatsappIcon, MessageSquare, Key, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { PageLoader } from '@/components/ui/page-loader';

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
        try {
            const res = await fetch('/api/admin/system/config?category=GLOBAL_WAHA');
            if (res.ok) {
                const data = await res.json();
                setConfigs(data);
            }
        } catch (error) {
            toast.error('Error al cargar configuración');
        } finally {
            setLoading(false);
        }
    };

    const getConfigValue = (key: string) => {
        return configs.find(c => c.key === key)?.value || '';
    };

    const setConfigValue = (key: string, value: string) => {
        setConfigs(prev => {
            const existing = prev.find(c => c.key === key);
            if (existing) {
                return prev.map(c => c.key === key ? { ...c, value } : c);
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
                body: JSON.stringify({ configs })
            });

            if (res.ok) {
                toast.success('Configuración global guardada');
            } else {
                toast.error('Error al guardar');
            }
        } catch (error) {
            toast.error('Error de red');
        } finally {
            setSaving(false);
        }
    };

    const handleTestMessage = async () => {
        if (!testPhone) {
            toast.error('Ingresa un número de prueba');
            return;
        }

        setTestLoading(true);
        try {
            const baseUrl = getConfigValue('global_waha_url');
            const apiKey = getConfigValue('global_waha_api_key');
            const session = getConfigValue('global_waha_session') || 'default';

            if (!baseUrl) {
                toast.error('Configura la URL de WAHA primero');
                return;
            }

            const res = await fetch(`${baseUrl}/api/sendText`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(apiKey ? { 'X-Api-Key': apiKey } : {})
                },
                body: JSON.stringify({
                    chatId: `${testPhone}@c.us`,
                    text: 'Prueba de configuración GLOBAL WAHA de EscalaFin. Este mensaje se usa para notificaciones del sistema.',
                    session: session
                })
            });

            if (res.ok) {
                toast.success('Mensaje de prueba enviado');
            } else {
                const err = await res.json();
                toast.error(err.message || 'Error al enviar');
            }
        } catch (error) {
            toast.error('Error de conexión con WAHA');
        } finally {
            setTestLoading(false);
        }
    };

    if (loading) return <PageLoader message="Cargando configuración global..." />;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Configuración Global</h1>
                    <p className="text-gray-500">Parámetros del sistema que aplican a nivel plataforma (SaaS).</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-indigo-600">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Cambios
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card className="border-indigo-100 shadow-sm">
                    <CardHeader className="bg-indigo-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 rounded-lg text-white">
                                <Key className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>API WAHA (Global)</CardTitle>
                                <CardDescription>Instancia de WhatsApp para notificaciones del sistema (ej. restablecimiento de contraseñas).</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="waha_url">URL Base de WAHA</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input 
                                        id="waha_url"
                                        placeholder="https://su-waha.com"
                                        value={getConfigValue('global_waha_url')}
                                        onChange={(e) => setConfigValue('global_waha_url', e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="waha_key">API Key (X-Api-Key)</Label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input 
                                        id="waha_key" 
                                        type="password"
                                        placeholder="Opcional"
                                        value={getConfigValue('global_waha_api_key')}
                                        onChange={(e) => setConfigValue('global_waha_api_key', e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="waha_session">Sesión Administrativa</Label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input 
                                        id="waha_session"
                                        placeholder="default"
                                        value={getConfigValue('global_waha_session')}
                                        onChange={(e) => setConfigValue('global_waha_session', e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400">Nombre de la sesión en WAHA dedicada a la plataforma.</p>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 mt-4">
                            <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                                <Send className="h-4 w-4" /> Probar Conexión
                            </h4>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="521..." 
                                    className="flex-1 bg-white"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                />
                                <Button 
                                    variant="outline" 
                                    onClick={handleTestMessage}
                                    disabled={testLoading}
                                    className="border-amber-200 text-amber-700 hover:bg-amber-100"
                                >
                                    {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Prueba"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm">
                    <CardHeader>
                        <CardTitle>Canal de Recuperación</CardTitle>
                        <CardDescription>Configura cómo se envían los enlaces de restablecimiento.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border-indigo-500 bg-indigo-50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                                    <Send className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">WhatsApp (WAHA)</p>
                                    <p className="text-xs text-gray-500">Usa el canal configurado arriba para enviar OTPs y enlaces.</p>
                                </div>
                            </div>
                            <div className="h-5 w-5 rounded-full border-4 border-indigo-600 bg-white shadow-inner"></div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border rounded-xl opacity-50 cursor-not-allowed">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                    <Globe className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Correo Electrónico (SMTP)</p>
                                    <p className="text-xs text-gray-500">Configuración disponible en próxima actualización.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
