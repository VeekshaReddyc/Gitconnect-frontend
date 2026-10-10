import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");
  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const role = user?.role?.toUpperCase();
  const isFreelancer = role === "FREELANCER";

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `gc-nav-link${isActive ? " active" : ""}`;

  return (
    <header className="gc-navbar">
      <Link to="/dashboard" className="gc-navbar-brand">
        <span className="gc-brand-icon">G</span>
        <span>GigConnect</span>
      </Link>

      <nav className="gc-navbar-links" aria-label="Main navigation">
        <NavLink to="/dashboard" className={linkClass}>
          Dashboard
        </NavLink>

        {isFreelancer ? (
          <>
            <NavLink to="/browse-gigs" className={linkClass}>
              Browse Gigs
            </NavLink>

            <NavLink to="/freelancer-my-gigs" className={linkClass}>
              My Applications
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/my-gigs" className={linkClass}>
              My Gigs
            </NavLink>

            <NavLink to="/create-gig" className={linkClass}>
              Post a Gig
            </NavLink>
          </>
        )}

        <NavLink to="/payment-history" className={linkClass}>
          Payments
        </NavLink>
      </nav>

      <div className="gc-navbar-account">
        <Link to="/profile" className="gc-nav-profile">
          <span className="gc-nav-avatar">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </span>

          <span className="gc-nav-username">
            {user?.name || "My Profile"}
          </span>
        </Link>

        <button
          type="button"
          className="gc-nav-logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}