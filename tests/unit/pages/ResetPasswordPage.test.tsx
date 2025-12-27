import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import { supabase } from '@/lib/supabaseClient'
import * as AuthContext from '@/contexts/AuthContext'

const mockNavigate = vi.fn()

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}))

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock BrandMark component
vi.mock('@/components/BrandMark', () => ({
  BrandMark: () => <div data-testid="brand-mark">Brand</div>,
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('ResetPasswordPage', () => {
  const mockSession = {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    user: { id: 'test-user-id', email: 'test@example.com' },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    
    // Mock window.history.replaceState
    global.window = Object.create(window)
    Object.defineProperty(window, 'history', {
      value: {
        replaceState: vi.fn(),
      },
      writable: true,
    })
    
    Object.defineProperty(window, 'location', {
      value: {
        hash: '',
        pathname: '/reset-password',
      },
      writable: true,
    })
  })

  it('renders loading state initially', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      session: null,
    } as any)
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any)

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Verificando link...')).toBeInTheDocument()
  })

  it('renders invalid state when no session exists', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      session: null,
    } as any)
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any)

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Link Expirado')).toBeInTheDocument()
    })

    expect(screen.getByText('Voltar ao Login')).toBeInTheDocument()
  })

  it('renders form when valid session exists', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      session: mockSession,
    } as any)
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any)

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Criar nova senha')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Nova senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar nova senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /salvar nova senha/i })).toBeInTheDocument()
  })

  it('shows password strength and requirements', async () => {
    const user = userEvent.setup()

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      session: mockSession,
    } as any)
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any)

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Nova senha')).toBeInTheDocument()
    })

    const newPasswordInput = screen.getByLabelText('Nova senha')

    // Type weak password
    await user.type(newPasswordInput, 'abc')
    
    await waitFor(() => {
      expect(screen.getByText('Força da senha:')).toBeInTheDocument()
      expect(screen.getByText('Fraca')).toBeInTheDocument()
    })

    // Clear and type stronger password
    await user.clear(newPasswordInput)
    await user.type(newPasswordInput, 'Password123')
    
    await waitFor(() => {
      expect(screen.getByText('Forte')).toBeInTheDocument()
    })

    // Check requirements
    expect(screen.getByText('Mínimo de 8 caracteres')).toBeInTheDocument()
    expect(screen.getByText('Uma letra maiúscula')).toBeInTheDocument()
    expect(screen.getByText('Um número')).toBeInTheDocument()
  })

  it('disables submit button until requirements are met', async () => {
    const user = userEvent.setup()

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      session: mockSession,
    } as any)
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any)

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Nova senha')).toBeInTheDocument()
    })

    const newPasswordInput = screen.getByLabelText('Nova senha')
    const confirmPasswordInput = screen.getByLabelText('Confirmar nova senha')
    const submitButton = screen.getByRole('button', { name: /salvar nova senha/i })

    // Initially disabled
    expect(submitButton).toBeDisabled()

    // Type weak password
    await user.type(newPasswordInput, 'weak')
    await user.type(confirmPasswordInput, 'weak')

    // Still disabled (requirements not met)
    expect(submitButton).toBeDisabled()

    // Type strong password
    await user.clear(newPasswordInput)
    await user.clear(confirmPasswordInput)
    await user.type(newPasswordInput, 'Password123')
    await user.type(confirmPasswordInput, 'Password123')

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('shows error message when passwords do not match', async () => {
    const user = userEvent.setup()

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      session: mockSession,
    } as any)
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any)

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Nova senha')).toBeInTheDocument()
    })

    const newPasswordInput = screen.getByLabelText('Nova senha')
    const confirmPasswordInput = screen.getByLabelText('Confirmar nova senha')

    await user.type(newPasswordInput, 'Password123')
    await user.type(confirmPasswordInput, 'Different123')

    await waitFor(() => {
      expect(screen.getByText('As senhas não coincidem')).toBeInTheDocument()
    })
  })

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup()

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      session: mockSession,
    } as any)
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any)

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Nova senha')).toBeInTheDocument()
    })

    const newPasswordInput = screen.getByLabelText('Nova senha')
    const confirmPasswordInput = screen.getByLabelText('Confirmar nova senha')
    const submitButton = screen.getByRole('button', { name: /salvar nova senha/i })

    await user.type(newPasswordInput, 'Password123')
    await user.type(confirmPasswordInput, 'Different123')
    
    // Button should be disabled
    expect(submitButton).toBeDisabled()
  })

  it('shows error when password is too short', async () => {
    const user = userEvent.setup()

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      session: mockSession,
    } as any)
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any)

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Nova senha')).toBeInTheDocument()
    })

    const newPasswordInput = screen.getByLabelText('Nova senha')
    const confirmPasswordInput = screen.getByLabelText('Confirmar nova senha')
    const submitButton = screen.getByRole('button', { name: /salvar nova senha/i })

    await user.type(newPasswordInput, 'short')
    await user.type(confirmPasswordInput, 'short')
    
    // Button should be disabled due to requirements not met
    expect(submitButton).toBeDisabled()
  })

  it('calls updateUser and shows success state on success', async () => {
    const user = userEvent.setup()

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      session: mockSession,
    } as any)
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any)

    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: mockSession.user },
      error: null,
    } as any)

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Nova senha')).toBeInTheDocument()
    })

    const newPasswordInput = screen.getByLabelText('Nova senha')
    const confirmPasswordInput = screen.getByLabelText('Confirmar nova senha')
    const submitButton = screen.getByRole('button', { name: /salvar nova senha/i })

    await user.type(newPasswordInput, 'NewPassword123')
    await user.type(confirmPasswordInput, 'NewPassword123')
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })

    await user.click(submitButton)

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'NewPassword123'
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Senha Alterada!')).toBeInTheDocument()
      expect(screen.getByText('Ir para o Dashboard')).toBeInTheDocument()
    })
  })

  it('navigates to dashboard when clicking "Ir para o Dashboard" from success state', async () => {
    const user = userEvent.setup()

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      session: mockSession,
    } as any)
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any)

    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: mockSession.user },
      error: null,
    } as any)

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Nova senha')).toBeInTheDocument()
    })

    const newPasswordInput = screen.getByLabelText('Nova senha')
    const confirmPasswordInput = screen.getByLabelText('Confirmar nova senha')
    const submitButton = screen.getByRole('button', { name: /salvar nova senha/i })

    await user.type(newPasswordInput, 'NewPassword123')
    await user.type(confirmPasswordInput, 'NewPassword123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Senha Alterada!')).toBeInTheDocument()
    })

    const dashboardButton = screen.getByRole('button', { name: /ir para o dashboard/i })
    await user.click(dashboardButton)

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
  })

  it('navigates to login when clicking "Voltar ao Login" from invalid state', async () => {
    const user = userEvent.setup()

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      session: null,
    } as any)
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any)

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Link Expirado')).toBeInTheDocument()
    })

    const backButton = screen.getByRole('button', { name: /voltar ao login/i })
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
  })

  it('clears URL hash when valid session is detected', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        hash: '#access_token=test&type=recovery',
        pathname: '/reset-password',
      },
      writable: true,
    })

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      session: mockSession,
    } as any)
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any)

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Criar nova senha')).toBeInTheDocument()
    })

    expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/reset-password')
  })

  it('renders footer with login link', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      session: mockSession,
    } as any)
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any)

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Criar nova senha')).toBeInTheDocument()
    })

    expect(screen.getByText(/Lembrou a senha/i)).toBeInTheDocument()
    expect(screen.getByText('Fazer login')).toBeInTheDocument()
  })
})
