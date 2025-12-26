import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface HorizontalScrollbarMirrorProps {
  targetRef: React.RefObject<HTMLDivElement>
  className?: string
}

/**
 * A mirror scrollbar component that stays fixed at the bottom of the panel
 * and syncs horizontally with the target scrollable container.
 * 
 * This component renders ONLY when target.scrollWidth > target.clientWidth.
 */
export function HorizontalScrollbarMirror({ targetRef, className }: HorizontalScrollbarMirrorProps) {
  const mirrorRef = useRef<HTMLDivElement>(null)
  const mirrorContentRef = useRef<HTMLDivElement>(null)
  const [showMirror, setShowMirror] = useState(false)
  const [contentWidth, setContentWidth] = useState(0)

  const syncMirrorState = useCallback(() => {
    const target = targetRef.current
    if (!target) {
      setShowMirror(false)
      return
    }

    const needsMirror = target.scrollWidth > target.clientWidth + 1
    setShowMirror(needsMirror)
    setContentWidth(target.scrollWidth)
  }, [targetRef])

  useEffect(() => {
    syncMirrorState()

    const target = targetRef.current
    const mirror = mirrorRef.current

    if (!target) return

    const handleTargetScroll = () => {
      if (mirror && mirror.scrollLeft !== target.scrollLeft) {
        mirror.scrollLeft = target.scrollLeft
      }
    }

    const handleMirrorScroll = () => {
      if (target && target.scrollLeft !== (mirror?.scrollLeft ?? 0)) {
        target.scrollLeft = mirror?.scrollLeft ?? 0
      }
    }

    // Initial sync
    handleTargetScroll()

    target.addEventListener('scroll', handleTargetScroll)
    mirror?.addEventListener('scroll', handleMirrorScroll)
    window.addEventListener('resize', syncMirrorState)

    return () => {
      target.removeEventListener('scroll', handleTargetScroll)
      mirror?.removeEventListener('scroll', handleMirrorScroll)
      window.removeEventListener('resize', syncMirrorState)
    }
  }, [targetRef, syncMirrorState])

  // Use ResizeObserver to detect size changes
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    const target = targetRef.current
    if (!target) return

    const observer = new ResizeObserver(() => syncMirrorState())
    observer.observe(target)

    return () => observer.disconnect()
  }, [targetRef, syncMirrorState])

  if (!showMirror) return null

  return (
    <div
      data-testid="horizontal-scrollbar-mirror"
      className={cn(
        'border-t border-border bg-background',
        className
      )}
    >
      <div
        ref={mirrorRef}
        className="overflow-x-auto"
        data-testid="horizontal-scrollbar-mirror-scroll"
      >
        <div
          ref={mirrorContentRef}
          className="h-4"
          style={{ width: contentWidth }}
        />
      </div>
    </div>
  )
}
