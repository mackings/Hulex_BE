import { AuthShell } from "@/components/auth-shell";

export const metadata = {
  title: "Reset Password | Hulex"
};

function pickValue(value) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default function ResetPasswordPage({ searchParams }) {
  return (
    <div className="page-stack shell">
      <AuthShell
        email={pickValue(searchParams?.email)}
        mode="reset"
        notice={pickValue(searchParams?.notice)}
      />
    </div>
  );
}
