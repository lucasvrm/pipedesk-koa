import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  Folder,
  FolderOpen,
  Briefcase,
  Tag,
  Archive,
  Pencil,
  Trash,
  Plus,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogDescript
  DialogHeader,
} from '@/compo
  Select,
  SelectItem,
  SelectValue,
import {
import { 
const FOLDER_ICO
  { value: 'f
  { value: 'tag'
]
const FOLDER_COLORS = [
  { value: '#f97316', label: 'Laranja' },
  { value: '#84cc16', label: 'Verde Limão' },
  { value: '#06b6d4', label: '

  { value: '#6b7280', 
  { value: 'folder', label: 'Pasta', icon: Folder },
  { value: 'folder-open', label: 'Pasta Aberta', icon: FolderOpen },
  { value: 'briefcase', label: 'Pasta de Trabalho', icon: Briefcase },
  { value: 'tag', label: 'Etiqueta', icon: Tag },
  { value: 'archive', label: 'Arquivo', icon: Archive },
]

const FOLDER_COLORS = [
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#f59e0b', label: 'Âmbar' },
  { value: '#84cc16', label: 'Verde Limão' },
  { value: '#10b981', label: 'Verde' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#6b7280', label: 'Cinza' },
]

const FOLDER_TYPES = [
  { value: 'project', label: 'Projeto' },
  { value: 'category', label: 'Categoria' },
  { value: 'archive', label: 'Arquivo' },
]

interface FolderManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: User
}

export default function FolderManager({
  open,
  onOpenChange,
  currentUser,
      type: 'project' as
    })
  }
  const handleCreate = () => {
      toast.error('Nome da pasta é obrigatór
    }
    const newFolder:
      name: formData.
      color: formDa
      type: formData.type,
      createdAt: new Date().toISOString(),
    

    toast.success('Pasta cr
    resetForm()

    if (!formData.name
      return

      (current || []).map((f) =>
          ? {
      
              color: formD
   

      )

    setCreateDialogOpen(false)
  }
  con


    setEditingFolder(folder)
      name: folder.name,
      color: folder.color || '#3b82f6',
      type: folder.type,
    })
  }
  return (
      <Dialog open={open} onOpenChange={on
          <DialogHeader>
     


            <p className="text-sm text-muted-
            </p>
              o
   

              <Plus className=
            </Button>

            
     

              ) : (
                  const IconComp
                    Folder
             
                   
                    >
                        className="p-2 rounded"
                      >
                      </div>
                        <p classNa
                          <p className="te
             
             
       
     

                        </Button>
                          vari
               
   

                  )
              )}
          </ScrollArea>
   

          <DialogHeader>
              {editingFolder
          </Dialo
          <div className
              <Label>Nome</Label>
                value={for
                  setFor
                placehol
            </div>
      
              <Textarea
   

          

              <Label>Tipo</Label>
                value={formData.type}
                  setFor
              >
                  <SelectValue 
                <SelectContent>
                    <SelectItem 
                    </Sel

            </div>
            <div>
              <Select
                
                }
                <SelectTrigger
                </SelectTri
                  {(folders || [])
                
                       
             
              </Select>

              <Label>
                

                    onClick={() => setFormData({ 
                    style={{
                      borderColor:
                    }}
                  />
              </div>

              <Labe
                {FOLDER_ICONS.map((iconOption) =>
                  return (
                      key={iconOption.value}
                      onCl

                      styl
                        
                            : 'transp
                      title={iconOption.label}
                     
                  )
              </div>
          </div>
          <DialogFooter
              variant="outline"
                setCreateDia
              }}
              Cancelar
            <Button onClick={editingFolder ? han
            </Button>
        </DialogContent>
    </>
}











































































































                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className="w-8 h-8 rounded border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color.value,
                      borderColor:
                        formData.color === color.value ? '#000' : 'transparent',
                    }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {FOLDER_ICONS.map((iconOption) => {
                  const IconComp = iconOption.icon
                  return (
                    <button
                      key={iconOption.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, icon: iconOption.value })
                      }
                      className="p-2 rounded border-2 transition-colors hover:bg-muted"
                      style={{
                        borderColor:
                          formData.icon === iconOption.value
                            ? formData.color
                            : 'transparent',
                      }}
                      title={iconOption.label}
                    >
                      <IconComp size={20} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={editingFolder ? handleUpdate : handleCreate}>
              {editingFolder ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
