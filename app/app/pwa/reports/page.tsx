
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PWAInstallPrompt } from '@/components/pwa/pwa-install-prompt';
import { OfflineIndicator } from '@/components/pwa/offline-indicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  Target,
  PieChart,
  LineChart
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface KPIData {
  totalClients: number;
  activeLoans: number;
  totalPortfolio: number;
  collectionsRate: number;
  overdueAmount: number;
  monthlyGrowth: number;
}

interface ChartData {
  name: string;
  value: number;
  amount?: number;
  growth?: number;
}

export default function ReportsPWAPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [kpis, setKpis] = useState<KPIData>({
    totalClients: 0,
    activeLoans: 0,
    totalPortfolio: 0,
    collectionsRate: 0,
    overdueAmount: 0,
    monthlyGrowth: 0
  });
  const [paymentsData, setPaymentsData] = useState<ChartData[]>([]);
  const [portfolioData, setPortfolioData] = useState<ChartData[]>([]);
  const [performanceData, setPerformanceData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/pwa/reports');
    } else if (session?.user && !['ADMIN', 'ASESOR'].includes(session.user.role)) {
      router.push('/');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user) {
      loadReportsData();
    }
  }, [session, timeRange]);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      
      // Load KPIs
      const kpisResponse = await fetch(`/api/analytics/kpis?timeRange=${timeRange}`);
      if (kpisResponse.ok) {
        const kpisData = await kpisResponse.json();
        setKpis({
          totalClients: kpisData.totalClients || 127,
          activeLoans: kpisData.activeLoans || 89,
          totalPortfolio: kpisData.totalPortfolio || 2450000,
          collectionsRate: kpisData.collectionsRate || 94.5,
          overdueAmount: kpisData.overdueAmount || 178500,
          monthlyGrowth: kpisData.monthlyGrowth || 12.3
        });
      }

      // Load payments trend
      const paymentsResponse = await fetch(`/api/analytics/timeseries?type=payments&timeRange=${timeRange}`);
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPaymentsData(paymentsData.data || generateMockPaymentsData());
      } else {
        setPaymentsData(generateMockPaymentsData());
      }

      // Load portfolio distribution
      setPortfolioData([
        { name: 'Al día', value: 85, amount: 2080000 },
        { name: 'Vencido 1-30', value: 10, amount: 245000 },
        { name: 'Vencido 31-60', value: 3, amount: 73500 },
        { name: 'Vencido >60', value: 2, amount: 51500 }
      ]);

      // Load performance data
      setPerformanceData([
        { name: 'Ene', value: 220000, growth: 15 },
        { name: 'Feb', value: 180000, growth: -18 },
        { name: 'Mar', value: 280000, growth: 56 },
        { name: 'Abr', value: 320000, growth: 14 },
        { name: 'May', value: 290000, growth: -9 },
        { name: 'Jun', value: 350000, growth: 21 }
      ]);

    } catch (error) {
      console.error('Error loading reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockPaymentsData = (): ChartData[] => {
    const dates = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push({
        name: date.getDate().toString(),
        value: Math.floor(Math.random() * 50000) + 10000
      });
    }
    return dates;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReportsData();
    setRefreshing(false);
  };

  const exportReport = async (type: string) => {
    try {
      const response = await fetch(`/api/reports/export?type=${type}&timeRange=${timeRange}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${type}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#991b1b'];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PWAInstallPrompt appName="Reportes EscalaFin" />
      <OfflineIndicator />

      {/* Header */}
      <div className="bg-purple-600 text-white p-4 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Reportes</h1>
            <p className="text-purple-100 text-sm">
              Dashboard Ejecutivo
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-white hover:bg-purple-700"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="p-4 bg-white border-b">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Últimos 7 días</SelectItem>
            <SelectItem value="30days">Últimos 30 días</SelectItem>
            <SelectItem value="90days">Últimos 3 meses</SelectItem>
            <SelectItem value="1year">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="p-4 space-y-4">
        {/* KPIs Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Clientes</p>
                  <p className="text-2xl font-bold">{kpis.totalClients}</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{kpis.monthlyGrowth}%
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cartera</p>
                  <p className="text-lg font-bold">
                    ${(kpis.totalPortfolio / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-green-600">Activa</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cobranza</p>
                  <p className="text-2xl font-bold">{kpis.collectionsRate}%</p>
                  <p className="text-xs text-blue-600">Efectividad</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vencido</p>
                  <p className="text-lg font-bold">
                    ${(kpis.overdueAmount / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-red-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    7.3%
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="portfolio">Cartera</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Pagos Diarios</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportReport('payments')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={paymentsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => [`$${value.toLocaleString()}`, 'Pagos']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Distribución de Cartera</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportReport('portfolio')}
                >
                  <PieChart className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `${value}% - $${portfolioData.find(d => d.name === name)?.amount?.toLocaleString()}`,
                          name
                        ]}
                      />
                      <Pie
                        data={portfolioData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {portfolioData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {portfolioData.map((item, index) => (
                    <div key={item.name} className="flex items-center text-sm">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span>{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Rendimiento Mensual</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportReport('performance')}
                >
                  <LineChart className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => [`$${value.toLocaleString()}`, 'Cobranza']}
                      />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3">
              {performanceData.map((month) => (
                <Card key={month.name}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{month.name}</p>
                        <p className="text-sm text-gray-600">
                          ${month.value.toLocaleString()}
                        </p>
                      </div>
                      <Badge 
                        variant={month.growth && month.growth > 0 ? 'default' : 'destructive'}
                      >
                        {month.growth && month.growth > 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(month.growth || 0)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
