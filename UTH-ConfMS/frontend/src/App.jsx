// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import NotFoundPage from "./pages/NotFound.jsx";
import UnauthorizedPage from "./pages/Unauthorized.jsx";

import PublicHomePage from "./pages/public/PublicHomePage.jsx";
import AuthorDashboard from "./pages/author/AuthorDashboard.jsx";
import ReviewerDashboard from "./pages/reviewer/ReviewerDashboard.jsx";
import ChairDashboard from "./pages/chair/ChairDashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public portal */}
        <Route path="/" element={<PublicHomePage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboards sau khi đăng nhập (tạm thời chưa check role) */}
        <Route path="/author" element={<AuthorDashboard />} />
        <Route path="/reviewer" element={<ReviewerDashboard />} />
        <Route path="/chair" element={<ChairDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Error pages */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
