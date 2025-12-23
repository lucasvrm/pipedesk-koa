import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Users, TrendingUp, UserCircle, Plus, PencilIcon, Trash } from 'lucide-react';
import { toast } from 'sonner';
import type { LeadStatusMeta, LeadOriginMeta, LeadMemberRoleMeta } from '@/types/metadata';
import { LeadTaskTemplatesSection } from './LeadTaskTemplatesSection';

type SettingType = 'lead_statuses' | 'lead_origins' | 'lead_member_roles';

interface MetadataItem {
  id: string;
  code: string;
  label: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface SettingFormData {
  code: string;
  label: string;
  description: string;
  sortOrder: number;
  color?: string;
}

interface SettingsTableProps {
  type: SettingType;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBgColor: string;
  data: MetadataItem[];
  onRefresh: () => void;
}

// Helper function to get proper singular titles for dialog
function getDialogTitle(type: SettingType): string {
  const titles: Record<SettingType, string> = {
    lead_statuses: 'Status de Lead',
    lead_origins: 'Origem de Lead',
    lead_member_roles: 'Papel de Membro do Lead'
  };
  return titles[type];
}

function SettingsTable({ type, title, description, icon, iconBgColor, data, onRefresh }: SettingsTableProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MetadataItem | null>(null);
  const [formData, setFormData] = useState<SettingFormData>({
    code: '',
    label: '',
    description: '',
    sortOrder: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      code: '',
      label: '',
      description: '',
      sortOrder: 0
    });
    setEditingItem(null);
  };

  const openDialog = (item?: MetadataItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        code: item.code,
        label: item.label,
        description: item.description || '',
        sortOrder: item.sortOrder
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Validations
    if (!formData.code.trim()) {
      toast.error('Código é obrigatório');
      return;
    }

    if (formData.code.includes(' ')) {
      toast.error('Código não pode conter espaços');
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
        toast.success('Atualizado com sucesso!');
      } else {
        const { error } = await settingsService.create(type, payload);
        if (error) throw error;
        toast.success('Criado com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${label}"?`)) return;

    try {
      const { error } = await settingsService.remove(type, id);
      if (error) throw error;
      toast.success('Excluído com sucesso!');
      onRefresh();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${iconBgColor}`}>
              {icon}
            </div>
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Novo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Código</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[100px]">Ordem</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[120px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {item.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.description || '-'}
                    </TableCell>
                    <TableCell>{item.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'}>
                        {item.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDialog(item)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(item.id, item.label)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar' : 'Criar'} {getDialogTitle(type)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Código <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: novo, em_andamento"
                disabled={editingItem !== null}
              />
              <p className="text-xs text-muted-foreground">
                Código único, sem espaços. Não pode ser alterado após criação.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">
                Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Ex: Novo, Em Andamento"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Ordem de Exibição</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ 
                    ...formData, 
                    sortOrder: value === '' ? 0 : parseInt(value, 10) || 0 
                  });
                }}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Números menores aparecem primeiro na listagem.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Specialized component for Lead Statuses with color support
function LeadStatusSettingsTable({ data, onRefresh }: { data: LeadStatusMeta[]; onRefresh: () => void }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LeadStatusMeta | null>(null);
  const [formData, setFormData] = useState<SettingFormData>({
    code: '',
    label: '',
    description: '',
    sortOrder: 0,
    color: '#6b7280'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      code: '',
      label: '',
      description: '',
      sortOrder: 0,
      color: '#6b7280'
    });
    setEditingItem(null);
  };

  const openDialog = (item?: LeadStatusMeta) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        code: item.code,
        label: item.label,
        description: item.description || '',
        sortOrder: item.sortOrder,
        color: item.color || '#6b7280'
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Validations
    if (!formData.code.trim()) {
      toast.error('Código é obrigatório');
      return;
    }

    if (formData.code.includes(' ')) {
      toast.error('Código não pode conter espaços');
      return;
    }

    if (!formData.label.trim()) {
      toast.error('Label é obrigatório');
      return;
    }

    if (!formData.color?.trim()) {
      toast.error('Cor é obrigatória');
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      toast.error('Cor deve estar no formato hex (#RRGGBB)');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        code: formData.code.trim(),
        label: formData.label.trim(),
        description: formData.description.trim() || undefined,
        isActive: true,
        sortOrder: formData.sortOrder || 0,
        color: formData.color.trim()
      };

      if (editingItem) {
        const { error } = await settingsService.update('lead_statuses', editingItem.id, payload);
        if (error) throw error;
        toast.success('Atualizado com sucesso!');
      } else {
        const { error } = await settingsService.create('lead_statuses', payload);
        if (error) throw error;
        toast.success('Criado com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${label}"?`)) return;

    try {
      const { error } = await settingsService.remove('lead_statuses', id);
      if (error) throw error;
      toast.success('Excluído com sucesso!');
      onRefresh();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Status de Leads</CardTitle>
              <CardDescription>Status disponíveis para acompanhamento do ciclo de vida dos leads</CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Novo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Código</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="w-[120px]">Cor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[100px]">Ordem</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[120px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {item.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell>
                      {item.color ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border border-border"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs text-muted-foreground font-mono">
                            {item.color}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.description || '-'}
                    </TableCell>
                    <TableCell>{item.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'}>
                        {item.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDialog(item)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(item.id, item.label)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar' : 'Criar'} Status de Lead
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Código <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: new, contacted"
                disabled={editingItem !== null}
              />
              <p className="text-xs text-muted-foreground">
                Código único, sem espaços. Não pode ser alterado após criação.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">
                Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Ex: Novo, Contatado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">
                Cor <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="color-picker"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-10 h-10 rounded border border-input cursor-pointer"
                />
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3b82f6"
                  className="font-mono flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Cor em formato hexadecimal (ex: #3b82f6). Usada em badges e Kanban.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Ordem de Exibição</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ 
                    ...formData, 
                    sortOrder: value === '' ? 0 : parseInt(value, 10) || 0 
                  });
                }}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Números menores aparecem primeiro na listagem.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function LeadSettingsSection() {
  const { leadStatuses, leadOrigins, leadMemberRoles, isLoading, refreshMetadata } = useSystemMetadata();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando configurações de leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lead Statuses with color support */}
      <LeadStatusSettingsTable
        data={leadStatuses}
        onRefresh={refreshMetadata}
      />

      {/* Lead Origins */}
      <SettingsTable
        type="lead_origins"
        title="Origens de Leads"
        description="Canais e fontes de captação de novos leads"
        icon={<Users className="h-5 w-5 text-green-500" />}
        iconBgColor="bg-green-500/10"
        data={leadOrigins as MetadataItem[]}
        onRefresh={refreshMetadata}
      />

      {/* Lead Member Roles */}
      <SettingsTable
        type="lead_member_roles"
        title="Papéis de Membros do Lead"
        description="Funções e responsabilidades dos membros associados aos leads"
        icon={<UserCircle className="h-5 w-5 text-purple-500" />}
        iconBgColor="bg-purple-500/10"
        data={leadMemberRoles as MetadataItem[]}
        onRefresh={refreshMetadata}
      />

      {/* Lead Task Templates */}
      <LeadTaskTemplatesSection />
    </div>
  );
}
