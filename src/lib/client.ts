"use client";

/**
 * Client-side session token storage + fetch wrapper.
 *
 * The preview panel runs the app inside a cross-origin iframe where modern
 * browsers block third-party cookies — so cookie-only sessions silently fail
 * (account gets created server-side but the browser never stores the cookie).
 * Storing the token in localStorage and sending it via the x-session-token
 * header works in every context: iframe, new tab, top-level navigation.
 */

export const SESSION_STORAGE_KEY = "singlescan_session_token";

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, token);
  } catch {
    // storage may be unavailable (private mode) — cookie fallback still applies
  }
}

export function clearSessionToken() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * fetch() wrapper that attaches the session token header automatically.
 * Drop-in replacement for fetch in all authenticated client calls.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getSessionToken();
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("x-session-token", token);
  }
  return fetch(input, { ...init, headers, credentials: "include" });
}

/** Extracts the session token from an auth response body and stores it. */
export function captureToken(data: unknown) {
  if (data && typeof data === "object" && "token" in data) {
    const token = (data as { token?: unknown }).token;
    if (typeof token === "string" && token.length > 0) {
      setSessionToken(token);
    }
  }
}
