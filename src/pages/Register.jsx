import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "FREELANCER",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8081/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Registration failed."
        );
      }

      navigate("/login");
    } catch (err) {
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
              MAKE YOUR NEXT MOVE
            </span>

            <h1>
              Your talent
              <br />
              deserves a
              <br />
              <span>bigger stage.</span>
            </h1>

            <p>
              Join a growing community where skills meet
              opportunities and good work finds the right people.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature">
                <span className="auth-feature-check">✓</span>
                <span>Showcase your skills and expertise</span>
              </div>

              <div className="auth-feature">
                <span className="auth-feature-check">✓</span>
                <span>Find projects or discover talent</span>
              </div>

              <div className="auth-feature">
                <span className="auth-feature-check">✓</span>
                <span>Start building professional connections</span>
              </div>
            </div>
          </div>

          <div className="auth-showcase-footer">
            <span>One community. Endless possibilities.</span>
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

          <div className="auth-form-container register-form-container">
            <div className="auth-form-heading">
              <span className="auth-form-eyebrow">
                JOIN GIGCONNECT
              </span>

              <h2>Create your account.</h2>

              <p>
                A few details are all you need to get started.
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
                <label htmlFor="register-name">
                  Full name
                </label>

                <input
                  id="register-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="register-email">
                  Email address
                </label>

                <input
                  id="register-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="register-password">
                  Password
                </label>

                <input
                  id="register-password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                />
              </div>

              <fieldset className="auth-role-field">
                <legend>I want to join as</legend>

                <div className="auth-role-options">
                  <label
                    className={`auth-role-option ${
                      form.role === "FREELANCER" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="FREELANCER"
                      checked={form.role === "FREELANCER"}
                      onChange={handleChange}
                    />

                    <span className="auth-role-icon">✦</span>

                    <span className="auth-role-copy">
                      <strong>Freelancer</strong>
                      <small>Find projects</small>
                    </span>

                    <span className="auth-role-radio" />
                  </label>

                  <label
                    className={`auth-role-option ${
                      form.role === "CLIENT" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="CLIENT"
                      checked={form.role === "CLIENT"}
                      onChange={handleChange}
                    />

                    <span className="auth-role-icon">◇</span>

                    <span className="auth-role-copy">
                      <strong>Client</strong>
                      <small>Hire talent</small>
                    </span>

                    <span className="auth-role-radio" />
                  </label>
                </div>
              </fieldset>

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading ? (
                  "Creating your account..."
                ) : (
                  <>
                    Create your account
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>ALREADY A MEMBER?</span>
            </div>

            <p className="auth-bottom-text">
              Already have an account?{" "}
              <Link to="/login">Sign in</Link>
            </p>

            <p className="auth-privacy-note">
              By joining, you agree to use GigConnect respectfully.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

export default Register;