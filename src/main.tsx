import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/manrope';
import './styles/tokens.css';
import './styles/global.css';
import './styles/landing.css';
import './styles/dialog.css';
import './styles/frame.css';
import './styles/core.css';
import { ApplicationRoot } from './app/ApplicationRoot';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><ApplicationRoot /></React.StrictMode>,
);

