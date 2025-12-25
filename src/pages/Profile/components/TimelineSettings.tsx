import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  RotateCcw, 
  Save, 
  Loader2,
  Activity,
  CheckCircle2,
  Info
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TIMELINE_EVENT_LABELS,
  TIMELINE_EVENT_ICONS,
  DEFAULT_TIMELINE_COLORS,
  DEFAULT_ENABLED_EVENTS,
  AVAILABLE_EVENTS,
  FUTURE_EVENTS,
  getColorWithOpacity
} from '@/constants/timeline';
import type { TimelineEventType } from '@/lib/types';

export function TimelineSettings() {
  const { profile } = useAuth();

  const [enabledEvents, setEnabledEvents] = useState<Record<TimelineEventType, boolean>>(() => ({
    ...DEFAULT_ENABLED_EVENTS,
    ...profile?.preferences?.timeline?.enabledEvents
  }));

  const [eventColors, setEventColors] = useState<Record<TimelineEventType, string>>(() => ({
    ...DEFAULT_TIMELINE_COLORS,
    ...profile?.preferences?.timeline?.eventColors
  }));

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile?.preferences?.timeline) {
      setEnabledEvents({
        ...DEFAULT_ENABLED_EVENTS,
        ...profile.preferences.timeline.enabledEvents
      });
      setEventColors({
        ...DEFAULT_TIMELINE_COLORS,
        ...profile.preferences.timeline.eventColors
      });
    }
  }, [profile]);

  const handleToggleEvent = (eventType: TimelineEventType) => {
    setEnabledEvents(prev => ({
      ...prev,
      [eventType]: !prev[eventType]
    }));
  };

  const handleColorChange = (eventType: TimelineEventType, color: string) => {
    setEventColors(prev => ({
      ...prev,
      [eventType]: color
    }));
  };

  const handleSave = async () => {
    if (!profile) {
      toast.error('Perfil não encontrado');
      return;
    }

    try {
      setIsSaving(true);

      const updatedPreferences = {
        ...profile.preferences,
        timeline: {
          enabledEvents,
          eventColors
        }
      };

      const { error } = await supabase
        .from('profiles')
        .update({ preferences: updatedPreferences })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Preferências da Timeline salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast.error('Erro ao salvar preferências');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setEnabledEvents(DEFAULT_ENABLED_EVENTS);
    setEventColors(DEFAULT_TIMELINE_COLORS);
    toast.info('Configurações resetadas. Clique em Salvar para aplicar.');
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : <Activity className="h-4 w-4" />;
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const enabledCount = AVAILABLE_EVENTS.filter(e => enabledEvents[e]).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Configurações da Timeline</h2>
          <p className="text-sm text-muted-foreground">
            Personalize quais eventos aparecem na timeline e suas cores
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            disabled={isSaving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Grid 3 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Eventos Ativos */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Eventos Ativos
            </CardTitle>
            <Badge variant="secondary" className="text-xs w-fit mt-2">
              {enabledCount} de {AVAILABLE_EVENTS.length} ativos
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2 flex-1 overflow-auto">
            {AVAILABLE_EVENTS.map((eventType) => {
              const isEnabled = enabledEvents[eventType];
              const color = eventColors[eventType];

              return (
                <div
                  key={eventType}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border-2 transition-all",
                    isEnabled 
                      ? "border-border bg-card" 
                      : "border-dashed border-muted-foreground/20 bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: getColorWithOpacity(color, 0.15),
                        color: color
                      }}
                    >
                      {getIconComponent(TIMELINE_EVENT_ICONS[eventType])}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`event-${eventType}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {TIMELINE_EVENT_LABELS[eventType]}
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Color Picker */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Cor:</Label>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleColorChange(eventType, e.target.value)}
                        className="h-8 w-14 rounded border cursor-pointer"
                        disabled={!isEnabled}
                      />
                    </div>

                    {/* Toggle Switch */}
                    <Switch
                      id={`event-${eventType}`}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggleEvent(eventType)}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Eventos Futuros */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
              <Info className="h-4 w-4" />
              Em Desenvolvimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 flex-1 overflow-auto">
            {FUTURE_EVENTS.map((eventType) => {
              const color = eventColors[eventType];

              return (
                <div
                  key={eventType}
                  className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: getColorWithOpacity(color, 0.15),
                        color: color
                      }}
                    >
                      {getIconComponent(TIMELINE_EVENT_ICONS[eventType])}
                    </div>
                    <Label className="text-sm font-medium">
                      {TIMELINE_EVENT_LABELS[eventType]}
                    </Label>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Em breve
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg h-full min-h-[200px]">
              <p className="text-sm text-muted-foreground mb-4">
                Eventos habilitados que aparecerão na timeline:
              </p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_EVENTS.filter(e => enabledEvents[e]).map((eventType) => {
                  const color = eventColors[eventType];
                  return (
                    <Badge
                      key={eventType}
                      variant="secondary"
                      className="px-3 py-1.5"
                      style={{
                        backgroundColor: getColorWithOpacity(color, 0.15),
                        color: color,
                        borderColor: color
                      }}
                    >
                      <span className="mr-1.5">
                        {getIconComponent(TIMELINE_EVENT_ICONS[eventType])}
                      </span>
                      {TIMELINE_EVENT_LABELS[eventType]}
                    </Badge>
                  );
                })}
                {enabledCount === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    Nenhum evento habilitado
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
    </div>
  );
}
