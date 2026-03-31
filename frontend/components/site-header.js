"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";

const transferVoices = [
  {
    name: "Amaka",
    route: "London to Lagos",
    quote: "I always check which app gives mum the highest payout first.",
    avatar: {
      background: "#f4d7f5",
      skin: "#8b5a46",
      shirt: "#6d5ce8",
      hair: "#1f2435",
      hairStyle: "braids"
    }
  },
  {
    name: "Ravi",
    route: "Toronto to Mumbai",
    quote: "The fee looks small until another provider beats the final amount.",
    avatar: {
      background: "#dceeff",
      skin: "#9a6a4f",
      shirt: "#0f8b8d",
      hair: "#1c2434",
      hairStyle: "short"
    }
  },
  {
    name: "Aisha",
    route: "Milan to Nairobi",
    quote: "Rates move fast, so I compare before every transfer.",
    avatar: {
      background: "#e5f7ef",
      skin: "#6e4739",
      shirt: "#ef6c7b",
      hair: "#20222f",
      hairStyle: "curl"
    }
  },
  {
    name: "Samuel",
    route: "New York to Accra",
    quote: "Hulex helps me spot the cheapest route without opening five apps.",
    avatar: {
      background: "#fde8d7",
      skin: "#5a3a30",
      shirt: "#f18f01",
      hair: "#151922",
      hairStyle: "fade"
    }
  }
];

function VoiceAvatar({ avatar, name }) {
  const clipId = `voice-avatar-${name.toLowerCase()}`;

  return (
    <svg
      aria-hidden="true"
      className="header-voice-avatar"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect fill={avatar.background} height="64" width="64" />
        <ellipse cx="32" cy="75" fill={avatar.shirt} rx="26" ry="24" />
        <rect fill={avatar.skin} height="12" rx="5" width="10" x="27" y="31" />
        <circle cx="32" cy="24" fill={avatar.skin} r="13.5" />
        {avatar.hairStyle === "braids" ? (
          <>
            <path
              d="M18 23c1-9 7-14 14-14s13 5 14 14c-4-4-8-6-14-6s-10 2-14 6Z"
              fill={avatar.hair}
            />
            <rect fill={avatar.hair} height="16" rx="4" width="6" x="14" y="20" />
            <rect fill={avatar.hair} height="16" rx="4" width="6" x="44" y="20" />
          </>
        ) : null}
        {avatar.hairStyle === "short" ? (
          <path
            d="M18 22c1-8 8-13 14-13 8 0 13 5 14 13-4-3-8-4-14-4s-10 1-14 4Z"
            fill={avatar.hair}
          />
        ) : null}
        {avatar.hairStyle === "curl" ? (
          <>
            <circle cx="21" cy="18" fill={avatar.hair} r="7" />
            <circle cx="32" cy="14" fill={avatar.hair} r="8" />
            <circle cx="43" cy="18" fill={avatar.hair} r="7" />
            <rect fill={avatar.hair} height="10" rx="4" width="10" x="16" y="18" />
            <rect fill={avatar.hair} height="10" rx="4" width="10" x="38" y="18" />
          </>
        ) : null}
        {avatar.hairStyle === "fade" ? (
          <path
            d="M18 20c2-7 8-11 14-11s12 4 14 11c-3-2-7-3-14-3s-11 1-14 3Z"
            fill={avatar.hair}
          />
        ) : null}
        <circle cx="27" cy="24" fill="#1f2435" r="1.2" />
        <circle cx="37" cy="24" fill="#1f2435" r="1.2" />
        <path
          d="M28 30c1.2 1.6 2.5 2.2 4 2.2s2.8-.6 4-2.2"
          fill="none"
          stroke="#7a3b2c"
          strokeLinecap="round"
          strokeWidth="1.6"
        />
      </g>
    </svg>
  );
}

function navClass(pathname, href) {
  if (href.includes("#")) {
    return "nav-link";
  }

  return pathname === href ? "nav-link nav-link-active" : "nav-link";
}

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated, user, clearSession } = useAuth();
  const [isTopZone, setIsTopZone] = useState(true);
  const alertsHref = isAuthenticated ? "/dashboard" : "/auth/register";
  const profileHref = isAuthenticated ? "/profile" : "/auth";
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/compare", label: "Compare" },
    { href: alertsHref, label: "Alerts" },
    { href: profileHref, label: "Profile" }
  ];

  useEffect(() => {
    let frameId = 0;

    const syncTopZone = () => {
      frameId = 0;
      setIsTopZone(window.scrollY < 24);
    };

    const onScroll = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(syncTopZone);
    };

    syncTopZone();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

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
              <Link className="button button-primary button-small nav-cta-desktop" href="/auth/register">
                Get started
              </Link>
            )}
          </div>
        </div>

        <div className={`header-voice-strip${isTopZone ? "" : " header-voice-strip-hidden"}`}>
          <div className="header-voice-track">
            {[...transferVoices, ...transferVoices].map((voice, index) => (
              <article className="header-voice-card" key={`${voice.name}-${index}`}>
                <VoiceAvatar avatar={voice.avatar} name={`${voice.name}-${index}`} />
                <div>
                  <strong>{voice.name}</strong>
                  <span>{voice.route}</span>
                  <p>{voice.quote}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
