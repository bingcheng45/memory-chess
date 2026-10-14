'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import '@/components/lab-paper/lab-message.css';

interface Props {
  children: ReactNode;
  /** Shown in place of the children after an error; null shows nothing. Without it the boundary draws its own message. */
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
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }
      
      return <BoundaryMessage onRetry={this.resetError} />;
    }

    return this.props.children;
  }
}

/** The boundary's own message, in place of the part of a Lab Paper page that failed: the error page's copy, smaller. */
function BoundaryMessage({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('errorPages');

  return (
    <section role="alert" className="lab-card lab-boundary">
      <h2 className="lab-boundary-h">{t('error.heading')}</h2>
      <p className="lab-boundary-text">{t('error.body')}</p>
      <div className="lab-message-actions">
        <button type="button" className="lab-btn lab-btn-primary" onClick={onRetry}>
          {t('error.retry')}
        </button>
        <Link href="/" className="lab-btn lab-btn-secondary">
          {t('home')}
        </Link>
      </div>
    </section>
  );
}

export default ErrorBoundary; 