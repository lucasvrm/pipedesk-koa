import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeadDetailQuickActions } from '@/features/leads/components/LeadDetailQuickActions'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/utils/googleLinks', () => ({
  getGmailComposeUrl: vi.fn((email) => `https://mail.google.com/mail/?view=cm&to=${email}`),
  getWhatsAppWebUrl: vi.fn((phone) => `https://wa.me/${phone}`),
  cleanPhoneNumber: vi.fn((phone) => ({ cleanPhone: phone.replace(/\D/g, ''), isValid: true })),
}))

vi.mock('@/services/driveService', () => ({
  getRootFolderUrl: vi.fn().mockResolvedValue({ url: 'https://drive.google.com/folder', created: false }),
}))

// Mock Tooltip to avoid ResizeObserver issues
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span data-testid="tooltip-content">{children}</span>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock DropdownMenu to test kebab menu
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: (e: React.MouseEvent) => void; disabled?: boolean }) => (
    <button data-testid="dropdown-menu-item" onClick={onClick} disabled={disabled}>{children}</button>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu-label">{children}</div>,
  DropdownMenuSeparator: () => <hr data-testid="dropdown-menu-separator" />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('LeadDetailQuickActions', () => {
  const defaultProps = {
    leadId: 'lead-123',
    primaryContact: {
      id: 'contact-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('open', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders tooltip content for WhatsApp, Email, and Drive', () => {
    render(<LeadDetailQuickActions {...defaultProps} />)
    
    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('E-mail')).toBeInTheDocument()
    expect(screen.getByText('Drive')).toBeInTheDocument()
  })

  it('renders kebab menu with dropdown', () => {
    render(<LeadDetailQuickActions {...defaultProps} />)
    
    expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
  })

  it('renders icon-only buttons for quick actions', () => {
    render(<LeadDetailQuickActions {...defaultProps} />)
    
    // We have 4 buttons: kebab menu + 3 quick action buttons (WhatsApp, Email, Drive)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(4)
  })

  it('disables buttons when contact info is not available', () => {
    const propsWithoutContactInfo = {
      ...defaultProps,
      primaryContact: {
        id: 'contact-1',
        name: 'John Doe',
        email: null,
        phone: null,
      },
    }
    
    render(<LeadDetailQuickActions {...propsWithoutContactInfo} />)
    
    // Get all buttons and check that some are disabled
    const buttons = screen.getAllByRole('button')
    const disabledButtons = buttons.filter(btn => btn.hasAttribute('disabled'))
    expect(disabledButtons.length).toBeGreaterThan(0)
  })

  describe('Kebab Menu Actions', () => {
    it('renders Qualificar menu item', () => {
      render(<LeadDetailQuickActions {...defaultProps} onQualify={() => {}} />)
      
      expect(screen.getByText('Qualificar')).toBeInTheDocument()
    })

    it('renders Editar menu item', () => {
      render(<LeadDetailQuickActions {...defaultProps} onEdit={() => {}} />)
      
      expect(screen.getByText('Editar')).toBeInTheDocument()
    })

    it('renders Mudar Dono menu item', () => {
      render(<LeadDetailQuickActions {...defaultProps} onChangeOwner={() => {}} canChangeOwner />)
      
      expect(screen.getByText('Mudar Dono')).toBeInTheDocument()
    })

    it('disables Mudar Dono when canChangeOwner is false', () => {
      render(<LeadDetailQuickActions {...defaultProps} onChangeOwner={() => {}} canChangeOwner={false} />)
      
      const changeOwnerItem = screen.getByText('Mudar Dono').closest('button')
      expect(changeOwnerItem).toBeDisabled()
    })

    it('renders Excluir Lead menu item', () => {
      render(<LeadDetailQuickActions {...defaultProps} onDelete={() => {}} />)
      
      expect(screen.getByText('Excluir Lead')).toBeInTheDocument()
    })

    it('calls onQualify when Qualificar is clicked', async () => {
      const handleQualify = vi.fn()
      const user = userEvent.setup()
      
      render(<LeadDetailQuickActions {...defaultProps} onQualify={handleQualify} />)
      
      await user.click(screen.getByText('Qualificar'))
      
      expect(handleQualify).toHaveBeenCalledTimes(1)
    })

    it('renders dropdown menu with Ações label', () => {
      render(<LeadDetailQuickActions {...defaultProps} onQualify={() => {}} />)
      
      expect(screen.getByText('Ações')).toBeInTheDocument()
    })

    it('renders Nova Tarefa and Add Contato menu items', () => {
      render(
        <LeadDetailQuickActions
          {...defaultProps}
          onAddTask={() => {}}
          onAddContact={() => {}}
        />
      )

      expect(screen.getByText('Nova Tarefa')).toBeInTheDocument()
      expect(screen.getByText('Add Contato')).toBeInTheDocument()
    })
  })
})
