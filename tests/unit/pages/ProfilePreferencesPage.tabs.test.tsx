import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProfilePreferencesPage from '@/pages/ProfilePreferencesPage'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: { id: 'user-1', name: 'Usuário Teste', email: 'teste@example.com' }
  })
}))

vi.mock('@/services/notificationService', () => ({
  useNotificationPreferences: () => ({
    data: {
      dndEnabled: false,
      minPriority: null,
      prefMention: true,
      prefAssignment: true,
      prefStatus: true,
      prefSla: true,
      prefDeadline: true,
      prefActivity: true,
      prefSystem: true,
      prefGeneral: true
    },
    isLoading: false
  }),
  useUpdateNotificationPreferences: () => ({
    mutateAsync: vi.fn(),
    isPending: false
  }),
  useToggleDND: () => ({
    mutateAsync: vi.fn(),
    isPending: false
  })
}))

const LocationWatcher = () => {
  const location = useLocation()
  return <div data-testid="location-search">{location.search}</div>
}

const renderPage = (initialEntry: string) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  })

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={client}>
        <Routes>
          <Route
            path="/profile/preferences"
            element={
              <>
                <ProfilePreferencesPage />
                <LocationWatcher />
              </>
            }
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('ProfilePreferencesPage tabs', () => {
  it('renders notifications and timeline tabs', async () => {
    renderPage('/profile/preferences')

    expect(await screen.findByText('Notificações')).toBeInTheDocument()
    expect(screen.getByText('Timeline')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('location-search').textContent).toContain('tab=notifications')
    })
  })

  it('shows timeline content when tab=timeline is provided', async () => {
    renderPage('/profile/preferences?tab=timeline')

    expect(await screen.findByText('Histórico de preferências')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('location-search').textContent).toContain('tab=timeline')
    })
  })
})
