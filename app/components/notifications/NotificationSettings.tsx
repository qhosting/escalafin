'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSession } from 'next-auth/react';
import { Switch } from '@/components/ui/switch';

import { 
    Bell, 
    Mail, 
    Smartphone, 
    Clock, 
    AlertCircle, 
    CheckCircle2, 
    XCircle, 
    Megaphone, 
    Calendar,
    Settings2,
    ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const NOTIFICATION_TYPES = [
    { 
        id: 'PAYMENT_DUE', 
        label: 'Pagos por Vencer', 
        description: 'Avisos sobre créditos que están próximos a su fecha límite de pago.',
        icon: <Clock className="w-5 h-5 text-amber-500" />
    },
    { 
        id: 'PAYMENT_OVERDUE', 
        label: 'Pagos Vencidos', 
        description: 'Alertas críticas sobre pagos que han superado su fecha de vencimiento.',
        icon: <AlertCircle className="w-5 h-5 text-red-500" />
    },
    { 
        id: 'LOAN_APPROVED', 
        label: 'Préstamos Aprobados', 
        description: 'Notificaciones inmediatas cuando una solicitud de crédito es aceptada.',
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
    },
    { 
        id: 'LOAN_REJECTED', 
        label: 'Préstamos Rechazados', 
        description: 'Avisos sobre solicitudes que no pudieron ser procesadas o fueron declinadas.',
        icon: <XCircle className="w-5 h-5 text-slate-400" />
    },
    { 
        id: 'SYSTEM_ALERT', 
        label: 'Alertas del Sistema', 
        description: 'Comunicados técnicos importantes y actualizaciones de la plataforma.',
        icon: <Settings2 className="w-5 h-5 text-blue-500" />
    },
    { 
        id: 'MARKETING', 
        label: 'Promociones', 
        description: 'Nuevos productos financieros, beneficios exclusivos y noticias.',
        icon: <Megaphone className="w-5 h-5 text-purple-500" />
    },
    { 
        id: 'REMINDER', 
        label: 'Recordatorios Generales', 
        description: 'Tareas pendientes y avisos administrativos de tu cuenta.',
        icon: <Calendar className="w-5 h-5 text-indigo-500" />
    },
];

const CHANNELS = [
    { id: 'PUSH', label: 'Push (Navegador)', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'EMAIL', label: 'Correo Electrónico', icon: <Mail className="w-4 h-4" /> },
];

export function NotificationSettings() {
    const { data: session } = useSession();
    const { isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.id) {
            fetchSettings();
        }
    }, [session]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/notifications/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (type: string, channel: string, enabled: boolean) => {
        const newSettings = [...settings];
        const index = newSettings.findIndex(s => s.type === type && s.channel === channel);
        if (index >= 0) {
            newSettings[index] = { ...newSettings[index], enabled };
        } else {
            newSettings.push({ type, channel, enabled });
        }
        setSettings(newSettings);

        try {
            await fetch('/api/notifications/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, channel, enabled }),
            });
        } catch (e) {
            console.error(e);
            fetchSettings();
        }
    };

    const isEnabled = (type: string, channel: string) => {
        const setting = settings.find(s => s.type === type && s.channel === channel);
        return setting ? setting.enabled : true;
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-slate-500 font-medium">Sincronizando preferencias...</p>
        </div>
    );

    return (
        <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Master Push Switch */}
            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden">
                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-center justify-between p-8 gap-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                        <div className="flex items-center gap-5 text-center md:text-left">
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Bell className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Notificaciones Push</h3>
                                <p className="text-blue-100 font-medium opacity-90">Recibe alertas instantáneas en este dispositivo</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                            <span className="text-sm font-bold">{isSubscribed ? "ACTIVADO" : "DESACTIVADO"}</span>
                            <Switch
                                className="data-[state=checked]:bg-white data-[state=unchecked]:bg-blue-300"
                                checked={isSubscribed}
                                disabled={permission === 'denied'}
                                onCheckedChange={(checked) => checked ? subscribe() : unsubscribe()}
                            />
                        </div>
                    </div>
                    {permission === 'denied' && (
                        <div className="px-8 py-3 bg-red-50 text-red-600 text-xs font-bold flex items-center gap-2">
                             <XCircle className="w-4 h-4" /> Los permisos de notificación están bloqueados por el navegador o sistema.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* granular Preferences */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Preferencias por Evento</h3>
                        <p className="text-slate-500 font-medium text-sm">Personaliza qué avisos deseas recibir por cada canal</p>
                    </div>
                    <Badge variant="outline" className="rounded-lg px-3 py-1 font-bold border-slate-100 bg-slate-50">
                        {CHANNELS.length} Canales disponibles
                    </Badge>
                </div>

                <div className="grid gap-4">
                    {NOTIFICATION_TYPES.map(type => (
                        <Card key={type.id} className="rounded-2xl border-none shadow-sm ring-1 ring-slate-100 hover:ring-blue-100 transition-all hover:bg-slate-50/50 group">
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-slate-50 group-hover:bg-white rounded-xl shadow-sm transition-colors ring-1 ring-slate-100">
                                            {type.icon}
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-slate-900 leading-none">{type.label}</h4>
                                            <p className="text-sm text-slate-500 font-medium max-w-md">{type.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 bg-white/50 p-2 px-4 rounded-xl ring-1 ring-slate-100 lg:ring-0 lg:p-0">
                                        {CHANNELS.map(channel => (
                                            <div key={channel.id} className="flex items-center gap-3">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                        {channel.icon}
                                                        {channel.id === 'PUSH' ? 'Push' : 'Correo'}
                                                    </span>
                                                    <Switch
                                                        checked={isEnabled(type.id, channel.id)}
                                                        onCheckedChange={(checked) => handleToggle(type.id, channel.id, checked)}
                                                        disabled={channel.id === 'PUSH' && !isSubscribed}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="bg-slate-900 text-white p-8 rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <ShieldCheck className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-4">
                    <h4 className="text-xl font-black">Control Total sobre tu Privacidad</h4>
                    <p className="max-w-xl text-slate-400 font-medium leading-relaxed">
                        En EscalaFin respetamos tu tiempo. Puedes cambiar estas preferencias en cualquier momento y se aplicarán de forma instantánea a todos tus dispositivos vinculados.
                    </p>
                </div>
            </div>
        </div>
    );
}

function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
