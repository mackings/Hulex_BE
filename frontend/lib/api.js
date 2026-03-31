const API_BASE_URL = "/api";

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.append(key, value);
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    cache: "no-store"
  });

  const text = await response.text();
  let payload = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error("The API returned an invalid JSON response");
    }
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || payload.message || "Request failed");
  }

  return payload;
}

export function getCurrencies() {
  return request("/currencies");
}

export function getCountries() {
  return request("/countries");
}

export function compareRates(params) {
  return request(`/compare${buildQuery(params)}`);
}

export function getProviderReviewBundle(providerAlias) {
  return request(`/provider-reviews/${encodeURIComponent(providerAlias)}`);
}

export function registerUser(payload) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function verifyEmail(payload) {
  return request("/auth/verify", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function loginUser(payload) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function requestPasswordReset(payload) {
  return request("/auth/reset/request", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function resetPassword(payload) {
  return request("/auth/reset", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getMe() {
  return request("/profile");
}

export function getHistory() {
  return request("/history");
}

export function getAlerts() {
  return request("/alerts");
}

export function createAlert(payload) {
  return request("/alerts", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAlert(alertId, payload) {
  return request(`/alerts/${alertId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function deleteAlert(alertId) {
  return request(`/alerts/${alertId}`, {
    method: "DELETE"
  });
}

export function getNotifications() {
  return request("/alerts/notifications");
}

export function getWebPushConfig() {
  return request("/alerts/web-push-config");
}

export function registerWebPushSubscription(subscription) {
  return request("/alerts/web-push-subscription", {
    method: "POST",
    body: JSON.stringify({ subscription })
  });
}

export function deleteWebPushSubscription(endpoint) {
  return request("/alerts/web-push-subscription", {
    method: "DELETE",
    body: JSON.stringify({ endpoint })
  });
}

export function deleteSession() {
  return request("/auth/logout", {
    method: "DELETE"
  });
}
