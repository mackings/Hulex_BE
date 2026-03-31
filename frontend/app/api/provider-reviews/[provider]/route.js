import { NextResponse } from "next/server";
import { getProviderMeta, isKnownProviderAlias } from "@/lib/providers";
import { buildBackendUrl } from "@/lib/server-backend";

async function fetchJson(url) {
  const response = await fetch(url, {
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(15000)
  });
  const text = await response.text();

  if (!response.ok) {
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }

    throw new Error(payload?.error || "Failed to fetch provider review data");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The provider review API returned invalid JSON");
  }
}

export async function GET(_request, { params }) {
  const resolvedParams = await params;
  const providerAlias = String(resolvedParams.provider || "");

  if (!isKnownProviderAlias(providerAlias)) {
    return NextResponse.json(
      { success: false, error: "Unknown provider" },
      { status: 404 }
    );
  }

  const providerMeta = getProviderMeta({ alias: providerAlias });
  if (!providerMeta?.reviewDomain) {
    return NextResponse.json(
      { success: false, error: "Reviews are not configured for this provider." },
      { status: 400 }
    );
  }

  try {
    const statsUrl = buildBackendUrl("/public/trustpilot/stats");
    statsUrl.searchParams.set("company_domain", providerMeta.reviewDomain);

    const reviewsUrl = buildBackendUrl("/public/trustpilot/reviews");
    reviewsUrl.searchParams.set("company_domain", providerMeta.reviewDomain);
    reviewsUrl.searchParams.set("locale", "en-US");
    reviewsUrl.searchParams.set("page", "1");

    const [statsPayload, reviewsPayload] = await Promise.all([
      fetchJson(statsUrl),
      fetchJson(reviewsUrl)
    ]);

    return NextResponse.json({
      success: true,
      provider: {
        alias: providerMeta.alias,
        name: providerMeta.name,
        reviewDomain: providerMeta.reviewDomain
      },
      stats: statsPayload.stats || null,
      reviews: reviewsPayload.reviews || []
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch provider reviews" },
      { status: 502 }
    );
  }
}
