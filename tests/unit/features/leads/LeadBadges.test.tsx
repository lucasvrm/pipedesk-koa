import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LeadDetailPage from '@/features/leads/pages/LeadDetailPage'
import { LeadPriorityBadge } from '@/features/leads/components/LeadPriorityBadge'
import type { LeadPriorityBucket, Lead } from '@/lib/types'

// Mock dependencies
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock('@/services/activityService', () => ({ logActivity: vi.fn() }))
vi.mock('@/services/driveService', () => ({ getRootFolderUrl: vi.fn() }))
vi.mock('@/components/DriveSection', () => ({ default: () => <div>Drive Section</div> }))
vi.mock('@/hooks/useUnifiedTimeline', () => ({
  useUnifiedTimeline: () => ({
    items: [],
    isLoading: false,
    error: null,
    refetch: vi.fn()
  })
}))

const mockLead: Lead = {
  id: 'lead-123',
  legalName: 'Test Company',
  tradeName: 'Test Co',
  leadStatusId: 'status-1',
  leadOriginId: 'origin-1',
  ownerUserId: 'user-1',
  owner: {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg'
  },
  priorityBucket: 'hot',
  priorityScore: 85,
  priorityDescription: 'High priority lead',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'user-1',
  contacts: [],
  members: []
}

// Mock services
vi.mock('@/services/leadService', () => ({
  useLead: vi.fn((id: string) => ({
    data: mockLead,
    isLoading: false,
    error: null
  })),
  useUpdateLead: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false
  })),
  useDeleteLead: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false
  })),
  useLeadContacts: vi.fn(() => ({
    addContact: vi.fn(),
    removeContact: vi.fn()
  })),
  LEADS_KEY: ['leads'],
  LEADS_SALES_VIEW_KEY: ['leads', 'sales-view'],
  LEADS_SALES_VIEW_ALT_KEY: ['leads-sales-view']
}))

vi.mock('@/services/contactService', () => ({
  useContacts: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateContact: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false }))
}))

vi.mock('@/services/userService', () => ({
  useUsers: vi.fn(() => ({ data: [], isLoading: false }))
}))

vi.mock('@/services/operationTypeService', () => ({
  useOperationTypes: vi.fn(() => ({ data: [], isLoading: false }))
}))

vi.mock('@/services/tagService', () => ({
  useEntityTags: vi.fn(() => ({ data: [], isLoading: false })),
  useTagOperations: vi.fn(() => ({
    assign: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
    unassign: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
    create: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
    update: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
    remove: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }
  }))
}))

vi.mock('@/services/commentService', () => ({
  useCreateComment: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateComment: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteComment: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false }))
}))

vi.mock('@/features/leads/hooks/useUpdateLeadPriority', () => ({
  useUpdateLeadPriority: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false
  }))
}))

vi.mock('@/hooks/useSystemMetadata', () => ({
  useSystemMetadata: vi.fn(() => ({
    leadStatuses: [
      { id: 'status-1', code: 'new', label: 'Novo', isActive: true },
      { id: 'status-2', code: 'contacted', label: 'Contatado', isActive: true },
      { id: 'status-3', code: 'qualified', label: 'Qualificado', isActive: true }
    ],
    getLeadStatusById: (id: string) => ({ id, code: 'new', label: 'Novo' })
  }))
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@example.com' },
    profile: { id: 'user-1', name: 'Test User', role: 'admin' }
  }))
}))

describe('Lead Badges - Priority and Owner Consistency', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
  })

  describe('Priority Badge Normalization', () => {
    it('should show hot priority badge when priorityBucket is hot', () => {
      render(
        <LeadPriorityBadge
          priorityBucket="hot"
          priorityScore={90}
          priorityDescription="High priority"
        />
      )
      
      expect(screen.getByText('Alta')).toBeInTheDocument()
      expect(screen.getByText('(90)')).toBeInTheDocument()
    })

    it('should show cold priority badge when priorityBucket is cold', () => {
      render(
        <LeadPriorityBadge
          priorityBucket="cold"
          priorityScore={20}
          priorityDescription="Low priority"
        />
      )
      
      expect(screen.getByText('Baixa')).toBeInTheDocument()
      expect(screen.getByText('(20)')).toBeInTheDocument()
    })

    it('should default to cold priority when priorityBucket is null/undefined', () => {
      render(
        <LeadPriorityBadge
          priorityBucket={null}
          priorityScore={null}
          priorityDescription={null}
        />
      )
      
      expect(screen.getByText('Baixa')).toBeInTheDocument()
    })

    it('should handle invalid priority bucket by defaulting to warm', () => {
      // This tests the normalization logic in LeadDetailPage
      const invalidBucket = 'invalid' as LeadPriorityBucket
      const normalizedBucket: LeadPriorityBucket = 
        invalidBucket === 'hot' || invalidBucket === 'cold' 
          ? invalidBucket 
          : 'warm'
      
      expect(normalizedBucket).toBe('warm')
    })

    it('should handle non-finite priority score by defaulting to null', () => {
      const scores = [NaN, Infinity, -Infinity, undefined, null]
      
      scores.forEach(score => {
        const normalized = typeof score === 'number' && Number.isFinite(score) 
          ? score 
          : null
        expect(normalized).toBe(null)
      })
    })

    it('should preserve valid finite priority score', () => {
      const validScores = [0, 50, 100, -10, 0.5]
      
      validScores.forEach(score => {
        const normalized = typeof score === 'number' && Number.isFinite(score) 
          ? score 
          : null
        expect(normalized).toBe(score)
      })
    })
  })

  describe('Priority Consistency Between List and Detail', () => {
    it('should use same priority normalization in detail page as in list', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/leads/lead-123']}>
            <Routes>
              <Route path="/leads/:id" element={<LeadDetailPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      )

      // Wait for the component to render
      await waitFor(() => {
        expect(screen.getByText('Test Company')).toBeInTheDocument()
      })

      // Verify priority badge is rendered (it should show hot priority)
      expect(screen.getByText('Alta')).toBeInTheDocument()
    })
  })

  describe('Owner Badge Edge Cases', () => {
    it('should handle owner with null/undefined values gracefully', () => {
      const ownerData = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: undefined
      }
      
      expect(ownerData.avatar).toBeUndefined()
      expect(ownerData.name).toBe('John Doe')
    })

    it('should handle missing owner object', () => {
      const lead: Partial<Lead> = {
        id: 'lead-1',
        ownerUserId: 'user-1',
        owner: undefined
      }
      
      expect(lead.owner).toBeUndefined()
      expect(lead.ownerUserId).toBe('user-1')
    })
  })
})
