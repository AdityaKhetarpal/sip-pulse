import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Mark from "@/components/Mark";
import { SpeedInsights } from "@vercel/speed-insights/next";

const SITE = "https://sip-pulse.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  alternates: { canonical: "/" },
  twitter: { card: "summary_large_image" },
  authors: [{ name: "Aditya Khetarpal", url: "https://www.linkedin.com/in/adityakhetarpal" }],
  title: { default: "SIP Pulse: when the Nifty falls, does mutual fund money keep coming?", template: "%s · SIP Pulse" },
  description:
    "91 months of AMFI data, April 2019 to October 2026: what happens to equity mutual fund inflows and SIP contributions when the Nifty 50 falls 5% or more. A locked, pre-registered test.",
  openGraph: { title: "SIP Pulse", description: "When the Nifty falls, the money keeps coming. 91 months of AMFI data, tested.", url: SITE, siteName: "SIP Pulse", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="preload" href="/fonts/instrument-sans-latin-standard-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="stylesheet" href="/fonts/fonts.css" />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <footer className="foot">
          <div className="wrap">
            <div className="foot__grid">
              <div>
                <a className="brand" href="/"><Mark />SIP Pulse</a>
                <p className="foot__lede">Indian mutual fund flows against the Nifty 50, from AMFI data.</p>
              </div>
              <div>
                <h3>Pages</h3>
                <ul>
                  <li><a href="/falls/">Every fall</a></li>
                  <li><a href="/money/">Where the money goes</a></li>
                  <li><a href="/method/">How we tested it</a></li>
                  <li><a href="https://www.linkedin.com/in/adityakhetarpal">Aditya Khetarpal on LinkedIn</a></li>
                </ul>
              </div>
              <div>
                <h3>Data</h3>
                <ul>
                  <li><a href="https://www.amfiindia.com/research-information/amfi-monthly">AMFI monthly reports</a></li>
                  <li><a href="https://www.amfiindia.com/mutual-fund">AMFI SIP data</a></li>
                  <li><a href="https://finance.yahoo.com/quote/%5ENSEI/history/">Nifty 50 closes, Yahoo Finance</a></li>
                  <li><a href="https://github.com/AdityaKhetarpal/sip-pulse">Notebooks on GitHub</a></li>
                </ul>
              </div>
            </div>
            <p className="foot__legal">&copy; 2026 SIP Pulse. For education, not investment advice. Past flows don&apos;t predict future ones. Not affiliated with AMFI or NSE.</p>
          </div>
        </footer>
        <SpeedInsights />
      </body>
    </html>
  );
}
