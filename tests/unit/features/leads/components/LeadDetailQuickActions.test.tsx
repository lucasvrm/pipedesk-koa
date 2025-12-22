import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeadDetailQuickActions } from '@/features/leads/components/LeadDetailQuickActions'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/utils/googleLinks', () => ({
  getGmailComposeUrl: vi.fn((email, subject) => `https://mail.google.com/mail/?view=cm&to=${email}`),
  getWhatsAppWebUrl: vi.fn((phone) => `https://wa.me/${phone}`),
  cleanPhoneNumber: vi.fn((phone) => ({ cleanPhone: phone.replace(/\D/g, ''), isValid: true })),
}))

vi.mock('@/services/driveService', () => ({
  getRootFolderUrl: vi.fn().mockResolvedValue({ url: 'https://drive.google.com/folder', created: false }),
}))

vi.mock('@/lib/driveClient', () => ({
  DriveApiError: class DriveApiError extends Error {
    statusCode: number
    constructor(message: string, statusCode: number) {
      super(message)
      this.statusCode = statusCode
    }
  },
}))

// Mock Tooltip to avoid ResizeObserver issues
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
}))

// Mock DropdownMenu to test kebab menu
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick, onSelect, disabled }: { children: React.ReactNode; onClick?: (e: React.MouseEvent) => void; onSelect?: (e: Event) => void; disabled?: boolean }) => (
    <button
      data-testid="dropdown-menu-item"
      onClick={(e) => {
        if (onClick) onClick(e)
        if (onSelect) {
          // Simulate Radix onSelect behavior - create a synthetic Event with preventDefault
          const syntheticEvent = { preventDefault: vi.fn() } as unknown as Event
          onSelect(syntheticEvent)
        }
      }}
      disabled={disabled}
    >
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu-label">{children}</div>,
  DropdownMenuSeparator: () => <hr data-testid="dropdown-menu-separator" />,
  DropdownMenuTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
}))

describe('LeadDetailQuickActions', () => {
  const defaultProps = {
    leadId: 'lead-123',
    leadName: 'Test Lead',
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
    // Mock requestAnimationFrame to execute callbacks immediately for testing
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 0
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders all quick action buttons', () => {
    render(<LeadDetailQuickActions {...defaultProps} />)
    
    expect(screen.getByTestId('quick-action-whatsapp')).toBeInTheDocument()
    expect(screen.getByTestId('quick-action-email')).toBeInTheDocument()
    expect(screen.getByTestId('quick-action-phone')).toBeInTheDocument()
    expect(screen.getByTestId('quick-action-drive')).toBeInTheDocument()
    expect(screen.getByTestId('quick-action-schedule')).toBeInTheDocument()
    expect(screen.getByTestId('quick-action-copy-id')).toBeInTheDocument()
  })

  it('renders kebab menu button', () => {
    render(<LeadDetailQuickActions {...defaultProps} />)
    
    expect(screen.getByTestId('quick-action-kebab')).toBeInTheDocument()
    expect(screen.getByLabelText('Mais ações')).toBeInTheDocument()
  })

  it('renders with accessible labels', () => {
    render(<LeadDetailQuickActions {...defaultProps} />)
    
    expect(screen.getByLabelText('Enviar WhatsApp')).toBeInTheDocument()
    expect(screen.getByLabelText('Enviar E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Ligar')).toBeInTheDocument()
    expect(screen.getByLabelText('Drive')).toBeInTheDocument()
    expect(screen.getByLabelText('Agendar Reunião')).toBeInTheDocument()
    expect(screen.getByLabelText('Copiar ID')).toBeInTheDocument()
  })

  it('disables WhatsApp button when no phone available', () => {
    const propsWithoutPhone = {
      ...defaultProps,
      primaryContact: {
        id: 'contact-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: null,
      },
    }
    
    render(<LeadDetailQuickActions {...propsWithoutPhone} />)
    
    const whatsappButton = screen.getByTestId('quick-action-whatsapp')
    expect(whatsappButton).toBeDisabled()
  })

  it('disables Email button when no email available', () => {
    const propsWithoutEmail = {
      ...defaultProps,
      primaryContact: {
        id: 'contact-1',
        name: 'John Doe',
        email: null,
        phone: '+1234567890',
      },
    }
    
    render(<LeadDetailQuickActions {...propsWithoutEmail} />)
    
    const emailButton = screen.getByTestId('quick-action-email')
    expect(emailButton).toBeDisabled()
  })

  it('calls onScheduleClick when schedule button is clicked', async () => {
    const handleSchedule = vi.fn()
    const user = userEvent.setup()
    
    render(<LeadDetailQuickActions {...defaultProps} onScheduleClick={handleSchedule} />)
    
    await user.click(screen.getByTestId('quick-action-schedule'))
    
    expect(handleSchedule).toHaveBeenCalledTimes(1)
  })

  it('shows info toast when schedule button is clicked without handler', async () => {
    const user = userEvent.setup()
    
    render(<LeadDetailQuickActions {...defaultProps} />)
    
    await user.click(screen.getByTestId('quick-action-schedule'))
    
    expect(toast.info).toHaveBeenCalledWith('Integração de calendário em breve')
  })

  it('renders visible text labels for quick action buttons', () => {
    render(<LeadDetailQuickActions {...defaultProps} />)
    
    // Check that visible labels are rendered (not just icons)
    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('E-mail')).toBeInTheDocument()
    expect(screen.getByText('Ligar')).toBeInTheDocument()
    expect(screen.getByText('Drive')).toBeInTheDocument()
    expect(screen.getByText('Agendar')).toBeInTheDocument()
    expect(screen.getByText('Copiar ID')).toBeInTheDocument()
  })

  describe('Kebab Menu Actions', () => {
    it('renders Qualificar menu item when onQualify is provided', () => {
      const handleQualify = vi.fn()
      render(<LeadDetailQuickActions {...defaultProps} onQualify={handleQualify} />)
      
      expect(screen.getByText('Qualificar')).toBeInTheDocument()
    })

    it('renders Editar menu item when onEdit is provided', () => {
      const handleEdit = vi.fn()
      render(<LeadDetailQuickActions {...defaultProps} onEdit={handleEdit} />)
      
      expect(screen.getByText('Editar')).toBeInTheDocument()
    })

    it('renders Alterar Responsável menu item when onChangeOwner is provided', () => {
      const handleChangeOwner = vi.fn()
      render(<LeadDetailQuickActions {...defaultProps} onChangeOwner={handleChangeOwner} canChangeOwner />)
      
      expect(screen.getByText('Alterar Responsável')).toBeInTheDocument()
    })

    it('disables Alterar Responsável when canChangeOwner is false', () => {
      const handleChangeOwner = vi.fn()
      render(<LeadDetailQuickActions {...defaultProps} onChangeOwner={handleChangeOwner} canChangeOwner={false} />)
      
      const changeOwnerItem = screen.getByText('Alterar Responsável').closest('button')
      expect(changeOwnerItem).toBeDisabled()
    })

    it('renders Gerenciar Tags menu item when onManageTags is provided', () => {
      const handleManageTags = vi.fn()
      render(<LeadDetailQuickActions {...defaultProps} onManageTags={handleManageTags} />)
      
      expect(screen.getByText('Gerenciar Tags')).toBeInTheDocument()
    })

    it('renders Excluir Lead menu item when onDelete is provided', () => {
      const handleDelete = vi.fn()
      render(<LeadDetailQuickActions {...defaultProps} onDelete={handleDelete} />)
      
      expect(screen.getByText('Excluir Lead')).toBeInTheDocument()
    })

    it('calls onQualify when Qualificar is clicked', async () => {
      const handleQualify = vi.fn()
      const user = userEvent.setup()
      
      render(<LeadDetailQuickActions {...defaultProps} onQualify={handleQualify} />)
      
      await user.click(screen.getByText('Qualificar'))
      
      expect(handleQualify).toHaveBeenCalledTimes(1)
    })

    it('renders dropdown menu labels for categories', () => {
      render(
        <LeadDetailQuickActions
          {...defaultProps}
          onQualify={() => {}}
          onAddMember={() => {}}
          onManageTags={() => {}}
        />
      )
      
      expect(screen.getByText('Ações')).toBeInTheDocument()
      expect(screen.getByText('Gerenciar')).toBeInTheDocument()
      expect(screen.getByText('Organização')).toBeInTheDocument()
    })

    it('renders new kebab actions when handlers are provided', () => {
      render(
        <LeadDetailQuickActions
          {...defaultProps}
          onQualify={() => {}}
          onAddTask={() => {}}
          onAddContact={() => {}}
        />
      )

      expect(screen.getByText('Adicionar Tarefa')).toBeInTheDocument()
      expect(screen.getByText('Adicionar Contato')).toBeInTheDocument()
    })

    it('calls onManageTags exactly once when Gerenciar Tags is clicked', async () => {
      const handleManageTags = vi.fn()
      const user = userEvent.setup()
      
      render(<LeadDetailQuickActions {...defaultProps} onManageTags={handleManageTags} />)
      
      await user.click(screen.getByText('Gerenciar Tags'))
      
      // Verify handler is called exactly once (no double trigger that would cause modal to close)
      expect(handleManageTags).toHaveBeenCalledTimes(1)
    })

    it('calls onDelete exactly once when Excluir Lead is clicked', async () => {
      const handleDelete = vi.fn()
      const user = userEvent.setup()
      
      render(<LeadDetailQuickActions {...defaultProps} onDelete={handleDelete} />)
      
      await user.click(screen.getByText('Excluir Lead'))
      
      expect(handleDelete).toHaveBeenCalledTimes(1)
    })
  })
})
