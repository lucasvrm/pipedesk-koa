import { useState } from 'react'
import { PageContainer } from '@/components/PageContainer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import {
  Database,
  Users,
  Buildings,
  Funnel,
  Kanban,
  Trash,
  Play,
  Warning,
  AddressBook
} from '@phosphor-icons/react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function SyntheticDataAdminPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])

  // Generator inputs
  const [userCount, setUserCount] = useState(3)
  const [companyCount, setCompanyCount] = useState(10)
  const [leadCount, setLeadCount] = useState(10)
  const [dealCount, setDealCount] = useState(5)
  const [contactCount, setContactCount] = useState(15)

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setConsoleLogs(prev => [`[${timestamp}] ${message}`, ...prev])
  }

  const handleGenerateUsers = async () => {
    if (!confirm(`Generate ${userCount} users?`)) return

    setLoading(true)
    log(`Starting user generation (Count: ${userCount})...`)

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-synthetic-users', {
        body: { count: userCount, prefix: 'synth_user' }
      })

      if (error) throw error

      log(`✅ Success! Created: ${data.created_count}`)
      if (data.errors?.length) {
        log(`⚠️ Errors: ${JSON.stringify(data.errors)}`)
      }
      toast.success(`${data.created_count} users created`)
    } catch (err: any) {
      log(`❌ Error: ${err.message}`)
      toast.error('Failed to generate users')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCRM = async (companyStrategy: 'v1' | 'v2') => {
    setLoading(true)
    log(`Starting CRM Data generation (Strategy: ${companyStrategy})...`)
    log(`Inputs: Companies=${companyCount}, Leads=${leadCount}, Deals=${dealCount}, Contacts=${contactCount}`)

    try {
      // 1. Fetch synthetic users to own the data (optional but good practice)
      const { data: syntheticUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_synthetic', true)

      const userIds = syntheticUsers?.map(u => u.id) || []
      log(`Found ${userIds.length} synthetic users to assign as owners.`)

      // 2. Call RPC
      const payload = {
        companies_count: companyCount,
        leads_count: leadCount,
        deals_count: dealCount,
        contacts_count: contactCount,
        users_ids: userIds,
        company_strategy: companyStrategy
      }

      const { data, error } = await supabase.rpc('generate_synthetic_data', { payload })

      if (error) throw error

      log(`✅ Generation Complete!`)
      log(`Companies created: ${data.companies}`)
      log(`Leads created: ${data.leads}`)
      log(`Deals created: ${data.deals}`)
      log(`Contacts created: ${data.contacts}`)

      toast.success('CRM Data generated successfully')
    } catch (err: any) {
      log(`❌ Error: ${err.message}`)
      toast.error('Failed to generate CRM data')
    } finally {
      setLoading(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('DANGER: This will delete ALL synthetic data from the system. Continue?')) return

    setLoading(true)
    log('Starting cleanup...')

    try {
      const { data, error } = await supabase.rpc('clear_synthetic_data')

      if (error) throw error

      log('✅ Cleanup Complete!')
      log(`Deleted Users: ${data.users}`)
      log(`Deleted Companies: ${data.companies}`)
      log(`Deleted Leads: ${data.leads}`)
      log(`Deleted Deals: ${data.deals}`)
      log(`Deleted Contacts: ${data.contacts}`)

      // Check total deleted
      const total = Object.values(data).reduce((a: any, b: any) => a + b, 0)
      if (total === 0) {
        log('ℹ️ No synthetic data found to delete.')
      } else {
        toast.success(`Cleanup finished. Removed ${total} records.`)
      }

    } catch (err: any) {
      log(`❌ Error: ${err.message}`)
      toast.error('Cleanup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="text-primary" />
            Synthetic Data Admin
          </h1>
          <p className="text-muted-foreground mt-1">
            Server-side generation of test data. Deterministic and safe.
          </p>
        </div>

        {/* Main Actions Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* 1. USERS */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} /> Identity (Users)
              </CardTitle>
              <CardDescription>
                Creates Auth users via Edge Function.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Count</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={userCount}
                  onChange={(e) => setUserCount(Number(e.target.value))}
                />
              </div>
              <Button onClick={handleGenerateUsers} disabled={loading} className="w-full">
                Generate Users
              </Button>
            </CardContent>
          </Card>

          {/* 2. CRM DATA */}
          <Card className="border-l-4 border-l-green-500 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Buildings size={20} /> CRM Entities
              </CardTitle>
              <CardDescription>
                Generates Companies, Leads, Deals, Contacts using database RPC.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Buildings /> Companies</Label>
                  <Input type="number" value={companyCount} onChange={(e) => setCompanyCount(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Funnel /> Leads</Label>
                  <Input type="number" value={leadCount} onChange={(e) => setLeadCount(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Kanban /> Deals</Label>
                  <Input type="number" value={dealCount} onChange={(e) => setDealCount(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><AddressBook /> Contacts</Label>
                  <Input type="number" value={contactCount} onChange={(e) => setContactCount(Number(e.target.value))} />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                    variant="outline"
                    onClick={() => handleGenerateCRM('v1')}
                    disabled={loading}
                    className="flex-1 border-dashed"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Generate (Strategy A: Legacy Types)
                </Button>
                <Button
                    onClick={() => handleGenerateCRM('v2')}
                    disabled={loading}
                    className="flex-1"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Generate (Strategy B: New Types)
                </Button>
              </div>

              <Alert className="bg-muted/50 border-none">
                <Warning className="h-4 w-4" />
                <AlertTitle>Strategy Note</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                    Try "Strategy A" first if you are unsure about database constraints.
                    "Strategy B" uses updated relationship types found in documentation.
                </AlertDescription>
              </Alert>

            </CardContent>
          </Card>

          {/* 3. CLEANUP */}
          <Card className="border-l-4 border-l-red-500 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash size={20} /> Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleClearAll} disabled={loading} className="w-full sm:w-auto">
                Clear All Synthetic Data
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* CONSOLE */}
        <Card className="bg-slate-950 text-slate-50 border-slate-800">
            <CardHeader className="py-3 border-b border-slate-800">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    Execution Log
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[300px] overflow-y-auto font-mono text-xs">
                {consoleLogs.length === 0 ? (
                    <div className="p-4 text-slate-500 italic">Ready...</div>
                ) : (
                    <div className="flex flex-col">
                        {consoleLogs.map((log, i) => (
                            <div key={i} className="px-4 py-1 border-b border-slate-800/50 hover:bg-white/5">
                                {log}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>

      </div>
    </PageContainer>
  )
}
