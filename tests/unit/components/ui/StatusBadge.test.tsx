import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge, STATUS_COLORS } from '@/components/ui/StatusBadge'

describe('StatusBadge', () => {
  it('should render with success status', () => {
    render(<StatusBadge semanticStatus="success" label="Aprovado" />)
    expect(screen.getByText('Aprovado')).toBeInTheDocument()
  })

  it('should render with warning status', () => {
    render(<StatusBadge semanticStatus="warning" label="Aguardando" />)
    expect(screen.getByText('Aguardando')).toBeInTheDocument()
  })

  it('should render with error status', () => {
    render(<StatusBadge semanticStatus="error" label="Cancelado" />)
    expect(screen.getByText('Cancelado')).toBeInTheDocument()
  })

  it('should render with info status', () => {
    render(<StatusBadge semanticStatus="info" label="Concluído" />)
    expect(screen.getByText('Concluído')).toBeInTheDocument()
  })

  it('should render with neutral status', () => {
    render(<StatusBadge semanticStatus="neutral" label="Rascunho" />)
    expect(screen.getByText('Rascunho')).toBeInTheDocument()
  })

  it('should render with icon', () => {
    const icon = <span data-testid="test-icon">⚠️</span>
    render(<StatusBadge semanticStatus="warning" label="Atenção" icon={icon} />)
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByText('Atenção')).toBeInTheDocument()
  })

  it('should apply correct color classes for success', () => {
    const { container } = render(<StatusBadge semanticStatus="success" label="Test" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-green-700')
  })

  it('should apply custom className', () => {
    const { container } = render(
      <StatusBadge semanticStatus="success" label="Test" className="custom-class" />
    )
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('custom-class')
  })

  it('should have all required status colors defined', () => {
    expect(STATUS_COLORS.success).toBeDefined()
    expect(STATUS_COLORS.warning).toBeDefined()
    expect(STATUS_COLORS.error).toBeDefined()
    expect(STATUS_COLORS.info).toBeDefined()
    expect(STATUS_COLORS.neutral).toBeDefined()
  })
})
