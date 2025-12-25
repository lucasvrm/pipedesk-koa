import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  useSidebarPreferences,
  useUpdateSidebarPreferences,
  useResetSidebarPreferences,
  DEFAULT_SIDEBAR_CONFIG,
  SidebarSectionConfig,
} from '@/services/sidebarPreferencesService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GripVertical,
  Eye,
  EyeOff,
  Palette,
  RotateCcw,
  Save,
  ArrowLeft,
  Home,
  Filter,
  Briefcase,
  Kanban,
  Building2,
  User,
  Users,
  CheckSquare,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// CONSTANTS
// ============================================================================

const ICON_OPTIONS = [
  { value: 'Home', label: 'Home', Icon: Home },
  { value: 'Filter', label: 'Filter', Icon: Filter },
  { value: 'Briefcase', label: 'Briefcase', Icon: Briefcase },
  { value: 'Kanban', label: 'Kanban', Icon: Kanban },
  { value: 'Building2', label: 'Building', Icon: Building2 },
  { value: 'User', label: 'User', Icon: User },
  { value: 'Users', label: 'Users', Icon: Users },
  { value: 'CheckSquare', label: 'Check', Icon: CheckSquare },
  { value: 'BarChart3', label: 'Chart', Icon: BarChart3 },
  { value: 'Settings', label: 'Settings', Icon: Settings },
];

const SECTION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  leads: 'Leads',
  deals: 'Deals',
  kanban: 'Tracks',
  companies: 'Empresas',
  contacts: 'Contatos',
  players: 'Players',
  tasks: 'Tarefas',
  profile: 'Meu Perfil',
  management: 'Gestão',
  settings: 'Configurações',
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function CustomizeSidebarPage() {
  // Hooks de dados
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: sidebarPrefs, isLoading, error } = useSidebarPreferences(profile?.id || null);
  const updatePrefs = useUpdateSidebarPreferences();
  const resetPrefs = useResetSidebarPreferences();

  // useMemo
  const initialSections = useMemo(() => {
    if (sidebarPrefs?.config?.sections) {
      return [...sidebarPrefs.config.sections].sort((a, b) => a.order - b.order);
    }
    return [...DEFAULT_SIDEBAR_CONFIG];
  }, [sidebarPrefs]);

  // useState
  const [sections, setSections] = useState<SidebarSectionConfig[]>(initialSections);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // useEffect - Sync quando dados carregam
  useEffect(() => {
    if (sidebarPrefs?.config?.sections) {
      setSections([...sidebarPrefs.config.sections].sort((a, b) => a.order - b.order));
      setHasChanges(false);
    }
  }, [sidebarPrefs]);

  // useCallback handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  }, [dragOverIndex]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = draggedIndex;
    
    if (dragIndex === null || dragIndex === dropIndex) {
      handleDragEnd();
      return;
    }

    setSections(prev => {
      const newSections = [...prev];
      const [draggedItem] = newSections.splice(dragIndex, 1);
      newSections.splice(dropIndex, 0, draggedItem);
      
      // Update order values
      return newSections.map((section, idx) => ({
        ...section,
        order: idx,
      }));
    });
    
    setHasChanges(true);
    handleDragEnd();
  }, [draggedIndex, handleDragEnd]);

  const toggleEnabled = useCallback((sectionId: string) => {
    setSections(prev =>
      prev.map(s =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      )
    );
    setHasChanges(true);
  }, []);

  const updateColor = useCallback((sectionId: string, color: string) => {
    setSections(prev =>
      prev.map(s =>
        s.id === sectionId ? { ...s, color } : s
      )
    );
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      await updatePrefs.mutateAsync({
        userId: profile.id,
        config: { sections },
      });
      setHasChanges(false);
    } catch {
      // Error handled by mutation
    }
  }, [profile?.id, sections, updatePrefs]);

  const handleReset = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      await resetPrefs.mutateAsync(profile.id);
      setSections([...DEFAULT_SIDEBAR_CONFIG]);
      setHasChanges(false);
    } catch {
      // Error handled by mutation
    }
  }, [profile?.id, resetPrefs]);

  // Early returns após todos os hooks
  if (!profile) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Carregando perfil...
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="space-y-3 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Erro ao carregar preferências: {error.message}</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            Personalizar Sidebar
          </h1>
          <p className="text-muted-foreground mt-1">
            Arraste para reordenar, clique para ativar/desativar seções
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/profile')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Sections List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seções da Sidebar</CardTitle>
          <CardDescription>
            Arraste as seções para reordenar. Use o toggle para mostrar/ocultar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.map((section, index) => {
            const iconOption = ICON_OPTIONS.find(opt => opt.value === section.icon);
            const IconComponent = iconOption?.Icon || Home;
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;

            return (
              <div
                key={section.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all cursor-move",
                  isDragging && "opacity-50 scale-95",
                  isDragOver && "border-primary border-2",
                  !section.enabled && "opacity-60"
                )}
              >
                {/* Drag Handle */}
                <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />

                {/* Icon Preview */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: section.color + '20', color: section.color }}
                >
                  <IconComponent className="h-5 w-5" />
                </div>

                {/* Section Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {SECTION_LABELS[section.id] || section.id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ordem: {section.order + 1}
                  </p>
                </div>

                {/* Color Picker */}
                <div className="flex items-center gap-2 shrink-0">
                  <Label htmlFor={`color-${section.id}`} className="sr-only">
                    Cor
                  </Label>
                  <input
                    id={`color-${section.id}`}
                    type="color"
                    value={section.color}
                    onChange={(e) => updateColor(section.id, e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    title="Escolher cor"
                  />
                </div>

                {/* Enable/Disable Toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    id={`enabled-${section.id}`}
                    checked={section.enabled}
                    onCheckedChange={() => toggleEnabled(section.id)}
                  />
                  {section.enabled ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={resetPrefs.isPending}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar para Padrão
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resetar preferências?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso irá restaurar todas as configurações da sidebar para o padrão.
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>
                Resetar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="secondary">Alterações não salvas</Badge>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updatePrefs.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updatePrefs.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
