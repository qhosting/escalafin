

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AuthWrapper } from '@/components/auth-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Check,
  X,
  Search,
  Filter,
  Archive,
  Trash2,
  MoreVertical,
  RefreshCw,
  Settings,
  BellRing,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  MessagesSquare,
  Headphones
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { NotificationSkeleton } from '@/components/layout/loading-variants';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  channel: 'system' | 'email' | 'whatsapp' | 'sms';
  read: boolean;
  archived: boolean;
  createdAt: string;
  userId?: string;
  metadata?: any;
}

interface NotificationSettings {
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  paymentReminders: boolean;
  overdueAlerts: boolean;
  systemUpdates: boolean;
  marketingMessages: boolean;
}

export default function NotificationsPage() {
  const { data: session } = useSession() || {};
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    whatsappNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    paymentReminders: true,
    overdueAlerts: true,
    systemUpdates: true,
    marketingMessages: false
  });

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchTerm, filterType]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Limitar a las últimas 10 notificaciones
      const response = await fetch('/api/notifications?limit=10');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);

        // Marcar automáticamente las notificaciones no leídas como leídas después de 3 segundos
        setTimeout(async () => {
          const unreadIds = (data.notifications || [])
            .filter((n: Notification) => !n.read)
            .map((n: Notification) => n.id);

          if (unreadIds.length > 0) {
            // Marcar como leídas en el servidor
            for (const id of unreadIds) {
              await markAsRead(id, false); // false = no mostrar toast
            }

            // Después de 5 segundos más, eliminar las notificaciones leídas
            setTimeout(async () => {
              for (const id of unreadIds) {
                await deleteNotification(id, false); // false = no mostrar toast
              }
            }, 5000);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const filterNotifications = () => {
    let filtered = notifications.filter(notification => {
      const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = filterType === 'all' ||
        (filterType === 'unread' && !notification.read) ||
        (filterType === 'read' && notification.read) ||
        (filterType === notification.type) ||
        (filterType === notification.channel);

      return matchesSearch && matchesFilter && !notification.archived;
    });

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId: string, showToast: boolean = true) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      if (showToast) {
        toast.success('Notificación marcada como leída');
      }
    } catch (error) {
      if (showToast) {
        toast.error('Error al marcar como leída');
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      toast.error('Error al marcar todas como leídas');
    }
  };

  const archiveNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/archive`, { method: 'POST' });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, archived: true } : n)
      );
      toast.success('Notificación archivada');
    } catch (error) {
      toast.error('Error al archivar');
    }
  };

  const deleteNotification = async (notificationId: string, showToast: boolean = true) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (showToast) {
        toast.success('Notificación eliminada');
      }
    } catch (error) {
      if (showToast) {
        toast.error('Error al eliminar');
      }
    }
  };

  const updateSettings = async (newSettings: NotificationSettings) => {
    try {
      await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      setSettings(newSettings);
      toast.success('Configuración actualizada');
    } catch (error) {
      toast.error('Error al actualizar configuración');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <X className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;

  return (
  const isMobile = useIsMobile();

  return (
    <AuthWrapper 
      allowedRoles={['ADMIN', 'ASESOR']} 
      loadingFallback={<NotificationSkeleton isMobile={isMobile} />}
    >
      <div className={cn("space-y-6", isMobile ? "px-2 pb-24" : "")}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
              <div className="p-2 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-900/20">
                <Bell className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              Centro de Alertas
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 animate-pulse rounded-lg font-black text-[10px]">
                  {unreadCount} NUEVAS
                </Badge>
              )}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest mt-2">
              Gestión de comunicaciones y eventos
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchNotifications} className="rounded-2xl h-12 font-black text-xs uppercase tracking-widest">
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Actualizar
            </Button>
            {unreadCount > 0 && !isMobile && (
              <Button onClick={markAllAsRead} className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-12 font-black text-xs uppercase tracking-widest">
                <Check className="h-4 w-4 mr-2" />
                Marcar todo leido
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="bg-white/50 dark:bg-gray-900/50 p-1 rounded-2xl border border-gray-200/50 dark:border-gray-800/50">
            <TabsTrigger value="notifications" className="rounded-xl flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
              <BellRing className="h-4 w-4" />
              Alertas
            </TabsTrigger>
            <TabsTrigger value="messages" className="rounded-xl flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
              <MessagesSquare className="h-4 w-4" />
              Mensajes
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
              <Settings className="h-4 w-4" />
              Ajustes
            </TabsTrigger>
          </TabsList>

          {/* Notifications List */}
          <TabsContent value="notifications">
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-black">Lista de Notificaciones</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-tighter">
                      Historial completo de alertas del sistema
                    </CardDescription>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative group">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-10 w-full sm:w-64 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 border-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      />
                    </div>

                    <select
                      className="h-10 px-3 text-xs font-black uppercase tracking-widest bg-gray-100/50 dark:bg-gray-800/50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="all">Todas</option>
                      <option value="unread">Sin leer</option>
                      <option value="read">Leídas</option>
                      <option value="success">Éxito</option>
                      <option value="warning">Alerta</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                {loading && notifications.length === 0 ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-3xl animate-pulse">
                         <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
                         <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 bg-gray-100 dark:bg-gray-800 rounded" />
                            <div className="h-3 w-full bg-gray-50 dark:bg-gray-800/50 rounded" />
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                      <div className="text-center py-8">
                        <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">No hay notificaciones que mostrar</p>
                      </div>
                    ) : (
                      filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border rounded-lg ${notification.read
                              ? 'bg-gray-50 dark:bg-gray-800'
                              : 'bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800'
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex items-center gap-2 mt-1">
                                {getTypeIcon(notification.type)}
                                {getChannelIcon(notification.channel)}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className={`font-medium ${!notification.read
                                      ? 'text-gray-900 dark:text-white'
                                      : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                    {notification.title}
                                  </h3>

                                  <Badge variant={getTypeBadgeVariant(notification.type)} className="text-xs">
                                    {notification.type}
                                  </Badge>

                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                  )}
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {notification.message}
                                </p>

                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  {new Date(notification.createdAt).toLocaleString('es-MX')}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 ml-4">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => archiveNotification(notification.id)}>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archivar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => deleteNotification(notification.id)}
                                    className="text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessagesSquare className="h-5 w-5" />
                  Historial de Mensajes
                </CardTitle>
                <CardDescription>
                  Mensajes enviados por WhatsApp y SMS a clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Próximamente
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      El historial de mensajes WhatsApp y SMS estará disponible aquí
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Notificaciones</CardTitle>
                <CardDescription>
                  Configura qué notificaciones deseas recibir y por qué canales
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Canales de Notificación */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Canales de Notificación</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <div>
                            <Label>Notificaciones por Email</Label>
                            <p className="text-sm text-gray-500">Recibir notificaciones por correo electrónico</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.emailNotifications}
                          onCheckedChange={(checked) =>
                            updateSettings({ ...settings, emailNotifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-4 w-4 text-green-500" />
                          <div>
                            <Label>Notificaciones WhatsApp</Label>
                            <p className="text-sm text-gray-500">Recibir alertas por WhatsApp</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.whatsappNotifications}
                          onCheckedChange={(checked) =>
                            updateSettings({ ...settings, whatsappNotifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-orange-500" />
                          <div>
                            <Label>Notificaciones SMS</Label>
                            <p className="text-sm text-gray-500">Recibir mensajes de texto</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.smsNotifications}
                          onCheckedChange={(checked) =>
                            updateSettings({ ...settings, smsNotifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bell className="h-4 w-4 text-purple-500" />
                          <div>
                            <Label>Notificaciones Push</Label>
                            <p className="text-sm text-gray-500">Notificaciones en el navegador</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.pushNotifications}
                          onCheckedChange={(checked) =>
                            updateSettings({ ...settings, pushNotifications: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tipos de Notificación */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Tipos de Notificación</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Recordatorios de Pago</Label>
                          <p className="text-sm text-gray-500">Alertas antes del vencimiento</p>
                        </div>
                        <Switch
                          checked={settings.paymentReminders}
                          onCheckedChange={(checked) =>
                            updateSettings({ ...settings, paymentReminders: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Alertas de Vencimiento</Label>
                          <p className="text-sm text-gray-500">Notificaciones de pagos vencidos</p>
                        </div>
                        <Switch
                          checked={settings.overdueAlerts}
                          onCheckedChange={(checked) =>
                            updateSettings({ ...settings, overdueAlerts: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Actualizaciones del Sistema</Label>
                          <p className="text-sm text-gray-500">Notificaciones de nuevas funcionalidades</p>
                        </div>
                        <Switch
                          checked={settings.systemUpdates}
                          onCheckedChange={(checked) =>
                            updateSettings({ ...settings, systemUpdates: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Mensajes de Marketing</Label>
                          <p className="text-sm text-gray-500">Promociones y ofertas especiales</p>
                        </div>
                        <Switch
                          checked={settings.marketingMessages}
                          onCheckedChange={(checked) =>
                            updateSettings({ ...settings, marketingMessages: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthWrapper>
  );
}
