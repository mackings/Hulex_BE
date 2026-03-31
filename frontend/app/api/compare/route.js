import { fetchBackend } from "@/lib/server-backend";

export async function GET(request) {
  return fetchBackend(request, "/rates/compare", {
    searchParams: new URL(request.url).searchParams
  });
}
