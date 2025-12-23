import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSystemMetadata } from '@/hooks/useSystemMetadata';
import { settingsService } from '@/services/settingsService';
import { TrendingUp, Users, UserCircle, ListTodo, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { LeadStatusMeta } from '@/types/metadata';
import { LeadTaskTemplatesContent } from './LeadTaskTemplatesSection';
import { SettingsSidebarLayout, SettingsSectionHeader } from './';
import type { SidebarNavItem } from './SettingsSidebarNav';

type SectionId = 'statuses' | 'origins' | 'roles' | 'tasks';
type SettingType = 'lead_statuses' | 'lead_origins' | 'lead_member_roles';

interface MetadataItem {
  id: string;
  code: string;
  label: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

interface FormData {
  code: string;
  label: string;
  description: string;
  sortOrder: number;
  color?: string;
}

const NAV_ITEMS: Omit<SidebarNavItem, 'count'>[] = [
  { id: 'statuses', label: 'Status', icon: TrendingUp },
  { id: 'origins', label: 'Origens', icon: Users },
  { id: 'roles', label: 'Papéis de Membros', icon: UserCircle },
  { id: 'tasks', label: 'Templates de Tarefas', icon: ListTodo },
];

// ============================================================================
// Generic Table Component
// ============================================================================

function GenericTable({
  type,
  title,
  description,
  data,
  onRefresh
}: {
  type: SettingType;
  title: string;
  description: string;
  data: MetadataItem[];
  onRefresh: () => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MetadataItem | null>(null);
  const [formData, setFormData] = useState<FormData>({ code: '', label: '', description: '', sortOrder: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogTitles: Record<SettingType, string> = {
    lead_statuses: 'Status de Lead',
    lead_origins: 'Origem de Lead',
    lead_member_roles: 'Papel de Membro'
  };

  const openDialog = (item?: MetadataItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({ code: item.code, label: item.label, description: item.description || '', sortOrder: item.sortOrder });
    } else {
      setEditingItem(null);
      setFormData({ code: '', label: '', description: '', sortOrder: 0 });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || formData.code.includes(' ')) {
      toast.error('Código inválido');
      return;
    }
    if (!formData.label.trim()) {
      toast.error('Label é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim(),
        label: formData.label.trim(),
        description: formData.description.trim() || undefined,
        isActive: true,
        sortOrder: formData.sortOrder || 0
      };

      if (editingItem) {
        const { error } = await settingsService.update(type, editingItem.id, payload);
        if (error) throw error;
        toast.success('Atualizado!');
      } else {
        const { error } = await settingsService.create(type, payload);
        if (error) throw error;
        toast.success('Criado!');
      }
      setIsDialogOpen(false);
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Excluir "${label}"?`)) return;
    try {
      const { error } = await settingsService.remove(type, id);
      if (error) throw error;
      toast.success('Excluído!');
      onRefresh();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <>
      <SettingsSectionHeader title={title} description={description} onAdd={() => openDialog()} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Código</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="hidden md:table-cell">Descrição</TableHead>
              <TableHead className="w-[70px]">Ordem</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum registro.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{item.code}</Badge></TableCell>
                  <TableCell className="font-medium">{item.label}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell truncate max-w-[200px]">{item.description || '-'}</TableCell>
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
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar' : 'Criar'} {dialogTitles[type]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} disabled={!!editingItem} />
            </div>
            <div className="space-y-2">
              <Label>Label *</Label>
              <Input value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} />
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
// Lead Status Table (with color)
// ============================================================================

function LeadStatusTable({ data, onRefresh }: { data: LeadStatusMeta[]; onRefresh: () => void }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LeadStatusMeta | null>(null);
  const [formData, setFormData] = useState<FormData>({ code: '', label: '', description: '', sortOrder: 0, color: '#6b7280' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openDialog = (item?: LeadStatusMeta) => {
    if (item) {
      setEditingItem(item);
      setFormData({ code: item.code, label: item.label, description: item.description || '', sortOrder: item.sortOrder, color: item.color || '#6b7280' });
    } else {
      setEditingItem(null);
      setFormData({ code: '', label: '', description: '', sortOrder: 0, color: '#6b7280' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || formData.code.includes(' ')) { toast.error('Código inválido'); return; }
    if (!formData.label.trim()) { toast.error('Label obrigatório'); return; }
    if (!formData.color || !/^#[0-9A-Fa-f]{6}$/.test(formData.color)) { toast.error('Cor inválida'); return; }

    setIsSubmitting(true);
    try {
      const payload = { code: formData.code.trim(), label: formData.label.trim(), description: formData.description.trim() || undefined, isActive: true, sortOrder: formData.sortOrder || 0, color: formData.color };
      if (editingItem) {
        const { error } = await settingsService.update('lead_statuses', editingItem.id, payload);
        if (error) throw error;
        toast.success('Atualizado!');
      } else {
        const { error } = await settingsService.create('lead_statuses', payload);
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
      const { error } = await settingsService.remove('lead_statuses', id);
      if (error) throw error;
      toast.success('Excluído!');
      onRefresh();
    } catch (error) {
      toast.error('Erro');
    }
  };

  return (
    <>
      <SettingsSectionHeader title="Status de Leads" description="Status do ciclo de vida dos leads" onAdd={() => openDialog()} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Código</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="w-[90px]">Cor</TableHead>
              <TableHead className="hidden lg:table-cell">Descrição</TableHead>
              <TableHead className="w-[60px]">Ordem</TableHead>
              <TableHead className="w-[70px]">Status</TableHead>
              <TableHead className="w-[90px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum registro.</TableCell></TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{item.code}</Badge></TableCell>
                  <TableCell className="font-medium">{item.label}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded border" style={{ backgroundColor: item.color || '#6b7280' }} />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell truncate max-w-[120px]">{item.description || '-'}</TableCell>
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
          <DialogHeader><DialogTitle>{editingItem ? 'Editar' : 'Criar'} Status de Lead</DialogTitle></DialogHeader>
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
              <Label>Cor *</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="font-mono flex-1" />
              </div>
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
// Main Component
// ============================================================================

export function LeadSettingsSection() {
  const { leadStatuses, leadOrigins, leadMemberRoles, isLoading, refreshMetadata } = useSystemMetadata();
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
    count: item.id === 'statuses' ? leadStatuses.length
         : item.id === 'origins' ? leadOrigins.length
         : item.id === 'roles' ? leadMemberRoles.length
         : undefined
  }));

  const renderContent = () => {
    switch (activeSection) {
      case 'statuses':
        return <LeadStatusTable data={leadStatuses} onRefresh={refreshMetadata} />;
      case 'origins':
        return <GenericTable type="lead_origins" title="Origens de Leads" description="Canais de captação de novos leads" data={leadOrigins as MetadataItem[]} onRefresh={refreshMetadata} />;
      case 'roles':
        return <GenericTable type="lead_member_roles" title="Papéis de Membros" description="Funções dos membros associados aos leads" data={leadMemberRoles as MetadataItem[]} onRefresh={refreshMetadata} />;
      case 'tasks':
        return <LeadTaskTemplatesContent />;
      default:
        return null;
    }
  };

  return (
    <SettingsSidebarLayout items={navItems} activeId={activeSection} onSelect={(id) => setActiveSection(id as SectionId)}>
      {renderContent()}
    </SettingsSidebarLayout>
  );
}
