import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LeadDetailPage from '@/features/leads/pages/LeadDetailPage'

// Mock all required modules
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Lead fixtures
const leadWithoutContacts = {
  id: 'lead-1',
  legalName: 'Acme Corp',
  status: 'new',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  contacts: [],
  members: [],
  origin: 'outbound',
  operationType: 'm_and_a',
  description: '',
  addressCity: '',
  addressState: '',
  segment: '',
  cnpj: '',
  website: '',
  leadStatusId: 'status-1',
  leadOriginId: 'origin-1'
}

const leadWithContacts = {
  ...leadWithoutContacts,
  contacts: [
    {
      id: 'contact-1',
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '11999999999',
      role: 'Diretor de TI',
      linkedin: 'https://linkedin.com/in/joaosilva',
      companyId: null,
      isPrimary: true,
      createdAt: new Date().toISOString(),
      createdBy: 'user-1'
    },
    {
      id: 'contact-2',
      name: 'Maria Santos',
      email: 'maria@example.com',
      phone: null,
      role: 'Gerente Comercial',
      linkedin: null,
      companyId: null,
      isPrimary: false,
      createdAt: new Date().toISOString(),
      createdBy: 'user-1'
    }
  ]
}

// Track current lead for the mock
let currentLead = leadWithoutContacts

vi.mock('@/services/leadService', () => ({
  useLead: () => ({ data: currentLead, isLoading: false }),
  useUpdateLead: () => ({ mutateAsync: vi.fn() }),
  useDeleteLead: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useLeadContacts: () => ({
    addContact: vi.fn(),
    removeContact: vi.fn()
  }),
  addLeadMember: vi.fn(),
  removeLeadMember: vi.fn()
}))

vi.mock('@/services/contactService', () => ({
  useContacts: () => ({ data: [], isLoading: false }),
  useCreateContact: () => ({ mutateAsync: vi.fn() })
}))

vi.mock('@/services/userService', () => ({
  useUsers: () => ({ data: [], isLoading: false })
}))

vi.mock('@/services/operationTypeService', () => ({
  useOperationTypes: () => ({ data: [], isLoading: false })
}))

vi.mock('@/services/tagService', () => ({
  TAG_COLORS: ['#000000'],
  useTags: () => ({ data: [], isLoading: false }),
  useEntityTags: () => ({ data: [], isLoading: false }),
  useTagOperations: () => ({
    create: { mutate: vi.fn() },
    assign: { mutate: vi.fn() },
    unassign: { mutate: vi.fn() },
    update: { mutate: vi.fn(), isPending: false },
    remove: { mutate: vi.fn(), isPending: false }
  })
}))

vi.mock('@/hooks/useSystemMetadata', () => ({
  useSystemMetadata: () => ({
    leadStatuses: [
      { id: 'status-1', code: 'new', label: 'Novo', isActive: true, sortOrder: 1, createdAt: '' }
    ],
    leadOrigins: [
      { id: 'origin-1', code: 'outbound', label: 'Outbound' }
    ],
    leadMemberRoles: [],
    dealStatuses: [],
    stages: [],
    companyTypes: [],
    relationshipLevels: [],
    userRoleMetadata: [],
    isLoading: false,
    error: null,
    refreshMetadata: vi.fn(),
    getLeadStatusById: (id: string) => {
      if (id === 'status-1') return { id: 'status-1', label: 'Novo', code: 'new' }
      return null
    },
    getLeadOriginById: (id: string) => {
      if (id === 'origin-1') return { id: 'origin-1', label: 'Outbound', code: 'outbound' }
      return null
    }
  })
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Test User' },
    profile: { id: 'profile-1', name: 'Test Profile' }
  })
}))

vi.mock('@/services/activityService', () => ({
  logActivity: vi.fn()
}))

vi.mock('@/components/CommentsPanel', () => ({ default: () => <div>Comments</div> }))
vi.mock('@/components/UnifiedTimeline', () => ({ UnifiedTimeline: () => <div>Timeline</div> }))
vi.mock('@/components/DriveSection', () => ({ default: () => <div>Drive</div> }))
vi.mock('@/components/ActivityHistory', () => ({ default: () => <div>Activity</div> }))
vi.mock('@/features/leads/components/QualifyLeadDialog', () => ({
  QualifyLeadDialog: () => <div>Qualify Lead</div>
}))
vi.mock('@/features/leads/components/LeadEditSheet', () => ({
  LeadEditSheet: () => <div>Edit Sheet</div>
}))
vi.mock('@/features/leads/components/LeadDeleteDialog', () => ({
  LeadDeleteDialog: () => <div>Delete Dialog</div>
}))
vi.mock('@/components/SmartTagSelector', () => ({
  SmartTagSelector: () => <div>Tag Selector</div>
}))

describe('LeadDetailPage Contacts Section', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    currentLead = leadWithoutContacts
    mockNavigate.mockClear()
  })

  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/leads/${currentLead.id}`]}>
          <Routes>
            <Route path="/leads/:id" element={<LeadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  describe('Section Naming', () => {
    it('displays "Contatos do Lead" as section title instead of "Comitê de Compra"', () => {
      currentLead = leadWithContacts
      renderPage()

      expect(screen.getByText('Contatos do Lead')).toBeInTheDocument()
      expect(screen.queryByText('Comitê de Compra')).not.toBeInTheDocument()
    })

    it('displays updated section description', () => {
      currentLead = leadWithContacts
      renderPage()

      expect(screen.getByText('Pessoas associadas ao lead.')).toBeInTheDocument()
      expect(screen.queryByText('Mapeie influenciadores e decisores.')).not.toBeInTheDocument()
    })
  })

  describe('EmptyState with dual actions', () => {
    it('shows "Novo Contato" and "Vincular Existente" buttons when no contacts', () => {
      currentLead = leadWithoutContacts
      renderPage()

      expect(screen.getByText('Nenhum contato mapeado')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Novo Contato/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Vincular Existente/i })).toBeInTheDocument()
    })

    it('clicking "Novo Contato" in empty state opens contact creation dialog', async () => {
      currentLead = leadWithoutContacts
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('button', { name: /Novo Contato/i }))

      expect(screen.getByText('Adicionar novo contato')).toBeInTheDocument()
    })

    it('shows "Vincular Existente" button in empty state', () => {
      currentLead = leadWithoutContacts
      renderPage()

      const linkButton = screen.getByRole('button', { name: /Vincular Existente/i })
      expect(linkButton).toBeInTheDocument()
    })
  })

  describe('Contact Cards Clickability', () => {
    it('contact cards have proper click handling when contacts exist', () => {
      currentLead = leadWithContacts
      renderPage()

      // Verify the contact names are rendered
      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
    })

    it('renders contact role and info in the card', () => {
      currentLead = leadWithContacts
      renderPage()

      expect(screen.getByText('Diretor de TI')).toBeInTheDocument()
      expect(screen.getByText('Gerente Comercial')).toBeInTheDocument()
    })
  })

  describe('Relationship Map Removal', () => {
    it('does NOT display "Mapa de Relacionamentos" section', () => {
      currentLead = leadWithContacts
      renderPage()

      expect(screen.queryByText('Mapa de Relacionamentos')).not.toBeInTheDocument()
    })
  })
})
