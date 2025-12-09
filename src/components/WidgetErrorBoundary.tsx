import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  widgetId: string;
  widgetTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Widget error (${this.props.widgetId}):`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-32 border-2 border-destructive/50 rounded-lg p-4 flex flex-col items-center justify-center bg-destructive/5">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm font-medium text-destructive">Erro ao carregar widget</p>
          <p className="text-xs text-muted-foreground mt-1">
            {this.props.widgetTitle || this.props.widgetId}
          </p>
          {this.state.error && (
            <p className="text-xs text-muted-foreground mt-2 max-w-full truncate">
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
