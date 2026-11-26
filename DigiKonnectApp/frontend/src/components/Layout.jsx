import { Link, useNavigate } from "react-router-dom"; // Link changes pages without a full browser reload.
import { useAuth } from "../context/AuthContext"; // Reads the signed-in user and logout function.

export default function Layout({ children }) {
  const { user, logout } = useAuth(); // Get current account information.
  const navigate = useNavigate(); // Programmatic navigation after logout.
  function handleLogout() {
    logout();
    navigate("/login");
  } // Clear session and show login page.

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">DK</span>
          <span>
            DigiKonect<small>FIELD SERVICE</small>
          </span>
        </div>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/jobs">Jobs</Link>
        </nav>
        <div className="sidebar-user">
          <strong>{user?.fullName}</strong>
          <small>{user?.role}</small>
          <button className="logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>{" "}
      {/* The active page is inserted here. */}
    </div>
  );
}
