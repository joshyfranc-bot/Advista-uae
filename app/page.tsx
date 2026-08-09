import MarketplaceClient from "./marketplace-client";
import { headers } from "next/headers";
import { getCountryFromHost } from "./country-config";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ start_campaign?: string; reset_token?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const [params, requestHeaders] = await Promise.all([searchParams, headers()]);
  const country = getCountryFromHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"));

  return <MarketplaceClient country={country} startCampaign={params.start_campaign === "1"} resetToken={params.reset_token || ""} />;
}
