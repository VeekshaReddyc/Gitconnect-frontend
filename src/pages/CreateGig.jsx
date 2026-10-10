import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8081/api/gigs";

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

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!user || !user.id) {
      setError("Please log in again before creating a gig.");
      return;
    }

    if (user.role !== "CLIENT") {
      setError("Only clients can create and publish gigs.");
      return;
    }

    const minBudget = Number(form.minBudget);
    const maxBudget = Number(form.maxBudget);

    if (minBudget <= 0 || maxBudget < minBudget) {
      setError("Enter a valid budget. Maximum budget must be at least the minimum.");
      return;
    }

    if (new Date(form.deadline + "T00:00:00") < new Date(new Date().toDateString())) {
      setError("The deadline cannot be in the past.");
      return;
    }

    setLoading(true);

    let createdGigId = null;

    try {
      // 1. Create the gig.
      const createResponse = await fetch(
        `${API_URL}?clientId=${encodeURIComponent(user.id)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category,
            skills: form.skills.trim(),
            minBudget,
            maxBudget,
            deadline: form.deadline,
            experience: form.experience,
          }),
        }
      );

      const createdGig = await createResponse.json().catch(() => ({}));

      if (!createResponse.ok) {
        throw new Error(
          createdGig.message ||
            createdGig.error ||
            "Unable to create the gig."
        );
      }

      createdGigId = createdGig.id;

      if (!createdGigId) {
        throw new Error(
          "The gig was created, but the server did not return its ID. Check your backend response."
        );
      }

      // 2. Publish the newly created gig.
      const publishResponse = await fetch(
        `${API_URL}/${createdGigId}/publish?clientId=${encodeURIComponent(user.id)}`,
        {
          method: "PUT",
        }
      );

      if (!publishResponse.ok) {
        const publishError = await publishResponse.json().catch(() => ({}));

        throw new Error(
          publishError.message ||
            publishError.error ||
            `Gig created, but publishing failed. Gig ID: ${createdGigId}`
        );
      }

      alert("Your gig has been published successfully!");

      navigate("/browse-gigs");
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the backend. Check that Spring Boot is running."
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

  if (user.role !== "CLIENT") {
    return (
      <div className="gig-form-page">
        <div className="gig-form-card">
          <h2>Client access required</h2>
          <p>Only client accounts can publish gigs.</p>
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
            Describe your project, set your budget, and connect with the right
            freelancers.
          </p>
        </div>

        <form className="gig-form-card" onSubmit={handleSubmit}>
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
            <label htmlFor="description">Project description *</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Explain the project, expected deliverables, and requirements..."
              rows={6}
              minLength={20}
              maxLength={2000}
              required
            />
            <small>{form.description.length}/2000 characters</small>
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
                <option>Writing & Content</option>
                <option>Data & Technology</option>
                <option>Digital Marketing</option>
                <option>Other</option>
              </select>
            </div>

            <div className="gig-form-field">
              <label htmlFor="experience">Experience level *</label>
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
            <label htmlFor="skills">Required skills *</label>
            <input
              id="skills"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="React, JavaScript, CSS"
              maxLength={300}
              required
            />
            <small>Separate skills with commas.</small>
          </div>

          <div className="gig-form-section-title gig-form-second-section">
            <span>02</span>
            <div>
              <h2>Budget and timeline</h2>
              <p>Set your project budget and expected deadline.</p>
            </div>
          </div>

          <div className="gig-form-two-columns">
            <div className="gig-form-field">
              <label htmlFor="minBudget">Minimum budget (₹) *</label>
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
              <label htmlFor="maxBudget">Maximum budget (₹) *</label>
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
            <label htmlFor="deadline">Project deadline *</label>
            <input
              id="deadline"
              name="deadline"
              type="date"
              min={new Date().toLocaleDateString("en-CA")}
              value={form.deadline}
              onChange={handleChange}
              required
            />
          </div>

          <div className="gig-form-submit-area">
            <p>
              Please review your project details before publishing. Your gig
              will become visible to freelancers.
            </p>

            <button
              type="submit"
              className="gig-submit-button"
              disabled={loading}
            >
              {loading ? "Publishing your gig..." : "Publish Gig →"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CreateGig;