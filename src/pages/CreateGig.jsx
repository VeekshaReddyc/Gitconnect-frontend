import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./CreateGig.css";

const API_URL = "https://gigconnect-backend-in1g.onrender.com/api/gigs";

const initialForm = {
  title: "",
  description: "",
  category: "Web Development",
  skills: "",
  minBudget: "",
  maxBudget: "",
  deadline: "",
  experience: "Beginner",
};

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
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

function CreateGig() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const user = getUser();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [loadingGig, setLoadingGig] = useState(isEditMode);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditMode || !user?.id) {
      setLoadingGig(false);
      return;
    }

    let cancelled = false;

    async function loadDraft() {
      setLoadingGig(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/client/${encodeURIComponent(user.id)}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        const gigs = await readResponse(response);

        if (!Array.isArray(gigs)) {
          throw new Error(
            "The server returned an unexpected gigs response."
          );
        }

        const gig = gigs.find(
          (item) => String(item.id) === String(id)
        );

        if (!gig) {
          throw new Error(
            "Draft not found. Make sure this gig belongs to your account."
          );
        }

        if (String(gig.status || "").toUpperCase() !== "DRAFT") {
          throw new Error("Only draft gigs can be edited.");
        }

        if (!cancelled) {
          setForm({
            title: gig.title || "",
            description: gig.description || "",
            category: gig.category || "Web Development",
            skills: gig.skills || "",
            minBudget: gig.minBudget ?? "",
            maxBudget: gig.maxBudget ?? "",
            deadline: gig.deadline
              ? String(gig.deadline).slice(0, 10)
              : "",
            experience: gig.experience || "Beginner",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load this draft.");
        }
      } finally {
        if (!cancelled) {
          setLoadingGig(false);
        }
      }
    }

    loadDraft();

    return () => {
      cancelled = true;
    };
  }, [id, isEditMode, user?.id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event, publish) {
    if (event) event.preventDefault();
    if (loading || loadingGig) return;

    setError("");

    if (!user?.id) {
      setError("Please sign in again before continuing.");
      return;
    }

    if (String(user.role || "").toUpperCase() !== "CLIENT") {
      setError("Only clients can create or edit gigs.");
      return;
    }

    const title = form.title.trim();
    const description = form.description.trim();
    const skills = form.skills.trim();
    const minBudget = Number(form.minBudget);
    const maxBudget = Number(form.maxBudget);

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

    if (publish) {
      if (title.length < 5) {
        setError("The title must contain at least 5 characters.");
        return;
      }

      if (description.length < 20) {
        setError("The description must contain at least 20 characters.");
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

      if (Number.isNaN(deadline.getTime()) || deadline < today) {
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

    const gigData = {
      title,
      description,
      category: form.category,
      skills,
      minBudget,
      maxBudget,
      deadline: form.deadline || null,
      experience: form.experience,
    };

    setLoading(true);

    try {
      let gigId = id;

      if (isEditMode) {
        const updateResponse = await fetch(
          `${API_URL}/${encodeURIComponent(
            id
          )}?clientId=${encodeURIComponent(user.id)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(gigData),
          }
        );

        const updatedGig = await readResponse(updateResponse);
        gigId = updatedGig.id ?? id;
      } else {
        const createResponse = await fetch(
          `${API_URL}?clientId=${encodeURIComponent(user.id)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(gigData),
          }
        );

        const createdGig = await readResponse(createResponse);

        if (!createdGig.id) {
          throw new Error(
            "The server did not return the new gig ID."
          );
        }

        gigId = createdGig.id;
      }

      if (publish) {
        const publishResponse = await fetch(
          `${API_URL}/${encodeURIComponent(
            gigId
          )}/publish?clientId=${encodeURIComponent(user.id)}`,
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
        alert(
          isEditMode
            ? "Your draft has been updated successfully!"
            : "Your gig has been saved as a draft!"
        );

        navigate("/my-gigs");
      }
    } catch (err) {
      setError(
        err.message ||
          "Unable to save the gig. Please check the backend connection."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <main className="gig-access-page">
        <section className="gig-access-card">
          <p className="gig-access-eyebrow">GIGCONNECT</p>
          <h1>Sign in required</h1>
          <p>
            Sign in to create and manage your project listings.
          </p>

          <Link to="/login" className="gig-primary-button">
            Go to Sign In
          </Link>
        </section>
      </main>
    );
  }

  if (String(user.role || "").toUpperCase() !== "CLIENT") {
    return (
      <main className="gig-access-page">
        <section className="gig-access-card">
          <p className="gig-access-eyebrow">GIGCONNECT</p>
          <h1>Client access required</h1>
          <p>Only clients can create or edit gigs.</p>

          <Link
            to="/browse-gigs"
            className="gig-primary-button"
          >
            Browse Gigs
          </Link>
        </section>
      </main>
    );
  }

  if (loadingGig) {
    return (
      <main className="gig-access-page">
        <section className="gig-loading-card">
          <span
            className="gig-spinner"
            aria-hidden="true"
          />
          <h2>Loading your draft</h2>
          <p>
            Please wait while we retrieve your gig details.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="gig-page">
      <div className="gig-container">

        <nav
          className="gig-breadcrumb"
          aria-label="Breadcrumb"
        >
          <Link to="/my-gigs">My Gigs</Link>
          <span aria-hidden="true">/</span>
          <span>
            {isEditMode ? "Edit draft" : "Create gig"}
          </span>
        </nav>

        <header className="gig-page-header">
          <div>
            <p className="gig-eyebrow">
              CLIENT WORKSPACE
            </p>

            <h1>
              {isEditMode
                ? "Edit your gig"
                : "Create a gig"}
            </h1>

            <p className="gig-page-description">
              {isEditMode
                ? "Update your project details before publishing."
                : "Describe your project and connect with the right freelancers."}
            </p>
          </div>

          <Link
            to="/my-gigs"
            className="gig-back-button"
          >
            <span aria-hidden="true">←</span>
            My Gigs
          </Link>
        </header>

        {error && (
          <div className="gig-error" role="alert">
            <span
              className="gig-error-icon"
              aria-hidden="true"
            >
              !
            </span>

            <p>{error}</p>
          </div>
        )}

        <form
          className="gig-form-card"
          onSubmit={(event) =>
            handleSubmit(event, true)
          }
        >

          {/* ================= SECTION 01 ================= */}

          <section className="gig-form-section">
            <div className="gig-section-header">
              <span className="gig-section-number">
                01
              </span>

              <div>
                <h2>Project details</h2>
                <p>
                  Start with the essentials of your project.
                </p>
              </div>
            </div>

            <div className="gig-field">
              <label htmlFor="title">
                Gig title{" "}
                <span className="gig-required">*</span>
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                maxLength={150}
                required
                placeholder="e.g. Build a responsive business website"
              />

              <p className="gig-character-count">
                {form.title.length}/150
              </p>
            </div>

            <div className="gig-field">
              <label htmlFor="description">
                Project description{" "}
                <span className="gig-required">*</span>
              </label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                maxLength={2000}
                required
                rows={6}
                placeholder="Explain the work, expected deliverables, and important requirements..."
              />

              <p className="gig-field-hint">
                Include enough detail for freelancers to
                understand the work.
              </p>

              <p className="gig-character-count">
                {form.description.length}/2000
              </p>
            </div>

            <div className="gig-field-grid">
              <div className="gig-field">
                <label htmlFor="category">
                  Category{" "}
                  <span className="gig-required">*</span>
                </label>

                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option>Web Development</option>
                  <option>Mobile Development</option>
                  <option>UI/UX Design</option>
                  <option>Graphic Design</option>
                  <option>Content Writing</option>
                  <option>Digital Marketing</option>
                  <option>Data Science</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="gig-field">
                <label htmlFor="experience">
                  Experience level
                </label>

                <select
                  id="experience"
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Expert</option>
                </select>
              </div>
            </div>
          </section>

          <div className="gig-section-divider" />

          {/* ================= SECTION 02 ================= */}

          <section className="gig-form-section">
            <div className="gig-section-header">
              <span className="gig-section-number">
                02
              </span>

              <div>
                <h2>Skills and budget</h2>
                <p>
                  Set the requirements and payment range.
                </p>
              </div>
            </div>

            <div className="gig-field">
              <label htmlFor="skills">
                Required skills{" "}
                <span className="gig-required">*</span>
              </label>

              <input
                id="skills"
                name="skills"
                type="text"
                value={form.skills}
                onChange={handleChange}
                placeholder="React, Java, SQL, UI design"
              />

              <p className="gig-field-hint">
                Separate each skill with a comma.
              </p>
            </div>

            <div className="gig-field-grid">
              <div className="gig-field">
                <label htmlFor="minBudget">
                  Minimum budget{" "}
                  <span className="gig-required">*</span>
                </label>

                <div className="gig-currency-input">
                  <span aria-hidden="true">₹</span>

                  <input
                    id="minBudget"
                    name="minBudget"
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.minBudget}
                    onChange={handleChange}
                    required
                    placeholder="5,000"
                  />
                </div>
              </div>

              <div className="gig-field">
                <label htmlFor="maxBudget">
                  Maximum budget{" "}
                  <span className="gig-required">*</span>
                </label>

                <div className="gig-currency-input">
                  <span aria-hidden="true">₹</span>

                  <input
                    id="maxBudget"
                    name="maxBudget"
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.maxBudget}
                    onChange={handleChange}
                    required
                    placeholder="15,000"
                  />
                </div>
              </div>
            </div>

            <div className="gig-field">
              <label htmlFor="deadline">
                Project deadline
              </label>

              <input
                id="deadline"
                name="deadline"
                type="date"
                value={form.deadline}
                onChange={handleChange}
                min={new Date().toLocaleDateString(
                  "en-CA"
                )}
              />

              <p className="gig-field-hint">
                A deadline is required before you can publish.
              </p>
            </div>
          </section>

          {/* ================= PUBLISH NOTE ================= */}

          <div className="gig-publish-note">
            <span
              className="gig-publish-note-mark"
              aria-hidden="true"
            >
              i
            </span>

            <p>
              <strong>Before publishing</strong>
              <span>
                Make sure your description, required skills,
                budget, and deadline are accurate. You can
                save your progress as a draft.
              </span>
            </p>
          </div>

          {/* ================= FOOTER ================= */}

          <footer className="gig-form-footer">
            <button
              type="button"
              className="gig-secondary-button"
              disabled={loading}
              onClick={() =>
                handleSubmit(null, false)
              }
            >
              {loading
                ? "Saving..."
                : isEditMode
                  ? "Save draft changes"
                  : "Save as draft"}
            </button>

            <button
              type="submit"
              className="gig-primary-button"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isEditMode
                  ? "Update & publish"
                  : "Publish gig"}

              {!loading && (
                <span aria-hidden="true">→</span>
              )}
            </button>
          </footer>

        </form>

        <p className="gig-page-footer">
          GigConnect <span>·</span> Create opportunities.
          Find the right talent.
        </p>

      </div>
    </main>
  );
}

export default CreateGig;