import { useState } from 'react';
import { useRoles, usePermissions, useCreateRole, useUpdateRole, useDeleteRole } from '@/services/roleService';
import { Role, Permission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PencilSimple, Trash, Plus, ShieldCheck } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function RolesManager() {
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: allPermissions } = usePermissions();
  
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  // Estado do Formulário
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const openCreate = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDesc('');
    setSelectedPerms([]);
    setIsDialogOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description || '');
    setSelectedPerms(role.permissions?.map(p => p.id) || []);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!roleName) return toast.error("Nome é obrigatório");

    try {
      if (editingRole) {
        await updateMutation.mutateAsync({
          id: editingRole.id,
          name: roleName,
          description: roleDesc,
          permissions: selectedPerms
        });
        toast.success("Função atualizada!");
      } else {
        await createMutation.mutateAsync({
          name: roleName,
          description: roleDesc,
          permissions: selectedPerms
        });
        toast.success("Nova função criada!");
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar função.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza? Usuários com esta função perderão o acesso.")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Função excluída.");
    } catch (error) {
      toast.error("Erro ao excluir. Verifique se há usuários vinculados.");
    }
  };

  const togglePerm = (id: string) => {
    setSelectedPerms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  if (rolesLoading) return <div>Carregando funções...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Controle de Funções (Roles)</h3>
          <p className="text-sm text-muted-foreground">Defina quais permissões cada tipo de usuário possui.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2" /> Nova Função</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles?.map(role => (
          <Card key={role.id} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={role.isSystem ? "text-primary" : "text-muted-foreground"} size={20} />
                  <CardTitle className="capitalize">{role.name}</CardTitle>
                </div>
                {!role.isSystem && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(role)}>
                      <PencilSimple />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(role.id)}>
                      <Trash />
                    </Button>
                  </div>
                )}
                {role.isSystem && (
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(role)}>
                      <PencilSimple />
                   </Button>
                )}
              </div>
              <CardDescription>{role.description || "Sem descrição"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-2">Permissões ({role.permissions?.length || 0}):</div>
              <div className="flex flex-wrap gap-1">
                {role.permissions?.slice(0, 5).map(p => (
                  <Badge key={p.id} variant="secondary" className="text-[10px] px-1 py-0">{p.code}</Badge>
                ))}
                {(role.permissions?.length || 0) > 5 && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">+{role.permissions!.length - 5}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRole ? `Editar ${editingRole.name}` : 'Nova Função'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Função (ID)</Label>
                <Input 
                  value={roleName} 
                  onChange={e => setRoleName(e.target.value)} 
                  disabled={editingRole?.isSystem} // Não muda nome de sistema
                  placeholder="ex: gerente_comercial"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={roleDesc} onChange={e => setRoleDesc(e.target.value)} placeholder="Descrição curta..." />
              </div>
            </div>

            <div className="border rounded-md p-4">
              <Label className="mb-3 block">Permissões do Sistema</Label>
              <ScrollArea className="h-[300px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allPermissions?.map(perm => (
                    <div key={perm.id} className="flex items-start space-x-2 border p-2 rounded hover:bg-accent/50">
                      <Checkbox 
                        id={perm.id} 
                        checked={selectedPerms.includes(perm.id)}
                        onCheckedChange={() => togglePerm(perm.id)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={perm.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {perm.code}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {perm.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}