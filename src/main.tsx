import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import "@github/spark/spark"

import Router from './Router.tsx'
import App from './App.tsx'
import ErrorFallback from './ErrorFallback.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ImpersonationProvider } from './contexts/ImpersonationContext.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

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
      <AuthProvider>
        <ImpersonationProvider>
          <App />
          <ReactQueryDevtools initialIsOpen={false} />
        </ImpersonationProvider>
      </AuthProvider>
    </QueryClientProvider>
    <AuthProvider>
      <ImpersonationProvider>
        <Router />
      </ImpersonationProvider>
    </AuthProvider>
  </ErrorBoundary>
)
