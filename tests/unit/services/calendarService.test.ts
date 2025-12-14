import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchEvents, createEvent } from '@/services/calendarService';
import * as apiClient from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => {
  // Create a mock ApiError class inside the factory function to avoid hoisting issues
  class ApiError extends Error {
    constructor(
      message: string,
      public status: number,
      public statusText: string
    ) {
      super(message);
      this.name = 'ApiError';
    }
  }
  
  return {
    apiFetch: vi.fn(),
    ApiError,
  };
});

describe('calendarService', () => {
  const mockApiFetch = vi.mocked(apiClient.apiFetch);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchEvents', () => {
    it('should fetch events without parameters', async () => {
      const mockResponse = {
        events: [
          {
            id: 'event-1',
            title: 'Meeting',
            startTime: '2024-01-15T10:00:00Z',
            endTime: '2024-01-15T11:00:00Z',
            createdAt: '2024-01-14T10:00:00Z',
            createdBy: { id: 'user-1', name: 'John', email: 'john@test.com' },
          },
        ],
        total: 1,
      };

      mockApiFetch.mockResolvedValue(mockResponse);

      const result = await fetchEvents();

      expect(mockApiFetch).toHaveBeenCalledWith('/calendar/events');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch events with time_min parameter', async () => {
      mockApiFetch.mockResolvedValue({ events: [], total: 0 });

      await fetchEvents({ time_min: '2024-01-15T00:00:00Z' });

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/calendar/events?time_min=2024-01-15T00%3A00%3A00Z'
      );
    });

    it('should fetch events with limit parameter', async () => {
      mockApiFetch.mockResolvedValue({ events: [], total: 0 });

      await fetchEvents({ limit: 50 });

      expect(mockApiFetch).toHaveBeenCalledWith('/calendar/events?limit=50');
    });

    it('should fetch events with both parameters', async () => {
      mockApiFetch.mockResolvedValue({ events: [], total: 0 });

      await fetchEvents({ time_min: '2024-01-01', limit: 100 });

      expect(mockApiFetch).toHaveBeenCalledWith('/calendar/events?time_min=2024-01-01&limit=100');
    });

    it('should propagate API errors', async () => {
      mockApiFetch.mockRejectedValue(new Error('API error'));

      await expect(fetchEvents()).rejects.toThrow('API error');
    });
  });

  describe('createEvent', () => {
    it('should create a simple event with both naming conventions', async () => {
      const eventData = {
        title: 'New Meeting',
        startTime: '2024-01-20T14:00:00Z',
        endTime: '2024-01-20T15:00:00Z',
      };

      const mockResponse = {
        id: 'new-event-1',
        ...eventData,
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: { id: 'user-1', name: 'John', email: 'john@test.com' },
      };

      mockApiFetch.mockResolvedValue(mockResponse);

      const result = await createEvent(eventData);

      // The payload now includes both camelCase and snake_case fields for compatibility
      const expectedPayload = {
        title: eventData.title,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        summary: eventData.title,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
      };

      expect(mockApiFetch).toHaveBeenCalledWith('/calendar/events', {
        method: 'POST',
        body: JSON.stringify(expectedPayload),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create an event with all optional fields using both naming conventions', async () => {
      const eventData = {
        title: 'Deal Review',
        description: 'Review Q1 deals',
        startTime: '2024-01-20T14:00:00Z',
        endTime: '2024-01-20T15:00:00Z',
        entityType: 'deal' as const,
        entityId: 'deal-123',
        attendees: ['user-1', 'user-2'],
      };

      mockApiFetch.mockResolvedValue({
        id: 'event-2',
        ...eventData,
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: { id: 'user-1', name: 'John', email: 'john@test.com' },
      });

      await createEvent(eventData);

      // The payload now includes both camelCase and snake_case fields for compatibility
      const expectedPayload = {
        title: eventData.title,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        summary: eventData.title,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        description: eventData.description,
        entityType: eventData.entityType,
        entity_type: eventData.entityType,
        entityId: eventData.entityId,
        entity_id: eventData.entityId,
        attendees: eventData.attendees,
      };

      expect(mockApiFetch).toHaveBeenCalledWith('/calendar/events', {
        method: 'POST',
        body: JSON.stringify(expectedPayload),
      });
    });

    it('should propagate API errors', async () => {
      mockApiFetch.mockRejectedValue(new Error('Creation failed'));

      await expect(
        createEvent({
          title: 'Test',
          startTime: '2024-01-20T14:00:00Z',
          endTime: '2024-01-20T15:00:00Z',
        })
      ).rejects.toThrow('Creation failed');
    });
  });
});
