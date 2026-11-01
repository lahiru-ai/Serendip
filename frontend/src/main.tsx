// Language: TypeScript (React JSX / TSX)
// Purpose: Application bootstrap file; finds the DOM '#root' element and initializes the React virtual DOM tree in StrictMode.
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Mounts the React application to the DOM root element
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
