import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

const API_URL = "https://gigconnect-backend-in1g.onrender.com/api/gigs";

function MyGigs() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [applications, setApplications] = useState({});
  const [expandedGigId, setExpandedGigId] = useState(null);
  const [loadingApplications, setLoadingApplications] = useState({});
  const [selectingApplicationId, setSelectingApplicationId] =
    useState(null);

  const [processingGigId, setProcessingGigId] = useState(null);
  const [revisionComments, setRevisionComments] = useState({});
  const [paymentAmounts, setPaymentAmounts] = useState({});

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      if (String(parsedUser.role || "").toUpperCase() !== "CLIENT") {
        setError("This page is available to client accounts.");
        setLoading(false);
        return;
      }

      if (!parsedUser.id) {
        setError("User ID not found. Please log in again.");
        setLoading(false);
        return;
      }

      loadMyGigs(parsedUser.id);
    } catch {
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  async function readResponse(response) {
    const responseText = await response.text();
    let data = {};

    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }
    }

    if (!response.ok) {
      let message =
        data.error ||
        data.message ||
        `Request failed with HTTP ${response.status}.`;

      if (/<!doctype html|<html/i.test(String(message))) {
        message =
          `The server returned HTTP ${response.status}. ` +
          "Check the Spring Boot terminal for the actual error.";
      }

      throw new Error(message);
    }

    return data;
  }

  async function loadMyGigs(clientId) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/client/${encodeURIComponent(clientId)}`
      );

      const data = await readResponse(response);
      const loadedGigs = Array.isArray(data) ? data : [];

      setGigs(loadedGigs);

      setPaymentAmounts((previous) => {
        const updated = { ...previous };

        loadedGigs.forEach((gig) => {
          if (
            updated[gig.id] === undefined &&
            gig.paymentAmount != null
          ) {
            updated[gig.id] = String(gig.paymentAmount);
          }
        });

        return updated;
      });
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the backend. Check whether Spring Boot is running."
      );
    } finally {
      setLoading(false);
    }
  }

  // Delete a draft gig.
  async function deleteGig(gigId) {
    if (!user?.id) {
      setError("User information is missing. Please log in again.");
      return;
    }

    const gig = gigs.find(
      (item) => String(item.id) === String(gigId)
    );

    if (!gig) {
      setError("Gig not found. Refresh the page and try again.");
      return;
    }

    if (String(gig.status || "").toUpperCase() !== "DRAFT") {
      setError("Only draft gigs can be deleted from this page.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${gig.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setProcessingGigId(gigId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/${gigId}?clientId=${encodeURIComponent(user.id)}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
      );

      await readResponse(response);

      setGigs((previous) =>
        previous.filter(
          (item) => String(item.id) !== String(gigId)
        )
      );

      setApplications((previous) => {
        const updated = { ...previous };
        delete updated[gigId];
        return updated;
      });

      setNotice("Draft gig deleted successfully.");
    } catch (err) {
      setError(
        err.message ||
          "Unable to delete the gig. Please try again."
      );
    } finally {
      setProcessingGigId(null);
    }
  }

  // Open the edit page for a draft gig.
  function editGig(gig) {
    if (String(gig.status || "").toUpperCase() !== "DRAFT") {
      setError("Only draft gigs can be edited from this page.");
      return;
    }

    navigate(`/edit-gig/${gig.id}`);
  }

  async function viewApplications(gigId) {
    if (!user?.id) {
      setError("User information is missing. Please log in again.");
      return;
    }

    if (expandedGigId === gigId) {
      setExpandedGigId(null);
      return;
    }

    setExpandedGigId(gigId);
    setError("");
    setNotice("");

    if (applications[gigId] !== undefined) return;

    setLoadingApplications((previous) => ({
      ...previous,
      [gigId]: true,
    }));

    try {
      const response = await fetch(
        `${API_URL}/${gigId}/applications?clientId=${encodeURIComponent(
          user.id
        )}`
      );

      const data = await readResponse(response);

      setApplications((previous) => ({
        ...previous,
        [gigId]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      setError(
        `Unable to load applications for Gig ${gigId}: ${err.message}`
      );
    } finally {
      setLoadingApplications((previous) => ({
        ...previous,
        [gigId]: false,
      }));
    }
  }

  async function refreshApplications(gigId) {
    if (!user?.id) return;

    setLoadingApplications((previous) => ({
      ...previous,
      [gigId]: true,
    }));

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/${gigId}/applications?clientId=${encodeURIComponent(
          user.id
        )}`
      );

      const data = await readResponse(response);

      setApplications((previous) => ({
        ...previous,
        [gigId]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      setError(err.message || "Unable to refresh applications.");
    } finally {
      setLoadingApplications((previous) => ({
        ...previous,
        [gigId]: false,
      }));
    }
  }

  async function selectFreelancer(gigId, applicationId) {
    if (!user?.id) return;

    if (
      !window.confirm(
        "Select this freelancer for the project? Other pending applications will be rejected."
      )
    ) {
      return;
    }

    setSelectingApplicationId(applicationId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/${gigId}/select/${applicationId}?clientId=${encodeURIComponent(
          user.id
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      await readResponse(response);

      setNotice(
        "Freelancer selected successfully! The project has been assigned."
      );

      await loadMyGigs(user.id);
      await refreshApplications(gigId);
    } catch (err) {
      setError(err.message || "Unable to select this freelancer.");
    } finally {
      setSelectingApplicationId(null);
    }
  }

  async function approveWork(gigId) {
    if (!user?.id) return;

    if (
      !window.confirm(
        "Have you reviewed the submitted work and confirmed that it is complete?"
      )
    ) {
      return;
    }

    setProcessingGigId(gigId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/${gigId}/approve?clientId=${encodeURIComponent(
          user.id
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      await readResponse(response);

      setNotice(
        "Work approved successfully! You can now proceed to payment."
      );

      await loadMyGigs(user.id);
    } catch (err) {
      setError(err.message || "Unable to approve the submitted work.");
    } finally {
      setProcessingGigId(null);
    }
  }

  async function requestRevision(gigId) {
    if (!user?.id) {
      setError("Your client account information is missing.");
      return;
    }

    const comments = String(
      revisionComments[gigId] || ""
    ).trim();

    if (!comments) {
      setError("Please enter revision instructions before submitting.");
      return;
    }

    if (comments.length > 2000) {
      setError("Revision comments cannot exceed 2000 characters.");
      return;
    }

    if (
      !window.confirm(
        "Send these revision instructions to the freelancer?"
      )
    ) {
      return;
    }

    setProcessingGigId(gigId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/${gigId}/revision?clientId=${encodeURIComponent(
          user.id
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ comments }),
        }
      );

      await readResponse(response);

      setRevisionComments((previous) => ({
        ...previous,
        [gigId]: "",
      }));

      setNotice(
        "Revision requested successfully. The freelancer can revise and resubmit the work."
      );

      await loadMyGigs(user.id);
    } catch (err) {
      setError(`Revision request failed: ${err.message}`);
    } finally {
      setProcessingGigId(null);
    }
  }

  // Record payment through the backend.
  async function recordPayment(gig) {
    if (!user?.id) {
      setError("Client ID is missing. Please log in again.");
      return;
    }

    const rawAmount = paymentAmounts[gig.id];
    const amount = Number(rawAmount);

    if (
      rawAmount === undefined ||
      rawAmount === "" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError("Enter a valid payment amount greater than zero.");
      return;
    }

    if (
      gig.paymentAmount != null &&
      Math.abs(amount - Number(gig.paymentAmount)) > 0.009
    ) {
      setError(
        `Payment must match the agreed amount of ${formatBudget(
          gig.paymentAmount
        )}.`
      );
      return;
    }

    if (
      String(gig.paymentStatus || "").toUpperCase() === "PAID"
    ) {
      setNotice("This gig is already marked as paid.");
      return;
    }

    if (
      !window.confirm(
        `Record payment of ${formatBudget(amount)} for "${gig.title}"?\n\nThis records payment in the database only. No real money will be transferred.`
      )
    ) {
      return;
    }

    setProcessingGigId(gig.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/${gig.id}/payment?clientId=${encodeURIComponent(
          user.id
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ amount }),
        }
      );

      await readResponse(response);

      setNotice(
        `Payment of ${formatBudget(amount)} was recorded successfully.`
      );

      await loadMyGigs(user.id);
    } catch (err) {
      setError(err.message || "Unable to record the payment.");
    } finally {
      setProcessingGigId(null);
    }
  }

  function formatBudget(amount) {
    if (
      amount === null ||
      amount === undefined ||
      amount === ""
    ) {
      return "Not specified";
    }

    const number = Number(amount);

    return Number.isFinite(number)
      ? `₹${number.toLocaleString("en-IN")}`
      : String(amount);
  }

  function getStatusClass(status) {
    return String(status || "UNKNOWN")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
  }

  function getFreelancerName(application) {
    return (
      application.freelancer?.name ||
      application.freelancerName ||
      application.freelancer?.email ||
      application.freelancerEmail ||
      `Freelancer #${
        application.freelancer?.id ||
        application.freelancerId ||
        "Unknown"
      }`
    );
  }

  function getApplicationStatus(application) {
    return String(application.status || "PENDING").toUpperCase();
  }

  if (!user && loading) {
    return (
      <div className="my-gigs-page">
        <main className="my-gigs-content">
          <div className="my-gigs-empty">
            <h3>Loading your workspace...</h3>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="my-gigs-page">
      <header className="my-gigs-navbar">
        <Link to="/" className="my-gigs-logo">
          Gig<span>Connect</span>
        </Link>

        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/browse-gigs">Browse Gigs</Link>
          <Link to="/payment-history">Payment History</Link>
          <Link to="/create-gig" className="my-gigs-nav-button">
            + Post a Gig
          </Link>
        </nav>
      </header>

      <main className="my-gigs-content">
        <section className="my-gigs-heading">
          <div>
            <span className="my-gigs-eyebrow">
              CLIENT WORKSPACE
            </span>

            <h1>My Gigs</h1>

            <p>
              Welcome{user?.name ? `, ${user.name}` : ""}. Manage
              applications, assign freelancers, review work, and track
              payments.
            </p>
          </div>

          <Link
            to="/create-gig"
            className="my-gigs-primary-button"
          >
            + Create New Gig
          </Link>
        </section>

        {error && (
          <div className="my-gigs-error" role="alert">
            <h3>Something went wrong</h3>
            <p>{error}</p>
          </div>
        )}

        {notice && (
          <div className="my-gigs-notice" role="status">
            <p>{notice}</p>
          </div>
        )}

        <section className="my-gigs-summary">
          <div className="my-gigs-summary-card">
            <span>Total Gigs</span>
            <strong>{gigs.length}</strong>
          </div>

          <div className="my-gigs-summary-card">
            <span>Published</span>
            <strong>
              {
                gigs.filter(
                  (gig) =>
                    String(gig.status).toUpperCase() === "PUBLISHED"
                ).length
              }
            </strong>
          </div>

          <div className="my-gigs-summary-card">
            <span>Awaiting Review</span>
            <strong>
              {
                gigs.filter(
                  (gig) =>
                    String(gig.status).toUpperCase() === "SUBMITTED"
                ).length
              }
            </strong>
          </div>

          <div className="my-gigs-summary-card">
            <span>Completed</span>
            <strong>
              {
                gigs.filter(
                  (gig) =>
                    String(gig.status).toUpperCase() === "COMPLETED"
                ).length
              }
            </strong>
          </div>
        </section>

        <section className="my-gigs-list-section">
          <div className="my-gigs-list-heading">
            <div>
              <h2>Your Posted Projects</h2>
              <p>
                Manage drafts, review applications, and track project
                progress.
              </p>
            </div>

            <button
              type="button"
              className="my-gigs-refresh"
              onClick={() => user?.id && loadMyGigs(user.id)}
              disabled={loading}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="my-gigs-empty">
              <h3>Loading Your Gigs...</h3>
              <p>Please wait while we retrieve your projects.</p>
            </div>
          ) : gigs.length === 0 ? (
            <div className="my-gigs-empty">
              <div className="my-gigs-empty-icon">＋</div>
              <h3>You Haven't Posted Any Gigs Yet</h3>
              <p>
                Create your first gig to start connecting with talented
                freelancers.
              </p>

              <Link
                to="/create-gig"
                className="my-gigs-primary-button"
              >
                Post Your First Gig
              </Link>
            </div>
          ) : (
            <div className="my-gigs-grid">
              {gigs.map((gig) => {
                const status = String(
                  gig.status || "UNKNOWN"
                ).toUpperCase();

                const isDraft = status === "DRAFT";
                const isAssigned = Boolean(gig.freelancer?.id);

                const isPaid =
                  String(gig.paymentStatus || "").toUpperCase() ===
                  "PAID";

                const gigApplications = applications[gig.id] || [];

                return (
                  <article className="my-gig-card" key={gig.id}>
                    <div className="my-gig-card-top">
                      <span className="my-gig-category">
                        {gig.category || "General"}
                      </span>

                      <span
                        className={`my-gig-status ${getStatusClass(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </div>

                    <h3>{gig.title || "Untitled Gig"}</h3>

                    <p className="my-gig-description">
                      {gig.description || "No description available."}
                    </p>

                    <div className="my-gig-budget">
                      <span>Budget Range</span>
                      <strong>
                        {formatBudget(gig.minBudget)} –{" "}
                        {formatBudget(gig.maxBudget)}
                      </strong>
                    </div>

                    <div className="my-gig-meta">
                      <div>
                        <span>Deadline</span>
                        <strong>
                          {gig.deadline
                            ? String(gig.deadline).slice(0, 10)
                            : "Flexible"}
                        </strong>
                      </div>

                      <div>
                        <span>Experience</span>
                        <strong>
                          {gig.experience || "Not specified"}
                        </strong>
                      </div>
                    </div>

                    {gig.skills && (
                      <div className="my-gig-skills">
                        {String(gig.skills)
                          .split(",")
                          .map((skill) => skill.trim())
                          .filter(Boolean)
                          .map((skill, index) => (
                            <span key={`${skill}-${index}`}>
                              {skill}
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Draft management actions */}
                    {isDraft && (
                      <div className="my-gig-management-actions">
                        <button
                          type="button"
                          className="my-gig-edit-button"
                          onClick={() => editGig(gig)}
                          disabled={processingGigId === gig.id}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="my-gig-delete-button"
                          onClick={() => deleteGig(gig.id)}
                          disabled={processingGigId === gig.id}
                        >
                          {processingGigId === gig.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    )}

                    {/* Applications */}
                    {["PUBLISHED", "ACCEPTED"].includes(status) && (
                      <div className="my-gig-applications">
                        <button
                          type="button"
                          className="my-gigs-primary-button"
                          onClick={() => viewApplications(gig.id)}
                        >
                          {expandedGigId === gig.id
                            ? "Hide Applications"
                            : "View Applications"}
                        </button>

                        {expandedGigId === gig.id && (
                          <div className="my-gig-applications-panel">
                            <div className="my-gig-list-heading">
                              <h4>Freelancer Applications</h4>

                              <button
                                type="button"
                                className="my-gigs-refresh"
                                onClick={() =>
                                  refreshApplications(gig.id)
                                }
                                disabled={Boolean(
                                  loadingApplications[gig.id]
                                )}
                              >
                                {loadingApplications[gig.id]
                                  ? "Refreshing..."
                                  : "Refresh"}
                              </button>
                            </div>

                            {loadingApplications[gig.id] ? (
                              <p>Loading applications...</p>
                            ) : gigApplications.length === 0 ? (
                              <p>
                                No applications found for this gig yet.
                              </p>
                            ) : (
                              gigApplications.map((application) => {
                                const applicationStatus =
                                  getApplicationStatus(application);

                                const canSelect =
                                  status === "PUBLISHED" &&
                                  applicationStatus === "PENDING" &&
                                  !isAssigned;

                                return (
                                  <div
                                    className="my-gig-application-card"
                                    key={application.id}
                                  >
                                    <h4>
                                      {getFreelancerName(application)}
                                    </h4>

                                    <p>
                                      <strong>Application ID:</strong>{" "}
                                      {application.id}
                                    </p>

                                    <p>
                                      <strong>Proposed Budget:</strong>{" "}
                                      {formatBudget(
                                        application.proposedBudget
                                      )}
                                    </p>

                                    <p>
                                      <strong>Proposal:</strong>
                                    </p>

                                    <p className="my-gig-description">
                                      {application.proposal ||
                                        "No proposal provided."}
                                    </p>

                                    <p>
                                      <strong>Status:</strong>{" "}
                                      {applicationStatus}
                                    </p>

                                    {canSelect && (
                                      <button
                                        type="button"
                                        className="my-gigs-primary-button"
                                        onClick={() =>
                                          selectFreelancer(
                                            gig.id,
                                            application.id
                                          )
                                        }
                                        disabled={
                                          selectingApplicationId ===
                                          application.id
                                        }
                                      >
                                        {selectingApplicationId ===
                                        application.id
                                          ? "Selecting..."
                                          : "Select This Freelancer"}
                                      </button>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Assigned freelancer */}
                    {isAssigned && (
                      <div className="my-gig-notice">
                        <h4>Assigned Freelancer</h4>

                        <p>
                          {gig.freelancer.name ||
                            gig.freelancer.email ||
                            `Freelancer #${gig.freelancer.id}`}
                        </p>

                        {gig.paymentAmount != null && (
                          <p>
                            <strong>Agreed Amount:</strong>{" "}
                            {formatBudget(gig.paymentAmount)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Submitted work and revision actions */}
                    {status === "SUBMITTED" && (
                      <div className="my-gig-submission">
                        <h4>Work Submitted for Review</h4>

                        {gig.submissionDetails && (
                          <div>
                            <strong>Submission Details:</strong>
                            <p>{gig.submissionDetails}</p>
                          </div>
                        )}

                        {gig.submittedAt && (
                          <p>
                            <strong>Submitted At:</strong>{" "}
                            {new Date(
                              gig.submittedAt
                            ).toLocaleString()}
                          </p>
                        )}

                        <div className="my-gig-revision-form">
                          <label htmlFor={`revision-${gig.id}`}>
                            Revision Instructions
                          </label>

                          <textarea
                            id={`revision-${gig.id}`}
                            value={revisionComments[gig.id] || ""}
                            onChange={(event) =>
                              setRevisionComments((previous) => ({
                                ...previous,
                                [gig.id]: event.target.value,
                              }))
                            }
                            maxLength={2000}
                            rows={3}
                            placeholder="Explain what needs to be changed..."
                          />

                          <button
                            type="button"
                            className="my-gigs-refresh"
                            onClick={() => requestRevision(gig.id)}
                            disabled={processingGigId === gig.id}
                          >
                            {processingGigId === gig.id
                              ? "Processing..."
                              : "Request Revision"}
                          </button>
                        </div>

                        <button
                          type="button"
                          className="my-gigs-primary-button"
                          onClick={() => approveWork(gig.id)}
                          disabled={processingGigId === gig.id}
                        >
                          {processingGigId === gig.id
                            ? "Processing..."
                            : "✓ Approve Work"}
                        </button>
                      </div>
                    )}

                    {/* Completed work and payment */}
                    {status === "COMPLETED" && (
                      <div className="my-gig-notice">
                        <h4>✓ Project Completed</h4>
                        <p>The submitted work has been approved.</p>

                        {gig.submissionDetails && (
                          <p>
                            <strong>Submitted Work:</strong>{" "}
                            {gig.submissionDetails}
                          </p>
                        )}

                        <p>
                          <strong>Payment Status:</strong>{" "}
                          {gig.paymentStatus || "NOT_PAID"}
                        </p>

                        {!isPaid && (
                          <div className="my-gig-payment-form">
                            <label htmlFor={`payment-${gig.id}`}>
                              Payment Amount (₹)
                            </label>

                            <input
                              id={`payment-${gig.id}`}
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={paymentAmounts[gig.id] ?? ""}
                              onChange={(event) =>
                                setPaymentAmounts((previous) => ({
                                  ...previous,
                                  [gig.id]: event.target.value,
                                }))
                              }
                              placeholder="Enter agreed amount"
                            />

                            <button
                              type="button"
                              className="my-gigs-primary-button"
                              onClick={() => recordPayment(gig)}
                              disabled={processingGigId === gig.id}
                            >
                              {processingGigId === gig.id
                                ? "Recording..."
                                : "Record Payment"}
                            </button>

                            <p>
                              Demo mode: this records payment status in
                              the database. It does not transfer money.
                            </p>
                          </div>
                        )}

                        {isPaid && (
                          <p>
                            <strong>
                              ✓ Payment recorded:{" "}
                              {formatBudget(gig.paymentAmount)}
                            </strong>
                          </p>
                        )}
                      </div>
                    )}

                    <div className="my-gig-actions">
                      <Link to="/browse-gigs">
                        View Marketplace →
                      </Link>

                      <Link to="/payment-history">
                        Payment History →
                      </Link>

                      <span>Gig ID: {gig.id}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default MyGigs;