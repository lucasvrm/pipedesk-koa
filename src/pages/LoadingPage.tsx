// Path: src/pages/LoadingPage.tsx
import { Loader2 } from 'lucide-react';

/**
 * Componente de página de carregamento minimalista.
 * Exibido enquanto os dados de autenticação e inicialização da aplicação são resolvidos.
 */
const LoadingPage = () => {
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-base font-medium">Carregando aplicação...</p>
    </div>
  );
};

export default LoadingPage;