export const SENDWAVE_LOGO_URL =
  "/provider-logos/sendwave-wordmark.svg";
export const TAPTAPSEND_LOGO_URL =
  "/provider-logos/taptapsend.avif";
export const INSTAREM_LOGO_URL = "/provider-logos/instarem-wordmark.png";
export const WISE_LOGO_URL = "/provider-logos/wise.svg";
export const REMITLY_LOGO_URL = "/provider-logos/remitly.png";
export const WORLDREMIT_LOGO_URL = "/provider-logos/worldremit.png";

export const providerDirectory = {
  instarem: {
    alias: "instarem",
    name: "Instarem",
    website: "https://www.instarem.com/",
    reviewDomain: "instarem.com",
    logo: INSTAREM_LOGO_URL
  },
  remitly: {
    alias: "remitly",
    name: "Remitly",
    website: "https://www.remitly.com/",
    reviewDomain: "remitly.com",
    logo: REMITLY_LOGO_URL
  },
  wise: {
    alias: "wise",
    name: "Wise",
    website: "https://wise.com/",
    reviewDomain: "wise.com",
    logo: WISE_LOGO_URL
  },
  sendwave: {
    alias: "sendwave",
    name: "Sendwave",
    website: "https://www.sendwave.com/",
    reviewDomain: "sendwave.com",
    logo: SENDWAVE_LOGO_URL
  },
  worldremit: {
    alias: "worldremit",
    name: "WorldRemit",
    website: "https://www.worldremit.com/",
    reviewDomain: "worldremit.com",
    logo: WORLDREMIT_LOGO_URL
  },
  xe: {
    alias: "xe",
    name: "XE",
    website: "https://www.xe.com/send-money/",
    reviewDomain: "xe.com"
  },
  ria: {
    alias: "ria",
    name: "Ria",
    website: "https://www.riamoneytransfer.com/",
    reviewDomain: "riamoneytransfer.com"
  },
  xoom: {
    alias: "xoom",
    name: "Xoom",
    website: "https://www.xoom.com/",
    reviewDomain: "xoom.com"
  },
  taptapsend: {
    alias: "taptapsend",
    name: "Taptap Send",
    website: "https://www.taptapsend.com/",
    reviewDomain: "taptapsend.com",
    logo: TAPTAPSEND_LOGO_URL
  },
  mukuru: {
    alias: "mukuru",
    name: "Mukuru",
    website: "https://www.mukuru.com/",
    reviewDomain: "mukuru.com"
  },
  paysend: {
    alias: "paysend",
    name: "Paysend",
    website: "https://paysend.com/",
    reviewDomain: "paysend.com"
  },
  westernunion: {
    alias: "westernunion",
    name: "Western Union",
    website: "https://www.westernunion.com/",
    reviewDomain: "westernunion.com"
  },
  moneygram: {
    alias: "moneygram",
    name: "MoneyGram",
    website: "https://www.moneygram.com/",
    reviewDomain: "moneygram.com"
  },
  revolut: {
    alias: "revolut",
    name: "Revolut",
    website: "https://www.revolut.com/",
    reviewDomain: "revolut.com"
  }
};

function normalizeProviderKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function toSafeHttpsUrl(value) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function isKnownProviderAlias(value) {
  return Boolean(providerDirectory[normalizeProviderKey(value)]);
}

export function getProviderMeta(provider) {
  const aliasKey = normalizeProviderKey(provider?.alias);
  const nameKey = normalizeProviderKey(provider?.name);

  return providerDirectory[aliasKey] || providerDirectory[nameKey] || null;
}

export function getProviderReviewHref(provider) {
  const meta = getProviderMeta(provider);
  const alias = normalizeProviderKey(
    meta?.alias || provider?.reviewAlias || provider?.alias || provider?.name
  );

  if (!alias || !providerDirectory[alias]) {
    return "/compare";
  }

  return `/providers/${encodeURIComponent(alias)}`;
}

export function getSafeProviderWebsite(provider) {
  const meta = getProviderMeta(provider);
  return toSafeHttpsUrl(meta?.website || provider?.website);
}

export function withProviderMeta(provider) {
  const meta = getProviderMeta(provider);

  if (!meta) {
    return provider;
  }

  return {
    ...provider,
    logo: meta.logo || provider.logo || null,
    website: toSafeHttpsUrl(meta.website),
    reviewDomain: meta.reviewDomain,
    reviewAlias: meta.alias
  };
}
