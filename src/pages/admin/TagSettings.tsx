import { useState, useEffect } from 'react';
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
import { PencilSimple, Trash, Plus, Tag as TagIcon, Gear } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface TagConfig {
  global: boolean;
  modules: {
    deals: boolean;
    tracks: boolean;
  };
}

export default function TagSettings() {
  const { data: tags = [], isLoading: tagsLoading } = useTags('global');
  const { data: settings } = useSettings();
  const { create, update, remove } = useTagOperations();
  const updateSetting = useUpdateSetting();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Form
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);
  const [tagType, setTagType] = useState<'global' | 'deal' | 'track'>('global');

  // Config State
  const [config, setConfig] = useState<TagConfig>({ global: true, modules: { deals: true, tracks: true } });

  useEffect(() => {
    const remoteConfig = settings?.find(s => s.key === 'tags_config')?.value;
    if (remoteConfig) {
      setConfig(remoteConfig);
    }
  }, [settings]);

  const updateConfig = async (newConfig: TagConfig) => {
    setConfig(newConfig); // Optimistic
    try {
      await updateSetting.mutateAsync({
        key: 'tags_config',
        value: newConfig,
        description: 'Habilita o sistema de tags globalmente e por módulo'
      });
      toast.success('Configuração atualizada.');
    } catch (e) {
      toast.error('Erro ao salvar configuração.');
    }
  };

  const toggleGlobal = (checked: boolean) => updateConfig({ ...config, global: checked });

  const toggleModule = (module: 'deals' | 'tracks', checked: boolean) => {
    updateConfig({
      ...config,
      modules: { ...config.modules, [module]: checked }
    });
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Gerenciador de Tags</h3>
          <p className="text-sm text-muted-foreground">Configure etiquetas globais e disponibilidade.</p>
        </div>

        <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-lg border">
            <div className="flex items-center gap-2 px-2">
                <Switch checked={config.global} onCheckedChange={toggleGlobal} id="global-toggle" />
                <Label htmlFor="global-toggle" className="text-sm cursor-pointer font-medium">Sistema Ativo</Label>
            </div>
            <div className="h-6 w-px bg-border mx-2" />
            <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <Switch checked={config.modules.deals} onCheckedChange={(c) => toggleModule('deals', c)} id="deals-toggle" disabled={!config.global} className="scale-75" />
                    <Label htmlFor="deals-toggle" className={`cursor-pointer ${!config.global ? 'opacity-50' : ''}`}>Deals</Label>
                </div>
                <div className="flex items-center gap-2">
                    <Switch checked={config.modules.tracks} onCheckedChange={(c) => toggleModule('tracks', c)} id="tracks-toggle" disabled={!config.global} className="scale-75" />
                    <Label htmlFor="tracks-toggle" className={`cursor-pointer ${!config.global ? 'opacity-50' : ''}`}>Tracks</Label>
                </div>
            </div>
        </div>
      </div>

      {!config.global && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md flex items-center gap-2">
            <WarningCircle size={20} />
            <span>O sistema de tags está completamente desativado.</span>
        </div>
      )}

      <div className="flex justify-end">
         <Button onClick={openCreate} disabled={!config.global}><Plus className="mr-2" /> Nova Tag</Button>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${!config.global ? 'opacity-50 pointer-events-none' : ''}`}>
        {tags.map(tag => (
          <Card key={tag.id} className="group relative hover:border-primary/50 transition-colors">
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
    </div>
  );
}

// Phosphor icon helper
function WarningCircle(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" {...props}>
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-16-40a8,8,0,0,1,16,0v8a8,8,0,0,1-16,0Zm0-88v64a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0Z"></path>
        </svg>
    )
}
