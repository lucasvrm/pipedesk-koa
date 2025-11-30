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
  AddressBook, Funnel, UserCircle
} from '@phosphor-icons/react';

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

    contactCount: 20 // Independent contacts
  });

  const [lastGeneratedUsers, setLastGeneratedUsers] = useState<any[]>([]);

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
    setLastGeneratedUsers([]);
    try {
      const users = await syntheticDataService.generateUsers(config.userCount, config.assignRoles);
      setLastGeneratedUsers(users);
      toast.success(`${users.length} Usuários criados!`);
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

  const handleGenerateCompanies = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const data = await syntheticDataService.generateCompanies(config.companyCount, profile.id, config.companiesWithContacts);
      toast.success(`${data?.length || 0} Empresas geradas!`);
      await refreshCounts();
    } catch (error) {
      toast.error('Erro ao gerar empresas');
    } finally { setLoading(false); }
  };

  const handleGenerateLeads = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const data = await syntheticDataService.generateLeads(config.leadCount, profile.id, config.leadsWithContacts);
      toast.success(`${data?.length || 0} Leads gerados!`);
      await refreshCounts();
    } catch (error) {
      toast.error('Erro ao gerar leads');
    } finally { setLoading(false); }
  };

  const handleGenerateDeals = async () => {
    setLoading(true);
    try {
      const count = await syntheticDataService.generateDeals(config.dealCount, config.dealsWithTracks);
      toast.success(`${count} Negócios gerados!`);
      await refreshCounts();
    } catch (error) {
      toast.error('Erro ao gerar negócios');
    } finally { setLoading(false); }
  };

  const handleGenerateContacts = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const data = await syntheticDataService.generateContacts(config.contactCount, profile.id);
      toast.success(`${data?.length || 0} Contatos gerados!`);
      await refreshCounts();
    } catch (error) {
      toast.error('Erro ao gerar contatos');
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

  const handleClearCompanies = async () => {
    if (!confirm('Excluir EMPRESAS sintéticas (e contatos vinculados)?')) return;
    setLoading(true);
    try {
      await syntheticDataService.clearSyntheticCompanies();
      toast.success('Empresas excluídas');
      await refreshCounts();
    } catch { toast.error('Erro ao limpar empresas'); } finally { setLoading(false); }
  };

  const handleClearLeads = async () => {
    if (!confirm('Excluir LEADS sintéticos?')) return;
    setLoading(true);
    try {
      await syntheticDataService.clearSyntheticLeads();
      toast.success('Leads excluídos');
      await refreshCounts();
    } catch { toast.error('Erro ao limpar leads'); } finally { setLoading(false); }
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

  const handleClearAll = async () => {
    if (!confirm('ATENÇÃO: Isso excluirá TODOS os dados sintéticos gerados. Continuar?')) return;
    setLoading(true);
    try {
      await syntheticDataService.clearAllSyntheticData();
      toast.success('Todos os dados sintéticos foram removidos.');
      await refreshCounts();
    } catch { toast.error('Erro ao limpar tudo'); } finally { setLoading(false); }
  };

  return (
    <Card className="w-full border-dashed border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-primary" />
          <CardTitle>Gerador de Dados Sintéticos</CardTitle>
        </div>
        <CardDescription>Popule o ambiente com dados ricos para teste. Dados são marcados e podem ser removidos facilmente.</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Placar */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          <CountBadge count={counts.users} label="Usuários" color="blue" />
          <CountBadge count={counts.companies} label="Empresas" color="orange" />
          <CountBadge count={counts.players} label="Players" color="purple" />
          <CountBadge count={counts.leads} label="Leads" color="rose" />
          <CountBadge count={counts.contacts} label="Contatos" color="cyan" />
          <CountBadge count={counts.deals} label="Deals" color="green" />
        </div>

        <Separator />

        {/* Controles de Geração */}
        <div className="space-y-4">
          
          {/* 1. Usuários */}
          <GenerationRow
            label="Usuários"
            icon={<UserCircle className="w-4 h-4" />}
            count={config.userCount}
            setCount={v => setConfig({...config, userCount: v})}
            onGenerate={handleGenerateUsers}
            onClear={handleClearUsers}
            hasData={!!counts.users}
            loading={loading}
          >
            <div className="flex items-center space-x-2 mt-2">
              <Switch id="roles" checked={config.assignRoles} onCheckedChange={c => setConfig({...config, assignRoles: c})} />
              <Label htmlFor="roles" className="text-xs">Distribuir Roles (Admin, Analyst, etc)</Label>
            </div>
            {lastGeneratedUsers.length > 0 && (
              <div className="mt-2 text-xs bg-slate-100 p-2 rounded">
                <strong>Últimos gerados (senha: password123):</strong>
                <ul className="list-disc pl-4 max-h-20 overflow-auto">
                  {lastGeneratedUsers.map((u, i) => (
                    <li key={i}>{u.email}</li>
                  ))}
                </ul>
              </div>
            )}
          </GenerationRow>

          {/* 2. Companies */}
          <GenerationRow
            label="Empresas"
            icon={<Buildings className="w-4 h-4" />}
            count={config.companyCount}
            setCount={v => setConfig({...config, companyCount: v})}
            onGenerate={handleGenerateCompanies}
            onClear={handleClearCompanies}
            hasData={!!counts.companies}
            loading={loading}
            color="orange"
          >
            <div className="flex items-center space-x-2 mt-2">
              <Switch id="comp-contacts" checked={config.companiesWithContacts} onCheckedChange={c => setConfig({...config, companiesWithContacts: c})} />
              <Label htmlFor="comp-contacts" className="text-xs">Gerar contatos vinculados</Label>
            </div>
          </GenerationRow>

          {/* 3. Players */}
          <GenerationRow
            label="Players"
            icon={<Buildings className="w-4 h-4" />}
            count={config.playerCount}
            setCount={v => setConfig({...config, playerCount: v})}
            onGenerate={handleGeneratePlayers}
            onClear={handleClearPlayers}
            hasData={!!counts.players}
            loading={loading}
            color="purple"
          />

          {/* 4. Leads */}
          <GenerationRow
            label="Leads"
            icon={<Funnel className="w-4 h-4" />}
            count={config.leadCount}
            setCount={v => setConfig({...config, leadCount: v})}
            onGenerate={handleGenerateLeads}
            onClear={handleClearLeads}
            hasData={!!counts.leads}
            loading={loading}
            color="rose"
          >
            <div className="flex items-center space-x-2 mt-2">
              <Switch id="lead-contacts" checked={config.leadsWithContacts} onCheckedChange={c => setConfig({...config, leadsWithContacts: c})} />
              <Label htmlFor="lead-contacts" className="text-xs">Gerar contatos e membros</Label>
            </div>
          </GenerationRow>

          {/* 5. Contatos (Avulsos) */}
          <GenerationRow
            label="Contatos (Avulsos)"
            icon={<AddressBook className="w-4 h-4" />}
            count={config.contactCount}
            setCount={v => setConfig({...config, contactCount: v})}
            onGenerate={handleGenerateContacts}
            onClear={() => {}} // Limpeza via Empresas ou Geral
            hasData={false} // Difícil rastrear avulsos isoladamente na UI
            loading={loading}
            color="cyan"
            hideDelete
          />

          {/* 6. Deals */}
          <GenerationRow
            label="Deals"
            icon={<Briefcase className="w-4 h-4" />}
            count={config.dealCount}
            setCount={v => setConfig({...config, dealCount: v})}
            onGenerate={handleGenerateDeals}
            onClear={handleClearDeals}
            hasData={!!counts.deals}
            loading={loading}
            color="green"
          >
            <div className="flex items-center space-x-2 mt-2">
              <Switch id="tracks" checked={config.dealsWithTracks} onCheckedChange={c => setConfig({...config, dealsWithTracks: c})} />
              <Label htmlFor="tracks" className="text-xs">Gerar Tracks e Tasks</Label>
            </div>
          </GenerationRow>

        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/20 justify-between">
        <Button variant="ghost" size="sm" onClick={refreshCounts}>
          <ArrowsClockwise className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar Contagem
        </Button>
        <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={loading}>
            <Trash className="mr-2" /> Limpar TUDO
        </Button>
      </CardFooter>
    </Card>
  );
}

// Subcomponentes para UI limpa

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
  label, icon, count, setCount, onGenerate, onClear, hasData, loading, children, color = 'slate', hideDelete = false
}: any) {

    const bgColors: Record<string, string> = {
        slate: 'bg-slate-50/50',
        purple: 'bg-purple-50/30 border-purple-100',
        green: 'bg-green-50/30 border-green-100',
        orange: 'bg-orange-50/30 border-orange-100',
        rose: 'bg-rose-50/30 border-rose-100',
        cyan: 'bg-cyan-50/30 border-cyan-100'
    };

    const btnColors: Record<string, string> = {
        slate: 'variant="outline"',
        purple: 'bg-purple-600 hover:bg-purple-700 text-white',
        green: 'bg-green-600 hover:bg-green-700 text-white',
        orange: 'bg-orange-500 hover:bg-orange-600 text-white',
        rose: 'bg-rose-500 hover:bg-rose-600 text-white',
        cyan: 'bg-cyan-500 hover:bg-cyan-600 text-white'
    };

  return (
    <div className={`p-3 border rounded ${bgColors[color]}`}>
      <div className="flex items-end gap-4">
        <div className="grid w-full max-w-[120px] gap-1.5">
          <Label className="text-xs">Qtd. {label}</Label>
          <Input type="number" min="1" max="100" value={count} onChange={e => setCount(+e.target.value)} />
        </div>
        <Button
            onClick={onGenerate}
            disabled={loading}
            className={`flex-1 justify-start ${btnColors[color].startsWith('bg') ? btnColors[color] : ''}`}
            variant={btnColors[color].startsWith('bg') ? 'default' : 'outline'}
        >
          <span className="mr-2">{icon}</span> Gerar {label}
        </Button>
        {!hideDelete && (
            <Button onClick={onClear} disabled={loading || !hasData} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
            <Trash />
            </Button>
        )}
      </div>
      {children && <div className="mt-2 pl-1">{children}</div>}
    </div>
  );
}
