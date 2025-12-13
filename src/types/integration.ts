/**
 * Integration types for communicating with the new PipeDesk Backend API.
 * These types define the data structures for Timeline and Calendar endpoints.
 */

/**
 * Entity types supported by the Timeline API.
 */
export type EntityType = 'lead' | 'deal' | 'contact';

/**
 * User information included in timeline entries.
 */
export interface TimelineUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

/**
 * A single entry in the timeline representing an activity or event.
 */
export interface TimelineEntry {
  id: string;
  entityType: EntityType;
  entityId: string;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  createdBy: TimelineUser;
}

/**
 * Response structure for the Timeline API endpoint.
 */
export interface TimelineResponse {
  entries: TimelineEntry[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Payload for creating a new calendar event.
 */
export interface EventCreate {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  entityType?: EntityType;
  entityId?: string;
  attendees?: string[];
  addMeetLink?: boolean;
}

/**
 * Calendar event returned by the API.
 */
export interface CalendarEventResponse {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  entityType?: EntityType;
  entityId?: string;
  attendees?: string[];
  createdAt: string;
  createdBy: TimelineUser;
}

/**
 * Response structure for the Calendar events list endpoint.
 */
export interface CalendarEventsResponse {
  events: CalendarEventResponse[];
  total: number;
}
