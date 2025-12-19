import React, { useSyncExternalStore } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LeadDetailPage from '@/features/leads/pages/LeadDetailPage'
import { Tag } from '@/lib/types'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const leadFixture = {
  id: 'lead-1',
  legalName: 'Acme Corp',
  status: 'new',
  createdAt: new Date().toISOString(),
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

const tagStore = {
  tags: [] as Tag[],
  entityTags: new Map<string, string[]>(),
  listeners: new Set<() => void>()
}

const emit = () => tagStore.listeners.forEach(listener => listener())

const subscribe = (listener: () => void) => {
  tagStore.listeners.add(listener)
  return () => tagStore.listeners.delete(listener)
}

const resetStore = () => {
  tagStore.tags = []
  tagStore.entityTags.clear()
}

const selectTagsForEntityType = (entityType?: 'deal' | 'track' | 'lead' | 'global') => {
  if (!entityType) return tagStore.tags
  if (entityType === 'global') return tagStore.tags.filter(t => t.entity_type === 'global')
  return tagStore.tags.filter(t => t.entity_type === entityType || t.entity_type === 'global')
}

vi.mock('@/services/tagService', () => {
  const buildTag = (vars: Partial<Tag>) => ({
    id: vars.id || `tag-${tagStore.tags.length + 1}`,
    name: vars.name || 'Tag',
    color: vars.color || '#000000',
    entity_type: vars.entity_type || 'global'
  } as Tag)

  const createMutation = {
    mutate: (vars: Omit<Tag, 'id'>, options?: any) => {
      const newTag = buildTag(vars)
      tagStore.tags = [...tagStore.tags, newTag]
      emit()
      options?.onSuccess?.(newTag, vars)
    },
    mutateAsync: async (vars: Omit<Tag, 'id'>) => {
      const newTag = buildTag(vars)
      tagStore.tags = [...tagStore.tags, newTag]
      emit()
      return newTag
    }
  }

  const assignMutation = {
    mutate: (vars: { tagId: string; entityId: string }, options?: any) => {
      const existing = tagStore.entityTags.get(vars.entityId) || []
      if (!existing.includes(vars.tagId)) {
        tagStore.entityTags.set(vars.entityId, [...existing, vars.tagId])
        emit()
      }
      options?.onSuccess?.({}, vars)
    }
  }

  const unassignMutation = {
    mutate: (vars: { tagId: string; entityId: string }, options?: any) => {
      const current = tagStore.entityTags.get(vars.entityId) || []
      tagStore.entityTags.set(vars.entityId, current.filter(id => id !== vars.tagId))
      emit()
      options?.onSuccess?.({}, vars)
    }
  }

  return {
    TAG_COLORS: ['#000000'],
    useTags: (entityType?: 'deal' | 'track' | 'lead' | 'global') => ({
      data: useSyncExternalStore(subscribe, () => selectTagsForEntityType(entityType)),
      isLoading: false
    }),
    useEntityTags: (entityId: string, entityType: 'deal' | 'track' | 'lead') => ({
      data: useSyncExternalStore(subscribe, () => {
        const ids = tagStore.entityTags.get(entityId) || []
        const available = selectTagsForEntityType(entityType)
        return available.filter(tag => ids.includes(tag.id))
      }),
      isLoading: false
    }),
    useTagOperations: () => ({
      create: createMutation,
      assign: assignMutation,
      unassign: unassignMutation,
      update: { mutate: vi.fn() },
      remove: { mutate: vi.fn() }
    })
  }
})

vi.mock('@/services/leadService', () => ({
  useLead: () => ({ data: leadFixture, isLoading: false }),
  useUpdateLead: () => ({ mutateAsync: vi.fn() }),
  useDeleteLead: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useLeadContacts: () => ({ addContact: vi.fn(), removeContact: vi.fn() }),
  addLeadMember: vi.fn(),
  removeLeadMember: vi.fn()
}))

vi.mock('@/hooks/useSystemMetadata', () => ({
  useSystemMetadata: () => ({
    leadStatuses: [],
    leadOrigins: [],
    leadMemberRoles: [],
    dealStatuses: [],
    stages: [],
    companyTypes: [],
    relationshipLevels: [],
    userRoleMetadata: [],
    isLoading: false,
    error: null,
    refreshMetadata: vi.fn()
  })
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', name: 'Test User' } })
}))

vi.mock('@/components/CommentsPanel', () => ({ default: () => <div>Comments</div> }))
vi.mock('@/features/leads/components/QualifyLeadDialog', () => ({
  QualifyLeadDialog: () => <div>Qualify Lead</div>
}))

vi.mock('@/features/rbac/components/RequirePermission', () => ({
  RequirePermission: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

describe('LeadDetailPage tagging', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    resetStore()
  })

  it('creates and assigns a lead tag that is rendered in the detail view', async () => {
    const user = userEvent.setup()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/leads/${leadFixture.id}`]}>
          <Routes>
            <Route path="/leads/:id" element={<LeadDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    await user.click(screen.getByRole('button', { name: /tags/i }))

    const input = await screen.findByPlaceholderText(/buscar ou criar tag/i)
    await user.type(input, 'Lead VIP')

    const createButton = await screen.findByRole('button', { name: /criar "lead vip"/i })
    await user.click(createButton)

    expect(await screen.findByText('Lead VIP')).toBeInTheDocument()
  })
})
