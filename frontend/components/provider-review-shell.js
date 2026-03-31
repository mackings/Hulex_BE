"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getPublicTrustpilotReviews, getPublicTrustpilotStats } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { getProviderMeta, withProviderMeta } from "@/lib/providers";

function ReviewMetaIcon({ children }) {
  return (
    <span aria-hidden="true" className="review-meta-icon">
      {children}
    </span>
  );
}

function PersonIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M12 12a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm0 2.25c-4.52 0-8.25 2.31-8.25 5.25 0 .55.45 1 1 1h14.5c.55 0 1-.45 1-1 0-2.94-3.73-5.25-8.25-5.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M7.5 3.5v2m9-2v2m-11 3h13m-14 9.75h15a1 1 0 0 0 1-1v-10a2 2 0 0 0-2-2h-13a2 2 0 0 0-2 2v10a1 1 0 0 0 1 1Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function getProviderInitials(name) {
  return String(name || "HX")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ProviderMark({ provider }) {
  const initials = getProviderInitials(provider?.name);

  if (provider?.logo) {
    return (
      <div className="provider-brand provider-brand-logo provider-detail-logo">
        <img
          alt={`${provider.name} logo`}
          className="provider-logo"
          loading="eager"
          referrerPolicy="no-referrer"
          src={provider.logo}
        />
      </div>
    );
  }

  return <div className="provider-brand provider-brand-fallback provider-detail-logo">{initials}</div>;
}

export function ProviderReviewShell({ providerAlias }) {
  const providerMeta = useMemo(
    () =>
      withProviderMeta({
        alias: providerAlias,
        name: getProviderMeta({ alias: providerAlias })?.name || providerAlias
      }),
    [providerAlias]
  );
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!providerMeta?.reviewDomain) {
      setError("Reviews are not configured for this provider yet.");
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setError("");

    Promise.all([
      getPublicTrustpilotStats(providerMeta.reviewDomain),
      getPublicTrustpilotReviews(providerMeta.reviewDomain)
    ])
      .then(([statsData, reviewsData]) => {
        if (!active) {
          return;
        }

        setStats(statsData.stats || null);
        setReviews((reviewsData.reviews || []).slice(0, 3));
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [providerMeta]);

  return (
    <section className="provider-review-shell">
      <div className="provider-review-grid">
        <div className="modern-surface provider-review-hero">
          <div className="provider-review-brand">
            <ProviderMark provider={providerMeta} />
            <div className="provider-review-copy">
              <span className="eyebrow">Provider reviews</span>
              <h1>{providerMeta?.name || "Provider"} review snapshot.</h1>
              <p>
                See recent review signals before choosing where to send money. Hulex keeps
                this page focused on quick trust context, not endless scrolling.
              </p>
            </div>
          </div>

          <div className="provider-review-actions">
            {providerMeta?.website ? (
              <a
                className="button button-secondary"
                href={providerMeta.website}
                rel="noreferrer"
                target="_blank"
              >
                Visit provider site
              </a>
            ) : null}
            <Link className="button button-primary" href="/auth/register">
              Create account for more access
            </Link>
          </div>

          {stats ? (
            <div className="provider-review-stats">
              <article className="data-card">
                <span className="label">Average rating</span>
                <strong className="summary-value">{stats.averageRating}</strong>
                <span className="meta-line">Across {stats.totalReviews} sampled reviews</span>
              </article>
              <article className="data-card">
                <span className="label">Verified reviews</span>
                <strong className="summary-value">{stats.verifiedReviews}</strong>
                <span className="meta-line">Unverified {stats.unverifiedReviews}</span>
              </article>
              <article className="data-card">
                <span className="label">Why sign in</span>
                <strong className="summary-value">More</strong>
                <span className="meta-line">Unlock deeper review and alert workflows</span>
              </article>
            </div>
          ) : null}
        </div>

        <div className="modern-surface provider-review-list-panel">
          <div className="section-heading compact">
            <span className="section-kicker">Latest review signals</span>
            <h2>Three recent reviews from Trustpilot.</h2>
          </div>

          {isLoading ? <div className="comparison-loading-state">Loading provider reviews.</div> : null}
          {error ? <div className="error-message">{error}</div> : null}

          {!isLoading && !error ? (
            <div className="provider-review-list">
              {reviews.length ? (
                reviews.map((review, index) => (
                  <article className="trustpilot-card provider-review-card" key={review.id || index}>
                    <div className="provider-review-topline">
                      <div className="provider-review-meta">
                        <div className="provider-review-meta-item">
                          <ReviewMetaIcon>
                            <PersonIcon />
                          </ReviewMetaIcon>
                          <strong>{review.consumer?.name || "Anonymous reviewer"}</strong>
                        </div>
                        <div className="provider-review-meta-item provider-review-date">
                          <ReviewMetaIcon>
                            <CalendarIcon />
                          </ReviewMetaIcon>
                          <span>{formatDateTime(review.postedAt)}</span>
                        </div>
                      </div>
                      <span className="pill">{review.rating}/5</span>
                    </div>
                    <h3>{review.title || "Customer review"}</h3>
                    <p className="support-copy">{review.text || "No review text provided."}</p>
                    <div className="pill-row">
                      <span className="pill">
                        {review.isVerified ? "Verified review" : "Unverified review"}
                      </span>
                      {review.consumer?.country ? (
                        <span className="pill">{review.consumer.country}</span>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <div className="comparison-loading-state">
                  No reviews available for this provider right now.
                </div>
              )}
            </div>
          ) : null}

          <div className="provider-review-cta modern-card">
            <span className="section-kicker">Want more than a quick snapshot?</span>
            <h3>Create an account for more review context and rate-tracking tools.</h3>
            <p>
              Hulex accounts unlock saved history, provider review monitoring, and target-rate
              alerts in one dashboard.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/auth/register">
                Create account
              </Link>
              <Link className="button button-secondary" href="/compare">
                Back to compare
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
