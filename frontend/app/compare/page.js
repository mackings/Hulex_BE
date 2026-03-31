import Link from "next/link";
import { ComparisonExperience } from "@/components/comparison-experience";

export const metadata = {
  title: "Compare Rates | Hulex"
};

export default function ComparePage() {
  return (
    <div className="page-stack shell">
      <section className="modern-surface compare-page-intro">
        <div className="section-heading compact">
          <span className="section-kicker">Full comparison view</span>
          <h1>Compare providers side by side, then open provider reviews in one flow.</h1>
          <p>
            Use the full comparison page to inspect payouts, fees, ranked providers,
            and review links without squeezing the experience into the homepage.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="button button-primary" href="/auth/register">
            Create account
          </Link>
          <Link className="button button-secondary" href="/dashboard">
            Open dashboard
          </Link>
        </div>
      </section>

      <ComparisonExperience />
    </div>
  );
}
