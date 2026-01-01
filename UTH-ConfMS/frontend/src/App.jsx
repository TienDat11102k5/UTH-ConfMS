// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// --- Auth & Public Imports ---
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import VerifyOtpPage from "./pages/VerifyOtpPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import UserProfilePage from "./pages/UserProfilePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import NotFoundPage from "./pages/NotFound.jsx";
import UnauthorizedPage from "./pages/Unauthorized.jsx";
import PublicHomePage from "./pages/public/PublicHomePage.jsx";
import PublicProgram from "./pages/public/PublicProgram";
import PublicHome from "./pages/public/PublicHome";
import PublicCfp from "./pages/public/PublicCfp";
import PublicAcceptedPapers from "./pages/public/PublicAcceptedPapers";
import PublicProceedings from "./pages/public/PublicProceedings";

// --- Author Imports ---
import ConferenceList from "./pages/author/ConferenceList.jsx";
import ConferenceDetail from "./pages/author/ConferenceDetail.jsx";
import AuthorDashboard from "./pages/author/AuthorDashboard.jsx";
import AuthorSubmissionListPage from "./pages/author/AuthorSubmissionListPage.jsx";
import AuthorSubmissionEditPage from "./pages/author/AuthorSubmissionEditPage.jsx";
import AuthorSubmissionDetail from "./pages/author/AuthorSubmissionDetail.jsx";
import AuthorPaperReviews from "./pages/author/AuthorPaperReviews.jsx";
import AuthorCameraReadyPage from "./pages/author/AuthorCameraReadyPage.jsx";
import AuthorCameraReadyList from "./pages/author/AuthorCameraReadyList.jsx";
import AuthorNewSubmissionPage from "./pages/author/AuthorNewSubmissionPage.jsx";

// --- Reviewer Imports ---
import ReviewerDashboard from "./pages/reviewer/ReviewerDashboard.jsx";
import ReviewerAssignments from "./pages/reviewer/ReviewerAssignments.jsx";
import ReviewerReviewForm from "./pages/reviewer/ReviewerReviewForm.jsx";
import ReviewerCOI from "./pages/reviewer/ReviewerCOI.jsx";
import ReviewerDiscussions from "./pages/reviewer/ReviewerDiscussions.jsx";

// --- Chair Imports ---
import ChairDashboard from "./pages/chair/ChairDashboard.jsx";
import ChairAssignmentManagement from "./pages/chair/ChairAssignmentManagement.jsx";
import ChairDecisionPage from "./pages/chair/ChairDecisionPage.jsx";
import ChairProgressTracking from "./pages/chair/ChairProgressTracking.jsx";
import ChairReports from "./pages/chair/ChairReports.jsx";
// Đã thêm 2 import bị thiếu ở đây
import ChairConferenceManager from "./pages/chair/ChairConferenceManager.jsx";
import ChairConferenceEdit from "./pages/chair/ChairConferenceEdit.jsx";
import ChairConferenceCreate from "./pages/chair/ChairConferenceCreate.jsx";
import ChairConferenceSubmissions from "./pages/chair/ChairConferenceSubmissions.jsx";
import ChairProceedingsPreview from "./pages/chair/ChairProceedingsPreview.jsx";

// --- Admin Imports ---
import AdminDashboardOverview from "./pages/admin/AdminDashboardOverview.jsx";
import AdminConferences from "./pages/admin/AdminConferences.jsx";
import AdminConferenceEdit from "./pages/admin/AdminConferenceEdit.jsx";
import AdminConferenceCreate from "./pages/admin/AdminConferenceCreate.jsx";
import AdminConferenceSubmissions from "./pages/admin/AdminConferenceSubmissions.jsx";
import AdminUserEdit from "./pages/admin/AdminUserEdit.jsx";
import AdminUserCreate from "./pages/admin/AdminUserCreate.jsx";
import TenantManagement from "./pages/admin/TenantManagement.jsx";
import SmtpConfigPage from "./pages/admin/SmtpConfigPage.jsx";
import AuditLogPage from "./pages/admin/AuditLogPage.jsx";
import BackupPage from "./pages/admin/BackupPage.jsx";
import AiGovernancePage from "./pages/admin/AiGovernancePage.jsx";
import RbacManagement from "./pages/admin/RbacManagement.jsx";
import AdminLoginPage from "./pages/admin/AdminLoginPage.jsx";

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
        <Route
          path="/author/camera-ready"
          element={
            <ProtectedRoute>
              <AuthorCameraReadyList />
            </ProtectedRoute>
          }
        />
        <Route path="/accepted-papers" element={<PublicAcceptedPapers />} />
        <Route path="/proceedings" element={<PublicProceedings />} />
        <Route path="/proceedings/:conferenceId" element={<PublicProceedings />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* User Profile */}
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/history" element={<HistoryPage />} />

        {/* Author */}
        <Route path="/author" element={<ConferenceList />} />
        <Route
          path="/author/dashboard"
          element={
            <ProtectedRoute>
              <AuthorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/author/submissions"
          element={
            <ProtectedRoute>
              <AuthorSubmissionListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/author/submissions/:id"
          element={
            <ProtectedRoute>
              <AuthorSubmissionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/author/submissions/:id/edit"
          element={
            <ProtectedRoute>
              <AuthorSubmissionEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/author/submissions/:paperId/reviews"
          element={
            <ProtectedRoute>
              <AuthorPaperReviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/author/submissions/camera-ready"
          element={
            <ProtectedRoute>
              <AuthorCameraReadyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/author/submissions/:id/camera-ready"
          element={
            <ProtectedRoute>
              <AuthorCameraReadyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/author/submissions/new"
          element={
            <ProtectedRoute>
              <AuthorNewSubmissionPage />
            </ProtectedRoute>
          }
        />
        {/* Giữ đường dẫn cũ để tránh lỗi link cũ */}
        <Route
          path="/author/submit"
          element={
            <ProtectedRoute>
              <AuthorNewSubmissionPage />
            </ProtectedRoute>
          }
        />

        {/* Reviewer / PC */}
        <Route
          path="/reviewer"
          element={
            <ProtectedRoute requiredRole={["REVIEWER", "PC"]}>
              <ReviewerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviewer/assignments"
          element={
            <ProtectedRoute requiredRole={["REVIEWER", "PC"]}>
              <ReviewerAssignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviewer/review/:assignmentId"
          element={
            <ProtectedRoute requiredRole={["REVIEWER", "PC"]}>
              <ReviewerReviewForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviewer/coi"
          element={
            <ProtectedRoute requiredRole={["REVIEWER", "PC"]}>
              <ReviewerCOI />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviewer/discussions"
          element={
            <ProtectedRoute requiredRole={["REVIEWER", "PC"]}>
              <ReviewerDiscussions />
            </ProtectedRoute>
          }
        />

        {/* Chair */}
        <Route
          path="/chair"
          element={
            <ProtectedRoute requiredRole={["CHAIR", "TRACK_CHAIR"]}>
              <ChairDashboard />
            </ProtectedRoute>
          }
        />

        {/* --- ĐÃ THÊM CÁC ROUTE QUẢN LÝ CONFERENCE CỦA CHAIR VÀO ĐÂY --- */}
        <Route
          path="/chair/conferences"
          element={
            <ProtectedRoute requiredRole={["CHAIR", "TRACK_CHAIR"]}>
              <ChairConferenceManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chair/conferences/create"
          element={
            <ProtectedRoute requiredRole={["CHAIR", "TRACK_CHAIR"]}>
              <ChairConferenceCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chair/conferences/:id/edit"
          element={
            <ProtectedRoute requiredRole={["CHAIR", "TRACK_CHAIR"]}>
              <ChairConferenceEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chair/conferences/:conferenceId/submissions"
          element={
            <ProtectedRoute requiredRole={["CHAIR", "TRACK_CHAIR"]}>
              <ChairConferenceSubmissions />
            </ProtectedRoute>
          }
        />
        {/* ----------------------------------------------------------- */}

        <Route
          path="/chair/assignments"
          element={
            <ProtectedRoute requiredRole={["CHAIR", "TRACK_CHAIR"]}>
              <ChairAssignmentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chair/decisions"
          element={
            <ProtectedRoute requiredRole={["CHAIR", "TRACK_CHAIR"]}>
              <ChairDecisionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chair/progress"
          element={
            <ProtectedRoute requiredRole={["CHAIR", "TRACK_CHAIR"]}>
              <ChairProgressTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chair/reports"
          element={
            <ProtectedRoute requiredRole={["CHAIR", "TRACK_CHAIR"]}>
              <ChairReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chair/proceedings"
          element={
            <ProtectedRoute requiredRole={["CHAIR", "TRACK_CHAIR"]}>
              <ChairProceedingsPreview />
            </ProtectedRoute>
          }
        />

        {/* --- ADMIN ROUTES --- */}

        {/* 1. Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole={"ADMIN"}>
              <AdminDashboardOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole={"ADMIN"}>
              <AdminDashboardOverview />
            </ProtectedRoute>
          }
        />

        {/* 2. Quản lý Hội nghị */}
        <Route
          path="/admin/conferences"
          element={
            <ProtectedRoute requiredRole={"ADMIN"}>
              <AdminConferences />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/conferences/create"
          element={
            <ProtectedRoute requiredRole={"ADMIN"}>
              <AdminConferenceCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/conferences/:id/edit"
          element={
            <ProtectedRoute requiredRole={["ADMIN", "CHAIR", "TRACK_CHAIR"]}>
              <AdminConferenceEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/conferences/:conferenceId/submissions"
          element={
            <ProtectedRoute requiredRole={"ADMIN"}>
              <AdminConferenceSubmissions />
            </ProtectedRoute>
          }
        />

        {/* 3. Quản lý Users (TenantManagement) */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole={"ADMIN"}>
              <TenantManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users/:id/edit"
          element={
            <ProtectedRoute requiredRole={"ADMIN"}>
              <AdminUserEdit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users/create"
          element={
            <ProtectedRoute requiredRole={"ADMIN"}>
              <AdminUserCreate />
            </ProtectedRoute>
          }
        />

        {/* 4. Cấu hình Email */}
        <Route
          path="/admin/email-settings"
          element={
            <ProtectedRoute requiredRole={"ADMIN"}>
              <SmtpConfigPage />
            </ProtectedRoute>
          }
        />

        {/* 5. Logs & Backup */}
        <Route
          path="/admin/logs"
          element={
            <ProtectedRoute requiredRole={"ADMIN"}>
              <AuditLogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/backups"
          element={
            <ProtectedRoute requiredRole={"ADMIN"}>
              <BackupPage />
            </ProtectedRoute>
          }
        />

        {/* 6. AI & RBAC */}
        <Route
          path="/admin/ai-governance"
          element={
            <ProtectedRoute requiredRole={"ADMIN"}>
              <AiGovernancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rbac"
          element={
            <ProtectedRoute requiredRole={"ADMIN"}>
              <RbacManagement />
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
