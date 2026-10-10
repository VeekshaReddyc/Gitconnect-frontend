import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

const API_URL = "http://localhost:8081/api/gigs";

function FreelancerMyGigs() {
  const [user, setUser] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submissions, setSubmissions] = useState({});
  const [submittingGigId, setSubmittingGigId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      setError("Please log in to view your assigned gigs.");
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      setUser(parsedUser);

      if (parsedUser.role?.toUpperCase() !== "FREELANCER") {
        setError("This page is only available to freelancers.");
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
      setError("Invalid login information. Please log in again.");
      setLoading(false);
    }
  }, []);

  // Load gigs assigned to the logged-in freelancer
  async function loadMyGigs(freelancerId) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/freelancer/${freelancerId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load your assigned gigs."
        );
      }

      setGigs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the backend. Check whether Spring Boot is running."
      );
    } finally {
      setLoading(false);
    }
  }

  // Update submission text
  function handleSubmissionChange(gigId, value) {
    setSubmissions((previous) => ({
      ...previous,
      [gigId]: value,
    }));
  }

  // Submit completed work to the client
  async function submitWork(gigId) {
    const submissionDetails = submissions[gigId]?.trim();

    if (!submissionDetails) {
      alert("Please enter your work submission details.");
      return;
    }

    if (!user?.id) {
      setError("User information is missing. Please log in again.");
      return;
    }

    setSubmittingGigId(gigId);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/${gigId}/submit?freelancerId=${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            submissionDetails: submissionDetails,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to submit your work."
        );
      }

      alert("Work submitted successfully!");

      setSubmissions((previous) => ({
        ...previous,
        [gigId]: "",
      }));

      await loadMyGigs(user.id);
    } catch (err) {
      setError(err.message || "Failed to submit work.");
    } finally {
      setSubmittingGigId(null);
    }
  }

  // Loading screen
  if (loading) {
    return (
      <div className="my-gigs-page">
        <p>Loading your assigned gigs...</p>
      </div>
    );
  }

  // Main page
  return (
    <div className="my-gigs-page">
      <div className="my-gigs-header">
        <div>
          <h1>My Assigned Gigs</h1>
          <p>
            Manage your accepted projects and submit completed work.
          </p>
        </div>

        <Link to="/dashboard" className="my-gigs-back">
          Back to Dashboard
        </Link>
      </div>

      {/* Error message */}
      {error && (
        <div className="my-gigs-error">
          {error}
        </div>
      )}

      {/* No assigned gigs */}
      {!error && gigs.length === 0 && (
        <div className="my-gigs-empty">
          <h2>No Assigned Gigs Yet</h2>

          <p>
            You haven't accepted any gigs yet. Browse available
            gigs to find your next project.
          </p>

          <Link to="/browse-gigs">
            Browse Available Gigs
          </Link>
        </div>
      )}

      {/* Assigned gigs */}
      <div className="my-gigs-list">
        {gigs.map((gig) => (
          <div className="my-gig-card" key={gig.id}>
            <h2>{gig.title}</h2>

            <p>
              <strong>Description:</strong>{" "}
              {gig.description || "No description provided"}
            </p>

            <p>
              <strong>Category:</strong>{" "}
              {gig.category || "Not specified"}
            </p>

            <p>
              <strong>Skills:</strong>{" "}
              {gig.skills || "Not specified"}
            </p>

            <p>
              <strong>Budget:</strong>{" "}
              ₹{gig.minBudget ?? 0} – ₹{gig.maxBudget ?? 0}
            </p>

            <p>
              <strong>Deadline:</strong>{" "}
              {gig.deadline || "Not specified"}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              <span className="my-gig-status">
                {gig.status}
              </span>
            </p>

            {/* ACCEPTED: Freelancer can submit work */}
            {gig.status === "ACCEPTED" && (
              <div className="my-gig-submission">
                <h3>Submit Your Work</h3>

                <p>
                  Describe your completed work or provide links
                  to your deliverables.
                </p>

                <label htmlFor={`submission-${gig.id}`}>
                  Submission Details
                </label>

                <textarea
                  id={`submission-${gig.id}`}
                  rows="5"
                  placeholder="Enter your work details, project link, or deliverables..."
                  value={submissions[gig.id] || ""}
                  onChange={(event) =>
                    handleSubmissionChange(
                      gig.id,
                      event.target.value
                    )
                  }
                />

                <button
                  type="button"
                  onClick={() => submitWork(gig.id)}
                  disabled={submittingGigId === gig.id}
                >
                  {submittingGigId === gig.id
                    ? "Submitting..."
                    : "Submit Work"}
                </button>
              </div>
            )}

            {/* SUBMITTED: Waiting for client review */}
            {gig.status === "SUBMITTED" && (
              <div className="my-gigs-notice">
                <h3>Work Submitted Successfully</h3>

                <p>
                  Your work has been submitted. Wait for the
                  client to review and mark the project as completed.
                </p>

                {gig.submissionDetails && (
                  <p>
                    <strong>Your Submission:</strong>{" "}
                    {gig.submissionDetails}
                  </p>
                )}

                {gig.submittedAt && (
                  <p>
                    <strong>Submitted At:</strong>{" "}
                    {new Date(gig.submittedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* COMPLETED: Project finished */}
            {gig.status === "COMPLETED" && (
              <div className="my-gigs-notice">
                <h3>Project Completed</h3>

                <p>
                  The client has marked this project as completed.
                </p>

                {gig.submissionDetails && (
                  <p>
                    <strong>Submitted Work:</strong>{" "}
                    {gig.submissionDetails}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Refresh button */}
      {gigs.length > 0 && (
        <button
          type="button"
          className="my-gigs-refresh"
          onClick={() => loadMyGigs(user.id)}
        >
          Refresh My Gigs
        </button>
      )}
    </div>
  );
}

export default FreelancerMyGigs;