import { useState, useMemo } from 'react';
import { useRoles, usePermissions, useCreateRole, useUpdateRole, useDeleteRole } from '@/services/roleService';
import { Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PencilSimple, Trash, Plus, ShieldCheck, MagnifyingGlass } from '@phosphor-icons/react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

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

  // Filtros de Permissão
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterFunction, setFilterFunction] = useState<string>('all');

  // Lógica de Filtros Dinâmicos
  const { modules, functions, filteredPermissions } = useMemo(() => {
    if (!allPermissions) return { modules: [], functions: [], filteredPermissions: [] };

    const mods = new Set<string>();
    const funcs = new Set<string>();

    allPermissions.forEach(p => {
      const parts = p.code.split('.');
      if (parts.length > 0) mods.add(parts[0]);
      if (parts.length > 1) funcs.add(parts[1]);
    });

    const sortedMods = Array.from(mods).sort();
    const sortedFuncs = Array.from(funcs).sort();

    const filtered = allPermissions.filter(p => {
      const parts = p.code.split('.');
      const pModule = parts[0];
      const pFunction = parts[1] || '';

      const matchSearch =
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchModule = filterModule === 'all' || pModule === filterModule;
      const matchFunction = filterFunction === 'all' || pFunction === filterFunction;

      return matchSearch && matchModule && matchFunction;
    }).sort((a, b) => a.code.localeCompare(b.code));

    return {
      modules: sortedMods,
      functions: sortedFuncs,
      filteredPermissions: filtered
    };
  }, [allPermissions, searchTerm, filterModule, filterFunction]);

  const openCreate = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDesc('');
    setSelectedPerms([]);
    resetFilters();
    setIsDialogOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description || '');
    setSelectedPerms(role.permissions?.map(p => p.id) || []);
    resetFilters();
    setIsDialogOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterModule('all');
    setFilterFunction('all');
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
    } catch {
      toast.error("Erro ao salvar função.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza? Usuários com esta função perderão o acesso.")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Função excluída.");
    } catch {
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

            {/* Filtros de Permissão */}
            <div className="grid grid-cols-4 gap-4 items-end">
              <div className="col-span-2 space-y-2">
                <Label>Buscar Permissão</Label>
                <div className="relative">
                  <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar por nome ou código..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Módulo</Label>
                <Select value={filterModule} onValueChange={setFilterModule}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {modules.map(mod => (
                      <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Função</Label>
                <Select value={filterFunction} onValueChange={setFilterFunction}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {functions.map(func => (
                      <SelectItem key={func} value={func}>{func}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-3">
                 <Label>Permissões do Sistema</Label>
                 <span className="text-xs text-muted-foreground">
                   Mostrando {filteredPermissions.length} de {allPermissions?.length || 0}
                 </span>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredPermissions.length === 0 ? (
                    <div className="col-span-2 text-center text-sm text-muted-foreground py-8">
                      Nenhuma permissão encontrada com os filtros atuais.
                    </div>
                  ) : (
                    filteredPermissions.map(perm => (
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
                    ))
                  )}
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
