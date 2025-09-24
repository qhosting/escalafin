
'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Enhanced validation schemas
const clientFormSchema = z.object({
  firstName: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'El nombre solo puede contener letras'),
  
  lastName: z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'El apellido solo puede contener letras'),
  
  email: z.string()
    .email('Ingrese un email válido')
    .max(100, 'El email no puede exceder 100 caracteres'),
  
  phone: z.string()
    .regex(/^[0-9]{10}$/, 'El teléfono debe tener exactamente 10 dígitos')
    .transform(val => val.replace(/\D/g, '')),
  
  monthlyIncome: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Ingrese un monto válido')
    .refine(val => parseFloat(val) > 0, 'El ingreso debe ser mayor a 0')
    .refine(val => parseFloat(val) <= 1000000, 'El ingreso no puede exceder $1,000,000'),
  
  employmentStatus: z.enum(['EMPLEADO', 'INDEPENDIENTE', 'EMPRESARIO', 'JUBILADO'], {
    required_error: 'Seleccione un estado laboral'
  }),
  
  address: z.string()
    .min(10, 'La dirección debe tener al menos 10 caracteres')
    .max(200, 'La dirección no puede exceder 200 caracteres'),
  
  city: z.string()
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .max(50, 'La ciudad no puede exceder 50 caracteres'),
  
  state: z.string()
    .min(2, 'El estado debe tener al menos 2 caracteres')
    .max(50, 'El estado no puede exceder 50 caracteres'),
  
  zipCode: z.string()
    .regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),
  
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional()
})

type ClientFormValues = z.infer<typeof clientFormSchema>

interface EnhancedClientFormProps {
  initialData?: Partial<ClientFormValues>
  onSubmit: (data: ClientFormValues) => Promise<void>
  isSubmitting?: boolean
  mode?: 'create' | 'edit'
}

export function EnhancedClientForm({ 
  initialData, 
  onSubmit, 
  isSubmitting = false,
  mode = 'create' 
}: EnhancedClientFormProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      monthlyIncome: '',
      employmentStatus: undefined,
      address: '',
      city: '',
      state: '',
      zipCode: '',
      notes: '',
      ...initialData
    },
  })

  const handleSubmit = async (data: ClientFormValues) => {
    try {
      await onSubmit(data)
      if (mode === 'create') {
        form.reset()
        toast.success('Cliente registrado exitosamente')
      } else {
        toast.success('Cliente actualizado exitosamente')
      }
    } catch (error) {
      toast.error('Error al procesar el formulario')
    }
  }

  // Real-time validation feedback
  const getFieldStatus = (fieldName: keyof ClientFormValues) => {
    const fieldState = form.getFieldState(fieldName)
    if (fieldState.isDirty) {
      return fieldState.invalid ? 'error' : 'success'
    }
    return 'default'
  }

  const getFieldIcon = (fieldName: keyof ClientFormValues) => {
    const status = getFieldStatus(fieldName)
    if (status === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    if (status === 'error') {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }
    return null
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Personal</h3>
            
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        className={cn(
                          getFieldStatus('firstName') === 'error' && 'border-red-500',
                          getFieldStatus('firstName') === 'success' && 'border-green-500'
                        )}
                      />
                      <div className="absolute right-3 top-3">
                        {getFieldIcon('firstName')}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        className={cn(
                          getFieldStatus('lastName') === 'error' && 'border-red-500',
                          getFieldStatus('lastName') === 'success' && 'border-green-500'
                        )}
                      />
                      <div className="absolute right-3 top-3">
                        {getFieldIcon('lastName')}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        type="email"
                        className={cn(
                          getFieldStatus('email') === 'error' && 'border-red-500',
                          getFieldStatus('email') === 'success' && 'border-green-500'
                        )}
                      />
                      <div className="absolute right-3 top-3">
                        {getFieldIcon('email')}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        placeholder="1234567890"
                        className={cn(
                          getFieldStatus('phone') === 'error' && 'border-red-500',
                          getFieldStatus('phone') === 'success' && 'border-green-500'
                        )}
                      />
                      <div className="absolute right-3 top-3">
                        {getFieldIcon('phone')}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Ingrese 10 dígitos sin espacios ni guiones
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Financiera</h3>
            
            <FormField
              control={form.control}
              name="monthlyIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingresos Mensuales *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        type="number"
                        step="0.01"
                        placeholder="25000.00"
                        className={cn(
                          getFieldStatus('monthlyIncome') === 'error' && 'border-red-500',
                          getFieldStatus('monthlyIncome') === 'success' && 'border-green-500'
                        )}
                      />
                      <div className="absolute right-3 top-3">
                        {getFieldIcon('monthlyIncome')}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Ingrese el monto en pesos mexicanos
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employmentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Laboral *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione estado laboral" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EMPLEADO">Empleado</SelectItem>
                      <SelectItem value="INDEPENDIENTE">Independiente</SelectItem>
                      <SelectItem value="EMPRESARIO">Empresario</SelectItem>
                      <SelectItem value="JUBILADO">Jubilado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Información de Domicilio</h3>
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Calle, número, colonia" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código Postal *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="12345" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas Adicionales</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Información adicional sobre el cliente..."
                  className="resize-none"
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                Opcional. Máximo 500 caracteres.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            Limpiar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Registrar Cliente' : 'Actualizar Cliente'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
