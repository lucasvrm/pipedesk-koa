import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Palette } from 'lucide-react';
import { getInitials } from '@/lib/helpers';
import { User } from '@/lib/types';

interface AvatarCustomizerProps {
  user: User;
  onUpdate: (field: string, value: string) => Promise<void>;
  isSaving?: boolean;
}

export function AvatarCustomizer({ user, onUpdate, isSaving = false }: AvatarCustomizerProps) {
  const [avatarBgColor, setAvatarBgColor] = useState(user.avatarBgColor || '#fee2e2');
  const [avatarTextColor, setAvatarTextColor] = useState(user.avatarTextColor || '#991b1b');
  const [avatarBorderColor, setAvatarBorderColor] = useState(user.avatarBorderColor || '#ffffff');

  useEffect(() => {
    setAvatarBgColor(user.avatarBgColor || '#fee2e2');
    setAvatarTextColor(user.avatarTextColor || '#991b1b');
    setAvatarBorderColor(user.avatarBorderColor || '#ffffff');
  }, [user.avatarBgColor, user.avatarTextColor, user.avatarBorderColor]);

  const handleColorChange = async (field: 'avatarBgColor' | 'avatarTextColor' | 'avatarBorderColor', value: string) => {
    if (field === 'avatarBgColor') setAvatarBgColor(value);
    if (field === 'avatarTextColor') setAvatarTextColor(value);
    if (field === 'avatarBorderColor') setAvatarBorderColor(value);
    
    await onUpdate(field, value);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4" /> Personalização do Avatar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Personalize as cores do seu avatar que aparece em toda a plataforma
        </p>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Cor de Fundo */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Fundo</Label>
            <Input 
              type="color" 
              value={avatarBgColor}
              onChange={(e) => handleColorChange('avatarBgColor', e.target.value)}
              className="h-10 w-full cursor-pointer"
              disabled={isSaving}
            />
          </div>
          
          {/* Cor do Texto */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Texto</Label>
            <Input 
              type="color" 
              value={avatarTextColor}
              onChange={(e) => handleColorChange('avatarTextColor', e.target.value)}
              className="h-10 w-full cursor-pointer"
              disabled={isSaving}
            />
          </div>
          
          {/* Cor da Borda */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Borda</Label>
            <Input 
              type="color" 
              value={avatarBorderColor}
              onChange={(e) => handleColorChange('avatarBorderColor', e.target.value)}
              className="h-10 w-full cursor-pointer"
              disabled={isSaving}
            />
          </div>
        </div>
        
        {/* Preview */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Preview:</span>
          <Avatar
            className="h-12 w-12"
            style={{
              backgroundColor: avatarBgColor,
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: avatarBorderColor
            }}
          >
            {user.avatar && <AvatarImage src={user.avatar} />}
            <AvatarFallback
              className="text-sm font-semibold"
              style={{
                backgroundColor: avatarBgColor,
                color: avatarTextColor
              }}
            >
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">{user.name || 'Usuário'}</p>
            <p className="text-xs text-muted-foreground">Como seu avatar aparecerá</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
