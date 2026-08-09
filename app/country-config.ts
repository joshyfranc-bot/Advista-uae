export type CountryCode = "ae" | "in" | "uk" | "us";

export type CountryConfig = {
  code: CountryCode;
  name: string;
  shortName: string;
  currency: "AED" | "INR" | "GBP" | "USD";
  locale: string;
  domain: string;
  kicker: string;
  headline: string;
  description: string;
  coverageTitle: string;
  marketLabel: string;
  vatLabel: string;
};

export const countryConfigs: Record<CountryCode, CountryConfig> = {
  ae: {
    code: "ae",
    name: "United Arab Emirates",
    shortName: "UAE",
    currency: "AED",
    locale: "en-AE",
    domain: "ae.asnads.com",
    kicker: "THE UAE'S OUTDOOR MEDIA MARKETPLACE",
    headline: "Across the UAE.",
    description: "From major highways and iconic buildings to shopping malls and high-traffic locations—put your brand where the UAE looks.",
    coverageTitle: "7 Emirates. One Marketplace.",
    marketLabel: "UAE",
    vatLabel: "UAE VAT (5%)",
  },
  in: {
    code: "in",
    name: "India",
    shortName: "India",
    currency: "INR",
    locale: "en-IN",
    domain: "in.asnads.com",
    kicker: "INDIA'S OUTDOOR MEDIA MARKETPLACE",
    headline: "Across India.",
    description: "Reach audiences across major cities, highways, transit hubs, shopping centres and high-traffic locations throughout India.",
    coverageTitle: "Major Cities. One Marketplace.",
    marketLabel: "India",
    vatLabel: "Applicable tax",
  },
  uk: {
    code: "uk",
    name: "United Kingdom",
    shortName: "UK",
    currency: "GBP",
    locale: "en-GB",
    domain: "uk.asnads.com",
    kicker: "THE UK'S OUTDOOR MEDIA MARKETPLACE",
    headline: "Across the UK.",
    description: "Put your brand across city centres, motorways, retail destinations, transport hubs and premium outdoor locations throughout the UK.",
    coverageTitle: "Four Nations. One Marketplace.",
    marketLabel: "UK",
    vatLabel: "Applicable VAT",
  },
  us: {
    code: "us",
    name: "United States",
    shortName: "USA",
    currency: "USD",
    locale: "en-US",
    domain: "us.asnads.com",
    kicker: "AMERICA'S OUTDOOR MEDIA MARKETPLACE",
    headline: "Across the United States.",
    description: "Reach audiences across major highways, downtown districts, retail destinations and high-impact outdoor locations throughout the United States.",
    coverageTitle: "50 States. One Marketplace.",
    marketLabel: "United States",
    vatLabel: "Applicable tax",
  },
};

export const countryLinks = Object.values(countryConfigs);

export function getCountryFromHost(hostValue: string | null | undefined): CountryConfig {
  const host = (hostValue ?? "").toLowerCase().split(":")[0];
  const subdomain = host.split(".")[0] as CountryCode;
  return countryConfigs[subdomain] ?? countryConfigs.ae;
}
