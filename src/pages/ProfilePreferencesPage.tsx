import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useNotificationPreferences, 
  useUpdateNotificationPreferences,
  useToggleDND,
} from '@/services/notificationService';
import {
  NotificationCategory,
  NotificationPriority,
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_PRIORITY_LABELS,
  NOTIFICATION_PRIORITY_COLORS,
  NOTIFICATION_TYPE_CATALOG,
  NotificationType,
} from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Bell, 
  BellOff, 
  MessageCircle, 
  UserCircle, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Settings,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { StandardPageLayout } from '@/components/layouts';

const PREFERENCE_TABS = ['notifications', 'timeline'] as const;
type PreferenceTabId = (typeof PREFERENCE_TABS)[number];

// Ícones por categoria
const CATEGORY_ICONS: Record<NotificationCategory, React.ElementType> = {
  mention: MessageCircle,
  assignment: UserCircle,
  status: RefreshCw,
  sla: AlertTriangle,
  deadline: Clock,
  activity: Activity,
  system: Settings,
  general: Bell,
};

// Descrições por categoria
const CATEGORY_DESCRIPTIONS: Record<NotificationCategory, string> = {
  mention: 'Quando alguém menciona você em comentários',
  assignment: 'Quando você é atribuído como responsável',
  status: 'Quando o status de um registro muda',
  sla: 'Alertas de SLA em risco ou vencido',
  deadline: 'Alertas de prazos próximos ou vencidos',
  activity: 'Atividades como notas e respostas em threads',
  system: 'Notificações do sistema e ações em massa',
  general: 'Outras notificações gerais',
};

// Exemplos de tipos por categoria
const CATEGORY_EXAMPLES: Record<NotificationCategory, NotificationType[]> = {
  mention: ['mention', 'thread_reply'],
  assignment: ['assignment', 'reassignment', 'new_opportunity', 'hot_lead_assigned'],
  status: ['status_change', 'status_regression'],
  sla: ['sla_breach', 'sla_warning'],
  deadline: ['deadline', 'deadline_approaching'],
  activity: ['internal_note'],
  system: ['bulk_action_complete', 'audit_alert'],
  general: [],
};

// Categorias ordenadas para o grid
const CATEGORIES_LEFT: NotificationCategory[] = ['mention', 'assignment', 'status', 'sla'];
const CATEGORIES_RIGHT: NotificationCategory[] = ['deadline', 'activity', 'system'];

const TIMELINE_ITEMS = [
  {
    id: 'notif-settings',
    title: 'Preferências ajustadas',
    description: 'Você atualizou as notificações padrão.',
    icon: Bell,
    timestamp: 'Há 2 dias'
  },
  {
    id: 'dnd',
    title: 'Modo Não Perturbe',
    description: 'Modo Não Perturbe foi alternado.',
    icon: BellOff,
    timestamp: 'Há 5 dias'
  },
  {
    id: 'alerts',
    title: 'Alertas críticos',
    description: 'Configuração de prioridade mínima revisada.',
    icon: AlertTriangle,
    timestamp: 'Há 1 semana'
  }
];

export default function ProfilePreferencesPage() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: preferences, isLoading } = useNotificationPreferences(profile?.id || null);
  const updatePreferences = useUpdateNotificationPreferences();
  const toggleDND = useToggleDND();
  const selectedTab = searchParams.get('tab');
  const isValidTab = PREFERENCE_TABS.includes(selectedTab as PreferenceTabId);
  const activeTab: PreferenceTabId = isValidTab ? (selectedTab as PreferenceTabId) : 'notifications';

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab !== activeTab) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('tab', activeTab);
      setSearchParams(nextParams, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  const handleTabChange = (value: string) => {
    const nextTab = PREFERENCE_TABS.includes(value as PreferenceTabId)
      ? (value as PreferenceTabId)
      : 'notifications';
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab);
    setSearchParams(nextParams, { replace: true });
  };

  const handleToggleCategory = async (category: NotificationCategory, enabled: boolean) => {
    if (!profile?.id) return;

    const prefKey = `pref${category.charAt(0).toUpperCase() + category.slice(1)}` as keyof typeof preferences;
    
    try {
      await updatePreferences.mutateAsync({
        userId: profile.id,
        updates: { [prefKey]: enabled } as any,
      });
      toast.success(enabled ? 'Notificações ativadas' : 'Notificações desativadas');
    } catch (error) {
      toast.error('Erro ao atualizar preferências');
    }
  };

  const handleToggleDND = async () => {
    if (!profile?.id) return;

    try {
      const newState = await toggleDND.mutateAsync(profile.id);
      toast.success(newState ? 'Modo Não Perturbe ativado' : 'Modo Não Perturbe desativado');
    } catch (error) {
      toast.error('Erro ao alterar modo Não Perturbe');
    }
  };

  const handleMinPriorityChange = async (value: string) => {
    if (!profile?.id) return;

    try {
      await updatePreferences.mutateAsync({
        userId: profile.id,
        updates: { minPriority: value === 'all' ? null : value as NotificationPriority },
      });
      toast.success('Prioridade mínima atualizada');
    } catch (error) {
      toast.error('Erro ao atualizar preferências');
    }
  };

  const getCategoryPrefValue = (category: NotificationCategory): boolean => {
    if (!preferences) return true;
    const key = `pref${category.charAt(0).toUpperCase() + category.slice(1)}` as keyof typeof preferences;
    return preferences[key] as boolean ?? true;
  };

  // Componente de card de categoria reutilizável
  const CategoryCard = ({ category }: { category: NotificationCategory }) => {
    const Icon = CATEGORY_ICONS[category];
    const enabled = getCategoryPrefValue(category);
    const examples = CATEGORY_EXAMPLES[category];

    return (
      <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg shrink-0",
            enabled ? "bg-primary/10" : "bg-muted"
          )}>
            <Icon className={cn(
              "h-5 w-5",
              enabled ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-sm font-medium">
              {NOTIFICATION_CATEGORY_LABELS[category]}
            </Label>
            <p className="text-xs text-muted-foreground">
              {CATEGORY_DESCRIPTIONS[category]}
            </p>
            {examples.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {examples.slice(0, 2).map(type => (
                  <Badge 
                    key={type} 
                    variant="outline" 
                    className="text-[10px] font-normal"
                  >
                    {NOTIFICATION_TYPE_CATALOG[type]?.label || type}
                  </Badge>
                ))}
                {examples.length > 2 && (
                  <Badge variant="outline" className="text-[10px] font-normal">
                    +{examples.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) => handleToggleCategory(category, checked)}
          disabled={updatePreferences.isPending}
          className="shrink-0"
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <StandardPageLayout>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </StandardPageLayout>
    );
  }

  if (!profile) return null;

    return (
    <StandardPageLayout>
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab Content */}
        <TabsContent value="notifications" className="space-y-6">
          {/* DND e Prioridade Mínima - 2 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DND Card */}
            <Card className={cn(
              "transition-colors",
              preferences?.dndEnabled && "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {preferences?.dndEnabled ? (
                      <BellOff className="h-6 w-6 text-amber-600" />
                    ) : (
                      <Bell className="h-6 w-6 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-base">Modo Não Perturbe</CardTitle>
                      <CardDescription className="text-xs">
                        Silencia toasts e alertas visuais
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={preferences?.dndEnabled || false}
                    onCheckedChange={handleToggleDND}
                    disabled={toggleDND.isPending}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Notificações ainda aparecem no inbox, mas sem interrupções visuais.
                </p>
              </CardContent>
            </Card>

            {/* Prioridade Mínima Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Prioridade Mínima</CardTitle>
                <CardDescription className="text-xs">
                  Filtre notificações por importância
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={preferences?.minPriority || 'all'}
                  onValueChange={handleMinPriorityChange}
                  disabled={updatePreferences.isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        Todas as prioridades
                      </div>
                    </SelectItem>
                    {(['low', 'normal', 'high', 'urgent', 'critical'] as NotificationPriority[]).map(priority => (
                      <SelectItem key={priority} value={priority}>
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", NOTIFICATION_PRIORITY_COLORS[priority].dot)} />
                          {NOTIFICATION_PRIORITY_LABELS[priority]} ou maior
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Receba apenas notificações com prioridade igual ou maior.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Categorias de Notificação - 2 colunas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categorias de Notificação</CardTitle>
              <CardDescription>
                Ative ou desative notificações por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coluna Esquerda */}
                <div className="space-y-3">
                  {CATEGORIES_LEFT.map(category => (
                    <CategoryCard key={category} category={category} />
                  ))}
                </div>
                
                {/* Coluna Direita */}
                <div className="space-y-3">
                  {CATEGORIES_RIGHT.map(category => (
                    <CategoryCard key={category} category={category} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong>Nota:</strong> Algumas notificações críticas (como SLA vencido) 
                    podem ignorar essas configurações para garantir que você seja informado.
                  </p>
                  <p>
                    Canais adicionais (email, push) estarão disponíveis em breve.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de preferências</CardTitle>
              <CardDescription>Veja as últimas alterações realizadas nas suas preferências.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {TIMELINE_ITEMS.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</div>
              ) : (
                TIMELINE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                      <div className="mt-0.5">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {item.timestamp}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StandardPageLayout>
  );
}
