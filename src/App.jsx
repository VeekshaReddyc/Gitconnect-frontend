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
            <ProtectedRoute>
              <>
                <Navbar />
                <Notifications />
                <Dashboard />
              </>
            </ProtectedRoute>
          }
        />

        {/* Create Gig */}
        <Route
          path="/create-gig"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Notifications />
                <CreateGig />
              </>
            </ProtectedRoute>
          }
        />

        {/* Browse Gigs */}
        <Route
          path="/browse-gigs"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Notifications />
                <BrowseGigs />
              </>
            </ProtectedRoute>
          }
        />

        {/* My Gigs */}
        <Route
          path="/my-gigs"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Notifications />
                <MyGigs />
              </>
            </ProtectedRoute>
          }
        />

        {/* Freelancer My Gigs */}
        <Route
          path="/freelancer-my-gigs"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Notifications />
                <FreelancerMyGigs />
              </>
            </ProtectedRoute>
          }
        />

        {/* Payment History */}
        <Route
          path="/payment-history"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Notifications />
                <PaymentHistory user={getLoggedInUser()} />
              </>
            </ProtectedRoute>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Notifications />
                <Profile />
              </>
            </ProtectedRoute>
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