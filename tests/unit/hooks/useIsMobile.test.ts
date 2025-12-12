import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'
import { useIsMobile } from '@/hooks/use-mobile'

const listeners = new Set<(event: MediaQueryListEvent) => void>()
let viewportWidth = 1200

function createMatchMedia() {
  return (query: string): MediaQueryList => {
    const mql: MediaQueryList = {
      media: query,
      matches: viewportWidth <= 1023,
      onchange: null,
      addEventListener: (_event, listener) => listeners.add(listener),
      removeEventListener: (_event, listener) => listeners.delete(listener),
      dispatchEvent: () => true,
    }

    return mql
  }
}

function updateViewport(width: number) {
  viewportWidth = width
  listeners.forEach((listener) =>
    listener({ matches: width <= 1023, media: '(max-width: 1023px)' } as MediaQueryListEvent)
  )
}

describe('useIsMobile', () => {
  beforeEach(() => {
    listeners.clear()
    viewportWidth = 1200
    window.matchMedia = createMatchMedia()
  })

  it('returns false on desktop widths and true below breakpoint', async () => {
    const { result } = renderHook(() => useIsMobile())

    await waitFor(() => {
      expect(result.current).toBe(false)
    })

    act(() => updateViewport(800))

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })
})
