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
 * Get the current authentication token from Supabase Auth.
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Generic fetch function for making authenticated API requests.
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
  const token = await getAuthToken();

  const headers = new Headers(options.headers);

  // Inject Authorization header if token is available
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Inject x-user-role header (hardcoded as 'manager' for MVP)
  headers.set('x-user-role', 'manager');

  // Set Content-Type for JSON requests if not already set
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
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
