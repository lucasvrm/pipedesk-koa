import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'
import { ReactNode } from 'react'

describe('ThemeContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider>{children}</ThemeProvider>
  )

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('light', 'dark')
  })

  it('should provide default theme value as system', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme).toBe('system')
  })

  it('should resolve system theme to light or dark based on media query', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(['light', 'dark']).toContain(result.current.resolvedTheme)
  })

  it('should update theme to light', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.setTheme('light')
    })

    expect(result.current.theme).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('should update theme to dark', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.setTheme('dark')
    })

    expect(result.current.theme).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should persist theme to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.setTheme('dark')
    })

    expect(localStorage.getItem('pipedesk-theme')).toBe('dark')
  })

  it('should restore theme from localStorage', () => {
    localStorage.setItem('pipedesk-theme', 'dark')
    
    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme).toBe('dark')
  })

  it('should apply theme class to document root', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.setTheme('light')
    })

    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    act(() => {
      result.current.setTheme('dark')
    })

    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should throw error when used outside provider', () => {
    const originalError = console.error
    console.error = () => {}

    expect(() => {
      renderHook(() => useTheme())
    }).toThrow('useTheme must be used within a ThemeProvider')

    console.error = originalError
  })

  it('should use provided defaultTheme when no stored theme exists', () => {
    const wrapperWithDefault = ({ children }: { children: ReactNode }) => (
      <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
    )

    const { result } = renderHook(() => useTheme(), { wrapper: wrapperWithDefault })

    expect(result.current.theme).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')
  })
})
