import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Palette, Save, Check } from 'lucide-react';
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
  const [saveIndicator, setSaveIndicator] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    setAvatarBgColor(user.avatarBgColor || '#fee2e2');
    setAvatarTextColor(user.avatarTextColor || '#991b1b');
    setAvatarBorderColor(user.avatarBorderColor || '#ffffff');
  }, [user.avatarBgColor, user.avatarTextColor, user.avatarBorderColor]);

  const handleColorChange = async (field: 'avatarBgColor' | 'avatarTextColor' | 'avatarBorderColor', value: string) => {
    if (field === 'avatarBgColor') setAvatarBgColor(value);
    if (field === 'avatarTextColor') setAvatarTextColor(value);
    if (field === 'avatarBorderColor') setAvatarBorderColor(value);
    
    setSaveIndicator('saving');
    await onUpdate(field, value);
    setSaveIndicator('saved');
    setTimeout(() => setSaveIndicator('idle'), 2000);
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
        
        {/* Grid 2 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Coluna 1: Seletores Verticais */}
          <div className="flex flex-col gap-4">
            {/* Cor de Fundo */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cor de Fundo</Label>
              <Input 
                type="color" 
                value={avatarBgColor}
                onChange={(e) => handleColorChange('avatarBgColor', e.target.value)}
                className="h-12 w-full cursor-pointer"
                disabled={isSaving}
              />
            </div>
            
            {/* Cor do Texto */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cor do Texto</Label>
              <Input 
                type="color" 
                value={avatarTextColor}
                onChange={(e) => handleColorChange('avatarTextColor', e.target.value)}
                className="h-12 w-full cursor-pointer"
                disabled={isSaving}
              />
            </div>
            
            {/* Cor da Borda */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cor da Borda</Label>
              <Input 
                type="color" 
                value={avatarBorderColor}
                onChange={(e) => handleColorChange('avatarBorderColor', e.target.value)}
                className="h-12 w-full cursor-pointer"
                disabled={isSaving}
              />
            </div>
          </div>
          
          {/* Coluna 2: Preview Grande */}
          <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border-2 border-dashed">
            <p className="text-xs text-muted-foreground mb-4 text-center">Preview do Avatar</p>
            <Avatar
              className="h-32 w-32 mb-4"
              style={{
                backgroundColor: avatarBgColor,
                borderWidth: '3px',
                borderStyle: 'solid',
                borderColor: avatarBorderColor
              }}
            >
              {user.avatar && <AvatarImage src={user.avatar} className="object-cover" />}
              <AvatarFallback
                className="text-3xl font-bold"
                style={{
                  backgroundColor: avatarBgColor,
                  color: avatarTextColor
                }}
              >
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{user.name || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground">Como aparece na plataforma</p>
            </div>
          </div>
        </div>
        
        {/* Botão de feedback */}
        <div className="pt-4 border-t flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {saveIndicator === 'saving' && 'Salvando cores...'}
            {saveIndicator === 'saved' && 'Cores salvas com sucesso!'}
            {saveIndicator === 'idle' && 'Alterações são salvas automaticamente'}
          </p>
          <div className="flex items-center gap-2">
            {saveIndicator === 'saved' && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            <Button
              size="sm"
              variant={saveIndicator === 'saved' ? 'outline' : 'default'}
              disabled
              className="min-w-[80px]"
            >
              {saveIndicator === 'saving' && 'Salvando...'}
              {saveIndicator === 'saved' && 'Salvo'}
              {saveIndicator === 'idle' && (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  Salvo
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
