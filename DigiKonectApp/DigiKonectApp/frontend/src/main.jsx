import React from 'react'; // Imports React for JSX rendering.
import ReactDOM from 'react-dom/client'; // Connects React to the browser DOM.
import { BrowserRouter } from 'react-router-dom'; // Enables client-side routing.
import App from './App'; // Main application and route definitions.
import { AuthProvider } from './context/AuthContext'; // Shares login state across pages.
import './styles.css'; // Loads the application styling.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode> {/* Helps identify potential problems during development. */}
    <BrowserRouter> {/* Makes routing available to all child components. */}
      <AuthProvider><App /></AuthProvider> {/* Provides authentication to every page. */}
    </BrowserRouter>
  </React.StrictMode>
);
