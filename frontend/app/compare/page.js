import Link from "next/link";
import { ComparisonExperience } from "@/components/comparison-experience";
import { providerDirectory } from "@/lib/providers";

const compareIntroProviders = [
  providerDirectory.sendwave,
  providerDirectory.taptapsend,
  providerDirectory.wise,
  providerDirectory.remitly,
  providerDirectory.worldremit
];

function ProviderBadge({ provider }) {
  const initials = provider.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="compare-intro-provider">
      <div className={`compare-intro-provider-mark${provider.logo ? " compare-intro-provider-mark-logo" : ""}`}>
        {provider.logo ? (
          <img
            alt={`${provider.name} logo`}
            className={`compare-intro-provider-logo compare-intro-provider-logo-${provider.alias}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            src={provider.logo}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="compare-intro-provider-copy">
        <strong>{provider.name}</strong>
        <span>Live route coverage</span>
      </div>
    </article>
  );
}

export const metadata = {
  title: "Compare Rates | Hulex"
};

export default function ComparePage() {
  return (
    <div className="page-stack shell">
      <section className="modern-surface compare-page-intro">
        <div className="compare-page-intro-grid">
          <div className="section-heading compact">
            <span className="section-kicker">Full comparison view</span>
            <h1>Compare providers side by side, then open provider reviews in one flow.</h1>
            <p>
              Use the full comparison page to inspect payouts, fees, ranked providers,
              and review links without squeezing the experience into the homepage.
            </p>

            <div className="hero-actions compare-page-actions">
              <Link className="button button-primary" href="/auth/register">
                Create account
              </Link>
              <Link className="button button-secondary" href="/dashboard">
                Open dashboard
              </Link>
            </div>
          </div>

          <aside className="compare-intro-rail">
            <div className="compare-intro-rail-head">
              <span className="section-kicker">Provider snapshot</span>
              <h2>See the names you already know, ranked by payout.</h2>
            </div>

            <div className="compare-intro-stat-row">
              <div className="compare-intro-stat">
                <strong>Live</strong>
                <span>Rates update from active provider feeds</span>
              </div>
              <div className="compare-intro-stat">
                <strong>Reviews</strong>
                <span>Jump straight from price to trust context</span>
              </div>
            </div>

            <div className="compare-intro-provider-list">
              {compareIntroProviders.map((provider) => (
                <ProviderBadge key={provider.alias} provider={provider} />
              ))}
            </div>
          </aside>
        </div>
      </section>

      <ComparisonExperience />
    </div>
  );
}
