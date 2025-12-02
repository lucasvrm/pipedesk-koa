import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getPlayers } from "@/services/playerService";
import { useDeals } from "@/services/dealService";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function PlayersAnalytics() {
  const { data: players } = useQuery({
    queryKey: ["players"],
    queryFn: getPlayers
  });
  
  const { data: deals } = useDeals();

  // 1. Distribuição por Tipo de Player (Pie Chart)
  const playersByType = useMemo(() => {
    if (!players) return [];
    const counts = players.reduce((acc, player) => {
      const type = player.type || "Outros";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [players]);

  // 2. Volume de Negócios por Player (Top 5)
  // Nota: Cruzamos os players com os deals para estimar o volume de pipeline onde eles são Lead.
  const dealsByPlayer = useMemo(() => {
    if (!deals || !players) return [];
    
    // Mapa auxiliar para somar volume por ID de player
    const volumeByPlayerId: Record<string, number> = {};

    deals.forEach(deal => {
      // Verifica se o deal tem um player_id vinculado (seja diretamente ou via lógica de track futura)
      // Como adicionamos player_id no master_deals recentemente, usamos ele.
      // Se a tipagem do Deal ainda não tiver player_id explícito no TS, usamos 'any' ou verificamos o campo.
      const dealAny = deal as any; 
      const pid = dealAny.player_id || dealAny.playerId;
      
      if (pid && deal.volume) {
        volumeByPlayerId[pid] = (volumeByPlayerId[pid] || 0) + Number(deal.volume);
      }
    });

    // Mapeia IDs para Nomes e formata para o gráfico
    return players
      .map(p => ({
        name: p.name,
        value: volumeByPlayerId[p.id] || 0
      }))
      .filter(item => item.value > 0) // Mostra apenas quem tem deal
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5

  }, [deals, players]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
      {/* Gráfico de Pizza: Tipos de Players */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Perfil da Base de Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {playersByType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={playersByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {playersByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Sem dados de players
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Barras: Volume por Player */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Top Investidores (Volume em Pipeline)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {dealsByPlayer.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealsByPlayer} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(0)}M`} />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                  <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                  <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Nenhum deal vinculado a players ainda
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}