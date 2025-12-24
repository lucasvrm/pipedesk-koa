import { RefObject } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge, BadgeVariant } from '@/components/ui/badge';
import { Camera, Trash } from 'lucide-react';
import { getInitials } from '@/lib/helpers';

export interface ProfileFormData {
  name: string;
  email: string;
  secondaryEmail: string;
  cellphone: string;
  rg: string;
  cpf: string;
  address: string;
  pixKeyPF: string;
  pixKeyPJ: string;
  avatarUrl: string;
  title: string;
  department: string;
  birthDate: string;
  linkedin: string;
  bio: string;
  docIdentityUrl: string;
  docSocialContractUrl: string;
  docServiceAgreementUrl: string;
}

interface ProfileHeaderProps {
  formData: ProfileFormData;
  profile: any;
  roleInfo: any;
  fileInputRef: RefObject<HTMLInputElement>;
  onAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  isSaving: boolean;
}

export function ProfileHeader({
  formData,
  profile,
  roleInfo,
  fileInputRef,
  onAvatarUpload,
  onRemoveAvatar,
  isSaving,
}: ProfileHeaderProps) {
  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-primary via-primary/90 to-primary/70 rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 bg-black/30 hover:bg-black/50 text-white text-xs backdrop-blur"
        >
          <Camera className="mr-1 h-3 w-3" /> Alterar capa
        </Button>
      </div>

      {/* Avatar e Info */}
      <div className="px-6 -mt-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarImage src={formData.avatarUrl} className="object-cover" />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                {getInitials(profile?.name || 'U')}
              </AvatarFallback>
            </Avatar>
            
            {/* Botões de ação no avatar */}
            <div className="absolute bottom-0 right-0 flex gap-1">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full shadow-md"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
              >
                <Camera className="h-3.5 w-3.5" />
              </Button>
              {formData.avatarUrl && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8 rounded-full shadow-md"
                  onClick={onRemoveAvatar}
                  disabled={isSaving}
                >
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            
            {/* Indicador online */}
            <div className="absolute bottom-1 left-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={onAvatarUpload}
            />
          </div>

          {/* Nome e Info */}
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-bold text-foreground">{formData.name || 'Usuário'}</h1>
              <Badge variant={(roleInfo?.badgeVariant as BadgeVariant) || 'default'}>
                {roleInfo?.label || profile?.role}
              </Badge>
            </div>
            {(formData.title || formData.department) && (
              <p className="text-sm text-muted-foreground">
                {formData.title}{formData.title && formData.department ? ' • ' : ''}{formData.department}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pb-1">
            <Button variant="outline" size="sm">
              Compartilhar Perfil
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
