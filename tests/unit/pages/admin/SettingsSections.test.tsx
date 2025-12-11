import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { LeadSettingsSection } from '@/pages/admin/components/settings-sections/LeadSettingsSection';
import { DealPipelineSettingsSection } from '@/pages/admin/components/settings-sections/DealPipelineSettingsSection';
import { CompanyRelationshipSettingsSection } from '@/pages/admin/components/settings-sections/CompanyRelationshipSettingsSection';
import { SystemMetadataSettingsSection } from '@/pages/admin/components/settings-sections/SystemMetadataSettingsSection';
import { SystemSettingsSection } from '@/pages/admin/components/settings-sections/SystemSettingsSection';

// Mock settingsService
vi.mock('@/services/settingsService', () => ({
  settingsService: {
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  getSystemSetting: vi.fn(),
  updateSystemSetting: vi.fn()
}));

vi.mock('@/services/roleService', () => ({
  usePermissions: () => ({ data: [], isLoading: false }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock the useSystemMetadata hook
vi.mock('@/hooks/useSystemMetadata', () => ({
  useSystemMetadata: () => ({
    leadStatuses: [
      { id: '1', code: 'new', label: 'Novo', description: 'Lead novo', isActive: true, sortOrder: 1, createdAt: '2024-01-01' }
    ],
    leadOrigins: [
      { id: '1', code: 'website', label: 'Website', description: 'Origem site', isActive: true, sortOrder: 1, createdAt: '2024-01-01' }
    ],
    leadMemberRoles: [
      { id: '1', code: 'owner', label: 'Proprietário', description: 'Dono do lead', isActive: true, sortOrder: 1, createdAt: '2024-01-01' }
    ],
    dealStatuses: [
      { id: '1', code: 'open', label: 'Aberto', color: '#3b82f6', description: 'Deal aberto', isActive: true, sortOrder: 1, createdAt: '2024-01-01' }
    ],
    stages: [
      { id: '1', pipelineId: 'p1', name: 'Prospecção', color: '#3b82f6', stageOrder: 1, probability: 10, isDefault: false, active: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
    ],
    companyTypes: [
      { id: '1', code: 'investor', label: 'Investidor', description: 'Empresa investidora', isActive: true, sortOrder: 1, createdAt: '2024-01-01' }
    ],
    relationshipLevels: [
      { id: '1', code: 'partner', label: 'Parceiro', description: 'Empresa parceira', isActive: true, sortOrder: 1, createdAt: '2024-01-01' }
    ],
    userRoleMetadata: [
      { id: '1', code: 'admin', label: 'Administrador', description: 'Acesso total', permissions: ['all'], isActive: true, sortOrder: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
    ],
    isLoading: false,
    error: null,
    refreshMetadata: vi.fn()
  })
}));

describe('Settings Sections', () => {
  const renderWithClient = (ui: React.ReactElement) => {
    const client = new QueryClient()
    return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LeadSettingsSection', () => {
    it('renders without crashing', () => {
      renderWithClient(<LeadSettingsSection />);
      expect(screen.getByText('Status de Leads')).toBeTruthy();
    });

    it('displays lead statuses in table', () => {
      renderWithClient(<LeadSettingsSection />);
      const novoElements = screen.getAllByText('Novo');
      expect(novoElements.length).toBeGreaterThan(0);
      expect(screen.getByText('new')).toBeTruthy();
    });

    it('displays lead origins in table', () => {
      renderWithClient(<LeadSettingsSection />);
      expect(screen.getByText('Website')).toBeTruthy();
      expect(screen.getByText('website')).toBeTruthy();
    });

    it('displays lead member roles in table', () => {
      renderWithClient(<LeadSettingsSection />);
      expect(screen.getByText('Proprietário')).toBeTruthy();
      expect(screen.getByText('owner')).toBeTruthy();
    });

    it('shows "Novo" buttons for each section', () => {
      renderWithClient(<LeadSettingsSection />);
      const novoButtons = screen.getAllByText('Novo');
      // Should have at least 3 "Novo" buttons (one for each section)
      expect(novoButtons.length).toBeGreaterThanOrEqual(3);
    });

    it('has edit and delete buttons for each row', () => {
      renderWithClient(<LeadSettingsSection />);
      
      // Find all buttons
      const allButtons = screen.getAllByRole('button');
      
      // Should have edit and delete buttons
      expect(allButtons.length).toBeGreaterThan(3);
    });
  });

  describe('DealPipelineSettingsSection', () => {
    it('renders without crashing', () => {
      renderWithClient(<DealPipelineSettingsSection />);
      expect(screen.getByText('Status de Deals')).toBeTruthy();
    });

    it('displays deal statuses in table', () => {
      renderWithClient(<DealPipelineSettingsSection />);
      expect(screen.getByText('Aberto')).toBeTruthy();
      expect(screen.getByText('open')).toBeTruthy();
    });

    it('displays pipeline stages', () => {
      renderWithClient(<DealPipelineSettingsSection />);
      expect(screen.getByText('Prospecção')).toBeTruthy();
    });

    it('has "Novo" button for deal statuses', () => {
      renderWithClient(<DealPipelineSettingsSection />);
      const novoButtons = screen.getAllByText('Novo');
      expect(novoButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('has edit and delete buttons for deal statuses', () => {
      renderWithClient(<DealPipelineSettingsSection />);
      const allButtons = screen.getAllByRole('button');
      // Should have at least: 1 "Novo" button + edit/delete buttons for each status
      expect(allButtons.length).toBeGreaterThan(2);
    });
  });

  describe('CompanyRelationshipSettingsSection', () => {
    it('renders without crashing', () => {
      renderWithClient(<CompanyRelationshipSettingsSection />);
      expect(screen.getByText('Tipos de Empresa')).toBeTruthy();
    });

    it('displays company types in table', () => {
      renderWithClient(<CompanyRelationshipSettingsSection />);
      expect(screen.getByText('Investidor')).toBeTruthy();
      expect(screen.getByText('investor')).toBeTruthy();
    });

    it('displays relationship levels in table', () => {
      renderWithClient(<CompanyRelationshipSettingsSection />);
      expect(screen.getByText('Parceiro')).toBeTruthy();
      expect(screen.getByText('partner')).toBeTruthy();
    });

    it('has "Novo" buttons for both sections', () => {
      renderWithClient(<CompanyRelationshipSettingsSection />);
      const novoButtons = screen.getAllByText('Novo');
      // Should have 2 "Novo" buttons (one for each section)
      expect(novoButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('has edit and delete buttons for each row', () => {
      renderWithClient(<CompanyRelationshipSettingsSection />);
      const allButtons = screen.getAllByRole('button');
      // Should have: 2 "Novo" buttons + edit/delete for each type and level
      expect(allButtons.length).toBeGreaterThan(4);
    });
  });

  describe('SystemMetadataSettingsSection', () => {
    it('renders without crashing', () => {
      renderWithClient(<SystemMetadataSettingsSection />);
      expect(screen.getByText('Papéis de Usuário')).toBeTruthy();
    });

    it('displays user roles', () => {
      renderWithClient(<SystemMetadataSettingsSection />);
      expect(screen.getByText('Administrador')).toBeTruthy();
    });
  });

  describe('SystemSettingsSection', () => {
    beforeEach(async () => {
      const { getSystemSetting } = await import('@/services/settingsService');
      vi.mocked(getSystemSetting).mockResolvedValue({ data: null, error: null });
    });

    it('renders without crashing', async () => {
      renderWithClient(<SystemSettingsSection />);
      await waitFor(() => {
        expect(screen.getByText('Defaults de Negócio')).toBeTruthy();
      });
    });

    it('displays business defaults section', async () => {
      renderWithClient(<SystemSettingsSection />);
      await waitFor(() => {
        expect(screen.getByText('Defaults de Negócio')).toBeTruthy();
        expect(screen.getByText('Status Padrão de Deal')).toBeTruthy();
        expect(screen.getByText('Etapa Padrão da Pipeline')).toBeTruthy();
        expect(screen.getByText('Probabilidade Padrão (%)')).toBeTruthy();
      });
    });

    it('displays synthetic users configuration section', async () => {
      renderWithClient(<SystemSettingsSection />);
      await waitFor(() => {
        expect(screen.getByText('Configurações de Usuários Sintéticos')).toBeTruthy();
        expect(screen.getByText('Senha Padrão')).toBeTruthy();
        expect(screen.getByText('Role Padrão')).toBeTruthy();
        expect(screen.getByText('Quantidade Total de Usuários')).toBeTruthy();
      });
    });

    it('has save button', async () => {
      renderWithClient(<SystemSettingsSection />);
      await waitFor(() => {
        expect(screen.getByText('Salvar Configurações')).toBeTruthy();
      });
    });

    it('displays Role Metadata Manager section', async () => {
      renderWithClient(<SystemSettingsSection />);
      await waitFor(() => {
        expect(screen.getByText('Metadados de Roles')).toBeTruthy();
        expect(screen.getByText('Configure labels, badges e permissões para cada role de usuário')).toBeTruthy();
      });
    });

    it('calls updateSystemSetting when save is clicked', async () => {
      const { updateSystemSetting } = await import('@/services/settingsService');
      const mockUpdate = vi.mocked(updateSystemSetting).mockResolvedValue({ data: {}, error: null });

      renderWithClient(<SystemSettingsSection />);
      
      await waitFor(() => {
        expect(screen.getByText('Salvar Configurações')).toBeTruthy();
      });

      const saveButton = screen.getByText('Salvar Configurações');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });
  });
});
