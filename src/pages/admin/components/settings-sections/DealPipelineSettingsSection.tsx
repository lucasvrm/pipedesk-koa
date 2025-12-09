import { useState } from 'react';
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
import { ChartLineUp, FlowArrow, Plus, PencilSimple, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { DealStatusMeta } from '@/types/metadata';

interface DealStatusFormData {
  code: string;
  label: string;
  color: string;
  description: string;
  sortOrder: number;
}

export function DealPipelineSettingsSection() {
  const { dealStatuses, stages, isLoading, refreshMetadata } = useSystemMetadata();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DealStatusMeta | null>(null);
  const [formData, setFormData] = useState<DealStatusFormData>({
    code: '',
    label: '',
    color: '',
    description: '',
    sortOrder: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      code: '',
      label: '',
      color: '',
      description: '',
      sortOrder: 0
    });
    setEditingItem(null);
  };

  const openDialog = (item?: DealStatusMeta) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        code: item.code,
        label: item.label,
        color: item.color || '',
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
        color: formData.color.trim() || undefined,
        description: formData.description.trim() || undefined,
        isActive: true,
        sortOrder: formData.sortOrder || 0
      };

      if (editingItem) {
        const { error } = await settingsService.update('deal_statuses', editingItem.id, payload);
        if (error) throw error;
        toast.success('Status atualizado com sucesso!');
      } else {
        const { error } = await settingsService.create('deal_statuses', payload);
        if (error) throw error;
        toast.success('Status criado com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
      refreshMetadata();
    } catch (error) {
      console.error('Error saving deal status:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${label}"?`)) return;

    try {
      const { error } = await settingsService.remove('deal_statuses', id);
      if (error) throw error;
      toast.success('Status excluído com sucesso!');
      refreshMetadata();
    } catch (error) {
      console.error('Error deleting deal status:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando configurações de deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Deal Statuses CRUD */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ChartLineUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle>Status de Deals</CardTitle>
                <CardDescription>
                  Status disponíveis para classificação e acompanhamento de deals
                </CardDescription>
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
                {dealStatuses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum status configurado.
                    </TableCell>
                  </TableRow>
                ) : (
                  dealStatuses.map((status) => (
                    <TableRow key={status.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {status.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{status.label}</TableCell>
                      <TableCell>
                        {status.color ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: status.color }}
                            />
                            <span className="text-xs text-muted-foreground font-mono">
                              {status.color}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {status.description || '-'}
                      </TableCell>
                      <TableCell>{status.sortOrder}</TableCell>
                      <TableCell>
                        <Badge variant={status.isActive ? 'default' : 'secondary'}>
                          {status.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDialog(status)}
                          >
                            <PencilSimple className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(status.id, status.label)}
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
      </Card>

      {/* Deal Status Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar' : 'Criar'} Status de Deal
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
                placeholder="Ex: active, cancelled"
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
                placeholder="Ex: Ativo, Cancelado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Cor (Opcional)</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Ex: #3b82f6, bg-blue-500"
              />
              <p className="text-xs text-muted-foreground">
                Pode ser uma cor hex (#3b82f6) ou classe Tailwind (bg-blue-500).
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

      {/* Pipeline Stages */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <FlowArrow className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle>Estágios de Pipeline</CardTitle>
              <CardDescription>
                Etapas do funil de vendas com suas probabilidades de conversão
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum estágio configurado
              </p>
            ) : (
              <div className="space-y-2">
                {stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color || '#94a3b8' }}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{stage.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Ordem: {stage.stageOrder} • Probabilidade: {stage.probability}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {stage.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Padrão
                        </Badge>
                      )}
                      <Badge variant={stage.active ? 'default' : 'secondary'}>
                        {stage.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
