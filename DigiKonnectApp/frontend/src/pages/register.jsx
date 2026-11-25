import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  // Store registration form values.
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Store messages and loading state.
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Used to redirect the user after successful registration.
  const navigate = useNavigate();

  // Handle registration form submission.
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    // Validate that passwords match.
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Validate minimum password length.
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      // Send registration details to the ASP.NET Core API.
      const response = await fetch("https://localhost:7226/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password: password,
        }),
      });

      // Read the API response safely.
      const responseText = await response.text();

      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText };
      }

      // Handle unsuccessful API responses.
      if (!response.ok) {
        console.error("Registration API error:", data);

        // Handle ASP.NET Core validation errors.
        if (data.errors) {
          const validationMessages = Object.values(data.errors)
            .flat()
            .join(" ");

          throw new Error(validationMessages);
        }

        throw new Error(
          data.message ||
            data.title ||
            "Registration failed. Please check your details.",
        );
      }

      // Display successful registration message.
      setSuccess("Registration successful! Redirecting to login...");

      // Clear the form.
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Redirect to login after 2 seconds.
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err.message ||
          "Unable to register. Check that the backend API is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        {/* DigiKonect branding */}
        <div className="brand login-brand">
          <span className="brand-mark">DK</span>

          <span>
            DigiKonect
            <small>FIELD SERVICE</small>
          </span>
        </div>

        <p className="eyebrow">WORK MANAGEMENT PORTAL</p>

        <h1>Create an account</h1>

        <p className="muted">Register to access your field service work.</p>

        {/* Full name */}
        <label>
          Full name
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            required
          />
        </label>

        {/* Email address */}
        <label>
          Email address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
          />
        </label>

        {/* Password */}
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            minLength={8}
            required
          />
        </label>

        {/* Confirm password */}
        <label>
          Confirm password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            minLength={8}
            required
          />
        </label>

        {/* Error message */}
        {error && <p className="error-message">{error}</p>}

        {/* Success message */}
        {success && <p className="success-message">{success}</p>}

        {/* Register button */}
        <button type="submit" className="primary full" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>

        {/* Navigate back to login */}
        <p className="register-prompt">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
