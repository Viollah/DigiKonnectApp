import { useState } from "react"; // Holds form values and feedback messages.
import { useNavigate, Link } from "react-router-dom"; // Sends users to their role-specific home page.
import { useAuth } from "../context/AuthContext"; // Uses the shared login method.

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Displays login errors returned by the API.
  const [loading, setLoading] = useState(false); // Prevents repeated submissions while waiting.
  const { login } = useAuth(); // Gets login from the authentication context.
  const navigate = useNavigate(); // Redirects after a successful login.

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true); // Stop browser refresh and reset old error.
    try {
      const account = await login(email, password);
      navigate(account.role === "Administrator" ? "/" : "/jobs");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to sign in. Check that the API is running.",
      );
    } finally {
      setLoading(false);
    } // Always re-enable the button after the request finishes.
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="brand login-brand">
          <span className="brand-mark">DK</span>
          <span>
            DigiKonect<small>FIELD SERVICE</small>
          </span>
        </div>
        <p className="eyebrow">WORK MANAGEMENT PORTAL</p>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to manage your field service work.</p>
        <label>
          Email address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error-message">{error}</p>}
        <button className="primary full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="register-prompt">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
        {/* <div className="demo-credentials">
          <strong>Demo accounts</strong>
          <span>Admin: admin@digikonect.local / Admin123!</span>
          <span>Technician: tech@digikonect.local / Tech123!</span>
        </div> */}
      </form>
    </div>
  );
}
