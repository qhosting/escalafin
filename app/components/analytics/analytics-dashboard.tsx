
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Wallet,
  Shield,
  Download,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  format: 'currency' | 'percentage' | 'number';
}

interface AnalyticsData {
  loans: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    totalAmount: number;
    averageAmount: number;
  };
  payments: {
    total: number;
    totalAmount: number;
    onTime: number;
    late: number;
    defaulted: number;
  };
  portfolio: {
    activeLoans: number;
    totalOutstanding: number;
    totalRepaid: number;
    defaultRate: number;
    avgInterestRate: number;
  };
  users: {
    total: number;
    clients: number;
    advisors: number;
    admins: number;
    newThisMonth: number;
  };
  financial: {
    monthlyRevenue: number;
    totalRevenue: number;
    profitMargin: number;
    riskExposure: number;
  };
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, trend, icon, format }) => {
  const formatValue = (val: string | number) => {
    if (format === 'currency' && typeof val === 'number') {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(val);
    }
    if (format === 'percentage' && typeof val === 'number') {
      return `${val.toFixed(2)}%`;
    }
    return val.toString();
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">{title}</h3>
          <div className="h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold">
            {formatValue(value)}
          </div>
          <div className={`flex items-center space-x-1 text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [analyticsResponse, timeSeriesResponse] = await Promise.all([
        fetch(`/api/analytics/general?days=${selectedPeriod}`),
        fetch(`/api/analytics/timeseries?days=${selectedPeriod}`)
      ]);

      if (analyticsResponse.ok && timeSeriesResponse.ok) {
        const analytics = await analyticsResponse.json();
        const timeSeries = await timeSeriesResponse.json();
        
        setAnalyticsData(analytics);
        setTimeSeriesData(timeSeries);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const loanStatusData = [
    { name: 'Aprobados', value: analyticsData.loans.approved, color: '#00C49F' },
    { name: 'Pendientes', value: analyticsData.loans.pending, color: '#FFBB28' },
    { name: 'Rechazados', value: analyticsData.loans.rejected, color: '#FF8042' }
  ];

  const userRoleData = [
    { name: 'Clientes', value: analyticsData.users.clients, color: '#0088FE' },
    { name: 'Asesores', value: analyticsData.users.advisors, color: '#00C49F' },
    { name: 'Administradores', value: analyticsData.users.admins, color: '#FFBB28' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Vista completa del rendimiento de tu sistema financiero
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 3 meses</SelectItem>
              <SelectItem value="365">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Cartera Total"
          value={analyticsData.portfolio.totalOutstanding}
          change={15.2}
          trend="up"
          icon={<Wallet className="h-4 w-4" />}
          format="currency"
        />
        <KPICard
          title="Préstamos Activos"
          value={analyticsData.portfolio.activeLoans}
          change={8.1}
          trend="up"
          icon={<CreditCard className="h-4 w-4" />}
          format="number"
        />
        <KPICard
          title="Ingresos Mensuales"
          value={analyticsData.financial.monthlyRevenue}
          change={12.5}
          trend="up"
          icon={<DollarSign className="h-4 w-4" />}
          format="currency"
        />
        <KPICard
          title="Tasa de Morosidad"
          value={analyticsData.portfolio.defaultRate}
          change={-2.1}
          trend="up"
          icon={<AlertTriangle className="h-4 w-4" />}
          format="percentage"
        />
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="loans">Préstamos</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="portfolio">Cartera</TabsTrigger>
          <TabsTrigger value="risks">Riesgos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Tendencias de Ingresos</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={timeSeriesData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Estado de Préstamos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RechartsPieChart>
                    <Pie
                      data={loanStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {loanStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.users.total}</div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsData.users.newThisMonth} este mes
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Clientes</span>
                    <span>{analyticsData.users.clients}</span>
                  </div>
                  <Progress 
                    value={(analyticsData.users.clients / analyticsData.users.total) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rendimiento de Pagos</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.payments.onTime}</div>
                <p className="text-xs text-muted-foreground">
                  Pagos puntuales
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">A tiempo: {analyticsData.payments.onTime}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-yellow-600">Tardíos: {analyticsData.payments.late}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-red-600">Incumplidos: {analyticsData.payments.defaulted}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Exposición al Riesgo</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    notation: 'compact'
                  }).format(analyticsData.financial.riskExposure)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cartera en riesgo
                </p>
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Nivel de riesgo</span>
                    <span>{analyticsData.portfolio.defaultRate.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={analyticsData.portfolio.defaultRate} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="loans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Detallado de Préstamos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="loans" fill="#8884d8" name="Préstamos Creados" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Más tabs pueden ser añadidas aquí */}
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
