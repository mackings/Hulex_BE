import { AuthShell } from "@/components/auth-shell";

export const metadata = {
  title: "Sign In | Hulex"
};

function pickValue(value) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default function AuthPage({ searchParams }) {
  return (
    <div className="page-stack shell">
      <AuthShell
        email={pickValue(searchParams?.email)}
        mode="login"
        notice={pickValue(searchParams?.notice)}
      />
    </div>
  );
}
