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
  Trash, Database, Plus, ArrowsClockwise, Users, Briefcase, Buildings,
  AddressBook, Funnel, CheckCircle, XCircle, TerminalWindow
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LogEntry {
  timestamp: string;
  type: 'success' | 'error' | 'info';
  message: string;
  details?: any;
}

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
    playerCount: 10,
    companyCount: 10,
    companiesWithContacts: true,
    leadCount: 15,
    leadsWithContacts: true,
    contactCount: 20
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (type: 'success' | 'error' | 'info', message: string, details?: any) => {
    setLogs(prev => [{
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    }, ...prev]);
  };

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
    addLog('info', `Iniciando geração de ${type}...`);
    try {
      const result = await fn();
      const count = result?.count || result?.length || 0;
      const ids = result?.ids || [];

      if (count > 0) {
        addLog('success', `${count} ${type} gerados com sucesso.`, { ids: ids.slice(0, 5) });
        toast.success(`${count} ${type} gerados!`);
        await refreshCounts();
      } else {
        addLog('error', `Nenhum ${type} foi gerado.`, result);
        toast.warning(`Nenhum ${type} foi gerado.`);
      }
    } catch (error: any) {
      console.error(error);
      addLog('error', `Erro ao gerar ${type}`, error.message || error);
      toast.error(`Erro ao gerar ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async (type: string, fn: () => Promise<any>) => {
    if(!confirm(`Tem certeza que deseja apagar todos os ${type} sintéticos?`)) return;
    setLoading(true);
    addLog('info', `Limpando ${type}...`);
    try {
      await fn();
      addLog('success', `${type} removidos com sucesso.`);
      toast.success(`${type} removidos.`);
      await refreshCounts();
    } catch (error: any) {
      addLog('error', `Erro ao limpar ${type}`, error.message);
      toast.error(`Erro ao limpar ${type}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* PAINEL DE CONTROLE (2/3 da tela) */}
      <div className="xl:col-span-2 space-y-6">
        <Card className="border-dashed border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle>Gerador de Dados Sintéticos</CardTitle>
                  <CardDescription>Crie dados de teste para validar fluxos.</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={refreshCounts}>
                <ArrowsClockwise className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">

            {/* PLACAR */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              <CountBadge count={counts.users} label="Usuários" color="blue" />
              <CountBadge count={counts.companies} label="Empresas" color="orange" />
              <CountBadge count={counts.players} label="Players" color="purple" />
              <CountBadge count={counts.leads} label="Leads" color="rose" />
              <CountBadge count={counts.contacts} label="Contatos" color="cyan" />
              <CountBadge count={counts.deals} label="Deals" color="green" />
            </div>

            <Separator />

            {/* SEÇÃO 1: USERS & PLAYERS */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> Atores do Sistema
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Users */}
                <GenerationCard
                  title="Usuários"
                  description="Cria usuários na Auth e Profiles."
                  count={config.userCount}
                  setCount={(v) => setConfig({...config, userCount: v})}
                  onGenerate={() => handleGenerate('Users', () => syntheticDataService.generateUsers(config.userCount, config.assignRoles))}
                  onClear={() => handleClear('Users', syntheticDataService.clearSyntheticUsers)}
                  loading={loading}
                  hasData={counts.users > 0}
                >
                   <div className="flex items-center space-x-2">
                      <Switch id="roles" checked={config.assignRoles} onCheckedChange={c => setConfig({...config, assignRoles: c})} />
                      <Label htmlFor="roles" className="text-xs">Atribuir Roles</Label>
                   </div>
                </GenerationCard>

                {/* Players */}
                <GenerationCard
                  title="Players"
                  description="Bancos, Fundos, Gestoras."
                  count={config.playerCount}
                  setCount={(v) => setConfig({...config, playerCount: v})}
                  onGenerate={() => handleGenerate('Players', () => syntheticDataService.generatePlayers(config.playerCount, profile?.id!))}
                  onClear={() => handleClear('Players', syntheticDataService.clearSyntheticPlayers)}
                  loading={loading}
                  hasData={counts.players > 0}
                />
              </div>
            </div>

            {/* SEÇÃO 2: CRM (Leads, Companies, Contacts) */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground flex items-center gap-2">
                <Buildings className="w-4 h-4" /> CRM & Entidades
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Companies */}
                <GenerationCard
                  title="Empresas"
                  description="Corporações e clientes."
                  count={config.companyCount}
                  setCount={(v) => setConfig({...config, companyCount: v})}
                  onGenerate={() => handleGenerate('Companies', () => syntheticDataService.generateCompanies(config.companyCount, profile?.id!, config.companiesWithContacts))}
                  onClear={() => handleClear('Companies', syntheticDataService.clearSyntheticCompanies)}
                  loading={loading}
                  hasData={counts.companies > 0}
                >
                   <div className="flex items-center space-x-2">
                      <Switch id="comp-cont" checked={config.companiesWithContacts} onCheckedChange={c => setConfig({...config, companiesWithContacts: c})} />
                      <Label htmlFor="comp-cont" className="text-xs">+ Contatos</Label>
                   </div>
                </GenerationCard>

                {/* Leads */}
                <GenerationCard
                  title="Leads"
                  description="Oportunidades de entrada."
                  count={config.leadCount}
                  setCount={(v) => setConfig({...config, leadCount: v})}
                  onGenerate={() => handleGenerate('Leads', () => syntheticDataService.generateLeads(config.leadCount, profile?.id!, config.leadsWithContacts))}
                  onClear={() => handleClear('Leads', syntheticDataService.clearSyntheticLeads)}
                  loading={loading}
                  hasData={counts.leads > 0}
                >
                   <div className="flex items-center space-x-2">
                      <Switch id="lead-cont" checked={config.leadsWithContacts} onCheckedChange={c => setConfig({...config, leadsWithContacts: c})} />
                      <Label htmlFor="lead-cont" className="text-xs">+ Contatos</Label>
                   </div>
                </GenerationCard>
              </div>

              {/* Contatos Avulsos */}
              <div className="bg-muted/30 p-3 rounded-md border flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <AddressBook className="text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">Contatos Avulsos</p>
                        <p className="text-xs text-muted-foreground">Sem vínculo obrigatório</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <Input type="number" className="h-8 w-16" value={config.contactCount} onChange={e => setConfig({...config, contactCount: +e.target.value})} />
                    <Button size="sm" variant="secondary" onClick={() => handleGenerate('Contacts', () => syntheticDataService.generateContacts(config.contactCount, profile?.id!))}>Gerar</Button>
                    {counts.contacts > 0 && (
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleClear('Orphan Contacts', syntheticDataService.clearOrphanSyntheticContacts)}><Trash /></Button>
                    )}
                 </div>
              </div>
            </div>

            {/* SEÇÃO 3: DEALS */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Pipeline & Negócios
              </h3>
              <div className="grid grid-cols-1">
                <GenerationCard
                  title="Deals (Negócios)"
                  description="Master Deals com Tracks e Tasks."
                  count={config.dealCount}
                  setCount={(v) => setConfig({...config, dealCount: v})}
                  onGenerate={() => handleGenerate('Deals', () => syntheticDataService.generateDeals(config.dealCount, config.dealsWithTracks))}
                  onClear={() => handleClear('Deals', syntheticDataService.clearSyntheticDeals)}
                  loading={loading}
                  hasData={counts.deals > 0}
                >
                   <div className="flex items-center space-x-2">
                      <Switch id="tracks" checked={config.dealsWithTracks} onCheckedChange={c => setConfig({...config, dealsWithTracks: c})} />
                      <Label htmlFor="tracks" className="text-xs">Gerar Tracks e Tasks vinculadas</Label>
                   </div>
                </GenerationCard>
              </div>
            </div>

          </CardContent>
          <CardFooter className="justify-center border-t py-4 bg-muted/10">
             <Button variant="destructive" onClick={() => handleClear('TUDO', syntheticDataService.clearAllSyntheticData)} disabled={loading}>
                <Trash className="mr-2" /> Limpar Base Completa
             </Button>
          </CardFooter>
        </Card>
      </div>

      {/* CONSOLE DE LOGS (1/3 da tela) */}
      <div className="xl:col-span-1 h-full">
        <Card className="h-full flex flex-col border-2 border-muted">
            <CardHeader className="py-4 border-b bg-muted/20">
                <div className="flex items-center gap-2">
                    <TerminalWindow className="w-5 h-5" />
                    <CardTitle className="text-base">Console de Execução</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative min-h-[400px]">
                <ScrollArea className="h-full absolute inset-0 p-4">
                    {logs.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm mt-10">
                            Nenhuma atividade recente.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log, i) => (
                                <div key={i} className="text-xs font-mono border-b pb-2 last:border-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-muted-foreground">[{log.timestamp}]</span>
                                        {log.type === 'success' && <span className="text-green-600 font-bold">SUCCESS</span>}
                                        {log.type === 'error' && <span className="text-red-600 font-bold">ERROR</span>}
                                        {log.type === 'info' && <span className="text-blue-600 font-bold">INFO</span>}
                                    </div>
                                    <p className="break-words">{log.message}</p>
                                    {log.details && (
                                        <pre className="mt-1 bg-slate-100 p-1 rounded overflow-x-auto text-[10px]">
                                            {JSON.stringify(log.details, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
            <CardFooter className="py-2 border-t justify-end">
                <Button variant="ghost" size="sm" onClick={() => setLogs([])}>Limpar Console</Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTES ---

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
    <div className={`p-2 rounded-lg text-center border ${colorClasses[color] || colorClasses.blue}`}>
      <div className="text-xl font-bold">{count}</div>
      <div className="text-[10px] uppercase font-semibold opacity-80">{label}</div>
    </div>
  );
}

interface GenerationCardProps {
    title: string;
    description: string;
    count: number;
    setCount: (v: number) => void;
    onGenerate: () => void;
    onClear: () => void;
    loading: boolean;
    hasData: boolean;
    children?: React.ReactNode;
}

function GenerationCard({ title, description, count, setCount, onGenerate, onClear, loading, hasData, children }: GenerationCardProps) {
    return (
        <div className="border rounded-md p-3 bg-card shadow-sm flex flex-col justify-between h-full">
            <div className="mb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-sm">{title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
                    </div>
                    {hasData && (
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive opacity-70 hover:opacity-100 -mr-1 -mt-1" onClick={onClear} title="Limpar">
                            <Trash className="w-3 h-3" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-3 mt-auto">
                {children}
                <div className="flex gap-2">
                    <Input
                        type="number"
                        min="1"
                        max="100"
                        className="h-8 text-xs"
                        value={count}
                        onChange={e => setCount(+e.target.value)}
                    />
                    <Button size="sm" className="flex-1 h-8 text-xs" onClick={onGenerate} disabled={loading}>
                        <Plus className="mr-1 w-3 h-3" /> Gerar
                    </Button>
                </div>
            </div>
        </div>
    );
}
