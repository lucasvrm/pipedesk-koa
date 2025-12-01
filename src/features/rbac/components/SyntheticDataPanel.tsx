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
  Trash, Database, Plus, ArrowsClockwise, Users, Briefcase, Buildings, Warning,
  AddressBook, Funnel, UserCircle, CheckCircle, XCircle
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

export default function SyntheticDataPanel() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({
    deals: 0, players: 0, users: 0, tracks: 0, tasks: 0,
    companies: 0, leads: 0, contacts: 0
  });
  
  const [config, setConfig] = useState({
    userCount: 5,
    assignRoles: true,
    dealCount: 10,
    dealsWithTracks: true,
    playerCount: 20,
    companyCount: 10,
    companiesWithContacts: true,
    leadCount: 15,
    leadsWithContacts: true,
    contactCount: 20
  });

  const [lastResult, setLastResult] = useState<{ type: string, count: number, ids?: string[] } | null>(null);

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

  const handleGenerate = async (type: string, fn: () => Promise<any>) => {
    setLoading(true);
    setLastResult(null);
    try {
      const result = await fn();
      const count = result?.count || result?.length || 0;
      const ids = result?.ids || [];

      if (count > 0) {
        toast.success(`${count} ${type} gerados com sucesso!`);
        setLastResult({ type, count, ids });
        await refreshCounts();
      } else {
        toast.warning(`Nenhum ${type} foi gerado. Verifique os logs.`);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao gerar ${type}: ${error.message || 'Erro desconhecido'}`);
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
        <CardDescription>Popule o ambiente com dados ricos para teste. Dados são marcados e podem ser removidos.</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-8">

        {/* Placar */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          <CountBadge count={counts.users} label="Usuários" color="blue" />
          <CountBadge count={counts.companies} label="Empresas" color="orange" />
          <CountBadge count={counts.players} label="Players" color="purple" />
          <CountBadge count={counts.leads} label="Leads" color="rose" />
          <CountBadge count={counts.contacts} label="Contatos" color="cyan" />
          <CountBadge count={counts.deals} label="Deals" color="green" />
        </div>

        {/* Resumo da Última Execução */}
        {lastResult && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                        <p className="text-sm font-medium text-green-800">
                            Geração concluída: {lastResult.count} {lastResult.type}
                        </p>
                        <p className="text-xs text-green-600">IDs: {lastResult.ids?.slice(0, 3).join(', ')} {lastResult.ids && lastResult.ids.length > 3 ? '...' : ''}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {lastResult.type === 'Empresas' && <Link to="/companies"><Button size="sm" variant="outline" className="h-8">Ver Lista</Button></Link>}
                    {lastResult.type === 'Deals' && <Link to="/deals"><Button size="sm" variant="outline" className="h-8">Ver Lista</Button></Link>}
                    {lastResult.type === 'Leads' && <Link to="/leads"><Button size="sm" variant="outline" className="h-8">Ver Lista</Button></Link>}
                    {lastResult.type === 'Players' && <Link to="/players"><Button size="sm" variant="outline" className="h-8">Ver Lista</Button></Link>}
                </div>
            </div>
        )}

        <Separator />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Coluna 1: Entidades Base */}
            <div className="space-y-6">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground flex items-center gap-2">
                    <Buildings className="w-4 h-4" /> Entidades Base
                </h3>

                {/* Users */}
                <GenerationRow
                    label="Usuários"
                    count={config.userCount}
                    setCount={v => setConfig({...config, userCount: v})}
                    onGenerate={() => handleGenerate('Usuários', () => syntheticDataService.generateUsers(config.userCount, config.assignRoles))}
                    onClear={async () => {
                        if(!confirm('Excluir TODOS os usuários sintéticos?')) return;
                        setLoading(true);
                        try { await syntheticDataService.clearSyntheticUsers(); toast.success('Limpeza concluída'); await refreshCounts(); } catch { toast.error('Erro'); } finally { setLoading(false); }
                    }}
                    hasData={counts.users > 0}
                    loading={loading}
                >
                    <div className="flex items-center space-x-2 mt-2">
                        <Switch id="roles" checked={config.assignRoles} onCheckedChange={c => setConfig({...config, assignRoles: c})} />
                        <Label htmlFor="roles" className="text-xs">Distribuir Roles</Label>
                    </div>
                </GenerationRow>

                {/* Companies */}
                <GenerationRow
                    label="Empresas"
                    count={config.companyCount}
                    setCount={v => setConfig({...config, companyCount: v})}
                    onGenerate={() => handleGenerate('Empresas', () => syntheticDataService.generateCompanies(config.companyCount, profile?.id!, config.companiesWithContacts))}
                    onClear={async () => {
                        if(!confirm('Excluir EMPRESAS sintéticas?')) return;
                        setLoading(true);
                        try { await syntheticDataService.clearSyntheticCompanies(); toast.success('Limpeza concluída'); await refreshCounts(); } catch { toast.error('Erro'); } finally { setLoading(false); }
                    }}
                    hasData={counts.companies > 0}
                    loading={loading}
                >
                    <div className="flex items-center space-x-2 mt-2">
                        <Switch id="comp-contacts" checked={config.companiesWithContacts} onCheckedChange={c => setConfig({...config, companiesWithContacts: c})} />
                        <Label htmlFor="comp-contacts" className="text-xs">Gerar contatos vinculados</Label>
                    </div>
                </GenerationRow>

                {/* Players */}
                <GenerationRow
                    label="Players"
                    count={config.playerCount}
                    setCount={v => setConfig({...config, playerCount: v})}
                    onGenerate={() => handleGenerate('Players', () => syntheticDataService.generatePlayers(config.playerCount, profile?.id!))}
                    onClear={async () => {
                        if(!confirm('Excluir PLAYERS sintéticos?')) return;
                        setLoading(true);
                        try { await syntheticDataService.clearSyntheticPlayers(); toast.success('Limpeza concluída'); await refreshCounts(); } catch { toast.error('Erro'); } finally { setLoading(false); }
                    }}
                    hasData={counts.players > 0}
                    loading={loading}
                />
            </div>

            {/* Coluna 2: Negócios & Leads */}
            <div className="space-y-6">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Negócios & Fluxo
                </h3>

                {/* Leads */}
                <GenerationRow
                    label="Leads"
                    count={config.leadCount}
                    setCount={v => setConfig({...config, leadCount: v})}
                    onGenerate={() => handleGenerate('Leads', () => syntheticDataService.generateLeads(config.leadCount, profile?.id!, config.leadsWithContacts))}
                    onClear={async () => {
                        if(!confirm('Excluir LEADS sintéticos?')) return;
                        setLoading(true);
                        try { await syntheticDataService.clearSyntheticLeads(); toast.success('Limpeza concluída'); await refreshCounts(); } catch { toast.error('Erro'); } finally { setLoading(false); }
                    }}
                    hasData={counts.leads > 0}
                    loading={loading}
                >
                    <div className="flex items-center space-x-2 mt-2">
                        <Switch id="lead-contacts" checked={config.leadsWithContacts} onCheckedChange={c => setConfig({...config, leadsWithContacts: c})} />
                        <Label htmlFor="lead-contacts" className="text-xs">Gerar contatos e membros</Label>
                    </div>
                </GenerationRow>

                {/* Deals */}
                <GenerationRow
                    label="Deals"
                    count={config.dealCount}
                    setCount={v => setConfig({...config, dealCount: v})}
                    onGenerate={() => handleGenerate('Deals', () => syntheticDataService.generateDeals(config.dealCount, config.dealsWithTracks))}
                    onClear={async () => {
                        if(!confirm('Excluir DEALS sintéticos?')) return;
                        setLoading(true);
                        try { await syntheticDataService.clearSyntheticDeals(); toast.success('Limpeza concluída'); await refreshCounts(); } catch { toast.error('Erro'); } finally { setLoading(false); }
                    }}
                    hasData={counts.deals > 0}
                    loading={loading}
                >
                    <div className="flex items-center space-x-2 mt-2">
                        <Switch id="tracks" checked={config.dealsWithTracks} onCheckedChange={c => setConfig({...config, dealsWithTracks: c})} />
                        <Label htmlFor="tracks" className="text-xs">Gerar Tracks e Tasks</Label>
                    </div>
                </GenerationRow>

                {/* Contatos Avulsos */}
                <div className="pt-4 border-t mt-4">
                    <h4 className="text-sm font-medium mb-3">Contatos Avulsos</h4>
                    <div className="bg-slate-50 p-3 rounded-md border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AddressBook className="w-5 h-5 text-slate-500" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Gerar Avulsos</p>
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs">Qtd:</Label>
                                    <Input
                                        type="number"
                                        className="h-6 w-16 text-xs"
                                        min="1"
                                        value={config.contactCount}
                                        onChange={e => setConfig({...config, contactCount: +e.target.value})}
                                    />
                                    <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => handleGenerate('Contatos', () => syntheticDataService.generateContacts(config.contactCount, profile?.id!))}>
                                        Gerar
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="destructive"
                            disabled={loading || counts.contacts === 0}
                            onClick={async () => {
                                if(!confirm('Apagar apenas contatos sintéticos órfãos (sem empresa/lead)?')) return;
                                setLoading(true);
                                try {
                                    const count = await syntheticDataService.clearOrphanSyntheticContacts();
                                    toast.success(`${count} contatos avulsos removidos.`);
                                    await refreshCounts();
                                } catch { toast.error('Erro ao limpar'); }
                                finally { setLoading(false); }
                            }}
                        >
                            <Trash className="mr-2 w-4 h-4" /> Limpar Órfãos
                        </Button>
                    </div>
                </div>

            </div>
        </div>

      </CardContent>
      
      <CardFooter className="bg-muted/20 justify-between">
        <Button variant="ghost" size="sm" onClick={refreshCounts}>
          <ArrowsClockwise className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar Contagem
        </Button>
        <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
                if (!confirm('ATENÇÃO: Isso excluirá TODOS os dados sintéticos gerados. Continuar?')) return;
                setLoading(true);
                try {
                    const result = await syntheticDataService.clearAllSyntheticData();
                    if (result) {
                        toast.success(`Limpeza concluída: ${JSON.stringify(result)}`);
                    } else {
                        toast.success('Limpeza concluída (Legacy/Auth).');
                    }
                    await refreshCounts();
                } catch (e: any) {
                    console.error(e);
                    toast.error(`Erro ao limpar tudo: ${e.message}`);
                } finally { setLoading(false); }
            }}
            disabled={loading}
        >
            <Trash className="mr-2" /> Limpar TUDO
        </Button>
      </CardFooter>
    </Card>
  );
}

// Subcomponentes

function CountBadge({ count, label, color }: { count: number, label: string, color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  };

  return (
    <div className={`p-3 rounded-lg text-center border ${colorClasses[color] || colorClasses.blue}`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs uppercase font-semibold opacity-80">{label}</div>
    </div>
  );
}

function GenerationRow({
  label, count, setCount, onGenerate, onClear, hasData, loading, children
}: any) {
  return (
    <div className="p-4 border rounded-lg bg-card/50 hover:bg-card transition-colors">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-base font-medium">{label}</Label>
        {hasData && (
            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive opacity-50 hover:opacity-100" onClick={onClear} title={`Limpar ${label}`}>
                <Trash className="w-4 h-4" />
            </Button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="w-20">
            <Input type="number" min="1" max="100" value={count} onChange={e => setCount(+e.target.value)} />
        </div>
        <Button onClick={onGenerate} disabled={loading} className="flex-1" variant="secondary">
            <Plus className="mr-2 w-4 h-4" /> Gerar
        </Button>
      </div>

      {children && <div className="mt-3 pt-3 border-t">{children}</div>}
    </div>
  );
}
