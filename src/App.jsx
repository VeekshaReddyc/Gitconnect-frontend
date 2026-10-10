import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
const storedUser = localStorage.getItem("user");

let user = null;

try {
user = storedUser ? JSON.parse(storedUser) : null;
} catch {
user = null;
}

const requireLogin = (element) =>
user ? element : <Navigate to="/login" replace />;

return ( <BrowserRouter> <Routes>
<Route path="/" element={<Navigate to="/login" replace />} />

```
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    <Route
      path="/dashboard"
      element={
        requireLogin(
          <>
            <Navbar />
            <Notifications />
            <Dashboard />
          </>
        )
      }
    />

    <Route
      path="/create-gig"
      element={requireLogin(
        <>
          <Navbar />
          <Notifications />
          <CreateGig />
        </>
      )}
    />

    <Route
      path="/browse-gigs"
      element={requireLogin(
        <>
          <Navbar />
          <Notifications />
          <BrowseGigs />
        </>
      )}
    />

    <Route
      path="/my-gigs"
      element={requireLogin(
        <>
          <Navbar />
          <Notifications />
          <MyGigs />
        </>
      )}
    />

    <Route
      path="/freelancer-my-gigs"
      element={requireLogin(
        <>
          <Navbar />
          <Notifications />
          <FreelancerMyGigs />
        </>
      )}
    />

    <Route
      path="/payment-history"
      element={requireLogin(
        <>
          <Navbar />
          <Notifications />
          <PaymentHistory user={user} />
        </>
      )}
    />

    <Route
      path="/profile"
      element={requireLogin(
        <>
          <Navbar />
          <Notifications />
          <Profile />
        </>
      )}
    />

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
</BrowserRouter>


);
}

export default App;
