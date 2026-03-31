import { fetchBackend } from "@/lib/server-backend";

export async function GET(request) {
  return fetchBackend(request, "/countries", {
    searchParams: new URL(request.url).searchParams
  });
}
