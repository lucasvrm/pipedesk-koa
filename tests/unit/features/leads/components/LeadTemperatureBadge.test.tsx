import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LeadTemperatureBadge } from '@/features/leads/components/LeadTemperatureBadge'

describe('LeadTemperatureBadge', () => {
  it('renders "Quente" for hot priority bucket', () => {
    render(<LeadTemperatureBadge priorityBucket="hot" />)
    expect(screen.getByText('Quente')).toBeInTheDocument()
  })

  it('renders "Morno" for warm priority bucket', () => {
    render(<LeadTemperatureBadge priorityBucket="warm" />)
    expect(screen.getByText('Morno')).toBeInTheDocument()
  })

  it('renders "Frio" for cold priority bucket', () => {
    render(<LeadTemperatureBadge priorityBucket="cold" />)
    expect(screen.getByText('Frio')).toBeInTheDocument()
  })

  it('returns null for undefined priority bucket', () => {
    const { container } = render(<LeadTemperatureBadge priorityBucket={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null for null priority bucket', () => {
    const { container } = render(<LeadTemperatureBadge priorityBucket={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('applies custom className when provided', () => {
    render(<LeadTemperatureBadge priorityBucket="hot" className="custom-class" />)
    const badge = screen.getByText('Quente')
    expect(badge).toHaveClass('custom-class')
  })

  it('applies correct styling for hot badge', () => {
    render(<LeadTemperatureBadge priorityBucket="hot" />)
    const badge = screen.getByText('Quente')
    expect(badge).toHaveClass('bg-red-100')
    expect(badge).toHaveClass('text-red-700')
  })

  it('applies correct styling for warm badge', () => {
    render(<LeadTemperatureBadge priorityBucket="warm" />)
    const badge = screen.getByText('Morno')
    expect(badge).toHaveClass('bg-amber-100')
    expect(badge).toHaveClass('text-amber-700')
  })

  it('applies correct styling for cold badge', () => {
    render(<LeadTemperatureBadge priorityBucket="cold" />)
    const badge = screen.getByText('Frio')
    expect(badge).toHaveClass('bg-blue-50')
    expect(badge).toHaveClass('text-blue-600')
  })
})
