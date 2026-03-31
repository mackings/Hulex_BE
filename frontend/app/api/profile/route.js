import { fetchBackend } from "@/lib/server-backend";

export async function GET(request) {
  return fetchBackend(request, "/me", { requireAuth: true });
}
