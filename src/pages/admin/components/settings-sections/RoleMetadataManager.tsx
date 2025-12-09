import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSystemMetadata } from '@/hooks/useSystemMetadata';
import { settingsService } from '@/services/settingsService';
import { UserRoleMetadata } from '@/types/metadata';
import { Plus, PencilSimple, Trash, ShieldStar } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface RoleFormData {
  code: string;
  label: string;
  description: string;
  badgeVariant: string;
  sortOrder: number;
  permissions: string;
}

const BADGE_VARIANTS = [
  { value: 'default', label: 'Default' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'outline', label: 'Outline' },
  { value: 'destructive', label: 'Destructive' }
];

export function RoleMetadataManager() {
  const { userRoleMetadata, refreshMetadata } = useSystemMetadata();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRoleMetadata | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    code: '',
    label: '',
    description: '',
    badgeVariant: 'default',
    sortOrder: 0,
    permissions: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (role: UserRoleMetadata) => {
    setEditingRole(role);
    setFormData({
      code: role.code,
      label: role.label,
      description: role.description || '',
      badgeVariant: role.badgeVariant || 'default',
      sortOrder: role.sortOrder,
      permissions: (role.permissions || []).join(', ')
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({
      code: '',
      label: '',
      description: '',
      badgeVariant: 'default',
      sortOrder: userRoleMetadata.length + 1,
      permissions: ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.label.trim()) {
      toast.error('O campo Label é obrigatório');
      return;
    }

    if (!editingRole && !formData.code.trim()) {
      toast.error('O campo Code é obrigatório');
      return;
    }

    if (!BADGE_VARIANTS.find(v => v.value === formData.badgeVariant)) {
      toast.error('Badge variant inválido');
      return;
    }

    setIsSaving(true);
    try {
      // Convert permissions string to array
      const permissionsArray = formData.permissions
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const payload = {
        code: formData.code,
        label: formData.label,
        description: formData.description,
        badgeVariant: formData.badgeVariant,
        sortOrder: formData.sortOrder,
        permissions: permissionsArray,
        isActive: true
      };

      if (editingRole) {
        // Update existing role
        const result = await settingsService.update<UserRoleMetadata>(
          'user_role_metadata',
          editingRole.id,
          payload
        );

        if (result.error) {
          toast.error(`Erro ao atualizar role: ${result.error.message}`);
          return;
        }

        toast.success('Role atualizada com sucesso!');
      } else {
        // Create new role
        const result = await settingsService.create<UserRoleMetadata>(
          'user_role_metadata',
          payload
        );

        if (result.error) {
          toast.error(`Erro ao criar role: ${result.error.message}`);
          return;
        }

        toast.success('Role criada com sucesso!');
      }

      // Refresh metadata and close dialog
      await refreshMetadata();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Erro ao salvar role');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (roleId: string) => {
    setDeletingRoleId(roleId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRoleId) return;

    setIsDeleting(true);
    try {
      const result = await settingsService.remove('user_role_metadata', deletingRoleId);

      if (result.error) {
        toast.error(`Erro ao excluir role: ${result.error.message}`);
        return;
      }

      toast.success('Role excluída com sucesso!');
      await refreshMetadata();
      setIsDeleteDialogOpen(false);
      setDeletingRoleId(null);
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Erro ao excluir role');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <ShieldStar className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle>Metadados de Roles</CardTitle>
                <CardDescription>
                  Configure labels, badges e permissões para cada role de usuário
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Code</TableHead>
                  <TableHead className="w-[150px]">Label</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[120px]">Badge</TableHead>
                  <TableHead className="w-[100px]">Ordem</TableHead>
                  <TableHead className="w-[200px]">Permissões</TableHead>
                  <TableHead className="w-[120px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoleMetadata.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma role cadastrada
                    </TableCell>
                  </TableRow>
                ) : (
                  userRoleMetadata.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-mono text-sm">{role.code}</TableCell>
                      <TableCell className="font-medium">{role.label}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {role.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.badgeVariant as any || 'default'}>
                          {role.badgeVariant || 'default'}
                        </Badge>
                      </TableCell>
                      <TableCell>{role.sortOrder}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.length > 0 ? (
                            role.permissions.slice(0, 2).map((perm, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {perm}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                          {role.permissions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(role)}
                          >
                            <PencilSimple className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(role.id)}
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

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar Role' : 'Nova Role'}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Atualize as informações da role'
                : 'Crie uma nova role de usuário'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="ex: admin, analyst"
                  disabled={!!editingRole}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  {editingRole
                    ? 'Code não pode ser alterado'
                    : 'Identificador único da role'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="ex: Administrador"
                />
                <p className="text-xs text-muted-foreground">
                  Nome exibido na interface
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da role e suas responsabilidades"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="badgeVariant">Badge Variant</Label>
                <Select
                  value={formData.badgeVariant}
                  onValueChange={(value) =>
                    setFormData({ ...formData, badgeVariant: value })
                  }
                >
                  <SelectTrigger id="badgeVariant">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_VARIANTS.map((variant) => (
                      <SelectItem key={variant.value} value={variant.value}>
                        {variant.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Variante visual do badge
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Ordem de Exibição</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Ordem de listagem (menor = primeiro)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="permissions">Permissões</Label>
              <Textarea
                id="permissions"
                value={formData.permissions}
                onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                placeholder="manage_users, manage_settings, view_reports"
                rows={3}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Liste as permissões separadas por vírgula. Exemplo: manage_users, manage_settings
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta role? Esta ação não pode ser desfeita.
              <br />
              <br />
              <strong>Atenção:</strong> Certifique-se de que não existem usuários usando esta
              role antes de excluir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
