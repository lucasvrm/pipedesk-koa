import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSystemMetadata } from '@/hooks/useSystemMetadata';
import { settingsService } from '@/services/settingsService';
import { TrendingUp, GitBranch, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DealStatusMeta } from '@/types/metadata';
import { SettingsSidebarLayout, SettingsSectionHeader } from './';
import type { SidebarNavItem } from './SettingsSidebarNav';

type SectionId = 'statuses' | 'stages';

interface FormData {
  code: string;
  label: string;
  color: string;
  description: string;
  sortOrder: number;
}

const NAV_ITEMS: Omit<SidebarNavItem, 'count'>[] = [
  { id: 'statuses', label: 'Status de Deals', icon: TrendingUp },
  { id: 'stages', label: 'Estágios do Pipeline', icon: GitBranch },
];

// ============================================================================
// Deal Status Table
// ============================================================================

function DealStatusTable({ data, onRefresh }: { data: DealStatusMeta[]; onRefresh: () => void }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DealStatusMeta | null>(null);
  const [formData, setFormData] = useState<FormData>({ code: '', label: '', color: '', description: '', sortOrder: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openDialog = (item?: DealStatusMeta) => {
    if (item) {
      setEditingItem(item);
      setFormData({ code: item.code, label: item.label, color: item.color || '', description: item.description || '', sortOrder: item.sortOrder });
    } else {
      setEditingItem(null);
      setFormData({ code: '', label: '', color: '', description: '', sortOrder: 0 });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || formData.code.includes(' ')) { toast.error('Código inválido'); return; }
    if (!formData.label.trim()) { toast.error('Label obrigatório'); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim(),
        label: formData.label.trim(),
        color: formData.color.trim() || undefined,
        description: formData.description.trim() || undefined,
        isActive: true,
        sortOrder: formData.sortOrder || 0
      };

      if (editingItem) {
        const { error } = await settingsService.update('deal_statuses', editingItem.id, payload);
        if (error) throw error;
        toast.success('Atualizado!');
      } else {
        const { error } = await settingsService.create('deal_statuses', payload);
        if (error) throw error;
        toast.success('Criado!');
      }
      setIsDialogOpen(false);
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Excluir "${label}"?`)) return;
    try {
      const { error } = await settingsService.remove('deal_statuses', id);
      if (error) throw error;
      toast.success('Excluído!');
      onRefresh();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <>
      <SettingsSectionHeader title="Status de Deals" description="Status para classificação e acompanhamento de deals" onAdd={() => openDialog()} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">Código</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="w-[100px]">Cor</TableHead>
              <TableHead className="hidden md:table-cell">Descrição</TableHead>
              <TableHead className="w-[70px]">Ordem</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum status.</TableCell></TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{item.code}</Badge></TableCell>
                  <TableCell className="font-medium">{item.label}</TableCell>
                  <TableCell>
                    {item.color ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-muted-foreground font-mono">{item.color}</span>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell truncate max-w-[150px]">{item.description || '-'}</TableCell>
                  <TableCell>{item.sortOrder}</TableCell>
                  <TableCell><Badge variant={item.isActive ? 'default' : 'secondary'} className="text-xs">{item.isActive ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id, item.label)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem ? 'Editar' : 'Criar'} Status de Deal</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} disabled={!!editingItem} />
              </div>
              <div className="space-y-2">
                <Label>Label *</Label>
                <Input value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor (opcional)</Label>
              <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} placeholder="#3b82f6" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input type="number" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} className="w-24" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// Pipeline Stages (Read-only list)
// ============================================================================

function PipelineStagesSection({ stages }: { stages: any[] }) {
  return (
    <>
      <SettingsSectionHeader
        title="Estágios do Pipeline"
        description="Etapas do funil de vendas com probabilidades de conversão"
      />

      <div className="space-y-2">
        {stages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum estágio configurado.</p>
        ) : (
          stages.map((stage) => (
            <div key={stage.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color || '#94a3b8' }} />
                <div className="flex-1">
                  <p className="font-medium">{stage.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Ordem: {stage.stageOrder} • Probabilidade: {stage.probability}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {stage.isDefault && <Badge variant="secondary" className="text-xs">Padrão</Badge>}
                <Badge variant={stage.active ? 'default' : 'secondary'}>{stage.active ? 'Ativo' : 'Inativo'}</Badge>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Para gerenciar estágios com SLA e regras de transição, acesse Pipeline Settings.
      </p>
    </>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DealPipelineSettingsSection() {
  const { dealStatuses, stages, isLoading, refreshMetadata } = useSystemMetadata();
  const [activeSection, setActiveSection] = useState<SectionId>('statuses');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const navItems: SidebarNavItem[] = NAV_ITEMS.map((item) => ({
    ...item,
    count: item.id === 'statuses' ? dealStatuses.length : item.id === 'stages' ? stages.length : undefined
  }));

  return (
    <SettingsSidebarLayout items={navItems} activeId={activeSection} onSelect={(id) => setActiveSection(id as SectionId)}>
      {activeSection === 'statuses' && <DealStatusTable data={dealStatuses} onRefresh={refreshMetadata} />}
      {activeSection === 'stages' && <PipelineStagesSection stages={stages} />}
    </SettingsSidebarLayout>
  );
}
