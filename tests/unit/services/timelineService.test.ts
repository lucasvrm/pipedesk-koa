import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTimeline } from '@/services/timelineService';
import * as apiClient from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  apiFetch: vi.fn(),
}));

describe('timelineService', () => {
  const mockApiFetch = vi.mocked(apiClient.apiFetch);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchTimeline', () => {
    it('should fetch timeline for a lead without pagination', async () => {
      const mockResponse = {
        entries: [
          {
            id: 'entry-1',
            entityType: 'lead',
            entityId: 'lead-123',
            type: 'note',
            title: 'Note added',
            createdAt: '2024-01-15T10:00:00Z',
            createdBy: { id: 'user-1', name: 'John', email: 'john@test.com' },
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      };

      mockApiFetch.mockResolvedValue(mockResponse);

      const result = await fetchTimeline('lead', 'lead-123');

      expect(mockApiFetch).toHaveBeenCalledWith('/timeline/lead/lead-123');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch timeline for a deal with limit', async () => {
      mockApiFetch.mockResolvedValue({ entries: [], total: 0, limit: 10, offset: 0 });

      await fetchTimeline('deal', 'deal-456', 10);

      expect(mockApiFetch).toHaveBeenCalledWith('/timeline/deal/deal-456?limit=10');
    });

    it('should fetch timeline for a contact with limit and offset', async () => {
      mockApiFetch.mockResolvedValue({ entries: [], total: 0, limit: 20, offset: 40 });

      await fetchTimeline('contact', 'contact-789', 20, 40);

      expect(mockApiFetch).toHaveBeenCalledWith('/timeline/contact/contact-789?limit=20&offset=40');
    });

    it('should fetch timeline with only offset (no limit)', async () => {
      mockApiFetch.mockResolvedValue({ entries: [], total: 0, limit: 20, offset: 20 });

      await fetchTimeline('lead', 'lead-123', undefined, 20);

      expect(mockApiFetch).toHaveBeenCalledWith('/timeline/lead/lead-123?offset=20');
    });

    it('should propagate API errors', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      await expect(fetchTimeline('lead', 'lead-123')).rejects.toThrow('Network error');
    });
  });
});
