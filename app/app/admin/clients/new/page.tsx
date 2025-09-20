
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, User } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  monthlyIncome: string;
  employmentType: string;
  employerName: string;
  workAddress: string;
  yearsEmployed: string;
  creditScore: string;
  bankName: string;
  accountNumber: string;
  asesorId: string;
}

const EMPLOYMENT_TYPES = [
  { value: 'EMPLOYEE', label: 'Empleado' },
  { value: 'SELF_EMPLOYED', label: 'Autoempleado' },
  { value: 'FREELANCER', label: 'Freelancer' },
  { value: 'UNEMPLOYED', label: 'Desempleado' },
  { value: 'RETIRED', label: 'Jubilado' },
  { value: 'STUDENT', label: 'Estudiante' }
];

export default function NewClientPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [loading, setLoading] = useState(false);
  const [asesores, setAsesores] = useState([]);

  const [formData, setFormData] = useState<ClientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    monthlyIncome: '',
    employmentType: '',
    employerName: '',
    workAddress: '',
    yearsEmployed: '',
    creditScore: '',
    bankName: '',
    accountNumber: '',
    asesorId: ''
  });

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error('Por favor complete los campos requeridos');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear cliente');
      }

      const client = await response.json();
      toast.success('Cliente creado exitosamente');
      router.push(`/admin/clients/${client.id}`);
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast.error(error.message || 'Error al crear cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/admin/clients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Nuevo Cliente
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Registra un nuevo cliente en el sistema
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Datos básicos del cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Ingresa el nombre"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Ingresa el apellido"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="cliente@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="555-123-4567"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dirección */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Dirección</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Calle, número, colonia..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Ciudad"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Estado"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Código Postal</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="12345"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Financiera */}
        <Card>
          <CardHeader>
            <CardTitle>Información Financiera</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthlyIncome">Ingreso Mensual</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                  placeholder="15000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditScore">Score Crediticio</Label>
                <Input
                  id="creditScore"
                  type="number"
                  min="300"
                  max="850"
                  value={formData.creditScore}
                  onChange={(e) => handleInputChange('creditScore', e.target.value)}
                  placeholder="650"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bankName">Banco Principal</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  placeholder="BBVA, Santander, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Número de Cuenta</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  placeholder="****1234"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Laboral */}
        <Card>
          <CardHeader>
            <CardTitle>Información Laboral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Tipo de Empleo</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) => handleInputChange('employmentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo de empleo" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsEmployed">Años de Experiencia</Label>
                <Input
                  id="yearsEmployed"
                  type="number"
                  min="0"
                  value={formData.yearsEmployed}
                  onChange={(e) => handleInputChange('yearsEmployed', e.target.value)}
                  placeholder="5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employerName">Nombre del Empleador</Label>
              <Input
                id="employerName"
                value={formData.employerName}
                onChange={(e) => handleInputChange('employerName', e.target.value)}
                placeholder="Empresa ABC"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workAddress">Dirección de Trabajo</Label>
              <Textarea
                id="workAddress"
                value={formData.workAddress}
                onChange={(e) => handleInputChange('workAddress', e.target.value)}
                placeholder="Dirección de la empresa..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/admin/clients">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Crear Cliente
          </Button>
        </div>
      </form>
    </div>
  );
}
