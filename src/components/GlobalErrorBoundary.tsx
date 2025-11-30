import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Here we could send to Sentry/LogRocket in the future
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-4xl font-bold text-destructive">Ops!</h1>
            <h2 className="text-xl font-semibold">Ocorreu um erro inesperado.</h2>
            <p className="text-muted-foreground">
              Não se preocupe, seus dados estão seguros. Por favor, tente recarregar a página.
            </p>
            {this.state.error && (
              <pre className="bg-muted p-2 rounded text-xs text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="pt-4">
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Recarregar Aplicação
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
