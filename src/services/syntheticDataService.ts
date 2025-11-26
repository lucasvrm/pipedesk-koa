import { supabase } from '@/lib/supabaseClient';
import { fakerPT_BR as faker } from '@faker-js/faker';
import { DealStatus, PlayerStage, PlayerType, AssetManagerType } from '@/lib/types';

// ============================================================================
// Listas Fixas para Geração (Evita erros de importação)
// ============================================================================

const PLAYER_TYPES: PlayerType[] = ['bank', 'asset_manager', 'family_office', 'securitizer', 'fund'];

const GESTORA_TYPES: AssetManagerType[] = ['fii_tijolo', 'fii_papel', 'fidc', 'fip', 'fiagro', 'multimercado'];

const RELATIONSHIP_LEVELS = ['basic', 'intermediate', 'close']; // Removi 'none' para garantir que tenham algum nível

const CREDIT_PRODUCTS = ['ccb', 'cri_terreno', 'cri_obra', 'cri_corporativo', 'plano_empresario', 'antecipacao', 'kgiro', 'bts'];
const EQUITY_PRODUCTS = ['equity_pref', 'retrovenda', 'slb', 'compra_estoque'];
const BARTER_PRODUCTS = ['financeira', 'fisica', 'hibrida'];

// ============================================================================
// Helpers Locais
// ============================================================================

const getRandomPlayerType = () => faker.helpers.arrayElement(PLAYER_TYPES);

const getRandomGestoraTypes = () => faker.helpers.arrayElements(GESTORA_TYPES, { min: 1, max: 3 });

const getRandomProducts = () => {
  // Força que 80% dos players tenham produtos de Crédito
  const hasCredit = Math.random() > 0.2; 
  // Força que 40% tenham Equity
  const hasEquity = Math.random() > 0.6;
  // 20% tenham Permuta
  const hasBarter = Math.random() > 0.8;

  return {
    credit: hasCredit ? faker.helpers.arrayElements(CREDIT_PRODUCTS, { min: 1, max: 3 }) : [],
    equity: hasEquity ? faker.helpers.arrayElements(EQUITY_PRODUCTS, { min: 1, max: 2 }) : [],
    barter: hasBarter ? faker.helpers.arrayElements(BARTER_PRODUCTS, { min: 1, max: 1 }) : []
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
   * Gera Tracks (Interesses de Players)
   */
  async generateTracksForDeals(deals: any[], userIds: string[]) {
    const tracks = [];
    const stages: PlayerStage[] = ['nda', 'analysis', 'proposal', 'negotiation', 'closing'];

    const { data: players } = await supabase.from('players').select('id, name').limit(50);
    
    for (const deal of deals) {
      const numTracks = faker.number.int({ min: 1, max: 5 });

      for (let k = 0; k < numTracks; k++) {
        let playerId = null;
        let playerName = faker.company.name();

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
          responsibles: [faker.helpers.arrayElement(userIds)], 
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
   * Gera Tarefas
   */
  async generateTasksForTracks(tracks: any[], userIds: string[]) {
    const tasks = [];

    for (const track of tracks) {
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
   * Gera Players (Investidores) com dados ricos GARANTIDOS
   */
  async generatePlayers(count: number, userId: string) {
    console.log(`🎲 Gerando ${count} players sintéticos...`);
    
    const players = [];

    for (let i = 0; i < count; i++) {
      const type = getRandomPlayerType();
      const isGestora = type === 'asset_manager';
      const companyName = faker.company.name();
      
      // Garante que os dados ricos não sejam undefined
      const relationshipLevel = faker.helpers.arrayElement(RELATIONSHIP_LEVELS);
      const products = getRandomProducts();
      const gestoraTypes = isGestora ? getRandomGestoraTypes() : [];

      players.push({
        name: companyName,
        cnpj: faker.helpers.replaceSymbols('##.###.###/0001-##'),
        site: faker.internet.url(),
        description: faker.lorem.paragraph(),
        logo_url: faker.image.urlLoremFlickr({ category: 'business' }),
        type: type,
        relationship_level: relationshipLevel,
        gestora_types: gestoraTypes,
        product_capabilities: products,
        created_by: userId,
        updated_by: userId,
        is_synthetic: true
      });
    }

    // Log para debug antes de inserir
    console.log("Amostra de player a ser inserido:", players[0]);

    const { data, error } = await supabase
      .from('players')
      .insert(players)
      .select();

    if (error) {
      console.error("Erro ao inserir players no Supabase:", error);
      throw error;
    }
    
    console.log(`✅ ${data.length} players criados.`);
    
    if (data) {
      await this.generateContactsForPlayers(data, userId);
    }
    
    return data;
  },

  /**
   * Gera Contatos para Players
   */
  async generateContactsForPlayers(players: any[], userId: string) {
    const contacts = [];
    
    for (const player of players) {
      const contactCount = faker.number.int({ min: 1, max: 4 });
      
      for (let k = 0; k < contactCount; k++) {
        contacts.push({
          player_id: player.id,
          name: faker.person.fullName(),
          role: faker.person.jobTitle(),
          email: faker.internet.email(),
          phone: faker.phone.number({ style: 'national' }),
          is_primary: k === 0, 
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
   * Limpeza
   */
  async clearAllSyntheticData(userId: string) {
    console.log("🧹 Limpando dados sintéticos...");
    
    await supabase.from('tasks').delete().eq('is_synthetic', true);
    await supabase.from('player_tracks').delete().eq('is_synthetic', true);
    await supabase.from('master_deals').delete().eq('is_synthetic', true);
    await supabase.from('players').delete().eq('is_synthetic', true);
    // Limpar perfis se necessário
    await supabase.from('profiles').delete().eq('is_synthetic', true);
    
    console.log("✅ Limpeza concluída.");
  },

  /**
   * Contagem
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