
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Loader2, 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  CreditCard, 
  RefreshCw, 
  Edit2, 
  Save, 
  X,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function SoportePage() {
  const sessionResult = useSession();
  const { data: session, status } = sessionResult || {};
  const router = useRouter();
  
  const [speiData, setSpeiData] = useState({
    bank: 'BANCO',
    holder: 'NOMBRE DEL TITULAR',
    clabe: '000000000000000000',
    instructions: '1. Utiliza los datos SPEI proporcionados\n2. Incluye tu número de cliente en el concepto\n3. Envía el comprobante por WhatsApp\n4. Espera la confirmación de recarga'
  });
  
  const [contactData, setContactData] = useState({
    email: 'soporte@escalafin.com',
    whatsapp: '+525512345678',
    whatsappDisplay: '+52 55 1234 5678',
    workingHours: 'Lunes a Viernes: 9:00 AM - 6:00 PM\nSábados: 9:00 AM - 2:00 PM'
  });

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/support/config');
      if (res.ok) {
        const data = await res.json();
        if (data.contact) setContactData(data.contact);
        if (data.spei) setSpeiData(data.spei);
      }
    } catch (error) {
      console.error('Error fetching support data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/support/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: contactData,
          spei: speiData
        })
      });

      if (res.ok) {
        toast.success('Configuración actualizada');
        setIsEditing(false);
      } else {
        toast.error('Error al guardar cambios');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Cargando centro de soporte...</p>
      </div>
    );
  }

  if (!session) return null;

  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';

  return (
    <div className="container max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
            <HelpCircle className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Soporte Técnico</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Lugar exclusivo para resolver dudas y gestionar recargas</p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => { setIsEditing(false); fetchData(); }} className="rounded-xl border-slate-200">
                  <X className="w-4 h-4 mr-2" /> Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
                  Guardar Cambios
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="secondary" className="rounded-xl font-bold px-6">
                <Edit2 className="w-4 h-4 mr-2" /> Editar Información
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Contacto directo Card */}
        <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              Canales de Atención
            </CardTitle>
            <CardDescription>Dudas generales y soporte de primer nivel</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                 <Label className="text-xs font-black uppercase text-slate-500 ml-1">Correo Electrónico</Label>
                 {isEditing ? (
                   <Input 
                     value={contactData.email} 
                     onChange={(e) => setContactData({...contactData, email: e.target.value})}
                     className="rounded-xl h-12"
                   />
                 ) : (
                   <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <span className="font-bold text-slate-700 dark:text-slate-200">{contactData.email}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(contactData.email)} className="text-blue-600">Copiar</Button>
                   </div>
                 )}
              </div>

              <div className="space-y-3">
                 <Label className="text-xs font-black uppercase text-slate-500 ml-1">WhatsApp de Soporte</Label>
                 {isEditing ? (
                   <div className="grid grid-cols-2 gap-3">
                      <Input 
                        placeholder="Link (5255...)"
                        value={contactData.whatsapp} 
                        onChange={(e) => setContactData({...contactData, whatsapp: e.target.value})}
                        className="rounded-xl h-12"
                      />
                      <Input 
                        placeholder="Display (+52...)"
                        value={contactData.whatsappDisplay} 
                        onChange={(e) => setContactData({...contactData, whatsappDisplay: e.target.value})}
                        className="rounded-xl h-12"
                      />
                   </div>
                 ) : (
                   <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-green-500" />
                        <span className="font-bold text-slate-700 dark:text-slate-200">{contactData.whatsappDisplay}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(`https://wa.me/${contactData.whatsapp.replace(/\+/g, '')}`, '_blank')}
                      className="rounded-lg border-green-200 text-green-700"
                    >
                      Abrir Chat
                    </Button>
                   </div>
                 )}
              </div>
            </div>

            <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 flex gap-4">
              <Clock className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div className="space-y-2 flex-grow">
                <Label className="text-xs font-black uppercase text-blue-800 ml-1">Horario de Atención</Label>
                {isEditing ? (
                  <Textarea 
                    value={contactData.workingHours} 
                    onChange={(e) => setContactData({...contactData, workingHours: e.target.value})}
                    className="rounded-xl min-h-[80px]"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {contactData.workingHours}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recarga de mensajes Card */}
        {isAdmin && (
          <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden flex flex-col">
            <CardHeader className="bg-green-50/50 dark:bg-green-900/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-green-600" />
                  Recargas de Saldo
                </CardTitle>
                <Badge className="bg-green-100 text-green-700 border-none font-bold">ACTIVO</Badge>
              </div>
              <CardDescription>Adquiere paquetes de mensajes para notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 flex-grow space-y-6">
              <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl text-white space-y-4 shadow-xl">
                 <h4 className="text-green-400 font-bold uppercase text-[10px] tracking-widest">Planes Preferenciales</h4>
                 <div className="space-y-3">
                   <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="font-medium">100 msg WhatsApp</span>
                      <span className="text-xl font-black text-green-300">$50 <span className="text-[10px] text-slate-400">MXN</span></span>
                   </div>
                   <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="font-medium">500 msg WhatsApp</span>
                      <span className="text-xl font-black text-green-300">$200 <span className="text-[10px] text-slate-400">MXN</span></span>
                   </div>
                   <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-blue-300">1000 msg WhatsApp</span>
                      <span className="text-xl font-black text-green-300">$350 <span className="text-[10px] text-slate-400">MXN</span></span>
                   </div>
                 </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-800">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-xs font-semibold text-orange-800 dark:text-orange-300">
                  Las recargas se reflejan inmediatamente tras enviar el comprobante de transferencia.
                </p>
              </div>

              <Button
                className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 font-black text-lg transition-transform hover:scale-[1.02]"
                onClick={() => window.open(`https://wa.me/${contactData.whatsapp.replace(/\+/g, '')}?text=Hola, quiero recargar un paquete de mensajes WhatsApp`, '_blank')}
              >
                <MessageSquare className="w-5 h-5 mr-3" />
                Solicitar Recarga Ahora
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* SPEI and FAQ Section */}
      {isAdmin && (
        <div className="grid gap-8 lg:grid-cols-3">
           {/* SPEI Card */}
           <Card className="lg:col-span-2 rounded-3xl border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden">
             <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
               <CardTitle className="text-xl font-black flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Datos de Transferencia (SPEI)
               </CardTitle>
               <CardDescription>Información bancaria para pagos de servicios</CardDescription>
             </CardHeader>
             <CardContent className="p-8">
               <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {['bank', 'holder', 'clabe'].map((field) => (
                      <div key={field} className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-500 ml-1">
                          {field === 'bank' ? 'Banco' : field === 'holder' ? 'Beneficiario' : 'CLABE'}
                        </Label>
                        {isEditing ? (
                          <Input 
                            value={(speiData as any)[field]} 
                            onChange={(e) => setSpeiData({...speiData, [field]: e.target.value})}
                            className="rounded-xl h-12 font-mono"
                          />
                        ) : (
                          <div className="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-blue-200 transition-all">
                             <span className="font-black text-slate-700 truncate mr-2">{(speiData as any)[field]}</span>
                             <Button variant="ghost" size="sm" onClick={() => {
                               navigator.clipboard.writeText((speiData as any)[field]);
                               toast.success('Copiado');
                             }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                               Copiar
                             </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-500 ml-1">Instrucciones de Pago</Label>
                        {isEditing ? (
                          <Textarea 
                            value={speiData.instructions} 
                            onChange={(e) => setSpeiData({...speiData, instructions: e.target.value})}
                            className="rounded-xl min-h-[160px] font-mono text-sm"
                          />
                        ) : (
                          <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 min-h-[200px]">
                            <p className="text-sm font-medium text-blue-900 whitespace-pre-line leading-relaxed italic">
                              {speiData.instructions}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
               </div>
             </CardContent>
           </Card>

           {/* FAQ Section */}
           <div className="space-y-6">
              <h3 className="text-xl font-bold px-2">Dudas Frecuentes</h3>
              <div className="space-y-4">
                 {[
                   { q: '¿Horario de recargas?', a: 'Días hábiles de 9:00 a 17:00' },
                   { q: '¿Facturación?', a: 'Solicítala al enviar tu comprobante' },
                   { q: '¿Soporte Técnico?', a: 'Envía un ticket vía WhatsApp' }
                 ].map((faq, i) => (
                   <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2 group hover:border-blue-200 transition-all">
                      <h5 className="font-black text-slate-800 dark:text-slate-100">{faq.q}</h5>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{faq.a}</p>
                   </div>
                 ))}
              </div>
              
              <Card className="rounded-3xl bg-blue-600 text-white p-6 shadow-xl shadow-blue-200 dark:shadow-none">
                 <div className="flex gap-4 items-center">
                    <div className="p-2 bg-white/20 rounded-xl">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold">Pago Seguro</h4>
                        <p className="text-[10px] text-blue-100">Protección de datos garantizada</p>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      )}
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
