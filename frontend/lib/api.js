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

function withAuth(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
}

export function getCurrencies() {
  return request("/currencies");
}

export function getCountries() {
  return request("/countries");
}

export function compareRates(params) {
  return request(`/rates/compare${buildQuery(params)}`);
}

export function getPublicTrustpilotStats(companyDomain) {
  return request(`/public/trustpilot/stats${buildQuery({ company_domain: companyDomain })}`);
}

export function getPublicTrustpilotReviews(companyDomain) {
  return request(
    `/public/trustpilot/reviews${buildQuery({ company_domain: companyDomain, locale: "en-US", page: 1 })}`
  );
}

export function registerUser(payload) {
  return request("/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function verifyEmail(payload) {
  return request("/verify-email", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function loginUser(payload) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function requestPasswordReset(payload) {
  return request("/request-password-reset", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function resetPassword(payload) {
  return request("/reset-password", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getMe(token) {
  return request("/me", withAuth(token));
}

export function getHistory(token) {
  return request("/history", withAuth(token));
}

export function getAlerts(token) {
  return request("/alerts", withAuth(token));
}

export function createAlert(token, payload) {
  return request("/alerts", {
    method: "POST",
    body: JSON.stringify(payload),
    ...withAuth(token)
  });
}

export function updateAlert(token, alertId, payload) {
  return request(`/alerts/${alertId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    ...withAuth(token)
  });
}

export function deleteAlert(token, alertId) {
  return request(`/alerts/${alertId}`, {
    method: "DELETE",
    ...withAuth(token)
  });
}

export function getNotifications(token) {
  return request("/alerts/notifications", withAuth(token));
}

export function getTrustpilotStats(token, companyDomain) {
  return request(`/trustpilot/stats${buildQuery({ company_domain: companyDomain })}`, withAuth(token));
}

export function getTrustpilotReviews(token, companyDomain) {
  return request(
    `/trustpilot/reviews${buildQuery({ company_domain: companyDomain, locale: "en-US", page: 1 })}`,
    withAuth(token)
  );
}
