import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";

const API = "http://localhost:8081/api";

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  });

  const [activeTab, setActiveTab] = useState("personal");
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const role = String(user.role || "USER").toUpperCase();

  const initials = (form.name || user.name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  const passwordRules = [
    {
      label: "At least 8 characters",
      valid: passwords.newPassword.length >= 8,
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(passwords.newPassword),
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(passwords.newPassword),
    },
    {
      label: "One number",
      valid: /\d/.test(passwords.newPassword),
    },
    {
      label: "One special character",
      valid: /[^A-Za-z0-9]/.test(passwords.newPassword),
    },
  ];

  const strongPassword =
    passwords.newPassword.length > 0 &&
    passwordRules.every((rule) => rule.valid);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const handleFormChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handlePasswordChange = (event) => {
    setPasswords({
      ...passwords,
      [event.target.name]: event.target.value,
    });
  };

  const togglePassword = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
  };

  // Read JSON responses safely, including error responses.
  const readResponse = async (response) => {
    const text = await response.text();

    let data = {};

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
          data.error ||
          `Request failed with status ${response.status}`
      );
    }

    return data;
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email) {
      showMessage(
        "error",
        "Please enter your name and email address."
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage("error", "Please enter a valid email address.");
      return;
    }

    if (!user.id) {
      showMessage(
        "error",
        "Your user ID is missing. Please sign in again."
      );
      return;
    }

    setSavingProfile(true);

    try {
      const response = await fetch(
        `${API}/users/${user.id}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email }),
        }
      );

      const responseData = await readResponse(response);

      const updatedUser = {
        ...user,
        id: responseData.id ?? user.id,
        name: responseData.name || name,
        email: responseData.email || email,
        role: responseData.role || user.role,
      };

      setUser(updatedUser);
      setForm({
        name: updatedUser.name,
        email: updatedUser.email,
      });

      localStorage.setItem("user", JSON.stringify(updatedUser));

      showMessage(
        "success",
        "Your profile has been updated successfully."
      );
    } catch (error) {
      console.error("Profile update error:", error);

      showMessage(
        "error",
        error.message ||
          "Unable to save your profile. Check that the backend is running."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (!user.id) {
      showMessage(
        "error",
        "Your user ID is missing. Please sign in again."
      );
      return;
    }

    if (!passwords.currentPassword) {
      showMessage("error", "Enter your current password.");
      return;
    }

    if (!strongPassword) {
      showMessage(
        "error",
        "Your new password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character."
      );
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      showMessage("error", "The new passwords do not match.");
      return;
    }

    if (passwords.currentPassword === passwords.newPassword) {
      showMessage(
        "error",
        "Your new password must be different from your current password."
      );
      return;
    }

    setChangingPassword(true);

    try {
      console.log("Sending password update request for user ID:", user.id);

      const response = await fetch(
        `${API}/users/${user.id}/password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword,
          }),
        }
      );

      const responseData = await readResponse(response);

      console.log("Password update response:", responseData.message);

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      showMessage(
        "success",
        responseData.message || "Your password has been changed successfully."
      );
    } catch (error) {
      console.error("Password update error:", error);

      showMessage(
        "error",
        error.message ||
          "Unable to change your password. Check that the backend is running."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const navigationItems = [
    { label: "Overview", icon: "◫", path: "/dashboard" },
    ...(role === "FREELANCER"
      ? [
          { label: "Browse Gigs", icon: "⌕", path: "/browse-gigs" },
          {
            label: "My Applications",
            icon: "▤",
            path: "/freelancer-my-gigs",
          },
        ]
      : [
          { label: "Create a Gig", icon: "＋", path: "/create-gig" },
          { label: "My Gigs", icon: "▤", path: "/my-gigs" },
        ]),
    { label: "Payments", icon: "◇", path: "/payment-history" },
  ];

  return (
    <div className="gc-profile">
      <aside className="gc-profile-sidebar">
        <Link to="/dashboard" className="gc-profile-brand">
          <span className="gc-brand-symbol">G</span>
          <span>
            <strong>GigConnect</strong>
            <small>WORK WITHOUT LIMITS</small>
          </span>
        </Link>

        <div className="gc-sidebar-label">WORKSPACE</div>

        <nav className="gc-profile-nav">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="gc-profile-nav-link"
            >
              <span className="gc-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              <span className="gc-nav-arrow">›</span>
            </Link>
          ))}

          <div className="gc-sidebar-label gc-sidebar-settings-label">
            PREFERENCES
          </div>

          <button
            type="button"
            className="gc-profile-nav-link active"
            onClick={() => setActiveTab("personal")}
          >
            <span className="gc-nav-icon">⚙</span>
            <span>Settings</span>
            <span className="gc-nav-arrow">›</span>
          </button>
        </nav>

        <div className="gc-sidebar-bottom">
          <div className="gc-sidebar-help">
            <span className="gc-help-icon">✦</span>
            <strong>Need a hand?</strong>
            <p>Manage your account and keep everything up to date.</p>
            <button
              type="button"
              onClick={() =>
                showMessage(
                  "info",
                  "Your account settings are available on this page."
                )
              }
            >
              Explore settings <span>→</span>
            </button>
          </div>

          <button
            type="button"
            className="gc-sidebar-logout"
            onClick={handleLogout}
          >
            <span>↪</span> Sign out
          </button>
        </div>
      </aside>

      <main className="gc-profile-main">
        <header className="gc-profile-topbar">
          <div>
            <div className="gc-breadcrumb">
              Workspace <span>/</span> Settings <span>/</span>{" "}
              <strong>My Profile</strong>
            </div>
            <h1>Account settings</h1>
            <p>Manage your personal details and security preferences.</p>
          </div>

          <div className="gc-topbar-user">
            <div className="gc-topbar-avatar">{initials || "U"}</div>
            <div>
              <strong>{user.name || "Your account"}</strong>
              <span>{role}</span>
            </div>
          </div>
        </header>

        <section className="gc-profile-hero">
          <div className="gc-hero-orb gc-hero-orb-one" />
          <div className="gc-hero-orb gc-hero-orb-two" />

          <div className="gc-hero-content">
            <span className="gc-hero-eyebrow">
              <span className="gc-hero-status-dot" />
              YOUR PERSONAL SPACE
            </span>

            <h2>
              Make your account
              <br />
              feel like <em>you.</em>
            </h2>

            <p>
              Keep your information accurate, protect your account, and make
              your GigConnect experience your own.
            </p>

            <div className="gc-hero-tags">
              <span>
                ✦{" "}
                {role === "FREELANCER"
                  ? "Freelancer"
                  : role === "CLIENT"
                    ? "Client"
                    : "Member"}
              </span>
              <span>◈ Account settings</span>
            </div>
          </div>

          <div className="gc-hero-profile-card">
            <div className="gc-hero-avatar">{initials || "U"}</div>
            <span className="gc-hero-card-label">YOUR ACCOUNT</span>
            <h3>{user.name || "GigConnect Member"}</h3>
            <p>{user.email || "Add your email address"}</p>
            <span className="gc-hero-role">
              <span /> {role}
            </span>
          </div>
        </section>

        <div className="gc-profile-content">
          <div className="gc-profile-section-heading">
            <div>
              <span className="gc-section-kicker">PERSONALISE</span>
              <h2>Your profile</h2>
              <p>Everything you need to manage your account in one place.</p>
            </div>

            <div className="gc-profile-completion">
              <div className="gc-completion-icon">✓</div>
              <div>
                <strong>Account overview</strong>
                <span>Your account details at a glance</span>
              </div>
            </div>
          </div>

          {message.text && (
            <div
              className={`gc-profile-message ${message.type}`}
              role="status"
            >
              <span>
                {message.type === "success"
                  ? "✓"
                  : message.type === "error"
                    ? "!"
                    : "i"}
              </span>
              {message.text}
              <button
                type="button"
                aria-label="Dismiss message"
                onClick={() => setMessage({ type: "", text: "" })}
              >
                ×
              </button>
            </div>
          )}

          <div className="gc-settings-layout">
            <aside className="gc-settings-menu">
              <span className="gc-settings-menu-title">SETTINGS MENU</span>

              <button
                type="button"
                className={`gc-settings-menu-item ${
                  activeTab === "personal" ? "selected" : ""
                }`}
                onClick={() => {
                  setActiveTab("personal");
                  setMessage({ type: "", text: "" });
                }}
              >
                <span className="gc-settings-menu-icon">♙</span>
                <span>
                  <strong>Personal information</strong>
                  <small>Name and email address</small>
                </span>
                <span className="gc-settings-chevron">›</span>
              </button>

              <button
                type="button"
                className={`gc-settings-menu-item ${
                  activeTab === "security" ? "selected" : ""
                }`}
                onClick={() => {
                  setActiveTab("security");
                  setMessage({ type: "", text: "" });
                }}
              >
                <span className="gc-settings-menu-icon">♧</span>
                <span>
                  <strong>Password &amp; security</strong>
                  <small>Keep your account protected</small>
                </span>
                <span className="gc-settings-chevron">›</span>
              </button>

              <button
                type="button"
                className={`gc-settings-menu-item ${
                  activeTab === "account" ? "selected" : ""
                }`}
                onClick={() => {
                  setActiveTab("account");
                  setMessage({ type: "", text: "" });
                }}
              >
                <span className="gc-settings-menu-icon">▤</span>
                <span>
                  <strong>Account details</strong>
                  <small>Your membership information</small>
                </span>
                <span className="gc-settings-chevron">›</span>
              </button>

              <div className="gc-settings-menu-footer">
                <span className="gc-mini-shield">◇</span>
                <strong>Your privacy matters</strong>
                <p>Your account information should only be accessible to you.</p>
              </div>
            </aside>

            <section className="gc-settings-panel">
              {activeTab === "personal" && (
                <>
                  <div className="gc-panel-heading">
                    <div className="gc-panel-heading-icon blue">♙</div>
                    <div>
                      <h3>Personal information</h3>
                      <p>Update the details associated with your account.</p>
                    </div>
                  </div>

                  <div className="gc-profile-identity">
                    <div className="gc-identity-avatar">{initials || "U"}</div>
                    <div>
                      <strong>{form.name || "Your name"}</strong>
                      <span>{form.email || "Your email address"}</span>
                    </div>
                    <span className="gc-identity-badge">MEMBER</span>
                  </div>

                  <form onSubmit={handleProfileSave}>
                    <div className="gc-form-grid">
                      <label className="gc-form-field">
                        <span>
                          Full name <b>*</b>
                        </span>
                        <div className="gc-input-wrap">
                          <span className="gc-input-icon">♙</span>
                          <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleFormChange}
                            placeholder="Enter your full name"
                            maxLength={100}
                            required
                          />
                        </div>
                      </label>

                      <label className="gc-form-field">
                        <span>
                          Email address <b>*</b>
                        </span>
                        <div className="gc-input-wrap">
                          <span className="gc-input-icon">✉</span>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleFormChange}
                            placeholder="you@example.com"
                            maxLength={150}
                            required
                          />
                        </div>
                      </label>
                    </div>

                    <div className="gc-form-note">
                      <span>ⓘ</span>
                      Changes to your profile must be saved to your account.
                    </div>

                    <div className="gc-panel-actions">
                      <button
                        type="button"
                        className="gc-button-secondary"
                        onClick={() => {
                          setForm({
                            name: user.name || "",
                            email: user.email || "",
                          });
                          setMessage({ type: "", text: "" });
                        }}
                      >
                        Reset changes
                      </button>

                      <button
                        type="submit"
                        className="gc-button-primary"
                        disabled={savingProfile}
                      >
                        {savingProfile ? "Saving..." : "Save changes"}
                        {!savingProfile && <span>→</span>}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {activeTab === "security" && (
                <>
                  <div className="gc-panel-heading">
                    <div className="gc-panel-heading-icon purple">♧</div>
                    <div>
                      <h3>Password &amp; security</h3>
                      <p>
                        Choose a strong password to help protect your account.
                      </p>
                    </div>
                  </div>

                  <div className="gc-security-banner">
                    <div className="gc-security-banner-icon">◇</div>
                    <div>
                      <strong>Keep your account secure</strong>
                      <p>
                        Never share your password with anyone. Use a unique
                        password that you do not use on other websites.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordSave}>
                    {[
                      {
                        name: "currentPassword",
                        label: "Current password",
                        placeholder: "Enter your current password",
                      },
                      {
                        name: "newPassword",
                        label: "New password",
                        placeholder: "Create a strong password",
                      },
                      {
                        name: "confirmPassword",
                        label: "Confirm new password",
                        placeholder: "Re-enter your new password",
                      },
                    ].map((field) => (
                      <label
                        className="gc-form-field gc-password-field"
                        key={field.name}
                      >
                        <span>
                          {field.label} <b>*</b>
                        </span>
                        <div className="gc-input-wrap">
                          <span className="gc-input-icon">●</span>
                          <input
                            type={
                              showPasswords[field.name] ? "text" : "password"
                            }
                            name={field.name}
                            value={passwords[field.name]}
                            onChange={handlePasswordChange}
                            placeholder={field.placeholder}
                            autoComplete={
                              field.name === "currentPassword"
                                ? "current-password"
                                : "new-password"
                            }
                            required
                          />
                          <button
                            type="button"
                            className="gc-password-toggle"
                            onClick={() => togglePassword(field.name)}
                          >
                            {showPasswords[field.name] ? "Hide" : "Show"}
                          </button>
                        </div>
                      </label>
                    ))}

                    <div className="gc-password-strength">
                      <div className="gc-strength-top">
                        <strong>Password requirements</strong>
                        <span className={strongPassword ? "strong" : ""}>
                          {strongPassword
                            ? "Strong password"
                            : "Complete all requirements"}
                        </span>
                      </div>

                      <div className="gc-strength-bars">
                        {[1, 2, 3, 4, 5].map((bar, index) => (
                          <span
                            key={bar}
                            className={
                              passwordRules[index].valid ? "filled" : ""
                            }
                          />
                        ))}
                      </div>

                      <div className="gc-password-rules">
                        {passwordRules.map((rule) => (
                          <div
                            key={rule.label}
                            className={rule.valid ? "valid" : ""}
                          >
                            <span>{rule.valid ? "✓" : "○"}</span>
                            {rule.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="gc-panel-actions">
                      <button
                        type="button"
                        className="gc-button-secondary"
                        onClick={() => {
                          setPasswords({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                          setMessage({ type: "", text: "" });
                        }}
                      >
                        Clear fields
                      </button>

                      <button
                        type="submit"
                        className="gc-button-primary"
                        disabled={changingPassword}
                      >
                        {changingPassword ? "Updating..." : "Update password"}
                        {!changingPassword && <span>→</span>}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {activeTab === "account" && (
                <>
                  <div className="gc-panel-heading">
                    <div className="gc-panel-heading-icon green">▤</div>
                    <div>
                      <h3>Account details</h3>
                      <p>Review your GigConnect membership information.</p>
                    </div>
                  </div>

                  <div className="gc-account-card">
                    <div className="gc-account-card-avatar">{initials || "U"}</div>
                    <div>
                      <span>GIGCONNECT MEMBER</span>
                      <h3>{user.name || "Your account"}</h3>
                      <p>{user.email || "No email available"}</p>
                    </div>
                    <span className="gc-account-active">
                      <i /> Active session
                    </span>
                  </div>

                  <div className="gc-account-details">
                    <div>
                      <span>Account ID</span>
                      <strong>{user.id ?? "Not available"}</strong>
                    </div>
                    <div>
                      <span>Account role</span>
                      <strong className="gc-role-pill">{role}</strong>
                    </div>
                    <div>
                      <span>Registered email</span>
                      <strong>{user.email || "Not available"}</strong>
                    </div>
                    <div>
                      <span>Account status</span>
                      <strong className="gc-status-text">
                        <i /> Signed in
                      </strong>
                    </div>
                  </div>

                  <div className="gc-account-security-note">
                    <span>◇</span>
                    <div>
                      <strong>Account security</strong>
                      <p>
                        Use the Password &amp; Security section to change your
                        password. For account deletion or other sensitive
                        changes, contact your platform administrator.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          <footer className="gc-profile-footer">
            <span>© 2026 GigConnect</span>
            <span>
              Built for better work, together. <b>✦</b>
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}