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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Navbar />
              <Notifications />
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-gig"
          element={
            <ProtectedRoute>
              <Navbar />
              <Notifications />
              <CreateGig />
            </ProtectedRoute>
          }
        />

        <Route
          path="/browse-gigs"
          element={
            <ProtectedRoute>
              <Navbar />
              <Notifications />
              <BrowseGigs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-gigs"
          element={
            <ProtectedRoute>
              <Navbar />
              <Notifications />
              <MyGigs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/freelancer-my-gigs"
          element={
            <ProtectedRoute>
              <Navbar />
              <Notifications />
              <FreelancerMyGigs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-history"
          element={
            <ProtectedRoute>
              <Navbar />
              <Notifications />
              <PaymentHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Navbar />
              <Notifications />
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedRoute({ children }) {
  let user = null;

  try {
    const storedUser = localStorage.getItem("user");
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default App;