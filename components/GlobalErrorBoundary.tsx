import React, { Component, ErrorInfo, ReactNode } from 'react';
import { captureError } from '../services/sentry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GlobalErrorBoundary caught an error:', error, errorInfo);
    try {
      captureError(error, { tags: { boundary: 'global' }, extra: { errorInfo } });
    } catch (e) {
      console.error('Failed to capture error in GlobalErrorBoundary:', e);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif', color: '#333' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Ops! Algo deu errado.</h2>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Ocorreu um erro inesperado. Nossa equipe já foi notificada.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#0056b3', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Recarregar Aplicativo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
