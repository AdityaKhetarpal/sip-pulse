"use client";
import { usePathname } from "next/navigation";
import Mark from "./Mark";

// The home page's bar: the logo left, the pages in the middle, the one green button right. Plain links, so every
// page is a full load (the home page is static HTML with its own scripts).
const LINKS = [
  ["/", "The answer"],
  ["/falls/", "Every fall"],
  ["/money/", "Where the money goes"],
  ["/method/", "How we tested it"],
] as const;

export default function Nav() {
  const path = usePathname().replace(/index\.html$/, "").replace(/\/?$/, "/");
  return (
    <header className="top">
      <div className="wrap">
        <a href="/" className="brand" aria-label="SIP Pulse home"><Mark />SIP Pulse</a>
        <nav className="nav" aria-label="Pages">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} aria-current={path === href ? "page" : undefined}>{label}</a>
          ))}
        </nav>
        {path !== "/falls/" ? <a className="btn top__btn" href="/falls/">See every fall</a> : <span />}
      </div>
    </header>
  );
}
