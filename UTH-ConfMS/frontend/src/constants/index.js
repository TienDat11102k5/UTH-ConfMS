// src/constants/index.js

// User roles
export const ROLES = {
  ADMIN: 'ADMIN',
  CHAIR: 'CHAIR',
  TRACK_CHAIR: 'TRACK_CHAIR',
  REVIEWER: 'REVIEWER',
  PC: 'PC',
  AUTHOR: 'AUTHOR',
};

// Submission status
export const SUBMISSION_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  REVIEWED: 'REVIEWED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  CAMERA_READY: 'CAMERA_READY',
};

// Submission status display names (Vietnamese)
export const SUBMISSION_STATUS_NAMES = {
  [SUBMISSION_STATUS.DRAFT]: 'Nháp',
  [SUBMISSION_STATUS.SUBMITTED]: 'Đã nộp',
  [SUBMISSION_STATUS.UNDER_REVIEW]: 'Đang phản biện',
  [SUBMISSION_STATUS.REVIEWED]: 'Đã phản biện',
  [SUBMISSION_STATUS.ACCEPTED]: 'Chấp nhận',
  [SUBMISSION_STATUS.REJECTED]: 'Từ chối',
  [SUBMISSION_STATUS.WITHDRAWN]: 'Đã rút',
  [SUBMISSION_STATUS.CAMERA_READY]: 'Bản in',
};

// Decision types
export const DECISION_TYPES = {
  ACCEPT: 'ACCEPT',
  REJECT: 'REJECT',
  MINOR_REVISION: 'MINOR_REVISION',
  MAJOR_REVISION: 'MAJOR_REVISION',
};

// File upload constraints
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx'],
};

// Avatar upload constraints
export const AVATAR_UPLOAD = {
  MAX_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif'],
};

// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
  },
  CONFERENCES: '/conferences',
  SUBMISSIONS: '/submissions',
  REVIEWS: '/reviews',
};

export default {
  ROLES,
  SUBMISSION_STATUS,
  SUBMISSION_STATUS_NAMES,
  DECISION_TYPES,
  FILE_UPLOAD,
  AVATAR_UPLOAD,
  API_ROUTES,
};
