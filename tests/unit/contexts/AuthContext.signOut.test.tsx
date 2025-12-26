import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ReactNode } from 'react'
import * as supabaseClient from '@/lib/supabaseClient'

// Mock the supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }
}))

// Mock the settings service
vi.mock('@/services/settingsService', () => ({
  getAuthSettings: vi.fn(() => Promise.resolve({
    enableMagicLinks: true,
    restrictDomain: false,
    allowedDomain: null
  }))
}))

describe('AuthContext - signOut', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock behavior for onAuthStateChange
    const mockUnsubscribe = vi.fn()
    vi.mocked(supabaseClient.supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe
        }
      }
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call supabase.auth.signOut with scope: local', async () => {
    const mockSignOut = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabaseClient.supabase.auth.signOut).mockImplementation(mockSignOut)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('should return true when signOut succeeds', async () => {
    vi.mocked(supabaseClient.supabase.auth.signOut).mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAuth(), { wrapper })

    let signOutResult: boolean | undefined

    await act(async () => {
      signOutResult = await result.current.signOut()
    })

    expect(signOutResult).toBe(true)
  })

  it('should clear user, profile, and session state after signOut', async () => {
    vi.mocked(supabaseClient.supabase.auth.signOut).mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.signOut()
    })

    await waitFor(() => {
      expect(result.current.user).toBeNull()
      expect(result.current.profile).toBeNull()
      expect(result.current.session).toBeNull()
    })
  })

  it('should return true when signOut fails but session is actually cleared (idempotent)', async () => {
    const mockError = new Error('403 Forbidden')
    vi.mocked(supabaseClient.supabase.auth.signOut).mockResolvedValue({ error: mockError as any })
    vi.mocked(supabaseClient.supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    } as any)

    const { result } = renderHook(() => useAuth(), { wrapper })

    let signOutResult: boolean | undefined

    await act(async () => {
      signOutResult = await result.current.signOut()
    })

    expect(signOutResult).toBe(true)
    expect(supabaseClient.supabase.auth.getSession).toHaveBeenCalled()
  })

  it('should return false when signOut fails and session still exists', async () => {
    const mockError = new Error('Network error')
    const mockSession = {
      access_token: 'token123',
      user: { id: 'user123' }
    }

    vi.mocked(supabaseClient.supabase.auth.signOut).mockResolvedValue({ error: mockError as any })
    vi.mocked(supabaseClient.supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null
    } as any)

    const { result } = renderHook(() => useAuth(), { wrapper })

    let signOutResult: boolean | undefined

    await act(async () => {
      signOutResult = await result.current.signOut()
    })

    expect(signOutResult).toBe(false)
    expect(result.current.error).toBeTruthy()
  })

  it('should set error state when signOut fails with active session', async () => {
    const mockError = new Error('Failed to sign out')
    const mockSession = {
      access_token: 'token123',
      user: { id: 'user123' }
    }

    vi.mocked(supabaseClient.supabase.auth.signOut).mockResolvedValue({ error: mockError as any })
    vi.mocked(supabaseClient.supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null
    } as any)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.signOut()
    })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toContain('Falha ao sair')
    })
  })

  it('should clear loadedProfileId ref on signOut', async () => {
    vi.mocked(supabaseClient.supabase.auth.signOut).mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.signOut()
    })

    // State should be cleared
    await waitFor(() => {
      expect(result.current.profile).toBeNull()
    })
  })

  it('should set loading to false after signOut completes', async () => {
    vi.mocked(supabaseClient.supabase.auth.signOut).mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.signOut()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('should handle signOut when already signed out (idempotent check)', async () => {
    vi.mocked(supabaseClient.supabase.auth.signOut).mockResolvedValue({ error: null })
    vi.mocked(supabaseClient.supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    } as any)

    const { result } = renderHook(() => useAuth(), { wrapper })

    let firstResult: boolean | undefined
    let secondResult: boolean | undefined

    await act(async () => {
      firstResult = await result.current.signOut()
    })

    await act(async () => {
      secondResult = await result.current.signOut()
    })

    expect(firstResult).toBe(true)
    expect(secondResult).toBe(true)
  })

  it('should clear error state before attempting signOut', async () => {
    vi.mocked(supabaseClient.supabase.auth.signOut).mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Simulate an existing error
    await act(async () => {
      vi.mocked(supabaseClient.supabase.auth.signOut).mockResolvedValueOnce({ 
        error: new Error('Previous error') as any 
      })
      vi.mocked(supabaseClient.supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: { access_token: 'token' } },
        error: null
      } as any)
      await result.current.signOut()
    })

    // Now signOut should succeed and clear the error
    vi.mocked(supabaseClient.supabase.auth.signOut).mockResolvedValue({ error: null })
    
    await act(async () => {
      await result.current.signOut()
    })

    await waitFor(() => {
      expect(result.current.error).toBeNull()
    })
  })
})
