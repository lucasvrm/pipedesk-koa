import { supabase } from '@/lib/supabaseClient';
import { fakerPT_BR as faker } from '@faker-js/faker';
import { DealStatus, PlayerStage } from '@/lib/types';

export const syntheticDataService = {
  // NOVA FUNÇÃO: Chama a Edge Function para criar usuários reais no Auth
  async generateUsers(count: number) {
    const { data, error } = await supabase.functions.invoke('generate-synthetic-users', {
      body: { count, password: 'password123' } // Senha padrão para testes
    });

    if (error) throw error;
    return data.created;
  },

  // ... (Mantenha as funções generateDeals, generateTracksForDeals e generateTasksForTracks iguais à resposta anterior) ...
  async generateDeals(count: number, createRelated: boolean = true) {
     // ... (Código anterior)
     // Apenas certifique-se de manter a lógica de buscar usuários existentes
     // Agora ele vai pegar inclusive os novos usuários sintéticos gerados acima
     const { data: users } = await supabase.from('profiles').select('id');
     // ... resto do código igual
     // (Vou omitir para economizar espaço, mantenha a lógica do passo anterior)
     // ...
     
     // CÓDIGO RESUMIDO PARA O COPY-PASTE FUNCIONAR SE VOCÊ PRECISAR RECOLAR TUDO:
      if (!users || users.length === 0) throw new Error("Nenhum usuário encontrado.");
      const deals = [];
      const operations = ['acquisition', 'merger', 'investment', 'divestment'];
      const statuses: DealStatus[] = ['active', 'concluded', 'cancelled'];
  
      for (let i = 0; i < count; i++) {
        const creator = users[Math.floor(Math.random() * users.length)].id;
        deals.push({
          client_name: faker.company.name(),
          volume: parseFloat(faker.finance.amount({ min: 100000, max: 10000000 })),
          operation_type: faker.helpers.arrayElement(operations),
          deadline: faker.date.future().toISOString(),
          status: faker.helpers.arrayElement(statuses),
          created_by: creator,
          observations: `[SINTÉTICO] ${faker.lorem.sentence()}`,
          fee_percentage: faker.number.float({ min: 1, max: 15, fractionDigits: 1 }),
          is_synthetic: true
        });
      }
      const { data: createdDeals, error } = await supabase.from('master_deals').insert(deals).select();
      if (error) throw error;
      if (createRelated && createdDeals) {
        await this.generateTracksForDeals(createdDeals, users.map(u => u.id));
      }
      return createdDeals.length;
  },
  
  async generateTracksForDeals(deals: any[], userIds: string[]) {
      // ... (Mesmo código anterior)
      const tracks = [];
      const stages: PlayerStage[] = ['nda', 'analysis', 'proposal', 'negotiation', 'closing'];
      for (const deal of deals) {
        const numTracks = faker.number.int({ min: 1, max: 4 });
        for (let k = 0; k < numTracks; k++) {
          tracks.push({
            master_deal_id: deal.id,
            player_name: faker.company.name(),
            track_volume: parseFloat(faker.finance.amount({ min: 50000, max: deal.volume })),
            current_stage: faker.helpers.arrayElement(stages),
            probability: faker.number.int({ min: 0, max: 100 }),
            status: 'active',
            responsibles: [faker.helpers.arrayElement(userIds)],
            is_synthetic: true
          });
        }
      }
      const { data: createdTracks, error } = await supabase.from('player_tracks').insert(tracks).select();
      if (error) throw error;
      if (createdTracks) await this.generateTasksForTracks(createdTracks, userIds);
  },

  async generateTasksForTracks(tracks: any[], userIds: string[]) {
      // ... (Mesmo código anterior)
      const tasks = [];
      for (const track of tracks) {
          const numTasks = faker.number.int({ min: 0, max: 5 });
          for (let i = 0; i < numTasks; i++) {
              tasks.push({
                  player_track_id: track.id,
                  title: faker.hacker.verb() + ' ' + faker.hacker.noun(),
                  description: faker.lorem.sentence(),
                  assignees: [faker.helpers.arrayElement(userIds)],
                  status: faker.helpers.arrayElement(['todo', 'in_progress', 'blocked', 'completed']),
                  priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
                  is_synthetic: true
              });
          }
      }
      if (tasks.length > 0) await supabase.from('tasks').insert(tasks);
  },

  async clearAllSyntheticData() {
    // 1. Limpar Profiles Sintéticos (Isso deletará o usuário do Auth? 
    // NÃO via client. Precisamos de outra Edge Function ou deletar manualmente.
    // Porem, deletar da tabela profiles deve disparar um cascade se configurado, 
    // mas geralmente deletamos do Auth para limpar profiles.
    
    // Para simplificar: Vamos limpar os DADOS. Usuários sintéticos podem ficar ou serem limpos via função.
    // Vamos focar em limpar o fluxo (Deals/Tracks/Tasks) primeiro.
    
    await supabase.from('tasks').delete().eq('is_synthetic', true);
    await supabase.from('player_tracks').delete().eq('is_synthetic', true);
    await supabase.from('master_deals').delete().eq('is_synthetic', true);
    
    // Opcional: Limpar perfis sintéticos (não remove login do auth, apenas o perfil público)
    await supabase.from('profiles').delete().eq('is_synthetic', true);
  },

  async getSyntheticCounts() {
    const deals = await supabase.from('master_deals').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
    const tracks = await supabase.from('player_tracks').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
    const tasks = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
    const users = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);

    return {
      deals: deals.count || 0,
      tracks: tracks.count || 0,
      tasks: tasks.count || 0,
      users: users.count || 0
    };
  }
};