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
      expect(screen.getByText('Link Inválido ou Expirado')).toBeInTheDocument()
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
      expect(screen.getByText('Redefinir Senha')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Nova Senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar Nova Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /salvar nova senha/i })).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')

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
      expect(screen.getByLabelText('Nova Senha')).toBeInTheDocument()
    })

    const newPasswordInput = screen.getByLabelText('Nova Senha')
    const confirmPasswordInput = screen.getByLabelText('Confirmar Nova Senha')
    const submitButton = screen.getByRole('button', { name: /salvar nova senha/i })

    await user.type(newPasswordInput, 'newPassword123')
    await user.type(confirmPasswordInput, 'differentPassword123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Senhas não coincidem',
        expect.objectContaining({
          description: 'As senhas digitadas não são iguais.'
        })
      )
    })

    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('shows error when password is too short', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')

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
      expect(screen.getByLabelText('Nova Senha')).toBeInTheDocument()
    })

    const newPasswordInput = screen.getByLabelText('Nova Senha')
    const confirmPasswordInput = screen.getByLabelText('Confirmar Nova Senha')
    const submitButton = screen.getByRole('button', { name: /salvar nova senha/i })

    await user.type(newPasswordInput, 'short')
    await user.type(confirmPasswordInput, 'short')
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Senha muito curta',
        expect.objectContaining({
          description: 'A senha deve ter no mínimo 8 caracteres.'
        })
      )
    })

    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('calls updateUser and navigates to dashboard on success', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')

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
      expect(screen.getByLabelText('Nova Senha')).toBeInTheDocument()
    })

    const newPasswordInput = screen.getByLabelText('Nova Senha')
    const confirmPasswordInput = screen.getByLabelText('Confirmar Nova Senha')
    const submitButton = screen.getByRole('button', { name: /salvar nova senha/i })

    await user.type(newPasswordInput, 'newPassword123')
    await user.type(confirmPasswordInput, 'newPassword123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newPassword123'
      })
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Senha atualizada!',
        expect.objectContaining({
          description: 'Sua senha foi redefinida com sucesso.'
        })
      )
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
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
      expect(screen.getByText('Link Inválido ou Expirado')).toBeInTheDocument()
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
      expect(screen.getByText('Redefinir Senha')).toBeInTheDocument()
    })

    expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/reset-password')
  })
})
