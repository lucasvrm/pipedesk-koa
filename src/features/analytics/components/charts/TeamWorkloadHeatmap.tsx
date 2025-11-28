import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getInitials } from '@/lib/helpers'
// CORREÇÃO: Imports via services
import { useUsers } from '@/services/userService'
import { useTasks } from '@/services/taskService'
import { useTracks } from '@/services/trackService'

export function TeamWorkloadHeatmap() {
  const { data: users } = useUsers()
  const { data: tasks } = useTasks()
  const { data: tracks } = useTracks()

  const workloadData = useMemo(() => {
    if (!users || !tasks || !tracks) return [];

    const activeTeam = users.filter(u => u.role !== 'client');

    return activeTeam.map(user => {
      const activeTracksCount = tracks.filter(t => 
        t.status === 'active' && t.responsibles?.includes(user.id)
      ).length;

      const activeTasksCount = tasks.filter(t => 
        !t.completed && t.assignees?.includes(user.id)
      ).length;

      const trackWeight = 15;
      const taskWeight = 5;
      const score = Math.min(100, (activeTracksCount * trackWeight) + (activeTasksCount * taskWeight));

      return {
        user,
        tracks: activeTracksCount,
        tasks: activeTasksCount,
        score
      };
    }).sort((a, b) => b.score - a.score);

  }, [users, tasks, tracks]);

  const getHeatColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-400';
    if (score >= 40) return 'bg-yellow-400';
    if (score >= 20) return 'bg-emerald-400';
    return 'bg-slate-200';
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Alocação da Equipe</CardTitle>
        <CardDescription>Intensidade de trabalho (Deals + Tarefas)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-xs text-muted-foreground px-2">
            <span>Membro</span>
            <div className="flex gap-8">
              <span className="w-16 text-center">Deals</span>
              <span className="w-16 text-center">Tarefas</span>
              <span className="w-24 text-center">Carga</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {workloadData.map((item) => (
              <div key={item.user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.user.avatar} />
                    <AvatarFallback>{getInitials(item.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.user.name}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{item.user.role}</span>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="w-16 text-center"><span className="text-sm font-semibold">{item.tracks}</span></div>
                  <div className="w-16 text-center"><span className="text-sm font-semibold">{item.tasks}</span></div>
                  <div className="w-24">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${getHeatColor(item.score)} transition-all duration-500`} style={{ width: `${item.score}%` }} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent><p>{item.score}% de Capacidade</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}