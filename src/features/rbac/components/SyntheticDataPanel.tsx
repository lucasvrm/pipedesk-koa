import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { syntheticDataService } from '@/services/syntheticDataService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Trash, Database, Plus, ArrowsClockwise, Users, Briefcase, Buildings, Warning
} from '@phosphor-icons/react';

export default function SyntheticDataPanel() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({ deals: 0, players: 0, users: 0, tracks: 0, tasks: 0 });
  
  const [config, setConfig] = useState({
    userCount: 5,
    dealCount: 10,
    playerCount: 20,
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

  // --- Handlers de Geração ---

  const handleGenerateUsers = async () => {
    setLoading(true);
    try {
      const count = await syntheticDataService.generateUsers(config.userCount);
      toast.success(`${count} Usuários criados!`);
      await refreshCounts();
    } catch (error) {
      toast.error('Erro ao criar usuários');
    } finally { setLoading(false); }
  };

  const handleGeneratePlayers = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const data = await syntheticDataService.generatePlayers(config.playerCount, profile.id);
      toast.success(`${data?.length || 0} Players gerados!`);
      await refreshCounts();
    } catch (error) {
      toast.error('Erro ao gerar players');
    } finally { setLoading(false); }
  };

  const handleGenerateDeals = async () => {
    setLoading(true);
    try {
      const count = await syntheticDataService.generateDeals(config.dealCount, config.generateRelated);
      toast.success(`${count} Negócios gerados!`);
      await refreshCounts();
    } catch (error) {
      toast.error('Erro ao gerar negócios');
    } finally { setLoading(false); }
  };

  // --- Handlers de Exclusão ---

  const handleClearUsers = async () => {
    if (!confirm('Excluir apenas USUÁRIOS sintéticos?')) return;
    setLoading(true);
    try {
      await syntheticDataService.clearSyntheticUsers();
      toast.success('Usuários excluídos');
      await refreshCounts();
    } catch { toast.error('Erro ao limpar usuários'); } finally { setLoading(false); }
  };

  const handleClearPlayers = async () => {
    if (!confirm('Excluir apenas PLAYERS sintéticos?')) return;
    setLoading(true);
    try {
      await syntheticDataService.clearSyntheticPlayers();
      toast.success('Players excluídos');
      await refreshCounts();
    } catch { toast.error('Erro ao limpar players'); } finally { setLoading(false); }
  };

  const handleClearDeals = async () => {
    if (!confirm('Excluir apenas DEALS (e tracks/tasks) sintéticos?')) return;
    setLoading(true);
    try {
      await syntheticDataService.clearSyntheticDeals();
      toast.success('Deals excluídos');
      await refreshCounts();
    } catch { toast.error('Erro ao limpar deals'); } finally { setLoading(false); }
  };

  return (
    <Card className="w-full border-dashed border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-primary" />
          <CardTitle>Gerador de Dados Sintéticos</CardTitle>
        </div>
        <CardDescription>Popule o ambiente com dados ricos para teste.</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Placar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
            <div className="text-2xl font-bold text-blue-700">{counts.users}</div>
            <div className="text-xs text-blue-600 uppercase font-semibold">Usuários</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center border border-purple-100">
            <div className="text-2xl font-bold text-purple-700">{counts.players}</div>
            <div className="text-xs text-purple-600 uppercase font-semibold">Players</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center border border-green-100">
            <div className="text-2xl font-bold text-green-700">{counts.deals}</div>
            <div className="text-xs text-green-600 uppercase font-semibold">Deals</div>
          </div>
        </div>

        <Separator />

        {/* Controles de Geração */}
        <div className="space-y-6">
          
          {/* 1. Usuários */}
          <div className="flex items-end gap-4 p-3 border rounded bg-slate-50/50">
            <div className="grid w-full max-w-[120px] gap-1.5">
              <Label className="text-xs">Qtd. Usuários</Label>
              <Input type="number" min="1" max="20" value={config.userCount} onChange={e => setConfig({...config, userCount: +e.target.value})} />
            </div>
            <Button onClick={handleGenerateUsers} disabled={loading} variant="outline" className="flex-1 justify-start">
              <Users className="mr-2" /> Gerar Usuários
            </Button>
            <Button onClick={handleClearUsers} disabled={loading || !counts.users} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
              <Trash />
            </Button>
          </div>

          {/* 2. Players */}
          <div className="flex items-end gap-4 p-3 border rounded bg-purple-50/30 border-purple-100">
            <div className="grid w-full max-w-[120px] gap-1.5">
              <Label className="text-xs">Qtd. Players</Label>
              <Input type="number" min="1" max="100" value={config.playerCount} onChange={e => setConfig({...config, playerCount: +e.target.value})} />
            </div>
            <Button onClick={handleGeneratePlayers} disabled={loading} className="flex-1 justify-start bg-purple-600 hover:bg-purple-700 text-white">
              <Buildings className="mr-2" /> Gerar Players
            </Button>
            <Button onClick={handleClearPlayers} disabled={loading || !counts.players} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
              <Trash />
            </Button>
          </div>

          {/* 3. Deals */}
          <div className="flex items-end gap-4 p-3 border rounded bg-green-50/30 border-green-100">
            <div className="grid w-full max-w-[120px] gap-1.5">
              <Label className="text-xs">Qtd. Deals</Label>
              <Input type="number" min="1" max="100" value={config.dealCount} onChange={e => setConfig({...config, dealCount: +e.target.value})} />
            </div>
            <Button onClick={handleGenerateDeals} disabled={loading} className="flex-1 justify-start bg-green-600 hover:bg-green-700 text-white">
              <Briefcase className="mr-2" /> Gerar Deals
            </Button>
            <Button onClick={handleClearDeals} disabled={loading || !counts.deals} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
              <Trash />
            </Button>
          </div>

        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/20 justify-between">
        <Button variant="ghost" size="sm" onClick={refreshCounts}>
          <ArrowsClockwise className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar Contagem
        </Button>
        {/* Botão de Pânico (Limpar Tudo) se necessário, ou removido já que temos individuais */}
      </CardFooter>
    </Card>
  );
}