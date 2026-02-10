
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Palette, Image as ImageIcon, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function BrandingSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [branding, setBranding] = useState({
        logo: '',
        primaryColor: '#4f46e5'
    });

    useEffect(() => {
        fetchBranding();
    }, []);

    const fetchBranding = async () => {
        try {
            const res = await fetch('/api/admin/branding');
            if (res.ok) {
                const data = await res.json();
                setBranding({
                    logo: data.logo || '',
                    primaryColor: data.primaryColor || '#4f46e5'
                });
            }
        } catch (error) {
            console.error('Error fetching branding:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/branding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(branding)
            });

            if (res.ok) {
                toast.success('Branding actualizado exitosamente. Recarga la página para ver todos los cambios.');
                // Opcional: recargar después de un momento
                // window.location.reload();
            } else {
                throw new Error('Error al guardar');
            }
        } catch (error) {
            toast.error('Error al actualizar el branding');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Personalización de Marca (White-labeling)
                </CardTitle>
                <CardDescription>
                    Personaliza la apariencia de tu plataforma para que tus clientes reconozcan tu marca.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Logo Section */}
                    <div className="space-y-4">
                        <Label className="text-base">Logo de la Empresa</Label>
                        <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-xl bg-gray-50">
                            {branding.logo ? (
                                <img src={branding.logo} alt="Logo preview" className="max-h-24 object-contain" />
                            ) : (
                                <div className="h-24 w-24 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <ImageIcon className="h-10 w-10 text-gray-400" />
                                </div>
                            )}
                            <Input
                                placeholder="URL del Logo (ej. https://tu-sitio.com/logo.png)"
                                value={branding.logo}
                                onChange={(e) => setBranding({ ...branding, logo: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 text-center">
                                Recomendamos un archivo PNG con fondo transparente y proporción horizontal.
                            </p>
                        </div>
                    </div>

                    {/* Color Section */}
                    <div className="space-y-4">
                        <Label className="text-base">Color de Identidad</Label>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className="h-16 w-16 rounded-xl border-4 border-white shadow-lg"
                                    style={{ backgroundColor: branding.primaryColor }}
                                />
                                <div className="flex-1">
                                    <Input
                                        type="color"
                                        value={branding.primaryColor}
                                        className="h-10 cursor-pointer"
                                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                    />
                                    <p className="text-xs text-gray-500 mt-2 font-mono">{branding.primaryColor}</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg border bg-blue-50 text-blue-800 text-xs">
                                <Info className="h-4 w-4 inline mr-2" />
                                Este color se aplicará a botones, enlaces y acentos en toda la plataforma.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Guardar Branding
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function Info({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
        </svg>
    )
}
