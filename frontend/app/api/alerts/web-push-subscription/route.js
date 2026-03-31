import { fetchBackend } from "@/lib/server-backend";

export async function POST(request) {
  return fetchBackend(request, "/alerts/web-push-subscription", { requireAuth: true });
}

export async function DELETE(request) {
  return fetchBackend(request, "/alerts/web-push-subscription", { requireAuth: true });
}
