"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

function navClass(pathname, href) {
  if (href.includes("#")) {
    return "nav-link";
  }

  return pathname === href ? "nav-link nav-link-active" : "nav-link";
}

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated, user, clearSession } = useAuth();
  const alertsHref = isAuthenticated ? "/dashboard" : "/auth/register";
  const profileHref = isAuthenticated ? "/profile" : "/auth";
  const isHomePage = pathname === "/";
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/compare", label: "Compare" },
    { href: alertsHref, label: "Alerts" },
    { href: profileHref, label: "Profile" }
  ];

  return (
    <header className="site-header">
      <div className="site-header-stack">
        <div className="site-header-inner">
          <Link className="brand-lockup" href="/">
            <div className="brand-mark">HX</div>
            <div className="brand-text">
              <strong>Hulex</strong>
              <span>Every penny counts. Compare the cheapest transfer rates across providers.</span>
            </div>
          </Link>

          <nav className="nav-links nav-links-desktop">
            {navItems.map((item) => (
              <Link className={navClass(pathname, item.href)} href={item.href} key={item.label}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="nav-actions">
            {isAuthenticated ? (
              <>
                <Link className="button button-secondary button-small nav-cta-desktop" href="/profile">
                  {user?.firstName ? `${user.firstName}'s profile` : "Profile"}
                </Link>
                <button className="button button-ghost button-small" onClick={clearSession} type="button">
                  Sign out
                </button>
              </>
            ) : (
              <Link
                className={`button button-small nav-cta-desktop ${
                  isHomePage ? "button-ghost" : "button-primary"
                }`}
                href={isHomePage ? "/auth" : "/auth/register"}
              >
                {isHomePage ? "Sign in" : "Get started"}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
