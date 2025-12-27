import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import {
  useSidebarPreferences,
  useUpdateSidebarPreferences,
  useResetSidebarPreferences,
  DEFAULT_SIDEBAR_CONFIG,
  SidebarSectionConfig,
  SidebarItemConfig,
  validateSidebarConfig,
  isItemFixed,
} from '@/services/sidebarPreferencesService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { StandardPageLayout } from '@/components/layouts';
import {
  GripVertical,
  Eye,
  EyeOff,
  Palette,
  RotateCcw,
  Save,
  ArrowLeft,
  Info,
  Home,
  LayoutDashboard,
  Menu,
  Navigation,
  MapPin,
  Compass,
  Route,
  Map,
  Briefcase,
  Building2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  UserCircle,
  Contact,
  Phone,
  Mail,
  MessageCircle,
  FileText,
  Folder,
  FolderOpen,
  Archive,
  File,
  FileSpreadsheet,
  FileBarChart,
  Paperclip,
  Download,
  Upload,
  Settings,
  Wrench,
  Hammer,
  Zap,
  Bell,
  Calendar,
  Clock,
  Timer,
  Flag,
  Star,
  Heart,
  Bookmark,
  Image,
  Shield,
  Lock,
  Key,
  BarChart3,
  PieChart,
  Activity,
  TrendingDown,
  Filter,
  Search,
  Plus,
  Minus,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Kanban,
  CheckSquare,
  ListTodo,
  Clipboard,
  Pencil,
  User,
  Trash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvatarCustomizer } from '@/pages/Profile/components/AvatarCustomizer';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// ============================================================================
// CONSTANTS
// ============================================================================

const ICON_OPTIONS = [
  // Navegação (8)
  { value: 'Home', label: 'Home', Icon: Home, category: 'navigation' },
  { value: 'LayoutDashboard', label: 'Dashboard', Icon: LayoutDashboard, category: 'navigation' },
  { value: 'Menu', label: 'Menu', Icon: Menu, category: 'navigation' },
  { value: 'Navigation', label: 'Navigation', Icon: Navigation, category: 'navigation' },
  { value: 'MapPin', label: 'Map Pin', Icon: MapPin, category: 'navigation' },
  { value: 'Compass', label: 'Compass', Icon: Compass, category: 'navigation' },
  { value: 'Route', label: 'Route', Icon: Route, category: 'navigation' },
  { value: 'Map', label: 'Map', Icon: Map, category: 'navigation' },
  
  // Negócios (12)
  { value: 'Briefcase', label: 'Briefcase', Icon: Briefcase, category: 'business' },
  { value: 'Building2', label: 'Building', Icon: Building2, category: 'business' },
  { value: 'TrendingUp', label: 'Trending Up', Icon: TrendingUp, category: 'business' },
  { value: 'DollarSign', label: 'Dollar', Icon: DollarSign, category: 'business' },
  { value: 'ShoppingCart', label: 'Shopping', Icon: ShoppingCart, category: 'business' },
  { value: 'Package', label: 'Package', Icon: Package, category: 'business' },
  { value: 'Users', label: 'Users', Icon: Users, category: 'business' },
  { value: 'UserCircle', label: 'User Circle', Icon: UserCircle, category: 'business' },
  { value: 'Contact', label: 'Contact', Icon: Contact, category: 'business' },
  { value: 'Phone', label: 'Phone', Icon: Phone, category: 'business' },
  { value: 'Mail', label: 'Mail', Icon: Mail, category: 'business' },
  { value: 'MessageCircle', label: 'Message', Icon: MessageCircle, category: 'business' },
  
  // Documentos (10)
  { value: 'FileText', label: 'File Text', Icon: FileText, category: 'documents' },
  { value: 'Folder', label: 'Folder', Icon: Folder, category: 'documents' },
  { value: 'FolderOpen', label: 'Folder Open', Icon: FolderOpen, category: 'documents' },
  { value: 'Archive', label: 'Archive', Icon: Archive, category: 'documents' },
  { value: 'File', label: 'File', Icon: File, category: 'documents' },
  { value: 'FileSpreadsheet', label: 'Spreadsheet', Icon: FileSpreadsheet, category: 'documents' },
  { value: 'FileBarChart', label: 'File Chart', Icon: FileBarChart, category: 'documents' },
  { value: 'Paperclip', label: 'Paperclip', Icon: Paperclip, category: 'documents' },
  { value: 'Download', label: 'Download', Icon: Download, category: 'documents' },
  { value: 'Upload', label: 'Upload', Icon: Upload, category: 'documents' },
  
  // Ações (10)
  { value: 'Settings', label: 'Settings', Icon: Settings, category: 'actions' },
  { value: 'Wrench', label: 'Wrench', Icon: Wrench, category: 'actions' },
  { value: 'Hammer', label: 'Hammer', Icon: Hammer, category: 'actions' },
  { value: 'Zap', label: 'Zap', Icon: Zap, category: 'actions' },
  { value: 'Bell', label: 'Bell', Icon: Bell, category: 'actions' },
  { value: 'Calendar', label: 'Calendar', Icon: Calendar, category: 'actions' },
  { value: 'Clock', label: 'Clock', Icon: Clock, category: 'actions' },
  { value: 'Timer', label: 'Timer', Icon: Timer, category: 'actions' },
  { value: 'Search', label: 'Search', Icon: Search, category: 'actions' },
  { value: 'Filter', label: 'Filter', Icon: Filter, category: 'actions' },
  
  // Diversos (10)
  { value: 'Flag', label: 'Flag', Icon: Flag, category: 'misc' },
  { value: 'Star', label: 'Star', Icon: Star, category: 'misc' },
  { value: 'Heart', label: 'Heart', Icon: Heart, category: 'misc' },
  { value: 'Bookmark', label: 'Bookmark', Icon: Bookmark, category: 'misc' },
  { value: 'Palette', label: 'Palette', Icon: Palette, category: 'misc' },
  { value: 'Image', label: 'Image', Icon: Image, category: 'misc' },
  { value: 'Shield', label: 'Shield', Icon: Shield, category: 'misc' },
  { value: 'Lock', label: 'Lock', Icon: Lock, category: 'misc' },
  { value: 'Key', label: 'Key', Icon: Key, category: 'misc' },
  { value: 'User', label: 'User', Icon: User, category: 'misc' },
  
  // Gráficos (5)
  { value: 'BarChart3', label: 'Bar Chart', Icon: BarChart3, category: 'charts' },
  { value: 'PieChart', label: 'Pie Chart', Icon: PieChart, category: 'charts' },
  { value: 'Activity', label: 'Activity', Icon: Activity, category: 'charts' },
  { value: 'TrendingDown', label: 'Trending Down', Icon: TrendingDown, category: 'charts' },
  { value: 'Kanban', label: 'Kanban', Icon: Kanban, category: 'charts' },
  
  // Tarefas (5)
  { value: 'CheckSquare', label: 'Check Square', Icon: CheckSquare, category: 'tasks' },
  { value: 'ListTodo', label: 'Todo List', Icon: ListTodo, category: 'tasks' },
  { value: 'Clipboard', label: 'Clipboard', Icon: Clipboard, category: 'tasks' },
  { value: 'Pencil', label: 'Pencil', Icon: Pencil, category: 'tasks' },
  { value: 'Plus', label: 'Plus', Icon: Plus, category: 'tasks' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function CustomizeSidebarPage() {
  // Hooks de dados
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Verificar se usuário é admin
  const isAdmin = useMemo(() => 
    profile ? hasPermission(profile.role, 'MANAGE_SETTINGS') : false,
  [profile]);

  const availableTabs = ['avatar', 'rail'] as const
  const requestedTab = searchParams.get('tab');
  const activeTab = availableTabs.includes(requestedTab as (typeof availableTabs)[number])
    ? (requestedTab as (typeof availableTabs)[number])
    : 'avatar';

  // useState - DEVE vir ANTES de useMemo que depende dele
  const [sections, setSections] = useState<SidebarSectionConfig[]>(initialSections);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SidebarSectionConfig | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ sectionId: string; item: SidebarItemConfig | null } | null>(null);
  const [sectionForm, setSectionForm] = useState({ label: '', tooltip: '', icon: 'Home', color: '#3b82f6', path: '/' });
  const [itemForm, setItemForm] = useState({ label: '', path: '/', icon: 'Home' });
  
  useEffect(() => {
    if (!requestedTab || !availableTabs.includes(requestedTab as (typeof availableTabs)[number])) {
      setSearchParams({ tab: 'avatar' }, { replace: true });
    }
  }, [availableTabs, requestedTab, setSearchParams]);
  
  // Filtrar seções editáveis (admin vê todas, user só custom)
  const editableSections = useMemo(() =>
    sections.filter(s => isAdmin || s.type === 'custom'),
  [sections, isAdmin]);

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

  // ============================================================================
  // CRUD HANDLERS
  // ============================================================================

  /**
   * Criar ou editar seção
   */
  const handleSaveSection = useCallback(async () => {
    if (!profile?.id) return;
    if (!sectionForm.label || !sectionForm.tooltip || !sectionForm.path) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSections(prev => {
      let updated: SidebarSectionConfig[];
      
      if (editingSection) {
        // Editar existente
        updated = prev.map(s =>
          s.id === editingSection.id
            ? { ...s, ...sectionForm, label: sectionForm.label, tooltip: sectionForm.tooltip, path: sectionForm.path }
            : s
        );
      } else {
        // Criar nova (sempre custom)
        const newSection: SidebarSectionConfig = {
          id: `custom-${Date.now()}`,
          type: 'custom',
          enabled: true,
          order: prev.length,
          ...sectionForm,
          children: []
        };
        updated = [...prev, newSection];
      }
      
      return updated;
    });

    setHasChanges(true);
    setSectionDialogOpen(false);
    toast.success(editingSection ? 'Seção atualizada' : 'Seção criada');
  }, [profile, sectionForm, editingSection]);

  /**
   * Deletar seção customizada
   */
  const handleDeleteSection = useCallback((sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section || section.type !== 'custom') return;

    setSections(prev => {
      // Remover seção + marcar children como órfãos
      const filtered = prev.filter(s => s.id !== sectionId);
      
      // Reordenar
      return filtered.map((s, idx) => ({ ...s, order: idx }));
    });

    setHasChanges(true);
    toast.success('Seção deletada. Subitens ficaram órfãos (ocultos).');
  }, [sections]);

  /**
   * Criar ou editar subitem
   */
  const handleSaveItem = useCallback(() => {
    if (!editingItem) return;
    if (!itemForm.label || !itemForm.path) {
      toast.error('Preencha título e path');
      return;
    }

    setSections(prev => prev.map(section => {
      if (section.id !== editingItem.sectionId) return section;

      let updatedChildren: SidebarItemConfig[];
      
      if (editingItem.item) {
        // Editar existente
        updatedChildren = section.children.map(child =>
          child.id === editingItem.item!.id
            ? { ...child, ...itemForm, label: itemForm.label, path: itemForm.path }
            : child
        );
      } else {
        // Criar novo
        const newItem: SidebarItemConfig = {
          id: `custom-item-${Date.now()}`,
          ...itemForm,
          enabled: true,
          order: section.children.length,
          fixed: false
        };
        updatedChildren = [...section.children, newItem];
      }

      return { ...section, children: updatedChildren };
    }));

    setHasChanges(true);
    setItemDialogOpen(false);
    toast.success(editingItem.item ? 'Item atualizado' : 'Item criado');
  }, [editingItem, itemForm]);

  /**
   * Toggle enabled de subitem
   */
  const handleToggleItem = useCallback((sectionId: string, itemId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      
      return {
        ...section,
        children: section.children.map(child =>
          child.id === itemId ? { ...child, enabled: !child.enabled } : child
        )
      };
    }));
    
    setHasChanges(true);
  }, []);

  /**
   * Toggle fixed status de subitem
   */
  const handleToggleFixed = useCallback((sectionId: string, itemId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      
      return {
        ...section,
        children: section.children.map(child => {
          if (child.id === itemId) {
            const newFixed = !child.fixed;
            // Se marcar como fixo, também ativar enabled
            return { ...child, fixed: newFixed, enabled: newFixed ? true : child.enabled };
          }
          return child;
        })
      };
    }));
    
    setHasChanges(true);
  }, []);

  /**
   * Deletar subitem
   */
  const handleDeleteItem = useCallback((sectionId: string, itemId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      
      return {
        ...section,
        children: section.children.filter(child => child.id !== itemId)
      };
    }));
    
    // Limpar editingItem se estiver editando o item deletado
    if (editingItem?.sectionId === sectionId && editingItem?.item?.id === itemId) {
      setEditingItem(null);
      setItemDialogOpen(false);
    }
    
    setHasChanges(true);
    toast.success('Item deletado');
  }, [editingItem]);

  /**
   * Validar antes de salvar
   */
  const handleSaveWithValidation = useCallback(async () => {
    if (!profile?.id) return;
    
    const validation = validateSidebarConfig(sections);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }
    
    await handleSave();
  }, [profile, sections, handleSave]);

  // Early returns após todos os hooks
  if (!profile) {
    return (
      <StandardPageLayout>
        <div className="text-center text-muted-foreground">
          Carregando perfil...
        </div>
      </StandardPageLayout>
    );
  }

  if (isLoading) {
    return (
      <StandardPageLayout>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="space-y-3 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </StandardPageLayout>
    );
  }

  if (error) {
    return (
      <StandardPageLayout>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Erro ao carregar preferências: {error.message}</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout>
      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="avatar">
            <Palette className="h-4 w-4 mr-2" />Avatar
          </TabsTrigger>
          <TabsTrigger value="rail">
            <Kanban className="h-4 w-4 mr-2" />Rail/Sidebar
          </TabsTrigger>
        </TabsList>

        {/* TAB AVATAR */}
        <TabsContent value="avatar">
          <AvatarCustomizer 
            user={profile} 
            onUpdate={async (field, value) => {
              const map: Record<string, string> = {
                avatarBgColor: 'avatar_bg_color',
                avatarTextColor: 'avatar_text_color',
                avatarBorderColor: 'avatar_border_color',
              };
              const col = map[field];
              if (col) await supabase.from('profiles').update({ [col]: value }).eq('id', profile.id);
            }}
            isSaving={false}
          />
        </TabsContent>

        {/* TAB RAIL/SIDEBAR */}
        <TabsContent value="rail" className="pb-24">
          {!isAdmin && (
            <div className="mb-4 p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <Info className="h-3 w-3" />
                Apenas administradores podem editar/deletar itens em seções padrão do sistema
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Config */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Seções da Rail</CardTitle>
                  <Button size="sm" onClick={() => {
                    setEditingSection(null);
                    setSectionForm({ label: '', tooltip: '', icon: 'Home', color: '#3b82f6', path: '/' });
                    setSectionDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />Nova Seção
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {sections.map((section, index) => {
                  const Icon = ICON_OPTIONS.find(o => o.value === section.icon)?.Icon || Home;
                  return (
                    <div key={section.id} className="space-y-2">
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, index)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border bg-card cursor-move",
                          draggedIndex === index && "opacity-50",
                          !section.enabled && "opacity-60"
                        )}
                      >
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: section.color + '20', color: section.color }}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{section.label}</span>
                            {section.type === 'custom' && <Badge variant="outline" className="text-[10px]">Custom</Badge>}
                            {section.type === 'default' && (
                              <Badge variant="secondary" className="text-[10px]">Padrão</Badge>
                            )}
                            {section.type === 'default' && !isAdmin && (
                              <Badge variant="secondary" className="text-[10px]">Somente admin</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{section.tooltip} • {section.children.length} itens</p>
                        </div>
                        <input type="color" value={section.color} onChange={(e) => updateColor(section.id, e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                        <Switch
                          checked={section.enabled}
                          onCheckedChange={() => toggleEnabled(section.id)}
                          disabled={(section.enabled && sections.filter(s => s.enabled).length <= 4) || (!section.enabled && sections.filter(s => s.enabled).length >= 10)}
                        />
                        {(section.type === 'custom' || isAdmin) && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              setEditingSection(section);
                              setSectionForm({ label: section.label, tooltip: section.tooltip, icon: section.icon, color: section.color, path: section.path });
                              setSectionDialogOpen(true);
                            }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {section.type === 'custom' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive" 
                                onClick={() => {
                                  if (confirm(`Deletar "${section.label}"? Subitens ficarão órfãos.`)) {
                                    handleDeleteSection(section.id);
                                  }
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Subitens */}
                      {section.children.length > 0 && (
                        <div className="ml-12 pl-4 border-l-2 space-y-1">
                          {section.children.map(item => {
                            const ItemIcon = ICON_OPTIONS.find(o => o.value === item.icon)?.Icon || FileText;
                            const isSystemFixed = isItemFixed(section.id, item.id);
                            const canDelete = !isSystemFixed && (section.type === 'custom' || isAdmin);
                            
                            return (
                              <div key={item.id} className="flex items-center gap-2 p-2 rounded-md text-sm bg-accent/50">
                                <ItemIcon className="h-4 w-4" />
                                <span className="flex-1">{item.label}</span>
                                {item.fixed && <Badge variant="secondary" className="text-[10px]">Fixo</Badge>}
                                <Switch 
                                  checked={item.enabled} 
                                  onCheckedChange={() => handleToggleItem(section.id, item.id)} 
                                  disabled={item.fixed} 
                                />
                                {(section.type === 'custom' || isAdmin) && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingItem({ sectionId: section.id, item });
                                      setItemForm({ label: item.label, path: item.path, icon: item.icon ?? 'Home' });
                                      setItemDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" 
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Trash className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Deletar "{item.label}"?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta ação não pode ser desfeita. O item será removido permanentemente ao salvar.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteItem(section.id, item.id);
                                          }}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Deletar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                {isSystemFixed && !canDelete && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 opacity-30 cursor-not-allowed" 
                                    disabled
                                    title="Item fixo do sistema"
                                  >
                                    <Trash className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                          <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => {
                            setEditingItem({ sectionId: section.id, item: null });
                            setItemForm({ label: '', path: '/', icon: 'Home' });
                            setItemDialogOpen(true);
                          }}>
                            <Plus className="h-3 w-3 mr-1" />Adicionar
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="sticky top-6">
              <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium mb-2">Rail</p>
                    <div className="bg-slate-900 rounded-lg p-3 flex flex-col items-center gap-2">
                      {sections.filter(s => s.enabled).sort((a,b) => a.order - b.order).map(s => {
                        const Icon = ICON_OPTIONS.find(o => o.value === s.icon)?.Icon || Home;
                        return <div key={s.id} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10" style={{color: s.color}} title={s.tooltip}><Icon className="h-5 w-5" /></div>;
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium mb-2">Sidebar</p>
                    <div className="border rounded-lg p-3 max-h-[400px] overflow-y-auto space-y-1">
                      {sections.filter(s => s.enabled).sort((a,b) => a.order - b.order).map(s => {
                        const Icon = ICON_OPTIONS.find(o => o.value === s.icon)?.Icon || Home;
                        return s.children.filter(c => c.enabled).length > 0 ? (
                          <div key={s.id}>
                            <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground"><Icon className="h-3 w-3" />{s.label}</div>
                            {s.children.filter(c => c.enabled).map(i => {
                              const IIcon = ICON_OPTIONS.find(o => o.value === i.icon)?.Icon || FileText;
                              return <div key={i.id} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent"><IIcon className="h-4 w-4" />{i.label}</div>;
                            })}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    {sections.filter(s => s.enabled).length >= 4 ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-destructive" />}
                    <span>Min 4 ativas ({sections.filter(s => s.enabled).length}/4)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {sections.filter(s => s.enabled).length <= 10 ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-destructive" />}
                    <span>Max 10 ativas ({sections.filter(s => s.enabled).length}/10)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Itens Fixos */}
            <Card>
              <CardHeader>
                <CardTitle>Itens Fixos</CardTitle>
                <CardDescription>Itens fixos não podem ser desativados.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sections.map(section => {
                    if (section.children.length === 0) return null;
                    
                    const SectionIcon = ICON_OPTIONS.find(o => o.value === section.icon)?.Icon || Home;
                    
                    return (
                      <div key={section.id} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <SectionIcon className="h-4 w-4" />
                          {section.label}
                        </div>
                        <div className="ml-6 space-y-1">
                          {section.children.map(item => {
                            const ItemIcon = ICON_OPTIONS.find(o => o.value === item.icon)?.Icon || FileText;
                            const isSystemFixed = isItemFixed(section.id, item.id);
                            
                            return (
                              <div key={item.id} className="flex items-center gap-2 p-2 rounded-md text-sm bg-accent/30">
                                <ItemIcon className="h-4 w-4" />
                                <span className="flex-1">{item.label}</span>
                                {isSystemFixed && (
                                  <span className="text-xs text-muted-foreground">Sistema</span>
                                )}
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`fixed-${section.id}-${item.id}`} className="text-xs">Fixo</Label>
                                  <Switch 
                                    id={`fixed-${section.id}-${item.id}`}
                                    checked={item.fixed || isSystemFixed} 
                                    onCheckedChange={() => handleToggleFixed(section.id, item.id)}
                                    disabled={isSystemFixed}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sticky Action Bar */}
          <div className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur mt-6 -mx-6 px-6 py-4 flex justify-between items-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline"><RotateCcw className="h-4 w-4 mr-2" />Resetar</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Resetar?</AlertDialogTitle>
                  <AlertDialogDescription>Restaura configurações padrão. Irreversível.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>Resetar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2 items-center">
              {hasChanges && <Badge variant="secondary">Não salvo</Badge>}
              <Button onClick={handleSaveWithValidation} disabled={!hasChanges || updatePrefs.isPending}>
                <Save className="h-4 w-4 mr-2" />{updatePrefs.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* DIALOGS */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Editar' : 'Nova'} Seção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Título *</Label><Input value={sectionForm.label} onChange={e => setSectionForm(p => ({...p, label: e.target.value}))} /></div>
            <div><Label>Tooltip *</Label><Input value={sectionForm.tooltip} onChange={e => setSectionForm(p => ({...p, tooltip: e.target.value}))} /></div>
            <div><Label>Path *</Label><Input value={sectionForm.path} onChange={e => setSectionForm(p => ({...p, path: e.target.value}))} /></div>
            <div><Label>Ícone</Label><select value={sectionForm.icon} onChange={e => setSectionForm(p => ({...p, icon: e.target.value}))} className="w-full rounded-md border px-3 py-2">
              {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select></div>
            <div className="flex gap-2"><input type="color" value={sectionForm.color} onChange={e => setSectionForm(p => ({...p, color: e.target.value}))} className="w-20 h-10" /><Input value={sectionForm.color} onChange={e => setSectionForm(p => ({...p, color: e.target.value}))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSection} disabled={!sectionForm.label || !sectionForm.tooltip}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem?.item ? 'Editar' : 'Novo'} Subitem</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Título *</Label><Input value={itemForm.label} onChange={e => setItemForm(p => ({...p, label: e.target.value}))} /></div>
            <div><Label>Path *</Label><Input value={itemForm.path} onChange={e => setItemForm(p => ({...p, path: e.target.value}))} /></div>
            <div><Label>Ícone</Label><select value={itemForm.icon} onChange={e => setItemForm(p => ({...p, icon: e.target.value}))} className="w-full rounded-md border px-3 py-2">
              {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveItem} disabled={!itemForm.label}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StandardPageLayout>
  );
}
