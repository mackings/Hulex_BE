import Link from "next/link";
import { ComparisonExperience } from "@/components/comparison-experience";

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

export default function HomePage() {
  return (
    <div className="page-stack landing-page">
      <section className="shell hero-shell">
        <div className="hero-copy-block">
          <div className="hero-copy-main">
            <span className="eyebrow">Hulex rate checker</span>
            <h1 className="hero-title">Check rates before you send.</h1>
          </div>

          <div className="hero-copy-side">
            <div className="hero-action-stack">
              <div className="hero-actions">
                <Link className="button button-primary hero-primary-button" href="/compare">
                  Open full comparison
                </Link>
                <Link className="button button-secondary" href="/profile">
                  History
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-visual-column">
          <div className="hero-compare-wrap">
            <ComparisonExperience hero presets={corridorPresets} />
          </div>
        </div>
      </section>
    </div>
  );
}
