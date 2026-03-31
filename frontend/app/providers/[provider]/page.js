import { ProviderReviewShell } from "@/components/provider-review-shell";

export default async function ProviderReviewsPage({ params }) {
  const resolvedParams = await params;

  return (
    <div className="page-stack shell">
      <ProviderReviewShell providerAlias={resolvedParams.provider} />
    </div>
  );
}
