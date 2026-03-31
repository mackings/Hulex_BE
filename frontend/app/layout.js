import { DM_Sans } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { BrowserNotificationManager } from "@/components/browser-notification-manager";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap"
});

export const metadata = {
  title: "Hulex | Cross-Border Transfer Intelligence",
  description:
    "Compare live remittance routes, then create an account for alerts, history, and provider trust signals."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${dmSans.className} site-body`}>
        <AuthProvider>
          <BrowserNotificationManager />
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
