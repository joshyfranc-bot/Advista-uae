const ASNADS_API_ORIGIN = "https://api.asnads.com";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyToAsnadsApi(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(`/${path.map(encodeURIComponent).join("/")}`, ASNADS_API_ORIGIN);
  upstreamUrl.search = incomingUrl.search;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const authorization = request.headers.get("authorization");
  if (contentType) headers.set("content-type", contentType);
  if (authorization) headers.set("authorization", authorization);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    const upstreamContentType = upstream.headers.get("content-type");
    if (upstreamContentType) responseHeaders.set("content-type", upstreamContentType);
    responseHeaders.set("cache-control", "no-store");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { error: "ASNads API is temporarily unavailable. Please try again." },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}

export const GET = proxyToAsnadsApi;
export const POST = proxyToAsnadsApi;
export const PUT = proxyToAsnadsApi;
export const PATCH = proxyToAsnadsApi;
export const DELETE = proxyToAsnadsApi;
