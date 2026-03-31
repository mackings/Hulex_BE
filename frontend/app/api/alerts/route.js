import { fetchBackend } from "@/lib/server-backend";

export async function GET(request) {
  return fetchBackend(request, "/alerts", { requireAuth: true });
}

export async function POST(request) {
  return fetchBackend(request, "/alerts", { requireAuth: true });
}
