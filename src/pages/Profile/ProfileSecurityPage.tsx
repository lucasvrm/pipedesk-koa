import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  Shield, 
  Laptop, 
  Smartphone, 
  MapPin, 
  LogOut,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { StandardPageLayout } from '@/components/layouts';

const mockSessions = [
  { id: '1', device: 'Chrome - Windows', location: 'São Paulo, BR', lastActive: new Date().toISOString(), current: true },
  { id: '2', device: 'Safari - iPhone', location: 'São Paulo, BR', lastActive: new Date(Date.now() - 86400000).toISOString(), current: false },
];

const mockLoginHistory = [
  { date: new Date().toISOString(), device: 'Chrome - Windows', location: 'São Paulo, BR', success: true },
  { date: new Date(Date.now() - 86400000).toISOString(), device: 'Safari - iPhone', location: 'São Paulo, BR', success: true },
  { date: new Date(Date.now() - 86400000 * 2).toISOString(), device: 'Chrome - Windows', location: 'São Paulo, BR', success: false },
];

export default function ProfileSecurityPage() {
  const { profile, resetPassword } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions, setSessions] = useState(mockSessions);

  const handleRevokeSession = (sessionId: string) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
    toast.success('Sessão encerrada');
  };

  if (!profile) return null;

  return (
    <StandardPageLayout>
      {/* Grid 2x2 em desktop, 1 coluna em mobile */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Linha 1 - Esquerda: Senha */}
        <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4" /> Senha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground font-medium">Alterar senha</p>
                  <p className="text-xs text-muted-foreground">Recomendamos trocar sua senha periodicamente</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => resetPassword(profile.email)}>
                  Redefinir Senha
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Linha 1 - Direita: 2FA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" /> Autenticação de Dois Fatores (2FA)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-foreground font-medium">Status</p>
                    <Badge variant={twoFactorEnabled ? 'default' : 'secondary'} className={
                      twoFactorEnabled 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }>
                      {twoFactorEnabled ? 'Ativado' : 'Desativado'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {twoFactorEnabled ? 'Sua conta está protegida.' : 'Adicione segurança extra.'}
                  </p>
                </div>
                <Button
                  variant={twoFactorEnabled ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className={twoFactorEnabled ? 'text-destructive hover:bg-destructive/10' : ''}
                >
                  {twoFactorEnabled ? 'Desativar' : 'Ativar 2FA'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Linha 2 - Esquerda: Sessões Ativas */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Laptop className="h-4 w-4" /> Sessões Ativas
                </CardTitle>
                {sessions.length > 1 && (
                  <Button variant="ghost" size="sm" className="text-xs text-destructive">
                    Encerrar todas
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    session.current
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-muted/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-lg">
                      {session.device.includes('iPhone') ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        {session.device}
                        {session.current && (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]">
                            Sessão atual
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {session.location}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRevokeSession(session.id)}
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      Encerrar
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Linha 2 - Direita: Histórico de Login */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> Histórico de Login
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {mockLoginHistory.map((login, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", login.success ? 'bg-green-500' : 'bg-red-500')} />
                      <div>
                        <p className="text-sm text-foreground">{login.device}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {login.location}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-foreground">{format(new Date(login.date), "dd/MM/yyyy 'às' HH:mm")}</p>
                      <p className={cn("text-xs", login.success ? 'text-green-600' : 'text-red-600')}>
                        {login.success ? '✓ Sucesso' : '✕ Falhou'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  </StandardPageLayout>
  );
}
