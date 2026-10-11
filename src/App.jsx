
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateGig from "./pages/CreateGig";
import BrowseGigs from "./pages/BrowseGigs";
import MyGigs from "./pages/MyGigs";
import FreelancerMyGigs from "./pages/FreelancerMyGigs";
import Notifications from "./Notifications";
import PaymentHistory from "./PaymentHistory";
import Profile from "./Profile";
import Navbar from "./components/Navbar";

// Read the logged-in user safely.
function getLoggedInUser() {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Unable to read logged-in user:", error);
    return null;
  }
}

// Protect routes that require login.
function ProtectedRoute({ children }) {
  const user = getLoggedInUser();

  return user ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace />
  );
}

// Shared layout for protected pages.
function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <>
        <Navbar />
        <Notifications />
        {children}
      </>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Public routes */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        {/* Create a new gig */}
        <Route
          path="/create-gig"
          element={
            <ProtectedLayout>
              <CreateGig />
            </ProtectedLayout>
          }
        />

        {/* Edit an existing saved draft */}
        <Route
          path="/edit-gig/:id"
          element={
            <ProtectedLayout>
              <CreateGig />
            </ProtectedLayout>
          }
        />

        {/* Browse gigs */}
        <Route
          path="/browse-gigs"
          element={
            <ProtectedLayout>
              <BrowseGigs />
            </ProtectedLayout>
          }
        />

        {/* Client's gigs and saved drafts */}
        <Route
          path="/my-gigs"
          element={
            <ProtectedLayout>
              <MyGigs />
            </ProtectedLayout>
          }
        />

        {/* Freelancer's gigs */}
        <Route
          path="/freelancer-my-gigs"
          element={
            <ProtectedLayout>
              <FreelancerMyGigs />
            </ProtectedLayout>
          }
        />

        {/* Payment history */}
        <Route
          path="/payment-history"
          element={
            <ProtectedLayout>
              <PaymentHistory user={getLoggedInUser()} />
            </ProtectedLayout>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedLayout>
              <Profile />
            </ProtectedLayout>
          }
        />

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

