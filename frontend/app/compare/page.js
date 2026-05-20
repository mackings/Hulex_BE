import { ComparisonExperience } from "@/components/comparison-experience";

export const metadata = {
  title: "Compare Rates | Hulex"
};

export default function ComparePage() {
  return (
    <div className="page-stack shell compare-page">
      <ComparisonExperience />
    </div>
  );
}
