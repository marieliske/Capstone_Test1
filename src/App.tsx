import React from 'react';
import { TodoApp } from './components/TodoApp';

/**
 * Application entry point component.
 * Renders the root `TodoApp` inside a React strict-mode boundary.
 */
const App: React.FC = () => {
  return <TodoApp />;
};

export default App;
