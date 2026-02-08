'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSession } from 'next-auth/react';
import { Switch } from '@/components/ui/switch';

const NOTIFICATION_TYPES = [
    { id: 'PAYMENT_DUE', label: 'Pagos por vencer' },
    { id: 'PAYMENT_OVERDUE', label: 'Pagos vencidos' },
    { id: 'LOAN_APPROVED', label: 'Préstamos aprobados' },
    { id: 'LOAN_REJECTED', label: 'Préstamos rechazados' },
    { id: 'SYSTEM_ALERT', label: 'Alertas del sistema' },
    { id: 'MARKETING', label: 'Promociones' },
    { id: 'REMINDER', label: 'Recordatorios' },
];

const CHANNELS = [
    { id: 'PUSH', label: 'Push (Web/App)' },
    { id: 'EMAIL', label: 'Correo' },
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
        // Optimistic update
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
            fetchSettings(); // Revert on error
        }
    };

    const isEnabled = (type: string, channel: string) => {
        const setting = settings.find(s => s.type === type && s.channel === channel);
        return setting ? setting.enabled : true; // Default to true if not set
    };

    if (loading) return <div>Cargando preferencias...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                <h3 className="text-lg font-medium mb-4 text-gray-900">Notificaciones Push</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-medium text-gray-800">Activar notificaciones en este dispositivo</div>
                        <div className="text-sm text-gray-500 mt-1">
                            {permission === 'denied'
                                ? 'Los permisos están bloqueados. Habilítalos en tu navegador.'
                                : isSubscribed
                                    ? 'Estás recibiendo notificaciones en este dispositivo.'
                                    : 'Recibe alertas sobre pagos y préstamos.'}
                        </div>
                    </div>
                    <Switch
                        checked={isSubscribed}
                        disabled={permission === 'denied'}
                        onCheckedChange={(checked) => checked ? subscribe() : unsubscribe()}
                    />
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                <h3 className="text-lg font-medium mb-4 text-gray-900">Preferencias por Tipo de Evento</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 font-medium text-sm text-gray-500 mb-2 border-b pb-2">
                        <div>Evento</div>
                        {CHANNELS.map(c => <div key={c.id} className="text-center">{c.label}</div>)}
                    </div>

                    {NOTIFICATION_TYPES.map(type => (
                        <div key={type.id} className="grid grid-cols-3 gap-4 items-center py-3 border-b last:border-0 hover:bg-gray-50">
                            <div className="font-medium text-gray-700">{type.label}</div>
                            {CHANNELS.map(channel => (
                                <div key={channel.id} className="flex justify-center">
                                    <Switch
                                        checked={isEnabled(type.id, channel.id)}
                                        onCheckedChange={(checked) => handleToggle(type.id, channel.id, checked)}
                                        // Only disable PUSH if master switch is OFF. EMAIL should be always available (or dependent on email verified)
                                        disabled={channel.id === 'PUSH' && !isSubscribed}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
