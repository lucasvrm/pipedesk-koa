import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

vi.mock('@/features/deals/components/CreateDealDialog', () => ({
  CreateDealDialog: () => <div data-testid="mock-create-deal-dialog" />
}))

vi.mock('@/components/SLAConfigManager', () => ({
  SLAConfigManager: () => <div data-testid="mock-sla-config" />
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

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)

describe('Layout navigation menu', () => {
  it('opens the desktop menu when the trigger is clicked', async () => {
    render(
      <MemoryRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </MemoryRouter>
    )

    expect(screen.queryByText('Perfil')).not.toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Menu de navegação'))

    expect(await screen.findByText('Perfil')).toBeInTheDocument()
  })

  it('allows scroll by not applying overflow-hidden to main container', () => {
    const { container } = render(
      <MemoryRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </MemoryRouter>
    )

    const rootDiv = container.firstChild as HTMLElement
    expect(rootDiv).not.toHaveClass('overflow-hidden')
    expect(rootDiv).not.toHaveClass('h-screen')
    
    const mainElement = container.querySelector('main')
    expect(mainElement).toHaveClass('overflow-auto')
  })
})
