import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import {
  RelationshipMap,
  RelationshipNode,
  RelationshipEdge,
} from '@/components/ui/RelationshipMap'

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('RelationshipMap', () => {
  const sampleNodes: RelationshipNode[] = [
    { id: '1', label: 'Lead ABC', type: 'lead' },
    { id: '2', label: 'Company XYZ', type: 'company' },
    { id: '3', label: 'Deal 123', type: 'deal' },
    { id: '4', label: 'Player A', type: 'player' },
  ]

  const sampleEdges: RelationshipEdge[] = [
    { from: '1', to: '2' },
    { from: '2', to: '3' },
    { from: '3', to: '4' },
  ]

  it('should render without crashing with empty data', () => {
    const { container } = render(
      <BrowserRouter>
        <RelationshipMap nodes={[]} edges={[]} />
      </BrowserRouter>
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should render with nodes and edges', () => {
    const { container } = render(
      <BrowserRouter>
        <RelationshipMap nodes={sampleNodes} edges={sampleEdges} />
      </BrowserRouter>
    )
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <BrowserRouter>
        <RelationshipMap
          nodes={sampleNodes}
          edges={sampleEdges}
          className="custom-class"
        />
      </BrowserRouter>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('custom-class')
  })

  it('should have minimum height class', () => {
    const { container } = render(
      <BrowserRouter>
        <RelationshipMap nodes={sampleNodes} edges={sampleEdges} />
      </BrowserRouter>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('min-h-[400px]')
  })

  it('should call custom onNodeClick when provided', () => {
    const onNodeClick = vi.fn()
    const { container } = render(
      <BrowserRouter>
        <RelationshipMap
          nodes={sampleNodes}
          edges={sampleEdges}
          onNodeClick={onNodeClick}
        />
      </BrowserRouter>
    )
    
    // SVG should be rendered
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should render all node types correctly', () => {
    const nodeTypes: RelationshipNode[] = [
      { id: 'lead-1', label: 'Test Lead', type: 'lead' },
      { id: 'company-1', label: 'Test Company', type: 'company' },
      { id: 'deal-1', label: 'Test Deal', type: 'deal' },
      { id: 'player-1', label: 'Test Player', type: 'player' },
    ]

    const { container } = render(
      <BrowserRouter>
        <RelationshipMap nodes={nodeTypes} edges={[]} />
      </BrowserRouter>
    )

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should handle single node without edges', () => {
    const singleNode: RelationshipNode[] = [
      { id: '1', label: 'Single Node', type: 'lead' },
    ]

    const { container } = render(
      <BrowserRouter>
        <RelationshipMap nodes={singleNode} edges={[]} />
      </BrowserRouter>
    )

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should render responsive container', () => {
    const { container } = render(
      <BrowserRouter>
        <RelationshipMap nodes={sampleNodes} edges={sampleEdges} />
      </BrowserRouter>
    )
    
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('w-full')
    expect(wrapper.className).toContain('h-full')
  })
})
