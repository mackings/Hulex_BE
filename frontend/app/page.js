import Link from "next/link";
import { BrowserAlertsInline } from "@/components/browser-alerts-inline";
import { ComparisonExperience } from "@/components/comparison-experience";
import { ProviderShowcase } from "@/components/provider-showcase";

const corridorPresets = [
  {
    label: "USD to NGN",
    description: "US to Nigeria",
    fromCountry: "US",
    toCountry: "NG",
    amount: "100"
  },
  {
    label: "GBP to GHS",
    description: "UK to Ghana",
    fromCountry: "GB",
    toCountry: "GH",
    amount: "100"
  },
  {
    label: "EUR to KES",
    description: "Germany to Kenya",
    fromCountry: "DE",
    toCountry: "KE",
    amount: "100"
  },
  {
    label: "CAD to NGN",
    description: "Canada to Nigeria",
    fromCountry: "CA",
    toCountry: "NG",
    amount: "100"
  }
];

const credibilityItems = [
  "Live provider ranking",
  "Target-rate alerts",
  "Saved rate history"
];

const productCards = [
  {
    label: "Compare",
    title: "See what the recipient actually gets",
    copy: "Hulex ranks the returned payout so the strongest route is clear before you send.",
    icon: "compare"
  },
  {
    label: "Track",
    title: "Save a corridor only when it matters",
    copy: "Create alerts for the payout you want instead of checking the market manually.",
    icon: "track"
  },
  {
    label: "Review",
    title: "Add trust signals beside the rate",
    copy: "Keep provider review context close to the price decision in one workflow.",
    icon: "review"
  }
];

const workspaceCards = [
  {
    label: "Alerts",
    title: "Monitor target rules",
    copy: "Pause, activate, and manage corridor triggers from one private dashboard."
  },
  {
    label: "History",
    title: "Return to earlier checks",
    copy: "Keep the pairs you checked most recently and compare movement over time."
  },
  {
    label: "Reviews",
    title: "Inspect provider sentiment",
    copy: "Bring rate comparison and review context into the same decision surface."
  }
];

function LandingIcon({ icon }) {
  if (icon === "pulse") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M3 12h4l2.2-4 4.1 8 2.5-5H21" />
      </svg>
    );
  }

  if (icon === "bolt") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M13 2 6 13h5l-1 9 8-12h-5l0-8Z" />
      </svg>
    );
  }

  if (icon === "shield") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 3l7 3v5c0 5-3.2 8-7 10-3.8-2-7-5-7-10V6l7-3Z" />
        <path d="m9.5 12 1.8 1.8L15 10.2" />
      </svg>
    );
  }

  if (icon === "track") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 3a9 9 0 1 0 9 9" />
        <path d="M12 7v5l4 2" />
        <path d="M16 3h5v5" />
      </svg>
    );
  }

  if (icon === "review") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4 5h16v10H8l-4 4V5Z" />
        <path d="M8 9h8" />
        <path d="M8 12h5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 8h7" />
      <path d="M4 16h5" />
      <path d="M13 6h7" />
      <path d="M11 18h9" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="page-stack landing-page">
      <section className="shell hero-shell">
        <div className="hero-copy-block">
          <span className="eyebrow">Cheapest transfer routes, all in one place</span>
          <h1 className="hero-title">
            Compare live rates and act when the payout is right.
          </h1>
          <p className="hero-summary">
            Hulex helps you find the cheapest transfer rate across providers, see what the
            recipient gets, and move with more confidence before you send money home.
          </p>

          <div className="hero-action-stack">
            <div className="hero-actions">
              <Link className="button button-primary hero-primary-button" href="/compare">
                Compare rates now
              </Link>
            </div>

            <Link className="hero-subtle-cta" href="/auth/register">
              <strong>Sign up for alerts</strong>
              <span>Track a route and get notified when the payout hits your target.</span>
            </Link>

            <BrowserAlertsInline />
          </div>

          <div className="credibility-row">
            {credibilityItems.map((item) => (
              <article className="credibility-card" key={item}>
                {item}
              </article>
            ))}
          </div>

          <ProviderShowcase />
        </div>

        <div className="hero-visual-column">
          <div className="hero-compare-wrap">
            <ComparisonExperience hero presets={corridorPresets} />
          </div>
        </div>
      </section>

      <section className="shell section-block compact-section">
        <div className="section-heading compact">
          <span className="section-kicker">Core flow</span>
          <h2>Less noise, faster decision-making.</h2>
        </div>

        <div className="product-grid">
          {productCards.map((item) => (
            <article className="modern-card product-card" key={item.title}>
              <div className="product-card-head">
                <span className="product-card-icon" aria-hidden="true">
                  <LandingIcon icon={item.icon} />
                </span>
                <span className="feature-kicker">{item.label}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell modern-surface workspace-strip">
        <div className="workspace-strip-copy">
          <span className="section-kicker">After sign in</span>
          <h2>Your account keeps the follow-up tools in one place.</h2>
          <p>
            Once the user wants more than a quick comparison, Hulex adds alerts, history,
            and review monitoring without cluttering the homepage.
          </p>
        </div>

        <div className="product-grid workspace-grid">
          {workspaceCards.map((item) => (
            <article className="modern-card workspace-card" key={item.title}>
              <span className="feature-kicker">{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell cta-banner">
        <div>
          <span className="section-kicker">Start with the market</span>
          <h2>Use the live rate card first, then save the corridor when you want follow-up.</h2>
        </div>

        <div className="hero-actions">
          <Link className="button button-primary" href="/compare">
            Start comparing
          </Link>
          <Link className="button button-secondary" href="/auth/register">
            Sign up for alerts
          </Link>
        </div>
      </section>
    </div>
  );
}
