import { useKV } from '@github/spark/hooks'
import { Task } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Flag, LinkSimple } from '@phosphor-icons/react'
import { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'
import CreateTaskDialog from '@/features/tasks/components/CreateTaskDialog'
import { formatDate } from '@/lib/helpers'

interface PlayerGanttProps {
  playerTrackId: string
}

interface GanttTask {
  id: string
  title: string
  start: Date
  end: Date
  completed: boolean
  isMilestone: boolean
  dependencies: string[]
  position: number
}

export default function PlayerGantt({ playerTrackId }: PlayerGanttProps) {
  const [tasks] = useKV<Task[]>('tasks', [])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const trackTasks = (tasks || []).filter(t => t.playerTrackId === playerTrackId)

  const ganttTasks: GanttTask[] = trackTasks.map(task => {
    const start = task.createdAt ? new Date(task.createdAt) : new Date()
    const end = task.dueDate ? new Date(task.dueDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return {
      id: task.id,
      title: task.title,
      start,
      end,
      completed: task.completed,
      isMilestone: task.isMilestone,
      dependencies: task.dependencies,
      position: task.position,
    }
  }).sort((a, b) => a.position - b.position)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || ganttTasks.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const container = containerRef.current
    const width = container.clientWidth
    const margin = { top: 40, right: 20, bottom: 40, left: 200 }
    const rowHeight = 40
    const height = ganttTasks.length * rowHeight + margin.top + margin.bottom

    svg.attr('width', width).attr('height', height)

    const chart = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const allDates = ganttTasks.flatMap(t => [t.start, t.end])
    const minDate = d3.min(allDates) || new Date()
    const maxDate = d3.max(allDates) || new Date()
    
    const timePadding = (maxDate.getTime() - minDate.getTime()) * 0.1
    const xScale = d3.scaleTime()
      .domain([new Date(minDate.getTime() - timePadding), new Date(maxDate.getTime() + timePadding)])
      .range([0, width - margin.left - margin.right])

    const xAxis = d3.axisTop(xScale)
      .ticks(d3.timeWeek.every(1))
      .tickFormat((d) => d3.timeFormat('%d %b')(d as Date))

    chart.append('g')
      .attr('class', 'x-axis')
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', 'oklch(0.48 0.02 240)')

    const yScale = d3.scaleBand()
      .domain(ganttTasks.map(t => t.id))
      .range([0, ganttTasks.length * rowHeight])
      .padding(0.2)

    ganttTasks.forEach((task, i) => {
      const y = i * rowHeight
      const barHeight = rowHeight * 0.6

      const taskGroup = chart.append('g')
        .attr('class', 'task-row')

      taskGroup.append('rect')
        .attr('x', 0)
        .attr('y', y)
        .attr('width', width - margin.left - margin.right)
        .attr('height', rowHeight)
        .attr('fill', i % 2 === 0 ? 'oklch(0.98 0 0)' : 'oklch(0.95 0.01 240)')
        .attr('opacity', 0.5)

      taskGroup.append('text')
        .attr('x', -10)
        .attr('y', y + rowHeight / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '12px')
        .style('font-weight', '500')
        .style('fill', 'oklch(0.25 0.02 240)')
        .text(task.title.length > 25 ? task.title.substring(0, 25) + '...' : task.title)

      if (task.isMilestone) {
        const milestoneX = xScale(task.end)
        
        taskGroup.append('path')
          .attr('d', d3.symbol().type(d3.symbolDiamond).size(200))
          .attr('transform', `translate(${milestoneX},${y + rowHeight / 2})`)
          .attr('fill', 'oklch(0.68 0.17 45)')
          .attr('stroke', 'oklch(0.98 0 0)')
          .attr('stroke-width', 2)
      } else {
        taskGroup.append('rect')
          .attr('x', xScale(task.start))
          .attr('y', y + (rowHeight - barHeight) / 2)
          .attr('width', Math.max(xScale(task.end) - xScale(task.start), 3))
          .attr('height', barHeight)
          .attr('rx', 4)
          .attr('fill', task.completed ? 'oklch(0.65 0.15 145)' : 'oklch(0.45 0.12 250)')
          .attr('opacity', task.completed ? 0.6 : 0.9)
      }

      if (task.dependencies.length > 0) {
        task.dependencies.forEach(depId => {
          const depTask = ganttTasks.find(t => t.id === depId)
          if (!depTask) return

          const depIndex = ganttTasks.indexOf(depTask)
          const depY = depIndex * rowHeight + rowHeight / 2
          const currentY = y + rowHeight / 2

          const depX = xScale(depTask.end)
          const currentX = xScale(task.start)

          const path = d3.path()
          path.moveTo(depX, depY)
          path.lineTo(depX + 10, depY)
          path.lineTo(depX + 10, currentY)
          path.lineTo(currentX - 5, currentY)
          path.lineTo(currentX, currentY)

          taskGroup.append('path')
            .attr('d', path.toString())
            .attr('fill', 'none')
            .attr('stroke', 'oklch(0.58 0.21 25)')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4,4')
            .attr('marker-end', 'url(#arrow)')
        })
      }
    })

    svg.append('defs')
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 10)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', 'oklch(0.58 0.21 25)')

    const todayLine = xScale(new Date())
    chart.append('line')
      .attr('x1', todayLine)
      .attr('x2', todayLine)
      .attr('y1', -10)
      .attr('y2', ganttTasks.length * rowHeight)
      .attr('stroke', 'oklch(0.68 0.17 45)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.7)

    chart.append('text')
      .attr('x', todayLine)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('fill', 'oklch(0.68 0.17 45)')
      .text('HOJE')

  }, [ganttTasks])

  if (trackTasks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Gráfico de Gantt</h3>
          <Button onClick={() => setCreateDialogOpen(true)} size="sm">
            <Plus className="mr-2" />
            Nova Tarefa
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhuma tarefa criada ainda</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2" />
              Criar Primeira Tarefa
            </Button>
          </CardContent>
        </Card>
        <CreateTaskDialog
          playerTrackId={playerTrackId}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gráfico de Gantt</h3>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm">
          <Plus className="mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div ref={containerRef} className="overflow-x-auto">
            <svg ref={svgRef}></svg>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3">Legenda</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary" />
                <span>Tarefa Ativa</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-success opacity-60" />
                <span>Tarefa Concluída</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-accent" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                <span>Marco (Milestone)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 border-t-2 border-destructive border-dashed" />
                <span>Dependência</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3">Estatísticas</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de Tarefas:</span>
                <span className="font-medium">{trackTasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Concluídas:</span>
                <span className="font-medium text-success">{trackTasks.filter(t => t.completed).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marcos:</span>
                <span className="font-medium">{trackTasks.filter(t => t.isMilestone).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Com Dependências:</span>
                <span className="font-medium">{trackTasks.filter(t => t.dependencies.length > 0).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateTaskDialog
        playerTrackId={playerTrackId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
