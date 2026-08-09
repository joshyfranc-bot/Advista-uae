import MarketplaceClient from "../marketplace-client";
import { headers } from "next/headers";
import { countryConfigs, getCountryFromHost, type CountryCode } from "../country-config";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ test?: string; country?: string }>;
};

export default async function AdminPage({ searchParams }: PageProps) {
  const [params, requestHeaders] = await Promise.all([searchParams, headers()]);
  const requestedCountry = params.country as CountryCode | undefined;
  const country = requestedCountry && countryConfigs[requestedCountry]
    ? countryConfigs[requestedCountry]
    : getCountryFromHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"));
  return <MarketplaceClient country={country} previewMode startCampaign={false} resetToken="" adminEntry />;
}
