import { describe, expect, it, vi, afterEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import { HorizontalScrollbarMirror } from '@/features/leads/components/HorizontalScrollbarMirror'

describe('HorizontalScrollbarMirror', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not render when target has no horizontal overflow', async () => {
    const targetRef = createRef<HTMLDivElement>()
    const { container } = render(
      <div>
        <div ref={targetRef} data-testid="target" style={{ width: 500 }}>
          <div style={{ width: 400 }}>Content</div>
        </div>
        <HorizontalScrollbarMirror targetRef={targetRef} />
      </div>
    )

    // Mock dimensions - no overflow
    const target = screen.getByTestId('target')
    Object.defineProperty(target, 'clientWidth', { value: 500, configurable: true })
    Object.defineProperty(target, 'scrollWidth', { value: 400, configurable: true })

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    await waitFor(() => {
      expect(screen.queryByTestId('horizontal-scrollbar-mirror')).not.toBeInTheDocument()
    })
  })

  it('renders when target has horizontal overflow', async () => {
    const targetRef = createRef<HTMLDivElement>()
    render(
      <div>
        <div ref={targetRef} data-testid="target" style={{ width: 500 }}>
          <div style={{ width: 1000 }}>Content</div>
        </div>
        <HorizontalScrollbarMirror targetRef={targetRef} />
      </div>
    )

    // Mock dimensions - with overflow
    const target = screen.getByTestId('target')
    Object.defineProperty(target, 'clientWidth', { value: 500, configurable: true })
    Object.defineProperty(target, 'scrollWidth', { value: 1000, configurable: true })

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('horizontal-scrollbar-mirror')).toBeInTheDocument()
    })
  })

  it('syncs scroll from target to mirror', async () => {
    const targetRef = createRef<HTMLDivElement>()
    render(
      <div>
        <div ref={targetRef} data-testid="target" style={{ width: 500, overflowX: 'auto' }}>
          <div style={{ width: 1000 }}>Content</div>
        </div>
        <HorizontalScrollbarMirror targetRef={targetRef} />
      </div>
    )

    // Mock dimensions
    const target = screen.getByTestId('target')
    Object.defineProperty(target, 'clientWidth', { value: 500, configurable: true })
    Object.defineProperty(target, 'scrollWidth', { value: 1000, configurable: true })

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    const mirrorWrapper = await screen.findByTestId('horizontal-scrollbar-mirror')
    const mirrorScroll = mirrorWrapper.querySelector('[data-testid="horizontal-scrollbar-mirror-scroll"]') as HTMLDivElement

    // Simulate scroll on target
    act(() => {
      target.scrollLeft = 150
      target.dispatchEvent(new Event('scroll'))
    })

    expect(mirrorScroll.scrollLeft).toBe(150)
  })

  it('syncs scroll from mirror to target', async () => {
    const targetRef = createRef<HTMLDivElement>()
    render(
      <div>
        <div ref={targetRef} data-testid="target" style={{ width: 500, overflowX: 'auto' }}>
          <div style={{ width: 1000 }}>Content</div>
        </div>
        <HorizontalScrollbarMirror targetRef={targetRef} />
      </div>
    )

    // Mock dimensions
    const target = screen.getByTestId('target')
    Object.defineProperty(target, 'clientWidth', { value: 500, configurable: true })
    Object.defineProperty(target, 'scrollWidth', { value: 1000, configurable: true })

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    const mirrorWrapper = await screen.findByTestId('horizontal-scrollbar-mirror')
    const mirrorScroll = mirrorWrapper.querySelector('[data-testid="horizontal-scrollbar-mirror-scroll"]') as HTMLDivElement

    // Simulate scroll on mirror
    act(() => {
      mirrorScroll.scrollLeft = 200
      mirrorScroll.dispatchEvent(new Event('scroll'))
    })

    expect(target.scrollLeft).toBe(200)
  })

  it('applies custom className', async () => {
    const targetRef = createRef<HTMLDivElement>()
    render(
      <div>
        <div ref={targetRef} data-testid="target" style={{ width: 500 }}>
          <div style={{ width: 1000 }}>Content</div>
        </div>
        <HorizontalScrollbarMirror targetRef={targetRef} className="custom-class" />
      </div>
    )

    // Mock dimensions
    const target = screen.getByTestId('target')
    Object.defineProperty(target, 'clientWidth', { value: 500, configurable: true })
    Object.defineProperty(target, 'scrollWidth', { value: 1000, configurable: true })

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    const mirrorWrapper = await screen.findByTestId('horizontal-scrollbar-mirror')
    expect(mirrorWrapper).toHaveClass('custom-class')
  })
})
