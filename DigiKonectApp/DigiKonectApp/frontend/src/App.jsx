import { Navigate, Route, Routes } from 'react-router-dom'; // Defines URL-to-page mapping.
import { useAuth } from './context/AuthContext'; // Checks whether a user is signed in.
import Layout from './components/Layout'; // Shared navigation and page frame.
import Login from './pages/Login'; // Sign-in screen.
import Dashboard from './pages/Dashboard'; // Administrator statistics screen.
import Jobs from './pages/Jobs'; // Administrator and technician job screen.

function Protected({ children }) {
  const { user } = useAuth(); // Read authentication state.
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />; // Redirect guests to login.
}

export default function App() {
  const { user } = useAuth(); // Used to redirect signed-in users away from login.
  return <Routes>
    <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
    <Route path="/" element={<Protected><Dashboard /></Protected>} />
    <Route path="/jobs" element={<Protected><Jobs /></Protected>} />
    <Route path="*" element={<Navigate to="/" replace />} /> {/* Unknown URLs return to the home page. */}
  </Routes>;
}
