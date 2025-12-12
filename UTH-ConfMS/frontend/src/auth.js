// src/auth.js
const ACCESS_TOKEN_KEY = "accessToken";
const CURRENT_USER_KEY = "currentUser";

/**
 * Ưu tiên sessionStorage (đăng nhập tạm), nếu không có thì fallback localStorage (ghi nhớ).
 */
export const getToken = () => {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setToken = (token, { remember = true } = {}) => {
  // đảm bảo chỉ tồn tại ở 1 nơi
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);

  if (!token) return;

  if (remember) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const removeToken = () => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const getCurrentUser = () => {
  const raw = sessionStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem(CURRENT_USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user, { remember = true } = {}) => {
  sessionStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);

  if (!user) return;

  const raw = JSON.stringify(user);
  if (remember) localStorage.setItem(CURRENT_USER_KEY, raw);
  else sessionStorage.setItem(CURRENT_USER_KEY, raw);
};

export const removeCurrentUser = () => {
  sessionStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const clearAuth = () => {
  removeToken();
  removeCurrentUser();
};

export const isAuthenticated = () => {
  return !!getToken();
};
