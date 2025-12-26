import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DynamicBreadcrumbs } from '@/components/DynamicBreadcrumbs'

describe('DynamicBreadcrumbs with settings subsections', () => {
  it('renders sub-level breadcrumb for CRM companies settings', () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings?category=crm&section=companies&sub=levels']}>
        <DynamicBreadcrumbs />
      </MemoryRouter>
    )

    expect(screen.getByText('Administração')).toBeInTheDocument()
    expect(screen.getByText('Configurações')).toBeInTheDocument()
    expect(screen.getByText('CRM & Vendas')).toBeInTheDocument()

    const sectionLink = screen.getByRole('link', { name: 'Empresas & Contatos' })
    expect(sectionLink).toBeInTheDocument()

    const subBreadcrumb = screen.getByText('Níveis de Relacionamento')
    expect(subBreadcrumb).toBeInTheDocument()
    expect(subBreadcrumb.closest('a')).toBeNull()
  })
})
