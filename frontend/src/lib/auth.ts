export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "DIRETORIA" | "GERENTE" | "VENDEDOR" | "FINANCEIRO";
}

const ACCESS_TOKEN_KEY = "estrela_bi_access_token";
const REFRESH_TOKEN_KEY = "estrela_bi_refresh_token";
const USER_KEY = "estrela_bi_user";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getAccessToken() {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (!isBrowser()) return null;
  const rawUser = window.localStorage.getItem(USER_KEY);
  if (!rawUser) return null;
  return JSON.parse(rawUser) as AuthUser;
}

export function saveAuthSession(accessToken: string, refreshToken: string, user: AuthUser) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
