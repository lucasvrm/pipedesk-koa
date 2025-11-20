import { useState } from 'react'
import {
import {
  Folder,
import 
import { Lab
import
  DialogContent,
  DialogFooter,
  DialogTitle,
import {
  SelectContent,
  Select
} from '@
import { ScrollA
import { Folder as F
interface Folde
  onOpenChange:
}
const FOLDER_ICONS = [
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
  { value: '#ef4444', label: 'Vermelho' },
import { ScrollArea } from '@/components/ui/scroll-area'

import { Folder as FolderType, User } from '@/lib/types'

  { value: 'category', label: 
]
export default function FolderManager({
  const [createDial
 

    icon: 'folder',
    type: 'project' as FolderType['type'],
    setFormData({
      description: '',
      icon: 'folder',
 


    if (!formData.name.trim()) {
      return

      id: `folder-${Date.now()}`,
      description: formData.descriptio
      icon: formData.icon,
 

    }
    setFolders((current) => [...(current 
    setCreateDialogOpen(false)
  }
  const handleUpdate = () => {
      toast.error('Nome da pasta é obrigatór
 

        f.id === editingFolder.id
              ...f,
              description: formData.description,
              icon: formData.icon,
              type: formData.type,
          : f
    )
    setCreateDialogOp
  }
  const handleDel
    toast.success('Pasta removida')


      name: folder.name,
      color: fold
      parentId:
    })
  }
  return (
      <Dialog open=
          <DialogHeade
      
            </DialogDescri


            </Button>

            <div className="space-y-2">
            
     

                  return (
                      <div classN
                          
                            style={{ bac
                            
                          
                            {folder.description
                          
                        </div>
                          <Butto
                          </But
     

                            Remover
                        </div>
                  )
    resetForm()
   


    if (!formData.name.trim() || !editingFolder) {
            <DialogTitle>{editingFolder ? 'Edita

     

                value={form
                placeholder="Dig
            </div>
            <
              <Text
                value={formData.de
                placeholder="Descrição opcional"
            </div>
            <div>
              <Select
                onValueChange={(va
             
             
       
     
    toast.success('Pasta atualizada')
            </div>
    resetForm()
   

              >
                  <SelectValue placeholder="Nenhuma" />
                <SelectContent>
   

                        {f.name}
                    ))}
              </S

              <Label>Cor</Label>
                {FOLDER_COLORS.map((col
                    key={color.value
                    onClick={() => set
                    styl
      
                    title={co
   

          
      
                  const IconComp = iconOption.icon
                    <button
                      ty
                      className="p-2 rounded border-2 t
                        borderC
                      title={iconOption.label}
                      <IconComp 
                  )

          </div>
          <DialogFooter>
              variant="outline
                setCr
              }}

            <Button onClick={editingFolder ?
            </Button>
        </DialogContent>
    </>
}





















































































































                    type="button"




















                      type="button"





                      title={iconOption.label}














                resetForm()













