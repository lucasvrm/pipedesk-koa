import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DealDocumentsList } from '@/features/deals/components/DealDocumentsList';
import * as driveClient from '@/lib/driveClient';

// Mock the driveClient module
vi.mock('@/lib/driveClient', () => ({
  listDriveItems: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('DealDocumentsList', () => {
  const mockDealId = 'deal-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    vi.mocked(driveClient.listDriveItems).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<DealDocumentsList dealId={mockDealId} />);

    expect(screen.getByText('Documentos')).toBeInTheDocument();
    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display empty state when no documents are found', async () => {
    vi.mocked(driveClient.listDriveItems).mockResolvedValue({
      items: [],
      total: 0,
    });

    render(<DealDocumentsList dealId={mockDealId} />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum documento encontrado para este negócio.')).toBeInTheDocument();
    });

    expect(driveClient.listDriveItems).toHaveBeenCalledWith('deal', mockDealId);
  });

  it('should display documents in a table when loaded successfully', async () => {
    const mockItems = [
      {
        id: '1',
        name: 'Contrato.pdf',
        type: 'file' as const,
        size: 1024000,
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        name: 'Arquivos',
        type: 'folder' as const,
        createdAt: '2024-01-10T09:00:00Z',
      },
    ];

    vi.mocked(driveClient.listDriveItems).mockResolvedValue({
      items: mockItems,
      total: 2,
    });

    render(<DealDocumentsList dealId={mockDealId} />);

    await waitFor(() => {
      expect(screen.getByText('Contrato.pdf')).toBeInTheDocument();
      expect(screen.getByText('Arquivos')).toBeInTheDocument();
    });

    // Should show total count
    expect(screen.getByText('2 itens')).toBeInTheDocument();

    // Should call listDriveItems with entity type and ID
    expect(driveClient.listDriveItems).toHaveBeenCalledWith('deal', mockDealId);
  });

  it('should display file type badges correctly', async () => {
    const mockItems = [
      {
        id: '1',
        name: 'File.pdf',
        type: 'file' as const,
        size: 1024,
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        name: 'Folder',
        type: 'folder' as const,
        createdAt: '2024-01-10T09:00:00Z',
      },
    ];

    vi.mocked(driveClient.listDriveItems).mockResolvedValue({
      items: mockItems,
      total: 2,
    });

    render(<DealDocumentsList dealId={mockDealId} />);

    await waitFor(() => {
      expect(screen.getByText('Arquivo')).toBeInTheDocument();
      expect(screen.getByText('Pasta')).toBeInTheDocument();
    });
  });

  it('should display file size for files but not folders', async () => {
    const mockItems = [
      {
        id: '1',
        name: 'Document.pdf',
        type: 'file' as const,
        size: 2048,
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        name: 'Folder',
        type: 'folder' as const,
        createdAt: '2024-01-10T09:00:00Z',
      },
    ];

    vi.mocked(driveClient.listDriveItems).mockResolvedValue({
      items: mockItems,
      total: 2,
    });

    render(<DealDocumentsList dealId={mockDealId} />);

    await waitFor(() => {
      // File should show size (2048 bytes = 2 KB)
      expect(screen.getByText('2 KB')).toBeInTheDocument();
    });

    // Folder should show em dash for size
    const cells = screen.getAllByText('—');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should display error state when API call fails', async () => {
    const errorMessage = 'Drive API URL not configured';
    vi.mocked(driveClient.listDriveItems).mockRejectedValue(
      new Error(errorMessage)
    );

    render(<DealDocumentsList dealId={mockDealId} />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(
        screen.getByText('Verifique se a API do Drive está configurada corretamente.')
      ).toBeInTheDocument();
    });
  });

  it('should display creation dates when available', async () => {
    const mockItems = [
      {
        id: '1',
        name: 'Document.pdf',
        type: 'file' as const,
        size: 1024,
        createdAt: '2024-01-15T10:00:00Z',
      },
    ];

    vi.mocked(driveClient.listDriveItems).mockResolvedValue({
      items: mockItems,
      total: 1,
    });

    render(<DealDocumentsList dealId={mockDealId} />);

    await waitFor(() => {
      // formatDate should convert the ISO date to a readable format
      // The exact format depends on the formatDate implementation
      expect(screen.getByText(/15\/01\/2024|Jan 15, 2024|2024-01-15/)).toBeInTheDocument();
    });
  });

  it('should render singular item count correctly', async () => {
    const mockItems = [
      {
        id: '1',
        name: 'Single File.pdf',
        type: 'file' as const,
        size: 1024,
        createdAt: '2024-01-15T10:00:00Z',
      },
    ];

    vi.mocked(driveClient.listDriveItems).mockResolvedValue({
      items: mockItems,
      total: 1,
    });

    render(<DealDocumentsList dealId={mockDealId} />);

    await waitFor(() => {
      expect(screen.getByText('1 item')).toBeInTheDocument();
    });
  });
});
