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
  phonePrefix: string;
  phonePlaceholder: string;
  regionLabel: string;
  regions: Record<string, string[]>;
  roadExamples: string[];
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
    phonePrefix: "+971",
    phonePlaceholder: "+971 50 123 4567",
    regionLabel: "Emirate",
    regions: {
      Dubai: ["Sheikh Zayed Road", "Al Khail Road", "Downtown Dubai", "Dubai Marina"],
      "Abu Dhabi": ["Corniche Road", "Airport Road", "Yas Island", "Al Reem Island"],
      Sharjah: ["Al Majaz", "Al Khan", "University City", "Muwaileh"],
    },
    roadExamples: ["Sheikh Zayed Road", "Al Khail Road", "Corniche Road"],
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
    phonePrefix: "+91",
    phonePlaceholder: "+91 98765 43210",
    regionLabel: "City",
    regions: {
      Mumbai: ["Western Express Highway", "Bandra Linking Road", "Marine Drive", "Lower Parel"],
      Delhi: ["Outer Ring Road", "Connaught Place", "Dhaula Kuan", "Aerocity"],
      Bengaluru: ["Outer Ring Road", "MG Road", "Indiranagar", "Electronic City"],
      Chennai: ["Anna Salai", "OMR", "ECR", "T Nagar"],
    },
    roadExamples: ["Western Express Highway", "Delhi Outer Ring Road", "Bengaluru Outer Ring Road"],
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
    phonePrefix: "+44",
    phonePlaceholder: "+44 7700 900123",
    regionLabel: "City",
    regions: {
      London: ["Oxford Street", "Piccadilly Circus", "Westway", "Canary Wharf"],
      Manchester: ["Deansgate", "Oxford Road", "Princess Parkway", "MediaCity"],
      Birmingham: ["Broad Street", "Aston Expressway", "Bullring", "New Street"],
      Glasgow: ["Buchanan Street", "Great Western Road", "Clyde Street", "M8 Corridor"],
    },
    roadExamples: ["Oxford Street", "Piccadilly Circus", "Manchester Deansgate"],
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
    phonePrefix: "+1",
    phonePlaceholder: "+1 202 555 0123",
    regionLabel: "City",
    regions: {
      "New York": ["Times Square", "Broadway", "Fifth Avenue", "Queens Boulevard"],
      "Los Angeles": ["Sunset Boulevard", "Hollywood Boulevard", "I-405 Corridor", "Downtown LA"],
      Chicago: ["Michigan Avenue", "Wacker Drive", "Kennedy Expressway", "State Street"],
      Miami: ["Biscayne Boulevard", "Ocean Drive", "Brickell Avenue", "I-95 Corridor"],
    },
    roadExamples: ["Times Square and Broadway", "Sunset Boulevard", "Michigan Avenue"],
  },
};

export const countryLinks = Object.values(countryConfigs);

export function getCountryFromHost(hostValue: string | null | undefined): CountryConfig {
  const host = (hostValue ?? "").toLowerCase().split(":")[0];
  const subdomain = host.split(".")[0] as CountryCode;
  return countryConfigs[subdomain] ?? countryConfigs.ae;
}
