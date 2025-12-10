import { ReactNode } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { DotsThreeOutline } from '@phosphor-icons/react'
import { safeString } from '@/lib/utils'

/**
 * Action type for quick actions menu items.
 * 
 * IMPORTANT: All action objects MUST have a valid 'label' property (string).
 * This prevents React Error #185: "Objects are not valid as a React child".
 * 
 * @property id - Unique identifier for the action
 * @property label - Display text for the action (must be string, not object)
 * @property onClick - Handler function to execute when action is clicked
 * @property icon - Optional icon component to display before label
 * @property variant - Visual variant: 'default' or 'destructive'
 * @property disabled - Whether the action is disabled
 * @property subActions - Optional nested actions for submenu
 */
export interface QuickAction {
  id: string
  label: string
  icon?: ReactNode
  onClick?: () => void
  variant?: 'default' | 'destructive'
  disabled?: boolean
  subActions?: QuickAction[]
}

export interface QuickActionsMenuProps {
  actions: QuickAction[]
  label?: string
  triggerIcon?: ReactNode
  triggerVariant?: 'default' | 'outline' | 'ghost' | 'secondary'
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon'
  align?: 'start' | 'center' | 'end'
}

/**
 * QuickActionsMenu - Reusable dropdown menu component for entity quick actions
 * 
 * Provides a consistent UX for common entity operations across the application.
 * Supports nested actions via subActions property.
 * 
 * @example
 * ```tsx
 * <QuickActionsMenu
 *   label="Ações"
 *   actions={[
 *     { id: 'edit', label: 'Editar', icon: <PencilSimple />, onClick: handleEdit },
 *     { id: 'delete', label: 'Excluir', icon: <Trash />, onClick: handleDelete, variant: 'destructive' }
 *   ]}
 * />
 * ```
 */
export function QuickActionsMenu({
  actions,
  label,
  triggerIcon = <DotsThreeOutline className="h-4 w-4" />,
  triggerVariant = 'ghost',
  triggerSize = 'icon',
  align = 'end'
}: QuickActionsMenuProps) {
  const sanitizeLabel = (value: unknown, fallback = 'Ação') => safeString(value, fallback)

  // Filter out invalid actions to prevent rendering issues.
  // Actions MUST have a valid 'id' and 'label' to be rendered.
  // This defensive check prevents React Error #185 if actions array contains malformed objects.
  const validActions = actions.filter((action): action is QuickAction => {
    if (!action || typeof action !== 'object') return false
    if (!action.id || typeof action.id !== 'string') return false
    if (!action.label || typeof action.label !== 'string') return false
    return true
  })

  const renderAction = (action: QuickAction) => {
    // IMPORTANT: Always use sanitizeLabel(action.label) instead of rendering action or action.label directly.
    // This prevents "Objects are not valid as a React child" errors (React Error #185).
    // If action.label is somehow an object at runtime (e.g., {en: "View", pt: "Ver"}),
    // sanitizeLabel will convert it to a safe string fallback.
    const actionLabel = sanitizeLabel(action.label)

    // If action has sub-actions, render as submenu
    if (action.subActions && action.subActions.length > 0) {
      return (
        <DropdownMenuSub key={action.id}>
          <DropdownMenuSubTrigger disabled={action.disabled}>
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {actionLabel}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {action.subActions.map(subAction => {
              const subActionLabel = sanitizeLabel(subAction.label)

              return (
                <DropdownMenuItem
                  key={subAction.id}
                  onClick={subAction.onClick}
                  disabled={subAction.disabled}
                  className={subAction.variant === 'destructive' ? 'text-red-600 focus:text-red-600' : ''}
                >
                  {subAction.icon && <span className="mr-2">{subAction.icon}</span>}
                  {subActionLabel}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )
    }

    // Regular menu item
    return (
      <DropdownMenuItem
        key={action.id}
        onClick={action.onClick}
        disabled={action.disabled}
        className={action.variant === 'destructive' ? 'text-red-600 focus:text-red-600' : ''}
      >
        {action.icon && <span className="mr-2">{action.icon}</span>}
        {actionLabel}
      </DropdownMenuItem>
    )
  }

  const triggerLabel = label ? sanitizeLabel(label) : null
  const showMenuLabel = Boolean(triggerLabel)

  // Early return if no valid actions to render
  if (validActions.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={triggerVariant}
          size={triggerSize}
          className="focus-visible:ring-1"
        >
          {triggerIcon}
          {triggerLabel && <span className="ml-2">{triggerLabel}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        {showMenuLabel && (
          <>
            <DropdownMenuLabel>Ações Rápidas</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        {/* Iterate over validActions (already filtered) instead of raw actions.
            This ensures we never attempt to render malformed action objects. */}
        {validActions.map((action, index) => (
          <div key={action.id}>
            {renderAction(action)}
            {/* Add separator after groups of related actions */}
            {index < validActions.length - 1 && action.id.includes('separator') && (
              <DropdownMenuSeparator />
            )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
