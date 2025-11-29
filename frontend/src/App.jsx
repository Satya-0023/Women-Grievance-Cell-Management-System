import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

import Loader from "./components/Loader";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import TrackGrievance from "./components/TrackGrievance";
import SubmitGrievance from "./components/SubmitGrievance";
import About from "./components/About";
import Faq from "./components/Faq";
import CommitteeMember from "./components/CommitteeMember"; // Renamed from OfficeBearer
import Admin from "./components/Admin";
import Register from "./components/Register";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import GrievanceHistory from "./components/GrievanceHistory";
import Profile from "./components/Profile"; // Import the new Profile component

// Inactivity Logout Hook
const useInactivityTimeout = (timeout = 180000) => { // Corrected to 3 minutes (180,000 ms)
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.clear();
    navigate("/login", { state: { fromInactivity: true } });
    toast.error("You have been logged out due to inactivity.", { duration: 5000 });
  }, [navigate]);

  useEffect(() => {
    let timer;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, timeout);
    };

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer(); // Initialize timer

    return () => {
      clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [logout, timeout]);
};


function AppContent() {
  const location = useLocation();
  useInactivityTimeout(); // Apply the inactivity hook globally

  const hideNavbar = [
    "/login",
    "/register",
    "/forgot-password",
    // "/committee-member", // Navbar should be visible for committee members
    "/admin"
  ].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<Faq />} />

        {/* Protected Routes */}
        <Route
          path="/home"
          element={<ProtectedRoute allowed={['can_complain']}><Home /></ProtectedRoute>}
        />
        <Route
          path="/track-grievance"
          element={<ProtectedRoute allowed={['can_complain', 'is_committee_member', 'is_admin']}><TrackGrievance /></ProtectedRoute>}
        />
        <Route
          path="/submit-grievance"
          element={<ProtectedRoute allowed={['can_complain']}><SubmitGrievance /></ProtectedRoute>}
        />
        <Route
          path="/grievance-history"
          element={<ProtectedRoute allowed={['can_complain']}><GrievanceHistory /></ProtectedRoute>}
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowed={['can_complain', 'is_committee_member', 'is_admin']}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/committee-member"
          element={<ProtectedRoute allowed={['is_committee_member']}><CommitteeMember /></ProtectedRoute>}
        />
        <Route
          path="/admin"
          element={<ProtectedRoute allowed={['is_admin']}><Admin /></ProtectedRoute>}
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500); // Reduced loader time
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
    <Router>
      <AppContent />
    </Router>
  );
}