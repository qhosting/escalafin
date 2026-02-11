
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  Smartphone,
  MessageCircle,
  Mail,
  Bell,
  AlertCircle,
  CheckCircle,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

interface MessageTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  channel: string;
  template: string;
  variables?: string;
  maxLength?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const TEMPLATE_CATEGORIES = [
  { value: 'ACCOUNT_CREATED', label: 'Cuenta Creada' },
  { value: 'PAYMENT_RECEIVED', label: 'Pago Recibido' },
  { value: 'PAYMENT_REMINDER', label: 'Recordatorio de Pago' },
  { value: 'PAYMENT_OVERDUE', label: 'Pago Vencido' },
  { value: 'LOAN_APPROVED', label: 'Préstamo Aprobado' },
  { value: 'LOAN_DISBURSED', label: 'Préstamo Desembolsado' },
  { value: 'LOAN_REJECTED', label: 'Préstamo Rechazado' },
  { value: 'LOAN_UPDATE', label: 'Actualización de Préstamo' },
  { value: 'CREDIT_APPLICATION_RECEIVED', label: 'Solicitud Recibida' },
  { value: 'CREDIT_APPLICATION_APPROVED', label: 'Solicitud Aprobada' },
  { value: 'CREDIT_APPLICATION_REJECTED', label: 'Solicitud Rechazada' },
  { value: 'WELCOME', label: 'Bienvenida' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'CUSTOM', label: 'Personalizado' },
];

const CHANNELS = [
  { value: 'SMS', label: 'SMS (LabMobile)', icon: Smartphone },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle },
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'PUSH', label: 'Push', icon: Bell },
];

export function MessageTemplatesManagement() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'CUSTOM',
    channel: 'SMS',
    template: '',
    variables: '',
    isActive: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/message-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validar longitud para SMS
      if (formData.channel === 'SMS' && formData.template.length > 160) {
        toast.error('Las plantillas SMS no pueden exceder 160 caracteres');
        return;
      }

      setSaving(true);

      const url = editingTemplate
        ? `/api/admin/message-templates/${editingTemplate.id}`
        : '/api/admin/message-templates';

      const response = await fetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          editingTemplate
            ? 'Plantilla actualizada exitosamente'
            : 'Plantilla creada exitosamente'
        );
        setDialogOpen(false);
        resetForm();
        fetchTemplates();
      } else {
        toast.error(data.error || 'Error al guardar plantilla');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Error al guardar plantilla');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta plantilla?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/message-templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Plantilla eliminada');
        fetchTemplates();
      } else {
        toast.error('Error al eliminar plantilla');
      }
    } catch (error) {
      toast.error('Error al eliminar plantilla');
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      channel: template.channel,
      template: template.template,
      variables: template.variables || '',
      isActive: template.isActive,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      category: 'CUSTOM',
      channel: 'SMS',
      template: '',
      variables: '',
      isActive: true,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const filteredTemplates =
    selectedChannel === 'all'
      ? templates
      : templates.filter((t) => t.channel === selectedChannel);

  const getChannelIcon = (channel: string) => {
    const channelData = CHANNELS.find((c) => c.value === channel);
    const Icon = channelData?.icon || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };

  const getChannelBadge = (channel: string) => {
    const colors: Record<string, string> = {
      SMS: 'bg-blue-500',
      WHATSAPP: 'bg-green-500',
      EMAIL: 'bg-orange-500',
      PUSH: 'bg-red-500',
    };
    return colors[channel] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plantillas de Mensajes</CardTitle>
              <CardDescription>
                Gestiona plantillas para SMS (LabMobile), WhatsApp y otros canales
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Plantilla
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
                  </DialogTitle>
                  <DialogDescription>
                    {formData.channel === 'SMS'
                      ? 'SMS limitado a 160 caracteres (LabMobile)'
                      : 'Sin límite de caracteres para este canal'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: SMS Pago Recibido"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Breve descripción de la plantilla"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="channel">
                        Canal <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.channel}
                        onValueChange={(value) =>
                          setFormData({ ...formData, channel: value })
                        }
                      >
                        <SelectTrigger id="channel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHANNELS.map((channel) => (
                            <SelectItem key={channel.value} value={channel.value}>
                              {channel.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">
                        Categoría <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category: value })
                        }
                      >
                        <SelectTrigger id="category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEMPLATE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template">
                      Plantilla <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="template"
                      value={formData.template}
                      onChange={(e) =>
                        setFormData({ ...formData, template: e.target.value })
                      }
                      placeholder="Mensaje con variables: Hola {nombre}, tu pago de ${monto} fue recibido."
                      rows={formData.channel === 'SMS' ? 3 : 6}
                      className="font-mono text-sm"
                    />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Usa {'{variable}'} para insertar datos dinámicos
                      </span>
                      <span
                        className={
                          formData.channel === 'SMS' && formData.template.length > 160
                            ? 'text-red-500 font-semibold'
                            : 'text-muted-foreground'
                        }
                      >
                        {formData.template.length}
                        {formData.channel === 'SMS' ? ' / 160' : ''} caracteres
                      </span>
                    </div>
                  </div>

                  {formData.channel === 'SMS' && formData.template.length > 160 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        El mensaje excede el límite de 160 caracteres para SMS.
                        Por favor, reduce el texto.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="variables">Variables disponibles</Label>
                    <Input
                      id="variables"
                      value={formData.variables}
                      onChange={(e) =>
                        setFormData({ ...formData, variables: e.target.value })
                      }
                      placeholder="nombre, monto, fecha, numero"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lista separada por comas de las variables usadas en la plantilla
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isActive">Estado</Label>
                      <p className="text-xs text-muted-foreground">
                        ¿Está plantilla está activa?
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center gap-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar Plantilla'
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedChannel} onValueChange={setSelectedChannel}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Todas</TabsTrigger>
              {CHANNELS.map((channel) => {
                const Icon = channel.icon;
                return (
                  <TabsTrigger key={channel.value} value={channel.value}>
                    <Icon className="mr-2 h-4 w-4" />
                    {channel.value}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No hay plantillas para este canal
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">
                                {template.name}
                              </CardTitle>
                              <Badge
                                className={`${getChannelBadge(
                                  template.channel
                                )} text-white`}
                              >
                                <span className="mr-1">
                                  {getChannelIcon(template.channel)}
                                </span>
                                {template.channel}
                              </Badge>
                              <Badge variant={template.isActive ? 'default' : 'secondary'}>
                                {template.isActive ? 'Activa' : 'Inactiva'}
                              </Badge>
                            </div>
                            {template.description && (
                              <CardDescription>{template.description}</CardDescription>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(template.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">
                              Plantilla
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(template.template)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copiar
                            </Button>
                          </div>
                          <div className="bg-muted p-3 rounded-md font-mono text-sm">
                            {template.template}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {template.template.length} caracteres
                            {template.channel === 'SMS' &&
                              ` (${160 - template.template.length} restantes)`}
                          </div>
                        </div>

                        {template.variables && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              Variables
                            </Label>
                            <div className="flex flex-wrap gap-1">
                              {template.variables.split(',').map((v, i) => (
                                <Badge key={i} variant="outline">
                                  {v.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Categoría:{' '}
                            {TEMPLATE_CATEGORIES.find(
                              (c) => c.value === template.category
                            )?.label || template.category}
                          </span>
                          <span>•</span>
                          <span>
                            Actualizado:{' '}
                            {new Date(template.updatedAt).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guía de Uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              SMS (LabMobile)
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
              <li>Límite estricto de 160 caracteres</li>
              <li>Ideal para notificaciones urgentes y recordatorios cortos</li>
              <li>Costo por mensaje enviado</li>
              <li>Alta tasa de apertura (98%)</li>
            </ul>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
              <li>Sin límite estricto de caracteres</li>
              <li>Soporta formato enriquecido (negrita, emojis, saltos de línea)</li>
              <li>Ideal para mensajes detallados e informativos</li>
              <li>Puede incluir media (imágenes, documentos)</li>
            </ul>
          </div>

          <Separator />

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Variables disponibles</h4>
            <p className="text-sm text-muted-foreground">
              Usa las siguientes variables en tus plantillas:
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <code className="bg-muted px-2 py-1 rounded">{'{nombre}'}</code> - Nombre del
                cliente
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">{'{email}'}</code> - Email
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">{'{monto}'}</code> - Monto en
                MXN
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">{'{numero}'}</code> - Número de
                préstamo/solicitud
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">{'{fecha}'}</code> - Fecha
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">{'{dias}'}</code> - Días de
                atraso
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">{'{plazo}'}</code> - Plazo en
                meses
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">{'{pagoMensual}'}</code> - Pago
                mensual
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
