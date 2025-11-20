import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, MagnifyingGlass, FunnelSimple } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface AuditLogEntry {
  id: string
  user_id: string
  entity_id: string | null
  entity_type: string | null
  action: string
  changes: any
  created_at: string
  user_name?: string
  user_email?: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function AuditLogView() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [selectedEventType, setSelectedEventType] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [page, setPage] = useState(1)
  const itemsPerPage = 50

  useEffect(() => {
    loadUsers()
    loadLogs()
  }, [selectedUser, selectedEventType, dateFrom, dateTo, page])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .order('name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadLogs = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('activity_log')
        .select(`
          id,
          user_id,
          entity_id,
          entity_type,
          action,
          changes,
          created_at,
          users!activity_log_user_id_fkey (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

      // Apply filters
      if (selectedUser !== 'all') {
        query = query.eq('user_id', selectedUser)
      }

      if (selectedEventType !== 'all') {
        query = query.ilike('action', `%${selectedEventType}%`)
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom.toISOString())
      }

      if (dateTo) {
        const endOfDay = new Date(dateTo)
        endOfDay.setHours(23, 59, 59, 999)
        query = query.lte('created_at', endOfDay.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      // Transform data to include user info
      const transformedData = (data || []).map((log: any) => ({
        ...log,
        user_name: log.users?.name,
        user_email: log.users?.email,
      }))

      setLogs(transformedData)
    } catch (error) {
      console.error('Error loading logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action: string) => {
    if (action.toLowerCase().includes('create') || action.toLowerCase().includes('insert')) {
      return <Badge className="bg-green-500">Criado</Badge>
    }
    if (action.toLowerCase().includes('update')) {
      return <Badge className="bg-blue-500">Atualizado</Badge>
    }
    if (action.toLowerCase().includes('delete')) {
      return <Badge className="bg-red-500">Excluído</Badge>
    }
    return <Badge variant="secondary">{action}</Badge>
  }

  const getEntityTypeBadge = (entityType: string | null) => {
    if (!entityType) return <Badge variant="outline">Sistema</Badge>

    const typeMap: Record<string, string> = {
      deal: 'Negócio',
      track: 'Player',
      task: 'Tarefa',
      user: 'Usuário',
      folder: 'Pasta',
    }

    return <Badge variant="outline">{typeMap[entityType] || entityType}</Badge>
  }

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleClearFilters = () => {
    setSelectedUser('all')
    setSelectedEventType('all')
    setDateFrom(undefined)
    setDateTo(undefined)
    setSearchQuery('')
    setPage(1)
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Log de Auditoria</h2>
          <p className="text-muted-foreground">
            Histórico completo de ações no sistema
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por ação ou usuário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* User Filter */}
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrar por usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Event Type Filter */}
          <Select value={selectedEventType} onValueChange={setSelectedEventType}>
            <SelectTrigger className="w-full md:w-[200px]">
              <FunnelSimple className="mr-2" />
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eventos</SelectItem>
              <SelectItem value="create">Criação</SelectItem>
              <SelectItem value="update">Atualização</SelectItem>
              <SelectItem value="delete">Exclusão</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Data Inicial</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateFrom && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2" />
                  {dateFrom ? format(dateFrom, 'PPP', { locale: ptBR }) : 'Selecione uma data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Data Final</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateTo && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2" />
                  {dateTo ? format(dateTo, 'PPP', { locale: ptBR }) : 'Selecione uma data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button variant="outline" onClick={handleClearFilters}>
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Carregando logs...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum log encontrado</p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.user_name || 'Desconhecido'}</span>
                        <span className="text-xs text-muted-foreground">
                          {log.user_email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>{getEntityTypeBadge(log.entity_type)}</TableCell>
                    <TableCell>
                      {log.changes && (
                        <details className="cursor-pointer">
                          <summary className="text-sm text-muted-foreground hover:text-foreground">
                            Ver alterações
                          </summary>
                          <pre className="mt-2 text-xs bg-muted p-2 rounded max-w-md overflow-auto">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </details>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {page} • {filteredLogs.length} registros
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={filteredLogs.length < itemsPerPage}
              >
                Próxima
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
