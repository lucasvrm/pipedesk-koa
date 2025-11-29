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
        // 0. Fetch Pipeline Stages for Probabilities
        // Precisamos disto para calcular o "Weighted Pipeline" dinamicamente
        const { data: stagesData } = await supabase
            .from('pipeline_stages')
            .select('id, name, probability');
        
        // Mapa de probabilidades (ID -> Probabilidade)
        // Também mapeamos o "slug" (nome minúsculo) para suportar dados antigos
        const probabilityMap: Record<string, number> = {};
        
        stagesData?.forEach(s => {
            probabilityMap[s.id] = s.probability || 0;
            if (s.name) {
                probabilityMap[s.name.toLowerCase().replace(/\s/g, '_')] = s.probability || 0;
            }
        });

        // 1. Calculate date range
        let startDate: Date | null = null;
        if (dateFilter !== 'all') {
            const now = new Date();
            if (dateFilter === '30d') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            else if (dateFilter === '90d') startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            else if (dateFilter === '1y') startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        }

        // 2. Build queries
        let dealsQuery = supabase.from('master_deals').select('*');
        if (startDate) dealsQuery = dealsQuery.gte('created_at', startDate.toISOString());
        if (typeFilter !== 'all') dealsQuery = dealsQuery.eq('operation_type', typeFilter);

        // Fetch deals
        const { data: deals, error: dealsError } = await dealsQuery;
        if (dealsError) throw dealsError;

        // Fetch tracks (related to these deals)
        const dealIds = deals.map(d => d.id);
        let tracksQuery = supabase.from('player_tracks').select('*');
        if (dealIds.length > 0) tracksQuery = tracksQuery.in('master_deal_id', dealIds);

        const { data: tracks, error: tracksError } = await tracksQuery;
        if (tracksError) throw tracksError;

        // Filter tracks by team if needed
        const filteredTracks = teamFilter === 'all'
            ? tracks
            : tracks.filter(t => t.responsibles && t.responsibles.includes(teamFilter));

        // Fetch tasks for workload
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('completed', false);
        if (tasksError) throw tasksError;

        // 3. Calculate Metrics
        const activeDeals = deals.filter(d => d.status === 'active').length;
        const concludedDeals = deals.filter(d => d.status === 'concluded').length;
        const cancelledDeals = deals.filter(d => d.status === 'cancelled').length;

        // Weighted Pipeline Calculation
        const weightedPipeline = filteredTracks
            .filter(t => t.status === 'active')
            .reduce((sum, t) => {
                // Prioridade: Probabilidade salva no track > Probabilidade do estágio > 0
                const stageProb = probabilityMap[t.current_stage] || 0;
                const prob = t.probability || stageProb;
                return sum + (t.track_volume || 0) * (prob / 100);
            }, 0);

        // Conversion Rate
        const totalClosed = concludedDeals + cancelledDeals;
        const conversionRate = totalClosed > 0 ? (concludedDeals / totalClosed) * 100 : 0;

        // SLA Breaches (Simplificado)
        const breachesByStage: Record<string, number> = {};
        let totalBreaches = 0;

        // Deals by Stage
        const dealsByStage: Record<string, number> = {};
        filteredTracks.forEach(t => {
            if (t.status === 'active') {
                const stageKey = t.current_stage;
                if (!dealsByStage[stageKey]) dealsByStage[stageKey] = 0;
                dealsByStage[stageKey]++;
            }
        });

        // Team Workload - Fetch Profiles
        const { data: users } = await supabase.from('profiles').select('id, name, role');

        const teamWorkload = (users || [])
            .filter(u => u.role === 'analyst' || u.role === 'admin' || u.role === 'newbusiness')
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

        // Conversion Trend (Last 6 months)
        const conversionTrend: { period: string; concluded: number; cancelled: number; conversionRate: number }[] = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
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

// ============================================================================
// React Query Hooks
// ============================================================================

export function useAnalytics(
    dateFilter: 'all' | '30d' | '90d' | '1y',
    teamFilter: string,
    typeFilter: string
) {
    return useQuery({
        queryKey: ['analytics', dateFilter, teamFilter, typeFilter],
        queryFn: () => getAnalyticsSummary(dateFilter, teamFilter, typeFilter),
        staleTime: 1000 * 60 * 10 // 10 minutos
    });
}