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

// Variable to control the mock state
let mockLeadState: 'loading' | 'loaded' = 'loading'

vi.mock('@/services/leadService', () => ({
  useLead: () => {
    if (mockLeadState === 'loading') {
      return { data: undefined, isLoading: true }
    }
    return { data: leadFixture, isLoading: false }
  },
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

vi.mock('@/services/commentService', () => ({
  useCreateComment: () => ({ mutateAsync: vi.fn() }),
  useUpdateComment: () => ({ mutateAsync: vi.fn() }),
  useDeleteComment: () => ({ mutateAsync: vi.fn() })
}))

vi.mock('@/hooks/useUnifiedTimeline', () => ({
  useUnifiedTimeline: () => ({
    items: [],
    isLoading: false,
    error: null,
    refetch: vi.fn()
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
    profile: { id: 'user-1', name: 'Test User', role: 'manager' } 
  })
}))

vi.mock('@/services/activityService', () => ({
  logActivity: vi.fn()
}))

// Mock complex components
vi.mock('@/components/timeline-v2/TimelineVisual', () => ({
  TimelineVisual: () => <div data-testid="timeline-visual">Timeline Content</div>
}))

vi.mock('@/components/DriveSection', () => ({
  default: () => <div data-testid="drive-section">Drive Section</div>
}))

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

vi.mock('@/features/leads/components/ChangeOwnerDialog', () => ({
  ChangeOwnerDialog: () => <div>Change Owner Dialog</div>
}))

vi.mock('@/features/leads/components/LeadDetailQuickActions', () => ({
  LeadDetailQuickActions: () => <div>Quick Actions</div>
}))

vi.mock('@/features/leads/components/LeadPriorityBadge', () => ({
  LeadPriorityBadge: () => <div>Priority Badge</div>
}))

vi.mock('@/features/leads/utils/calculateLeadPriority', () => ({
  calculateLeadPriority: () => ({ bucket: 'hot', score: 80, description: 'High priority' })
}))

vi.mock('@/components/BuyingCommitteeCard', () => ({
  BuyingCommitteeCard: () => <div>Buying Committee Card</div>
}))

// Mock Tooltip to avoid ResizeObserver issues
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>
}))

describe('LeadDetailPage - Hooks Order Regression Test', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
    // Reset mock state before each test
    mockLeadState = 'loading'
  })

  it('should not crash when transitioning from loading to loaded state', async () => {
    // This test specifically targets React Error #310:
    // "Rendered more hooks than during the previous render"
    
    // First render: loading state
    const { rerender, container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/leads/${leadFixture.id}`]}>
          <Routes>
            <Route path="/leads/:id" element={<LeadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Should show skeleton in loading state
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)

    // Change mock state to loaded
    mockLeadState = 'loaded'

    // Second render: loaded state - this should NOT crash with hooks order error
    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/leads/${leadFixture.id}`]}>
          <Routes>
            <Route path="/leads/:id" element={<LeadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Should now show the lead content (appears in multiple places)
    const leadNameElements = screen.getAllByText('Test Lead')
    expect(leadNameElements.length).toBeGreaterThan(0)
    
    // Verify the component rendered successfully without crashing
    expect(screen.getByText(/Leads/i)).toBeInTheDocument()
  })

  it('should render all hooks unconditionally regardless of data state', () => {
    // Start with loaded state
    mockLeadState = 'loaded'

    const { rerender, container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/leads/${leadFixture.id}`]}>
          <Routes>
            <Route path="/leads/:id" element={<LeadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    const leadNameElements = screen.getAllByText('Test Lead')
    expect(leadNameElements.length).toBeGreaterThan(0)

    // Switch back to loading state - this transition should also work
    mockLeadState = 'loading'

    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/leads/${leadFixture.id}`]}>
          <Routes>
            <Route path="/leads/:id" element={<LeadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Should show skeleton again without crashing
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
