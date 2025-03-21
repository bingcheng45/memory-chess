'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex min-h-[200px] w-full flex-col items-center justify-center rounded-lg bg-red-900/10 p-4 text-center">
          <h2 className="mb-2 text-lg font-semibold text-red-500">Something went wrong</h2>
          <p className="mb-4 text-sm text-gray-400">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button
            onClick={this.resetError}
            variant="destructive"
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 