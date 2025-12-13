import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataToolbar } from '@/components/DataToolbar'
import { Button } from '@/components/ui/button'

describe('DataToolbar', () => {
  it('should render without any props', () => {
    render(<DataToolbar />)
    // Should render without errors
    expect(document.querySelector('.backdrop-blur-md')).toBeInTheDocument()
  })

  it('should render search input when onSearchChange is provided', () => {
    const handleSearchChange = vi.fn()
    render(<DataToolbar searchTerm="" onSearchChange={handleSearchChange} />)

    const searchInput = screen.getByPlaceholderText('Buscar leads...')
    expect(searchInput).toBeInTheDocument()
  })

  it('should call onSearchChange when search input changes', async () => {
    const user = userEvent.setup()
    const handleSearchChange = vi.fn()
    render(<DataToolbar searchTerm="" onSearchChange={handleSearchChange} />)

    const searchInput = screen.getByPlaceholderText('Buscar leads...')
    await user.type(searchInput, 't')

    expect(handleSearchChange).toHaveBeenCalled()
    expect(handleSearchChange).toHaveBeenLastCalledWith('t')
  })

  it('should display search term value', () => {
    render(<DataToolbar searchTerm="my search" onSearchChange={vi.fn()} />)

    const searchInput = screen.getByPlaceholderText('Buscar leads...') as HTMLInputElement
    expect(searchInput.value).toBe('my search')
  })

  it('should render view toggle when onViewChange is provided', () => {
    render(<DataToolbar currentView="list" onViewChange={vi.fn()} />)

    expect(screen.getByTitle('Visualização em Lista')).toBeInTheDocument()
    expect(screen.getByTitle('Visualização em Cards')).toBeInTheDocument()
    expect(screen.getByTitle('Visualização Kanban')).toBeInTheDocument()
  })

  it('should call onViewChange when view is changed', async () => {
    const user = userEvent.setup()
    const handleViewChange = vi.fn()
    render(<DataToolbar currentView="list" onViewChange={handleViewChange} />)

    const cardsButton = screen.getByTitle('Visualização em Cards')
    await user.click(cardsButton)

    expect(handleViewChange).toHaveBeenCalledWith('cards')
  })

  it('should highlight current view', () => {
    render(<DataToolbar currentView="cards" onViewChange={vi.fn()} />)

    const cardsButton = screen.getByTitle('Visualização em Cards')
    // Button with 'secondary' variant indicates active state
    expect(cardsButton).toBeInTheDocument()
    // The active button should not have ghost variant styling
    expect(cardsButton.className).not.toContain('ghost')
  })

  it('should render children in filters slot', () => {
    render(
      <DataToolbar>
        <Button>Filter 1</Button>
        <Button>Filter 2</Button>
      </DataToolbar>
    )

    expect(screen.getByText('Filter 1')).toBeInTheDocument()
    expect(screen.getByText('Filter 2')).toBeInTheDocument()
  })

  it('should render actions in actions slot', () => {
    render(
      <DataToolbar
        actions={
          <>
            <Button>Action 1</Button>
            <Button>Action 2</Button>
          </>
        }
      />
    )

    expect(screen.getByText('Action 1')).toBeInTheDocument()
    expect(screen.getByText('Action 2')).toBeInTheDocument()
  })

  it('should render separator between search and filters when both present', () => {
    render(
      <DataToolbar onSearchChange={vi.fn()}>
        <Button>Filter</Button>
      </DataToolbar>
    )

    // Check for separator (vertical orientation)
    const separator = document.querySelector('[data-orientation="vertical"]')
    expect(separator).toBeInTheDocument()
  })

  it('should render separator between actions and view toggle when both present', () => {
    render(
      <DataToolbar
        onViewChange={vi.fn()}
        actions={<Button>Action</Button>}
      />
    )

    // Check for separator (vertical orientation)
    const separator = document.querySelector('[data-orientation="vertical"]')
    expect(separator).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<DataToolbar className="custom-class" />)
    
    const toolbar = container.querySelector('.custom-class')
    expect(toolbar).toBeInTheDocument()
  })

  it('should apply glassmorphism styles', () => {
    const { container } = render(<DataToolbar />)
    
    const toolbar = container.querySelector('.backdrop-blur-md')
    expect(toolbar).toBeInTheDocument()
    expect(toolbar).toHaveClass('bg-background/80')
  })

  it('should handle all view types correctly', async () => {
    const user = userEvent.setup()
    const handleViewChange = vi.fn()
    render(<DataToolbar currentView="list" onViewChange={handleViewChange} />)

    // Test cards view
    const cardsButton = screen.getByTitle('Visualização em Cards')
    await user.click(cardsButton)
    expect(handleViewChange).toHaveBeenCalledWith('cards')

    // Clear mock to isolate the next assertion - needed because we're testing
    // sequential clicks in the same render, not separate test scenarios
    handleViewChange.mockClear()

    // Test kanban view
    const kanbanButton = screen.getByTitle('Visualização Kanban')
    await user.click(kanbanButton)
    expect(handleViewChange).toHaveBeenCalledWith('kanban')
  })

  it('should not render search input when onSearchChange is not provided', () => {
    render(<DataToolbar />)

    expect(screen.queryByPlaceholderText('Buscar leads...')).not.toBeInTheDocument()
  })

  it('should not render view toggle when onViewChange is not provided', () => {
    render(<DataToolbar />)

    expect(screen.queryByTitle('Visualização em Lista')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Visualização em Cards')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Visualização Kanban')).not.toBeInTheDocument()
  })

  it('should render with all features enabled', () => {
    render(
      <DataToolbar
        searchTerm="test"
        onSearchChange={vi.fn()}
        currentView="list"
        onViewChange={vi.fn()}
        actions={<Button>New Lead</Button>}
      >
        <Button>Filter</Button>
      </DataToolbar>
    )

    expect(screen.getByPlaceholderText('Buscar leads...')).toBeInTheDocument()
    expect(screen.getByText('Filter')).toBeInTheDocument()
    expect(screen.getByText('New Lead')).toBeInTheDocument()
    expect(screen.getByTitle('Visualização em Lista')).toBeInTheDocument()
  })
})
