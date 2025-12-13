/**
 * Service for interacting with the Timeline API.
 */

import { apiFetch } from '@/lib/apiClient';
import { EntityType, TimelineResponse } from '@/types/integration';

/**
 * Fetch the timeline for a specific entity.
 * 
 * @param type - The type of entity ('lead', 'deal', or 'contact')
 * @param id - The ID of the entity
 * @param limit - Optional limit for pagination (number of entries to return)
 * @param offset - Optional offset for pagination (number of entries to skip)
 * @returns Promise resolving to the timeline response
 */
export async function fetchTimeline(
  type: EntityType,
  id: string,
  limit?: number,
  offset?: number
): Promise<TimelineResponse> {
  const params = new URLSearchParams();
  
  if (limit !== undefined) {
    params.set('limit', limit.toString());
  }
  
  if (offset !== undefined) {
    params.set('offset', offset.toString());
  }

  const queryString = params.toString();
  const endpoint = `/timeline/${type}/${id}${queryString ? `?${queryString}` : ''}`;

  return apiFetch<TimelineResponse>(endpoint);
}
