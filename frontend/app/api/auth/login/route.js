import { NextResponse } from "next/server";
import { fetchBackend, setSessionCookie } from "@/lib/server-backend";

export async function POST(request) {
  const response = await fetchBackend(request, "/login");
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok || !contentType.includes("application/json")) {
    return response;
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    return response;
  }

  if (!payload?.token) {
    return NextResponse.json(payload, { status: response.status });
  }

  const { token, ...safePayload } = payload;
  const nextResponse = NextResponse.json(
    safePayload,
    { status: response.status }
  );

  return setSessionCookie(nextResponse, token);
}
