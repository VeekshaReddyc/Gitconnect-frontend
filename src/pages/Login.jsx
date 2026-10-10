import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      console.log("Attempting login...");

      const response = await fetch(
        "https://gigconnect-backend-in1g.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      console.log("Login HTTP status:", response.status);
      console.log("Login response:", {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        message: data.message,
      });

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Login failed."
        );
      }

      if (!data.id || !data.email || !data.role) {
        throw new Error(
          data.message ||
            "Login response is missing the required user details."
        );
      }

      // Save the logged-in user.
      localStorage.setItem("user", JSON.stringify(data));

      console.log(
        "Saved user:",
        localStorage.getItem("user")
      );

      // Confirm successful login while debugging.
      alert("Login successful! Opening your dashboard...");

      // Navigate to the dashboard.
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <aside className="auth-showcase">
          <Link to="/" className="auth-brand">
            <span className="auth-brand-icon">G</span>
            Gig<span className="auth-brand-highlight">Connect</span>
          </Link>

          <div className="auth-showcase-content">
            <span className="auth-eyebrow">
              YOUR NEXT CHAPTER STARTS HERE
            </span>

            <h1>
              Great work
              <br />
              starts with
              <br />
              <span>the right connection.</span>
            </h1>

            <p>
              Find exciting projects, meet talented people,
              and turn your skills into opportunities.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature">
                <span className="auth-feature-check">✓</span>
                <span>Discover opportunities that fit your skills</span>
              </div>

              <div className="auth-feature">
                <span className="auth-feature-check">✓</span>
                <span>Connect with clients and freelancers</span>
              </div>

              <div className="auth-feature">
                <span className="auth-feature-check">✓</span>
                <span>Build something meaningful together</span>
              </div>
            </div>
          </div>

          <div className="auth-showcase-footer">
            <span>Built for people who make things happen.</span>
            <span>© 2026 GigConnect</span>
          </div>

          <div className="auth-decoration auth-decoration-one" />
          <div className="auth-decoration auth-decoration-two" />
        </aside>

        <section className="auth-form-side">
          <div className="auth-mobile-brand">
            <Link to="/" className="auth-brand">
              <span className="auth-brand-icon">G</span>
              Gig<span className="auth-brand-highlight">Connect</span>
            </Link>
          </div>

          <div className="auth-form-container">
            <div className="auth-form-heading">
              <span className="auth-form-eyebrow">
                WELCOME BACK
              </span>

              <h2>Good to see you again.</h2>

              <p>
                Enter your details to sign in to your account.
              </p>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="login-email">
                  Email address
                </label>

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="login-password">
                  Password
                </label>

                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading ? (
                  "Signing you in..."
                ) : (
                  <>
                    Sign in to your account
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>NEW TO GIGCONNECT?</span>
            </div>

            <p className="auth-bottom-text">
              Don't have an account?{" "}
              <Link to="/register">Create one</Link>
            </p>

            <p className="auth-privacy-note">
              Your next opportunity could be one connection away.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

export default Login;