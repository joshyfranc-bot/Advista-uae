import MarketplaceClient from "../marketplace-client";
import { headers } from "next/headers";
import { getCountryFromHost } from "../country-config";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ test?: string }>;
};

export default async function AdminPage({ searchParams }: PageProps) {
  const [, requestHeaders] = await Promise.all([searchParams, headers()]);
  const country = getCountryFromHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"));
  return <MarketplaceClient country={country} startCampaign={false} resetToken="" adminEntry />;
}
