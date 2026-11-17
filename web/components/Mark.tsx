// The SIP Pulse mark: a steady line with one heartbeat, inside a rounded square.
export default function Mark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="1.5" y="1.5" width="29" height="29" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M5 18 H11 L13.5 11 L17 23 L19.5 15 L21 18 H27" fill="none" stroke="var(--money)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
