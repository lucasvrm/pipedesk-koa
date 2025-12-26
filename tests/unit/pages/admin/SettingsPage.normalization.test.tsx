import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SettingsPage from '@/pages/admin/SettingsPage'

vi.mock('@/pages/admin/components/settings-sections', () => ({
  LeadSettingsSection: () => <div data-testid="lead-section" />,
  DealPipelineSettingsSection: () => <div data-testid="deals-section" />,
  CompanyRelationshipSettingsSection: () => <div data-testid="companies-section" />,
  SystemSettingsSection: () => <div data-testid="system-section" />,
  ProductivitySettingsSection: () => <div data-testid="productivity-section" />,
  ProductsSettingsSection: () => <div data-testid="products-section" />,
  IntegrationsSettingsSection: () => <div data-testid="integrations-section" />
}))

const LocationDisplay = () => {
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
            path="/admin/settings"
            element={
              <>
                <SettingsPage />
                <LocationDisplay />
              </>
            }
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('SettingsPage normalization', () => {
  it('normalizes CRM companies section with trailing spaces', async () => {
    renderPage('/admin/settings?category=crm&section=companies%20')

    expect(await screen.findByTestId('companies-section')).toBeInTheDocument()

    await waitFor(() => {
      const search = screen.getByTestId('location-search').textContent || ''
      expect(search).toContain('category=crm')
      expect(search).toContain('section=companies')
      expect(search.includes('%20')).toBe(false)
    })
  })
})
