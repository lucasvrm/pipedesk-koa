import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/helpers'
import { UserBadge } from '@/components/ui/user-badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { TimelineAuthor } from './types'

interface MentionsDropdownProps {
  users: TimelineAuthor[]
  searchQuery: string
  onSelect: (user: TimelineAuthor) => void
  position: { top: number; left: number }
  isOpen: boolean
  onClose?: () => void
}

export function MentionsDropdown({
  users,
  searchQuery: externalSearchQuery,
  onSelect,
  position,
  isOpen,
  onClose
}: MentionsDropdownProps) {
  const [internalSearch, setInternalSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Combine external and internal search - prefer internal if has content
  const effectiveSearch = internalSearch.trim() ? internalSearch : externalSearchQuery

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!effectiveSearch.trim()) return users
    const query = effectiveSearch.toLowerCase()
    return users.filter(user =>
      user.name.toLowerCase().includes(query)
    )
  }, [users, effectiveSearch])

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setInternalSearch('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredUsers])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': 
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (filteredUsers[selectedIndex]) {
          onSelect(filteredUsers[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose?.()
        break
    }
  }, [filteredUsers, selectedIndex, onSelect, onClose])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredUsers.length > 0) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, filteredUsers.length])

  if (!isOpen) return null

  return (
    <div
      className="absolute z-50 w-[280px] bg-popover border rounded-lg shadow-xl overflow-hidden"
      style={{
        bottom: '100%',
        left: position.left,
        marginBottom: 8
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Search input */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Buscar usuário..."
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Users list */}
      <ScrollArea className="h-[240px]">
        <div ref={listRef} className="py-1">
          {filteredUsers.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          ) : (
            filteredUsers.map((user, index) => (
              <button
                key={user.id}
                type="button"
                data-index={index}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors",
                  "hover:bg-accent focus:bg-accent focus:outline-none",
                  index === selectedIndex && "bg-accent"
                )}
                onClick={() => onSelect(user)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <UserBadge
                  name={user.name}
                  avatarUrl={user.avatar}
                  bgColor={user.avatarBgColor}
                  textColor={user.avatarTextColor}
                  borderColor={user.avatarBorderColor}
                  size="sm"
                />
                <span className="truncate font-medium text-foreground">
                  {user.name}
                </span>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t bg-muted/30 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          ↑↓ navegar · Enter selecionar
        </span>
        <span className="text-[10px] text-muted-foreground">
          {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
