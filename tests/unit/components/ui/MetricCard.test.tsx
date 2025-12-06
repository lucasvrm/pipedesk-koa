import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard, ENTITY_COLORS } from '@/components/ui/MetricCard'

describe('MetricCard', () => {
  it('should render label and value', () => {
    render(<MetricCard label="Volume Total" value="R$ 1.500.000" />)
    expect(screen.getByText('Volume Total')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.500.000')).toBeInTheDocument()
  })

  it('should render with icon', () => {
    const icon = <span data-testid="metric-icon">💰</span>
    render(<MetricCard label="Volume" value="1000" icon={icon} />)
    expect(screen.getByTestId('metric-icon')).toBeInTheDocument()
  })

  it('should apply lead color', () => {
    const { container } = render(
      <MetricCard label="Leads" value="42" color="lead" />
    )
    const card = container.querySelector('[data-slot="card"]')
    expect(card?.className).toContain('border-l-purple-500')
  })

  it('should apply deal color', () => {
    const { container } = render(
      <MetricCard label="Deals" value="10" color="deal" />
    )
    const card = container.querySelector('[data-slot="card"]')
    expect(card?.className).toContain('border-l-blue-500')
  })

  it('should apply track color', () => {
    const { container } = render(
      <MetricCard label="Tracks" value="5" color="track" />
    )
    const card = container.querySelector('[data-slot="card"]')
    expect(card?.className).toContain('border-l-emerald-500')
  })

  it('should apply contact color', () => {
    const { container } = render(
      <MetricCard label="Contacts" value="100" color="contact" />
    )
    const card = container.querySelector('[data-slot="card"]')
    expect(card?.className).toContain('border-l-orange-500')
  })

  it('should apply company color', () => {
    const { container } = render(
      <MetricCard label="Companies" value="25" color="company" />
    )
    const card = container.querySelector('[data-slot="card"]')
    expect(card?.className).toContain('border-l-indigo-500')
  })

  it('should apply player color', () => {
    const { container } = render(
      <MetricCard label="Players" value="15" color="player" />
    )
    const card = container.querySelector('[data-slot="card"]')
    expect(card?.className).toContain('border-l-cyan-500')
  })

  it('should default to neutral color when no color specified', () => {
    const { container } = render(
      <MetricCard label="Items" value="50" />
    )
    const card = container.querySelector('[data-slot="card"]')
    expect(card?.className).toContain('border-l-slate-300')
  })

  it('should render ReactNode as value', () => {
    const complexValue = (
      <div>
        <span>R$ 1.000</span>
        <span className="text-sm"> / mês</span>
      </div>
    )
    render(<MetricCard label="MRR" value={complexValue} />)
    expect(screen.getByText('R$ 1.000')).toBeInTheDocument()
    expect(screen.getByText('/ mês')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <MetricCard label="Test" value="123" className="custom-class" />
    )
    const card = container.querySelector('[data-slot="card"]')
    expect(card?.className).toContain('custom-class')
  })

  it('should have all entity colors defined', () => {
    expect(ENTITY_COLORS.lead).toBeDefined()
    expect(ENTITY_COLORS.deal).toBeDefined()
    expect(ENTITY_COLORS.track).toBeDefined()
    expect(ENTITY_COLORS.contact).toBeDefined()
    expect(ENTITY_COLORS.company).toBeDefined()
    expect(ENTITY_COLORS.player).toBeDefined()
    expect(ENTITY_COLORS.neutral).toBeDefined()
  })
})
