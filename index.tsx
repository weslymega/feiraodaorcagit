import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';
import { initSentry } from './services/sentry';

// Inicializa o Sentry ANTES do React.
// Captura erros no boot, incluindo falhas de chunks (lazy load).
// FAIL-SAFE: se falhar, o app continua normalmente.
initSentry();

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