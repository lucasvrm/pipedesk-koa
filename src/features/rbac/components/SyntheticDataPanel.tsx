import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { syntheticDataService } from '@/services/syntheticDataService';
import { useAuth } from '@/contexts/AuthContext'; // Necessário para passar o ID do criador
import { 
  Trash, 
  Database, 
  Plus, 
  ArrowsClockwise, 
  Users, 
  Briefcase, 
  Buildings // Ícone para Players
} from '@phosphor-icons/react';

export default function SyntheticDataPanel() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Adicionado contador de players
  const [counts, setCounts] = useState({ deals: 0, tracks: 0, tasks: 0, users: 0, players: 0 });
  
  // Adicionado config de players
  const [config, setConfig] = useState({
    userCount: 5,
    dealCount: 10,
    playerCount: 20, // Padrão sugerido
    generateRelated: true
  });

  const refreshCounts = async () => {
    try {
      const c = await syntheticDataService.getSyntheticCounts();
      setCounts(c);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    refreshCounts();
  }, []);

  // Handler para Usuários
  const handleGenerateUsers = async () => {
    setLoading(true);
    try {
      const count = await syntheticDataService.generateUsers(config.userCount);
      toast.success(`${count} Usuários criados!`, {
        description: 'Senha padrão: password123'
      });
      await refreshCounts();
    } catch (error) {
      toast.error('Erro ao criar usuários', {
        description: 'Verifique se a Edge Function está rodando.'
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handler para Players (NOVO)
  const handleGeneratePlayers = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const data = await syntheticDataService.generatePlayers(config.playerCount, profile.id);
      toast.success(`${data?.length || 0} Players gerados!`, {
        description: 'Incluindo contatos e dados ricos.'
      });
      await refreshCounts();
    } catch (error) {
      toast.error('Erro ao gerar players');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handler para Deals
  const handleGenerateDeals = async () => {
    setLoading(true);
    try {
      const count = await syntheticDataService.generateDeals(config.dealCount, config.generateRelated);
      toast.success(`${count} Negócios gerados!`);
      await refreshCounts();
    } catch (error) {
      toast.error('Erro ao gerar negócios');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!profile?.id) return;
    if (!confirm('ATENÇÃO: Isso apagará todos os dados marcados como sintéticos. Continuar?')) return;
    
    setLoading(true);
    try {
      await syntheticDataService.clearAllSyntheticData(profile.id);
      toast.success('Limpeza concluída');
      await refreshCounts();
    } catch (error) {
      toast.error('Erro ao limpar dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-dashed border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-primary" />
          <CardTitle>Gerador de Dados Sintéticos</CardTitle>
        </div>
        <CardDescription>
          Popule o ambiente de testes com dados em massa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Status Grid - Atualizado com Players */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
            <div className="text-2xl font-bold text-blue-700">{counts.users}</div>
            <div className="text-xs text-blue-600 uppercase tracking-wider font-semibold">Usuários</div>
          </div>
          
          {/* Card de Players */}
          <div className="bg-purple-50 p-3 rounded-lg text-center border border-purple-100">
            <div className="text-2xl font-bold text-purple-700">{counts.players}</div>
            <div className="text-xs text-purple-600 uppercase tracking-wider font-semibold">Players</div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold">{counts.deals}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Deals</div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold">{counts.tracks}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Tracks</div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold">{counts.tasks}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Tasks</div>
          </div>
        </div>

        <Separator />

        {/* Seção 1: Usuários */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <h4 className="font-medium text-sm">1. Usuários (Auth + Profile)</h4>
            </div>
            <div className="flex items-end gap-4 p-4 border rounded-md bg-slate-50">
                <div className="grid w-full max-w-xs items-center gap-1.5">
                    <Label htmlFor="userCount">Quantidade</Label>
                    <Input 
                        type="number" 
                        id="userCount" 
                        min="1" 
                        max="20"
                        value={config.userCount}
                        onChange={(e) => setConfig({...config, userCount: parseInt(e.target.value)})} 
                    />
                </div>
                <Button onClick={handleGenerateUsers} disabled={loading} variant="secondary">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Usuários
                </Button>
            </div>
        </div>

        {/* Seção 2: Players (NOVO) */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Buildings className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium text-sm">2. Players & Investidores</h4>
            </div>
            <div className="flex items-end gap-4 p-4 border rounded-md bg-purple-50/30 border-purple-100">
                <div className="grid w-full max-w-xs items-center gap-1.5">
                    <Label htmlFor="playerCount">Quantidade de Players</Label>
                    <Input 
                        type="number" 
                        id="playerCount" 
                        min="1" 
                        max="100"
                        value={config.playerCount}
                        onChange={(e) => setConfig({...config, playerCount: parseInt(e.target.value)})} 
                    />
                </div>
                <Button onClick={handleGeneratePlayers} disabled={loading || !profile} className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Gerar Players Ricos
                </Button>
            </div>
            <p className="text-xs text-muted-foreground ml-1">
                * Gera empresas com CNPJ, produtos (Crédito/Equity) e contatos vinculados.
            </p>
        </div>

        {/* Seção 3: Negócios */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-5 h-5 text-muted-foreground" />
                <h4 className="font-medium text-sm">3. Fluxo de Negócios (Deals)</h4>
            </div>
            <div className="space-y-4 p-4 border rounded-md bg-slate-50">
                <div className="flex items-end gap-4">
                    <div className="grid w-full max-w-xs items-center gap-1.5">
                        <Label htmlFor="dealCount">Quantidade de Deals</Label>
                        <Input 
                            type="number" 
                            id="dealCount" 
                            min="1" 
                            max="100"
                            value={config.dealCount}
                            onChange={(e) => setConfig({...config, dealCount: parseInt(e.target.value)})} 
                        />
                    </div>
                    <Button onClick={handleGenerateDeals} disabled={loading}>
                        <Plus className="w-4 h-4 mr-2" />
                        Gerar Fluxo
                    </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="related" 
                        checked={config.generateRelated}
                        onCheckedChange={(c) => setConfig({...config, generateRelated: c})}
                    />
                    <Label htmlFor="related">Criar Tracks e Tarefas automaticamente</Label>
                </div>
            </div>
        </div>

      </CardContent>
      <CardFooter className="flex justify-between bg-muted/20">
        <Button 
            variant="ghost" 
            onClick={refreshCounts} 
            disabled={loading}
            size="sm"
        >
            <ArrowsClockwise className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
        </Button>

        <Button 
            variant="destructive" 
            onClick={handleClear} 
            disabled={loading || (!counts.deals && !counts.users && !counts.players)}
        >
            <Trash className="w-4 h-4 mr-2" />
            Limpar Dados Sintéticos
        </Button>
      </CardFooter>
    </Card>
  );
}