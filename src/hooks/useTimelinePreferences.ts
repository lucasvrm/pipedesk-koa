import { useAuth } from '@/contexts/AuthContext';
import { 
  DEFAULT_ENABLED_EVENTS, 
  DEFAULT_TIMELINE_COLORS,
} from '@/constants/timeline';
import type { TimelineEventType } from '@/lib/types';

export function useTimelinePreferences() {
  const { profile } = useAuth();
  
  const preferences = profile?.preferences?.timeline;
  
  const enabledEvents: Record<TimelineEventType, boolean> = {
    ...DEFAULT_ENABLED_EVENTS,
    ...preferences?.enabledEvents
  };
  
  const eventColors: Record<TimelineEventType, string> = {
    ...DEFAULT_TIMELINE_COLORS,
    ...preferences?.eventColors
  };
  
  const isEventEnabled = (eventType: TimelineEventType): boolean => {
    return enabledEvents[eventType] ?? true;
  };
  
  const getEventColor = (eventType: TimelineEventType): string => {
    return eventColors[eventType] ?? '#6b7280';
  };
  
  return {
    enabledEvents,
    eventColors,
    isEventEnabled,
    getEventColor
  };
}
