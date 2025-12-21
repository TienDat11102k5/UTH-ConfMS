// src/pages/author/AuthorSubmissionsPage.jsx
import React from "react";
import { Navigate } from "react-router-dom";

// This page previously was a placeholder. The canonical submissions list
// is implemented in `AuthorSubmissionListPage.jsx` and routed at
// `/author/submissions`. We keep this component to avoid breaking any
// imports or links that referenced `AuthorSubmissionsPage` and redirect
// to the canonical route.
const AuthorSubmissionsPage = () => {
  return <Navigate to="/author/submissions" replace />;
};

export default AuthorSubmissionsPage;
