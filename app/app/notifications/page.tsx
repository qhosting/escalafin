

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
  Clock
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

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
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || mockNotifications);
      } else {
        setNotifications(mockNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications(mockNotifications);
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

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      toast.success('Notificación marcada como leída');
    } catch (error) {
      toast.error('Error al marcar como leída');
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

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notificación eliminada');
    } catch (error) {
      toast.error('Error al eliminar');
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

  // Mock data for demonstration
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Pago Vencido',
      message: 'El cliente Juan Pérez tiene un pago vencido de $5,000 MXN',
      type: 'warning',
      channel: 'system',
      read: false,
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Pago Procesado',
      message: 'Se ha procesado exitosamente un pago de $12,500 MXN de María García',
      type: 'success',
      channel: 'system',
      read: true,
      archived: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      title: 'Recordatorio de Pago',
      message: 'Recordatorio enviado por WhatsApp a Carlos Ruiz para pago próximo a vencer',
      type: 'info',
      channel: 'whatsapp',
      read: false,
      archived: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    }
  ];

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;

  return (
    <AuthWrapper allowedRoles={['ADMIN', 'ASESOR']}>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-8 h-8" />
              Centro de Notificaciones
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} sin leer
                </Badge>
              )}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Gestiona tus notificaciones y configuraciones de comunicación
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchNotifications}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                Marcar todas como leídas
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          {/* Notifications List */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Notificaciones</CardTitle>
                <CardDescription>
                  Todas tus notificaciones del sistema y comunicaciones
                </CardDescription>
                
                {/* Filters */}
                <div className="flex gap-4 mt-4">
                  <div className="flex-1 max-w-sm">
                    <Label htmlFor="search">Buscar</Label>
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Buscar notificaciones..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="filter">Filtrar</Label>
                    <select
                      id="filter"
                      className="w-40 p-2 border rounded-md"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="all">Todas</option>
                      <option value="unread">Sin leer</option>
                      <option value="read">Leídas</option>
                      <option value="success">Éxito</option>
                      <option value="warning">Advertencia</option>
                      <option value="error">Error</option>
                      <option value="info">Información</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-8 w-8 animate-spin" />
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
                          className={`p-4 border rounded-lg ${
                            notification.read 
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
                                  <h3 className={`font-medium ${
                                    !notification.read 
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
