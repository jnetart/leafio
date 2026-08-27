import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Leafio render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }
    return (
      <div className="flex h-full flex-col bg-[var(--window-bg)] px-8 py-16 font-ui text-[var(--text)]">
        <p className="text-[15px] font-semibold">Leafio</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{this.state.error.message}</p>
      </div>
    );
  }
}
