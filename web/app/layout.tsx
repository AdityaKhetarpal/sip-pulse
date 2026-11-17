import type { Metadata, Viewport } from "next";
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "./globals.css";
import Nav from "@/components/Nav";
import Motion from "@/components/Motion";

const SITE = "https://sippulse.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "SIP Pulse: when the Nifty falls, does mutual fund money keep coming?", template: "%s · SIP Pulse" },
  description:
    "91 months of AMFI data, April 2019 to October 2026: what happens to equity mutual fund inflows and SIP contributions when the Nifty 50 falls 5% or more. A locked, pre-registered test.",
  openGraph: { title: "SIP Pulse", description: "When the Nifty falls, the money keeps coming. 91 months of AMFI data, tested.", url: SITE, siteName: "SIP Pulse", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#0a0d10" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <footer>
          <div className="wrap">
            <span>
              Data: <a href="https://www.amfiindia.com/research-information/amfi-monthly">AMFI monthly reports</a> and{" "}
              <a href="https://www.amfiindia.com/mutual-fund">AMFI SIP data</a>; Nifty 50 month-end closes from Yahoo Finance. April 2019 to October 2026.
            </span>
            <span>Analysis for education, not investment advice. Past flows don&apos;t predict future ones. Not affiliated with AMFI or NSE.</span>
            <span>
              <a href="https://github.com/AdityaKhetarpal/sip-pulse">Notebooks and data on GitHub</a> · built by{" "}
              <a href="https://www.linkedin.com/in/adityakhetarpal">Aditya Khetarpal</a>
            </span>
          </div>
        </footer>
        <Motion />
      </body>
    </html>
  );
}
