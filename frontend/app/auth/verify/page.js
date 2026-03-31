import { AuthShell } from "@/components/auth-shell";

export const metadata = {
  title: "Verify Email | Hulex"
};

function pickValue(value) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default function VerifyPage({ searchParams }) {
  return (
    <div className="page-stack shell">
      <AuthShell
        email={pickValue(searchParams?.email)}
        mode="verify"
        notice={pickValue(searchParams?.notice)}
      />
    </div>
  );
}
