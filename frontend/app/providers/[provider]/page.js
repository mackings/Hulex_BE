import { notFound } from "next/navigation";
import { ProviderReviewShell } from "@/components/provider-review-shell";
import { isKnownProviderAlias } from "@/lib/providers";

export default async function ProviderReviewsPage({ params }) {
  const resolvedParams = await params;
  if (!isKnownProviderAlias(resolvedParams.provider)) {
    notFound();
  }

  return (
    <div className="page-stack shell">
      <ProviderReviewShell providerAlias={resolvedParams.provider} />
    </div>
  );
}
