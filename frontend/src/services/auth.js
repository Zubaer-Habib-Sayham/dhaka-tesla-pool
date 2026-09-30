const TOKEN_KEY = "dhaka_tesla_pool_token";
const USER_KEY = "dhaka_tesla_pool_user";
const DEMO_TOKEN_KEY = "dhaka_tesla_pool_demo_token";
const DEMO_USER_KEY = "dhaka_tesla_pool_demo_user";
export const saveAuth = ({ token, user }) => {
  if (token === "demo-session") {
    sessionStorage.setItem(DEMO_TOKEN_KEY, token);
    sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(DEMO_TOKEN_KEY);
    sessionStorage.removeItem(DEMO_USER_KEY);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};
export const getToken = () => sessionStorage.getItem(DEMO_TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
export const getCurrentUser = () => {
  const raw = sessionStorage.getItem(DEMO_USER_KEY) || localStorage.getItem(USER_KEY);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
};
export const isAuthenticated = () => Boolean(getToken());
export const logout = () => {
  if (sessionStorage.getItem(DEMO_TOKEN_KEY)) {
    sessionStorage.removeItem(DEMO_TOKEN_KEY);
    sessionStorage.removeItem(DEMO_USER_KEY);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};
