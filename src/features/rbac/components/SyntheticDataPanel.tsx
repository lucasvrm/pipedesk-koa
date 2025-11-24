import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { syntheticDataService } from '@/services/syntheticDataService';
import { Trash, Database, Plus, RefreshCw, Users, Briefcase } from '@phosphor-icons/react';

export default function SyntheticDataPanel() {
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({ deals: 0, tracks: 0, tasks: 0, users: 0 });
  const [config, setConfig] = useState({
    userCount: 5,
    dealCount: 10,
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
    if (!confirm('ATENÇÃO: Isso apagará todos os dados marcados como sintéticos, incluindo perfis de usuários (mas os logins permanecerão no Auth). Continuar?')) return;
    
    setLoading(true);
    try {
      await syntheticDataService.clearAllSyntheticData();
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
        
        {/* Status Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
            <div className="text-2xl font-bold text-blue-700">{counts.users}</div>
            <div className="text-xs text-blue-600 uppercase tracking-wider font-semibold">Usuários</div>
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
                <h4 className="font-medium text-sm">Geração de Usuários (Auth + Profile)</h4>
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
            <p className="text-xs text-muted-foreground ml-1">
                * Cria logins reais no Authentication. Senha padrão: <strong>password123</strong>
            </p>
        </div>

        {/* Seção 2: Negócios */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-5 h-5 text-muted-foreground" />
                <h4 className="font-medium text-sm">Geração de Negócios (Deals Flow)</h4>
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
                    <Label htmlFor="related">Criar Tracks e Tarefas automaticamente para cada Deal</Label>
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
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
        </Button>

        <Button 
            variant="destructive" 
            onClick={handleClear} 
            disabled={loading || (counts.deals === 0 && counts.users === 0)}
        >
            <Trash className="w-4 h-4 mr-2" />
            Limpar Tudo (Sintéticos)
        </Button>
      </CardFooter>
    </Card>
  );
}