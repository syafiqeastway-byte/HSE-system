import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as unknown as {
  new (props: Props): {
    props: Props;
    state: State;
    setState: (state: Partial<State> | ((prevState: State) => Partial<State>)) => void;
    render(): ReactNode;
  };
}) {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-amber-600 text-3xl">warning</span>
            <h3 className="text-base font-bold">
              {this.props.fallbackTitle || 'Paparan data sedang dipulihkan (Recovering dashboard view)'}
            </h3>
          </div>
          <p className="text-xs mb-4 opacity-90">
            {this.state.error?.message || 'Sistem menemui masalah kecil ketika memaparkan komponen ini.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Muat Semula Komponen (Reload Component)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
