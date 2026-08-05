import { STORE_NAME } from "@/lib/alemoon";

type BrandLogoProps = {
  className?: string;
  textClassName?: string;
  iconClassName?: string;
};

export function BrandLogo({
  className = "",
  textClassName = "",
  iconClassName = "",
}: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/90 shadow-sm ${iconClassName}`.trim()}
        aria-hidden="true"
      >
        <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none">
          <circle cx="22" cy="24" r="11" fill="var(--alemoon-charcoal)" />
          <circle cx="28" cy="21" r="11" fill="var(--background)" />
          <path
            d="M34 11.5 35.5 15l3.5 1.5-3.5 1.5L34 21.5 32.5 18 29 16.5l3.5-1.5L34 11.5Z"
            fill="var(--alemoon-gold)"
          />
          <circle cx="17.5" cy="18.5" r="1.25" fill="var(--alemoon-gold)" fillOpacity="0.9" />
        </svg>
      </span>
      <span className={`font-display text-2xl tracking-tight text-foreground ${textClassName}`.trim()}>
        {STORE_NAME}
      </span>
    </span>
  );
}
