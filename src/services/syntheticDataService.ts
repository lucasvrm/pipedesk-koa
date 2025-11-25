import { supabase } from '@/lib/supabaseClient';
import { fakerPT_BR as faker } from '@faker-js/faker';
import { 
  DealStatus, 
  PlayerStage, 
  PlayerType, 
  AssetManagerType, 
  RELATIONSHIP_LEVEL_LABELS, 
  CREDIT_SUBTYPE_LABELS, 
  EQUITY_SUBTYPE_LABELS 
} from '@/lib/types';

// ============================================================================
// Helpers Locais para Geração de Dados Específicos
// ============================================================================

const getRandomPlayerType = (): PlayerType => {
  const types: PlayerType[] = ['bank', 'asset_manager', 'family_office', 'securitizer', 'fund'];
  return faker.helpers.arrayElement(types);
};

const getRandomGestoraTypes = (): AssetManagerType[] => {
  const types: AssetManagerType[] = ['fii_tijolo', 'fii_papel', 'fidc', 'fip', 'fiagro', 'multimercado'];
  return faker.helpers.arrayElements(types, { min: 1, max: 3 });
};

const getRandomProducts = () => {
  const creditKeys = Object.keys(CREDIT_SUBTYPE_LABELS);
  const equityKeys = Object.keys(EQUITY_SUBTYPE_LABELS);
  
  return {
    credit: faker.datatype.boolean() ? faker.helpers.arrayElements(creditKeys, { min: 1, max: 3 }) : [],
    equity: faker.datatype.boolean() ? faker.helpers.arrayElements(equityKeys, { min: 1, max: 2 }) : [],
    barter: [] 
  };
};

// ============================================================================
// Serviço de Dados Sintéticos
// ============================================================================

export const syntheticDataService = {
  
  /**
   * Gera Usuários Reais no Auth (via Edge Function)
   */
  async generateUsers(count: number) {
    try {
      const { data, error } = await supabase.functions.invoke('generate-synthetic-users', {
        body: { count, password: 'password123' }
      });

      if (error) throw error;
      return data.created;
    } catch (error) {
      console.error("Erro ao gerar usuários (verifique se a Edge Function está deployada):", error);
      return 0;
    }
  },

  /**
   * Gera Master Deals (Negócios)
   */
  async generateDeals(count: number, createRelated: boolean = true) {
    // Busca usuários para serem os donos dos deals
    const { data: users } = await supabase.from('profiles').select('id');
    
    if (!users || users.length === 0) {
      throw new Error("Nenhum usuário encontrado para atribuir os negócios.");
    }

    const deals = [];
    const operations = ['acquisition', 'merger', 'investment', 'divestment'];
    const statuses: DealStatus[] = ['active', 'concluded', 'cancelled'];

    for (let i = 0; i < count; i++) {
      const creator = users[Math.floor(Math.random() * users.length)].id;
      
      deals.push({
        client_name: faker.company.name(),
        volume: parseFloat(faker.finance.amount({ min: 100000, max: 50000000 })),
        operation_type: faker.helpers.arrayElement(operations),
        deadline: faker.date.future().toISOString(),
        status: faker.helpers.arrayElement(statuses),
        created_by: creator,
        observations: `[SINTÉTICO] ${faker.lorem.paragraph()}`,
        fee_percentage: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
        is_synthetic: true
      });
    }

    const { data: createdDeals, error } = await supabase.from('master_deals').insert(deals).select();

    if (error) throw error;

    if (createRelated && createdDeals) {
      await this.generateTracksForDeals(createdDeals, users.map(u => u.id));
    }

    return createdDeals?.length || 0;
  },

  /**
   * Gera Tracks (Interesses de Players) para os Deals
   */
  async generateTracksForDeals(deals: any[], userIds: string[]) {
    const tracks = [];
    const stages: PlayerStage[] = ['nda', 'analysis', 'proposal', 'negotiation', 'closing'];

    // Busca players reais existentes para vincular (se houver)
    const { data: players } = await supabase.from('players').select('id, name').limit(50);
    
    for (const deal of deals) {
      // Cria de 1 a 5 tracks por deal
      const numTracks = faker.number.int({ min: 1, max: 5 });

      for (let k = 0; k < numTracks; k++) {
        let playerId = null;
        let playerName = faker.company.name();

        // Se tivermos players no banco, usamos um deles aleatoriamente
        if (players && players.length > 0 && Math.random() > 0.3) {
           const p = faker.helpers.arrayElement(players);
           playerId = p.id;
           playerName = p.name;
        }

        tracks.push({
          master_deal_id: deal.id,
          player_id: playerId,
          player_name: playerName,
          track_volume: parseFloat(faker.finance.amount({ min: 50000, max: deal.volume })),
          current_stage: faker.helpers.arrayElement(stages),
          probability: faker.number.int({ min: 0, max: 100 }),
          status: 'active',
          responsibles: [faker.helpers.arrayElement(userIds)], // Atribui a um usuário aleatório
          notes: faker.lorem.sentence(),
          is_synthetic: true
        });
      }
    }

    const { data: createdTracks, error } = await supabase.from('player_tracks').insert(tracks).select();
    
    if (error) throw error;

    if (createdTracks) {
      await this.generateTasksForTracks(createdTracks, userIds);
    }
  },

  /**
   * Gera Tarefas para os Tracks
   */
  async generateTasksForTracks(tracks: any[], userIds: string[]) {
    const tasks = [];

    for (const track of tracks) {
      // Cria de 0 a 6 tarefas por track
      const numTasks = faker.number.int({ min: 0, max: 6 });

      for (let i = 0; i < numTasks; i++) {
        tasks.push({
          player_track_id: track.id,
          title: faker.hacker.verb() + ' ' + faker.hacker.noun(),
          description: faker.lorem.sentence(),
          assignees: [faker.helpers.arrayElement(userIds)],
          status: faker.helpers.arrayElement(['todo', 'in_progress', 'blocked', 'completed']),
          priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
          due_date: faker.date.future().toISOString(),
          is_synthetic: true
        });
      }
    }

    if (tasks.length > 0) {
      const { error } = await supabase.from('tasks').insert(tasks);
      if (error) console.error("Erro ao gerar tarefas:", error);
    }
  },

  /**
   * Gera Players (Investidores) com dados ricos
   */
  async generatePlayers(count: number, userId: string) {
    console.log(`🎲 Gerando ${count} players sintéticos...`);
    
    const players = [];

    for (let i = 0; i < count; i++) {
      const type = getRandomPlayerType();
      const isGestora = type === 'asset_manager';
      const companyName = faker.company.name();

      players.push({
        name: companyName,
        cnpj: faker.helpers.replaceSymbols('##.###.###/0001-##'),
        site: faker.internet.url(),
        description: faker.lorem.paragraph(),
        logo_url: faker.image.urlLoremFlickr({ category: 'business' }),
        type: type,
        relationship_level: faker.helpers.arrayElement(Object.keys(RELATIONSHIP_LEVEL_LABELS)),
        // Se for gestora, gera tipos de fundos, senão array vazio
        gestora_types: isGestora ? getRandomGestoraTypes() : [],
        // Gera produtos aleatórios (JSONB)
        product_capabilities: getRandomProducts(),
        created_by: userId,
        updated_by: userId,
        is_synthetic: true
      });
    }

    const { data, error } = await supabase
      .from('players')
      .insert(players)
      .select();

    if (error) throw error;
    
    console.log(`✅ ${data.length} players criados.`);
    
    // Gera contatos para esses players novos
    if (data) {
      await this.generateContactsForPlayers(data, userId);
    }
    
    return data;
  },

  /**
   * Gera Contatos para uma lista de Players
   */
  async generateContactsForPlayers(players: any[], userId: string) {
    const contacts = [];
    
    for (const player of players) {
      // Gera 1 a 4 contatos por player
      const contactCount = faker.number.int({ min: 1, max: 4 });
      
      for (let k = 0; k < contactCount; k++) {
        contacts.push({
          player_id: player.id,
          name: faker.person.fullName(),
          role: faker.person.jobTitle(),
          email: faker.internet.email(),
          phone: faker.phone.number({ style: 'national' }),
          is_primary: k === 0, // O primeiro é o principal
          created_by: userId,
          updated_by: userId
        });
      }
    }

    if (contacts.length > 0) {
      const { error } = await supabase.from('player_contacts').insert(contacts);
      if (error) console.error("Erro ao gerar contatos:", error);
      else console.log(`✅ ${contacts.length} contatos criados.`);
    }
  },

  /**
   * Limpa TODOS os dados sintéticos do sistema
   */
  async clearAllSyntheticData(userId: string) {
    console.log("🧹 Limpando dados sintéticos...");
    
    // Limpa na ordem correta (filhos primeiro) para evitar erros de FK
    await supabase.from('tasks').delete().eq('is_synthetic', true);
    await supabase.from('player_tracks').delete().eq('is_synthetic', true);
    await supabase.from('master_deals').delete().eq('is_synthetic', true);
    
    // Limpa Players e Contatos (contatos caem via cascade se configurado, mas garantimos aqui)
    // Nota: player_contacts não tem is_synthetic, mas podemos limpar via join ou assumir cascade.
    // Como criamos a tabela players com is_synthetic, deletamos eles.
    await supabase.from('players').delete().eq('is_synthetic', true);
    
    // Opcional: Limpar perfis sintéticos (não remove login do auth, apenas o perfil público)
    await supabase.from('profiles').delete().eq('is_synthetic', true);
    
    console.log("✅ Limpeza concluída.");
  },

  /**
   * Retorna contagem de dados sintéticos
   */
  async getSyntheticCounts() {
    const deals = await supabase.from('master_deals').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
    const tracks = await supabase.from('player_tracks').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
    const tasks = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
    const users = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
    const players = await supabase.from('players').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);

    return {
      deals: deals.count || 0,
      tracks: tracks.count || 0,
      tasks: tasks.count || 0,
      users: users.count || 0,
      players: players.count || 0
    };
  }
};