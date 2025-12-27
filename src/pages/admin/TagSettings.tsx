import { useState } from 'react';
import { useTags, useTagOperations, TAG_COLORS } from '@/services/tagService';
import { useSettings, useUpdateSetting } from '@/services/systemSettingsService';
import { Tag } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { PencilSimple, Plus, WarningCircle, Tag as TagIcon, ListDashes, SquaresFour, MagnifyingGlass } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { TagCard } from './components/TagCard';
import { TagList } from './components/TagList';
import { StandardPageLayout } from '@/components/layouts';

// Atenção: PageContainer foi removido daqui. O componente agora apenas
// rende as seções internas; a página ou aba que embute TagSettings deve
// envolver com um PageContainer.

export default function TagSettings() {
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const { data: settings } = useSettings();
  const { create, update, remove } = useTagOperations();
  const updateSetting = useUpdateSetting();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Form
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);
  const [tagType, setTagType] = useState<'global' | 'deal' | 'track' | 'lead' | 'company'>('global');

  const rawConfig = settings?.find((s) => s.key === 'tags_config')?.value;
  const tagsConfig = {
    global: rawConfig?.global ?? true,
    modules: {
      deals: rawConfig?.modules?.deals ?? true,
      tracks: rawConfig?.modules?.tracks ?? true,
      leads: rawConfig?.modules?.leads ?? true
    }
  };

  const tagsEnabled = tagsConfig.global;

  const moduleLabels: Record<'deals' | 'tracks' | 'leads', string> = {
    deals: 'Deals',
    tracks: 'Tracks',
    leads: 'Leads'
  };

  const updateTagsConfig = async (
    newConfig: typeof tagsConfig,
    successMessage?: string
  ) => {
    try {
      await updateSetting.mutateAsync({
        key: 'tags_config',
        value: newConfig,
        description: 'Configuration for Tags module'
      });
      if (successMessage) toast.success(successMessage);
    } catch (e) {
      toast.error('Erro ao atualizar configuração.');
    }
  };

  const toggleFeature = async (enabled: boolean) => {
    await updateTagsConfig(
      { ...tagsConfig, global: enabled },
      `Sistema de tags ${enabled ? 'ativado' : 'desativado'}.`
    );
  };

  const handleModuleToggle = async (
    moduleKey: 'deals' | 'tracks' | 'leads',
    enabled: boolean
  ) => {
    await updateTagsConfig(
      {
        ...tagsConfig,
        modules: {
          ...tagsConfig.modules,
          [moduleKey]: enabled
        }
      },
      `Tags para ${moduleLabels[moduleKey]} ${enabled ? 'ativadas' : 'desativadas'}.`
    );
  };

  const openCreate = () => {
    setEditingTag(null);
    setTagName('');
    setTagColor(TAG_COLORS[0]);
    setTagType('global');
    setIsDialogOpen(true);
  };

  const openEdit = (tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setTagType(tag.entity_type || 'global');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!tagName) {
      return toast.error('Nome é obrigatório');
    }
    try {
      if (editingTag) {
        await update.mutateAsync({
          id: editingTag.id,
          name: tagName,
          color: tagColor,
          entity_type: tagType
        });
        toast.success('Tag atualizada!');
      } else {
        await create.mutateAsync({
          name: tagName,
          color: tagColor,
          entity_type: tagType
        });
        toast.success('Tag criada!');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar tag.');
    }
  };

  const confirmDelete = async () => {
    if (!tagToDelete) return;
    try {
      await remove.mutateAsync(tagToDelete);
      toast.success('Tag excluída com sucesso.');
    } catch (e) {
      toast.error('Erro ao excluir a tag.');
    } finally {
      setTagToDelete(null);
    }
  };

  if (tagsLoading) return <div>Carregando tags...</div>;

  // Renderiza uma lista de tags para uma seção específica (Grid Mode)
  const renderTagGrid = (moduleKey: 'deals' | 'tracks' | 'leads', title: string) => {
    const entityTypeSingular = moduleKey === 'deals' ? 'deal' : moduleKey === 'tracks' ? 'track' : 'lead';

    let relevantTags = tags.filter(t =>
      t.entity_type === 'global' || t.entity_type === null || t.entity_type === entityTypeSingular
    );

    if (searchQuery) {
        relevantTags = relevantTags.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (relevantTags.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border rounded-lg border-dashed bg-muted/10 h-full">
          <TagIcon size={32} className="opacity-20 mb-2" />
          <p className="text-sm">Nenhuma tag encontrada para {title}.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        {relevantTags.map(tag => (
           <TagCard
             key={tag.id}
             tag={tag}
             onEdit={openEdit}
             onDelete={(id) => setTagToDelete(id)}
           />
        ))}
      </div>
    );
  };

  const renderTagList = () => {
      let filteredTags = tags;
      if (searchQuery) {
          filteredTags = filteredTags.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      return <TagList tags={filteredTags} onEdit={openEdit} onDelete={(id) => setTagToDelete(id)} />
  };

  return (
    <StandardPageLayout>
      {/* Header & Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Gerenciador de Tags</h3>
          <p className="text-sm text-muted-foreground">
            Categorize Deals, Tracks e Leads com etiquetas personalizadas.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tags..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center border rounded-md bg-background">
            <button
                onClick={() => setViewMode('grid')}
                className={`p-2 hover:bg-accent rounded-l-md transition-colors ${viewMode === 'grid' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
                title="Visualização em Grid"
            >
                <SquaresFour size={20} />
            </button>
            <div className="w-[1px] h-9 bg-border" />
            <button
                onClick={() => setViewMode('list')}
                className={`p-2 hover:bg-accent rounded-r-md transition-colors ${viewMode === 'list' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
                title="Visualização em Lista"
            >
                <ListDashes size={20} />
            </button>
          </div>

          <Button onClick={openCreate} disabled={!tagsEnabled}>
            <Plus className="mr-2" /> Nova Tag
          </Button>
        </div>
      </div>

      {!tagsEnabled && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md flex items-center gap-2">
          <WarningCircle size={20} />
          <span>
            O sistema de tags está desativado globalmente. Ative para utilizar.
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <div className={!tagsEnabled ? 'opacity-50 pointer-events-none' : ''}>
        {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Iteramos sobre os módulos para criar as seções visuais */}
                {(['leads', 'deals', 'tracks'] as const).map((moduleKey) => (
                <div key={moduleKey} className="space-y-4">
                    <div className="flex flex-col items-start gap-4 border-b pb-4">
                        <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-md text-primary">
                                <TagIcon size={20} />
                            </div>
                            <div>
                            <h4 className="font-medium text-base">Tags de {moduleLabels[moduleKey]}</h4>
                            <p className="text-xs text-muted-foreground">
                                Globais + Específicas
                            </p>
                            </div>
                        </div>
                        <Switch
                            id={`switch-${moduleKey}`}
                            checked={tagsConfig.modules[moduleKey] !== false}
                            onCheckedChange={(checked) => handleModuleToggle(moduleKey, checked)}
                        />
                        </div>
                    </div>

                    {/* Lista de Tags (Grid Column) */}
                    <div className="bg-muted/30 p-4 rounded-lg border border-dashed min-h-[150px]">
                        {renderTagGrid(moduleKey, moduleLabels[moduleKey])}
                    </div>
                </div>
                ))}
            </div>
        ) : (
            renderTagList()
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para criar ou editar uma tag. Tags globais ficam disponíveis em todos os módulos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Ex: Prioridade Alta"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Disponibilidade</Label>
                <Select
                  value={tagType}
                  onValueChange={(v: any) => setTagType(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (Todos)</SelectItem>
                    <SelectItem value="lead">Apenas Leads</SelectItem>
                    <SelectItem value="deal">Apenas Deals</SelectItem>
                    <SelectItem value="track">Apenas Tracks</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Define onde esta tag será visível.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTagColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                        tagColor === c
                          ? 'ring-2 ring-offset-1 ring-black'
                          : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tag? Esta ação removerá a tag de todos os itens associados e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StandardPageLayout>
  );
}
