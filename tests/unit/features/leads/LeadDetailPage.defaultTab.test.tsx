import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LeadDetailPage from '@/features/leads/pages/LeadDetailPage'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const leadFixture = {
  id: 'lead-1',
  legalName: 'Test Lead',
  status: 'new',
  leadStatusId: 'status-1',
  leadOriginId: 'origin-1',
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
  website: ''
}

vi.mock('@/services/leadService', () => ({
  useLead: () => ({ data: leadFixture, isLoading: false }),
  useUpdateLead: () => ({ mutateAsync: vi.fn() }),
  useLeadContacts: () => ({ addContact: vi.fn(), removeContact: vi.fn() }),
  addLeadMember: vi.fn(),
  removeLeadMember: vi.fn(),
  useDeleteLead: () => ({ mutateAsync: vi.fn(), isPending: false })
}))

vi.mock('@/services/contactService', () => ({
  useContacts: () => ({ data: [] }),
  useCreateContact: () => ({ mutateAsync: vi.fn() })
}))

vi.mock('@/services/userService', () => ({
  useUsers: () => ({ data: [] })
}))

vi.mock('@/services/operationTypeService', () => ({
  useOperationTypes: () => ({ data: [] })
}))

vi.mock('@/services/tagService', () => ({
  useEntityTags: () => ({ data: [] }),
  useTagOperations: () => ({
    create: { mutate: vi.fn(), mutateAsync: vi.fn() },
    assign: { mutate: vi.fn() },
    unassign: { mutate: vi.fn() },
    update: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
    remove: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }
  })
}))

vi.mock('@/hooks/useSystemMetadata', () => ({
  useSystemMetadata: () => ({
    leadStatuses: [{ id: 'status-1', code: 'new', label: 'Novo', isActive: true, sortOrder: 1 }],
    leadOrigins: [{ id: 'origin-1', label: 'Outbound' }],
    getLeadStatusById: () => ({ code: 'new', label: 'Novo' }),
    getLeadOriginById: () => ({ label: 'Outbound' }),
    isLoading: false,
    error: null,
    refreshMetadata: vi.fn()
  })
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ 
    user: { id: 'user-1', name: 'Test User' }, 
    profile: { id: 'user-1', name: 'Test User' } 
  })
}))

vi.mock('@/services/activityService', () => ({
  logActivity: vi.fn()
}))

// Mock components that are complex or have their own dependencies
vi.mock('@/components/UnifiedTimeline', () => ({
  UnifiedTimeline: () => <div data-testid="unified-timeline">Timeline Content - Histórico de Interações</div>
}))

vi.mock('@/components/DriveSection', () => ({
  default: () => <div data-testid="drive-section">Drive Section</div>
}))

vi.mock('@/components/CommentsPanel', () => ({ default: () => <div>Comments</div> }))
vi.mock('@/components/ActivityHistory', () => ({ default: () => <div>Activity History</div> }))

vi.mock('@/features/leads/components/QualifyLeadDialog', () => ({
  QualifyLeadDialog: () => <div>Qualify Lead</div>
}))

vi.mock('@/features/leads/components/LeadEditSheet', () => ({
  LeadEditSheet: () => <div>Edit Sheet</div>
}))

vi.mock('@/features/leads/components/LeadDeleteDialog', () => ({
  LeadDeleteDialog: () => <div>Delete Dialog</div>
}))

vi.mock('@/features/leads/components/ContactPreviewModal', () => ({
  ContactPreviewModal: () => <div>Contact Preview</div>
}))

vi.mock('@/components/SmartTagSelector', () => ({
  SmartTagSelector: () => <div>Tag Selector</div>
}))

// Mock Tooltip to avoid ResizeObserver issues
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>
}))

describe('LeadDetailPage default tab behavior', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
  })

  it('opens with Contexto tab selected by default', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/leads/${leadFixture.id}`]}>
          <Routes>
            <Route path="/leads/:id" element={<LeadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    // The UnifiedTimeline component should be visible without clicking any tab
    // because "timeline" (Contexto) is now the default tab
    expect(screen.getByTestId('unified-timeline')).toBeInTheDocument()
    
    // Check that the tab text has been renamed to "Contexto"
    expect(screen.getByRole('tab', { name: /contexto/i })).toBeInTheDocument()
  })

  it('displays explanatory text in the Contexto tab', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/leads/${leadFixture.id}`]}>
          <Routes>
            <Route path="/leads/:id" element={<LeadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Check for the explanatory text about the context tab
    expect(screen.getByText(/histórico completo de interações/i)).toBeInTheDocument()
  })
})
