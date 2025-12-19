import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EntityDetailLayout } from '@/components/detail-layout/EntityDetailLayout'

describe('EntityDetailLayout', () => {
  const defaultProps = {
    header: <div data-testid="test-header">Header Content</div>,
    sidebar: <div data-testid="test-sidebar">Sidebar Content</div>,
    content: <div data-testid="test-content">Main Content</div>
  }

  it('renders all sections (header, sidebar, content)', () => {
    render(<EntityDetailLayout {...defaultProps} />)

    expect(screen.getByTestId('test-header')).toBeInTheDocument()
    expect(screen.getByTestId('test-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  it('renders sidebar with sticky container and data-testid', () => {
    render(<EntityDetailLayout {...defaultProps} />)

    const sidebar = screen.getByTestId('entity-detail-sidebar')
    expect(sidebar).toBeInTheDocument()
    expect(sidebar).toHaveClass('lg:sticky')
    expect(sidebar).toHaveClass('lg:top-6')
  })

  it('sidebar container has internal scroll wrapper with overflow-y-auto', () => {
    render(<EntityDetailLayout {...defaultProps} />)

    const sidebar = screen.getByTestId('entity-detail-sidebar')
    const scrollWrapper = sidebar.querySelector('.overflow-y-auto')
    expect(scrollWrapper).toBeInTheDocument()
  })

  it('sidebar has max-height style for viewport constraint', () => {
    render(<EntityDetailLayout {...defaultProps} />)

    const sidebar = screen.getByTestId('entity-detail-sidebar')
    expect(sidebar).toHaveStyle({ maxHeight: 'calc(100vh - 4rem)' })
  })

  it('applies custom className when provided', () => {
    const { container } = render(
      <EntityDetailLayout {...defaultProps} className="custom-class" />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('uses semantic aside and main elements for accessibility', () => {
    const { container } = render(<EntityDetailLayout {...defaultProps} />)

    expect(container.querySelector('aside')).toBeInTheDocument()
    expect(container.querySelector('main')).toBeInTheDocument()
  })
})
