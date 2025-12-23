import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useSystemMetadata } from '@/hooks/useSystemMetadata';
import { getSystemSetting, updateSystemSetting } from '@/services/settingsService';
import { usePermissions } from '@/services/roleService';
import { Settings, ShieldCheck, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { RoleMetadataManager } from './RoleMetadataManager';
import RolesManager from '@/features/rbac/components/RolesManager';
import { SettingsSidebarLayout, SettingsSectionHeader } from './';
import type { SidebarNavItem } from './SettingsSidebarNav';

type SectionId = 'defaults' | 'roles' | 'permissions';

interface SystemSettingsSectionProps {
  activeTab?: SectionId;
  onTabChange?: (tab: SectionId) => void;
}

interface SystemSettingsFormData {
  default_deal_status_code: string;
  default_track_stage_code: string;
  default_track_probability: number;
  default_lead_origin_code: string;
  default_lead_member_role_code: string;
  synthetic_default_password: string;
  synthetic_default_role_code: string;
  synthetic_total_users: number;
  synthetic_batch_size: number;
  synthetic_email_domain: string;
  synthetic_name_prefix: string;
}

const NAV_ITEMS: Omit<SidebarNavItem, 'count'>[] = [
  { id: 'defaults', label: 'Defaults do Sistema', icon: Settings },
  { id: 'roles', label: 'Papéis de Usuários', icon: ShieldCheck },
  { id: 'permissions', label: 'Permissões (RBAC)', icon: Shield },
];

// ============================================================================
// Defaults Section
// ============================================================================

function DefaultsSection({
  formData,
  setFormData,
  onSave,
  isSaving,
  dealStatuses,
  stages,
  leadOrigins,
  leadMemberRoles,
  userRoleMetadata
}: {
  formData: SystemSettingsFormData;
  setFormData: (data: SystemSettingsFormData) => void;
  onSave: () => void;
  isSaving: boolean;
  dealStatuses: any[];
  stages: any[];
  leadOrigins: any[];
  leadMemberRoles: any[];
  userRoleMetadata: any[];
}) {
  return (
    <>
      <SettingsSectionHeader
        title="Defaults do Sistema"
        description="Configure valores padrão para criação de deals, leads e tracks"
      />

      {/* Business Defaults */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Defaults de Negócio</CardTitle>
          <CardDescription>Valores iniciais para novos registros</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status Padrão de Deal</Label>
            <Select value={formData.default_deal_status_code} onValueChange={(v) => setFormData({ ...formData, default_deal_status_code: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {dealStatuses.map((s) => <SelectItem key={s.id} value={s.code}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Etapa Padrão do Pipeline</Label>
            <Select value={formData.default_track_stage_code} onValueChange={(v) => setFormData({ ...formData, default_track_stage_code: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Probabilidade Padrão (%)</Label>
            <Input type="number" min="0" max="100" value={formData.default_track_probability} onChange={(e) => setFormData({ ...formData, default_track_probability: Number(e.target.value) })} />
          </div>

          <div className="space-y-2">
            <Label>Origem Padrão de Lead</Label>
            <Select value={formData.default_lead_origin_code} onValueChange={(v) => setFormData({ ...formData, default_lead_origin_code: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {leadOrigins.map((o) => <SelectItem key={o.id} value={o.code}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Papel Padrão de Membro</Label>
            <Select value={formData.default_lead_member_role_code} onValueChange={(v) => setFormData({ ...formData, default_lead_member_role_code: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {leadMemberRoles.map((r) => <SelectItem key={r.id} value={r.code}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Synthetic Users */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Usuários Sintéticos</CardTitle>
          <CardDescription>Parâmetros para geração de usuários de teste</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Senha Padrão</Label>
            <Input type="password" value={formData.synthetic_default_password} onChange={(e) => setFormData({ ...formData, synthetic_default_password: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Role Padrão</Label>
            <Select value={formData.synthetic_default_role_code} onValueChange={(v) => setFormData({ ...formData, synthetic_default_role_code: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {userRoleMetadata.map((r) => <SelectItem key={r.id} value={r.code}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Total de Usuários</Label>
            <Input type="number" min="0" value={formData.synthetic_total_users} onChange={(e) => setFormData({ ...formData, synthetic_total_users: Number(e.target.value) })} />
          </div>

          <div className="space-y-2">
            <Label>Tamanho do Lote</Label>
            <Input type="number" min="1" value={formData.synthetic_batch_size} onChange={(e) => setFormData({ ...formData, synthetic_batch_size: Number(e.target.value) })} />
          </div>

          <div className="space-y-2">
            <Label>Domínio de E-mail</Label>
            <Input value={formData.synthetic_email_domain} onChange={(e) => setFormData({ ...formData, synthetic_email_domain: e.target.value })} placeholder="@example.com" />
          </div>

          <div className="space-y-2">
            <Label>Prefixo de Nome</Label>
            <Input value={formData.synthetic_name_prefix} onChange={(e) => setFormData({ ...formData, synthetic_name_prefix: e.target.value })} placeholder="Synth User" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={isSaving} size="lg">
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SystemSettingsSection({ activeTab, onTabChange }: SystemSettingsSectionProps) {
  const {
    dealStatuses,
    stages,
    leadOrigins,
    leadMemberRoles,
    userRoleMetadata,
    isLoading: metadataLoading
  } = useSystemMetadata();

  const { data: allPermissions, isLoading: permissionsLoading } = usePermissions();

  const [formData, setFormData] = useState<SystemSettingsFormData>({
    default_deal_status_code: '',
    default_track_stage_code: '',
    default_track_probability: 0,
    default_lead_origin_code: '',
    default_lead_member_role_code: '',
    synthetic_default_password: '',
    synthetic_default_role_code: '',
    synthetic_total_users: 0,
    synthetic_batch_size: 10,
    synthetic_email_domain: '@example.com',
    synthetic_name_prefix: 'Synth User '
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [internalSection, setInternalSection] = useState<SectionId>('defaults');

  const currentSection = useMemo<SectionId>(() => activeTab ?? internalSection, [activeTab, internalSection]);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab) setInternalSection(activeTab);
  }, [activeTab]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const keys = [
        'default_deal_status_code', 'default_track_stage_code', 'default_track_probability',
        'default_lead_origin_code', 'default_lead_member_role_code',
        'synthetic_default_password', 'synthetic_default_role_code', 'synthetic_total_users',
        'synthetic_batch_size', 'synthetic_email_domain', 'synthetic_name_prefix'
      ];
      const results = await Promise.all(keys.map(k => getSystemSetting(k)));
      const newData = { ...formData };
      keys.forEach((key, i) => {
        const val = results[i].data;
        if (val && typeof val === 'object') {
          if ('code' in val) (newData as any)[key] = val.code;
          else if ('id' in val) (newData as any)[key] = val.id;
          else if ('value' in val) (newData as any)[key] = val.value;
        } else if (val !== null) {
          (newData as any)[key] = val;
        }
      });
      setFormData(newData);
    } catch (e) {
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        updateSystemSetting('default_deal_status_code', { code: formData.default_deal_status_code }, 'Status padrão de deal'),
        updateSystemSetting('default_track_stage_code', { id: formData.default_track_stage_code }, 'Etapa padrão'),
        updateSystemSetting('default_track_probability', { value: formData.default_track_probability }, 'Probabilidade padrão'),
        updateSystemSetting('default_lead_origin_code', { code: formData.default_lead_origin_code }, 'Origem padrão'),
        updateSystemSetting('default_lead_member_role_code', { code: formData.default_lead_member_role_code }, 'Papel padrão'),
        updateSystemSetting('synthetic_default_password', { value: formData.synthetic_default_password }, 'Senha sintética'),
        updateSystemSetting('synthetic_default_role_code', { code: formData.synthetic_default_role_code }, 'Role sintética'),
        updateSystemSetting('synthetic_total_users', { value: formData.synthetic_total_users }, 'Total sintéticos'),
        updateSystemSetting('synthetic_batch_size', { value: formData.synthetic_batch_size }, 'Batch size'),
        updateSystemSetting('synthetic_email_domain', { value: formData.synthetic_email_domain }, 'Domínio email'),
        updateSystemSetting('synthetic_name_prefix', { value: formData.synthetic_name_prefix }, 'Prefixo nome'),
      ]);
      toast.success('Configurações salvas!');
    } catch (e) {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSectionChange = (id: string) => {
    const section = id as SectionId;
    if (!activeTab) setInternalSection(section);
    onTabChange?.(section);
  };

  if (isLoading || metadataLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const navItems: SidebarNavItem[] = NAV_ITEMS.map((item) => ({
    ...item,
    count: item.id === 'roles' ? userRoleMetadata.length : undefined
  }));

  const renderContent = () => {
    switch (currentSection) {
      case 'defaults':
        return (
          <DefaultsSection
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            isSaving={isSaving}
            dealStatuses={dealStatuses}
            stages={stages}
            leadOrigins={leadOrigins}
            leadMemberRoles={leadMemberRoles}
            userRoleMetadata={userRoleMetadata}
          />
        );
      case 'roles':
        return (
          <>
            <SettingsSectionHeader title="Papéis de Usuários" description="Configure labels, badges e permissões para cada role" />
            <RoleMetadataManager allPermissions={allPermissions ?? []} />
          </>
        );
      case 'permissions':
        return (
          <>
            <SettingsSectionHeader title="Permissões Avançadas (RBAC)" description="Gerenciamento granular de permissões" />
            <RolesManager />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SettingsSidebarLayout
      items={navItems}
      activeId={currentSection}
      onSelect={handleSectionChange}
      minHeight="600px"
    >
      {renderContent()}
    </SettingsSidebarLayout>
  );
}
