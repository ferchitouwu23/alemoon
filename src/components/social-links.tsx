import { FACEBOOK_URL, INSTAGRAM_URL } from "@/lib/alemoon";

type SocialLinksProps = {
  className?: string;
  iconOnly?: boolean;
};

export function SocialLinks({ className = "", iconOnly = false }: SocialLinksProps) {
  const itemClass = iconOnly
    ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/90 text-foreground transition hover:-translate-y-0.5 hover:bg-card"
    : "inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/90 px-3 py-2 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:bg-card";

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`.trim()}>
      <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className={itemClass} aria-label="Facebook Alemoon">
        <FacebookIcon />
        {!iconOnly ? <span>Facebook</span> : null}
      </a>
      <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className={itemClass} aria-label="Instagram Alemoon">
        <InstagramIcon />
        {!iconOnly ? <span>Instagram</span> : null}
      </a>
    </div>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M13.5 21v-7.2H16l.4-2.8h-2.9V9.2c0-.8.3-1.4 1.5-1.4h1.6V5.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 4v1.8H8v2.8h2.5V21h3Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M7.2 3h9.6A4.2 4.2 0 0 1 21 7.2v9.6a4.2 4.2 0 0 1-4.2 4.2H7.2A4.2 4.2 0 0 1 3 16.8V7.2A4.2 4.2 0 0 1 7.2 3Zm0 1.8A2.4 2.4 0 0 0 4.8 7.2v9.6a2.4 2.4 0 0 0 2.4 2.4h9.6a2.4 2.4 0 0 0 2.4-2.4V7.2a2.4 2.4 0 0 0-2.4-2.4H7.2Zm10.05 1.35a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8ZM12 7.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 1.8A2.7 2.7 0 1 0 14.7 12 2.7 2.7 0 0 0 12 9.3Z" />
    </svg>
  );
}
