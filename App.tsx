import React from 'react';
import { AppRouter } from './components/AppRouter';
import { useAppState } from './hooks/useAppState';
import { useAppActions } from './hooks/useAppActions';
import { AppLoadingOverlay } from './components/AppLoadingOverlay';

const App: React.FC = () => {
  const state = useAppState();
  const actions = useAppActions(state);

  if (!state.sessionReady) {
    return <AppLoadingOverlay isActive message="Iniciando sessão..." />;
  }

  return <AppRouter state={state} actions={actions} />;
};

export default App;
