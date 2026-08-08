import MarketplaceClient from "./marketplace-client";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ start_campaign?: string; reset_token?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return <MarketplaceClient startCampaign={params.start_campaign === "1"} resetToken={params.reset_token || ""} />;
}
