"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  createAlert,
  deleteAlert,
  getAlerts,
  getHistory,
  getNotifications,
  getTrustpilotReviews,
  getTrustpilotStats,
  updateAlert
} from "@/lib/api";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";

const initialAlertForm = {
  fromCurrency: "USD",
  toCurrency: "NGN",
  amount: "100",
  targetAmount: "160000",
  condition: "gte",
  providerType: ""
};

export function DashboardShell() {
  const { isAuthenticated, isHydrated, token, user, refreshUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [trustpilotDomain, setTrustpilotDomain] = useState("sendwave.com");
  const [alertForm, setAlertForm] = useState(initialAlertForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingAlert, setIsSavingAlert] = useState(false);
  const [trustpilotLoading, setTrustpilotLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const [historyData, alertsData, notificationsData] = await Promise.all([
        getHistory(token),
        getAlerts(token),
        getNotifications(token)
      ]);

      setHistory(historyData.items || []);
      setAlerts(alertsData.items || []);
      setNotifications(notificationsData.items || []);
      await refreshUser(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrustpilot = async () => {
    if (!token || !trustpilotDomain) {
      return;
    }

    setTrustpilotLoading(true);
    setError("");

    try {
      const [statsData, reviewsData] = await Promise.all([
        getTrustpilotStats(token, trustpilotDomain),
        getTrustpilotReviews(token, trustpilotDomain)
      ]);

      setStats(statsData.stats);
      setReviews(reviewsData.reviews || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setTrustpilotLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard();
      loadTrustpilot();
    }
  }, [isAuthenticated, token]);

  const dashboardStats = useMemo(
    () => [
      {
        label: "Active alerts",
        value: alerts.filter((item) => item.active).length,
        detail: `${alerts.length} total saved`
      },
      {
        label: "Rate history",
        value: history.length,
        detail: history[0]?.fromCurrency
          ? `${history[0].fromCurrency}/${history[0].toCurrency} most recent`
          : "No saved checks yet"
      },
      {
        label: "Notifications",
        value: notifications.length,
        detail: notifications[0]?.deliveryStatus || "No triggers yet"
      }
    ],
    [alerts, history, notifications]
  );

  const handleCreateAlert = async (event) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    setIsSavingAlert(true);
    setMessage("");
    setError("");

    try {
      const data = await createAlert(token, {
        ...alertForm,
        providerType: alertForm.providerType || undefined
      });
      setAlerts((current) => [data.alert, ...current]);
      setMessage("Alert created successfully.");
      setAlertForm(initialAlertForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSavingAlert(false);
    }
  };

  const handleToggleAlert = async (alert) => {
    if (!token) {
      return;
    }

    setError("");

    try {
      const data = await updateAlert(token, alert._id, { active: !alert.active });
      setAlerts((current) =>
        current.map((item) => (item._id === alert._id ? data.alert : item))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (!token) {
      return;
    }

    setError("");

    try {
      await deleteAlert(token, alertId);
      setAlerts((current) => current.filter((item) => item._id !== alertId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isHydrated) {
    return <section className="dashboard-shell">Loading your dashboard.</section>;
  }

  if (!isAuthenticated) {
    return (
      <section className="dashboard-shell">
        <div className="modern-surface locked-workspace-card">
          <span className="eyebrow">Dashboard locked</span>
          <h2>Create an account to save alerts, history, and review signals.</h2>
          <p className="support-copy">
            Hulex keeps live rate comparison open on the homepage. The saved tools live in
            your dashboard after sign up.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/auth/register">
              Create account
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-shell">
      <div className="dashboard-stack">
        <section className="modern-surface dashboard-hero">
          <div className="dashboard-top">
            <div>
              <span className="eyebrow">Your dashboard</span>
              <h1>Track the corridors you care about and return when the market moves.</h1>
              <p>
                Signed in as {user?.firstName || "user"} {user?.lastName || ""}. Use this
                space to manage alerts, review your recent checks, and keep an eye on
                provider sentiment.
              </p>
            </div>
            <div className="inline-actions">
              <button className="button button-secondary" onClick={loadDashboard} type="button">
                {isLoading ? "Refreshing..." : "Refresh dashboard"}
              </button>
              <button className="button button-ghost" onClick={loadTrustpilot} type="button">
                {trustpilotLoading ? "Loading..." : "Refresh reviews"}
              </button>
            </div>
          </div>

          <div className="dashboard-stats">
            {dashboardStats.map((item) => (
              <article className="dashboard-card stat-card" key={item.label}>
                <span className="label">{item.label}</span>
                <strong className="summary-value">{item.value}</strong>
                <span className="meta-line">{item.detail}</span>
              </article>
            ))}
          </div>
        </section>

        {message ? <div className="status-message">{message}</div> : null}
        {error ? <div className="error-message">{error}</div> : null}

        <div className="dashboard-grid">
          <div className="dashboard-column">
            <section className="dashboard-card">
              <span className="section-kicker">New alert</span>
              <h2>Save a target corridor rule</h2>
              <form className="form-grid" onSubmit={handleCreateAlert}>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="alert-from">From currency</label>
                    <input
                      id="alert-from"
                      value={alertForm.fromCurrency}
                      onChange={(event) =>
                        setAlertForm((current) => ({
                          ...current,
                          fromCurrency: event.target.value.toUpperCase()
                        }))
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="alert-to">To currency</label>
                    <input
                      id="alert-to"
                      value={alertForm.toCurrency}
                      onChange={(event) =>
                        setAlertForm((current) => ({
                          ...current,
                          toCurrency: event.target.value.toUpperCase()
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label htmlFor="alert-amount">Send amount</label>
                    <input
                      id="alert-amount"
                      inputMode="decimal"
                      value={alertForm.amount}
                      onChange={(event) =>
                        setAlertForm((current) => ({ ...current, amount: event.target.value }))
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="alert-target">Target received amount</label>
                    <input
                      id="alert-target"
                      inputMode="decimal"
                      value={alertForm.targetAmount}
                      onChange={(event) =>
                        setAlertForm((current) => ({
                          ...current,
                          targetAmount: event.target.value
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label htmlFor="alert-condition">Condition</label>
                    <select
                      id="alert-condition"
                      value={alertForm.condition}
                      onChange={(event) =>
                        setAlertForm((current) => ({
                          ...current,
                          condition: event.target.value
                        }))
                      }
                    >
                      <option value="gte">Greater than or equal</option>
                      <option value="lte">Less than or equal</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="alert-provider">Provider type</label>
                    <input
                      id="alert-provider"
                      placeholder="Optional provider type"
                      value={alertForm.providerType}
                      onChange={(event) =>
                        setAlertForm((current) => ({
                          ...current,
                          providerType: event.target.value
                        }))
                      }
                    />
                  </div>
                </div>

                <button className="button button-primary" disabled={isSavingAlert} type="submit">
                  {isSavingAlert ? "Saving..." : "Create alert"}
                </button>
              </form>
            </section>

            <section className="dashboard-card">
              <span className="section-kicker">History</span>
              <h2>Recent comparison activity</h2>
              <div className="history-list">
                {history.length ? (
                  history.slice(0, 6).map((item) => (
                    <article className="history-card" key={item._id}>
                      <div className="card-topline">
                        <div>
                          <strong>
                            {item.fromCurrency}/{item.toCurrency}
                          </strong>
                          <span className="meta-line">{formatDateTime(item.checkedAt)}</span>
                        </div>
                        <strong>{formatMoney(item.amount, item.fromCurrency)}</strong>
                      </div>
                      <div className="pill-row">
                        <span className="pill">Best: {item.stats?.bestRate?.name || "Unknown"}</span>
                        <span className="pill">Avg rate: {formatNumber(item.stats?.averageRate)}</span>
                        <span className="pill">Providers: {item.stats?.totalProviders || 0}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">No stored rate history yet.</div>
                )}
              </div>
            </section>
          </div>

          <div className="dashboard-column">
            <section className="dashboard-card">
              <span className="section-kicker">Alerts</span>
              <h2>Manage saved target rules</h2>
              <div className="alert-list">
                {alerts.length ? (
                  alerts.map((alert) => (
                    <article className="history-card" key={alert._id}>
                      <div className="card-topline">
                        <div>
                          <strong>
                            {alert.fromCurrency}/{alert.toCurrency}
                          </strong>
                          <span className="meta-line">
                            {alert.condition === "gte" ? "Trigger above" : "Trigger below"}{" "}
                            {formatNumber(alert.targetAmount)}
                          </span>
                        </div>
                        <span className="pill">{alert.active ? "Active" : "Paused"}</span>
                      </div>
                      <div className="inline-actions">
                        <button
                          className="button button-secondary button-small"
                          onClick={() => handleToggleAlert(alert)}
                          type="button"
                        >
                          {alert.active ? "Pause" : "Activate"}
                        </button>
                        <button
                          className="button button-danger button-small"
                          onClick={() => handleDeleteAlert(alert._id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">No alerts created yet.</div>
                )}
              </div>
            </section>

            <section className="dashboard-card">
              <span className="section-kicker">Notifications</span>
              <h2>Triggered alert events</h2>
              <div className="notification-list">
                {notifications.length ? (
                  notifications.slice(0, 5).map((item) => (
                    <article className="notification-card" key={item._id}>
                      <div className="card-topline">
                        <div>
                          <strong>{item.message}</strong>
                          <span className="meta-line">{formatDateTime(item.triggeredAt)}</span>
                        </div>
                        <span className="pill">{item.deliveryStatus}</span>
                      </div>
                      <div className="pill-row">
                        <span className="pill">Amount {formatNumber(item.amount)}</span>
                        <span className="pill">Received {formatNumber(item.receivedAmount)}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">No alert notifications yet.</div>
                )}
              </div>
            </section>

            <section className="dashboard-card">
              <span className="section-kicker">Provider reviews</span>
              <h2>Monitor review signals</h2>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="trustpilot-domain">Company domain</label>
                  <input
                    id="trustpilot-domain"
                    value={trustpilotDomain}
                    onChange={(event) => setTrustpilotDomain(event.target.value)}
                  />
                </div>
                <button className="button button-secondary" onClick={loadTrustpilot} type="button">
                  {trustpilotLoading ? "Loading..." : "Load review data"}
                </button>
              </div>

              {stats ? (
                <div className="subgrid subgrid-two">
                  <article className="trustpilot-card">
                    <span className="label">Average rating</span>
                    <strong className="summary-value">{stats.averageRating}</strong>
                    <span className="meta-line">{stats.totalReviews} sampled reviews</span>
                  </article>
                  <article className="trustpilot-card">
                    <span className="label">Verified reviews</span>
                    <strong className="summary-value">{stats.verifiedReviews}</strong>
                    <span className="meta-line">Unverified {stats.unverifiedReviews}</span>
                  </article>
                </div>
              ) : null}

              <div className="trustpilot-list">
                {reviews.length ? (
                  reviews.slice(0, 3).map((review, index) => (
                    <article
                      className="trustpilot-card"
                      key={`${review.consumer?.name || "review"}-${index}`}
                    >
                      <div className="card-topline">
                        <div>
                          <strong>{review.consumer?.name || "Anonymous reviewer"}</strong>
                          <span className="meta-line">{formatDateTime(review.postedAt)}</span>
                        </div>
                        <span className="pill">{review.rating}/5</span>
                      </div>
                      <p className="support-copy">{review.title || review.text}</p>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">
                    {trustpilotLoading
                      ? "Fetching review data."
                      : "Load a company domain to inspect provider review signals."}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
