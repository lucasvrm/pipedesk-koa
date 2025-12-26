import React, { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as d3 from 'd3'
import { cn } from '@/lib/utils'

/**
 * Node types supported by the RelationshipMap
 */
export type RelationshipNodeType = 'lead' | 'company' | 'deal' | 'player'

/**
 * Represents a single node in the relationship graph
 */
export interface RelationshipNode {
  id: string
  label: string
  type: RelationshipNodeType
}

/**
 * Represents a connection between two nodes
 */
export interface RelationshipEdge {
  from: string
  to: string
}

/**
 * Props for the RelationshipMap component
 */
export interface RelationshipMapProps {
  nodes: RelationshipNode[]
  edges: RelationshipEdge[]
  className?: string
  onNodeClick?: (node: RelationshipNode) => void
}

// Color mapping for different node types
const NODE_COLORS: Record<RelationshipNodeType, string> = {
  lead: '#3b82f6',      // blue
  company: '#10b981',   // green
  deal: '#f59e0b',      // amber
  player: '#8b5cf6',    // purple
}

// Label mapping for node types
const NODE_TYPE_LABELS: Record<RelationshipNodeType, string> = {
  lead: 'Lead',
  company: 'Empresa',
  deal: 'Deal',
  player: 'Player',
}

/**
 * RelationshipMap - Visual graph component showing entity relationships
 * 
 * This component renders an interactive graph visualization of relationships
 * between entities (Lead → Company → Deal → Player). Nodes are clickable
 * for navigation and support hover states.
 * 
 * @example
 * ```tsx
 * const nodes = [
 *   { id: '1', label: 'Lead ABC', type: 'lead' },
 *   { id: '2', label: 'Company XYZ', type: 'company' },
 * ]
 * const edges = [
 *   { from: '1', to: '2' }
 * ]
 * <RelationshipMap nodes={nodes} edges={edges} />
 * ```
 */
export function RelationshipMap({
  nodes,
  edges,
  className,
  onNodeClick,
}: RelationshipMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    // Create zoom behavior
    const g = svg.append('g')
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform.toString())
      })

    svg.call(zoom)

    // Create force simulation
    interface SimulationNode extends d3.SimulationNodeDatum {
      id: string
      label: string
      type: RelationshipNodeType
      x?: number
      y?: number
      fx?: number | null
      fy?: number | null
    }

    interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
      source: string | SimulationNode
      target: string | SimulationNode
    }

    const simulationNodes: SimulationNode[] = nodes.map((node) => ({
      id: node.id,
      label: node.label,
      type: node.type,
    }))

    const simulationLinks: SimulationLink[] = edges.map((edge) => ({
      source: edge.from,
      target: edge.to,
    }))

    const simulation = d3
      .forceSimulation<SimulationNode>(simulationNodes)
      .force(
        'link',
        d3
          .forceLink<SimulationNode, SimulationLink>(simulationLinks)
          .id((d) => d.id)
          .distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(60))

    // Draw edges
    const link = g
      .append('g')
      .selectAll('line')
      .data(simulationLinks)
      .join('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)')

    // Add arrow marker
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94a3b8')

    // Draw nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(simulationNodes)
      .join('g')
      .attr('cursor', 'pointer')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .call(
        d3
          .drag<SVGGElement, SimulationNode>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended) as any
      )

    // Node circles
    node
      .append('circle')
      .attr('r', 20)
      .attr('fill', (d) => NODE_COLORS[d.type])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    // Node labels
    node
      .append('text')
      .text((d) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', 35)
      .attr('font-size', '12px')
      .attr('fill', '#1e293b')
      .attr('font-weight', 500)

    // Node event handlers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    node
      .on('mouseenter', function (this: any, _event: any, d: any) {
        setHoveredNode(d.id)
        d3.select(this).select('circle').attr('r', 24).attr('stroke-width', 3)
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('mouseleave', function (this: any) {
        setHoveredNode(null)
        d3.select(this).select('circle').attr('r', 20).attr('stroke-width', 2)
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('click', (_event: any, d: any) => {
        _event.stopPropagation()
        const node = nodes.find((n) => n.id === d.id)
        if (node) {
          if (onNodeClick) {
            onNodeClick(node)
          } else {
            // Default navigation based on entity type
            const routes: Record<RelationshipNodeType, string> = {
              lead: `/leads/${node.id}`,
              company: `/companies/${node.id}`,
              deal: `/deals/${node.id}`,
              player: `/deals/tracks/${node.id}`,
            }
            navigate(routes[node.type])
          }
        }
      })

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimulationNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimulationNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimulationNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimulationNode).y ?? 0)

      node.attr(
        'transform',
        (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`
      )
    })

    // Drag functions
    function dragstarted(
      event: d3.D3DragEvent<SVGGElement, SimulationNode, SimulationNode>
    ) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    function dragged(
      event: d3.D3DragEvent<SVGGElement, SimulationNode, SimulationNode>
    ) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    function dragended(
      event: d3.D3DragEvent<SVGGElement, SimulationNode, SimulationNode>
    ) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [nodes, edges, navigate, onNodeClick])

  // Get hovered node data
  const hoveredNodeData = hoveredNode
    ? nodes.find((n) => n.id === hoveredNode)
    : null

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-full min-h-[400px]', className)}
    >
      <svg ref={svgRef} className="w-full h-full" />
      {hoveredNodeData && (
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: NODE_COLORS[hoveredNodeData.type] }}
            />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {NODE_TYPE_LABELS[hoveredNodeData.type]}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {hoveredNodeData.label}
          </p>
        </div>
      )}
    </div>
  )
}
