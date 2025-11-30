import { supabase } from '@/lib/supabaseClient';
import { fakerPT_BR as faker } from '@faker-js/faker';
import { 
  DealStatus, 
  PlayerStage, 
  PlayerType, 
  AssetManagerType, 
  OperationType, 
  CREDIT_SUBTYPE_LABELS, 
  EQUITY_SUBTYPE_LABELS
} from '@/lib/types';

// ============================================================================
// CONSTANTES DE DADOS SINTÉTICOS (ISOLADAS)
// ============================================================================

const SYNTHETIC_STAGE_PROBABILITIES: Record<string, number> = {
  nda: 0,
  analysis: 10,
  proposal: 50,
  negotiation: 80,
  closing: 100
}

// ============================================================================
// Listas Fixas e Helpers de Geração
// ============================================================================

const PLAYER_TYPES: PlayerType[] = ['bank', 'asset_manager', 'family_office', 'securitizer', 'fund'];
const GESTORA_TYPES: AssetManagerType[] = ['fii_tijolo', 'fii_papel', 'fidc', 'fip', 'fiagro', 'multimercado'];
const RELATIONSHIP_LEVELS = ['basic', 'intermediate', 'close'];

const CREDIT_KEYS = Object.keys(CREDIT_SUBTYPE_LABELS);
const EQUITY_KEYS = Object.keys(EQUITY_SUBTYPE_LABELS);

// Tipos de Operação
const OPERATIONS: OperationType[] = [
  'ccb', 'cri_land', 'cri_construction', 'cri_corporate', 
  'debt_construction', 'receivables_advance', 'working_capital', 
  'built_to_suit', 'preferred_equity', 'repurchase', 
  'sale_and_lease_back', 'inventory_purchase', 
  'financial_swap', 'physical_swap', 'hybrid_swap'
];

// Status possíveis
const STATUSES: DealStatus[] = ['active', 'concluded', 'cancelled', 'on_hold'];

interface Products {
  credit: string[];
  equity: string[];
  barter: string[];
}

const getRandomProducts = (): Products => {
  let products: Products = { credit: [], equity: [], barter: [] };
  let hasAny = false;

  while (!hasAny) {
    const hasCredit = Math.random() > 0.3; 
    const hasEquity = Math.random() > 0.5; 
    const hasBarter = Math.random() > 0.8; 

    if (hasCredit) products.credit = faker.helpers.arrayElements(CREDIT_KEYS, { min: 1, max: 3 }) as string[];
    if (hasEquity) products.equity = faker.helpers.arrayElements(EQUITY_KEYS, { min: 1, max: 2 }) as string[];
    if (hasBarter) products.barter = ['financeira'];

    if (products.credit.length > 0 || products.equity.length > 0 || products.barter.length > 0) {
      hasAny = true;
    }
  }
  return products;
};

const getRandomPlayerType = (): PlayerType => {
  return faker.helpers.arrayElement(PLAYER_TYPES);
};

// ============================================================================
// Serviço Principal
// ============================================================================

export const syntheticDataService = {
  
  // --- 1. USUÁRIOS ---
  async generateUsers(count: number) {
    try {
      const { data, error } = await supabase.functions.invoke('generate-synthetic-users', {
        body: { action: 'create', count, password: 'password123' }
      });
      if (error) throw error;
      return data.created;
    } catch (error) {
      console.error("Erro na Edge Function:", error);
      return 0;
    }
  },

  async clearSyntheticUsers() {
    // Chama a Edge Function para deletar do Auth (que deleta profile em cascata)
    const { data, error } = await supabase.functions.invoke('generate-synthetic-users', {
        body: { action: 'delete' }
    });
    
    if (error) throw error;
    
    // Se a função retornar erro de lógica
    if (data && data.error) {
        throw new Error(data.error);
    }
    
    return data;
  },

  // --- 2. PLAYERS ---
  async generatePlayers(count: number, userId: string) {
    console.log(`🎲 Gerando ${count} players ricos...`);
    const players: any[] = [];

    for (let i = 0; i < count; i++) {
      const type = getRandomPlayerType();
      const isGestora = type === 'asset_manager';
      
      players.push({
        name: faker.company.name(),
        cnpj: faker.helpers.replaceSymbols('##.###.###/0001-##'),
        site: faker.internet.url(),
        description: faker.lorem.paragraph(),
        logo_url: faker.image.urlLoremFlickr({ category: 'business' }),
        
        type: type,
        relationship_level: faker.helpers.arrayElement(RELATIONSHIP_LEVELS),
        gestora_types: isGestora ? faker.helpers.arrayElements(GESTORA_TYPES, { min: 1, max: 3 }) : [],
        product_capabilities: getRandomProducts(),
        
        created_by: userId,
        updated_by: userId,
        is_synthetic: true
      });
    }

    const { data, error } = await supabase.from('players').insert(players).select();
    if (error) throw error;
    
    if (data) await this.generateContactsForPlayers(data, userId);
    return data;
  },

  async generateContactsForPlayers(players: any[], userId: string) {
    const contacts: any[] = [];
    for (const player of players) {
      const contactCount = faker.number.int({ min: 1, max: 3 });
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
    if (contacts.length > 0) await supabase.from('player_contacts').insert(contacts);
  },

  async clearSyntheticPlayers() {
    await supabase.from('players').delete().eq('is_synthetic', true);
  },

  // --- 3. DEALS (NEGÓCIOS) ---
  async generateDeals(count: number, createRelated: boolean = true) {
    const { data: users } = await supabase.from('profiles').select('id');
    if (!users?.length) throw new Error("Sem usuários para atribuir deals.");

    const deals: any[] = [];

    for (let i = 0; i < count; i++) {
      const creator = faker.helpers.arrayElement(users).id;
      deals.push({
        client_name: faker.company.name(),
        volume: parseFloat(faker.finance.amount({ min: 500000, max: 50000000 })),
        
        operation_type: faker.helpers.arrayElement(OPERATIONS),
        status: faker.helpers.arrayElement(STATUSES),
        
        deadline: faker.date.future().toISOString(),
        created_by: creator,
        observations: `[SINTÉTICO] ${faker.lorem.sentence()}`,
        is_synthetic: true
      });
    }

    const { data: createdDeals, error } = await supabase.from('master_deals').insert(deals).select();
    if (error) throw error;

    if (createRelated && createdDeals) {
      await this.generateTracksAndTasks(createdDeals, users.map(u => u.id));
    }
    return createdDeals?.length || 0;
  },

  async generateTracksAndTasks(deals: any[], userIds: string[]) {
    const tracks: any[] = [];
    const stages: PlayerStage[] = ['nda', 'analysis', 'proposal', 'negotiation', 'closing'];
    
    const { data: players } = await supabase.from('players').select('id, name').limit(50);

    for (const deal of deals) {
      const numTracks = faker.number.int({ min: 1, max: 4 });
      for (let k = 0; k < numTracks; k++) {
        let playerId = null;
        let playerName = faker.company.name();

        if (players && players.length && Math.random() > 0.3) {
          const p = faker.helpers.arrayElement(players);
          playerId = p.id;
          playerName = p.name;
        }

        // MUDANÇA AQUI: Escolhe a fase e aplica a probabilidade correta
        const stage = faker.helpers.arrayElement(stages);
        const correctProbability = SYNTHETIC_STAGE_PROBABILITIES[stage];

        tracks.push({
          master_deal_id: deal.id,
          player_id: playerId,
          player_name: playerName,
          track_volume: deal.volume,
          
          current_stage: stage,
          probability: correctProbability, // Valor correto, não aleatório
          
          status: 'active',
          responsibles: [faker.helpers.arrayElement(userIds)],
          is_synthetic: true
        });
      }
    }

    const { data: createdTracks } = await supabase.from('player_tracks').insert(tracks).select();
    
    if (createdTracks) {
      const tasks: any[] = [];
      for (const track of createdTracks) {
        if (Math.random() > 0.5) {
            tasks.push({
                player_track_id: track.id,
                title: "Análise preliminar",
                status: 'todo',
                priority: 'medium',
                assignees: [track.responsibles[0]],
                is_synthetic: true
            });
        }
      }
      if (tasks.length) await supabase.from('tasks').insert(tasks);
    }
  },

  async clearSyntheticDeals() {
    await supabase.from('tasks').delete().eq('is_synthetic', true);
    await supabase.from('player_tracks').delete().eq('is_synthetic', true);
    await supabase.from('master_deals').delete().eq('is_synthetic', true);
  },

  async clearAllSyntheticData() {
    await this.clearSyntheticDeals();
    await this.clearSyntheticPlayers();
    await this.clearSyntheticUsers();
  },

  async getSyntheticCounts() {
    const deals = await supabase.from('master_deals').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
    const players = await supabase.from('players').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
    const users = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
    
    return {
      deals: deals.count || 0,
      players: players.count || 0,
      users: users.count || 0,
      tracks: 0, 
      tasks: 0 
    };
  }
};
