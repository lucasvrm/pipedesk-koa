import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithOtp: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(() => Promise.resolve({ data: null, error: null })),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}))

// Mock settings service
vi.mock('@/services/settingsService', () => ({
  getAuthSettings: vi.fn(() => Promise.resolve({
    enableMagicLinks: true,
    restrictDomain: false,
    allowedDomain: null,
  })),
}))

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides authentication context to children', () => {
    const TestComponent = () => {
      const { loading, isAuthenticated } = useAuth()
      return (
        <div>
          <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
          <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toBeInTheDocument()
    expect(screen.getByTestId('authenticated')).toBeInTheDocument()
  })

  it('exposes password authentication methods', () => {
    const TestComponent = () => {
      const { signIn, signUp, resetPassword } = useAuth()
      return (
        <div>
          <div data-testid="signIn">{typeof signIn === 'function' ? 'function' : 'not function'}</div>
          <div data-testid="signUp">{typeof signUp === 'function' ? 'function' : 'not function'}</div>
          <div data-testid="resetPassword">{typeof resetPassword === 'function' ? 'function' : 'not function'}</div>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('signIn').textContent).toBe('function')
    expect(screen.getByTestId('signUp').textContent).toBe('function')
    expect(screen.getByTestId('resetPassword').textContent).toBe('function')
  })

  it('exposes magic link authentication method', () => {
    const TestComponent = () => {
      const { signInWithMagicLink } = useAuth()
      return (
        <div data-testid="signInWithMagicLink">
          {typeof signInWithMagicLink === 'function' ? 'function' : 'not function'}
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('signInWithMagicLink').textContent).toBe('function')
  })

  it('resetPassword should call resetPasswordForEmail with redirectTo ending in /reset-password', async () => {
    const TestComponent = () => {
      const { resetPassword } = useAuth()
      return (
        <button onClick={() => resetPassword('test@example.com')}>
          Reset Password
        </button>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const button = screen.getByText('Reset Password')
    button.click()

    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/reset-password')
        })
      )
    })
  })
})

