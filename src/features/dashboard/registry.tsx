import React from 'react';
import { WeightedPipelineWidget } from './widgets/kpi/WeightedPipelineWidget';
import { ActiveDealsWidget } from './widgets/kpi/ActiveDealsWidget';
import { ConversionRateWidget } from './widgets/kpi/ConversionRateWidget';
import { TotalDealsWidget } from './widgets/kpi/TotalDealsWidget';

import { PortfolioMatrixWidget } from './widgets/PortfolioMatrixWidget';
import { WeightedForecastWidget } from './widgets/WeightedForecastWidget';
import { ConversionFunnelWidget } from './widgets/ConversionFunnelWidget';
import { TeamWorkloadWidget } from './widgets/TeamWorkloadWidget';
import { SLAOverviewWidget } from './widgets/SLAOverviewWidget';
import { NotificationsWidget } from './widgets/NotificationsWidget';
import { QuickTasksWidget } from './widgets/QuickTasksWidget';
import { MyDealsWidget } from './widgets/MyDealsWidget';
import { UserRole } from '@/lib/types';

export interface WidgetDefinition {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  defaultSize: 'small' | 'medium' | 'large' | 'full'; // Just a hint for grid layout
  category: 'kpi' | 'chart' | 'list' | 'operational';
  requiredPermissions?: string[]; // RBAC permission codes
  requiredRoles?: UserRole[]; // Fallback role check
}

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  // === Individual KPIs ===
  'weighted-pipeline': {
    id: 'weighted-pipeline',
    title: 'KPI: Pipeline Ponderado',
    component: WeightedPipelineWidget,
    defaultSize: 'small',
    category: 'kpi',
    requiredPermissions: ['VIEW_ANALYTICS']
  },
  'active-deals': {
    id: 'active-deals',
    title: 'KPI: Deals Ativos',
    component: ActiveDealsWidget,
    defaultSize: 'small',
    category: 'kpi',
    requiredPermissions: ['VIEW_ANALYTICS']
  },
  'conversion-rate': {
    id: 'conversion-rate',
    title: 'KPI: Taxa de Conversão',
    component: ConversionRateWidget,
    defaultSize: 'small',
    category: 'kpi',
    requiredPermissions: ['VIEW_ANALYTICS']
  },
  'total-deals': {
    id: 'total-deals',
    title: 'KPI: Total Negócios',
    component: TotalDealsWidget,
    defaultSize: 'small',
    category: 'kpi',
    requiredPermissions: ['VIEW_ANALYTICS']
  },
  // === Operational ===
  'notifications': {
    id: 'notifications',
    title: 'Resumo de Notificações',
    component: NotificationsWidget,
    defaultSize: 'small',
    category: 'operational'
  },
  'quick-tasks': {
    id: 'quick-tasks',
    title: 'Minhas Tarefas (Resumo)',
    component: QuickTasksWidget,
    defaultSize: 'small',
    category: 'operational'
  },
  // === Charts & Lists ===
  'portfolio-matrix': {
    id: 'portfolio-matrix',
    title: 'Matriz de Portfólio',
    component: PortfolioMatrixWidget,
    defaultSize: 'medium',
    category: 'chart',
    requiredPermissions: ['VIEW_ANALYTICS']
  },
  'weighted-forecast': {
    id: 'weighted-forecast',
    title: 'Previsão Ponderada',
    component: WeightedForecastWidget,
    defaultSize: 'medium',
    category: 'chart',
    requiredPermissions: ['VIEW_ANALYTICS']
  },
  'conversion-funnel': {
    id: 'conversion-funnel',
    title: 'Funil de Conversão',
    component: ConversionFunnelWidget,
    defaultSize: 'medium',
    category: 'chart',
    requiredPermissions: ['VIEW_ANALYTICS']
  },
  'team-workload': {
    id: 'team-workload',
    title: 'Carga da Equipe',
    component: TeamWorkloadWidget,
    defaultSize: 'medium',
    category: 'chart',
    requiredRoles: ['admin', 'newbusiness']
  },
  'sla-overview': {
    id: 'sla-overview',
    title: 'Violações de SLA',
    component: SLAOverviewWidget,
    defaultSize: 'medium',
    category: 'operational'
  },
  'my-deals': {
    id: 'my-deals',
    title: 'Meus Negócios',
    component: MyDealsWidget,
    defaultSize: 'medium',
    category: 'list'
  }
};

export const DEFAULT_DASHBOARD_CONFIG = {
  // New default includes granular KPIs
  topWidgets: [
    'notifications',
    'quick-tasks',
    'weighted-pipeline',
    'active-deals',
    'conversion-rate',
    'total-deals'
  ],
  mainWidgets: ['weighted-forecast', 'portfolio-matrix', 'my-deals']
};
