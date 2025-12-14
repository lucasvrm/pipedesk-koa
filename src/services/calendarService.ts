/**
 * Service for interacting with the Calendar API.
 */

import { apiFetch, ApiError } from '@/lib/apiClient';
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
 * Sends data in both camelCase (startTime/endTime) and snake_case (start_time/end_time)
 * to ensure compatibility with different backend API versions.
 * 
 * @param event - The event data to create
 * @returns Promise resolving to the created calendar event
 */
export async function createEvent(
  event: EventCreate
): Promise<CalendarEventResponse> {
  // Build payload with both naming conventions to ensure compatibility with different backend versions
  // This is intentional: the backend may expect either camelCase or snake_case field names,
  // and may use 'summary' (Google Calendar standard) or 'title' (common CRM convention).
  // Sending both allows the backend to pick whichever it expects without requiring version detection.
  const payload = {
    // Standard fields (camelCase)
    title: event.title,
    startTime: event.startTime,
    endTime: event.endTime,
    // Alternative fields (snake_case / Google Calendar naming)
    summary: event.title,
    start_time: event.startTime,
    end_time: event.endTime,
    // Optional fields
    ...(event.description && { description: event.description }),
    ...(event.entityType && { entityType: event.entityType, entity_type: event.entityType }),
    ...(event.entityId && { entityId: event.entityId, entity_id: event.entityId }),
    ...(event.attendees && { attendees: event.attendees }),
    ...(event.addMeetLink !== undefined && { addMeetLink: event.addMeetLink, add_meet_link: event.addMeetLink }),
  };

  try {
    return await apiFetch<CalendarEventResponse>('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Log detailed error for 422 validation errors without exposing tokens
    if (error instanceof ApiError && error.status === 422) {
      console.error('[CalendarService] Validation error (422) creating event:', {
        sentPayload: {
          title: payload.title,
          summary: payload.summary,
          startTime: payload.startTime,
          endTime: payload.endTime,
          start_time: payload.start_time,
          end_time: payload.end_time,
          entityType: payload.entityType,
          entityId: payload.entityId !== undefined ? '[REDACTED]' : undefined,
          addMeetLink: payload.addMeetLink,
        },
        error: error.message,
      });
    }
    throw error;
  }
}
