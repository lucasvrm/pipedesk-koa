import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'

export function QuickTasksWidget() {
    const navigate = useNavigate()
    // TODO: Connect to real task count
    const totalTasks = 4;
    const dueToday = 2;

    return (
        <Card className="shadow-sm hover:shadow-md transition-all cursor-pointer h-full" onClick={() => navigate('/tasks')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minhas Tarefas</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">{dueToday} vencem hoje</p>
          </CardContent>
        </Card>
    )
}
