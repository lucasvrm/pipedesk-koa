import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCompanies } from '@/services/companyService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Buildings, MagnifyingGlass, Plus, ArrowRight } from '@phosphor-icons/react'
import { COMPANY_TYPE_LABELS, CompanyType } from '@/lib/types'

export default function CompaniesListPage() {
  const navigate = useNavigate()
  const { data: companies, isLoading } = useCompanies()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCompanies = companies?.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj?.includes(searchTerm)
  ) || []

  return (
    <div className="container mx-auto p-6 max-w-7xl pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Buildings className="text-primary" />
            Empresas
          </h1>
          <p className="text-muted-foreground">Gerencie os seus clientes e parceiros de negócios.</p>
        </div>
        <Button onClick={() => navigate('/companies/new')}>
          <Plus className="mr-2 h-4 w-4" /> Nova Empresa
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome ou CNPJ..."
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">A carregar empresas...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Deals</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.length > 0 ? filteredCompanies.map(company => (
                    <TableRow 
                      key={company.id} 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => navigate(`/companies/${company.id}`)}
                    >
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {COMPANY_TYPE_LABELS[company.type as CompanyType] || company.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {company.site ? (
                          <a 
                            href={company.site.startsWith('http') ? company.site : `https://${company.site}`} 
                            target="_blank" 
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline"
                          >
                            {company.site}
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                          {/* Assumindo que o service retorna a contagem via join */}
                          {(company as any).master_deals?.[0]?.count || 0}
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma empresa encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}