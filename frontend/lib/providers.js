export const SENDWAVE_LOGO_URL =
  "https://images.ctfassets.net/pqe6664kagrv/1dZzZQVGSTsOwmxCDwUNsf/d83e1361659b72c178b094b85ac348ee/Group.svg?w=500";
export const TAPTAPSEND_LOGO_URL =
  "https://cdn.prod.website-files.com/5ae897b18423ad8b62ceba7c/5af09148dda0362a17ad6abf_logo_icon_white_bg%402x.avif";

export const providerDirectory = {
  instarem: {
    alias: "instarem",
    name: "Instarem",
    website: "https://www.instarem.com/",
    reviewDomain: "instarem.com"
  },
  remitly: {
    alias: "remitly",
    name: "Remitly",
    website: "https://www.remitly.com/",
    reviewDomain: "remitly.com"
  },
  wise: {
    alias: "wise",
    name: "Wise",
    website: "https://wise.com/",
    reviewDomain: "wise.com"
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
    reviewDomain: "worldremit.com"
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

export function getProviderMeta(provider) {
  const aliasKey = normalizeProviderKey(provider?.alias);
  const nameKey = normalizeProviderKey(provider?.name);

  return providerDirectory[aliasKey] || providerDirectory[nameKey] || null;
}

export function withProviderMeta(provider) {
  const meta = getProviderMeta(provider);

  if (!meta) {
    return provider;
  }

  return {
    ...provider,
    logo: meta.logo || provider.logo || null,
    website: meta.website,
    reviewDomain: meta.reviewDomain,
    reviewAlias: meta.alias
  };
}
