import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Briefcase,
  CreditCard,
  FileText,
  Wallet,
} from 'lucide-react';
import { UserFormData, UserStatus } from '../UserManagementPage';

interface RoleMetadata {
  code: string;
  label: string;
}

interface UserFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  editingUser: User | null;
  onSave: () => void;
  isSaving: boolean;
  roles: RoleMetadata[];
}

interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function FormSection({ title, icon, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
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
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</SheetTitle>
          <SheetDescription>
            {editingUser
              ? 'Atualize as informações do usuário'
              : 'Preencha os dados para criar um novo usuário'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Dados de Acesso */}
          <FormSection title="Dados de Acesso" icon={<UserIcon className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Nome do usuário"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="email@exemplo.com"
                  disabled={!!editingUser}
                />
              </div>

              <div className="space-y-2">
                <Label>Função</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => updateField('role', v)}
                >
                  <SelectTrigger>
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
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => updateField('status', v as UserStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FormSection>

          {/* Informações Profissionais */}
          <FormSection title="Informações Profissionais" icon={<Briefcase className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo / Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Ex: Gerente Comercial"
                />
              </div>

              <div className="space-y-2">
                <Label>Departamento</Label>
                <Input
                  value={formData.department}
                  onChange={(e) => updateField('department', e.target.value)}
                  placeholder="Ex: Vendas"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Empresa / Entidade</Label>
                <Input
                  value={formData.clientEntity}
                  onChange={(e) => updateField('clientEntity', e.target.value)}
                  placeholder="Nome da empresa"
                />
              </div>
            </div>
          </FormSection>

          {/* Dados Pessoais */}
          <FormSection title="Dados Pessoais" icon={<CreditCard className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => updateField('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <Label>RG</Label>
                <Input
                  value={formData.rg}
                  onChange={(e) => updateField('rg', e.target.value)}
                  placeholder="00.000.000-0"
                />
              </div>

              <div className="space-y-2">
                <Label>Celular</Label>
                <Input
                  value={formData.cellphone}
                  onChange={(e) => updateField('cellphone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label>URL do Avatar</Label>
                <Input
                  value={formData.avatar}
                  onChange={(e) => updateField('avatar', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Endereço completo"
                />
              </div>
            </div>
          </FormSection>

          {/* Dados Financeiros */}
          <FormSection title="Dados Financeiros" icon={<Wallet className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Chave PIX (PF)</Label>
                <Input
                  value={formData.pixKeyPF}
                  onChange={(e) => updateField('pixKeyPF', e.target.value)}
                  placeholder="CPF, Email ou Telefone"
                />
              </div>

              <div className="space-y-2">
                <Label>Chave PIX (PJ)</Label>
                <Input
                  value={formData.pixKeyPJ}
                  onChange={(e) => updateField('pixKeyPJ', e.target.value)}
                  placeholder="CNPJ ou Aleatória"
                />
              </div>
            </div>
          </FormSection>

          {/* Documentos */}
          <FormSection title="URLs de Documentos" icon={<FileText className="h-4 w-4" />}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Documento de Identidade</Label>
                <Input
                  value={formData.docIdentityUrl}
                  onChange={(e) => updateField('docIdentityUrl', e.target.value)}
                  placeholder="URL do documento"
                />
              </div>

              <div className="space-y-2">
                <Label>Contrato Social</Label>
                <Input
                  value={formData.docSocialContractUrl}
                  onChange={(e) => updateField('docSocialContractUrl', e.target.value)}
                  placeholder="URL do documento"
                />
              </div>

              <div className="space-y-2">
                <Label>Contrato de Serviço</Label>
                <Input
                  value={formData.docServiceAgreementUrl}
                  onChange={(e) => updateField('docServiceAgreementUrl', e.target.value)}
                  placeholder="URL do documento"
                />
              </div>
            </div>
          </FormSection>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
