import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  FileText,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  totalAgents: number;
  totalReturns: number;
  pendingReturns: number;
  totalRevenue: number;
  thisMonthReturns: number;
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const { profile, role } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalAgents: 0,
    totalReturns: 0,
    pendingReturns: 0,
    totalRevenue: 0,
    thisMonthReturns: 0,
  });
  const [recentReturns, setRecentReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [clientsRes, agentsRes, returnsRes, paymentsRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact' }),
        supabase.from('agents').select('id', { count: 'exact' }),
        supabase.from('tax_returns').select('*'),
        supabase.from('payments').select('amount, status'),
      ]);

      const returns = returnsRes.data || [];
      const payments = paymentsRes.data || [];

      const pendingReturns = returns.filter(r => 
        ['pending', 'in_progress', 'review'].includes(r.status)
      ).length;

      const completedPayments = payments.filter(p => p.status === 'completed');
      const totalRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthReturns = returns.filter(r => 
        new Date(r.created_at) >= thisMonth
      ).length;

      setStats({
        totalClients: clientsRes.count || 0,
        totalAgents: agentsRes.count || 0,
        totalReturns: returns.length,
        pendingReturns,
        totalRevenue,
        thisMonthReturns,
      });

      // Get recent returns with client info
      const { data: recent } = await supabase
        .from('tax_returns')
        .select(`
          id, tax_year, status, return_type, created_at,
          clients(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentReturns(recent || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activities = recentReturns.map((r: any) => ({
    id: r.id,
    type: 'return_filed' as const,
    description: `${r.clients?.full_name || 'Client'} - ${r.return_type} ${r.tax_year}`,
    timestamp: new Date(r.created_at),
  }));

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    in_progress: 'bg-info/10 text-info border-info/20',
    review: 'bg-primary/10 text-primary border-primary/20',
    approved: 'bg-success/10 text-success border-success/20',
    submitted: 'bg-success/10 text-success border-success/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Admin'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your tax practice today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/dashboard/reports')}>
            <TrendingUp className="w-4 h-4 mr-2" />
            View Reports
          </Button>
          <Button onClick={() => navigate('/dashboard/clients')}>
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Clients"
          value={stats.totalClients}
          change={12}
          icon={<Users className="w-6 h-6" />}
        />
        <StatsCard
          title="Active Agents"
          value={stats.totalAgents}
          change={5}
          icon={<UserCheck className="w-6 h-6" />}
        />
        <StatsCard
          title="Tax Returns"
          value={stats.totalReturns}
          change={18}
          icon={<FileText className="w-6 h-6" />}
        />
        <StatsCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          change={24}
          icon={<DollarSign className="w-6 h-6" />}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-warning/10 rounded-xl">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{stats.pendingReturns}</p>
              <p className="text-sm text-muted-foreground">Pending Returns</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-success/10 rounded-xl">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{stats.thisMonthReturns}</p>
              <p className="text-sm text-muted-foreground">This Month</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">
                {stats.totalReturns > 0 
                  ? Math.round((stats.totalReturns - stats.pendingReturns) / stats.totalReturns * 100)
                  : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Returns & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tax Returns */}
        <div className="bg-card rounded-xl border border-border shadow-card">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-display font-semibold">Recent Tax Returns</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/tax-returns')}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="divide-y divide-border">
            {recentReturns.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No tax returns yet
              </div>
            ) : (
              recentReturns.map((ret: any) => (
                <div key={ret.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{ret.clients?.full_name || 'Unknown Client'}</p>
                      <p className="text-sm text-muted-foreground">
                        {ret.return_type} • Tax Year {ret.tax_year}
                      </p>
                    </div>
                    <Badge className={statusColors[ret.status] || ''}>
                      {ret.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivity activities={activities} />
      </div>
    </div>
  );
}
