import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { User, UserRole } from '@/lib/types';
import { UserCircle, Building2, Wallet, FileText } from 'lucide-react';

type UserStatus = 'active' | 'inactive' | 'pending';

export interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  title: string;
  department: string;
  clientEntity: string;
  avatar: string;
  cellphone: string;
  cpf: string;
  rg: string;
  address: string;
  pixKeyPJ: string;
  pixKeyPF: string;
  docIdentityUrl: string;
  docSocialContractUrl: string;
  docServiceAgreementUrl: string;
}

interface UserFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: UserFormData;
  setFormData: (data: UserFormData) => void;
  editingUser: User | null;
  onSave: () => void;
  isSaving: boolean;
  roles: Array<{ code: string; label: string }>;
}

export function UserFormDrawer({
  open,
  onOpenChange,
  formData,
  setFormData,
  editingUser,
  onSave,
  isSaving,
  roles,
}: UserFormDrawerProps) {
  const updateField = (field: keyof UserFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>
            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
          </SheetTitle>
          <SheetDescription>
            {editingUser
              ? 'Atualize as informações do usuário abaixo.'
              : 'Preencha os dados para criar um novo usuário.'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
          <div className="space-y-6 py-4">
            {/* Dados de Acesso e Perfil */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                <UserCircle className="h-5 w-5" />
                Dados de Acesso e Perfil
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    disabled={!!editingUser}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) => updateField('role', v)}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.code} value={role.code}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => updateField('status', v)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Cargo</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => updateField('department', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="clientEntity">Empresa / Entidade</Label>
                  <Input
                    id="clientEntity"
                    value={formData.clientEntity}
                    onChange={(e) => updateField('clientEntity', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="avatar">URL da Foto (Avatar)</Label>
                  <Input
                    id="avatar"
                    value={formData.avatar}
                    onChange={(e) => updateField('avatar', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            {/* Dados Pessoais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                <Building2 className="h-5 w-5" />
                Dados Pessoais
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => updateField('cpf', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    value={formData.rg}
                    onChange={(e) => updateField('rg', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cellphone">Celular</Label>
                  <Input
                    id="cellphone"
                    value={formData.cellphone}
                    onChange={(e) => updateField('cellphone', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="address">Endereço Completo</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Dados Financeiros */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                <Wallet className="h-5 w-5" />
                Dados Financeiros
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pixKeyPJ">Chave PIX (PJ)</Label>
                  <Input
                    id="pixKeyPJ"
                    value={formData.pixKeyPJ}
                    onChange={(e) => updateField('pixKeyPJ', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pixKeyPF">Chave PIX (PF)</Label>
                  <Input
                    id="pixKeyPF"
                    value={formData.pixKeyPF}
                    onChange={(e) => updateField('pixKeyPF', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* URLs de Documentos */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                <FileText className="h-5 w-5" />
                URLs de Documentos
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="docIdentityUrl">Link do Documento de Identidade</Label>
                  <Input
                    id="docIdentityUrl"
                    value={formData.docIdentityUrl}
                    onChange={(e) => updateField('docIdentityUrl', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docSocialContractUrl">Link do Contrato Social</Label>
                  <Input
                    id="docSocialContractUrl"
                    value={formData.docSocialContractUrl}
                    onChange={(e) => updateField('docSocialContractUrl', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docServiceAgreementUrl">
                    Link do Contrato de Prestação de Serviços
                  </Label>
                  <Input
                    id="docServiceAgreementUrl"
                    value={formData.docServiceAgreementUrl}
                    onChange={(e) => updateField('docServiceAgreementUrl', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
