import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DriveSection from '@/components/DriveSection'
import { useAuth } from '@/contexts/AuthContext'
import { useDriveDocuments } from '@/hooks/useDriveDocuments'

// Mock the dependencies
vi.mock('@/contexts/AuthContext')
vi.mock('@/hooks/useDriveDocuments')
vi.mock('@/services/activityService', () => ({
  logActivity: vi.fn()
}))

describe('DriveSection', () => {
  const mockProfile = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin'
  }

  const mockDriveDocuments = {
    files: [],
    folders: [],
    rootFolderId: 'root-123',
    breadcrumbs: [{ id: null, name: 'Raiz' }],
    createFolder: vi.fn(),
    uploadFiles: vi.fn(),
    deleteItem: vi.fn(),
    renameItem: vi.fn(),
    loading: false,
    error: null,
    currentFolderId: undefined,
    navigateToFolder: vi.fn(),
    reload: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as any).mockReturnValue({ profile: mockProfile })
    ;(useDriveDocuments as any).mockReturnValue(mockDriveDocuments)
  })

  it('renders without crashing for deal entity', () => {
    render(<DriveSection entityType="deal" entityId="deal-123" />)
    expect(screen.getByPlaceholderText('Buscar documentos...')).toBeDefined()
  })

  it('renders without crashing for lead entity', () => {
    render(<DriveSection entityType="lead" entityId="lead-456" />)
    expect(screen.getByPlaceholderText('Buscar documentos...')).toBeDefined()
  })

  it('renders without crashing for company entity', () => {
    render(<DriveSection entityType="company" entityId="company-789" />)
    expect(screen.getByPlaceholderText('Buscar documentos...')).toBeDefined()
  })

  it('shows loading state when loading', () => {
    ;(useDriveDocuments as any).mockReturnValue({
      ...mockDriveDocuments,
      loading: true
    })

    const { container } = render(<DriveSection entityType="deal" entityId="deal-123" />)
    // Should show skeleton loaders - check for the skeleton class
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows error state when error occurs', () => {
    ;(useDriveDocuments as any).mockReturnValue({
      ...mockDriveDocuments,
      loading: false,
      error: new Error('Failed to load documents')
    })

    render(<DriveSection entityType="deal" entityId="deal-123" />)
    expect(screen.getByText(/Erro ao carregar documentos/i)).toBeDefined()
    expect(screen.getByText(/Failed to load documents/i)).toBeDefined()
  })

  it('shows empty state when no files or folders', () => {
    render(<DriveSection entityType="deal" entityId="deal-123" />)
    expect(screen.getByText(/Pasta vazia/i)).toBeDefined()
  })

  it('hides upload and create buttons in read-only mode', () => {
    render(<DriveSection entityType="deal" entityId="deal-123" readOnly />)
    
    // Should show read-only badge
    expect(screen.getByText(/Somente leitura/i)).toBeDefined()
    
    // Should not show upload or create folder buttons
    expect(screen.queryByText(/Upload/i)).toBeNull()
    expect(screen.queryByText(/Nova Pasta/i)).toBeNull()
  })

  it('displays files when provided', () => {
    const mockFiles = [
      {
        id: 'file-1',
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
        url: 'https://example.com/test.pdf',
        uploadedBy: 'user-1',
        uploadedAt: '2023-01-01T00:00:00Z',
        entityId: 'deal-123',
        entityType: 'deal' as const,
        role: 'admin' as const,
        rootFolderId: 'root-123'
      }
    ]

    ;(useDriveDocuments as any).mockReturnValue({
      ...mockDriveDocuments,
      files: mockFiles
    })

    render(<DriveSection entityType="deal" entityId="deal-123" />)
    expect(screen.getByText('test.pdf')).toBeDefined()
  })

  it('displays folders when provided', () => {
    const mockFolders = [
      {
        id: 'folder-1',
        name: 'Documents',
        entityId: 'deal-123',
        entityType: 'deal' as const,
        type: 'custom' as const
      }
    ]

    ;(useDriveDocuments as any).mockReturnValue({
      ...mockDriveDocuments,
      folders: mockFolders
    })

    render(<DriveSection entityType="deal" entityId="deal-123" />)
    expect(screen.getByText('Documents')).toBeDefined()
  })

  it('calls useDriveDocuments with correct parameters', () => {
    render(
      <DriveSection 
        entityType="lead" 
        entityId="lead-123" 
        entityName="Test Lead"
      />
    )

    expect(useDriveDocuments).toHaveBeenCalledWith({
      entityId: 'lead-123',
      entityType: 'lead',
      actorId: 'user-1',
      actorRole: 'admin',
      entityName: 'Test Lead'
    })
  })

  it('accepts all valid entity types', () => {
    const entityTypes: Array<'lead' | 'deal' | 'company'> = ['lead', 'deal', 'company']
    
    entityTypes.forEach(entityType => {
      const { unmount } = render(
        <DriveSection entityType={entityType} entityId={`${entityType}-123`} />
      )
      expect(screen.getByPlaceholderText('Buscar documentos...')).toBeDefined()
      unmount()
    })
  })
})
