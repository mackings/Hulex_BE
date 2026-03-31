import { fetchBackend } from "@/lib/server-backend";

export async function GET(request) {
  return fetchBackend(request, "/currencies", {
    searchParams: new URL(request.url).searchParams
  });
}
