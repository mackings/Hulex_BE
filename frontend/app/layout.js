import { AuthProvider } from "@/components/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata = {
  title: "Hulex | Cross-Border Transfer Intelligence",
  description:
    "Compare live remittance routes, then create an account for alerts, history, and provider trust signals."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="site-body">
        <AuthProvider>
          <div className="site-frame">
            <div className="site-glow site-glow-left" />
            <div className="site-glow site-glow-right" />
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
