import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

const container = document.getElementById('root');
if (container === null) throw new Error('App: #root ausente no index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
