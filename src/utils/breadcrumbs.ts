import { ROUTE_LABELS } from '@/config/routeLabels'

export interface BreadcrumbItem {
  label: string
  path?: string
}

const CATEGORY_SECTIONS: Record<string, string[]> = {
  crm: ['leads', 'deals', 'companies'],
  products: ['products', 'operation_types', 'deal_sources', 'loss_reasons'],
  system: ['defaults', 'roles', 'permissions'],
  productivity: ['tasks', 'tags', 'templates', 'holidays'],
  integrations: ['dashboards', 'automation'],
}

const DEFAULT_SECTION_BY_CATEGORY: Record<string, string> = {
  crm: 'leads',
  products: 'products',
  system: 'defaults',
  productivity: 'tasks',
  integrations: 'dashboards',
}

const CUSTOMIZE_TABS = ['avatar', 'rail'] as const
const CUSTOMIZE_TAB_LABELS: Record<(typeof CUSTOMIZE_TABS)[number], string> = {
  avatar: ROUTE_LABELS.avatar || 'Avatar',
  rail: 'Rail/Sidebar',
}

const PROFILE_TABS = ['overview', 'documents', 'financial'] as const
const PROFILE_TAB_LABELS: Record<(typeof PROFILE_TABS)[number], string> = {
  overview: ROUTE_LABELS.overview || 'Visão Geral',
  documents: ROUTE_LABELS.documents || 'Documentos',
  financial: ROUTE_LABELS.financial || 'Financeiro',
}

const PREFERENCES_TABS = ['notifications'] as const
const PREFERENCES_TAB_LABELS: Record<(typeof PREFERENCES_TABS)[number], string> = {
  notifications: ROUTE_LABELS.notifications || 'Notificações',
}

const isIdLike = (segment: string) => /^[0-9a-f-]{6,}$/i.test(segment)

const formatSegment = (segment: string) =>
  segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const getLabel = (segment: string) => ROUTE_LABELS[segment] || formatSegment(segment)

export function buildBreadcrumbs(pathname: string, searchParams: URLSearchParams): BreadcrumbItem[] {
  const pathParts = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Admin settings: Configurações > Categoria > Seção > Sub (quando existir)
  if (pathParts[0] === 'admin' && pathParts[1] === 'settings') {
    const requestedCategory = searchParams.get('category') || 'crm'
    const category = ROUTE_LABELS[requestedCategory] ? requestedCategory : 'crm'
    const allowedSections = CATEGORY_SECTIONS[category] || []
    const requestedSection = searchParams.get('section')
    const section = requestedSection && allowedSections.includes(requestedSection)
      ? requestedSection
      : DEFAULT_SECTION_BY_CATEGORY[category]
    const sub = searchParams.get('sub')

    breadcrumbs.push({ label: ROUTE_LABELS.settings || 'Configurações', path: '/admin/settings' })

    if (category) {
      const categoryPath = `/admin/settings?category=${category}`
      breadcrumbs.push({
        label: getLabel(category),
        path: section ? categoryPath : undefined,
      })

      if (section) {
        const sectionPath = `/admin/settings?category=${category}&section=${section}`
        breadcrumbs.push({
          label: getLabel(section),
          path: sub ? sectionPath : undefined,
        })
      }

      if (sub) {
        breadcrumbs.push({ label: getLabel(sub) })
      }
    }

    return breadcrumbs
  }

  // Profile customize: evita duplicar "Meu Perfil"
  if (pathParts[0] === 'profile' && pathParts[1] === 'customize') {
    breadcrumbs.push({ label: getLabel('profile'), path: '/profile' })
    breadcrumbs.push({ label: getLabel('customize'), path: '/profile/customize' })

    const tab = searchParams.get('tab')
    if (tab && (CUSTOMIZE_TABS as readonly string[]).includes(tab)) {
      breadcrumbs.push({ label: CUSTOMIZE_TAB_LABELS[tab as (typeof CUSTOMIZE_TABS)[number]] })
    }

    return breadcrumbs
  }

  if (pathParts[0] === 'profile' && !pathParts[1]) {
    const tab = searchParams.get('tab')
    const activeTab = PROFILE_TABS.includes(tab as (typeof PROFILE_TABS)[number])
      ? (tab as (typeof PROFILE_TABS)[number])
      : 'overview'

    breadcrumbs.push({ label: getLabel('profile'), path: '/profile' })
    breadcrumbs.push({ label: PROFILE_TAB_LABELS[activeTab] })

    return breadcrumbs
  }

  if (pathParts[0] === 'profile' && pathParts[1] === 'preferences') {
    const tab = searchParams.get('tab')
    const activeTab = PREFERENCES_TABS.includes(tab as (typeof PREFERENCES_TABS)[number])
      ? (tab as (typeof PREFERENCES_TABS)[number])
      : PREFERENCES_TABS[0]

    breadcrumbs.push({ label: getLabel('profile'), path: '/profile' })
    breadcrumbs.push({ label: getLabel('preferences'), path: '/profile/preferences' })
    breadcrumbs.push({ label: PREFERENCES_TAB_LABELS[activeTab] })

    return breadcrumbs
  }

  let currentPath = ''
  pathParts.forEach((part, index) => {
    currentPath += `/${part}`
    const isLast = index === pathParts.length - 1
    const label = isIdLike(part) ? 'Detalhes' : getLabel(part)

    breadcrumbs.push({
      label,
      path: isLast ? undefined : currentPath,
    })
  })

  return breadcrumbs
}
