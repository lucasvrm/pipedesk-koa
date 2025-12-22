import React from 'react'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChangeOwnerDialog } from '@/features/leads/components/ChangeOwnerDialog'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Lead, User } from '@/lib/types'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/services/leadService', () => ({
  useUpdateLead: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
  addLeadMember: vi.fn().mockResolvedValue({}),
  LEADS_KEY: ['leads'],
  LEADS_SALES_VIEW_KEY: ['leads', 'sales-view'],
  LEADS_SALES_VIEW_ALT_KEY: ['leads-sales-view'],
}))

vi.mock('@/services/activityService', () => ({
  logActivity: vi.fn().mockResolvedValue({}),
}))

// Mock cmdk Command components to avoid ResizeObserver issues
vi.mock('@/components/ui/command', () => ({
  Command: ({ children, className }: { children: React.ReactNode; className?: string; shouldFilter?: boolean }) => (
    <div data-testid="command" className={className}>{children}</div>
  ),
  CommandInput: ({ placeholder, value, onValueChange }: { placeholder?: string; value?: string; onValueChange?: (value: string) => void }) => (
    <input
      data-testid="command-input"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
    />
  ),
  CommandList: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="command-list" className={className}>{children}</div>
  ),
  CommandEmpty: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="command-empty" className={className}>{children}</div>
  ),
  CommandGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="command-group">{children}</div>
  ),
  CommandItem: ({ children, value, onSelect, className }: { children: React.ReactNode; value?: string; onSelect?: () => void; className?: string }) => (
    <div
      data-testid={`command-item-${value}`}
      onClick={onSelect}
      className={className}
      role="option"
    >
      {children}
    </div>
  ),
}))

// Create a wrapper with QueryClientProvider for tests
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mockLead: Lead = {
  id: 'lead-123',
  legalName: 'Test Lead Company',
  ownerUserId: 'user-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'user-1',
}

const mockUsers: User[] = [
  { id: 'user-1', name: 'Current Owner', email: 'current@example.com' },
  { id: 'user-2', name: 'New Owner', email: 'new@example.com' },
  { id: 'user-3', name: 'Another User', email: 'another@example.com' },
]

describe('ChangeOwnerDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the dialog with title and description', () => {
    render(
      <ChangeOwnerDialog
        open={true}
        onOpenChange={() => {}}
        lead={mockLead}
        availableUsers={mockUsers}
      />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Alterar Responsável')).toBeInTheDocument()
    expect(screen.getByText(/Selecione um novo responsável/)).toBeInTheDocument()
  })

  it('filters out the current owner from the user list', () => {
    render(
      <ChangeOwnerDialog
        open={true}
        onOpenChange={() => {}}
        lead={mockLead}
        availableUsers={mockUsers}
      />,
      { wrapper: createWrapper() }
    )

    // Current owner should not be in the list
    expect(screen.queryByText('Current Owner')).not.toBeInTheDocument()
    // Other users should be visible
    expect(screen.getByText('New Owner')).toBeInTheDocument()
    expect(screen.getByText('Another User')).toBeInTheDocument()
  })

  it('shows selected owner preview when a user is selected', async () => {
    const user = userEvent.setup()
    
    render(
      <ChangeOwnerDialog
        open={true}
        onOpenChange={() => {}}
        lead={mockLead}
        availableUsers={mockUsers}
      />,
      { wrapper: createWrapper() }
    )

    // Click on "New Owner" to select
    await user.click(screen.getByText('New Owner'))

    // Wait for the selected owner preview to appear
    await waitFor(() => {
      expect(screen.getByTestId('selected-owner-preview')).toBeInTheDocument()
    })

    // Preview should show the selected owner's name
    expect(screen.getByText('Novo responsável:')).toBeInTheDocument()
  })

  it('renders the keep as member checkbox when lead has a current owner', () => {
    render(
      <ChangeOwnerDialog
        open={true}
        onOpenChange={() => {}}
        lead={mockLead}
        availableUsers={mockUsers}
      />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Manter responsável anterior como membro')).toBeInTheDocument()
  })

  it('keeps confirm button disabled until a user is selected', () => {
    render(
      <ChangeOwnerDialog
        open={true}
        onOpenChange={() => {}}
        lead={mockLead}
        availableUsers={mockUsers}
      />,
      { wrapper: createWrapper() }
    )

    const confirmButton = screen.getByRole('button', { name: 'Confirmar' })
    expect(confirmButton).toBeDisabled()
  })

  it('enables confirm button when a user is selected', async () => {
    const user = userEvent.setup()
    
    render(
      <ChangeOwnerDialog
        open={true}
        onOpenChange={() => {}}
        lead={mockLead}
        availableUsers={mockUsers}
      />,
      { wrapper: createWrapper() }
    )

    await user.click(screen.getByText('New Owner'))

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: 'Confirmar' })
      expect(confirmButton).not.toBeDisabled()
    })
  })

  it('allows searching users by name', async () => {
    const user = userEvent.setup()
    
    render(
      <ChangeOwnerDialog
        open={true}
        onOpenChange={() => {}}
        lead={mockLead}
        availableUsers={mockUsers}
      />,
      { wrapper: createWrapper() }
    )

    const searchInput = screen.getByPlaceholderText(/Buscar usuário/)
    await user.type(searchInput, 'Another')

    // Only matching user should be visible
    expect(screen.getByText('Another User')).toBeInTheDocument()
    expect(screen.queryByText('New Owner')).not.toBeInTheDocument()
  })
})
