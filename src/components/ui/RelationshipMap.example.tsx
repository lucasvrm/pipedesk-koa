import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { RelationshipMap } from '@/components/ui/RelationshipMap'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * RelationshipMap Example
 * 
 * This file demonstrates how to use the RelationshipMap component
 * to visualize entity relationships in the system.
 */

// Example 1: Simple Lead to Company relationship
const simpleExample = {
  nodes: [
    { id: 'lead-1', label: 'Lead ABC Corp', type: 'lead' as const },
    { id: 'company-1', label: 'ABC Corporation', type: 'company' as const },
  ],
  edges: [{ from: 'lead-1', to: 'company-1' }],
}

// Example 2: Complete flow Lead → Company → Deal → Player
const completeFlowExample = {
  nodes: [
    { id: 'lead-1', label: 'Lead Tech Startup', type: 'lead' as const },
    { id: 'company-1', label: 'Tech Innovations Inc', type: 'company' as const },
    { id: 'deal-1', label: 'Series A Funding', type: 'deal' as const },
    { id: 'player-1', label: 'Investor A', type: 'player' as const },
    { id: 'player-2', label: 'Investor B', type: 'player' as const },
  ],
  edges: [
    { from: 'lead-1', to: 'company-1' },
    { from: 'company-1', to: 'deal-1' },
    { from: 'deal-1', to: 'player-1' },
    { from: 'deal-1', to: 'player-2' },
  ],
}

// Example 3: Multiple deals from one company
const multiplDealsExample = {
  nodes: [
    { id: 'company-1', label: 'Real Estate Corp', type: 'company' as const },
    { id: 'deal-1', label: 'CRI Construction', type: 'deal' as const },
    { id: 'deal-2', label: 'CRI Corporate', type: 'deal' as const },
    { id: 'deal-3', label: 'Built to Suit', type: 'deal' as const },
    { id: 'player-1', label: 'Bank A', type: 'player' as const },
    { id: 'player-2', label: 'Fund B', type: 'player' as const },
    { id: 'player-3', label: 'Investor C', type: 'player' as const },
  ],
  edges: [
    { from: 'company-1', to: 'deal-1' },
    { from: 'company-1', to: 'deal-2' },
    { from: 'company-1', to: 'deal-3' },
    { from: 'deal-1', to: 'player-1' },
    { from: 'deal-2', to: 'player-2' },
    { from: 'deal-3', to: 'player-3' },
  ],
}

// Example 4: Complex network
const complexExample = {
  nodes: [
    { id: 'lead-1', label: 'Lead Alpha', type: 'lead' as const },
    { id: 'lead-2', label: 'Lead Beta', type: 'lead' as const },
    { id: 'company-1', label: 'Alpha Inc', type: 'company' as const },
    { id: 'company-2', label: 'Beta Corp', type: 'company' as const },
    { id: 'deal-1', label: 'Deal Alpha-1', type: 'deal' as const },
    { id: 'deal-2', label: 'Deal Alpha-2', type: 'deal' as const },
    { id: 'deal-3', label: 'Deal Beta-1', type: 'deal' as const },
    { id: 'player-1', label: 'Player X', type: 'player' as const },
    { id: 'player-2', label: 'Player Y', type: 'player' as const },
    { id: 'player-3', label: 'Player Z', type: 'player' as const },
  ],
  edges: [
    { from: 'lead-1', to: 'company-1' },
    { from: 'lead-2', to: 'company-2' },
    { from: 'company-1', to: 'deal-1' },
    { from: 'company-1', to: 'deal-2' },
    { from: 'company-2', to: 'deal-3' },
    { from: 'deal-1', to: 'player-1' },
    { from: 'deal-1', to: 'player-2' },
    { from: 'deal-2', to: 'player-2' },
    { from: 'deal-3', to: 'player-3' },
  ],
}

export function RelationshipMapExamples() {
  return (
    <BrowserRouter>
      <div className="container mx-auto p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">RelationshipMap Examples</h1>
          <p className="text-muted-foreground">
            Interactive graph visualization showing entity relationships
          </p>
        </div>

        {/* Example 1 */}
        <Card>
          <CardHeader>
            <CardTitle>Example 1: Simple Lead → Company</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <RelationshipMap
                nodes={simpleExample.nodes}
                edges={simpleExample.edges}
              />
            </div>
          </CardContent>
        </Card>

        {/* Example 2 */}
        <Card>
          <CardHeader>
            <CardTitle>
              Example 2: Complete Flow (Lead → Company → Deal → Players)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <RelationshipMap
                nodes={completeFlowExample.nodes}
                edges={completeFlowExample.edges}
              />
            </div>
          </CardContent>
        </Card>

        {/* Example 3 */}
        <Card>
          <CardHeader>
            <CardTitle>Example 3: Company with Multiple Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[450px]">
              <RelationshipMap
                nodes={multiplDealsExample.nodes}
                edges={multiplDealsExample.edges}
              />
            </div>
          </CardContent>
        </Card>

        {/* Example 4 */}
        <Card>
          <CardHeader>
            <CardTitle>Example 4: Complex Network</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              <RelationshipMap
                nodes={complexExample.nodes}
                edges={complexExample.edges}
              />
            </div>
          </CardContent>
        </Card>

        {/* Custom onClick Handler Example */}
        <Card>
          <CardHeader>
            <CardTitle>Example 5: Custom Click Handler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <RelationshipMap
                nodes={simpleExample.nodes}
                edges={simpleExample.edges}
                onNodeClick={(node) => {
                  alert(`Clicked on ${node.type}: ${node.label}`)
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Instructions</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h3>Basic Usage</h3>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              {`import { RelationshipMap } from '@/components/ui/RelationshipMap'

const nodes = [
  { id: '1', label: 'Lead ABC', type: 'lead' },
  { id: '2', label: 'Company XYZ', type: 'company' },
]

const edges = [
  { from: '1', to: '2' }
]

<RelationshipMap nodes={nodes} edges={edges} />`}
            </pre>

            <h3 className="mt-4">Features</h3>
            <ul>
              <li>
                <strong>Interactive nodes:</strong> Click to navigate to entity
                pages
              </li>
              <li>
                <strong>Drag & drop:</strong> Drag nodes to rearrange the graph
              </li>
              <li>
                <strong>Zoom & pan:</strong> Mouse wheel to zoom, drag background
                to pan
              </li>
              <li>
                <strong>Hover states:</strong> Hover over nodes to see entity type
                and details
              </li>
              <li>
                <strong>Responsive:</strong> Adapts to container size
              </li>
            </ul>

            <h3 className="mt-4">Node Types</h3>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#3b82f6]" />
                <span>Lead (Blue)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#10b981]" />
                <span>Company (Green)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#f59e0b]" />
                <span>Deal (Amber)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#8b5cf6]" />
                <span>Player (Purple)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </BrowserRouter>
  )
}

export default RelationshipMapExamples
