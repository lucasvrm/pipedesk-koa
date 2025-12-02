import { User } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MagicWand,
  ShieldCheck,
  Gear
} from '@phosphor-icons/react'
import { PageContainer } from '@/components/PageContainer'

// Componentes das Abas
import MagicLinksPanel from './MagicLinksPanel'
import AuthSettingsPanel from './AuthSettingsPanel'

export default function RBACDemo({ currentUser }: { currentUser: User }) {

  return (
    <PageContainer className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Gear className="text-primary" />
          Configurações e Ferramentas
        </h1>
        <p className="text-muted-foreground">
          Painel técnico para gestão de ambiente, autenticação e dados.
        </p>
      </div>

      <Tabs defaultValue="auth-settings" className="w-full space-y-6">
        <div className="border-b">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
            <TabsTrigger 
                value="auth-settings" 
                className="py-3 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2"
            >
                <ShieldCheck size={18} /> Políticas de Acesso
            </TabsTrigger>
            
            <TabsTrigger
                value="magic-links"
                className="py-3 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2"
            >
                <MagicWand size={18} /> Links de Acesso
            </TabsTrigger>
            </TabsList>
        </div>

        {/* ABA 1: POLÍTICAS DE ACESSO */}
        <TabsContent value="auth-settings" className="animate-in fade-in-50 focus-visible:outline-none">
            <AuthSettingsPanel />
        </TabsContent>

        {/* ABA 2: MAGIC LINKS */}
        <TabsContent value="magic-links" className="animate-in fade-in-50 focus-visible:outline-none">
            <MagicLinksPanel />
        </TabsContent>

      </Tabs>
    </PageContainer>
  )
}