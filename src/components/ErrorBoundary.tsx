import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component to catch JavaScript errors in child components
 * Prevents the entire app from crashing and shows a user-friendly message
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-void-900 p-4">
          <div className="max-w-md w-full bg-void-800 rounded-2xl p-8 text-center border border-void-700">
            <div className="text-6xl mb-4">😵</div>
            <h1 className="text-2xl font-bold text-void-100 mb-2">
              Something went wrong
            </h1>
            <p className="text-void-400 mb-6">
              The app encountered an unexpected error. Try refreshing or click retry below.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-void-500 cursor-pointer hover:text-void-300 transition-colors">
                  Technical details
                </summary>
                <pre className="mt-2 p-3 bg-void-900 rounded-lg text-xs text-danger overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-2 bg-ember-600 hover:bg-ember-500 text-white rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-void-700 hover:bg-void-600 text-void-200 rounded-lg font-medium transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
