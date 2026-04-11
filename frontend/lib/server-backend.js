import { NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.HULEX_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://hulex-api.onrender.com";

export const SESSION_COOKIE_NAME = "hulex_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getBackendOrigin() {
  try {
    const url = new URL(BACKEND_BASE_URL);
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

export function buildBackendUrl(pathname, searchParams) {
  const origin = getBackendOrigin();
  if (!origin) {
    throw new Error("Backend origin is not configured safely");
  }

  const targetUrl = new URL(pathname.startsWith("/") ? pathname : `/${pathname}`, origin);
  if (searchParams) {
    targetUrl.search = searchParams.toString();
  }

  return targetUrl;
}

export function createBackendHeaders(request, { requireAuth = false, includeContentType = true } = {}) {
  const headers = new Headers();
  const accept = request.headers.get("accept");
  const contentType = request.headers.get("content-type");
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (accept) {
    headers.set("accept", accept);
  }

  if (includeContentType && contentType) {
    headers.set("content-type", contentType);
  }

  if (sessionToken) {
    headers.set("authorization", `Bearer ${sessionToken}`);
  } else if (requireAuth) {
    return null;
  }

  return headers;
}

export async function readRequestBody(request) {
  if (["GET", "HEAD"].includes(request.method)) {
    return undefined;
  }

  const body = await request.text();
  return body || undefined;
}

export async function fetchBackend(request, pathname, options = {}) {
  const {
    method = request.method,
    requireAuth = false,
    searchParams = null,
    includeContentType = true,
    body
  } = options;

  const targetUrl = buildBackendUrl(pathname, searchParams);
  const headers = createBackendHeaders(request, { requireAuth, includeContentType });

  if (requireAuth && !headers) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
      body: body ?? (await readRequestBody(request))
    });

    const responseText = await response.text();
    const nextHeaders = new Headers();
    const responseContentType = response.headers.get("content-type");
    const responseCacheControl = response.headers.get("cache-control");

    if (responseContentType) {
      nextHeaders.set("content-type", responseContentType);
    }

    nextHeaders.set("cache-control", responseCacheControl || "no-store");

    return new NextResponse(responseText, {
      status: response.status,
      headers: nextHeaders
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "The upstream API is unavailable right now" },
      { status: 502 }
    );
  }
}

export function clearSessionCookie(response) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}

export function setSessionCookie(response, token) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
  return response;
}
