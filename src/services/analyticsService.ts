import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import {
    AnalyticsMetrics,
    PlayerStage,
    DealStatus,
    OperationType
} from '@/lib/types';

// ============================================================================
// Service Functions
// ============================================================================

export async function getAnalyticsSummary(
    dateFilter: 'all' | '30d' | '90d' | '1y' = 'all',
    teamFilter: string = 'all',
    typeFilter: string = 'all'
): Promise<AnalyticsMetrics> {
    try {
        // 0. Buscar Estágios Dinâmicos para Probabilidades e Labels
        const { data: stagesData } = await supabase
            .from('pipeline_stages')
            .select('id, name, probability');
        
        const probabilityMap: Record<string, number> = {};
        
        stagesData?.forEach(s => {
            probabilityMap[s.id] = s.probability || 0;
            // Fallback para dados legados (slug)
            if (s.name) {
                probabilityMap[s.name.toLowerCase().replace(/\s/g, '_')] = s.probability || 0;
            }
        });

        // 1. Calcular Range de Data
        let startDate: Date | null = null;
        if (dateFilter !== 'all') {
            const now = new Date();
            if (dateFilter === '30d') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            else if (dateFilter === '90d') startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            else if (dateFilter === '1y') startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        }

        // 2. Construir Queries
        let dealsQuery = supabase.from('master_deals').select('*');
        if (startDate) dealsQuery = dealsQuery.gte('created_at', startDate.toISOString());
        if (typeFilter !== 'all') dealsQuery = dealsQuery.eq('operation_type', typeFilter);

        const { data: deals, error: dealsError } = await dealsQuery;
        if (dealsError) throw dealsError;

        const dealIds = deals.map(d => d.id);
        let tracksQuery = supabase.from('player_tracks').select('*');
        if (dealIds.length > 0) tracksQuery = tracksQuery.in('master_deal_id', dealIds);

        const { data: tracks, error: tracksError } = await tracksQuery;
        if (tracksError) throw tracksError;

        // Filtro de Time (Client-side para arrays)
        const filteredTracks = teamFilter === 'all'
            ? tracks
            : tracks.filter(t => t.responsibles && t.responsibles.includes(teamFilter));

        // Busca Tarefas e Histórico (SLA)
        const { data: history, error: historyError } = await supabase.from('stage_history').select('*');
        if (historyError) throw historyError;

        const { data: tasks, error: tasksError } = await supabase.from('tasks').select('*').eq('completed', false);
        if (tasksError) throw tasksError;

        // 3. Calcular Métricas
        const activeDeals = deals.filter(d => d.status === 'active').length;
        const concludedDeals = deals.filter(d => d.status === 'concluded').length;
        const cancelledDeals = deals.filter(d => d.status === 'cancelled').length;

        // Pipeline Ponderado Dinâmico
        const weightedPipeline = filteredTracks
            .filter(t => t.status === 'active')
            .reduce((sum, t) => {
                const stageProb = probabilityMap[t.current_stage] || 0;
                const prob = t.probability || stageProb;
                return sum + (t.track_volume || 0) * (prob / 100);
            }, 0);

        // Taxa de Conversão
        const totalClosed = concludedDeals + cancelledDeals;
        const conversionRate = totalClosed > 0 ? (concludedDeals / totalClosed) * 100 : 0;

        // SLA Breaches (Simplificado)
        const breachesByStage: Record<string, number> = {};
        let totalBreaches = 0;

        // Deals por Estágio
        const dealsByStage: Record<string, number> = {};
        filteredTracks.forEach(t => {
            if (t.status === 'active') {
                const stageKey = t.current_stage;
                if (!dealsByStage[stageKey]) dealsByStage[stageKey] = 0;
                dealsByStage[stageKey]++;
            }
        });

        // Carga de Trabalho da Equipe
        const { data: users } = await supabase.from('profiles').select('id, name, role');

        const teamWorkload = (users || [])
            .filter(u => ['analyst', 'admin', 'newbusiness'].includes(u.role))
            .map(user => {
                const userTracks = filteredTracks.filter(t =>
                    t.status === 'active' && t.responsibles && t.responsibles.includes(user.id)
                ).length;

                const userTasks = tasks.filter(t =>
                    t.assignees && t.assignees.includes(user.id)
                ).length;

                return {
                    userId: user.id,
                    userName: user.name,
                    activeTracks: userTracks,
                    activeTasks: userTasks
                };
            });

        // Tendência de Conversão (Últimos 6 meses)
        const conversionTrend: { period: string; concluded: number; cancelled: number; conversionRate: number }[] = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toISOString().slice(0, 7);
            const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

            const monthDeals = deals.filter(d => d.created_at && d.created_at.startsWith(monthKey));
            const monthConcluded = monthDeals.filter(d => d.status === 'concluded').length;
            const monthCancelled = monthDeals.filter(d => d.status === 'cancelled').length;
            const monthTotal = monthConcluded + monthCancelled;
            const rate = monthTotal > 0 ? Math.round((monthConcluded / monthTotal) * 100) : 0;

            conversionTrend.push({
                period: monthLabel,
                concluded: monthConcluded,
                cancelled: monthCancelled,
                conversionRate: rate,
            });
        }

        return {
            totalDeals: deals.length,
            activeDeals,
            concludedDeals,
            cancelledDeals,
            averageTimeToClose: 0,
            conversionRate,
            weightedPipeline,
            slaBreach: {
                total: totalBreaches,
                byStage: breachesByStage
            },
            dealsByStage,
            teamWorkload,
            conversionTrend
        };

    } catch (error) {
        console.error('Error fetching analytics:', error);
        throw error;
    }
}

// React Query Hook
export function useAnalytics(
    dateFilter: 'all' | '30d' | '90d' | '1y',
    teamFilter: string,
    typeFilter: string
) {
    return useQuery({
        queryKey: ['analytics', dateFilter, teamFilter, typeFilter],
        queryFn: () => getAnalyticsSummary(dateFilter, teamFilter, typeFilter),
        staleTime: 1000 * 60 * 10 
    });
}