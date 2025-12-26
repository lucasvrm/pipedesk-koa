import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginView from '@/features/rbac/components/LoginView'
import { useAuth } from '@/contexts/AuthContext'

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn()
  }
}))

describe('LoginView', () => {
  const mockSignIn = vi.fn()
  const mockSignInWithGoogle = vi.fn()
  const mockResetPassword = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as any).mockReturnValue({
      signIn: mockSignIn,
      signInWithGoogle: mockSignInWithGoogle,
      resetPassword: mockResetPassword,
      loading: false
    })
  })

  describe('Login View', () => {
    it('renders login view with email and password fields', () => {
      render(<LoginView />)

      expect(screen.getByText('PipeDesk Koa')).toBeInTheDocument()
      expect(screen.getByText('Acesso ao Sistema de DealFlow')).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
    })

    it('renders Google login button', () => {
      render(<LoginView />)

      expect(screen.getByRole('button', { name: /google workspace/i })).toBeInTheDocument()
    })

    it('renders forgot password link', () => {
      render(<LoginView />)

      expect(screen.getByRole('button', { name: /esqueceu\?/i })).toBeInTheDocument()
    })

    it('submits login form with email and password', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({})
      
      render(<LoginView />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)
      const submitButton = screen.getByRole('button', { name: /entrar/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('calls signInWithGoogle when Google button is clicked', async () => {
      const user = userEvent.setup()
      mockSignInWithGoogle.mockResolvedValue({})
      
      render(<LoginView />)

      const googleButton = screen.getByRole('button', { name: /google workspace/i })
      await user.click(googleButton)

      expect(mockSignInWithGoogle).toHaveBeenCalled()
    })
  })

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility when eye button is clicked', async () => {
      const user = userEvent.setup()
      
      render(<LoginView />)

      const passwordInput = screen.getByLabelText(/senha/i) as HTMLInputElement
      expect(passwordInput.type).toBe('password')

      const toggleButton = screen.getByRole('button', { name: /mostrar senha/i })
      await user.click(toggleButton)

      expect(passwordInput.type).toBe('text')

      const hideButton = screen.getByRole('button', { name: /ocultar senha/i })
      await user.click(hideButton)

      expect(passwordInput.type).toBe('password')
    })
  })

  describe('Password Reset Flow', () => {
    it('navigates to reset view when "Esqueceu?" is clicked', async () => {
      const user = userEvent.setup()
      
      render(<LoginView />)

      const forgotButton = screen.getByRole('button', { name: /esqueceu\?/i })
      await user.click(forgotButton)

      expect(screen.getByText('Recuperar Senha')).toBeInTheDocument()
      expect(screen.getByText(/enviaremos um link de recuperação/i)).toBeInTheDocument()
    })

    it('renders reset password form with email field', async () => {
      const user = userEvent.setup()
      
      render(<LoginView />)

      const forgotButton = screen.getByRole('button', { name: /esqueceu\?/i })
      await user.click(forgotButton)

      expect(screen.getByRole('button', { name: /enviar link de recuperação/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument()
    })

    it('submits reset password and shows success view', async () => {
      const user = userEvent.setup()
      mockResetPassword.mockResolvedValue({})
      
      render(<LoginView />)

      // Navigate to reset view
      const forgotButton = screen.getByRole('button', { name: /esqueceu\?/i })
      await user.click(forgotButton)

      // Fill email and submit
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: /enviar link de recuperação/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('test@example.com')
      })

      // Check success view
      await waitFor(() => {
        expect(screen.getByText('Email Enviado!')).toBeInTheDocument()
        expect(screen.getByText(/verifique sua caixa de entrada/i)).toBeInTheDocument()
      })
    })

    it('returns to login from reset view when "Voltar" is clicked', async () => {
      const user = userEvent.setup()
      
      render(<LoginView />)

      // Navigate to reset view
      const forgotButton = screen.getByRole('button', { name: /esqueceu\?/i })
      await user.click(forgotButton)

      // Click back button
      const backButton = screen.getByRole('button', { name: /voltar/i })
      await user.click(backButton)

      // Should be back on login view
      expect(screen.getByText('PipeDesk Koa')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
    })

    it('returns to login from success view when button is clicked', async () => {
      const user = userEvent.setup()
      mockResetPassword.mockResolvedValue({})
      
      render(<LoginView />)

      // Navigate to reset view
      const forgotButton = screen.getByRole('button', { name: /esqueceu\?/i })
      await user.click(forgotButton)

      // Submit reset
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'test@example.com')
      const submitButton = screen.getByRole('button', { name: /enviar link de recuperação/i })
      await user.click(submitButton)

      // Wait for success view
      await waitFor(() => {
        expect(screen.getByText('Email Enviado!')).toBeInTheDocument()
      })

      // Click back to login
      const backToLoginButton = screen.getByRole('button', { name: /voltar ao login/i })
      await user.click(backToLoginButton)

      // Should be back on login view
      expect(screen.getByText('PipeDesk Koa')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('disables buttons when auth is loading', () => {
      ;(useAuth as any).mockReturnValue({
        signIn: mockSignIn,
        signInWithGoogle: mockSignInWithGoogle,
        resetPassword: mockResetPassword,
        loading: true
      })
      
      render(<LoginView />)

      const submitButton = screen.getByRole('button', { name: /entrar/i })
      const googleButton = screen.getByRole('button', { name: /google workspace/i })

      expect(submitButton).toBeDisabled()
      expect(googleButton).toBeDisabled()
    })

    it('shows loading state when submitting login', async () => {
      const user = userEvent.setup()
      let resolveSignIn: any
      mockSignIn.mockReturnValue(new Promise(resolve => {
        resolveSignIn = resolve
      }))
      
      render(<LoginView />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: /entrar/i })
      await user.click(submitButton)

      expect(screen.getByText(/entrando\.\.\./i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      resolveSignIn({})
      await waitFor(() => {
        expect(screen.queryByText(/entrando\.\.\./i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper labels for inputs', () => {
      render(<LoginView />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('has aria-label for password toggle button', () => {
      render(<LoginView />)

      const toggleButton = screen.getByRole('button', { name: /mostrar senha/i })
      expect(toggleButton).toHaveAttribute('aria-label')
    })
  })
})
