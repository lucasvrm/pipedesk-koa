import { describe, expect, it } from 'vitest'
import { buildBreadcrumbs } from '@/utils/breadcrumbs'

describe('buildBreadcrumbs helper', () => {
  it('builds admin CRM breadcrumbs with section', () => {
    const breadcrumbs = buildBreadcrumbs(
      '/admin/settings',
      new URLSearchParams('category=crm&section=deals')
    )

    expect(breadcrumbs.map((b) => b.label)).toEqual([
      'Configurações',
      'CRM & Vendas',
      'Deals & Pipeline',
    ])
    expect(breadcrumbs[1]?.path).toBe('/admin/settings?category=crm')
  })

  it('includes profile customize tab without duplicating profile label', () => {
    const breadcrumbs = buildBreadcrumbs(
      '/profile/customize',
      new URLSearchParams('tab=rail')
    )

    expect(breadcrumbs.map((b) => b.label)).toEqual([
      'Meu Perfil',
      'Customização',
      'Rail/Sidebar',
    ])
    expect(new Set(breadcrumbs.map((b) => b.label)).size).toBe(breadcrumbs.length)
  })

  it('formats deals detail as details breadcrumb', () => {
    const breadcrumbs = buildBreadcrumbs('/deals/123', new URLSearchParams())

    expect(breadcrumbs.map((b) => b.label)).toEqual(['Deals & Pipeline', 'Detalhes'])
    expect(breadcrumbs[0]?.path).toBe('/deals')
    expect(breadcrumbs[1]?.path).toBeUndefined()
  })

  it('builds profile breadcrumbs using default overview tab', () => {
    const breadcrumbs = buildBreadcrumbs('/profile', new URLSearchParams())

    expect(breadcrumbs.map((b) => b.label)).toEqual(['Meu Perfil', 'Visão Geral'])
  })

  it('builds profile breadcrumbs using documents tab from URL', () => {
    const breadcrumbs = buildBreadcrumbs('/profile', new URLSearchParams('tab=documents'))

    expect(breadcrumbs.map((b) => b.label)).toEqual(['Meu Perfil', 'Documentos'])
  })

  it('builds profile breadcrumbs using financial tab from URL', () => {
    const breadcrumbs = buildBreadcrumbs('/profile', new URLSearchParams('tab=financial'))

    expect(breadcrumbs.map((b) => b.label)).toEqual(['Meu Perfil', 'Financeiro'])
  })

  it('builds profile preferences breadcrumbs with default tab', () => {
    const breadcrumbs = buildBreadcrumbs('/profile/preferences', new URLSearchParams())

    expect(breadcrumbs.map((b) => b.label)).toEqual(['Meu Perfil', 'Preferências', 'Notificações'])
  })

  it('builds profile preferences breadcrumbs using tab from URL', () => {
    const breadcrumbs = buildBreadcrumbs('/profile/preferences', new URLSearchParams('tab=notifications'))

    expect(breadcrumbs.map((b) => b.label)).toEqual(['Meu Perfil', 'Preferências', 'Notificações'])
  })
})
