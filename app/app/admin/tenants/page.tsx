
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Building2, Users, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    status: string;
    createdAt: string;
    _count?: {
        users: number;
        clients: number;
    }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TenantsPage() {
    const router = useRouter();
    const { data: tenants, error, mutate } = useSWR<Tenant[]>('/api/admin/tenants', fetcher);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        domain: '',
        status: 'ACTIVE'
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/admin/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al crear');
            }

            toast.success('Organización creada exitosamente');
            setIsOpen(false);
            setFormData({ name: '', slug: '', domain: '', status: 'ACTIVE' });
            mutate(); // Refresh list
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    if (error) return <div className="p-8 text-center text-red-500">Error al cargar organizaciones</div>;
    if (!tenants) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organizaciones</h1>
                    <p className="text-muted-foreground mt-2">
                        Gestiona las empresas y organizaciones registradas en la plataforma.
                    </p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nueva Organización
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Nueva Organización</DialogTitle>
                            <DialogDescription>
                                Define los datos básicos. El slug se usará para el subdominio.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        setFormData(prev => ({ ...prev, name, slug: generateSlug(name) }))
                                    }}
                                    placeholder="Ej. Financiara El Sol"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug (Subdominio)</Label>
                                <div className="flex items-center space-x-2">
                                    <span className="text-muted-foreground text-sm">https://</span>
                                    <Input
                                        id="slug"
                                        value={formData.slug}
                                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                        placeholder="financiera-sol"
                                        required
                                    />
                                    <span className="text-muted-foreground text-sm">.app.com</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="domain">Dominio Personalizado (Opcional)</Label>
                                <Input
                                    id="domain"
                                    value={formData.domain}
                                    onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                                    placeholder="financierasol.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Estado</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Activo</SelectItem>
                                        <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                                        <SelectItem value="PENDING">Pendiente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Crear
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tenants.map((tenant) => (
                    <Card key={tenant.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">
                                {tenant.name}
                            </CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-muted-foreground mb-4 font-mono bg-slate-100 dark:bg-slate-800 p-1 rounded inline-block">
                                {tenant.slug}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center space-x-2">
                                    <Users className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-medium">{tenant._count?.users || 0} Usuarios</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Receipt className="h-4 w-4 text-green-500" />
                                    <span className="text-sm font-medium">{tenant._count?.clients || 0} Clientes</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${tenant.status === 'ACTIVE'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {tenant.status}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(tenant.createdAt), "d MMM yyyy", { locale: es })}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
