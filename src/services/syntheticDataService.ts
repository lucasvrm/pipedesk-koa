import { supabase } from '@/lib/supabaseClient';
import { fakerPT_BR as faker } from '@faker-js/faker';
import { 
  DealStatus, 
  PlayerStage, 
  PlayerType, 
  AssetManagerType, 
  OperationType, 
  CREDIT_SUBTYPE_LABELS, 
  EQUITY_SUBTYPE_LABELS,
  CompanyType,
  RelationshipLevel,
  UserRole
} from '@/lib/types';

// ============================================================================
// CONSTANTES DE DADOS SINTÉTICOS
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

// Mapeamento correto com constraints do banco (migration 007)
const SYNTHETIC_COMPANY_TYPES: CompanyType[] = ['corporation', 'fund', 'startup', 'advisor', 'other'];
const SYNTHETIC_COMPANY_RELATIONSHIP_LEVELS: string[] = ['none', 'prospect', 'active_client', 'partner', 'churned'];

const RELATIONSHIP_LEVELS: RelationshipLevel[] = ['basic', 'intermediate', 'close']; // Para Players

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

const ROLES: UserRole[] = ['admin', 'analyst', 'newbusiness', 'client'];

interface Products {
  credit: string[];
  equity: string[];
  barter: string[];
}

const getRandomProducts = (): Products => {
  const products: Products = { credit: [], equity: [], barter: [] };
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
  async generateUsers(count: number, assignRoles: boolean = true) {
    try {
      // 1. Cria usuários na Auth via Edge Function
      const { data, error } = await supabase.functions.invoke('generate-synthetic-users', {
        body: { action: 'create', count, password: 'password123' }
      });
      if (error) throw error;

      const createdUsers = data.created || [];

      // 2. Atualiza roles e flag is_synthetic no Profile
      if (createdUsers.length > 0) {
        // Obter IDs dos usuários criados (assumindo que data.created retorna objetos com id)
        // A edge function retorna { created: [{ id, email, ... }] }

        for (const user of createdUsers) {
          const role = assignRoles ? faker.helpers.arrayElement(ROLES) : 'client';

          await supabase.from('profiles').update({
            role: role,
            is_synthetic: true,
            has_completed_onboarding: true,
            name: `[SINTÉTICO] ${faker.person.fullName()}`,
            client_entity: faker.company.name()
          }).eq('id', user.id);
        }
      }

      return createdUsers;
    } catch (error) {
      console.error("Erro na Edge Function ou update de roles:", error);
      throw error;
    }
  },

  async clearSyntheticUsers() {
    // 1. Remove da Auth (Edge Function)
    const { data, error } = await supabase.functions.invoke('generate-synthetic-users', {
        body: { action: 'delete' }
    });
    
    if (error) throw error;
    if (data && data.error) throw new Error(data.error);
    
    // Profiles são deletados em cascata pelo Auth, mas garantimos limpeza de orfãos se houver
    await supabase.from('profiles').delete().eq('is_synthetic', true);

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
        name: `[SINTÉTICO] ${faker.company.name()}`,
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

  // --- 3. COMPANIES & CONTACTS ---
  async generateCompanies(count: number, userId: string, withContacts: boolean = true) {
    const companies: any[] = [];

    for (let i = 0; i < count; i++) {
      companies.push({
        name: `[SINTÉTICO] ${faker.company.name()}`,
        cnpj: faker.helpers.replaceSymbols('##.###.###/0001-##'),
        site: faker.internet.url(),
        description: faker.lorem.paragraph(),
        type: faker.helpers.arrayElement(SYNTHETIC_COMPANY_TYPES),
        relationship_level: faker.helpers.arrayElement(SYNTHETIC_COMPANY_RELATIONSHIP_LEVELS),
        created_by: userId,
        is_synthetic: true
      });
    }

    const { data: createdCompanies, error } = await supabase.from('companies').insert(companies).select();
    if (error) throw error;

    if (withContacts && createdCompanies) {
      await this.generateContactsForCompanies(createdCompanies, userId);
    }
    return createdCompanies;
  },

  async generateContactsForCompanies(companies: any[], userId: string) {
    const contacts: any[] = [];
    for (const company of companies) {
      const contactCount = faker.number.int({ min: 1, max: 3 });
      for (let k = 0; k < contactCount; k++) {
        contacts.push({
          company_id: company.id,
          name: faker.person.fullName(),
          role: faker.person.jobTitle(),
          email: faker.internet.email(),
          phone: faker.phone.number({ style: 'national' }),
          is_primary: k === 0,
          created_by: userId,
          updated_by: userId,
          is_synthetic: true,
          origin: 'synthetic'
        });
      }
    }
    if (contacts.length > 0) await supabase.from('contacts').insert(contacts);
  },

  async generateContacts(count: number, userId: string) {
    // Gera contatos soltos ou vinculados a empresas existentes sintéticas
    // Busca algumas empresas sintéticas para vincular
    const { data: companies } = await supabase
      .from('companies')
      .select('id')
      .eq('is_synthetic', true)
      .limit(20);

    const contacts: any[] = [];
    for (let i = 0; i < count; i++) {
      const companyId = (companies && companies.length > 0 && Math.random() > 0.3)
        ? faker.helpers.arrayElement(companies).id
        : null;

      contacts.push({
        company_id: companyId,
        name: `[SINTÉTICO] ${faker.person.fullName()}`,
        email: faker.internet.email(),
        phone: faker.phone.number({ style: 'national' }),
        role: faker.person.jobTitle(),
        created_by: userId,
        is_synthetic: true,
        origin: 'synthetic'
      });
    }

    const { data, error } = await supabase.from('contacts').insert(contacts).select();
    if (error) throw error;
    return data;
  },

  // --- 4. LEADS ---
  async generateLeads(count: number, userId: string, withContacts: boolean = true) {
    const leads: any[] = [];

    for (let i = 0; i < count; i++) {
      leads.push({
        legal_name: `[SINTÉTICO] ${faker.company.name()}`,
        trade_name: faker.company.name(),
        cnpj: faker.helpers.replaceSymbols('##.###.###/0001-##'),
        website: faker.internet.url(),
        segment: faker.commerce.department(),
        address_city: faker.location.city(),
        address_state: faker.location.state({ abbreviated: true }),
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(['new', 'contacted', 'qualified', 'disqualified']),
        origin: faker.helpers.arrayElement(['inbound', 'outbound', 'referral', 'event', 'other']),
        owner_user_id: userId,
        created_by: userId,
        is_synthetic: true
      });
    }

    const { data: createdLeads, error } = await supabase.from('leads').insert(leads).select();
    if (error) throw error;

    if (createdLeads) {
      // Create Members (Owner)
      const members = createdLeads.map(l => ({
        lead_id: l.id,
        user_id: userId,
        role: 'owner'
      }));
      await supabase.from('lead_members').insert(members);

      // Create Contacts
      if (withContacts) {
        // Primeiro cria contatos
        const contactsToCreate: any[] = [];
        const leadContactMap: { leadId: string, contactIndex: number }[] = [];
        let contactIdx = 0;

        for (const lead of createdLeads) {
          const numContacts = faker.number.int({ min: 1, max: 2 });
          for (let k = 0; k < numContacts; k++) {
            contactsToCreate.push({
              name: faker.person.fullName(),
              email: faker.internet.email(),
              phone: faker.phone.number({ style: 'national' }),
              role: faker.person.jobTitle(),
              created_by: userId,
              is_synthetic: true,
              origin: 'synthetic'
            });
            leadContactMap.push({ leadId: lead.id, contactIndex: contactIdx });
            contactIdx++;
          }
        }

        const { data: createdContacts } = await supabase.from('contacts').insert(contactsToCreate).select();

        if (createdContacts) {
          const leadContacts = leadContactMap.map(m => ({
            lead_id: m.leadId,
            contact_id: createdContacts[m.contactIndex].id,
            is_primary: Math.random() > 0.5 // Simplificação
          }));
          await supabase.from('lead_contacts').insert(leadContacts);
        }
      }
    }
    return createdLeads;
  },


  // --- 5. DEALS (NEGÓCIOS) ---
  async generateDeals(count: number, createRelated: boolean = true) {
    const { data: users } = await supabase.from('profiles').select('id');
    if (!users?.length) throw new Error("Sem usuários para atribuir deals.");

    // Busca empresas para vincular
    const { data: companies } = await supabase.from('companies').select('id, name').limit(50);
    const hasCompanies = companies && companies.length > 0;

    const deals: any[] = [];

    for (let i = 0; i < count; i++) {
      const creator = faker.helpers.arrayElement(users).id;

      let companyId = null;
      let clientName = faker.company.name();

      if (hasCompanies && Math.random() > 0.1) {
        const c = faker.helpers.arrayElement(companies);
        companyId = c.id;
        clientName = c.name;
      }

      deals.push({
        client_name: clientName,
        company_id: companyId,
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

  // --- CLEANUP ---

  async clearSyntheticDeals() {
    await supabase.from('tasks').delete().eq('is_synthetic', true);
    await supabase.from('player_tracks').delete().eq('is_synthetic', true);
    await supabase.from('master_deals').delete().eq('is_synthetic', true);
  },

  async clearSyntheticPlayers() {
    await supabase.from('player_contacts').delete().like('name', '%SINTÉTICO%'); // fallback safety
    await supabase.from('players').delete().eq('is_synthetic', true);
  },

  async clearSyntheticCompanies() {
    // Delete contacts first if needed, though CASCADE might handle it.
    // Since we added is_synthetic to contacts, we can clean them
    await supabase.from('contacts').delete().eq('is_synthetic', true);
    await supabase.from('companies').delete().eq('is_synthetic', true);
  },

  async clearSyntheticLeads() {
    // Lead contacts/members handled by cascade usually, or we clean by flag
    // We clean lead_contacts/members implicitly or explicit if they have flags (they don't, but parent does)
    await supabase.from('leads').delete().eq('is_synthetic', true);
  },

  async clearAllSyntheticData() {
    await this.clearSyntheticDeals();
    await this.clearSyntheticLeads();
    await this.clearSyntheticCompanies(); // Cleans contacts too
    await this.clearSyntheticPlayers();
    await this.clearSyntheticUsers();
  },

  async getSyntheticCounts() {
    const deals = await supabase.from('master_deals').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
    const players = await supabase.from('players').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
    const users = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
    const companies = await supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
    const leads = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
    const contacts = await supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
    
    return {
      deals: deals.count || 0,
      players: players.count || 0,
      users: users.count || 0,
      companies: companies.count || 0,
      leads: leads.count || 0,
      contacts: contacts.count || 0,
      tracks: 0, 
      tasks: 0 
    };
  }
};
