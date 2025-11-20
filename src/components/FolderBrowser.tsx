import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  Folder as FolderIcon,
  FolderOpen,
  CaretRight,
  CaretDown,
  Star,
  Briefcase,
  ListChecks,
  Kanban,
  FolderPlus,
  Tag,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Folder,
  EntityLocation,
  MasterDeal,
  PlayerTrack,
  Task,
  User,
} from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'
import CrossTagDialog from './CrossTagDialog'

interface FolderBrowserProps {
  currentUser: User
  onDealClick?: (dealId: string) => void
  onTrackClick?: (trackId: string) => void
  onTaskClick?: (taskId: string) => void
  onManageFolders?: () => void
}

export default function FolderBrowser({
  currentUser,
  onDealClick,
  onTrackClick,
  onTaskClick,
  onManageFolders,
}: FolderBrowserProps) {
  const [folders = []] = useKV<Folder[]>('folders', [])
  const [locations = []] = useKV<EntityLocation[]>('entity-locations', [])
  const [deals = []] = useKV<MasterDeal[]>('masterDeals', [])
  const [tracks = []] = useKV<PlayerTrack[]>('playerTracks', [])
  const [tasks = []] = useKV<Task[]>('tasks', [])

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [crossTagDialogOpen, setCrossTagDialogOpen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<{
    id: string
    type: 'deal' | 'track' | 'task'
    name: string
  } | null>(null)

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const getEntitiesInFolder = (folderId: string) => {
    const folderLocations = locations.filter((loc) => loc.folderId === folderId)
    
    const dealsInFolder = folderLocations
      .filter((loc) => loc.entityType === 'deal')
      .map((loc) => ({
        location: loc,
        entity: deals.find((d) => d.id === loc.entityId),
      }))
      .filter((item) => item.entity)

    const tracksInFolder = folderLocations
      .filter((loc) => loc.entityType === 'track')
      .map((loc) => ({
        location: loc,
        entity: tracks.find((t) => t.id === loc.entityId),
      }))
      .filter((item) => item.entity)

    const tasksInFolder = folderLocations
      .filter((loc) => loc.entityType === 'task')
      .map((loc) => ({
        location: loc,
        entity: tasks.find((t) => t.id === loc.entityId),
      }))
      .filter((item) => item.entity)

    return { dealsInFolder, tracksInFolder, tasksInFolder }
  }

  const handleCrossTag = (entityId: string, entityType: 'deal' | 'track' | 'task', entityName: string) => {
    setSelectedEntity({ id: entityId, type: entityType, name: entityName })
    setCrossTagDialogOpen(true)
  }

  const getEntityLocations = (entityId: string, entityType: 'deal' | 'track' | 'task') => {
    return locations.filter((loc) => loc.entityId === entityId && loc.entityType === entityType)
  }

  const renderEntity = (
    entity: any,
    type: 'deal' | 'track' | 'task',
    location: EntityLocation
  ) => {
    const entityLocations = getEntityLocations(entity.id, type)
    const locationCount = entityLocations.length

    return (
      <div
        key={`${type}-${entity.id}`}
        className="p-3 rounded-md bg-card border border-border mb-2 hover:border-primary/50 transition-colors cursor-pointer group"
        onClick={() => {
          if (type === 'deal' && onDealClick) onDealClick(entity.id)
          if (type === 'track' && onTrackClick) onTrackClick(entity.id)
          if (type === 'task' && onTaskClick) onTaskClick(entity.id)
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {location.isPrimary && (
                <Star size={14} weight="fill" className="text-accent shrink-0" />
              )}
              {type === 'deal' && <Briefcase size={16} className="text-muted-foreground shrink-0" />}
              {type === 'track' && <Kanban size={16} className="text-muted-foreground shrink-0" />}
              {type === 'task' && <ListChecks size={16} className="text-muted-foreground shrink-0" />}
              <h4 className="font-medium text-sm">
                {type === 'deal' && entity.clientName}
                {type === 'track' && entity.playerName}
                {type === 'task' && entity.title}
              </h4>
              {locationCount > 1 && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Tag size={10} />
                  {locationCount}
                </Badge>
              )}
            </div>
            {type === 'deal' && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(entity.volume)} • {entity.operationType}
              </p>
            )}
            {type === 'track' && (
              <p className="text-xs text-muted-foreground mt-1">
                {entity.currentStage} • {entity.probability}%
              </p>
            )}
            {type === 'task' && entity.dueDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Vencimento: {new Date(entity.dueDate).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              handleCrossTag(
                entity.id,
                type,
                type === 'deal' ? entity.clientName : type === 'track' ? entity.playerName : entity.title
              )
            }}
          >
            <Tag size={14} />
          </Button>
        </div>
      </div>
    )
  }

  const renderFolderTree = (parentFolders: Folder[], level = 0) => {
    return parentFolders.map((folder) => {
      const children = folders.filter((f) => f.parentId === folder.id)
      const isExpanded = expandedFolders.has(folder.id)
      const IconComponent = isExpanded ? FolderOpen : FolderIcon
      const { dealsInFolder, tracksInFolder, tasksInFolder } = getEntitiesInFolder(folder.id)
      const totalEntities = dealsInFolder.length + tracksInFolder.length + tasksInFolder.length

      return (
        <div key={folder.id} style={{ marginLeft: level * 16 }}>
          <div
            className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/20 cursor-pointer mb-1"
            onClick={() => toggleFolder(folder.id)}
          >
            {(children.length > 0 || totalEntities > 0) && (
              <div className="shrink-0">
                {isExpanded ? <CaretDown size={16} /> : <CaretRight size={16} />}
              </div>
            )}
            <IconComponent
              size={20}
              style={{ color: folder.color }}
              weight="duotone"
              className="shrink-0"
            />
            <span className="font-medium text-sm flex-1">{folder.name}</span>
            {totalEntities > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalEntities}
              </Badge>
            )}
          </div>

          {isExpanded && (
            <div className="ml-6 mt-1 mb-2">
              {dealsInFolder.map(({ entity, location }) =>
                renderEntity(entity, 'deal', location)
              )}
              {tracksInFolder.map(({ entity, location }) =>
                renderEntity(entity, 'track', location)
              )}
              {tasksInFolder.map(({ entity, location }) =>
                renderEntity(entity, 'task', location)
              )}
              {totalEntities === 0 && (
                <p className="text-xs text-muted-foreground italic p-2">
                  Nenhum item nesta pasta
                </p>
              )}
            </div>
          )}

          {children.length > 0 && renderFolderTree(children, level + 1)}
        </div>
      )
    })
  }

  const rootFolders = folders.filter((f) => !f.parentId)

  const untaggedEntities = useMemo(() => {
    const taggedEntityIds = new Set(locations.map((loc) => `${loc.entityType}-${loc.entityId}`))
    
    const untaggedDeals = deals.filter((d) => !taggedEntityIds.has(`deal-${d.id}`) && d.status === 'active')
    const untaggedTracks = tracks.filter((t) => !taggedEntityIds.has(`track-${t.id}`) && t.status === 'active')
    const untaggedTasks = tasks.filter((t) => !taggedEntityIds.has(`task-${t.id}`) && !t.completed)

    return { untaggedDeals, untaggedTracks, untaggedTasks }
  }, [deals, tracks, tasks, locations])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Navegador de Pastas</h2>
        <Button onClick={onManageFolders} variant="outline" size="sm">
          <FolderPlus className="mr-2" />
          Gerenciar Pastas
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {rootFolders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <FolderIcon size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhuma pasta criada ainda
              </p>
              <Button onClick={onManageFolders} variant="outline">
                <FolderPlus className="mr-2" />
                Criar Primeira Pasta
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {renderFolderTree(rootFolders)}

            {(untaggedEntities.untaggedDeals.length > 0 ||
              untaggedEntities.untaggedTracks.length > 0 ||
              untaggedEntities.untaggedTasks.length > 0) && (
              <div className="mt-6 pt-4 border-t border-border">
                <div
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/20 cursor-pointer mb-1"
                  onClick={() => toggleFolder('untagged')}
                >
                  <div className="shrink-0">
                    {expandedFolders.has('untagged') ? (
                      <CaretDown size={16} />
                    ) : (
                      <CaretRight size={16} />
                    )}
                  </div>
                  <FolderIcon
                    size={20}
                    className="text-muted-foreground shrink-0"
                    weight="duotone"
                  />
                  <span className="font-medium text-sm flex-1">Não Organizados</span>
                  <Badge variant="outline" className="text-xs">
                    {untaggedEntities.untaggedDeals.length +
                      untaggedEntities.untaggedTracks.length +
                      untaggedEntities.untaggedTasks.length}
                  </Badge>
                </div>

                {expandedFolders.has('untagged') && (
                  <div className="ml-6 mt-1">
                    {untaggedEntities.untaggedDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="p-3 rounded-md bg-card border border-border mb-2 hover:border-primary/50 transition-colors cursor-pointer group"
                        onClick={() => onDealClick?.(deal.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <Briefcase size={16} className="text-muted-foreground shrink-0" />
                            <div>
                              <h4 className="font-medium text-sm">{deal.clientName}</h4>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(deal.volume)} • {deal.operationType}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCrossTag(deal.id, 'deal', deal.clientName)
                            }}
                          >
                            <Tag size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {untaggedEntities.untaggedTracks.map((track) => (
                      <div
                        key={track.id}
                        className="p-3 rounded-md bg-card border border-border mb-2 hover:border-primary/50 transition-colors cursor-pointer group"
                        onClick={() => onTrackClick?.(track.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <Kanban size={16} className="text-muted-foreground shrink-0" />
                            <div>
                              <h4 className="font-medium text-sm">{track.playerName}</h4>
                              <p className="text-xs text-muted-foreground">
                                {track.currentStage} • {track.probability}%
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCrossTag(track.id, 'track', track.playerName)
                            }}
                          >
                            <Tag size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {untaggedEntities.untaggedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-md bg-card border border-border mb-2 hover:border-primary/50 transition-colors cursor-pointer group"
                        onClick={() => onTaskClick?.(task.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <ListChecks size={16} className="text-muted-foreground shrink-0" />
                            <div>
                              <h4 className="font-medium text-sm">{task.title}</h4>
                              {task.dueDate && (
                                <p className="text-xs text-muted-foreground">
                                  Vencimento: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCrossTag(task.id, 'task', task.title)
                            }}
                          >
                            <Tag size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </ScrollArea>

      {selectedEntity && (
        <CrossTagDialog
          open={crossTagDialogOpen}
          onOpenChange={setCrossTagDialogOpen}
          entityId={selectedEntity.id}
          entityType={selectedEntity.type}
          entityName={selectedEntity.name}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}
