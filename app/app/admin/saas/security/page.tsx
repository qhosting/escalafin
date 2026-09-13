'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShieldAlert,
  ShieldCheck,
  Globe,
  Clock,
  RefreshCcw,
  Zap,
  Lock,
  Unlock,
  History,
  Activity,
  Calendar,
  Search,
  Copy,
  Check,
  Filter,
  AlertTriangle,
  Sliders,
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SecurityWAFPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [bannedIps, setBannedIps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('threats');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resLogs, resBans] = await Promise.all([
        fetch('/api/admin/saas/security-logs'),
        fetch('/api/admin/saas/security-bans')
      ]);

      if (resLogs.ok) {
        const data = await resLogs.json();
        setLogs(data.logs || []);
      }

      if (resBans.ok) {
        const data = await resBans.json();
        setBannedIps(data.bans || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Error al sincronizar datos de seguridad.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    toast.success(`IP ${ip} copiada al portapapeles`);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handleUnban = async (ip: string) => {
    try {
      const res = await fetch('/api/admin/saas/security-bans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });

      if (res.ok) {
        toast.success(`IP ${ip} desbloqueada del firewall.`);
        fetchData();
      } else {
        throw new Error('No se pudo remover el bloqueo.');
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
  };

  // Filtrado reactivo en tiempo real
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter((log: any) => {
      const ip = (log.ipAddress || '').toLowerCase();
      const ua = (log.userAgent || '').toLowerCase();
      let path = '';
      let pattern = '';
      try {
        const details = log.details ? JSON.parse(log.details) : {};
        path = (details.blockedPath || '').toLowerCase();
        pattern = (details.detectedPattern || '').toLowerCase();
      } catch (_) {}
      return ip.includes(q) || ua.includes(q) || path.includes(q) || pattern.includes(q);
    });
  }, [logs, searchQuery]);

  const activeBansList = useMemo(() => {
    return bannedIps.filter((b: any) => b.isActive);
  }, [bannedIps]);

  const filteredBans = useMemo(() => {
    if (!searchQuery.trim()) return activeBansList;
    const q = searchQuery.toLowerCase();
    return activeBansList.filter((ban: any) => {
      const ip = (ban.ip || '').toLowerCase();
      const reason = (ban.details?.reason || '').toLowerCase();
      return ip.includes(q) || reason.includes(q);
    });
  }, [activeBansList, searchQuery]);

  const stats = {
    totalBlocks: logs.length,
    activeBans: activeBansList.length,
    threatLevel: logs.length > 50 ? 'CRÍTICO' : logs.length > 10 ? 'MODERADO' : 'BAJO'
  };

  const getThreatBadge = (level: string) => {
    switch (level) {
      case 'CRÍTICO':
        return <Badge variant="destructive" className="font-semibold text-xs animate-pulse">ALTO RIESGO</Badge>;
      case 'MODERADO':
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold text-xs">MODERADO</Badge>;
      default:
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold text-xs">NORMAL / SEGURO</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Toolbar de Control y Telemetría */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>WAF Activo &bull; Escudo Distribuido Redis</span>
          </div>
          <Badge variant="outline" className="text-xs text-muted-foreground hidden md:inline-flex">
            OWASP Top 10 Protegido
          </Badge>
          <Badge variant="outline" className="text-xs text-muted-foreground hidden lg:inline-flex">
            Rate-Limit: 100 req/min
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filtrar por IP, ruta o patrón..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards de Seguridad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Amenazas Neutralizadas */}
        <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Amenazas Neutralizadas</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">{stats.totalBlocks}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-red-500" />
                Detección por firma WAF
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* IPs Bloqueadas */}
        <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">IPs Baneadas (24h)</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">{stats.activeBans}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3 text-amber-500" />
                Aislamiento dinámico Redis
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Lock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Nivel de Riesgo Global */}
        <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Nivel de Riesgo Global</p>
              <div className="pt-0.5">{getThreatBadge(stats.threatLevel)}</div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-0.5">
                <Activity className="h-3 w-3 text-emerald-500" />
                Evaluación en tiempo real
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Reglas y Políticas Activas */}
        <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Reglas de Mitigación</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">5 Activas</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3 text-emerald-500" />
                Latencia WAF: &lt; 1 ms
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Pestañas de Gestión de Seguridad */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="h-10 bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="threats" className="gap-2 rounded-lg text-xs font-medium">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Registro de Amenazas</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1">
              {filteredLogs.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="bans" className="gap-2 rounded-lg text-xs font-medium">
            <Lock className="h-3.5 w-3.5" />
            <span>Lista de Baneos Activos</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1">
              {filteredBans.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-2 rounded-lg text-xs font-medium">
            <Sliders className="h-3.5 w-3.5" />
            <span>Políticas del Escudo</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Registro de Amenazas */}
        <TabsContent value="threats" className="space-y-4">
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="px-5 py-4 border-b border-border/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Feed de Eventos Bloqueados</CardTitle>
                <CardDescription className="text-xs">
                  Eventos interceptados automáticamente por el middleware de seguridad.
                </CardDescription>
              </div>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>

            <CardContent className="p-0">
              {filteredLogs.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {filteredLogs.map((log) => {
                    let details: any = {};
                    try {
                      details = log.details ? JSON.parse(log.details) : {};
                    } catch (_) {}

                    return (
                      <div
                        key={log.id}
                        className="p-4 sm:px-5 hover:bg-muted/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-foreground">
                              {log.ipAddress}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => handleCopyIp(log.ipAddress)}
                              title="Copiar IP"
                            >
                              {copiedIp === log.ipAddress ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>

                            {details.isBannedNow && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                                BANEADO
                              </Badge>
                            )}

                            {details.detectedPattern && (
                              <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] px-1.5 py-0 h-4 font-mono">
                                {details.detectedPattern}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground text-[11px]">
                              {details.blockedPath || '/api/unspecified'}
                            </span>
                            <span className="text-muted-foreground">&bull;</span>
                            <span className="text-muted-foreground text-[11px] truncate max-w-[280px] lg:max-w-md">
                              {log.userAgent || 'User-Agent desconocido'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0 self-end md:self-center">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: es })}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground/70 hidden lg:inline font-mono">
                            {format(new Date(log.timestamp), 'HH:mm:ss')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Sin registros de intrusión</p>
                    <p className="text-xs text-muted-foreground">
                      {searchQuery ? 'No hay resultados que coincidan con la búsqueda.' : 'El sistema se encuentra operando bajo parámetros normales sin amenazas activas.'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: IPs Baneadas */}
        <TabsContent value="bans" className="space-y-4">
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="px-5 py-4 border-b border-border/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Lista de Bloqueos Activos</CardTitle>
                <CardDescription className="text-xs">
                  Direcciones IP restringidas temporalmente por sobrepasar el límite de infracciones.
                </CardDescription>
              </div>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>

            <CardContent className="p-0">
              {filteredBans.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {filteredBans.map((ban) => {
                    const hoursLeft = Math.floor(ban.ttl / 3600);
                    const minutesLeft = Math.floor((ban.ttl % 3600) / 60);

                    return (
                      <div
                        key={ban.id}
                        className="p-4 sm:px-5 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-foreground">
                              {ban.ip}
                            </span>
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0 h-4 font-semibold">
                              BLOQUEO 24H
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Motivo: {ban.details?.reason || 'Límite de solicitudes / Amenaza recurrente'}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                            <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                              <Clock className="h-3 w-3" />
                              Expira en: {hoursLeft}h {minutesLeft}m
                            </span>
                            <span>&bull;</span>
                            <span>
                              Registrado: {format(new Date(ban.bannedAt), "d MMM, HH:mm", { locale: es })}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnban(ban.ip)}
                          className="gap-1.5 h-8 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Unlock className="h-3.5 w-3.5" />
                          <span>Desbloquear</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Lista de exclusión vacía</p>
                    <p className="text-xs text-muted-foreground">
                      No hay direcciones IP bloqueadas en la caché distribuida en este momento.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Políticas del Escudo */}
        <TabsContent value="policies" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Defensa contra Inyección SQL (SQLi)</CardTitle>
                      <CardDescription className="text-xs">Inspección profunda de queries y payloads</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px]">
                    ACTIVO
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2 text-xs text-muted-foreground">
                Bloquea instantáneamente secuencias como <code className="text-foreground">UNION SELECT</code>, <code className="text-foreground">OR 1=1</code>, caracteres de escape anómalos y firmas de sqlmap.
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Limitador de Tasa (Rate Limiter)</CardTitle>
                      <CardDescription className="text-xs">Token Bucket distribuido en Redis</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px]">
                    ACTIVO
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2 text-xs text-muted-foreground">
                Previene ataques de fuerza bruta y saturación limitando cada IP a un máximo de 100 peticiones/minuto en rutas de autenticación y API.
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Protección Cross-Site Scripting (XSS)</CardTitle>
                      <CardDescription className="text-xs">Sanitización de cabeceras y parámetros</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px]">
                    ACTIVO
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2 text-xs text-muted-foreground">
                Inyección de directivas CSP estrictas, validación contra tags <code className="text-foreground">&lt;script&gt;</code>, manipulación de DOM y robo de tokens JWT.
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Laptop className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Filtro Anti-Bot y Escáneres</CardTitle>
                      <CardDescription className="text-xs">Detección de rastreadores maliciosos</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px]">
                    ACTIVO
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2 text-xs text-muted-foreground">
                Aislamiento automático contra escáneres automatizados de vulnerabilidades (Nmap, Nikto, Shodan spiders, headless crawlers sospechosos).
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
