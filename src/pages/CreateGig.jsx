import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "https://gigconnect-backend-in1g.onrender.com/api/gigs";

function CreateGig() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Web Development",
    skills: "",
    minBudget: "",
    maxBudget: "",
    deadline: "",
    experience: "Beginner",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function readResponse(response) {
    const text = await response.text();
    let data = {};

    if (text.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.message ||
          `Request failed with HTTP ${response.status}.`
      );
    }

    return data;
  }

  async function handleSubmit(event, publish) {
    if (event) {
      event.preventDefault();
    }

    if (loading) return;

    setError("");

    if (!user?.id) {
      setError("Please log in again before creating a gig.");
      return;
    }

    if (String(user.role || "").toUpperCase() !== "CLIENT") {
      setError("Only clients can create gigs.");
      return;
    }

    const title = form.title.trim();
    const description = form.description.trim();
    const skills = form.skills.trim();
    const minBudget = Number(form.minBudget);
    const maxBudget = Number(form.maxBudget);

    // Basic details are required for both drafts and published gigs.
    if (!title || !description) {
      setError("Please enter the gig title and description.");
      return;
    }

    if (title.length > 150) {
      setError("The gig title cannot exceed 150 characters.");
      return;
    }

    if (description.length > 2000) {
      setError("The description cannot exceed 2000 characters.");
      return;
    }

    // Published gigs must meet the full requirements.
    if (publish) {
      if (title.length < 5) {
        setError("The title must contain at least 5 characters to publish.");
        return;
      }

      if (description.length < 20) {
        setError(
          "The description must contain at least 20 characters to publish."
        );
        return;
      }

      if (!skills) {
        setError("Enter the required skills before publishing.");
        return;
      }

      if (!form.deadline) {
        setError("Select a project deadline before publishing.");
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const deadline = new Date(`${form.deadline}T00:00:00`);

      if (
        Number.isNaN(deadline.getTime()) ||
        deadline < today
      ) {
        setError("The deadline cannot be in the past.");
        return;
      }
    }

    if (
      form.minBudget === "" ||
      form.maxBudget === "" ||
      !Number.isFinite(minBudget) ||
      !Number.isFinite(maxBudget) ||
      minBudget <= 0 ||
      maxBudget < minBudget
    ) {
      setError(
        "Enter valid budgets. The maximum budget must be at least the minimum."
      );
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create the gig. The backend should create it as DRAFT.
      const createResponse = await fetch(
        `${API_URL}?clientId=${encodeURIComponent(user.id)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            title,
            description,
            category: form.category,
            skills,
            minBudget,
            maxBudget,
            deadline: form.deadline || null,
            experience: form.experience,
          }),
        }
      );

      const createdGig = await readResponse(createResponse);

      if (!createdGig.id) {
        throw new Error(
          "The server did not return the new gig ID. Check the backend response."
        );
      }

      // Step 2: Publish only if Publish Gig was selected.
      if (publish) {
        const publishResponse = await fetch(
          `${API_URL}/${createdGig.id}/publish?clientId=${encodeURIComponent(
            user.id
          )}`,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
            },
          }
        );

        await readResponse(publishResponse);

        alert("Your gig has been published successfully!");
        navigate("/browse-gigs");
      } else {
        alert("Your gig has been saved as a draft!");
        navigate("/my-gigs");
      }
    } catch (err) {
      setError(
        err.message ||
          "Unable to save the gig. Check whether Spring Boot is running."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="gig-form-page">
        <div className="gig-form-card">
          <h2>Login required</h2>
          <p>Please log in before creating a gig.</p>

          <Link to="/login" className="gig-submit-button">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (String(user.role || "").toUpperCase() !== "CLIENT") {
    return (
      <div className="gig-form-page">
        <div className="gig-form-card">
          <h2>Client access required</h2>
          <p>Only client accounts can create and publish gigs.</p>

          <Link to="/browse-gigs" className="gig-submit-button">
            Browse Available Gigs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="gig-form-page">
      <header className="gig-form-navbar">
        <Link to="/" className="gig-form-logo">
          Gig<span>Connect</span>
        </Link>

        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/browse-gigs">Browse Gigs</Link>
          <Link to="/my-gigs">My Gigs</Link>
        </nav>
      </header>

      <main className="gig-form-content">
        <Link to="/dashboard" className="gig-back-link">
          ← Back to Dashboard
        </Link>

        <div className="gig-form-heading">
          <span>CLIENT WORKSPACE</span>
          <h1>Create a new gig</h1>
          <p>
            Describe your project, set your budget, and connect with
            the right freelancers.
          </p>
        </div>

        <form
          className="gig-form-card"
          onSubmit={(event) => handleSubmit(event, true)}
        >
          {error && (
            <div className="gig-form-error" role="alert">
              {error}
            </div>
          )}

          <div className="gig-form-section-title">
            <span>01</span>

            <div>
              <h2>Project details</h2>
              <p>Tell freelancers what you need.</p>
            </div>
          </div>

          <div className="gig-form-field">
            <label htmlFor="title">Gig title *</label>

            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Build a responsive business website"
              minLength={5}
              maxLength={150}
              required
            />
          </div>

          <div className="gig-form-field">
            <label htmlFor="description">
              Project description *
            </label>

            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Explain the project, expected deliverables, and requirements..."
              rows={6}
              minLength={5}
              maxLength={2000}
              required
            />

            <small>
              {form.description.length}/2000 characters
            </small>
          </div>

          <div className="gig-form-two-columns">
            <div className="gig-form-field">
              <label htmlFor="category">Category *</label>

              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option>Web Development</option>
                <option>Mobile Development</option>
                <option>UI/UX Design</option>
                <option>Graphic Design</option>
                <option>Writing &amp; Content</option>
                <option>Data &amp; Technology</option>
                <option>Digital Marketing</option>
                <option>Other</option>
              </select>
            </div>

            <div className="gig-form-field">
              <label htmlFor="experience">
                Experience level *
              </label>

              <select
                id="experience"
                name="experience"
                value={form.experience}
                onChange={handleChange}
                required
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Expert</option>
              </select>
            </div>
          </div>

          <div className="gig-form-field">
            <label htmlFor="skills">Required skills</label>

            <input
              id="skills"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="React, JavaScript, CSS"
              maxLength={300}
            />

            <small>Separate skills with commas.</small>
          </div>

          <div className="gig-form-section-title gig-form-second-section">
            <span>02</span>

            <div>
              <h2>Budget and timeline</h2>
              <p>
                Set your project budget and expected deadline.
              </p>
            </div>
          </div>

          <div className="gig-form-two-columns">
            <div className="gig-form-field">
              <label htmlFor="minBudget">
                Minimum budget (₹) *
              </label>

              <input
                id="minBudget"
                name="minBudget"
                type="number"
                min="1"
                step="1"
                value={form.minBudget}
                onChange={handleChange}
                placeholder="5000"
                required
              />
            </div>

            <div className="gig-form-field">
              <label htmlFor="maxBudget">
                Maximum budget (₹) *
              </label>

              <input
                id="maxBudget"
                name="maxBudget"
                type="number"
                min="1"
                step="1"
                value={form.maxBudget}
                onChange={handleChange}
                placeholder="10000"
                required
              />
            </div>
          </div>

          <div className="gig-form-field">
            <label htmlFor="deadline">Project deadline</label>

            <input
              id="deadline"
              name="deadline"
              type="date"
              min={new Date().toLocaleDateString("en-CA")}
              value={form.deadline}
              onChange={handleChange}
            />

            <small>
              Required when publishing; optional for drafts.
            </small>
          </div>

          <div className="gig-form-submit-area">
            <div className="gig-form-submit-info">
              <h3>Ready to continue?</h3>

              <p>
                Save your progress and finish later, or publish your
                gig to make it available to freelancers.
              </p>
            </div>

            <div className="gig-form-submit-actions">
              <button
                type="button"
                className="gig-draft-button"
                onClick={() => handleSubmit(null, false)}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save as Draft"}
              </button>

              <button
                type="submit"
                className="gig-submit-button"
                disabled={loading}
              >
                {loading ? "Publishing..." : "Publish Gig →"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CreateGig;