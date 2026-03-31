import { AuthShell } from "@/components/auth-shell";

export const metadata = {
  title: "Create Account | Hulex"
};

function pickValue(value) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default function RegisterPage({ searchParams }) {
  return (
    <div className="page-stack shell">
      <AuthShell
        email={pickValue(searchParams?.email)}
        mode="register"
        notice={pickValue(searchParams?.notice)}
      />
    </div>
  );
}
