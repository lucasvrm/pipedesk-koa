import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import App from './App.tsx'
import ErrorFallback from './ErrorFallback.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ImpersonationProvider } from './contexts/ImpersonationContext.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// --- CORREÇÃO CRÍTICA: REMOVEDOR DE SERVICE WORKER ---
// Remove quaisquer service workers antigos (do Spark ou versões anteriores)
// que possam estar interceptando requisições e travando o app.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      console.log('Unregistering Service Worker:', registration);
      registration.unregister();
    }
  });
}
// -----------------------------------------------------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ImpersonationProvider>
            <App />
            <ReactQueryDevtools initialIsOpen={false} />
          </ImpersonationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
)