import { createContext, useContext, useState } from 'react'; // React tools for shared login state.
import api from '../services/api'; // Configured API client.

const AuthContext = createContext(null); // Creates a context shared by all pages.

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null')); // Restore user after refresh.

  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password }); // Send credentials to ASP.NET.
    localStorage.setItem('token', response.data.token); // Save token for subsequent API requests.
    localStorage.setItem('user', JSON.stringify(response.data.user)); // Save safe profile details for the UI.
    setUser(response.data.user); // Update React state so protected pages render.
    return response.data.user; // Return role so the login page can navigate correctly.
  }

  function logout() {
    localStorage.removeItem('token'); // Remove the authentication token.
    localStorage.removeItem('user'); // Remove the saved profile.
    setUser(null); // Return the interface to the signed-out state.
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>; // Make auth methods available.
}

export function useAuth() { return useContext(AuthContext); } // Small helper hook for reading authentication state.
