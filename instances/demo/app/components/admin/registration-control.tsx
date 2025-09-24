
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertTriangle, UserPlus, UserX } from 'lucide-react';
import { toast } from 'sonner';

export function RegistrationControl() {
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRegistrationStatus();
  }, []);

  const fetchRegistrationStatus = async () => {
    try {
      const response = await fetch('/api/config/registration-status');
      const data = await response.json();
      setRegistrationEnabled(data.registrationEnabled);
    } catch (error) {
      console.error('Error fetching registration status:', error);
      toast.error('Error al obtener el estado del registro');
    } finally {
      setLoading(false);
    }
  };

  const updateRegistrationStatus = async (enabled: boolean) => {
    setSaving(true);
    try {
      const response = await fetch('/api/config/registration-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setRegistrationEnabled(enabled);
      toast.success(data.message);
    } catch (error: any) {
      console.error('Error updating registration status:', error);
      toast.error(error.message || 'Error al actualizar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Control de Registro</CardTitle>
          <CardDescription>
            Gestiona la habilitación del registro de nuevos usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <span>Cargando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {registrationEnabled ? (
            <UserPlus className="h-5 w-5 text-green-600" />
          ) : (
            <UserX className="h-5 w-5 text-red-600" />
          )}
          Control de Registro
        </CardTitle>
        <CardDescription>
          Gestiona la habilitación del registro de nuevos usuarios en la plataforma
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="registration-enabled"
            checked={registrationEnabled}
            onCheckedChange={updateRegistrationStatus}
            disabled={saving}
          />
          <Label htmlFor="registration-enabled" className="text-sm font-medium">
            {registrationEnabled ? 'Registro habilitado' : 'Registro deshabilitado'}
          </Label>
        </div>

        <div className={`p-4 rounded-lg border ${
          registrationEnabled 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {registrationEnabled ? (
              <UserPlus className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <div>
              <h4 className={`font-medium ${
                registrationEnabled ? 'text-green-800' : 'text-red-800'
              }`}>
                {registrationEnabled 
                  ? 'Registro de usuarios activo' 
                  : 'Registro de usuarios desactivado'
                }
              </h4>
              <p className={`text-sm mt-1 ${
                registrationEnabled ? 'text-green-700' : 'text-red-700'
              }`}>
                {registrationEnabled 
                  ? 'Los nuevos usuarios pueden registrarse en la plataforma a través de /auth/register'
                  : 'El registro de nuevos usuarios está temporalmente deshabilitado. Solo los administradores pueden crear nuevas cuentas.'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-sm text-gray-900 mb-2">
            Información importante:
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Cuando el registro está deshabilitado, la página /auth/register mostrará un mensaje informativo</li>
            <li>• Los usuarios existentes no se ven afectados por este cambio</li>
            <li>• Los administradores siempre pueden crear usuarios desde el panel de administración</li>
            <li>• Esta configuración se aplica inmediatamente a todos los intentos de registro</li>
          </ul>
        </div>

        {saving && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            Guardando cambios...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
