import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import App from './App.tsx'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ImpersonationProvider } from './contexts/ImpersonationContext.tsx'
import { SystemMetadataProvider } from './contexts/SystemMetadataContext.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { BrandingApplier } from './components/BrandingApplier'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// --- GLOBAL ERROR HANDLERS ---
window.onerror = (message, source, lineno, colno, error) => {
  console.error('[Global Error]', { message, source, lineno, colno, error });
  // Prevent default handler if needed, but usually we want to let it propagate to console
  return false;
};

window.onunhandledrejection = (event) => {
  console.warn('[Unhandled Rejection]', event.reason);
  // Prevent app crash on unhandled promise rejections (though browsers usually don't crash the whole page)
  event.preventDefault();
};

// --- SERVICE WORKER CLEANUP ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

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
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system">
          <AuthProvider>
            <ImpersonationProvider>
              <SystemMetadataProvider>
                <BrandingApplier />
                <App />
                <ReactQueryDevtools initialIsOpen={false} />
              </SystemMetadataProvider>
            </ImpersonationProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </GlobalErrorBoundary>
)