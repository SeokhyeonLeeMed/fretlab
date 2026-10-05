/**
 * ErrorBoundary.tsx — a rendering failure must not take the page down.
 *
 * It also offers to clear the stored settings, because a corrupt or
 * incompatible persisted value is the most likely way this app could fail to
 * render at all.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Kept on the console for anyone debugging a deployed copy.
    console.error('FretLab failed to render:', error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="crash card" role="alert">
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>FretLab ran into a problem</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Something in the interface failed to render. The details are in your browser console.
        </p>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            background: 'var(--bg-sunken)',
            padding: 12,
            borderRadius: 8,
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          {error.message}
        </pre>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          <button type="button" className="btn btn-primary" onClick={() => location.reload()}>
            Reload the page
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              try {
                localStorage.removeItem('fretlab.settings.v1');
              } catch {
                /* storage may be blocked; reloading is still worth a try */
              }
              location.reload();
            }}
          >
            Clear saved settings and reload
          </button>
        </div>
      </div>
    );
  }
}
