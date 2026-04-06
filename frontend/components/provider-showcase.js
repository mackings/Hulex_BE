"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { compareRates } from "@/lib/api";
import { formatMoney, formatNumber, providerTypeLabel } from "@/lib/format";
import { getProviderReviewHref, withProviderMeta } from "@/lib/providers";

const defaultQuery = {
  fromCurrency: "USD",
  toCurrency: "NGN",
  amount: "100"
};

function getProviderInitials(name) {
  return String(name || "HX")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ProviderMark({ provider }) {
  const [hasError, setHasError] = useState(false);
  const initials = getProviderInitials(provider?.name);

  if (provider?.logo && !hasError) {
    return (
      <div className="provider-brand provider-brand-logo">
        <img
          alt={`${provider.name} logo`}
          className="provider-logo"
          loading="lazy"
          referrerPolicy="no-referrer"
          src={provider.logo}
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return <div className="provider-brand provider-brand-fallback">{initials}</div>;
}

export function ProviderShowcase() {
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let active = true;

    setIsLoading(true);
    compareRates(defaultQuery)
        .then((data) => {
          if (active) {
            setProviders((data.providers || []).map((provider) => withProviderMeta(provider)));
          }
        })
      .catch(() => {
        if (active) {
          setProviders([]);
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
  }, []);

  const slideItems = useMemo(() => providers.slice(0, 8), [providers]);
  const visibleCount = slideItems.length;
  const bestReceivedAmount = useMemo(() => {
    if (!slideItems.length) {
      return 0;
    }

    return Math.max(...slideItems.map((provider) => Number(provider.receivedAmount || 0)));
  }, [slideItems]);

  useEffect(() => {
    if (visibleCount <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % visibleCount);
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, [visibleCount]);

  const handlePrev = () => {
    if (!visibleCount) {
      return;
    }

    setActiveIndex((current) => (current - 1 + visibleCount) % visibleCount);
  };

  const handleNext = () => {
    if (!visibleCount) {
      return;
    }

    setActiveIndex((current) => (current + 1) % visibleCount);
  };

  return (
    <section className="provider-showcase">
      <div className="provider-showcase-head">
        <div>
          <span className="section-kicker">More providers</span>
          <h2>Swipe through live payout options.</h2>
        </div>
        <div className="provider-slider-controls">
          <button className="slider-button" onClick={handlePrev} type="button">
            Prev
          </button>
          <button className="slider-button" onClick={handleNext} type="button">
            Next
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="comparison-loading-state">Loading more provider options.</div>
      ) : slideItems.length ? (
        <>
          <div className="provider-slider-window">
            <div
              className="provider-slider-track"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {slideItems.map((provider, index) => {
                const payoutGap = Math.max(
                  bestReceivedAmount - Number(provider.receivedAmount || 0),
                  0
                );
                const isTopPayout = payoutGap < 0.01;
                const content = (
                  <>
                    <div className="provider-showcase-topline">
                      <div className="provider-rank-main">
                        <ProviderMark provider={provider} />
                        <div className="provider-rank-copy">
                          <span className="label">#{index + 1} ranked</span>
                          <strong>{provider.name}</strong>
                        </div>
                      </div>
                      <span className="pill">
                        {providerTypeLabel(provider.type)}
                      </span>
                    </div>

                    <div className="provider-showcase-amount-block">
                      <span className="label">Recipient gets</span>
                      <div className="provider-showcase-amount">
                        {formatMoney(provider.receivedAmount, defaultQuery.toCurrency)}
                      </div>
                      <p className="provider-showcase-summary">
                        Based on sending {formatMoney(defaultQuery.amount, defaultQuery.fromCurrency)}
                        {" "}right now.
                      </p>
                    </div>

                    <div className="provider-showcase-stat-grid">
                      <article className="provider-showcase-stat">
                        <span>Exchange rate</span>
                        <strong>{formatNumber(provider.rate)}</strong>
                      </article>
                      <article className="provider-showcase-stat">
                        <span>Transfer fee</span>
                        <strong>{formatMoney(provider.fee, defaultQuery.fromCurrency)}</strong>
                      </article>
                      <article className="provider-showcase-stat">
                        <span>Gap to best</span>
                        <strong>
                          {isTopPayout
                            ? "Top route"
                            : formatMoney(payoutGap, defaultQuery.toCurrency)}
                        </strong>
                      </article>
                    </div>

                    <div className="provider-showcase-meta">
                      <span>
                        {isTopPayout
                          ? "Highest payout in this live sample."
                          : `${formatMoney(payoutGap, defaultQuery.toCurrency)} behind the best live route.`}
                      </span>
                      <span>Open provider reviews</span>
                    </div>
                  </>
                );

                return (
                  <Link
                    className="provider-slide-card"
                    href={getProviderReviewHref(provider)}
                    key={`${provider.alias || provider.name}-${index}`}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="provider-slider-dots">
            {slideItems.map((provider, index) => (
              <button
                aria-label={`Show ${provider.name}`}
                className={index === activeIndex ? "slider-dot slider-dot-active" : "slider-dot"}
                key={`${provider.alias || provider.name}-dot-${index}`}
                onClick={() => setActiveIndex(index)}
                type="button"
              />
            ))}
          </div>
        </>
      ) : (
        <div className="comparison-loading-state">No additional providers available right now.</div>
      )}
    </section>
  );
}
