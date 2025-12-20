import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/helpers'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  searchQuery,
  onSelect,
  position,
  isOpen,
  onClose
}: MentionsDropdownProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const query = searchQuery.toLowerCase()
    return users.filter(user => 
      user.name.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredUsers])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

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
  }, [isOpen, filteredUsers, selectedIndex, onSelect, onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  if (!isOpen || filteredUsers.length === 0) return null

  // Highlight matching text in name
  const highlightMatch = (name: string, query: string) => {
    if (!query.trim()) return name
    
    const lowerName = name.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerName.indexOf(lowerQuery)
    
    if (index === -1) return name

    return (
      <>
        {name.slice(0, index)}
        <span className="font-bold text-primary">
          {name.slice(index, index + query.length)}
        </span>
        {name.slice(index + query.length)}
      </>
    )
  }

  return (
    <div
      className="absolute z-50 min-w-[200px] max-w-[280px] bg-popover border rounded-lg shadow-lg overflow-hidden"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b bg-muted/30">
        <span className="text-xs text-muted-foreground">
          {searchQuery ? `Buscando "${searchQuery}"` : 'Mencionar usuário'}
        </span>
      </div>

      {/* Users list */}
      <div ref={listRef} className="max-h-[200px] overflow-y-auto py-1">
        {filteredUsers.map((user, index) => (
          <button
            key={user.id}
            type="button"
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
              "hover:bg-accent focus:bg-accent focus:outline-none",
              index === selectedIndex && "bg-accent"
            )}
            onClick={() => onSelect(user)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <Avatar className="h-6 w-6 border">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-[10px] bg-muted">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-foreground">
              {highlightMatch(user.name, searchQuery)}
            </span>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t bg-muted/30">
        <span className="text-[10px] text-muted-foreground">
          ↑↓ navegar · Enter selecionar · Esc fechar
        </span>
      </div>
    </div>
  )
}
