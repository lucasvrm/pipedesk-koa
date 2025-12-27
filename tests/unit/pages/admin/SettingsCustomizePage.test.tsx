import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SettingsCustomizePage from '@/pages/admin/SettingsCustomizePage'

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    profile: {
      id: 'test-user-id',
      role: 'admin',
      email: 'admin@test.com'
    }
  }))
}))

// Mock SystemMetadataContext
const mockRefreshMetadata = vi.fn()
vi.mock('@/contexts/SystemMetadataContext', () => ({
  SystemMetadataContext: {
    _currentValue: {
      settings: [],
      refreshMetadata: mockRefreshMetadata
    }
  }
}))

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/test.png' } })),
        remove: vi.fn()
      }))
    }
  }
}))

// Mock settings service
vi.mock('@/services/settingsService', () => ({
  updateSystemSetting: vi.fn()
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

const renderPage = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  })

  return render(
    <QueryClientProvider client={client}>
      <SettingsCustomizePage />
    </QueryClientProvider>
  )
}

describe('SettingsCustomizePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    renderPage()
    
    expect(screen.getByText('Customização')).toBeInTheDocument()
    expect(screen.getByText('Personalize a identidade visual da sua organização')).toBeInTheDocument()
  })

  it('renders logo section', () => {
    renderPage()
    
    expect(screen.getByText('Logomarca')).toBeInTheDocument()
    expect(screen.getByText(/Logo que aparece no cabeçalho do sistema/)).toBeInTheDocument()
  })

  it('renders favicon section', () => {
    renderPage()
    
    expect(screen.getByText('Favicon')).toBeInTheDocument()
    expect(screen.getByText(/Ícone que aparece na aba do navegador/)).toBeInTheDocument()
  })

  it('uses full-width layout without container restrictions', () => {
    const { container } = renderPage()
    
    // Should NOT have container or max-width classes
    const containerDiv = container.querySelector('.container')
    expect(containerDiv).toBeNull()
    
    const maxWDiv = container.querySelector('[class*="max-w-"]')
    expect(maxWDiv).toBeNull()
  })

  it('displays empty state messages when no assets are configured', () => {
    renderPage()
    
    expect(screen.getByText(/Nenhum logo configurado/)).toBeInTheDocument()
    expect(screen.getByText(/Nenhum favicon configurado/)).toBeInTheDocument()
  })
})
