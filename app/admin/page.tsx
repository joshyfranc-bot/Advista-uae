import MarketplaceClient from "../marketplace-client";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ test?: string }>;
};

export default async function AdminPage({ searchParams }: PageProps) {
  await searchParams;
  return <MarketplaceClient startCampaign={false} resetToken="" adminEntry />;
}
