import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';
import { initSentry, captureError } from './services/sentry';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

// Inicializa o Sentry ANTES do React.
// Captura erros no boot, incluindo falhas de chunks (lazy load).
// FAIL-SAFE: se falhar, o app continua normalmente.
initSentry();

// --- HARDENING: Window Error Handlers Globais ---
window.addEventListener('error', (event) => {
  try {
    captureError(event.error || new Error(event.message), { tags: { source: 'window.onerror' } });
  } catch (e) {
    // Ignora silenciosamente se o Sentry falhar
  }
  // Não prevenimos o default para não quebrar comportamento padrão do browser
});

window.addEventListener('unhandledrejection', (event) => {
  try {
    captureError(event.reason || new Error('Unhandled Promise Rejection'), { tags: { source: 'unhandledrejection' } });
  } catch (e) {
    // Ignora silenciosamente
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);