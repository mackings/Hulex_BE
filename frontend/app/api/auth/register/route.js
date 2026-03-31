import { fetchBackend } from "@/lib/server-backend";

export async function POST(request) {
  return fetchBackend(request, "/register");
}
