import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UserBadge } from '@/components/ui/user-badge'

describe('UserBadge', () => {
  describe('Initials generation', () => {
    it('should generate single letter for single word name', () => {
      render(<UserBadge name="Alice" />)
      expect(screen.getByText('A')).toBeInTheDocument()
    })

    it('should generate two letters for multiple word name', () => {
      render(<UserBadge name="Alice Smith" />)
      expect(screen.getByText('AS')).toBeInTheDocument()
    })

    it('should use first and last word for names with more than 2 words', () => {
      render(<UserBadge name="Alice Jane Smith" />)
      expect(screen.getByText('AS')).toBeInTheDocument()
    })

    it('should handle names with extra spaces', () => {
      render(<UserBadge name="  Alice   Smith  " />)
      expect(screen.getByText('AS')).toBeInTheDocument()
    })

    it('should return ? for empty name', () => {
      render(<UserBadge name="" />)
      expect(screen.getByText('?')).toBeInTheDocument()
    })

    it('should return ? for whitespace-only name', () => {
      render(<UserBadge name="   " />)
      expect(screen.getByText('?')).toBeInTheDocument()
    })

    it('should uppercase initials', () => {
      render(<UserBadge name="alice smith" />)
      expect(screen.getByText('AS')).toBeInTheDocument()
    })
  })

  describe('Size variants', () => {
    it('should render with xs size', () => {
      const { container } = render(<UserBadge name="Alice" size="xs" />)
      const badge = container.querySelector('.h-6')
      expect(badge).toBeInTheDocument()
    })

    it('should render with sm size', () => {
      const { container } = render(<UserBadge name="Alice" size="sm" />)
      const badge = container.querySelector('.h-8')
      expect(badge).toBeInTheDocument()
    })

    it('should render with md size (default)', () => {
      const { container } = render(<UserBadge name="Alice" />)
      const badge = container.querySelector('.h-10')
      expect(badge).toBeInTheDocument()
    })

    it('should render with lg size', () => {
      const { container } = render(<UserBadge name="Alice" size="lg" />)
      const badge = container.querySelector('.h-12')
      expect(badge).toBeInTheDocument()
    })

    it('should render with xl size', () => {
      const { container } = render(<UserBadge name="Alice" size="xl" />)
      const badge = container.querySelector('.h-16')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Avatar URL support', () => {
    it('should render Avatar with image when avatarUrl is provided', () => {
      render(<UserBadge name="Alice Smith" avatarUrl="https://example.com/avatar.jpg" />)
      const img = screen.getByAltText('Alice Smith')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('should show initials fallback when avatarUrl is provided but image fails', () => {
      render(<UserBadge name="Alice Smith" avatarUrl="https://example.com/broken.jpg" />)
      expect(screen.getByText('AS')).toBeInTheDocument()
    })

    it('should render badge with initials when avatarUrl is null', () => {
      render(<UserBadge name="Alice Smith" avatarUrl={null} />)
      expect(screen.getByText('AS')).toBeInTheDocument()
    })

    it('should render badge with initials when avatarUrl is undefined', () => {
      render(<UserBadge name="Alice Smith" />)
      expect(screen.getByText('AS')).toBeInTheDocument()
    })
  })

  describe('Custom colors', () => {
    it('should apply default background color', () => {
      const { container } = render(<UserBadge name="Alice" />)
      const badge = container.querySelector('[style*="background-color"]')
      expect(badge).toHaveStyle({ backgroundColor: '#fee2e2' })
    })

    it('should apply default text color', () => {
      const { container } = render(<UserBadge name="Alice" />)
      const badge = container.querySelector('[style*="color"]')
      expect(badge).toHaveStyle({ color: '#991b1b' })
    })

    it('should apply custom background color', () => {
      const { container } = render(<UserBadge name="Alice" bgColor="#3b82f6" />)
      const badge = container.querySelector('[style*="background-color"]')
      expect(badge).toHaveStyle({ backgroundColor: '#3b82f6' })
    })

    it('should apply custom text color', () => {
      const { container } = render(<UserBadge name="Alice" textColor="#ffffff" />)
      const badge = container.querySelector('[style*="color"]')
      expect(badge).toHaveStyle({ color: '#ffffff' })
    })

    it('should apply border color when provided', () => {
      const { container } = render(<UserBadge name="Alice" borderColor="#000000" />)
      const badge = container.querySelector('[style*="border"]')
      expect(badge).toHaveStyle({ border: '2px solid #000000' })
    })

    it('should not apply border when borderColor is null', () => {
      const { container } = render(<UserBadge name="Alice" borderColor={null} />)
      const badge = container.querySelector('[style*="background-color"]')
      expect(badge?.getAttribute('style')).not.toContain('border')
    })
  })

  describe('Online indicator', () => {
    it('should not show online indicator by default', () => {
      const { container } = render(<UserBadge name="Alice" />)
      const indicator = container.querySelector('.bg-green-500, .bg-gray-400')
      expect(indicator).not.toBeInTheDocument()
    })

    it('should show green indicator when online', () => {
      const { container } = render(
        <UserBadge name="Alice" showOnlineIndicator={true} isOnline={true} />
      )
      const indicator = container.querySelector('.bg-green-500')
      expect(indicator).toBeInTheDocument()
    })

    it('should show gray indicator when offline', () => {
      const { container } = render(
        <UserBadge name="Alice" showOnlineIndicator={true} isOnline={false} />
      )
      const indicator = container.querySelector('.bg-gray-400')
      expect(indicator).toBeInTheDocument()
    })

    it('should size indicator for xs badge', () => {
      const { container } = render(
        <UserBadge name="Alice" size="xs" showOnlineIndicator={true} isOnline={true} />
      )
      const indicator = container.querySelector('.h-2')
      expect(indicator).toBeInTheDocument()
    })

    it('should size indicator for larger badges', () => {
      const { container } = render(
        <UserBadge name="Alice" size="md" showOnlineIndicator={true} isOnline={true} />
      )
      const indicator = container.querySelector('.h-3')
      expect(indicator).toBeInTheDocument()
    })

    it('should show indicator with avatarUrl', () => {
      const { container } = render(
        <UserBadge
          name="Alice"
          avatarUrl="https://example.com/avatar.jpg"
          showOnlineIndicator={true}
          isOnline={true}
        />
      )
      const indicator = container.querySelector('.bg-green-500')
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('Accessibility and props', () => {
    it('should apply custom className', () => {
      const { container } = render(<UserBadge name="Alice" className="custom-class" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain('custom-class')
    })

    it('should set title attribute with user name', () => {
      const { container } = render(<UserBadge name="Alice Smith" />)
      const badge = container.querySelector('[title]')
      expect(badge).toHaveAttribute('title', 'Alice Smith')
    })

    it('should forward ref correctly', () => {
      const ref = { current: null }
      render(<UserBadge name="Alice" ref={ref} />)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })
})
