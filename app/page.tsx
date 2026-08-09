import MarketplaceClient from "./marketplace-client";
import { headers } from "next/headers";
import { countryConfigs, getCountryFromHost, type CountryCode } from "./country-config";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ start_campaign?: string; reset_token?: string; country?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const [params, requestHeaders] = await Promise.all([searchParams, headers()]);
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const hostname = host.toLowerCase().split(":")[0];
  const isCentralAdminHost = hostname === "admin.asnads.com";
  const previewMode = host.includes("chatgpt.site") || host.includes("terminal.local");
  const previewCountry = params.country?.toLowerCase() as CountryCode | undefined;
  const country = previewMode && previewCountry && countryConfigs[previewCountry]
    ? countryConfigs[previewCountry]
    : getCountryFromHost(host);

  return (
    <MarketplaceClient
      country={country}
      previewMode={previewMode}
      startCampaign={isCentralAdminHost ? false : params.start_campaign === "1"}
      resetToken={isCentralAdminHost ? "" : params.reset_token || ""}
      adminEntry={isCentralAdminHost}
    />
  );
}
