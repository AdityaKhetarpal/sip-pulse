import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./footer.css";
import footer from "@/lib/footer.json";
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
                <a className="foot__brand" href="/"><Mark />SIP Pulse</a>
                <p className="foot__lede">{footer.lede}</p>
              </div>
              {footer.columns.map((c) => (
                <div key={c.title}>
                  <h3>{c.title}</h3>
                  <ul>{c.links.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
                </div>
              ))}
            </div>
            <p className="foot__legal">{footer.legal}</p>
          </div>
        </footer>
        <SpeedInsights />
      </body>
    </html>
  );
}
