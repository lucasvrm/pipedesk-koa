import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { 
  UpdatedTodayBadge, 
  NewBadge, 
  renderUpdatedTodayBadge, 
  renderNewBadge 
} from '@/components/ui/ActivityBadges'

describe('ActivityBadges', () => {
  describe('UpdatedTodayBadge', () => {
    it('should render "Atualizado hoje" text', () => {
      render(<UpdatedTodayBadge />)
      expect(screen.getByText('Atualizado hoje')).toBeInTheDocument()
    })

    it('should render with icon', () => {
      const icon = <span data-testid="update-icon">🔄</span>
      render(<UpdatedTodayBadge icon={icon} />)
      expect(screen.getByTestId('update-icon')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(<UpdatedTodayBadge className="custom-class" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('custom-class')
    })
  })

  describe('NewBadge', () => {
    it('should render "Novo" text', () => {
      render(<NewBadge />)
      expect(screen.getByText('Novo')).toBeInTheDocument()
    })

    it('should render with icon', () => {
      const icon = <span data-testid="new-icon">✨</span>
      render(<NewBadge icon={icon} />)
      expect(screen.getByTestId('new-icon')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(<NewBadge className="custom-class" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('custom-class')
    })
  })

  describe('renderUpdatedTodayBadge', () => {
    it('should render badge for today\'s date', () => {
      const today = new Date().toISOString()
      const result = renderUpdatedTodayBadge(today)
      expect(result).not.toBeNull()
      
      const { container } = render(<>{result}</>)
      expect(container.textContent).toContain('Atualizado hoje')
    })

    it('should return null for old date', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const result = renderUpdatedTodayBadge(yesterday.toISOString())
      expect(result).toBeNull()
    })

    it('should return null for undefined', () => {
      const result = renderUpdatedTodayBadge(undefined)
      expect(result).toBeNull()
    })

    it('should render with custom className and icon', () => {
      const today = new Date().toISOString()
      const icon = <span data-testid="custom-icon">🔔</span>
      const result = renderUpdatedTodayBadge(today, 'my-class', icon)
      
      const { container } = render(<>{result}</>)
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
      expect(container.querySelector('.my-class')).toBeInTheDocument()
    })
  })

  describe('renderNewBadge', () => {
    it('should render badge for recent creation (1 hour ago)', () => {
      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)
      const result = renderNewBadge(oneHourAgo.toISOString())
      expect(result).not.toBeNull()
      
      const { container } = render(<>{result}</>)
      expect(container.textContent).toContain('Novo')
    })

    it('should return null for old creation (25 hours ago)', () => {
      const oldDate = new Date()
      oldDate.setHours(oldDate.getHours() - 25)
      const result = renderNewBadge(oldDate.toISOString())
      expect(result).toBeNull()
    })

    it('should return null for undefined', () => {
      const result = renderNewBadge(undefined)
      expect(result).toBeNull()
    })

    it('should render with custom className and icon', () => {
      const now = new Date().toISOString()
      const icon = <span data-testid="sparkle-icon">⭐</span>
      const result = renderNewBadge(now, 'new-class', icon)
      
      const { container } = render(<>{result}</>)
      expect(screen.getByTestId('sparkle-icon')).toBeInTheDocument()
      expect(container.querySelector('.new-class')).toBeInTheDocument()
    })
  })
})
