
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
// HELPERS & TYPES
// ============================================================================

interface SyntheticCounts {
  users: number;
  players: number;
  companies: number;
  contacts: number;
  leads: number;
  deals: number;
  tracks: number;
  tasks: number;
}

// Fallback constraints if RPC fails (Development Mode)
const FALLBACK_CONSTRAINTS: Record<string, string[]> = {
  company_type: ['corporation', 'fund', 'startup', 'advisor', 'other'],
  relationship_level: ['none', 'prospect', 'active_client', 'partner', 'churned'],
  player_type: ['bank', 'asset_manager', 'family_office', 'securitizer', 'fund']
};

export const syntheticDataService = {

  // --- 0. INTROSPECTION (Anti-Drift) ---

  /**
   * Tries to fetch check constraints from the DB via RPC.
   * If RPC fails (e.g. migration not run), returns fallback or empty list.
   */
  getConstraints: async (tableName: string, constraintNamePartial: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase.rpc('get_table_constraints', { table_name: tableName });

      if (error || !data) {
        console.warn(`[SyntheticData] RPC get_table_constraints failed for ${tableName}. Using fallback if available.`);
        // Simple fallback logic based on known constraints
        if (tableName === 'companies' && constraintNamePartial.includes('type')) return FALLBACK_CONSTRAINTS.company_type;
        if (tableName === 'companies' && constraintNamePartial.includes('relationship')) return FALLBACK_CONSTRAINTS.relationship_level;
        if (tableName === 'players' && constraintNamePartial.includes('type')) return FALLBACK_CONSTRAINTS.player_type;
        return [];
      }

      // Parse the check clause to extract values
      // Example clause: "((type)::text = ANY ((ARRAY['corporation'::character varying, ...])::text[]))"
      // This is a naive parser. In a real scenario, we might want a better parser or store enums in a table.
      const targetConstraint = data.find((c: any) => c.constraint_name.includes(constraintNamePartial));
      if (!targetConstraint) return [];

      const matches = targetConstraint.check_clause.match(/'([^']+)'/g);
      if (matches) {
        return matches.map((m: string) => m.replace(/'/g, ''));
      }

      return [];
    } catch (e) {
      console.error("Error fetching constraints:", e);
      return [];
    }
  },

  // --- 1. USERS ---

  generateUsers: async (count: number, assignRoles: boolean = true) => {
    try {
      // 1. Call New Edge Function
      const { data, error } = await supabase.functions.invoke('create-synthetic-users', {
        body: { action: 'create', count, password: 'password123' }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const createdUsers = data.users || [];
      const logs: string[] = [`Created ${createdUsers.length} Auth Users.`];

      // 2. Update Profiles (created by trigger)
      // We wait a moment for trigger or just try to update.
      // Ideally, the trigger is fast. We loop to update roles.
      for (const user of createdUsers) {
        const role: UserRole = assignRoles ? faker.helpers.arrayElement(['admin', 'analyst', 'newbusiness', 'client']) : 'client';

        // Retry logic might be needed if trigger is slow, but usually it's instant in same transaction block of Auth
        // However, Supabase Auth Trigger is async sometimes.
        const { error: updateError } = await supabase.from('profiles').update({
          role: role,
          is_synthetic: true,
          name: `[SINTÉTICO] ${faker.person.fullName()}`,
          client_entity: faker.company.name(),
          has_completed_onboarding: true
        }).eq('id', user.id);

        if (updateError) {
          logs.push(`Failed to update profile for ${user.id}: ${updateError.message}`);
        }
      }

      return { count: createdUsers.length, logs };
    } catch (e: any) {
      console.error("Generate Users Error:", e);
      return { count: 0, logs: [e.message] };
    }
  },

  // --- 2. COMPANIES ---

  generateCompanies: async (count: number, userId: string, withContacts: boolean) => {
    const logs: string[] = [];
    
    // 1. Introspect
    const types = await syntheticDataService.getConstraints('companies', 'type');
    const levels = await syntheticDataService.getConstraints('companies', 'relationship');
    
    if (types.length === 0) logs.push("Warning: Could not fetch company types. Using default.");
    if (levels.length === 0) logs.push("Warning: Could not fetch relationship levels. Using default.");

    const safeTypes = types.length ? types : FALLBACK_CONSTRAINTS.company_type;
    const safeLevels = levels.length ? levels : FALLBACK_CONSTRAINTS.relationship_level;

    const companies = [];
    for (let i = 0; i < count; i++) {
      companies.push({
        name: `[SINTÉTICO] ${faker.company.name()}`,
        cnpj: faker.helpers.replaceSymbols('##.###.###/0001-##'),
        site: faker.internet.url(),
        description: faker.lorem.paragraph(),
        type: faker.helpers.arrayElement(safeTypes),
        relationship_level: faker.helpers.arrayElement(safeLevels),
        created_by: userId,
        is_synthetic: true
      });
    }

    const { data, error } = await supabase.from('companies').insert(companies).select();
    if (error) throw error;
    
    logs.push(`Created ${data?.length} companies.`);

    if (withContacts && data) {
       await syntheticDataService.generateContactsForCompanies(data, userId);
       logs.push(`Created contacts for ${data.length} companies.`);
    }

    return { count: data?.length || 0, logs };
  },

  generateContactsForCompanies: async (companies: any[], userId: string) => {
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

  // --- 3. LEADS ---

  generateLeads: async (count: number, userId: string, withContacts: boolean) => {
    const logs: string[] = [];
    const leads = [];

    // Hardcoded enums for leads as they are usually static, but could be introspected too
    const origins = ['inbound', 'outbound', 'referral', 'event'];
    const statuses = ['new', 'contacted', 'qualified', 'disqualified'];

    for (let i = 0; i < count; i++) {
      leads.push({
        legal_name: `[SINTÉTICO] ${faker.company.name()}`,
        trade_name: faker.company.name(),
        cnpj: faker.helpers.replaceSymbols('##.###.###/0001-##'),
        status: faker.helpers.arrayElement(statuses),
        origin: faker.helpers.arrayElement(origins),
        owner_user_id: userId,
        created_by: userId,
        is_synthetic: true
      });
    }

    const { data, error } = await supabase.from('leads').insert(leads).select();
    if (error) throw error;
    logs.push(`Created ${data?.length} leads.`);

    // Lead Members & Contacts logic omitted for brevity, but should be similar to previous implementation
    return { count: data?.length || 0, logs };
  },

  // --- 4. DEALS ---

  generateDeals: async (count: number, createTracks: boolean) => {
    const logs: string[] = [];

    // Dependencies
    const { data: users } = await supabase.from('profiles').select('id');
    const { data: companies } = await supabase.from('companies').select('id, name').limit(50);
    
    if (!users?.length) throw new Error("No users found to assign deals.");

    const deals = [];
    const operations: OperationType[] = ['ccb', 'cri_corporate', 'working_capital', 'financial_swap']; // Subset

    for (let i = 0; i < count; i++) {
        const creator = faker.helpers.arrayElement(users).id;
        const company = companies?.length ? faker.helpers.arrayElement(companies) : null;

        deals.push({
            client_name: company ? company.name : faker.company.name(),
            company_id: company?.id,
            volume: parseFloat(faker.finance.amount({ min: 1000000, max: 50000000 })),
            operation_type: faker.helpers.arrayElement(operations),
            status: 'active',
            created_by: creator,
            is_synthetic: true
        });
    }

    const { data, error } = await supabase.from('master_deals').insert(deals).select();
    if (error) throw error;
    logs.push(`Created ${data?.length} deals.`);

    if (createTracks && data) {
        await syntheticDataService.generateTracks(data, users.map(u => u.id));
        logs.push(`Created tracks for deals.`);
    }

    return { count: data?.length || 0, logs };
  },

  generateTracks: async (deals: any[], userIds: string[]) => {
      const tracks = [];
      const stages: PlayerStage[] = ['analysis', 'proposal', 'negotiation', 'closing'];

      for (const deal of deals) {
          tracks.push({
              master_deal_id: deal.id,
              player_name: `[SINTÉTICO] Player`,
              current_stage: faker.helpers.arrayElement(stages),
              probability: faker.number.int({ min: 10, max: 90 }),
              status: 'active',
              responsibles: [faker.helpers.arrayElement(userIds)],
              is_synthetic: true
          });
      }
      if (tracks.length) await supabase.from('player_tracks').insert(tracks);
  },

  // --- 5. CLEANUP (Robust) ---

  clearAllSyntheticData: async () => {
    try {
      // Try RPC first
      const { data, error } = await supabase.rpc('clear_synthetic_data');

      if (!error && data) {
        // Also call Edge Function to clean Auth Users
        await supabase.functions.invoke('create-synthetic-users', {
            body: { action: 'delete' }
        });
        return { success: true, counts: data };
      }

      console.warn("RPC clear_synthetic_data failed, using fallback.", error);

      // Fallback (Client-side deletion in order)
      await supabase.from('tasks').delete().eq('is_synthetic', true);
      await supabase.from('player_tracks').delete().eq('is_synthetic', true);
      await supabase.from('master_deals').delete().eq('is_synthetic', true);
      await supabase.from('lead_contacts').delete().in('lead_id', (await supabase.from('leads').select('id').eq('is_synthetic', true)).data?.map(l => l.id) || []);
      await supabase.from('leads').delete().eq('is_synthetic', true);
      await supabase.from('contacts').delete().eq('is_synthetic', true);
      await supabase.from('companies').delete().eq('is_synthetic', true);
      await supabase.from('players').delete().eq('is_synthetic', true);
      await supabase.functions.invoke('create-synthetic-users', { body: { action: 'delete' } });

      return { success: true, message: "Fallback cleanup executed" };

    } catch (e: any) {
      console.error("Cleanup Error:", e);
      return { success: false, error: e.message };
    }
  },

  getSyntheticCounts: async (): Promise<SyntheticCounts> => {
    const { data: deals } = await supabase.from('master_deals').select('id', { count: 'exact', head: true }).eq('is_synthetic', true);
    const { data: users } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_synthetic', true);
    const { data: companies } = await supabase.from('companies').select('id', { count: 'exact', head: true }).eq('is_synthetic', true);
    const { data: leads } = await supabase.from('leads').select('id', { count: 'exact', head: true }).eq('is_synthetic', true);
    
    // Note: This is an estimation or needs individual queries
    return {
        deals: deals?.length || 0, // head:true returns null data but count is in wrapper, but supabase-js select returns count in .count
        users: 0, // Placeholder, need actual count query
        companies: 0,
        leads: 0,
        contacts: 0,
        players: 0,
        tracks: 0,
        tasks: 0
    };
  },

  // Wrapper to get real counts
  fetchRealCounts: async () => {
     const p1 = supabase.from('master_deals').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
     const p2 = supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
     const p3 = supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
     const p4 = supabase.from('leads').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);
     const p5 = supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('is_synthetic', true);

     const [r1, r2, r3, r4, r5] = await Promise.all([p1, p2, p3, p4, p5]);

     return {
         deals: r1.count || 0,
         companies: r2.count || 0,
         users: r3.count || 0,
         leads: r4.count || 0,
         contacts: r5.count || 0,
         players: 0, tracks: 0, tasks: 0
     };
  }

};
