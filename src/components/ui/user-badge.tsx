import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export interface UserBadgeProps {
  /** User name for generating initials */
  name: string;
  /** User avatar URL (if provided, shows image instead of badge) */
  avatarUrl?: string | null;
  /** Background color (hex) */
  bgColor?: string;
  /** Text/initials color (hex) */
  textColor?: string;
  /** Border color (hex, optional) */
  borderColor?: string | null;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Additional className */
  className?: string;
  /** Show online indicator */
  showOnlineIndicator?: boolean;
  /** Is user online */
  isOnline?: boolean;
}

const SIZE_CLASSES = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
} as const;

const DEFAULT_BG_COLOR = '#fee2e2';
const DEFAULT_TEXT_COLOR = '#991b1b';

/**
 * Generates initials from a name
 * - Single word: first letter
 * - Multiple words: first letter of first and last word
 */
function getInitials(name: string): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const UserBadge = React.forwardRef<HTMLDivElement, UserBadgeProps>(
  (
    {
      name,
      avatarUrl,
      bgColor = DEFAULT_BG_COLOR,
      textColor = DEFAULT_TEXT_COLOR,
      borderColor,
      size = 'md',
      className,
      showOnlineIndicator = false,
      isOnline = false,
    },
    ref
  ) => {
    const initials = getInitials(name);
    const sizeClass = SIZE_CLASSES[size];

    // If user has avatar URL, use Avatar component with image
    if (avatarUrl) {
      return (
        <div ref={ref} className={cn('relative inline-flex', className)}>
          <Avatar className={sizeClass}>
            <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
            <AvatarFallback
              style={{
                backgroundColor: bgColor,
                color: textColor,
                border: borderColor ? `2px solid ${borderColor}` : undefined,
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          {showOnlineIndicator && (
            <span
              className={cn(
                'absolute bottom-0 right-0 block rounded-full ring-2 ring-background',
                size === 'xs' ? 'h-2 w-2' : 'h-3 w-3',
                isOnline ? 'bg-green-500' : 'bg-gray-400'
              )}
            />
          )}
        </div>
      );
    }

    // Otherwise, show badge with initials
    return (
      <div ref={ref} className={cn('relative inline-flex', className)}>
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-semibold',
            sizeClass
          )}
          style={{
            backgroundColor: bgColor,
            color: textColor,
            border: borderColor ? `2px solid ${borderColor}` : undefined,
          }}
          title={name}
        >
          {initials}
        </div>
        {showOnlineIndicator && (
          <span
            className={cn(
              'absolute bottom-0 right-0 block rounded-full ring-2 ring-background',
              size === 'xs' ? 'h-2 w-2' : 'h-3 w-3',
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            )}
          />
        )}
      </div>
    );
  }
);

UserBadge.displayName = 'UserBadge';

export default UserBadge;
