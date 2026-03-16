
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bot, Plus, Trash2, Edit2, Loader2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatbotRule {
  id: string;
  trigger: string;
  triggerType: 'KEYWORD' | 'REGEX' | 'INTENT';
  response: string;
  responseType: 'TEXT' | 'TEMPLATE' | 'ACTION';
  priority: number;
  isActive: boolean;
}

export default function ChatbotRuleManager() {
  const [rules, setRules] = useState<ChatbotRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState<Partial<ChatbotRule>>({
    triggerType: 'KEYWORD',
    responseType: 'TEXT',
    priority: 0,
    isActive: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/chatbot/rules');
      const data = await response.json();
      if (data.success) {
        setRules(data.rules);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las reglas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentRule.trigger || !currentRule.response) {
      toast({
        title: 'Validación',
        description: 'Por favor complete el trigger y la respuesta',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const url = currentRule.id ? `/api/admin/chatbot/rules/${currentRule.id}` : '/api/admin/chatbot/rules';
      const method = currentRule.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentRule),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: `Regla ${currentRule.id ? 'actualizada' : 'creada'} correctamente`,
        });
        setIsDialogOpen(false);
        fetchRules();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la regla',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta regla?')) return;

    try {
      const response = await fetch(`/api/admin/chatbot/rules/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Regla eliminada correctamente',
        });
        fetchRules();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la regla',
        variant: 'destructive',
      });
    }
  };

  const openEdit = (rule: ChatbotRule) => {
    setCurrentRule(rule);
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setCurrentRule({
      triggerType: 'KEYWORD',
      responseType: 'TEXT',
      priority: 0,
      isActive: true
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Reglas del Chatbot Automático
          </CardTitle>
          <CardDescription>
            Configure respuestas automáticas basadas en palabras clave o patrones.
          </CardDescription>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Regla
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trigger</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Respuesta</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : rules.length > 0 ? (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium max-w-[150px] truncate">
                    {rule.trigger}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.triggerType}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate">
                    {rule.response}
                  </TableCell>
                  <TableCell>{rule.priority}</TableCell>
                  <TableCell>
                    {rule.isActive ? (
                      <Badge className="bg-green-500">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se han definido reglas aún.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{currentRule.id ? 'Editar Regla' : 'Nueva Regla del Chatbot'}</DialogTitle>
              <DialogDescription>
                Configure cómo debe responder el sistema automáticamente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Tipo</Label>
                <Select
                  value={currentRule.triggerType}
                  onValueChange={(v: any) => setCurrentRule({...currentRule, triggerType: v})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KEYWORD">Palabra Clave</SelectItem>
                    <SelectItem value="REGEX">Expresión Regular</SelectItem>
                    <SelectItem value="INTENT">Intención (IA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="trigger" className="text-right">Trigger</Label>
                <Input
                  id="trigger"
                  className="col-span-3"
                  value={currentRule.trigger}
                  onChange={(e) => setCurrentRule({...currentRule, trigger: e.target.value})}
                  placeholder="ej: saldo, deuda, pago"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="response" className="text-right">Respuesta</Label>
                <Textarea
                  id="response"
                  className="col-span-3"
                  rows={4}
                  value={currentRule.response}
                  onChange={(e) => setCurrentRule({...currentRule, response: e.target.value})}
                  placeholder="Hola {nombre}, tu saldo es {saldo}..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">Prioridad</Label>
                <Input
                  id="priority"
                  type="number"
                  className="col-span-3"
                  value={currentRule.priority}
                  onChange={(e) => setCurrentRule({...currentRule, priority: parseInt(e.target.value)})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="active" className="text-right">Activo</Label>
                <div className="col-span-3 flex items-center h-10">
                  <Switch
                    checked={currentRule.isActive}
                    onCheckedChange={(v) => setCurrentRule({...currentRule, isActive: v})}
                  />
                </div>
              </div>
              <div className="col-span-4 bg-muted/30 p-3 rounded-lg text-[11px] text-muted-foreground space-y-1">
                <p className="font-bold uppercase tracking-wider">Variables disponibles:</p>
                <div className="grid grid-cols-2 gap-x-2">
                  <span>{"{nombre}"} - Primer nombre</span>
                  <span>{"{nombre_completo}"} - Nombre completo</span>
                  <span>{"{saldo}"} - Saldo total</span>
                  <span>{"{proximo_pago}"} - Monto del sig. pago</span>
                  <span>{"{fecha_pago}"} - Fecha del sig. pago</span>
                  <span>{"{prestamo_numero}"} - # de préstamo</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Guardar Regla
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
