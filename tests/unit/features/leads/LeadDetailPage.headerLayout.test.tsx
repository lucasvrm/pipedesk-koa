import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LeadDetailPage from '@/features/leads/pages/LeadDetailPage'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

vi.mock('@/components/ui/ActivityBadges', () => ({
  renderNewBadge: () => null,
  renderUpdatedTodayBadge: () => <span>Atualizado hoje</span>
}))

vi.mock('@/features/leads/components/LeadPriorityBadge', () => ({
  LeadPriorityBadge: () => <div data-testid="lead-priority-badge" />
}))

const leadFixture = {
  id: 'lead-1',
  legalName: 'Lead Principal',
  tradeName: 'Acme Corp',
  status: 'new',
  leadStatusId: 'status-1',
  leadOriginId: 'origin-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  priorityBucket: 'hot' as const,
  priorityScore: 90,
  priorityDescription: 'Alta prioridade',
  contacts: [],
  members: [],
  owner: { id: 'owner-1', name: 'Owner User' },
  origin: 'outbound',
  operationType: 'm_and_a',
  description: '',
  addressCity: '',
  addressState: '',
  segment: '',
  cnpj: '',
  website: '',
  qualifiedCompanyId: 'company-123'
}

vi.mock('@/services/leadService', () => ({
  useLead: () => ({ data: leadFixture, isLoading: false }),
  useUpdateLead: () => ({ mutateAsync: vi.fn() }),
  useLeadContacts: () => ({ addContact: vi.fn(), removeContact: vi.fn() }),
  addLeadMember: vi.fn(),
  removeLeadMember: vi.fn(),
  useDeleteLead: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useQualifyLead: () => ({ mutateAsync: vi.fn(), isPending: false })
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
    getLeadOriginById: () => ({ code: 'outbound', label: 'Outbound' }),
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

vi.mock('@/components/UnifiedTimeline', () => ({
  UnifiedTimeline: () => <div data-testid="unified-timeline">Timeline Content</div>
}))

vi.mock('@/components/DriveSection', () => ({
  default: () => <div data-testid="drive-section">Drive Section</div>
}))

vi.mock('@/components/SmartTagSelector', () => ({
  SmartTagSelector: () => <div>Tag Selector</div>
}))

describe('LeadDetailPage header layout', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
  })

  it('renders company link with updated badge aligned on the same row', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/leads/${leadFixture.id}`]}>
          <Routes>
            <Route path="/leads/:id" element={<LeadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    const companyLink = await screen.findByRole('link', { name: /acme corp/i })
    expect(companyLink).toHaveAttribute('href', '/companies/company-123')

    const updatedBadge = screen.getByText(/atualizado hoje/i)
    const companyRow = companyLink.parentElement
    expect(companyRow).toBeTruthy()
    expect(companyRow).toContainElement(updatedBadge)
  })
})
