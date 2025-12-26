import { UnifiedLayout } from '@/components/UnifiedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { StandardPageLayout } from '@/components/layouts';

export default function UnifiedLayoutTest() {
  return (
    <TooltipProvider>
      <UnifiedLayout
        activeSection="profile"
        activeItem="personal"
        title="Dados Pessoais"
        description="Gerencie suas informações pessoais e documentos"
      >
        <StandardPageLayout>
          <Card>
            <CardHeader>
              <CardTitle>Teste do UnifiedLayout</CardTitle>
              <CardDescription>
                Este é um exemplo de uso do componente UnifiedLayout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                O UnifiedLayout combina a UnifiedSidebar com uma área de conteúdo 
                que inclui breadcrumbs automáticos e um header opcional.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Breadcrumbs automáticos baseados na rota</li>
                <li>Sidebar unificada com navegação</li>
                <li>ScrollArea para conteúdo longo</li>
                <li>Header opcional com título e descrição</li>
                <li>Breadcrumbs opcionais (podem ser desativados)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teste de Scroll</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} className="p-4 bg-muted rounded-lg">
                    <p className="font-medium">Item {i + 1}</p>
                    <p className="text-sm text-muted-foreground">
                      Este é um item de teste para verificar o scroll
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </StandardPageLayout>
      </UnifiedLayout>
    </TooltipProvider>
  );
}
