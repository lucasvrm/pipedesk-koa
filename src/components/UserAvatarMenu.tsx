import { User, HelpCircle, LogOut, Bell, BellOff, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/lib/helpers';
import { safeString, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  useNotificationPreferences, 
  useToggleDND 
} from '@/services/notificationService';

export function UserAvatarMenu() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  
  // Preferences hooks
  const { data: preferences } = useNotificationPreferences(profile?.id || null);
  const toggleDND = useToggleDND();

  const userName = safeString(profile?.name, 'Usuário');
  const userEmail = profile?.email || '';
  const userAvatar = profile?.avatar_url || profile?.avatar;
  const userInitials = getInitials(userName);

  const handleSignOut = async () => {
    const success = await signOut();
    if (success) {
      toast.success('Você saiu do sistema');
      navigate('/login');
    } else {
      toast.error('Erro ao sair do sistema');
    }
  };

  const handleToggleDND = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!profile?.id) return;

    try {
      const newState = await toggleDND.mutateAsync(profile.id);
      toast.success(
        newState 
          ? 'Modo Não Perturbe ativado' 
          : 'Modo Não Perturbe desativado',
        { duration: 2000 }
      );
    } catch (error) {
      toast.error('Erro ao alterar modo Não Perturbe');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Menu do usuário"
        >
          <Avatar className={cn(
            "h-9 w-9 cursor-pointer border-2 transition-colors",
            preferences?.dndEnabled 
              ? "border-amber-400 dark:border-amber-600" 
              : "border-transparent hover:border-primary/20"
          )}>
            {userAvatar ? (
              <AvatarImage src={userAvatar} alt={userName} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {/* DND Indicator */}
          {preferences?.dndEnabled && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center">
              <BellOff className="h-2 w-2 text-white" />
            </span>
          )}
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

        {/* DND Toggle Rápido */}
        <div 
          className={cn(
            "flex items-center justify-between px-2 py-2 rounded-sm cursor-pointer transition-colors",
            "hover:bg-muted",
            preferences?.dndEnabled && "bg-amber-50 dark:bg-amber-950/30"
          )}
          onClick={handleToggleDND}
        >
          <div className="flex items-center gap-2">
            {preferences?.dndEnabled ? (
              <BellOff className="h-4 w-4 text-amber-600" />
            ) : (
              <Bell className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">Não Perturbe</span>
          </div>
          <Switch
            checked={preferences?.dndEnabled || false}
            onCheckedChange={() => {}}
            disabled={toggleDND.isPending}
            className="pointer-events-none"
          />
        </div>
        
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
          onClick={() => navigate('/profile/preferences')}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          Preferências de Notificação
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
  );
}
