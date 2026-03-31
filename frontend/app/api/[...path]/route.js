const BACKEND_BASE_URL =
  process.env.HULEX_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://hulexbe.vercel.app";

export const dynamic = "force-dynamic";

async function proxyRequest(request, { params }) {
  const requestUrl = new URL(request.url);
  const path = Array.isArray(params.path) ? params.path.join("/") : "";
  const targetUrl = `${BACKEND_BASE_URL}/${path}${requestUrl.search}`;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");

  if (authorization) {
    headers.set("authorization", authorization);
  }

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (accept) {
    headers.set("accept", accept);
  }

  const init = {
    method: request.method,
    headers,
    cache: "no-store"
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    const body = await request.text();

    if (body) {
      init.body = body;
    }
  }

  const response = await fetch(targetUrl, init);
  const responseText = await response.text();
  const responseHeaders = new Headers();
  const responseContentType = response.headers.get("content-type");

  if (responseContentType) {
    responseHeaders.set("content-type", responseContentType);
  }

  return new Response(responseText, {
    status: response.status,
    headers: responseHeaders
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PATCH = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
