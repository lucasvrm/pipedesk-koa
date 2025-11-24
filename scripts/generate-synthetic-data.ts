#!/usr/bin/env tsx

/**
 * PipeDesk Synthetic Data Generator
 * 
 * Generates realistic M&A deal data for testing and demonstration purposes.
 * Creates a complete dataset with proper relationships and realistic values.
 * 
 * Usage: npm run generate-data
 */

import { createClient } from '@supabase/supabase-js'
import { faker } from '@faker-js/faker'
import type { Database } from '../src/lib/databaseTypes.js'

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'your-supabase-url'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key'

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

// Data generation configuration
const CONFIG = {
  users: 25,
  masterDeals: 15,
  playerTracksPerDeal: { min: 2, max: 6 },
  tasksPerTrack: { min: 3, max: 12 },
  commentsPerEntity: { min: 0, max: 8 },
  folders: 12,
  customFields: 8,
  notifications: 50
}

// Realistic M&A data pools
const COMPANY_NAMES = [
  'TechCorp Solutions', 'Global Manufacturing Inc', 'FinanceFirst Holdings', 'Healthcare Innovations',
  'Energy Dynamics Ltd', 'Retail Excellence Group', 'Logistics Masters', 'Digital Ventures',
  'BioTech Advances', 'Aerospace Systems', 'Automotive Leaders', 'Real Estate Empire',
  'Food & Beverage Co', 'Telecommunications Plus', 'Construction Giants', 'Media Networks',
  'Pharmaceutical Research', 'Software Innovations', 'Mining Operations', 'Chemical Industries',
  'Transportation Hub', 'Entertainment Studios', 'Fashion Brands', 'Sports Management',
  'Education Services', 'Consulting Experts', 'Insurance Leaders', 'Banking Solutions'
]

const OPERATION_TYPES = ['acquisition', 'merger', 'investment', 'divestment'] as const
const DEAL_STATUSES = ['active', 'cancelled', 'concluded'] as const
const PLAYER_STAGES = ['nda', 'analysis', 'proposal', 'negotiation', 'closing'] as const
const USER_ROLES = ['admin', 'analyst', 'client', 'newbusiness'] as const
const TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'completed'] as const
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

const FOLDER_TYPES = ['project', 'team', 'sprint', 'category'] as const
const FOLDER_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']
const FOLDER_ICONS = ['FolderOpen', 'Users', 'Calendar', 'Tag', 'Briefcase', 'Target', 'Zap', 'Star']

// Utility functions
const randomChoice = <T>(array: readonly T[]): T => array[Math.floor(Math.random() * array.length)]
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min: number, max: number): number => Math.random() * (max - min) + min
const randomBool = (probability = 0.5): boolean => Math.random() < probability
const randomDate = (start: Date, end: Date): string => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString()

// Generate UUIDs
const generateId = (): string => faker.string.uuid()

// Data generators
class SyntheticDataGenerator {
  private users: any[] = []
  private masterDeals: any[] = []
  private playerTracks: any[] = []
  private tasks: any[] = []
  private folders: any[] = []
  private pipelineStages: any[] = []

  async generateUsers(): Promise<any[]> {
    console.log('🧑‍💼 Generating users...')
    
    const users = []
    
    // Always create admin user
    users.push({
      id: generateId(),
      name: 'Lucas Vieira',
      email: 'lucas@pipedesk.com',
      role: 'admin',
      avatar: faker.image.avatar(),
      client_entity: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    // Generate other users
    for (let i = 0; i < CONFIG.users - 1; i++) {
      const role = randomChoice(USER_ROLES)
      const firstName = faker.person.firstName()
      const lastName = faker.person.lastName()
      
      users.push({
        id: generateId(),
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }),
        role,
        avatar: faker.image.avatar(),
        client_entity: role === 'client' ? randomChoice(COMPANY_NAMES) : null,
        created_at: randomDate(new Date(2023, 0, 1), new Date()),
        updated_at: randomDate(new Date(2023, 6, 1), new Date())
      })
    }

    this.users = users
    return users
  }

  async generatePipelineStages(): Promise<any[]> {
    console.log('📊 Generating pipeline stages...')
    
    const stages = [
      { name: 'NDA', color: '#6B7280', order: 1 },
      { name: 'Analysis', color: '#3B82F6', order: 2 },
      { name: 'Proposal', color: '#F59E0B', order: 3 },
      { name: 'Negotiation', color: '#EF4444', order: 4 },
      { name: 'Closing', color: '#10B981', order: 5 }
    ]

    const pipelineStages = stages.map(stage => ({
      id: generateId(),
      pipeline_id: null, // Global stages
      name: stage.name,
      color: stage.color,
      stage_order: stage.order,
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    this.pipelineStages = pipelineStages
    return pipelineStages
  }

  async generateFolders(): Promise<any[]> {
    console.log('📁 Generating folders...')
    
    const folders = []
    const adminUser = this.users.find(u => u.role === 'admin')

    // Root folders
    const rootFolders = [
      { name: 'Active Deals', type: 'project', icon: 'Briefcase' },
      { name: 'M&A Team', type: 'team', icon: 'Users' },
      { name: 'Q4 2024', type: 'sprint', icon: 'Calendar' },
      { name: 'Technology Sector', type: 'category', icon: 'Zap' }
    ]

    for (const folder of rootFolders) {
      folders.push({
        id: generateId(),
        name: folder.name,
        description: faker.lorem.sentence(),
        color: randomChoice(FOLDER_COLORS),
        icon: folder.icon,
        parent_id: null,
        type: folder.type,
        position: folders.length,
        created_at: new Date().toISOString(),
        created_by: adminUser.id
      })
    }

    // Sub-folders
    for (let i = 0; i < CONFIG.folders - rootFolders.length; i++) {
      const parentFolder = randomBool(0.7) ? randomChoice(folders) : null
      
      folders.push({
        id: generateId(),
        name: faker.company.buzzPhrase(),
        description: faker.lorem.sentence(),
        color: randomChoice(FOLDER_COLORS),
        icon: randomChoice(FOLDER_ICONS),
        parent_id: parentFolder?.id || null,
        type: randomChoice(FOLDER_TYPES),
        position: i,
        created_at: randomDate(new Date(2023, 0, 1), new Date()),
        created_by: randomChoice(this.users).id
      })
    }

    this.folders = folders
    return folders
  }

  async generateMasterDeals(): Promise<any[]> {
    console.log('💼 Generating master deals...')
    
    const deals = []
    const adminUsers = this.users.filter(u => u.role === 'admin' || u.role === 'analyst')

    for (let i = 0; i < CONFIG.masterDeals; i++) {
      const operationType = randomChoice(OPERATION_TYPES)
      const status = randomChoice(DEAL_STATUSES)
      const volume = randomFloat(5_000_000, 500_000_000) // $5M to $500M
      const createdAt = randomDate(new Date(2023, 0, 1), new Date())
      
      deals.push({
        id: generateId(),
        client_name: randomChoice(COMPANY_NAMES),
        volume: Math.round(volume),
        operation_type: operationType,
        deadline: randomDate(new Date(), new Date(2025, 11, 31)),
        observations: faker.lorem.paragraph(),
        status,
        fee_percentage: randomFloat(1, 5), // 1% to 5%
        created_at: createdAt,
        updated_at: randomDate(new Date(createdAt), new Date()),
        created_by: randomChoice(adminUsers).id,
        deleted_at: status === 'cancelled' && randomBool(0.3) ? new Date().toISOString() : null
      })
    }

    this.masterDeals = deals
    return deals
  }

  async generatePlayerTracks(): Promise<any[]> {
    console.log('🎯 Generating player tracks...')
    
    const tracks = []

    for (const deal of this.masterDeals) {
      const numTracks = randomInt(CONFIG.playerTracksPerDeal.min, CONFIG.playerTracksPerDeal.max)
      
      for (let i = 0; i < numTracks; i++) {
        const stage = randomChoice(PLAYER_STAGES)
        const probability = this.calculateProbabilityByStage(stage)
        const trackVolume = deal.volume * randomFloat(0.1, 1.0) // 10% to 100% of deal volume
        const responsibles = faker.helpers.arrayElements(
          this.users.filter(u => u.role !== 'client').map(u => u.id),
          { min: 1, max: 3 }
        )

        tracks.push({
          id: generateId(),
          master_deal_id: deal.id,
          player_name: randomChoice(COMPANY_NAMES),
          track_volume: Math.round(trackVolume),
          current_stage: stage,
          probability,
          responsibles,
          status: deal.status,
          notes: faker.lorem.paragraph(),
          created_at: randomDate(new Date(deal.created_at), new Date()),
          updated_at: randomDate(new Date(deal.created_at), new Date())
        })
      }
    }

    this.playerTracks = tracks
    return tracks
  }

  private calculateProbabilityByStage(stage: string): number {
    const probabilities = {
      nda: randomInt(10, 30),
      analysis: randomInt(25, 50),
      proposal: randomInt(40, 70),
      negotiation: randomInt(60, 85),
      closing: randomInt(80, 95)
    }
    return probabilities[stage as keyof typeof probabilities] || 50
  }

  async generateTasks(): Promise<any[]> {
    console.log('✅ Generating tasks...')
    
    const tasks = []
    const taskTemplates = [
      'Sign NDA with {player}',
      'Conduct financial analysis',
      'Prepare valuation model',
      'Review legal documents',
      'Schedule management presentation',
      'Due diligence checklist',
      'Market research and comps',
      'Prepare term sheet',
      'Legal review and approval',
      'Final negotiations',
      'Board approval process',
      'Closing documentation',
      'Integration planning',
      'Regulatory approvals',
      'Stakeholder communications'
    ]

    for (const track of this.playerTracks) {
      const numTasks = randomInt(CONFIG.tasksPerTrack.min, CONFIG.tasksPerTrack.max)
      
      for (let i = 0; i < numTasks; i++) {
        const template = randomChoice(taskTemplates)
        const title = template.replace('{player}', track.player_name)
        const status = randomChoice(TASK_STATUSES)
        const priority = randomChoice(TASK_PRIORITIES)
        const assignees = faker.helpers.arrayElements(
          this.users.filter(u => u.role !== 'client').map(u => u.id),
          { min: 1, max: 2 }
        )

        const task = {
          id: generateId(),
          player_track_id: track.id,
          title,
          description: faker.lorem.paragraph(),
          assignees,
          due_date: randomBool(0.8) ? randomDate(new Date(), new Date(2025, 5, 30)) : null,
          completed: status === 'completed',
          dependencies: [], // Will be populated later
          is_milestone: randomBool(0.2),
          position: i,
          status,
          priority,
          created_at: randomDate(new Date(track.created_at), new Date()),
          updated_at: randomDate(new Date(track.created_at), new Date())
        }

        tasks.push(task)
      }
    }

    // Add some task dependencies
    for (const task of tasks) {
      if (randomBool(0.3)) {
        const sameTracks = tasks.filter(t => t.player_track_id === task.player_track_id && t.id !== task.id)
        if (sameTracks.length > 0) {
          task.dependencies = [randomChoice(sameTracks).id]
        }
      }
    }

    this.tasks = tasks
    return tasks
  }

  async generateComments(): Promise<any[]> {
    console.log('💬 Generating comments...')
    
    const comments = []
    const entities = [
      ...this.masterDeals.map(d => ({ id: d.id, type: 'deal' })),
      ...this.playerTracks.map(t => ({ id: t.id, type: 'track' })),
      ...this.tasks.map(t => ({ id: t.id, type: 'task' }))
    ]

    const commentTemplates = [
      'Great progress on this deal! 👍',
      'We need to follow up on the due diligence items.',
      'The client is very interested in moving forward.',
      'Legal review is taking longer than expected.',
      'Updated the financial model with new assumptions.',
      'Meeting scheduled for next week.',
      'Waiting for regulatory approval.',
      'Excellent work by the team!',
      'Need to address the pricing concerns.',
      'Timeline looks aggressive but achievable.'
    ]

    for (const entity of entities) {
      const numComments = randomInt(CONFIG.commentsPerEntity.min, CONFIG.commentsPerEntity.max)
      
      for (let i = 0; i < numComments; i++) {
        const author = randomChoice(this.users.filter(u => u.role !== 'client'))
        const content = randomChoice(commentTemplates)
        const mentions = randomBool(0.3) ? [randomChoice(this.users).id] : []

        comments.push({
          id: generateId(),
          entity_id: entity.id,
          entity_type: entity.type,
          author_id: author.id,
          content,
          mentions,
          created_at: randomDate(new Date(2023, 6, 1), new Date())
        })
      }
    }

    return comments
  }

  async generateNotifications(): Promise<any[]> {
    console.log('🔔 Generating notifications...')
    
    const notifications = []
    const notificationTypes = [
      'mention', 'assignment', 'status_change', 'deadline', 'comment', 'system'
    ]

    const templates = {
      mention: 'You were mentioned in a comment',
      assignment: 'You were assigned to a new task',
      status_change: 'Deal status has been updated',
      deadline: 'Task deadline is approaching',
      comment: 'New comment on your deal',
      system: 'System maintenance scheduled'
    }

    for (let i = 0; i < CONFIG.notifications; i++) {
      const type = randomChoice(notificationTypes)
      const user = randomChoice(this.users)
      
      notifications.push({
        id: generateId(),
        user_id: user.id,
        type,
        title: templates[type as keyof typeof templates],
        message: faker.lorem.sentence(),
        link: randomBool(0.8) ? `/deals/${randomChoice(this.masterDeals).id}` : null,
        read: randomBool(0.6),
        created_at: randomDate(new Date(2023, 8, 1), new Date())
      })
    }

    return notifications
  }

  async generateEntityLocations(): Promise<any[]> {
    console.log('📍 Generating entity locations (cross-tagging)...')
    
    const locations = []
    const entities = [
      ...this.masterDeals.map(d => ({ id: d.id, type: 'deal' })),
      ...this.playerTracks.map(t => ({ id: t.id, type: 'track' })),
      ...this.tasks.map(t => ({ id: t.id, type: 'task' }))
    ]

    for (const entity of entities) {
      // Each entity gets 1-3 folder locations
      const numLocations = randomInt(1, 3)
      const selectedFolders = faker.helpers.arrayElements(this.folders, numLocations)
      
      selectedFolders.forEach((folder, index) => {
        locations.push({
          id: generateId(),
          entity_id: entity.id,
          entity_type: entity.type,
          folder_id: folder.id,
          is_primary: index === 0, // First folder is primary
          added_at: new Date().toISOString(),
          added_by: randomChoice(this.users).id
        })
      })
    }

    return locations
  }

  async generateStageHistory(): Promise<any[]> {
    console.log('📈 Generating stage history...')
    
    const history = []

    for (const track of this.playerTracks) {
      const stages = ['nda', 'analysis', 'proposal', 'negotiation', 'closing']
      const currentStageIndex = stages.indexOf(track.current_stage)
      
      let enteredAt = new Date(track.created_at)
      
      // Generate history for completed stages
      for (let i = 0; i <= currentStageIndex; i++) {
        const stage = stages[i]
        const duration = randomInt(24, 168) // 1-7 days in hours
        const exitedAt = i === currentStageIndex ? null : new Date(enteredAt.getTime() + duration * 60 * 60 * 1000)
        
        history.push({
          id: generateId(),
          player_track_id: track.id,
          stage,
          entered_at: enteredAt.toISOString(),
          exited_at: exitedAt?.toISOString() || null,
          duration_hours: exitedAt ? duration : null
        })

        if (exitedAt) {
          enteredAt = exitedAt
        }
      }
    }

    return history
  }

  async generateCustomFields(): Promise<{ definitions: any[], values: any[] }> {
    console.log('🔧 Generating custom fields...')
    
    const definitions = []
    const values = []
    const adminUser = this.users.find(u => u.role === 'admin')

    const fieldTemplates = [
      { name: 'Industry Sector', type: 'select', entity: 'deal', options: ['Technology', 'Healthcare', 'Finance', 'Manufacturing'] },
      { name: 'Deal Source', type: 'select', entity: 'deal', options: ['Referral', 'Cold Outreach', 'Existing Client', 'Partner'] },
      { name: 'Risk Level', type: 'select', entity: 'track', options: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'Synergy Value', type: 'number', entity: 'deal' },
      { name: 'Key Contact', type: 'text', entity: 'track' },
      { name: 'Regulatory Concerns', type: 'textarea', entity: 'deal' },
      { name: 'Competition Level', type: 'select', entity: 'track', options: ['None', 'Low', 'Medium', 'High'] },
      { name: 'Strategic Fit', type: 'select', entity: 'deal', options: ['Excellent', 'Good', 'Fair', 'Poor'] }
    ]

    fieldTemplates.forEach((template, index) => {
      const definition = {
        id: generateId(),
        name: template.name,
        key: template.name.toLowerCase().replace(/\s+/g, '_'),
        type: template.type,
        entity_type: template.entity,
        required: randomBool(0.3),
        options: template.options || null,
        default_value: null,
        placeholder: `Enter ${template.name.toLowerCase()}`,
        help_text: faker.lorem.sentence(),
        position: index,
        created_at: new Date().toISOString(),
        created_by: adminUser.id
      }

      definitions.push(definition)

      // Generate values for some entities
      const entities = template.entity === 'deal' ? this.masterDeals : this.playerTracks
      
      entities.forEach(entity => {
        if (randomBool(0.7)) { // 70% chance of having a value
          let value
          
          switch (template.type) {
            case 'select':
              value = randomChoice(template.options!)
              break
            case 'number':
              value = randomInt(1000000, 50000000)
              break
            case 'text':
              value = faker.person.fullName()
              break
            case 'textarea':
              value = faker.lorem.paragraph()
              break
            default:
              value = faker.lorem.words(3)
          }

          values.push({
            id: generateId(),
            field_definition_id: definition.id,
            entity_id: entity.id,
            entity_type: template.entity,
            value,
            updated_at: new Date().toISOString(),
            updated_by: randomChoice(this.users).id
          })
        }
      })
    })

    return { definitions, values }
  }

  async clearExistingData(): Promise<void> {
    console.log('🧹 Clearing existing data...')
    
    const tables = [
      'custom_field_values',
      'custom_field_definitions', 
      'entity_locations',
      'stage_history',
      'notifications',
      'comments',
      'tasks',
      'player_tracks',
      'master_deals',
      'folders',
      'pipeline_stages',
      'users'
    ]

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().neq('id', 'impossible-id')
      if (error) {
        console.warn(`Warning: Could not clear ${table}:`, error.message)
      }
    }
  }

  async insertData(tableName: string, data: any[]): Promise<void> {
    if (data.length === 0) return

    console.log(`📝 Inserting ${data.length} records into ${tableName}...`)
    
    // Insert in batches to avoid payload limits
    const batchSize = 100
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      const { error } = await supabase.from(tableName).insert(batch)
      
      if (error) {
        console.error(`Error inserting into ${tableName}:`, error)
        throw error
      }
    }
  }

  async generateAll(): Promise<void> {
    try {
      console.log('🚀 Starting synthetic data generation for PipeDesk...\n')

      // Clear existing data
      await this.clearExistingData()

      // Generate all data
      const users = await this.generateUsers()
      const pipelineStages = await this.generatePipelineStages()
      const folders = await this.generateFolders()
      const masterDeals = await this.generateMasterDeals()
      const playerTracks = await this.generatePlayerTracks()
      const tasks = await this.generateTasks()
      const comments = await this.generateComments()
      const notifications = await this.generateNotifications()
      const entityLocations = await this.generateEntityLocations()
      const stageHistory = await this.generateStageHistory()
      const { definitions, values } = await this.generateCustomFields()

      // Insert data in correct order (respecting foreign keys)
      await this.insertData('users', users)
      await this.insertData('pipeline_stages', pipelineStages)
      await this.insertData('folders', folders)
      await this.insertData('master_deals', masterDeals)
      await this.insertData('player_tracks', playerTracks)
      await this.insertData('tasks', tasks)
      await this.insertData('comments', comments)
      await this.insertData('notifications', notifications)
      await this.insertData('entity_locations', entityLocations)
      await this.insertData('stage_history', stageHistory)
      await this.insertData('custom_field_definitions', definitions)
      await this.insertData('custom_field_values', values)

      console.log('\n✅ Synthetic data generation completed successfully!')
      console.log('\n📊 Generated:')
      console.log(`   👥 ${users.length} users`)
      console.log(`   💼 ${masterDeals.length} master deals`)
      console.log(`   🎯 ${playerTracks.length} player tracks`)
      console.log(`   ✅ ${tasks.length} tasks`)
      console.log(`   💬 ${comments.length} comments`)
      console.log(`   🔔 ${notifications.length} notifications`)
      console.log(`   📁 ${folders.length} folders`)
      console.log(`   📍 ${entityLocations.length} entity locations`)
      console.log(`   📈 ${stageHistory.length} stage history records`)
      console.log(`   🔧 ${definitions.length} custom field definitions`)
      console.log(`   📝 ${values.length} custom field values`)

    } catch (error) {
      console.error('❌ Error generating synthetic data:', error)
      process.exit(1)
    }
  }
}

// Run the generator
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new SyntheticDataGenerator()
  generator.generateAll().then(() => {
    console.log('\n🎉 Ready to explore PipeDesk with realistic data!')
    process.exit(0)
  }).catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
}

export default SyntheticDataGenerator