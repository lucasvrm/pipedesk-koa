import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Users, 
  Target, 
  Zap, 
  DollarSign, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StandardPageLayout } from '@/components/layouts';

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  valueMonth: string | number;
  valueTotal: string | number;
  trend?: number;
  prefix?: string;
  suffix?: string;
}

function StatCard({ icon, label, valueMonth, valueTotal, trend, prefix = '', suffix = '' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
          {trend !== undefined && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", trend >= 0 ? 'text-green-600' : 'text-red-600')}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-foreground">
            {prefix}{typeof valueMonth === 'number' ? valueMonth.toLocaleString('pt-BR') : valueMonth}{suffix}
          </p>
          <p className="text-xs text-muted-foreground">
            / {prefix}{typeof valueTotal === 'number' ? valueTotal.toLocaleString('pt-BR') : valueTotal}{suffix} total
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MOCK DATA FOR STATS AND ACTIVITY
// ============================================================================
const mockStats = {
  leadsCreatedMonth: 24,
  leadsCreatedTotal: 342,
  leadsCreatedTrend: 12,
  leadsQualifiedMonth: 18,
  leadsQualifiedTotal: 256,
  leadsQualifiedTrend: 8,
  conversionRateMonth: 75,
  conversionRateTotal: 68,
  conversionRateTrend: 5,
  topLeadSourceMonth: 'Indicação',
  topLeadSourceTotal: 'LinkedIn',
  topDealSourceMonth: 'Indicação',
  topDealSourceTotal: 'Indicação',
  tasksCreatedMonth: 45,
  tasksCreatedTotal: 512,
  tasksCreatedTrend: -3,
  tasksCompletedMonth: 42,
  tasksCompletedTotal: 489,
  tasksCompletedTrend: 10,
  pipelineValue: 2450000,
  pipelineTrend: 15,
};

const mockRecentActivity = [
  { id: 1, action: 'Fechou deal', target: 'CRI Residencial Alpha', time: '2 horas atrás', icon: '🎉' },
  { id: 2, action: 'Converteu lead', target: 'Empresa XYZ Ltda', time: '5 horas atrás', icon: '✅' },
  { id: 3, action: 'Adicionou nota', target: 'Deal #1234', time: '1 dia atrás', icon: '📝' },
  { id: 4, action: 'Completou tarefa', target: 'Ligar para cliente', time: '1 dia atrás', icon: '☑️' },
  { id: 5, action: 'Atualizou status', target: 'Lead Maria Silva', time: '2 dias atrás', icon: '🔄' },
];

export default function ProfileActivityPage() {
  return (
    <StandardPageLayout>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Users className="h-4 w-4 text-primary" />} label="Leads Criados" valueMonth={mockStats.leadsCreatedMonth} valueTotal={mockStats.leadsCreatedTotal} trend={mockStats.leadsCreatedTrend} />
        <StatCard icon={<Target className="h-4 w-4 text-primary" />} label="Leads Qualificados" valueMonth={mockStats.leadsQualifiedMonth} valueTotal={mockStats.leadsQualifiedTotal} trend={mockStats.leadsQualifiedTrend} />
        <StatCard icon={<Zap className="h-4 w-4 text-primary" />} label="Taxa de Conversão" valueMonth={mockStats.conversionRateMonth} valueTotal={mockStats.conversionRateTotal} trend={mockStats.conversionRateTrend} suffix="%" />
        <StatCard icon={<DollarSign className="h-4 w-4 text-primary" />} label="Pipeline Ativo" valueMonth={mockStats.pipelineValue} valueTotal={mockStats.pipelineValue} trend={mockStats.pipelineTrend} prefix="R$ " />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<CheckCircle className="h-4 w-4 text-primary" />} label="Tarefas Criadas" valueMonth={mockStats.tasksCreatedMonth} valueTotal={mockStats.tasksCreatedTotal} trend={mockStats.tasksCreatedTrend} />
        <StatCard icon={<CheckCircle className="h-4 w-4 text-primary" />} label="Tarefas Concluídas" valueMonth={mockStats.tasksCompletedMonth} valueTotal={mockStats.tasksCompletedTotal} trend={mockStats.tasksCompletedTrend} />
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Principal Origem de Leads</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mês:</span>
                <span className="text-sm font-medium text-foreground">{mockStats.topLeadSourceMonth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="text-sm font-medium text-foreground">{mockStats.topLeadSourceTotal}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Principal Origem de Deals</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mês:</span>
                <span className="text-sm font-medium text-foreground">{mockStats.topDealSourceMonth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="text-sm font-medium text-foreground">{mockStats.topDealSourceTotal}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" /> Atividade Recente
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-primary">
              Ver histórico completo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                <span className="text-lg">{activity.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.action}</span>{' '}
                    <span className="text-muted-foreground">{activity.target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </StandardPageLayout>
  );
}
