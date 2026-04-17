import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';
import { initSentry, captureMessage } from './services/sentry';

// Inicializa o Sentry ANTES do React.
// Captura erros no boot, incluindo falhas de chunks (lazy load).
// FAIL-SAFE: se falhar, o app continua normalmente.
initSentry();

// ─── SMOKE TEST (REMOVER APÓS CONFIRMAR NO DASHBOARD) ────────
// Dispara UMA vez por sessão para validar que o Sentry está ativo.
// Verifique no painel: Issues → "SMOKE_TEST" com environment=production.
try {
  if (!sessionStorage.getItem('sentry_smoke_done')) {
    sessionStorage.setItem('sentry_smoke_done', '1');
    captureMessage('SMOKE_TEST: Sentry ativo — feiraodaorca@1.1.9', 'info');
    console.info('[Sentry] Smoke test enviado. Verifique o dashboard.');
  }
} catch { /* FAIL-SAFE */ }
// ─────────────────────────────────────────────────────────────

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);