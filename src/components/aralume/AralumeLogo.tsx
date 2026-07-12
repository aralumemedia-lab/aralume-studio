import { cn } from "@/lib/utils";

type Size = number;

export function AralumeIcon({ size = 20, className }: { size?: Size; className?: string }) {
  // Symbol: an abstract "A" formed by a light beam intersecting a soft orbit.
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="16" cy="16" r="11" opacity="0.35" />
      <path d="M9 24 L16 6 L23 24" />
      <path d="M12.6 18.4 L19.4 18.4" />
      <circle cx="16" cy="6" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AralumeWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold tracking-[-0.02em] text-[15px] leading-none", className)}>
      Aralume
    </span>
  );
}

export function AralumeLogo({
  compact,
  className,
  iconClassName,
}: {
  compact?: boolean;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <AralumeIcon size={compact ? 20 : 22} className={iconClassName} />
      {!compact && <AralumeWordmark />}
    </div>
  );
}
