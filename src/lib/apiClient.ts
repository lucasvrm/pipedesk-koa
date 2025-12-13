/**
 * Generic HTTP client for communicating with the PipeDesk Backend API.
 * Automatically injects authentication headers and handles common errors.
 */

import { supabase } from './supabaseClient';

/**
 * API base URL. Defaults to '/api' (proxied by Vite or configured via ENV).
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Custom error class for API errors with status code information.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch function for making authenticated API requests.
 * Always fetches a fresh token from Supabase Auth to prevent 401 errors.
 * 
 * @param endpoint - The API endpoint (relative to base URL, e.g., '/timeline/lead/123')
 * @param options - Optional fetch RequestInit options
 * @returns Promise resolving to the typed response data
 * @throws ApiError for HTTP errors (401, 403, 404, etc.)
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Always get a fresh session to ensure we have a valid, non-expired token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  // Build headers object with proper defaults
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-role': 'manager', // MVP hardcoded
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  // Merge with any custom headers from options
  if (options.headers) {
    const customHeaders = options.headers instanceof Headers
      ? Object.fromEntries(options.headers.entries())
      : (options.headers as Record<string, string>);
    Object.assign(headers, customHeaders);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage: string;

    switch (response.status) {
      case 401:
        // Log the 401 error for debugging purposes
        console.warn('apiFetch: 401 Unauthorized. Token may be invalid or expired.');
        errorMessage = 'Unauthorized: Authentication is required. Please log in again.';
        break;
      case 403:
        errorMessage = 'Forbidden: You do not have permission to access this resource.';
        break;
      case 404:
        errorMessage = 'Not Found: The requested resource does not exist.';
        break;
      default:
        errorMessage = `Request failed with status ${response.status}: ${response.statusText}`;
    }

    throw new ApiError(errorMessage, response.status, response.statusText);
  }

  // Handle empty responses (e.g., 204 No Content)
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
