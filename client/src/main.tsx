import { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CRITICAL APPLICATION ERROR]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '540px',
            background: '#1e293b',
            padding: '32px',
            borderRadius: '16px',
            border: '1px solid #334155',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <img src="/images/sairam-seal.png" alt="Sairam Seal" style={{ width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '50%' }} />
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', margin: '0 0 8px' }}>
              Sri Sairam College of Engineering
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 20px' }}>
              Campus Facilities &amp; Booking Portal
            </p>
            <div style={{
              background: '#090d16',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: '#f87171',
              textAlign: 'left',
              wordBreak: 'break-word',
              marginBottom: '20px'
            }}>
              {this.state.error?.message || 'An unexpected client runtime error occurred.'}
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              style={{
                backgroundColor: '#d97706',
                color: '#0f172a',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Clear Cache &amp; Reload Portal
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
