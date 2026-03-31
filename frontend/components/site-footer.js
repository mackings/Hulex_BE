"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

function FooterIcon({ kind }) {
  if (kind === "home") {
    return (
      <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.75v-6h-4.5v6H5a1 1 0 0 1-1-1v-9.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (kind === "compare") {
    return (
      <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
        <path
          d="M6 7h8m-8 5h12M6 17h6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <circle cx="17" cy="7" fill="currentColor" r="1.5" />
        <circle cx="18" cy="17" fill="currentColor" r="1.5" />
      </svg>
    );
  }

  if (kind === "account") {
    return (
      <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
        <path
          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.14 0-7.5 2.13-7.5 4.75 0 .41.34.75.75.75h13.5c.41 0 .75-.34.75-.75C19.5 16.13 16.14 14 12 14Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (kind === "alerts") {
    return (
      <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
        <path
          d="M15 17H5l1.5-2.5V10a5.5 5.5 0 1 1 11 0v4.5L19 17h-4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M10 20a2 2 0 0 0 4 0"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M5 6.75A1.75 1.75 0 0 1 6.75 5h10.5A1.75 1.75 0 0 1 19 6.75v10.5A1.75 1.75 0 0 1 17.25 19H6.75A1.75 1.75 0 0 1 5 17.25V6.75Zm4 0V19m6-12.25V19"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function footerNavClass(pathname, href) {
  return pathname === href ? "mobile-footer-link mobile-footer-link-active" : "mobile-footer-link";
}

export function SiteFooter() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const alertsHref = isAuthenticated ? "/dashboard" : "/auth/register";
  const profileHref = isAuthenticated ? "/profile" : "/auth";
  const mobileItems = [
    { href: "/", label: "Home", icon: "home" },
    { href: "/compare", label: "Compare", icon: "compare" },
    { href: alertsHref, label: "Alerts", icon: "alerts" },
    { href: profileHref, label: "Profile", icon: "account" }
  ];

  return (
    <footer className="site-footer">
      <div className="footer-panel">
        <div className="site-footer-brand">
          <Link className="brand-lockup" href="/">
            <div className="brand-mark">HX</div>
            <div className="brand-text">
              <strong>Hulex</strong>
              <span>Every penny counts. Compare the cheapest transfer rates across providers.</span>
            </div>
          </Link>
          <p>
            Compare returned payout, save corridor alerts, and keep provider trust signals
            in one clean dashboard.
          </p>
        </div>

        <div className="site-footer-links">
          <Link href="/compare">
            <span className="site-footer-link-icon" aria-hidden="true">
              <FooterIcon kind="compare" />
            </span>
            <div className="site-footer-link-copy">
              <strong>Compare</strong>
              <span>Live payout view</span>
            </div>
          </Link>
          <Link href="/dashboard">
            <span className="site-footer-link-icon" aria-hidden="true">
              <FooterIcon kind="alerts" />
            </span>
            <div className="site-footer-link-copy">
              <strong>History</strong>
              <span>Alerts and saved checks</span>
            </div>
          </Link>
          <Link href="/profile">
            <span className="site-footer-link-icon" aria-hidden="true">
              <FooterIcon kind="account" />
            </span>
            <div className="site-footer-link-copy">
              <strong>Profile</strong>
              <span>Account details</span>
            </div>
          </Link>
        </div>
      </div>

      <nav className="mobile-footer-nav">
        {mobileItems.map((item) => (
          <Link className={footerNavClass(pathname, item.href)} href={item.href} key={`${item.label}-${item.href}`}>
            <span className="mobile-footer-icon" aria-hidden="true">
              <FooterIcon kind={item.icon} />
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </footer>
  );
}
