/**
 * Example Component: Demonstrates how to use the new Supabase hooks
 * 
 * This file shows the migration pattern from useKV to Supabase hooks.
 * You can use this as a reference when migrating existing components.
 */

import { useState } from 'react'
import { useDeals } from '@/features/deals/hooks/useDeals'
import { usePlayerTracks } from '@/features/deals/hooks/usePlayerTracks'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { useAuth } from '@/contexts/AuthContext'
import { MasterDeal, OperationType, DealStatus } from '@/lib/types'

export default function SupabaseExampleComponent() {
  const { user, profile, signInWithMagicLink, signOut, isAuthenticated } = useAuth()
  const { data: deals, loading: dealsLoading, create: createDeal, update: updateDeal } = useDeals()
  const [selectedDealId, setSelectedDealId] = useState<string>()
  const { data: tracks } = usePlayerTracks(selectedDealId)
  const [selectedTrackId, setSelectedTrackId] = useState<string>()
  const { data: tasks, create: createTask } = useTasks(selectedTrackId)

  // Example: Create a new deal
  const handleCreateDeal = async () => {
    if (!profile) return

    const newDeal = await createDeal({
      clientName: 'Example Corp',
      volume: 1000000,
      operationType: 'acquisition' as OperationType,
      status: 'active' as DealStatus,
      observations: 'Created via Supabase',
      createdBy: profile.id,
    })

    if (newDeal) {
      console.log('Deal created:', newDeal)
    }
  }

  // Example: Update a deal
  const handleUpdateDeal = async (dealId: string) => {
    const updated = await updateDeal(dealId, {
      status: 'concluded' as DealStatus,
    })

    if (updated) {
      console.log('Deal updated:', updated)
    }
  }

  // Example: Create a task
  const handleCreateTask = async () => {
    if (!selectedTrackId || !profile) return

    const newTask = await createTask({
      playerTrackId: selectedTrackId,
      title: 'Example Task',
      description: 'Created via Supabase hook',
      assignees: [profile.id],
      completed: false,
      dependencies: [],
      isMilestone: false,
      position: 0,
    })

    if (newTask) {
      console.log('Task created:', newTask)
    }
  }

  // Example: Authentication
  const handleSignIn = async () => {
    const success = await signInWithMagicLink('user@example.com')
    if (success) {
      console.log('Magic link sent!')
    }
  }

  if (dealsLoading) {
    return <div>Loading deals...</div>
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h2>Not authenticated</h2>
        <button onClick={handleSignIn}>Send Magic Link</button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Supabase Integration Example</h2>
        <p>User: {profile?.name} ({profile?.role})</p>
        <button onClick={() => signOut()} className="mt-2 px-4 py-2 bg-red-500 text-white rounded">
          Sign Out
        </button>
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-semibold">Deals ({deals.length})</h3>
        <button onClick={handleCreateDeal} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
          Create Deal
        </button>
        
        <ul className="mt-4 space-y-2">
          {deals.map((deal) => (
            <li key={deal.id} className="border p-2 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <strong>{deal.clientName}</strong> - {deal.status}
                  <button 
                    onClick={() => setSelectedDealId(deal.id)}
                    className="ml-2 text-blue-500 underline"
                  >
                    View Tracks
                  </button>
                </div>
                <button 
                  onClick={() => handleUpdateDeal(deal.id)}
                  className="px-2 py-1 bg-green-500 text-white rounded text-sm"
                >
                  Mark Concluded
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {selectedDealId && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold">Player Tracks ({tracks.length})</h3>
          <ul className="mt-4 space-y-2">
            {tracks.map((track) => (
              <li key={track.id} className="border p-2 rounded">
                <div>
                  <strong>{track.playerName}</strong> - {track.currentStage}
                  <button 
                    onClick={() => setSelectedTrackId(track.id)}
                    className="ml-2 text-blue-500 underline"
                  >
                    View Tasks
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedTrackId && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold">Tasks ({tasks.length})</h3>
          <button onClick={handleCreateTask} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Create Task
          </button>
          
          <ul className="mt-4 space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="border p-2 rounded">
                <strong>{task.title}</strong> - {task.completed ? '✅' : '⏳'}
                <p className="text-sm text-gray-600">{task.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * MIGRATION NOTES:
 * 
 * 1. OLD WAY (useKV):
 *    const [deals, setDeals] = useKV<MasterDeal[]>('masterDeals', [])
 *    setDeals([...deals, newDeal])
 * 
 * 2. NEW WAY (Supabase):
 *    const { data: deals, create } = useDeals()
 *    await create(newDeal)
 * 
 * BENEFITS:
 * - Automatic real-time updates (no manual setDeals needed)
 * - Loading and error states built-in
 * - Type-safe CRUD operations
 * - Data persists across devices
 * - Multi-user collaboration
 * - Server-side validation via RLS
 */
