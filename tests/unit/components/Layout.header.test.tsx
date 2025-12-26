import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { Layout } from '@/components/Layout'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: {
      id: '1',
      name: 'Usuário Teste',
      email: 'teste@example.com',
      role: 'admin'
    },
    signOut: vi.fn().mockResolvedValue(true)
  })
}))

vi.mock('@/contexts/ImpersonationContext', () => ({
  useImpersonation: () => ({
    isImpersonating: false,
    setIsImpersonating: vi.fn()
  })
}))

vi.mock('@/hooks/useRealtimeNotifications', () => ({
  useRealtimeNotifications: vi.fn()
}))

vi.mock('@/services/notificationService', () => ({
  useUnreadCount: () => ({ data: 0 })
}))

vi.mock('@/features/deals/components/CreateDealDialog', () => ({
  CreateDealDialog: () => <div data-testid="mock-create-deal-dialog" />
}))

vi.mock('@/components/GlobalSearch', () => ({
  default: () => <div data-testid="mock-global-search" />
}))

vi.mock('@/features/inbox/components/InboxPanel', () => ({
  default: () => <div data-testid="mock-inbox-panel" />
}))

vi.mock('@/components/SLAMonitoringService', () => ({
  SLAMonitoringService: () => <div data-testid="mock-sla-monitor" />
}))

vi.mock('@/components/OnboardingTour', () => ({
  OnboardingTour: () => <div data-testid="mock-onboarding-tour" />
}))

vi.mock('@/components/CreateNewDropdown', () => ({
  CreateNewDropdown: () => <div data-testid="mock-create-new-dropdown" />
}))

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)

describe('Layout header separator', () => {
  it('renders a single visible separator between menu and action buttons', () => {
    const { container } = render(
      <MemoryRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </MemoryRouter>
    )

    const separators = screen.getAllByTestId('header-menu-separator')
    expect(separators).toHaveLength(1)

    const separator = separators[0]
    expect(separator).toHaveClass('h-8')
    expect(separator).toHaveClass('w-px')

    const nav = container.querySelector('nav')
    expect(separator.previousElementSibling).toBe(nav)

    const actions = separator.nextElementSibling
    expect(actions).toHaveClass('flex')
    expect(actions).toHaveClass('items-center')
    expect(actions).toHaveClass('gap-3')
  })
})
