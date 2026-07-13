import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, Home, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background text-foreground p-6">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-[20px] flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_4px_24px_rgba(239,68,68,0.15)]">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
              <p className="text-muted-foreground mb-8">
                An unexpected error occurred. Our team has been notified.
              </p>
              
              <div className="flex flex-row gap-3 w-full mt-2">
                <button 
                  onClick={() => window.location.reload()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-red-500/10 text-red-500 font-bold border border-red-500/20 hover:bg-red-500/20 active:scale-[0.97] transition-all"
                >
                  <RotateCcw className="w-4 h-4" /> Try Again
                </button>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-surface-interactive text-foreground font-bold border border-border hover:bg-surface-interactive/80 active:scale-[0.97] transition-all"
                >
                  <Home className="w-4 h-4" /> Go Home
                </button>
              </div>
            </div>
            
            {this.state.error && (
              <div className="border-t border-border bg-muted/30 p-4">
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium mb-2 hover:text-foreground transition-colors">Error Details</summary>
                  <div className="mt-2 overflow-auto max-h-48 p-3 bg-background rounded-lg border border-border font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-words">
                    {this.state.error.toString()}
                    {'\n'}
                    {this.state.errorInfo?.componentStack}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
