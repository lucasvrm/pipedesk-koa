import { useState } from 'react';
import { useTags, useTagOperations, TAG_COLORS } from '@/services/tagService';
import { useSettings, useUpdateSetting } from '@/services/systemSettingsService';
import { Tag } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PencilSimple, Trash, Plus, WarningCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/PageContainer';

export default function TagSettings() {
  const { data: tags = [], isLoading: tagsLoading } = useTags('global'); // Fetch all/global tags
  const { data: settings } = useSettings();
  const { create, update, remove } = useTagOperations();
  const updateSetting = useUpdateSetting();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Form
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);
  const [tagType, setTagType] = useState<'global' | 'deal' | 'track' | 'lead'>('global');

  const rawConfig = settings?.find(s => s.key === 'tags_config')?.value;
  const tagsConfig = {
    global: rawConfig?.global ?? true,
    modules: {
      deals: rawConfig?.modules?.deals ?? true,
      tracks: rawConfig?.modules?.tracks ?? true,
      leads: rawConfig?.modules?.leads ?? true
    }
  };

  const tagsEnabled = tagsConfig.global;

  const updateTagsConfig = async (newConfig: typeof tagsConfig, successMessage?: string) => {
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
    await updateTagsConfig({ ...tagsConfig, global: enabled }, `Sistema de tags ${enabled ? 'ativado' : 'desativado'}.`);
  };

  const moduleLabels: Record<'deals' | 'tracks' | 'leads', string> = {
    deals: 'Deals',
    tracks: 'Tracks',
    leads: 'Leads'
  };

  const handleModuleToggle = async (moduleKey: 'deals' | 'tracks' | 'leads', enabled: boolean) => {
    await updateTagsConfig({
      ...tagsConfig,
      modules: {
        ...tagsConfig.modules,
        [moduleKey]: enabled
      }
    }, `Tags para ${moduleLabels[moduleKey]} ${enabled ? 'ativadas' : 'desativadas'}.`);
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
    if (!tagName) return toast.error('Nome é obrigatório');
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

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta tag? Ela será removida de todos os itens associados.')) return;
    try {
      await remove.mutateAsync(id);
      toast.success('Tag excluída.');
    } catch (e) {
      toast.error('Erro ao excluir.');
    }
  };

  if (tagsLoading) return <div>Carregando tags...</div>;

  return (
    <PageContainer>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Gerenciador de Tags</h3>
          <p className="text-sm text-muted-foreground">Crie etiquetas para categorizar Deals, Tracks e Leads.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border px-3 py-1.5 rounded-md bg-background">
                <Switch checked={tagsEnabled} onCheckedChange={toggleFeature} id="tags-toggle" />
                <Label htmlFor="tags-toggle" className="text-sm cursor-pointer">Módulo Ativo</Label>
            </div>
            <Button onClick={openCreate} disabled={!tagsEnabled}><Plus className="mr-2" /> Nova Tag</Button>
        </div>
      </div>

      {!tagsEnabled && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md flex items-center gap-2">
            <WarningCircle size={20} />
            <span>O sistema de tags está desativado globalmente. Ative para utilizar.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {(['deals', 'tracks', 'leads'] as const).map(moduleKey => (
          <Card key={moduleKey} className={!tagsEnabled ? 'opacity-50 pointer-events-none' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm">{moduleLabels[moduleKey]}</CardTitle>
                <CardDescription>Habilita tags para {moduleLabels[moduleKey]}.</CardDescription>
              </div>
              <Switch
                checked={tagsConfig.modules[moduleKey] !== false}
                onCheckedChange={(checked) => handleModuleToggle(moduleKey, checked)}
                disabled={!tagsEnabled}
                id={`tags-toggle-${moduleKey}`}
              />
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${!tagsEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {tags.map(tag => (
          <Card key={tag.id} className="group relative">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                />
                <div className="space-y-1">
                    <span className="font-medium text-sm block">{tag.name}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                        {tag.entity_type === 'global' ? 'Global' : `Apenas ${tag.entity_type}`}
                    </Badge>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tag)}>
                    <PencilSimple />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(tag.id)}>
                    <Trash />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingTag ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={tagName} onChange={e => setTagName(e.target.value)} placeholder="Ex: Prioridade Alta" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Disponibilidade</Label>
                        <Select value={tagType} onValueChange={(v: any) => setTagType(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global">Global (Todos)</SelectItem>
                                <SelectItem value="deal">Apenas Deals</SelectItem>
                                <SelectItem value="track">Apenas Tracks</SelectItem>
                                <SelectItem value="lead">Apenas Leads</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Cor</Label>
                        <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                            {TAG_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setTagColor(c)}
                                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${tagColor === c ? 'ring-2 ring-offset-1 ring-black' : ''}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
