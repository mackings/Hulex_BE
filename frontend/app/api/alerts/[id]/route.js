import { fetchBackend } from "@/lib/server-backend";

export async function PATCH(request, { params }) {
  const resolvedParams = await params;
  return fetchBackend(request, `/alerts/${encodeURIComponent(resolvedParams.id)}`, {
    requireAuth: true
  });
}

export async function DELETE(request, { params }) {
  const resolvedParams = await params;
  return fetchBackend(request, `/alerts/${encodeURIComponent(resolvedParams.id)}`, {
    requireAuth: true
  });
}
