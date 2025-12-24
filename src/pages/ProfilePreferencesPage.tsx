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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

// Ícones por categoria (lucide-react)
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

export default function ProfilePreferencesPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: preferences, isLoading } = useNotificationPreferences(profile?.id || null);
  const updatePreferences = useUpdateNotificationPreferences();
  const toggleDND = useToggleDND();

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

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Preferências de Notificação</h1>
          <p className="text-muted-foreground">
            Controle quais notificações você recebe e como
          </p>
        </div>
      </div>

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
                <CardTitle className="text-lg">Modo Não Perturbe</CardTitle>
                <CardDescription>
                  Silencia toasts e alertas visuais. Notificações ainda aparecem no inbox.
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
      </Card>

      {/* Prioridade Mínima */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Prioridade Mínima</CardTitle>
          <CardDescription>
            Receba apenas notificações com prioridade igual ou maior que o selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={preferences?.minPriority || 'all'}
            onValueChange={handleMinPriorityChange}
            disabled={updatePreferences.isPending}
          >
            <SelectTrigger className="w-[200px]">
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
        </CardContent>
      </Card>

      {/* Categorias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Categorias de Notificação</CardTitle>
          <CardDescription>
            Ative ou desative notificações por categoria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {(['mention', 'assignment', 'status', 'sla', 'deadline', 'activity', 'system'] as NotificationCategory[]).map((category, index) => {
            const Icon = CATEGORY_ICONS[category];
            const enabled = getCategoryPrefValue(category);
            const examples = CATEGORY_EXAMPLES[category];
            
            return (
              <div key={category}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      enabled ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        enabled ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-base font-medium">
                        {NOTIFICATION_CATEGORY_LABELS[category]}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {CATEGORY_DESCRIPTIONS[category]}
                      </p>
                      {examples.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {examples.slice(0, 3).map(type => (
                            <Badge 
                              key={type} 
                              variant="outline" 
                              className="text-[10px] font-normal"
                            >
                              {NOTIFICATION_TYPE_CATALOG[type]?.label || type}
                            </Badge>
                          ))}
                          {examples.length > 3 && (
                            <Badge variant="outline" className="text-[10px] font-normal">
                              +{examples.length - 3}
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
                  />
                </div>
              </div>
            );
          })}
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
    </div>
  );
}
