// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import UserProfilePage from "./pages/UserProfilePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

import NotFoundPage from "./pages/NotFound.jsx";
import UnauthorizedPage from "./pages/Unauthorized.jsx";

import PublicHomePage from "./pages/public/PublicHomePage.jsx";
import ConferenceList from "./pages/author/ConferenceList.jsx";
import ConferenceDetail from "./pages/author/ConferenceDetail.jsx";
import PublicProgram from "./pages/public/PublicProgram";
import PublicHome from "./pages/public/PublicHome";
import PublicCfp from "./pages/public/PublicCfp";
import PublicAcceptedPapers from "./pages/public/PublicAcceptedPapers";

import AuthorDashboard from "./pages/author/AuthorDashboard.jsx";
import AuthorSubmissionsPage from "./pages/author/AuthorSubmissionsPage.jsx";
import AuthorSubmissionFormPage from "./pages/author/AuthorSubmissionFormPage.jsx";

import ReviewerDashboard from "./pages/reviewer/ReviewerDashboard.jsx";
import ChairDashboard from "./pages/chair/ChairDashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminConferences from "./pages/admin/AdminConferences";
import AdminConferenceEdit from "./pages/admin/AdminConferenceEdit";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public portal */}
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/program" element={<PublicProgram />} />
        <Route path="/conferences" element={<ConferenceList />} />
        <Route path="/conferences/:id" element={<ConferenceDetail />} />
        <Route path="/publichome" element={<PublicHome />} />
        <Route path="/cfp" element={<PublicCfp />} />
        <Route path="/accepted-papers" element={<PublicAcceptedPapers />} />


        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* User Profile */}
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Author */}
        <Route path="/author" element={<ConferenceList />} />
        <Route path="/author/dashboard" element={<AuthorDashboard />} />
        <Route path="/author/submissions" element={<AuthorSubmissionsPage />} />
        <Route path="/author/submit" element={<AuthorSubmissionFormPage />} />

        {/* Reviewer / Chair / Admin */}
        <Route path="/reviewer" element={<ReviewerDashboard />} />
        <Route path="/chair" element={<ChairDashboard />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole={"ADMIN"}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/conferences"
          element={
            <ProtectedRoute requiredRole={"ADMIN"}>
              <AdminConferences />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/conferences/:id/edit"
          element={
            <ProtectedRoute requiredRole={"ADMIN"}>
              <AdminConferenceEdit />
            </ProtectedRoute>
          }
        />

        {/* Error pages */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
