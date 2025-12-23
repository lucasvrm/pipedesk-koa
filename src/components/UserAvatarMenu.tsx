import { User, HelpCircle, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials } from '@/lib/helpers'
import { safeString } from '@/lib/utils'
import { toast } from 'sonner'

export function UserAvatarMenu() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  const userName = safeString(profile?.name, 'Usuário')
  const userEmail = profile?.email || ''
  const userAvatar = profile?.avatar_url || profile?.avatar
  const userInitials = getInitials(userName)

  const handleSignOut = async () => {
    const success = await signOut()
    if (success) {
      toast.success('Você saiu do sistema')
      navigate('/login')
    } else {
      toast.error('Erro ao sair do sistema')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Menu do usuário"
        >
          <Avatar className="h-9 w-9 cursor-pointer border-2 border-transparent hover:border-primary/20 transition-colors">
            {userAvatar ? (
              <AvatarImage src={userAvatar} alt={userName} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Header com info do usuário */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {userAvatar ? (
                <AvatarImage src={userAvatar} alt={userName} />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-0.5">
              <p className="text-sm font-semibold leading-none">{userName}</p>
              <p className="text-xs text-muted-foreground leading-none">{userEmail}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Opções */}
        <DropdownMenuItem 
          onClick={() => navigate('/profile')}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          Perfil
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate('/help')}
          className="cursor-pointer"
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          Central de Ajuda
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
