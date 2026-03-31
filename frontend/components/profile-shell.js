"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

function ProfileItem({ label, value }) {
  return (
    <div className="profile-meta-item">
      <span>{label}</span>
      <strong>{value || "Not added yet"}</strong>
    </div>
  );
}

export function ProfileShell() {
  const { clearSession, isAuthenticated, isHydrated, user } = useAuth();

  if (!isHydrated) {
    return (
      <div className="page-stack shell">
        <section className="dashboard-shell profile-page-shell">Loading your profile.</section>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="page-stack shell">
        <section className="dashboard-shell profile-page-shell">
          <div className="modern-surface locked-workspace-card">
            <span className="eyebrow">Profile locked</span>
            <h2>Sign in to view your profile and saved account details.</h2>
            <p className="support-copy">
              Your profile keeps your account details, while alerts and history stay in the
              alerts area.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/auth">
                Sign in
              </Link>
              <Link className="button button-secondary" href="/auth/register">
                Create account
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack shell">
      <section className="dashboard-shell profile-page-shell">
        <div className="dashboard-stack">
          <section className="modern-surface dashboard-hero profile-hero">
            <div className="dashboard-top">
              <div>
                <span className="eyebrow">Your profile</span>
                <h1>Keep your account details and quick actions in one place.</h1>
                <p>
                  Manage the basic details connected to your Hulex account, then jump into
                  alerts or comparison whenever you need to check the market.
                </p>
              </div>
              <div className="inline-actions profile-toolbar">
                <Link className="button button-secondary profile-toolbar-button" href="/dashboard">
                  Open alerts
                </Link>
                <button
                  className="button button-ghost profile-toolbar-button"
                  onClick={clearSession}
                  type="button"
                >
                  Sign out
                </button>
              </div>
            </div>
          </section>

          <div className="profile-grid">
            <section className="dashboard-card profile-card">
              <span className="section-kicker">Account details</span>
              <h2>
                {user?.firstName || "Hulex"} {user?.lastName || "User"}
              </h2>
              <div className="profile-meta-list">
                <ProfileItem label="Email" value={user?.email} />
                <ProfileItem label="Phone" value={user?.phone} />
                <ProfileItem label="Country" value={user?.country} />
                <ProfileItem label="Address" value={user?.address} />
              </div>
            </section>

            <section className="dashboard-card profile-card">
              <span className="section-kicker">Quick actions</span>
              <h2>Move quickly between live comparison and saved alerts.</h2>
              <div className="profile-action-list">
                <Link className="profile-action-link profile-action-link-primary" href="/compare">
                  <span>Live comparison</span>
                  <strong>Compare live rates</strong>
                </Link>
                <Link className="profile-action-link profile-action-link-secondary" href="/dashboard">
                  <span>Alerts</span>
                  <strong>Go to alerts</strong>
                </Link>
              </div>
              <div className="profile-chip-row">
                <span className="pill">Profile details</span>
                <span className="pill">Saved alerts</span>
                <span className="pill">Rate history</span>
              </div>
              <p className="support-copy">
                Use alerts to manage saved targets, review history, and recent provider
                checks.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
