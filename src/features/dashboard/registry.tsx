import React from 'react';
import { KPIOverviewWidget } from './widgets/KPIOverviewWidget';
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
  'kpi-overview': {
    id: 'kpi-overview',
    title: 'KPIs Principais',
    component: KPIOverviewWidget,
    defaultSize: 'full',
    category: 'kpi',
    requiredPermissions: ['VIEW_ANALYTICS']
  },
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
  topWidgets: ['notifications', 'quick-tasks', 'kpi-overview'], // Cards section
  mainWidgets: ['weighted-forecast', 'portfolio-matrix', 'my-deals'] // Main content grid
};
