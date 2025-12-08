import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import {
    AnalyticsMetrics,
    PlayerStage,
    DealStatus,
    OperationType
} from '@/lib/types';
import { Stage } from '@/types/metadata';
import { DateRange } from '@/utils/dateRangeUtils';

// ============================================================================
// Types
// ============================================================================

export interface AnalyticsOptions {
    /** Array of stages from metadata for probability lookups */
    stages?: Stage[];
    /** Array of team member IDs for workload filtering */
    teamMembers?: string[];
    /** Pre-calculated date range for filtering */
    dateRange?: DateRange;
    /** Team filter (user ID or 'all') */
    teamFilter?: string;
    /** Operation type filter */
    typeFilter?: string;
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getAnalyticsSummary(
    dateFilter: 'all' | '30d' | '90d' | '1y' = 'all',
    teamFilter: string = 'all',
    typeFilter: string = 'all',
    options?: AnalyticsOptions
): Promise<AnalyticsMetrics> {
    try {
        // Extract stages from options or fetch from database
        let stages = options?.stages;
        if (!stages) {
            const { data: stagesData } = await supabase
                .from('pipeline_stages')
                .select('id, name, probability, pipeline_id, color, stage_order, is_default, active, created_at, updated_at');
            
            stages = (stagesData || []).map(s => ({
                id: s.id,
                pipelineId: s.pipeline_id,
                name: s.name,
                color: s.color,
                stageOrder: s.stage_order,
                probability: s.probability || 0,
                isDefault: s.is_default,
                active: s.active !== false,
                createdAt: s.created_at,
                updatedAt: s.updated_at
            }));
        }
        
        // Build probability map from stages
        const probabilityMap: Record<string, number> = {};
        stages.forEach(s => {
            probabilityMap[s.id] = s.probability || 0;
        });

        // Use provided date range or calculate based on filter
        let startDate: Date | null = null;
        let endDate: Date = new Date();
        
        if (options?.dateRange) {
            startDate = options.dateRange.startDate;
            endDate = options.dateRange.endDate;
        } else if (dateFilter !== 'all') {
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

        const dealIds = (deals || []).map(d => d.id);
        let tracksQuery = supabase.from('player_tracks').select('*');
        if (dealIds.length > 0) tracksQuery = tracksQuery.in('master_deal_id', dealIds);

        const { data: tracks, error: tracksError } = await tracksQuery;
        if (tracksError) throw tracksError;

        // Filtro de Time (Client-side para arrays)
        const filteredTracks = teamFilter === 'all'
            ? (tracks || [])
            : (tracks || []).filter(t => t.responsibles && t.responsibles.includes(teamFilter));

        // Busca Tarefas e Histórico (SLA)
        const { data: history, error: historyError } = await supabase.from('stage_history').select('*');
        if (historyError) throw historyError;

        const { data: tasks, error: tasksError } = await supabase.from('tasks').select('*').eq('completed', false);
        if (tasksError) throw tasksError;

        // 3. Calcular Métricas
        const activeDeals = (deals || []).filter(d => d.status === 'active').length;
        const concludedDeals = (deals || []).filter(d => d.status === 'concluded').length;
        const cancelledDeals = (deals || []).filter(d => d.status === 'cancelled').length;

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
        const totalBreaches = 0;

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
        let teamWorkload: { userId: string; userName: string; activeTracks: number; activeTasks: number }[] = [];
        
        // Use provided team members or fetch based on roles
        if (options?.teamMembers && options.teamMembers.length > 0) {
            const { data: users } = await supabase
                .from('profiles')
                .select('id, name')
                .in('id', options.teamMembers);

            teamWorkload = (users || []).map(user => {
                const userTracks = filteredTracks.filter(t =>
                    t.status === 'active' && t.responsibles && t.responsibles.includes(user.id)
                ).length;

                const userTasks = (tasks || []).filter(t =>
                    t.assignees && t.assignees.includes(user.id)
                ).length;

                return {
                    userId: user.id,
                    userName: user.name,
                    activeTracks: userTracks,
                    activeTasks: userTasks
                };
            });
        } else {
            // Fallback to fetching operational roles
            const { data: users } = await supabase
                .from('profiles')
                .select('id, name, role')
                .in('role', ['analyst', 'admin', 'newbusiness']);

            teamWorkload = (users || []).map(user => {
                const userTracks = filteredTracks.filter(t =>
                    t.status === 'active' && t.responsibles && t.responsibles.includes(user.id)
                ).length;

                const userTasks = (tasks || []).filter(t =>
                    t.assignees && t.assignees.includes(user.id)
                ).length;

                return {
                    userId: user.id,
                    userName: user.name,
                    activeTracks: userTracks,
                    activeTasks: userTasks
                };
            });
        }

        // Tendência de Conversão (Dinâmica baseada no range)
        const conversionTrend: { period: string; concluded: number; cancelled: number; conversionRate: number }[] = [];
        
        // Constants for conversion trend grouping thresholds
        const WEEKLY_THRESHOLD_DAYS = 30;  // Show weeks for ranges <= 30 days
        const MONTHLY_SHORT_THRESHOLD_DAYS = 90;  // Show 3 months for ranges <= 90 days
        const DEFAULT_RANGE_DAYS = 365 * 10;  // Default to 10 years for 'all' filter
        
        // Calculate the range duration in days
        const rangeDays = startDate 
            ? Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
            : DEFAULT_RANGE_DAYS;
        
        if (rangeDays <= WEEKLY_THRESHOLD_DAYS) {
            // Short range: group by week
            const weeks = Math.ceil(rangeDays / 7);
            for (let i = weeks - 1; i >= 0; i--) {
                const weekEnd = new Date(endDate.getTime() - i * 7 * 24 * 60 * 60 * 1000);
                const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
                
                const weekLabel = `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
                
                const weekDeals = (deals || []).filter(d => {
                    if (!d.created_at) return false;
                    const dealDate = new Date(d.created_at);
                    return dealDate >= weekStart && dealDate < weekEnd;
                });
                
                const weekConcluded = weekDeals.filter(d => d.status === 'concluded').length;
                const weekCancelled = weekDeals.filter(d => d.status === 'cancelled').length;
                const weekTotal = weekConcluded + weekCancelled;
                const rate = weekTotal > 0 ? Math.round((weekConcluded / weekTotal) * 100) : 0;
                
                conversionTrend.push({
                    period: weekLabel,
                    concluded: weekConcluded,
                    cancelled: weekCancelled,
                    conversionRate: rate,
                });
            }
        } else if (rangeDays <= MONTHLY_SHORT_THRESHOLD_DAYS) {
            // Medium range: group by month, show last 3 months
            for (let i = 2; i >= 0; i--) {
                const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
                const monthKey = date.toISOString().slice(0, 7);
                const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                
                const monthDeals = (deals || []).filter(d => d.created_at && d.created_at.startsWith(monthKey));
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
        } else {
            // Long range: group by month, show last 6 months
            for (let i = 5; i >= 0; i--) {
                const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
                const monthKey = date.toISOString().slice(0, 7);
                const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                
                const monthDeals = (deals || []).filter(d => d.created_at && d.created_at.startsWith(monthKey));
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
        }

        return {
            totalDeals: (deals || []).length,
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

// React Query Hook with Dynamic Metadata Integration
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

/**
 * Enhanced React Query Hook that uses SystemMetadata and OperationalTeam
 * This hook integrates with the context system for dynamic metadata
 */
export function useAnalyticsWithMetadata(
    dateFilter: 'all' | '30d' | '90d' | '1y',
    teamFilter: string,
    typeFilter: string,
    options?: {
        stages?: Stage[];
        teamMembers?: string[];
        dateRange?: DateRange;
    }
) {
    return useQuery({
        queryKey: ['analytics-with-metadata', dateFilter, teamFilter, typeFilter, options],
        queryFn: () => getAnalyticsSummary(dateFilter, teamFilter, typeFilter, {
            stages: options?.stages,
            teamMembers: options?.teamMembers,
            dateRange: options?.dateRange,
            teamFilter,
            typeFilter
        }),
        staleTime: 1000 * 60 * 10 
    });
}