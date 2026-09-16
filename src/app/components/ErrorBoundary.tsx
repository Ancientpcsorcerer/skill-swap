import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Icon } from './Icon';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  moduleName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="workspace-error-boundary"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '24px',
            width: '100%',
          }}
        >
          <div
            className="aside-error-card"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '36px 28px',
              textAlign: 'center',
              background: 'var(--sw-surface, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--sw-line-standard, #e5e2db)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ marginBottom: '16px', color: 'var(--sw-ink-primary, #141514)' }}>
              <Icon name="gear" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--sw-ink-primary, #141514)' }}>
              {this.props.fallbackTitle || 'Unable to render this view'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--sw-ink-secondary, #64748b)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              A client error occurred while displaying {this.props.moduleName || 'this component'}. You can retry or return to another section.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="primary-button"
                onClick={this.handleRetry}
              >
                Retry
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  window.location.hash = '#/app/connect';
                  window.location.reload();
                }}
              >
                Return to Directory
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
