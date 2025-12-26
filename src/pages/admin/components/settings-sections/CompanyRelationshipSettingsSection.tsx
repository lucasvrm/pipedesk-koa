import { useEffect, useState } from 'react';
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
import { Building2, Handshake, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CompanyTypeMeta, RelationshipLevelMeta } from '@/types/metadata';
import { SettingsSidebarLayout, SettingsSectionHeader } from './';
import type { SidebarNavItem } from './SettingsSidebarNav';
import { useSearchParams } from 'react-router-dom';

type SectionId = 'types' | 'levels';
type SettingType = 'company_types' | 'relationship_levels';

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
}

const NAV_ITEMS: Omit<SidebarNavItem, 'count'>[] = [
  { id: 'types', label: 'Tipos de Empresa', icon: Building2 },
  { id: 'levels', label: 'Níveis de Relacionamento', icon: Handshake },
];

// ============================================================================
// Generic Table
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
    company_types: 'Tipo de Empresa',
    relationship_levels: 'Nível de Relacionamento'
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
    if (!formData.code.trim() || formData.code.includes(' ')) { toast.error('Código inválido'); return; }
    if (!formData.label.trim()) { toast.error('Label obrigatório'); return; }

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
      toast.error(error instanceof Error ? error.message : 'Erro');
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
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum registro.</TableCell></TableRow>
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
          <DialogHeader><DialogTitle>{editingItem ? 'Editar' : 'Criar'} {dialogTitles[type]}</DialogTitle></DialogHeader>
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
// Main Component
// ============================================================================

export function CompanyRelationshipSettingsSection() {
  const { companyTypes, relationshipLevels, isLoading, refreshMetadata } = useSystemMetadata();
  const [searchParams, setSearchParams] = useSearchParams();
  const subSection = searchParams.get('sub');
  const activeSection: SectionId = subSection === 'levels' ? 'levels' : 'types';

  useEffect(() => {
    if (subSection !== 'types' && subSection !== 'levels') {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set('sub', 'types');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams, subSection]);

  const handleSectionChange = (nextSection: SectionId) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('category', 'crm');
    nextParams.set('section', 'companies');
    nextParams.set('sub', nextSection);
    setSearchParams(nextParams, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const navItems: SidebarNavItem[] = NAV_ITEMS.map((item) => ({
    ...item,
    count: item.id === 'types' ? companyTypes.length : item.id === 'levels' ? relationshipLevels.length : undefined
  }));

  return (
    <SettingsSidebarLayout items={navItems} activeId={activeSection} onSelect={(id) => handleSectionChange(id as SectionId)}>
      {activeSection === 'types' && (
        <GenericTable
          type="company_types"
          title="Tipos de Empresa"
          description="Categorização de empresas por tipo ou segmento"
          data={companyTypes as MetadataItem[]}
          onRefresh={refreshMetadata}
        />
      )}
      {activeSection === 'levels' && (
        <GenericTable
          type="relationship_levels"
          title="Níveis de Relacionamento"
          description="Classificação do grau de relacionamento com parceiros"
          data={relationshipLevels as MetadataItem[]}
          onRefresh={refreshMetadata}
        />
      )}
    </SettingsSidebarLayout>
  );
}
