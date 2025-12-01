import { User } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Database, 
  MagicWand, 
  ShieldCheck, 
  Gear
} from '@phosphor-icons/react'

// Componentes das Abas
import MagicLinksPanel from './MagicLinksPanel'
import AuthSettingsPanel from './AuthSettingsPanel'

export default function RBACDemo({ currentUser }: { currentUser: User }) {
  
  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
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

            <TabsTrigger 
                value="synthetic" 
                className="py-3 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2"
            >
                <Database size={18} /> Ambiente de Teste
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

        {/* ABA 3: DADOS SINTÉTICOS */}
        <TabsContent value="synthetic" className="animate-in fade-in-50 focus-visible:outline-none">
            <div className="max-w-4xl p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                <Database className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Recurso Movido</h3>
                <p>O gerador de dados sintéticos foi movido para uma área administrativa dedicada.</p>
            </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}