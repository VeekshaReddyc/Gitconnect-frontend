import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

const API_URL = "https://gigconnect-backend-in1g.onrender.com/api/gigs";

function BrowseGigs() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyingId, setApplyingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [selectedGig, setSelectedGig] = useState(null);
  const [proposal, setProposal] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    loadGigs();
  }, []);

  async function loadGigs() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Unable to load gigs (${response.status}).`);
      }

      const data = await response.json();
      setGigs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the server. Check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(gigs.map((gig) => gig.category).filter(Boolean)),
    ];

    return ["All Categories", ...uniqueCategories];
  }, [gigs]);

  const filteredGigs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return gigs.filter((gig) => {
      const searchableText = [
        gig.title,
        gig.description,
        gig.category,
        gig.skills,
        gig.experience,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(query);

      const matchesCategory =
        category === "All Categories" || gig.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [gigs, search, category]);

  function getGigStatus(gig) {
    return String(gig.status || "PUBLISHED").toUpperCase();
  }

  function showMessage(text, type = "info") {
    setMessage(text);
    setMessageType(type);
  }

  function canApply(gig) {
    return (
      getGigStatus(gig) === "PUBLISHED" &&
      !gig.freelancer &&
      String(user?.role || "").toUpperCase() === "FREELANCER"
    );
  }

  function openApplicationForm(gig) {
    // Debugging: confirms that the button's click handler runs.
    console.log("Apply clicked:", {
      gigId: gig.id,
      title: gig.title,
      status: gig.status,
      userRole: user?.role,
      userId: user?.id,
    });

    if (!user) {
      navigate("/login");
      return;
    }

    if (String(user.role || "").toUpperCase() !== "FREELANCER") {
      showMessage("Only freelancer accounts can apply for gigs.", "error");
      return;
    }

    if (!user.id) {
      showMessage(
        "Your account ID is missing. Please log out and log in again.",
        "error"
      );
      return;
    }

    if (
      gig.client?.id != null &&
      String(gig.client.id) === String(user.id)
    ) {
      showMessage("You cannot apply to your own gig.", "error");
      return;
    }

    if (!canApply(gig)) {
      showMessage(
        "This gig is not accepting applications. Refresh the page and try another gig.",
        "error"
      );
      return;
    }

    setSelectedGig(gig);
    setProposal("");
    setProposedBudget(
      gig.maxBudget !== null && gig.maxBudget !== undefined
        ? String(gig.maxBudget)
        : ""
    );

    setMessage("");
    setMessageType("info");

    // Scroll the application form into view after React renders it.
    setTimeout(() => {
      document
        .getElementById("gig-application-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  async function submitApplication(event) {
    event.preventDefault();

    if (applyingId !== null) {
      return;
    }

    if (!selectedGig) {
      showMessage("Please click Apply Now to select a gig first.", "error");
      return;
    }

    if (!user?.id) {
      showMessage("Please log in again before applying.", "error");
      navigate("/login");
      return;
    }

    const trimmedProposal = proposal.trim();
    const budget = Number(proposedBudget);

    if (!trimmedProposal) {
      showMessage("Please enter your proposal.", "error");
      return;
    }

    if (trimmedProposal.length > 2000) {
      showMessage("Your proposal must be 2000 characters or fewer.", "error");
      return;
    }

    if (
      proposedBudget.trim() === "" ||
      !Number.isFinite(budget) ||
      budget <= 0
    ) {
      showMessage("Enter a valid proposed budget greater than ₹0.", "error");
      return;
    }

    const minBudget = Number(selectedGig.minBudget);
    const maxBudget = Number(selectedGig.maxBudget);

    if (
      Number.isFinite(minBudget) &&
      selectedGig.minBudget != null &&
      budget < minBudget
    ) {
      showMessage(
        `Your proposed budget cannot be below ₹${minBudget.toLocaleString("en-IN")}.`,
        "error"
      );
      return;
    }

    if (
      Number.isFinite(maxBudget) &&
      selectedGig.maxBudget != null &&
      budget > maxBudget
    ) {
      showMessage(
        `Your proposed budget cannot exceed ₹${maxBudget.toLocaleString("en-IN")}.`,
        "error"
      );
      return;
    }

    if (!canApply(selectedGig)) {
      showMessage(
        "This gig is no longer available. Refresh the page and try again.",
        "error"
      );
      setSelectedGig(null);
      await loadGigs();
      return;
    }

    setApplyingId(selectedGig.id);
    setMessage("");

    try {
      const requestUrl =
        `${API_URL}/${selectedGig.id}/apply` +
        `?freelancerId=${encodeURIComponent(user.id)}`;

      console.log("Submitting gig application:", requestUrl);

      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          proposal: trimmedProposal,
          proposedBudget: budget,
        }),
      });

      const responseText = await response.text();

      let result = null;

      try {
        result = responseText ? JSON.parse(responseText) : null;
      } catch {
        result = null;
      }

      console.log("Application response:", {
        status: response.status,
        body: result || responseText,
      });

      if (!response.ok) {
        const errorText =
          result?.message ||
          result?.error ||
          responseText ||
          `Application failed with status ${response.status}.`;

        throw new Error(errorText);
      }

      showMessage(
        result?.message || "Application submitted successfully!",
        "success"
      );

      setSelectedGig(null);
      setProposal("");
      setProposedBudget("");

      await loadGigs();
    } catch (err) {
      console.error("Application submission failed:", err);

      showMessage(
        err.message?.includes("Failed to fetch")
          ? "Cannot connect to the backend. Make sure Spring Boot is running on port 8081."
          : err.message || "Something went wrong while submitting your application.",
        "error"
      );
    } finally {
      setApplyingId(null);
    }
  }

  function formatBudget(value) {
    if (value === null || value === undefined || value === "") {
      return "Not specified";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return String(value);
    }

    return `₹${number.toLocaleString("en-IN")}`;
  }

  function formatStatus(status) {
    const normalizedStatus = String(status || "PUBLISHED").toUpperCase();

    const labels = {
      DRAFT: "Draft",
      PUBLISHED: "Open for Applications",
      ACCEPTED: "Freelancer Selected",
      SUBMITTED: "Work Submitted",
      COMPLETED: "Completed",
      DISPUTED: "Disputed",
    };

    return labels[normalizedStatus] || normalizedStatus;
  }

  function logout() {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  }

  return (
    <div className="marketplace">
      <header className="market-nav">
        <Link to="/" className="market-logo">
          Gig<span>Connect</span>
        </Link>

        <nav className="market-nav-links">
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/create-gig">Post a Gig</Link>

          {user ? (
            <button
              type="button"
              className="market-logout"
              onClick={logout}
            >
              Logout
            </button>
          ) : (
            <Link to="/login" className="market-login">
              Login
            </Link>
          )}
        </nav>
      </header>

      <main className="market-content">
        <section className="market-hero">
          <div className="market-hero-copy">
            <span className="market-eyebrow">OPPORTUNITIES AWAIT</span>

            <h1>
              Find work that
              <br />
              <span>moves you forward.</span>
            </h1>

            <p>
              Explore freelance opportunities, discover new clients,
              and find projects that match your skills.
            </p>

            <div className="market-hero-badges">
              <span>✓ Explore projects</span>
              <span>✓ Flexible opportunities</span>
            </div>
          </div>

          <div className="market-hero-art" aria-hidden="true">
            <div className="market-art-circle">↗</div>

            <div className="market-art-card">
              <span className="market-art-dot" />

              <div>
                <strong>New opportunities</strong>
                <p>Your next project starts here.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="market-search-section">
          <div className="market-search-heading">
            <div>
              <span className="market-eyebrow">THE MARKETPLACE</span>
              <h2>Explore freelance gigs</h2>
              <p>Search projects by title, skills, or category.</p>
            </div>

            <button
              type="button"
              className="market-refresh"
              onClick={loadGigs}
              disabled={loading}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          <div className="market-search-controls">
            <label className="market-search-box">
              <span aria-hidden="true">⌕</span>

              <input
                type="search"
                placeholder="Search projects or skills..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label className="market-category-box">
              <span>Category</span>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {message && (
          <div
            className="market-message"
            role="status"
            style={{
              margin: "16px 0",
              padding: "14px 16px",
              borderRadius: "8px",
              background:
                messageType === "error"
                  ? "#fee2e2"
                  : messageType === "success"
                  ? "#dcfce7"
                  : "#dbeafe",
              color:
                messageType === "error"
                  ? "#991b1b"
                  : messageType === "success"
                  ? "#166534"
                  : "#1e40af",
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {selectedGig && (
          <section
            className="market-search-section"
            id="gig-application-form"
            style={{
              marginTop: "24px",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #bfdbfe",
              background: "#ffffff",
            }}
          >
            <div className="market-search-heading">
              <div>
                <span className="market-eyebrow">YOUR APPLICATION</span>
                <h2>Apply for {selectedGig.title}</h2>
                <p>
                  Explain why you are a good fit for this project.
                </p>
              </div>

              <button
                type="button"
                className="market-refresh"
                onClick={() => {
                  setSelectedGig(null);
                  setMessage("");
                }}
                disabled={applyingId !== null}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={submitApplication}>
              <div style={{ marginBottom: "18px" }}>
                <label
                  htmlFor="application-proposal"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  Proposal
                </label>

                <textarea
                  id="application-proposal"
                  value={proposal}
                  onChange={(event) => setProposal(event.target.value)}
                  placeholder="Describe your relevant skills, experience, and how you will complete this project."
                  rows={6}
                  maxLength={2000}
                  required
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    font: "inherit",
                    resize: "vertical",
                  }}
                />

                <small>{proposal.length}/2000 characters</small>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label
                  htmlFor="application-budget"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  Proposed budget (₹)
                </label>

                <input
                  id="application-budget"
                  type="number"
                  min={Math.max(1, Number(selectedGig.minBudget) || 1)}
                  max={
                    selectedGig.maxBudget != null
                      ? Number(selectedGig.maxBudget)
                      : undefined
                  }
                  step="0.01"
                  value={proposedBudget}
                  onChange={(event) =>
                    setProposedBudget(event.target.value)
                  }
                  placeholder="Enter your proposed price"
                  required
                  style={{
                    width: "100%",
                    maxWidth: "420px",
                    boxSizing: "border-box",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    font: "inherit",
                  }}
                />
              </div>

              <p>
                Client budget: {formatBudget(selectedGig.minBudget)} –{" "}
                {formatBudget(selectedGig.maxBudget)}
              </p>

              <button
                type="submit"
                className="market-accept-button"
                disabled={applyingId !== null}
              >
                {applyingId === selectedGig.id
                  ? "Submitting..."
                  : "Submit Application →"}
              </button>
            </form>
          </section>
        )}

        <section className="market-results">
          <div className="market-results-heading">
            <div>
              <h2>Freelance projects</h2>

              <p>
                {loading
                  ? "Loading published projects..."
                  : `${filteredGigs.length} ${
                      filteredGigs.length === 1 ? "project" : "projects"
                    } found`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="market-state">
              <div className="market-loader" />
              <h3>Finding opportunities</h3>
              <p>Loading published gigs from GigConnect...</p>
            </div>
          ) : error ? (
            <div className="market-state market-error">
              <h3>Unable to load projects</h3>
              <p>{error}</p>

              <button
                type="button"
                className="market-primary-button"
                onClick={loadGigs}
              >
                Try again
              </button>
            </div>
          ) : filteredGigs.length === 0 ? (
            <div className="market-state">
              <div className="market-empty-icon">⌕</div>
              <h3>No projects found</h3>

              <p>
                {gigs.length === 0
                  ? "There are no published gigs yet. Clients can publish a gig from the Post a Gig page."
                  : "Try another search term or select a different category."}
              </p>

              {(search || category !== "All Categories") && (
                <button
                  type="button"
                  className="market-primary-button"
                  onClick={() => {
                    setSearch("");
                    setCategory("All Categories");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="gig-grid">
              {filteredGigs.map((gig) => {
                const status = getGigStatus(gig);
                const isAvailable =
                  status === "PUBLISHED" && !gig.freelancer;

                const isOwnGig =
                  user?.id != null &&
                  gig.client?.id != null &&
                  String(user.id) === String(gig.client.id);

                return (
                  <article className="market-gig-card" key={gig.id}>
                    <div className="market-gig-card-top">
                      <span className="market-category-tag">
                        {gig.category || "General"}
                      </span>

                      <span className="market-status-tag">
                        {formatStatus(status)}
                      </span>
                    </div>

                    <h3>{gig.title || "Untitled project"}</h3>

                    <p className="market-gig-description">
                      {gig.description || "No project description provided."}
                    </p>

                    {gig.skills && (
                      <div className="market-skills">
                        {String(gig.skills)
                          .split(",")
                          .map((skill) => skill.trim())
                          .filter(Boolean)
                          .slice(0, 5)
                          .map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                      </div>
                    )}

                    <div className="market-gig-details">
                      <div>
                        <span>PROJECT BUDGET</span>
                        <strong>
                          {formatBudget(gig.minBudget)} –{" "}
                          {formatBudget(gig.maxBudget)}
                        </strong>
                      </div>

                      <div>
                        <span>EXPERIENCE</span>
                        <strong>{gig.experience || "Not specified"}</strong>
                      </div>

                      <div>
                        <span>DEADLINE</span>
                        <strong>
                          {gig.deadline
                            ? String(gig.deadline).slice(0, 10)
                            : "Flexible"}
                        </strong>
                      </div>
                    </div>

                    {gig.freelancer && (
                      <div style={{ marginTop: "12px" }}>
                        <span>SELECTED FREELANCER</span>
                        <strong style={{ display: "block" }}>
                          {gig.freelancer.name || "Freelancer assigned"}
                        </strong>
                      </div>
                    )}

                    <div className="market-gig-footer">
                      <div className="market-client">
                        <div className="market-client-avatar">
                          {String(gig.client?.name || "C")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <span>Posted by</span>
                          <strong>
                            {gig.client?.name || "GigConnect Client"}
                          </strong>
                        </div>
                      </div>

                      {isOwnGig ? (
                        <span className="market-client-notice">
                          Your gig
                        </span>
                      ) : !user ? (
                        <Link
                          to="/login"
                          className="market-accept-button"
                        >
                          Login to Apply →
                        </Link>
                      ) : String(user.role || "").toUpperCase() !==
                        "FREELANCER" ? (
                        <span className="market-client-notice">
                          Freelancer access required
                        </span>
                      ) : isAvailable ? (
                        <button
                          type="button"
                          className="market-accept-button"
                          onClick={() => openApplicationForm(gig)}
                        >
                          Apply Now →
                        </button>
                      ) : (
                        <span className="market-client-notice">
                          {status === "COMPLETED"
                            ? "Project completed"
                            : status === "SUBMITTED"
                            ? "Work submitted"
                            : gig.freelancer
                            ? "Already assigned"
                            : "Applications closed"}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="market-footer">
          <Link to="/" className="market-logo">
            Gig<span>Connect</span>
          </Link>

          <p>Connecting talent with meaningful opportunities.</p>

          <span>© {new Date().getFullYear()} GigConnect</span>
        </footer>
      </main>
    </div>
  );
}

export default BrowseGigs;