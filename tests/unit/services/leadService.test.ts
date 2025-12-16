import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLeads } from '@/services/leadService';
import { supabase } from '@/lib/supabaseClient';

vi.mock('@/lib/supabaseClient', () => {
  const from = vi.fn();
  return { supabase: { from } };
});

const supabaseFromMock = supabase.from as unknown as ReturnType<typeof vi.fn>;
const MOCK_QUALIFIED_STATUS_ID = '123e4567-e89b-12d3-a456-426614174000';

describe('leadService - qualified filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies qualified status filter when includeQualified is false', async () => {
    const orMock = vi.fn().mockReturnThis();
    const isMock = vi.fn().mockReturnThis();
    const orderMock = vi.fn().mockResolvedValue({
      data: [{
        id: 'lead-1',
        legal_name: 'Lead 1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: 'user-1',
        lead_status_id: 'status-a'
      }],
      error: null
    });

    const leadQuery = {
      select: vi.fn().mockReturnThis(),
      is: isMock,
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: orMock,
      order: orderMock
    };

    const leadStatusQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: MOCK_QUALIFIED_STATUS_ID },
            error: null
          })
        }))
      }))
    };

    supabaseFromMock.mockImplementation((table: string) => {
      if (table === 'lead_statuses') return leadStatusQuery;
      if (table === 'leads') return leadQuery;
      throw new Error(`Unexpected table ${table}`);
    });

    await getLeads(undefined, { includeQualified: false });

    expect(orMock).toHaveBeenCalledWith(`lead_status_id.is.null,lead_status_id.neq.${MOCK_QUALIFIED_STATUS_ID}`);
    expect(isMock).toHaveBeenCalledWith('qualified_at', null);
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('skips qualified status filter when includeQualified is true', async () => {
    const orMock = vi.fn().mockReturnThis();
    const isMock = vi.fn().mockReturnThis();
    const orderMock = vi.fn().mockResolvedValue({
      data: [{
        id: 'lead-2',
        legal_name: 'Lead 2',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: 'user-1',
        lead_status_id: 'qualified-id'
      }],
      error: null
    });

    const leadQuery = {
      select: vi.fn().mockReturnThis(),
      is: isMock,
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: orMock,
      order: orderMock
    };

    supabaseFromMock.mockImplementation((table: string) => {
      if (table === 'lead_statuses') throw new Error('should not fetch qualified status when includeQualified=true');
      if (table === 'leads') return leadQuery;
      throw new Error(`Unexpected table ${table}`);
    });

    await getLeads(undefined, { includeQualified: true });

    expect(orMock).not.toHaveBeenCalled();
    expect(isMock).not.toHaveBeenCalledWith('qualified_at', null);
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
  });
});
