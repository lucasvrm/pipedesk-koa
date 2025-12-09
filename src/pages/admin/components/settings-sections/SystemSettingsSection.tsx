import { useState, useEffect } from 'react';
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
import { Gear, ShieldCheck } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { RoleMetadataManager } from './RoleMetadataManager';

interface SystemSettingsFormData {
  // Business Defaults
  default_deal_status_code: string;
  default_track_stage_code: string; // stores stage.id
  default_track_probability: number;
  default_lead_origin_code: string;
  default_lead_member_role_code: string;
  
  // Synthetic Users Configuration
  synthetic_default_password: string;
  synthetic_default_role_code: string;
  synthetic_total_users: number;
  synthetic_batch_size: number;
  synthetic_email_domain: string;
  synthetic_name_prefix: string;
}

interface SystemSettingValue {
  code?: string;
  value?: string | number;
  id?: string;
}

type FormDataKey = keyof SystemSettingsFormData;

export function SystemSettingsSection() {
  const { 
    dealStatuses, 
    stages, 
    leadOrigins, 
    leadMemberRoles, 
    userRoleMetadata,
    isLoading: metadataLoading 
  } = useSystemMetadata();

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

  // Load current settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const settingsKeys = [
        'default_deal_status_code',
        'default_track_stage_code',
        'default_track_probability',
        'default_lead_origin_code',
        'default_lead_member_role_code',
        'synthetic_default_password',
        'synthetic_default_role_code',
        'synthetic_total_users',
        'synthetic_batch_size',
        'synthetic_email_domain',
        'synthetic_name_prefix'
      ];

      const results = await Promise.all(
        settingsKeys.map(key => getSystemSetting(key))
      );

      const newFormData = { ...formData };
      settingsKeys.forEach((key, index) => {
        const result = results[index];
        if (result.data !== null) {
          const value = result.data as SystemSettingValue;
          // Handle different value structures
          if (value && typeof value === 'object') {
            if ('code' in value && value.code) {
              (newFormData as any)[key] = value.code;
            } else if ('id' in value && value.id) {
              (newFormData as any)[key] = value.id;
            } else if ('value' in value) {
              (newFormData as any)[key] = value.value;
            }
          } else {
            (newFormData as any)[key] = value;
          }
        }
      });

      setFormData(newFormData);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save all settings in parallel for better performance
      await Promise.all([
        // Business Defaults
        updateSystemSetting(
          'default_deal_status_code',
          { code: formData.default_deal_status_code },
          'Status padrão ao criar deal'
        ),
        updateSystemSetting(
          'default_track_stage_code',
          { id: formData.default_track_stage_code }, // stages use id, not code
          'Etapa padrão da pipeline'
        ),
        updateSystemSetting(
          'default_track_probability',
          { value: Number(formData.default_track_probability) },
          'Probabilidade padrão (%)'
        ),
        updateSystemSetting(
          'default_lead_origin_code',
          { code: formData.default_lead_origin_code },
          'Origem padrão de lead'
        ),
        updateSystemSetting(
          'default_lead_member_role_code',
          { code: formData.default_lead_member_role_code },
          'Papel padrão de membro de lead'
        ),
        // Synthetic Users Configuration
        updateSystemSetting(
          'synthetic_default_password',
          { value: formData.synthetic_default_password },
          'Senha padrão para usuários sintéticos'
        ),
        updateSystemSetting(
          'synthetic_default_role_code',
          { code: formData.synthetic_default_role_code },
          'Role padrão para usuários sintéticos'
        ),
        updateSystemSetting(
          'synthetic_total_users',
          { value: Number(formData.synthetic_total_users) },
          'Quantidade alvo de usuários sintéticos'
        ),
        updateSystemSetting(
          'synthetic_batch_size',
          { value: Number(formData.synthetic_batch_size) },
          'Tamanho do lote de criação de usuários sintéticos'
        ),
        updateSystemSetting(
          'synthetic_email_domain',
          { value: formData.synthetic_email_domain },
          'Domínio de e-mail para usuários sintéticos'
        ),
        updateSystemSetting(
          'synthetic_name_prefix',
          { value: formData.synthetic_name_prefix },
          'Prefixo de nome para usuários sintéticos'
        )
      ]);

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || metadataLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando configurações do sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Business Defaults Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Gear className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Defaults de Negócio</CardTitle>
              <CardDescription>
                Configure valores padrão para criação de deals, leads e rastreamento
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Default Deal Status */}
            <div className="space-y-2">
              <Label htmlFor="default_deal_status_code">Status Padrão de Deal</Label>
              <Select
                value={formData.default_deal_status_code}
                onValueChange={(value) =>
                  setFormData({ ...formData, default_deal_status_code: value })
                }
              >
                <SelectTrigger id="default_deal_status_code">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  {dealStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.code}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Status inicial ao criar um novo deal
              </p>
            </div>

            {/* Default Track Stage */}
            <div className="space-y-2">
              <Label htmlFor="default_track_stage_code">Etapa Padrão da Pipeline</Label>
              <Select
                value={formData.default_track_stage_code}
                onValueChange={(value) =>
                  setFormData({ ...formData, default_track_stage_code: value })
                }
              >
                <SelectTrigger id="default_track_stage_code">
                  <SelectValue placeholder="Selecione uma etapa" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Etapa inicial da pipeline ao criar track
              </p>
            </div>

            {/* Default Track Probability */}
            <div className="space-y-2">
              <Label htmlFor="default_track_probability">Probabilidade Padrão (%)</Label>
              <Input
                id="default_track_probability"
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.default_track_probability}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    default_track_probability: Number(e.target.value)
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Probabilidade padrão para novos tracks (0-100)
              </p>
            </div>

            {/* Default Lead Origin */}
            <div className="space-y-2">
              <Label htmlFor="default_lead_origin_code">Origem Padrão de Lead</Label>
              <Select
                value={formData.default_lead_origin_code}
                onValueChange={(value) =>
                  setFormData({ ...formData, default_lead_origin_code: value })
                }
              >
                <SelectTrigger id="default_lead_origin_code">
                  <SelectValue placeholder="Selecione uma origem" />
                </SelectTrigger>
                <SelectContent>
                  {leadOrigins.map((origin) => (
                    <SelectItem key={origin.id} value={origin.code}>
                      {origin.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Origem padrão ao criar um novo lead
              </p>
            </div>

            {/* Default Lead Member Role */}
            <div className="space-y-2">
              <Label htmlFor="default_lead_member_role_code">Papel Padrão de Membro do Lead</Label>
              <Select
                value={formData.default_lead_member_role_code}
                onValueChange={(value) =>
                  setFormData({ ...formData, default_lead_member_role_code: value })
                }
              >
                <SelectTrigger id="default_lead_member_role_code">
                  <SelectValue placeholder="Selecione um papel" />
                </SelectTrigger>
                <SelectContent>
                  {leadMemberRoles.map((role) => (
                    <SelectItem key={role.id} value={role.code}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Papel padrão ao adicionar membro a um lead
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Synthetic Users Configuration Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <ShieldCheck className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle>Configurações de Usuários Sintéticos</CardTitle>
              <CardDescription>
                Parâmetros para geração automática de usuários de teste
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Synthetic Default Password */}
            <div className="space-y-2">
              <Label htmlFor="synthetic_default_password">Senha Padrão</Label>
              <Input
                id="synthetic_default_password"
                type="password"
                value={formData.synthetic_default_password}
                onChange={(e) =>
                  setFormData({ ...formData, synthetic_default_password: e.target.value })
                }
                placeholder="Digite a senha padrão"
              />
              <p className="text-xs text-muted-foreground">
                Senha padrão para todos os usuários sintéticos
              </p>
            </div>

            {/* Synthetic Default Role */}
            <div className="space-y-2">
              <Label htmlFor="synthetic_default_role_code">Role Padrão</Label>
              <Select
                value={formData.synthetic_default_role_code}
                onValueChange={(value) =>
                  setFormData({ ...formData, synthetic_default_role_code: value })
                }
              >
                <SelectTrigger id="synthetic_default_role_code">
                  <SelectValue placeholder="Selecione um role" />
                </SelectTrigger>
                <SelectContent>
                  {userRoleMetadata.map((role) => (
                    <SelectItem key={role.id} value={role.code}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Role padrão atribuído aos usuários sintéticos
              </p>
            </div>

            {/* Synthetic Total Users */}
            <div className="space-y-2">
              <Label htmlFor="synthetic_total_users">Quantidade Total de Usuários</Label>
              <Input
                id="synthetic_total_users"
                type="number"
                min="0"
                step="1"
                value={formData.synthetic_total_users}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    synthetic_total_users: Number(e.target.value)
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Quantidade alvo de usuários sintéticos a serem criados
              </p>
            </div>

            {/* Synthetic Batch Size */}
            <div className="space-y-2">
              <Label htmlFor="synthetic_batch_size">Tamanho do Lote</Label>
              <Input
                id="synthetic_batch_size"
                type="number"
                min="1"
                step="1"
                value={formData.synthetic_batch_size}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    synthetic_batch_size: Number(e.target.value)
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Quantos usuários criar por lote (batch size)
              </p>
            </div>

            {/* Synthetic Email Domain */}
            <div className="space-y-2">
              <Label htmlFor="synthetic_email_domain">Domínio de E-mail</Label>
              <Input
                id="synthetic_email_domain"
                type="text"
                value={formData.synthetic_email_domain}
                onChange={(e) =>
                  setFormData({ ...formData, synthetic_email_domain: e.target.value })
                }
                placeholder="@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Domínio de e-mail para usuários sintéticos (ex: @example.com)
              </p>
            </div>

            {/* Synthetic Name Prefix */}
            <div className="space-y-2">
              <Label htmlFor="synthetic_name_prefix">Prefixo de Nome</Label>
              <Input
                id="synthetic_name_prefix"
                type="text"
                value={formData.synthetic_name_prefix}
                onChange={(e) =>
                  setFormData({ ...formData, synthetic_name_prefix: e.target.value })
                }
                placeholder="Synth User "
              />
              <p className="text-xs text-muted-foreground">
                Prefixo adicionado aos nomes dos usuários sintéticos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Metadata Manager */}
      <RoleMetadataManager />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}
