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
})
