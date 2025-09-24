
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { EnhancedSelect } from '@/components/ui/enhanced-select';
import { SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  UserPlus, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Calendar,
  Download,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface MigrationClient {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  currentBalance: number;
  lastPaymentDate?: string;
  monthlyIncome?: number;
  creditScore?: number;
  notes?: string;
  originalSystem?: string;
}

interface ClientMigrationProps {
  onClientsMigrated?: (clients: any[]) => void;
}

export function ClientMigration({ onClientsMigrated }: ClientMigrationProps) {
  const [activeTab, setActiveTab] = useState('manual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [migratedClients, setMigratedClients] = useState<any[]>([]);
  
  // Manual form state
  const [manualForm, setManualForm] = useState<MigrationClient>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    currentBalance: 0,
    lastPaymentDate: '',
    monthlyIncome: 0,
    creditScore: 0,
    notes: '',
    originalSystem: ''
  });

  // CSV data state
  const [csvData, setCsvData] = useState<MigrationClient[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  const handleManualInputChange = (field: keyof MigrationClient, value: string | number) => {
    setManualForm(prev => ({ ...prev, [field]: value }));
  };

  const validateClient = (client: MigrationClient): string[] => {
    const errors: string[] = [];
    
    if (!client.firstName.trim()) errors.push('Nombre es requerido');
    if (!client.lastName.trim()) errors.push('Apellido es requerido');
    if (!client.email.trim()) errors.push('Email es requerido');
    if (!client.phone.trim()) errors.push('Teléfono es requerido');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (client.email && !emailRegex.test(client.email)) {
      errors.push('Email debe tener un formato válido');
    }
    
    return errors;
  };

  const handleManualSubmit = async () => {
    const errors = validateClient(manualForm);
    if (errors.length > 0) {
      toast.error(`Errores de validación: ${errors.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/clients/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clients: [manualForm],
          migration: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al migrar cliente');
      }

      const result = await response.json();
      
      setMigratedClients(prev => [...prev, ...result.clients]);
      toast.success('Cliente migrado exitosamente');
      
      // Reset form
      setManualForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        currentBalance: 0,
        lastPaymentDate: '',
        monthlyIncome: 0,
        creditScore: 0,
        notes: '',
        originalSystem: ''
      });

      if (onClientsMigrated) {
        onClientsMigrated(result.clients);
      }

    } catch (error) {
      console.error('Migration error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al migrar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Por favor selecciona un archivo CSV');
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const requiredHeaders = ['nombre', 'apellido', 'email', 'telefono'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        toast.error(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
        return;
      }

      const clients: MigrationClient[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        
        const client: MigrationClient = {
          firstName: values[headers.indexOf('nombre')] || '',
          lastName: values[headers.indexOf('apellido')] || '',
          email: values[headers.indexOf('email')] || '',
          phone: values[headers.indexOf('telefono')] || '',
          address: values[headers.indexOf('direccion')] || '',
          currentBalance: parseFloat(values[headers.indexOf('saldo_actual')] || '0'),
          lastPaymentDate: values[headers.indexOf('ultimo_pago')] || '',
          monthlyIncome: parseFloat(values[headers.indexOf('ingresos_mensuales')] || '0'),
          creditScore: parseInt(values[headers.indexOf('score_crediticio')] || '0'),
          notes: values[headers.indexOf('notas')] || '',
          originalSystem: values[headers.indexOf('sistema_origen')] || 'CSV Import'
        };

        const clientErrors = validateClient(client);
        if (clientErrors.length > 0) {
          errors.push(`Línea ${i + 1}: ${clientErrors.join(', ')}`);
        } else {
          clients.push(client);
        }
      }

      setCsvData(clients);
      setCsvErrors(errors);
      
      if (clients.length > 0) {
        toast.success(`Se cargaron ${clients.length} clientes del CSV`);
      }
      
      if (errors.length > 0) {
        toast.warning(`Se encontraron ${errors.length} errores en el archivo`);
      }

    } catch (error) {
      console.error('CSV parsing error:', error);
      toast.error('Error al procesar el archivo CSV');
    }
  };

  const handleBulkMigration = async () => {
    if (csvData.length === 0) {
      toast.error('No hay clientes para migrar');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/clients/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clients: csvData,
          migration: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en migración masiva');
      }

      const result = await response.json();
      
      setMigratedClients(prev => [...prev, ...result.clients]);
      toast.success(`Se migraron ${result.clients.length} clientes exitosamente`);
      
      setCsvData([]);
      setCsvErrors([]);

      if (onClientsMigrated) {
        onClientsMigrated(result.clients);
      }

    } catch (error) {
      console.error('Bulk migration error:', error);
      toast.error(error instanceof Error ? error.message : 'Error en migración masiva');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadCSVTemplate = () => {
    const headers = [
      'nombre',
      'apellido', 
      'email',
      'telefono',
      'direccion',
      'saldo_actual',
      'ultimo_pago',
      'ingresos_mensuales',
      'score_crediticio',
      'notas',
      'sistema_origen'
    ];
    
    const exampleRow = [
      'Juan',
      'Pérez',
      'juan.perez@email.com',
      '5551234567',
      'Calle Principal 123',
      '15000.50',
      '2025-01-15',
      '25000',
      '750',
      'Cliente referido',
      'Sistema Anterior'
    ];

    const csvContent = [
      headers.join(','),
      exampleRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_migracion_clientes.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Migración de Clientes Existentes
          </CardTitle>
          <p className="text-muted-foreground">
            Importa clientes de otros sistemas con sus saldos y datos actuales
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Migración Manual
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Migración Masiva (CSV)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Agregar Cliente con Saldo Existente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información Personal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EnhancedInput
                  label="Nombre"
                  required
                  value={manualForm.firstName}
                  onChange={(e) => handleManualInputChange('firstName', e.target.value)}
                  example="Juan Carlos"
                  hint="Nombre completo del cliente"
                />
                
                <EnhancedInput
                  label="Apellido"
                  required
                  value={manualForm.lastName}
                  onChange={(e) => handleManualInputChange('lastName', e.target.value)}
                  example="Pérez González"
                  hint="Apellidos completos"
                />
                
                <EnhancedInput
                  label="Correo Electrónico"
                  type="email"
                  required
                  value={manualForm.email}
                  onChange={(e) => handleManualInputChange('email', e.target.value)}
                  example="juan.perez@email.com"
                  hint="Email válido para notificaciones"
                />
                
                <EnhancedInput
                  label="Teléfono"
                  required
                  value={manualForm.phone}
                  onChange={(e) => handleManualInputChange('phone', e.target.value)}
                  example="5551234567"
                  hint="Número de contacto principal"
                />
              </div>

              <EnhancedInput
                label="Dirección"
                value={manualForm.address || ''}
                onChange={(e) => handleManualInputChange('address', e.target.value)}
                example="Calle Principal 123, Colonia Centro"
                hint="Dirección completa del cliente"
              />

              {/* Información Financiera */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="input-label required-field">Saldo Actual</span>
                  </div>
                  <EnhancedInput
                    type="number"
                    step="0.01"
                    value={manualForm.currentBalance}
                    onChange={(e) => handleManualInputChange('currentBalance', parseFloat(e.target.value) || 0)}
                    example="15000.50"
                    hint="Saldo pendiente en el sistema anterior"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="input-label">Último Pago</span>
                  </div>
                  <EnhancedInput
                    type="date"
                    value={manualForm.lastPaymentDate || ''}
                    onChange={(e) => handleManualInputChange('lastPaymentDate', e.target.value)}
                    hint="Fecha del último pago registrado"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EnhancedInput
                  label="Ingresos Mensuales"
                  type="number"
                  step="0.01"
                  value={manualForm.monthlyIncome || ''}
                  onChange={(e) => handleManualInputChange('monthlyIncome', parseFloat(e.target.value) || 0)}
                  example="25000"
                  hint="Ingresos mensuales reportados"
                />
                
                <EnhancedInput
                  label="Score Crediticio"
                  type="number"
                  value={manualForm.creditScore || ''}
                  onChange={(e) => handleManualInputChange('creditScore', parseInt(e.target.value) || 0)}
                  example="750"
                  hint="Score del sistema anterior (300-850)"
                />
              </div>

              <div className="space-y-2">
                <label className="input-label">Sistema de Origen</label>
                <EnhancedInput
                  value={manualForm.originalSystem || ''}
                  onChange={(e) => handleManualInputChange('originalSystem', e.target.value)}
                  example="Sistema Anterior v2.1"
                  hint="Nombre del sistema o método de origen"
                />
              </div>

              <div className="space-y-2">
                <label className="input-label">Notas Adicionales</label>
                <Textarea
                  value={manualForm.notes || ''}
                  onChange={(e) => handleManualInputChange('notes', e.target.value)}
                  placeholder="Información adicional sobre el cliente..."
                  rows={3}
                  className="user-input"
                />
                <p className="example-hint">
                  💡 Incluye detalles importantes del historial crediticio
                </p>
              </div>

              <Button
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Migrando Cliente...
                  </div>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Migrar Cliente
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Migración Masiva desde CSV
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={downloadCSVTemplate}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descargar Plantilla
                  </Button>
                  
                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('csv-upload')?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Seleccionar Archivo CSV
                    </Button>
                  </div>
                </div>

                <div className="system-example">
                  <h4 className="font-medium mb-2">Columnas requeridas en el CSV:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <span>• nombre (requerido)</span>
                    <span>• apellido (requerido)</span>
                    <span>• email (requerido)</span>
                    <span>• telefono (requerido)</span>
                    <span>• direccion</span>
                    <span>• saldo_actual</span>
                    <span>• ultimo_pago (YYYY-MM-DD)</span>
                    <span>• ingresos_mensuales</span>
                    <span>• score_crediticio</span>
                    <span>• notas</span>
                    <span>• sistema_origen</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {csvErrors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    Errores Encontrados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {csvErrors.map((error, index) => (
                      <div key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {csvData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    Clientes Listos para Migrar ({csvData.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {csvData.slice(0, 10).map((client, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <span className="user-text">
                              {client.firstName} {client.lastName}
                            </span>
                            <span className="system-text ml-2">
                              • {client.email}
                            </span>
                          </div>
                          <Badge variant="outline">
                            {formatCurrency(client.currentBalance)}
                          </Badge>
                        </div>
                      ))}
                      
                      {csvData.length > 10 && (
                        <div className="text-center text-muted-foreground">
                          ... y {csvData.length - 10} clientes más
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleBulkMigration}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Migrando {csvData.length} Clientes...
                        </div>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Migrar {csvData.length} Clientes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Clientes Migrados */}
      {migratedClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Clientes Migrados Exitosamente ({migratedClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {migratedClients.map((client, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span className="user-text">
                    {client.firstName} {client.lastName}
                  </span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Migrado
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ClientMigration;
