"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { compareRates, getCountries } from "@/lib/api";
import { formatMoney, formatNumber, providerTypeLabel } from "@/lib/format";
import { getProviderReviewHref, withProviderMeta } from "@/lib/providers";

const defaultForm = {
  fromCountry: "US",
  toCountry: "NG",
  amount: "100"
};

function getProviderInitials(name) {
  return String(name || "HX")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeQuery(value) {
  return String(value || "").trim().toLowerCase();
}

function sortCountriesAlphabetically(items) {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CountryPicker({
  id,
  label,
  selectedCountry,
  countries,
  searchValue,
  isOpen,
  panelRef,
  onToggle,
  onSearchChange,
  onSelect
}) {
  const normalizedSearch = normalizeQuery(searchValue);
  const filteredCountries = useMemo(() => {
    if (!normalizedSearch) {
      return countries;
    }

    return countries.filter((country) => {
      const haystack = [
        country.name,
        country.currency,
        country.currencyName,
        country.region,
        country.code
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [countries, normalizedSearch]);

  return (
    <div className={`field country-picker${isOpen ? " country-picker-open" : ""}`} ref={panelRef}>
      <label htmlFor={id}>{label}</label>

      <button
        aria-controls={`${id}-menu`}
        aria-expanded={isOpen}
        className="country-picker-trigger"
        id={id}
        onClick={onToggle}
        type="button"
      >
        <div className="country-picker-trigger-main">
          <span className="country-picker-flag" aria-hidden="true">
            {selectedCountry?.flag || "•"}
          </span>
          <div className="country-picker-copy">
            <strong>{selectedCountry?.name || "Select country"}</strong>
            <span>
              {selectedCountry
                ? `${selectedCountry.currency} · ${selectedCountry.currencyName}`
                : "Search by country or currency"}
            </span>
          </div>
        </div>
        <span className="country-picker-chevron" aria-hidden="true">
          <ChevronIcon />
        </span>
      </button>

      {isOpen ? (
        <div className="country-picker-menu" id={`${id}-menu`}>
          <div className="country-picker-search">
            <span className="country-picker-search-icon" aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              autoFocus
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search country, code, or currency"
              type="text"
              value={searchValue}
            />
          </div>

          <div className="country-picker-options">
            {filteredCountries.length ? (
              filteredCountries.map((country) => (
                <button
                  className={`country-picker-option${
                    selectedCountry?.code === country.code ? " country-picker-option-active" : ""
                  }`}
                  key={country.code}
                  onClick={() => onSelect(country)}
                  type="button"
                >
                  <span className="country-picker-option-flag" aria-hidden="true">
                    {country.flag}
                  </span>
                  <div className="country-picker-option-copy">
                    <strong>{country.name}</strong>
                    <span>
                      {country.currency} · {country.currencyName}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="country-picker-empty">No countries match that search.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProviderMark({ provider }) {
  const [hasError, setHasError] = useState(false);
  const initials = getProviderInitials(provider?.name);

  if (provider?.logo && !hasError) {
    return (
      <div className="provider-brand provider-brand-logo">
        <img
          alt={`${provider.name} logo`}
          className="provider-logo"
          loading="lazy"
          referrerPolicy="no-referrer"
          src={provider.logo}
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return <div className="provider-brand provider-brand-fallback">{initials}</div>;
}

export function ComparisonExperience({ hero = false }) {
  const { isAuthenticated } = useAuth();
  const [countries, setCountries] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [pickerSearch, setPickerSearch] = useState({ from: "", to: "" });
  const [activePicker, setActivePicker] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [error, setError] = useState("");
  const fromPickerRef = useRef(null);
  const toPickerRef = useRef(null);

  useEffect(() => {
    setIsLoadingCountries(true);
    getCountries()
      .then((data) => {
        setCountries(sortCountriesAlphabetically(data.countries || []));
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoadingCountries(false);
      });
  }, []);

  useEffect(() => {
    if (!activePicker) {
      return undefined;
    }

    const currentRef = activePicker === "from" ? fromPickerRef : toPickerRef;

    const handlePointerDown = (event) => {
      if (!currentRef.current?.contains(event.target)) {
        setActivePicker(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [activePicker]);

  const selectedFromCountry = useMemo(
    () => countries.find((country) => country.code === form.fromCountry) || null,
    [countries, form.fromCountry]
  );

  const selectedToCountry = useMemo(
    () => countries.find((country) => country.code === form.toCountry) || null,
    [countries, form.toCountry]
  );

  const totalCurrencies = useMemo(
    () => new Set(countries.map((country) => country.currency)).size,
    [countries]
  );

  useEffect(() => {
    let active = true;
    const normalizedAmount = Number(form.amount);

    if (
      !selectedFromCountry ||
      !selectedToCountry ||
      Number.isNaN(normalizedAmount) ||
      normalizedAmount <= 0
    ) {
      setResult(null);
      setIsLoadingRates(false);
      return undefined;
    }

    setIsLoadingRates(true);
    setError("");

    const timeoutId = window.setTimeout(() => {
      compareRates({
        fromCurrency: selectedFromCountry.currency,
        toCurrency: selectedToCountry.currency,
        fromCountry: selectedFromCountry.code,
        toCountry: selectedToCountry.code,
        amount: form.amount
      })
        .then((data) => {
          if (active) {
            setResult(data);
          }
        })
        .catch((err) => {
          if (active) {
            setResult(null);
            setError(err.message);
          }
        })
        .finally(() => {
          if (active) {
            setIsLoadingRates(false);
          }
        });
    }, 150);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [form.amount, selectedFromCountry, selectedToCountry]);

  const allProviders = useMemo(
    () => (result?.providers || []).map((provider) => withProviderMeta(provider)),
    [result]
  );
  const topProviders = useMemo(() => allProviders.slice(0, 3), [allProviders]);
  const heroProviders = useMemo(() => allProviders.slice(0, 2), [allProviders]);

  const handleCountrySelect = (side, country) => {
    setForm((current) => ({
      ...current,
      [side === "from" ? "fromCountry" : "toCountry"]: country.code
    }));
    setPickerSearch((current) => ({ ...current, [side]: "" }));
    setActivePicker(null);
  };

  if (hero) {
    return (
      <div className="comparison-hero-card">
        <div className="comparison-hero-head">
          <div>
            <span className="section-kicker">Live rates</span>
            <h2>See the strongest route in seconds.</h2>
          </div>
          <div className="tag-row">
            <span className="tag">
              {isLoadingCountries ? "Connecting..." : `${totalCurrencies} currencies`}
            </span>
            <span className="tag">
              {result ? "Live market" : isLoadingRates ? "Refreshing" : "Ready"}
            </span>
          </div>
        </div>

        <div className="comparison-country-row">
          <CountryPicker
            countries={countries}
            id="hero-fromCountry"
            isOpen={activePicker === "from"}
            label="You send from"
            panelRef={fromPickerRef}
            searchValue={pickerSearch.from}
            selectedCountry={selectedFromCountry}
            onSearchChange={(value) =>
              setPickerSearch((current) => ({ ...current, from: value }))
            }
            onSelect={(country) => handleCountrySelect("from", country)}
            onToggle={() => setActivePicker((current) => (current === "from" ? null : "from"))}
          />

          <CountryPicker
            countries={countries}
            id="hero-toCountry"
            isOpen={activePicker === "to"}
            label="Recipient country"
            panelRef={toPickerRef}
            searchValue={pickerSearch.to}
            selectedCountry={selectedToCountry}
            onSearchChange={(value) => setPickerSearch((current) => ({ ...current, to: value }))}
            onSelect={(country) => handleCountrySelect("to", country)}
            onToggle={() => setActivePicker((current) => (current === "to" ? null : "to"))}
          />
        </div>

        <div className="form-grid compare-form-grid">
          <div className="field">
            <label htmlFor="hero-amount">Amount</label>
            <input
              className="comparison-amount-input"
              id="hero-amount"
              inputMode="decimal"
              min="1"
              step="0.01"
              value={form.amount}
              onChange={(event) =>
                setForm((current) => ({ ...current, amount: event.target.value }))
              }
            />
          </div>
        </div>

        {error ? <div className="error-message">{error}</div> : null}

        {isLoadingRates ? (
          <div className="comparison-loading-state">
            Checking the market for the latest returned providers.
          </div>
        ) : result ? (
          <div className="comparison-hero-results">
            <div className="comparison-highlight-grid">
              <article className="data-card">
                <span className="label">Best route</span>
                <strong className="summary-value">{result.stats.bestRate?.name || "N/A"}</strong>
                <span className="meta-line">
                  {formatMoney(result.stats.bestRate?.receivedAmount, result.query.target.code)}
                </span>
              </article>
              <article className="data-card">
                <span className="label">Average rate</span>
                <strong className="summary-value">{formatNumber(result.stats.averageRate)}</strong>
                <span className="meta-line">{result.stats.totalProviders} providers returned</span>
              </article>
              <article className="data-card">
                <span className="label">Send amount</span>
                <strong className="summary-value">
                  {formatMoney(result.query.sendAmount, result.query.source.code)}
                </strong>
                <span className="meta-line">
                  {selectedFromCountry?.flag || "•"} {selectedFromCountry?.name} to{" "}
                  {selectedToCountry?.flag || "•"} {selectedToCountry?.name}
                </span>
              </article>
            </div>

            <div className="provider-mini-list">
              {heroProviders.map((provider, index) => (
                <Link
                  className="provider-mini-card provider-card-link"
                  href={getProviderReviewHref(provider)}
                  key={`${provider.alias}-${index}`}
                >
                  <div className="provider-rank">
                    <div className="provider-rank-main">
                      <ProviderMark provider={provider} />
                      <div className="provider-rank-copy">
                        <span className="label">#{index + 1} ranked</span>
                        <strong>{provider.name}</strong>
                      </div>
                    </div>
                    <div className="rank-badge">{index + 1}</div>
                  </div>
                  <p className="amount-emphasis">
                    {formatMoney(provider.receivedAmount, result.query.target.code)}
                  </p>
                  <div className="provider-meta">
                    Rate {formatNumber(provider.rate)} · {providerTypeLabel(provider.type)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="comparison-loading-state">No comparison data yet.</div>
        )}

        <div className="panel-actions">
          <Link className="button button-primary" href={isAuthenticated ? "/dashboard" : "/auth/register"}>
            {isAuthenticated ? "Open dashboard" : "Create account for alerts"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="section-card compare-experience-card">
      <div className="section-header compare-section-header">
        <div>
          <span className="section-kicker">Live comparison</span>
          <h2>Compare real payout results across providers.</h2>
          <p>
            Pick where the money is leaving from and where it is going, then see the
            highest payout first with provider reviews one tap away.
          </p>
        </div>
        <div className="tag-row">
          <span className="tag">
            {isLoadingCountries ? "Loading countries" : `${countries.length} countries`}
          </span>
          <span className="tag">{result?.stats?.totalProviders || 0} providers ranked</span>
        </div>
      </div>

      <div className="comparison-grid">
        <div className="form-card compare-form-card">
          <div className="compare-form-copy">
            <span className="section-kicker">Set the route</span>
            <h3>Choose countries, then check the best payout.</h3>
            <p>Search countries alphabetically and compare the real delivered amount.</p>
          </div>

          <div className="form-grid compare-form-grid">
            <div className="comparison-country-row">
              <CountryPicker
                countries={countries}
                id="fromCountry"
                isOpen={activePicker === "from"}
                label="You send from"
                panelRef={fromPickerRef}
                searchValue={pickerSearch.from}
                selectedCountry={selectedFromCountry}
                onSearchChange={(value) =>
                  setPickerSearch((current) => ({ ...current, from: value }))
                }
                onSelect={(country) => handleCountrySelect("from", country)}
                onToggle={() => setActivePicker((current) => (current === "from" ? null : "from"))}
              />

              <CountryPicker
                countries={countries}
                id="toCountry"
                isOpen={activePicker === "to"}
                label="Recipient country"
                panelRef={toPickerRef}
                searchValue={pickerSearch.to}
                selectedCountry={selectedToCountry}
                onSearchChange={(value) =>
                  setPickerSearch((current) => ({ ...current, to: value }))
                }
                onSelect={(country) => handleCountrySelect("to", country)}
                onToggle={() => setActivePicker((current) => (current === "to" ? null : "to"))}
              />
            </div>

            <div className="field compare-amount-field">
              <label htmlFor="amount">Amount</label>
              <input
                className="comparison-amount-input"
                id="amount"
                inputMode="decimal"
                min="1"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, amount: event.target.value }))
                }
              />
            </div>
          </div>

          {error ? <div className="error-message">{error}</div> : null}

          <div className="panel-actions">
            <Link className="button button-primary" href={isAuthenticated ? "/dashboard" : "/auth/register"}>
              {isAuthenticated ? "Open dashboard" : "Create account for alerts"}
            </Link>
          </div>
        </div>

        <div className="results-card compare-results-card">
          {isLoadingRates ? (
            <div className="empty-state">Checking the market for the latest returned provider data.</div>
          ) : result ? (
            <div className="results-stack">
              <div className="summary-grid">
                <article className="data-card">
                  <span className="label">Best provider</span>
                  <strong className="summary-value">{result.stats.bestRate?.name || "N/A"}</strong>
                  <span className="meta-line">
                    {formatMoney(result.stats.bestRate?.receivedAmount, result.query.target.code)} delivered
                  </span>
                </article>
                <article className="data-card">
                  <span className="label">Average rate</span>
                  <strong className="summary-value">{formatNumber(result.stats.averageRate)}</strong>
                  <span className="meta-line">Across {result.stats.totalProviders} providers</span>
                </article>
                <article className="data-card">
                  <span className="label">Transfer amount</span>
                  <strong className="summary-value">
                    {formatMoney(result.query.sendAmount, result.query.source.code)}
                  </strong>
                  <span className="meta-line">
                    {selectedFromCountry?.flag || "•"} {selectedFromCountry?.name} to{" "}
                    {selectedToCountry?.flag || "•"} {selectedToCountry?.name}
                  </span>
                </article>
              </div>

              <div className="top-results">
                {topProviders.map((provider, index) => (
                  <Link
                    className="result-card provider-card-link"
                    href={getProviderReviewHref(provider)}
                    key={`${provider.alias}-${index}`}
                  >
                    <div className="provider-rank">
                      <div className="provider-rank-main">
                        <ProviderMark provider={provider} />
                        <div className="provider-rank-copy">
                          <span className="label">#{index + 1} ranked</span>
                          <strong>{provider.name}</strong>
                        </div>
                      </div>
                      <div className="rank-badge">{index + 1}</div>
                    </div>
                    <p className="amount-emphasis">
                      {formatMoney(provider.receivedAmount, result.query.target.code)}
                    </p>
                    <div className="provider-meta">
                      Rate {formatNumber(provider.rate)} · Fee{" "}
                      {formatMoney(provider.fee, result.query.source.code)} ·{" "}
                      {providerTypeLabel(provider.type)}
                    </div>
                  </Link>
                ))}
              </div>

              <div className="providers-mobile-list">
                {allProviders.map((provider, index) => (
                  <Link
                    className="result-card provider-card-link provider-mobile-card"
                    href={getProviderReviewHref(provider)}
                    key={`${provider.alias || provider.id}-mobile-${index}`}
                  >
                    <div className="provider-rank">
                      <div className="provider-rank-main">
                        <ProviderMark provider={provider} />
                        <div className="provider-rank-copy">
                          <span className="label">#{index + 1} ranked</span>
                          <strong>{provider.name}</strong>
                        </div>
                      </div>
                      <div className="rank-badge">{index + 1}</div>
                    </div>
                    <p className="amount-emphasis">
                      {formatMoney(provider.receivedAmount, result.query.target.code)}
                    </p>
                    <div className="provider-mobile-stats">
                      <span>Rate {formatNumber(provider.rate)}</span>
                      <span>Fee {formatMoney(provider.fee, result.query.source.code)}</span>
                      <span>{providerTypeLabel(provider.type)}</span>
                    </div>
                    <span className="button button-secondary button-small">Open reviews</span>
                  </Link>
                ))}
              </div>

              <div className="dashboard-card providers-table-card">
                <div className="providers-table-wrap">
                  <table className="providers-table">
                    <thead>
                      <tr>
                        <th>Provider</th>
                        <th>Received</th>
                        <th>Rate</th>
                        <th>Fee</th>
                        <th>Type</th>
                        <th>Reviews</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProviders.map((provider) => (
                        <tr key={provider.alias || provider.id}>
                          <td>
                            <div className="provider-table-name">
                              <ProviderMark provider={provider} />
                              <span>{provider.name}</span>
                            </div>
                          </td>
                          <td>{formatMoney(provider.receivedAmount, result.query.target.code)}</td>
                          <td>{formatNumber(provider.rate)}</td>
                          <td>{formatMoney(provider.fee, result.query.source.code)}</td>
                          <td className="table-subtle">{providerTypeLabel(provider.type)}</td>
                          <td>
                            <Link
                              className="button button-secondary button-small"
                              href={getProviderReviewHref(provider)}
                            >
                              Open reviews
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">No comparison data yet.</div>
          )}
        </div>
      </div>
    </section>
  );
}
