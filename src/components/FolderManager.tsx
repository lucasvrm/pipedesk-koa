import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
  Folder
  Folder,
  Circle,
} from 
import { 
import {
  Circle,
impo
import { toast } from 'sonner'
interface FolderManagerProps {
  onOpenChange: (open: boolean) => void
}
const FOLDER_ICONS = [
  { value: 'folder-open', label: 'Pasta Aberta', ic
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Folder as FolderType, User } from '@/lib/types'
import { toast } from 'sonner'

interface FolderManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: User
}

const FOLDER_ICONS = [
  { value: 'folder', label: 'Pasta', icon: Folder },
  { value: 'folder-open', label: 'Pasta Aberta', icon: FolderOpen },
  { value: 'circle', label: 'Círculo', icon: Circle },
 

      name: '',
      color: '#3b82f6',
      parentId: '',
    })
  }
  const handleCreate = () => {
 

    const newFolder: Fo
      name: formData.name,
      color: formData.color,
      parentId: formData.parentId || unde
      createdAt: new Date().toISOString(),
      position: folders.length,

    toast.success('Pasta criada com suc
 

    if (!editingFolder || !formData.name.trim()) {
      return

      current.map((f) =>
  
              name: formData.name,
             
              parent
            }
      )
    toast.success
    setCreateDialogOpen(false)
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      icon: 'folder',
      parentId: '',
      type: 'project',
    })
    setEditingFolder(null)
  }

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('Nome da pasta é obrigatório')
      return
    }

    const newFolder: FolderType = {
      id: `folder-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      color: formData.color,
      icon: formData.icon,
      parentId: formData.parentId || undefined,
      type: formData.type,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      position: folders.length,
    }

    setFolders((current) => [...current, newFolder])
    toast.success('Pasta criada com sucesso')
    resetForm()
    setCreateDialogOpen(false)
  }

  const handleUpdate = () => {
    if (!editingFolder || !formData.name.trim()) {
      toast.error('Nome da pasta é obrigatório')
      return
    }

    setFolders((current) =>
      current.map((f) =>
        f.id === editingFolder.id
          ? {
              ...f,
              name: formData.name,
              description: formData.description,
              color: formData.color,
              icon: formData.icon,
              parentId: formData.parentId || undefined,
              type: formData.type,
            }
          : f
      )
    )
    toast.success('Pasta atualizada com sucesso')
    resetForm()
    setCreateDialogOpen(false)
  }

              <Label htmlFor="name">Nome da Pa
                id="name"
                onChan
              />

     

                onChange={(e) => setFormData({ ...formData, descripti
                rows={2}
   

                <Label htmlFor="type">Tipo</La
                  value={for
                >
                    <Sel
                  <SelectContent>
                      <SelectItem key={
                      </SelectItem>
                  </SelectContent>
              </div>
      
                <Select
   

                  </SelectTrigger>

                      .filter((f) => f.id !== editingFolder?.id)
                        <SelectItem key={f
                        </SelectItem>
                  </SelectContent>


              <Label>Cor</Label>
                {FOLDER_COLORS.map((c
                    key={color.value}
                    onClick={() => setFormData({ ...formData, 
                    style={{
                      borde
                    title={color.label}
                ))}
            </div>
            <div>
              <div className="flex gap-2 mt-2">
                  const IconComp = iconOpt
                    <button
                    
                      className="p-2 rounded border-2 transition
                        borderColor: formData.icon === iconOption.value ? formData.color : 'transparent',
                      }}
                    >
                    </bu
                })}
            </div>

            <Button
              onClick={() => {
                resetForm()
            >
            </But
              {editingFolder ? 'Atuali
          </DialogFooter>
      </Dialog>
  )




































































                id="name"



              />









                rows={2}









                >



                  <SelectContent>



                      </SelectItem>

                  </SelectContent>

              </div>



                <Select





                  </SelectTrigger>



                      .filter((f) => f.id !== editingFolder?.id)



                        </SelectItem>

                  </SelectContent>





              <Label>Cor</Label>



                    key={color.value}



                    style={{



                    title={color.label}

                ))}

            </div>

            <div>

              <div className="flex gap-2 mt-2">



                    <button





                        borderColor: formData.icon === iconOption.value ? formData.color : 'transparent',

                      }}

                    >



                })}

            </div>



            <Button

              onClick={() => {

                resetForm()

            >





          </DialogFooter>

      </Dialog>

  )

