import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, ApiError } from '@/lib/apiClient';

// Mock Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

// Import after mocking
import { supabase } from '@/lib/supabaseClient';

describe('apiClient', () => {
  const mockGetSession = supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('apiFetch', () => {
    it('should make a GET request with default headers', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token-123' } },
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'test' }),
      });

      const result = await apiFetch<{ data: string }>('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123',
            'Content-Type': 'application/json',
            'x-user-role': 'manager',
          }),
        })
      );

      expect(result).toEqual({ data: 'test' });
    });

    it('should make request without Authorization header when no token', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ success: true }),
      });

      await apiFetch('/test');

      const calledHeaders = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers as Record<string, string>;
      expect(calledHeaders['Authorization']).toBeUndefined();
      expect(calledHeaders['x-user-role']).toBe('manager');
    });

    it('should set Content-Type for requests with body', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
      });

      await apiFetch('/test', {
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      });

      const calledHeaders = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers as Record<string, string>;
      expect(calledHeaders['Content-Type']).toBe('application/json');
    });

    it('should throw ApiError with descriptive message for 401', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(apiFetch('/test')).rejects.toThrow(ApiError);
      await expect(apiFetch('/test')).rejects.toThrow(
        'Unauthorized: Authentication is required. Please log in again.'
      );
    });

    it('should throw ApiError with descriptive message for 403', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      await expect(apiFetch('/test')).rejects.toThrow(
        'Forbidden: You do not have permission to access this resource.'
      );
    });

    it('should throw ApiError with descriptive message for 404', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(apiFetch('/test')).rejects.toThrow(
        'Not Found: The requested resource does not exist.'
      );
    });

    it('should throw ApiError with status for other errors', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(apiFetch('/test')).rejects.toThrow(
        'Request failed with status 500: Internal Server Error'
      );
    });

    it('should handle empty responses (non-JSON)', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        json: () => Promise.reject(new Error('No JSON')),
      });

      const result = await apiFetch('/test');
      expect(result).toEqual({});
    });

    it('should preserve custom headers', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
      });

      await apiFetch('/test', {
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      const calledHeaders = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers as Record<string, string>;
      expect(calledHeaders['X-Custom-Header']).toBe('custom-value');
      expect(calledHeaders['Authorization']).toBe('Bearer token');
    });
  });
});
