
import React from 'react';
import { AppRouter } from './components/AppRouter';
import { useAppState } from './hooks/useAppState';
import { useAppActions } from './hooks/useAppActions';

const App: React.FC = () => {
  const state = useAppState();
  const actions = useAppActions(state);

  return <AppRouter state={state} actions={actions} />;
};

export default App;
