import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: any): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private parseError(error: any) {
    try {
      if (error && typeof error.message === 'string') {
        return JSON.parse(error.message);
      }
    } catch (e) {
      // Not a JSON error
    }
    return null;
  }

  public render() {
    if (this.state.hasError) {
      const errorData = this.parseError(this.state.error);
      const isIndexError = errorData?.error?.includes('index');
      const indexUrl = errorData?.error?.match(/https:\/\/console\.firebase\.google\.com[^\s"]+/)?.[0];

      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card rounded-[2.5rem] p-10 border border-primary/10 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto text-red-500">
              <AlertCircle size={40} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-heading text-primary">
                {isIndexError ? 'Database Index Required' : 'Something went wrong'}
              </h2>
              <p className="text-text/60 text-sm leading-relaxed">
                {isIndexError 
                  ? 'This view requires a database index to be created in the Firebase Console before it can display data.'
                  : 'An unexpected error occurred. Please try refreshing the page.'}
              </p>
            </div>

            {isIndexError && indexUrl && (
              <a 
                href={indexUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-primary text-bg py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg"
              >
                <ExternalLink size={18} />
                Create Missing Index
              </a>
            )}

            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full bg-zinc-100 text-zinc-900 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
            >
              <RefreshCw size={18} />
              Refresh Page
            </button>

            {!isIndexError && (
              <p className="text-[10px] text-text/30 font-mono break-all pt-4">
                {String(this.state.error)}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
