/**
 * Service for interacting with the Calendar API.
 */

import { apiFetch } from '@/lib/apiClient';
import { CalendarEventsResponse, CalendarEventResponse, EventCreate } from '@/types/integration';

/**
 * Parameters for fetching calendar events.
 */
export interface FetchEventsParams {
  time_min?: string;
  limit?: number;
}

/**
 * Fetch calendar events with optional filtering.
 * 
 * @param params - Optional parameters for filtering events
 * @returns Promise resolving to the calendar events response
 */
export async function fetchEvents(
  params: FetchEventsParams = {}
): Promise<CalendarEventsResponse> {
  const searchParams = new URLSearchParams();

  if (params.time_min !== undefined) {
    searchParams.set('time_min', params.time_min);
  }

  if (params.limit !== undefined) {
    searchParams.set('limit', params.limit.toString());
  }

  const queryString = searchParams.toString();
  const endpoint = `/calendar/events${queryString ? `?${queryString}` : ''}`;

  return apiFetch<CalendarEventsResponse>(endpoint);
}

/**
 * Create a new calendar event.
 * 
 * @param event - The event data to create
 * @returns Promise resolving to the created calendar event
 */
export async function createEvent(
  event: EventCreate
): Promise<CalendarEventResponse> {
  return apiFetch<CalendarEventResponse>('/calendar/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}
