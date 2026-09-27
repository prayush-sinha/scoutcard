/**
 * ScoutCard logo system — three variants matching the brand sheet:
 *
 *  • <ScoutCardIcon />        — standalone card + reticle icon (concept B / C)
 *  • <ScoutCardWordmark />    — icon + "SCOUT CARD" text (concept A)
 *  • <ScoutCardFavicon />     — compact "SC" card (concept C)
 */

interface LogoProps {
  className?: string;
}

/** The targeting-reticle card icon. Scales via className / width+height props. */
export function ScoutCardIcon({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 36 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ScoutCard icon"
    >
      {/* Card body */}
      <rect x="1" y="1" width="34" height="42" rx="3" fill="#ff4655" />
      {/* Subtle inner shadow / depth */}
      <rect x="1" y="1" width="34" height="42" rx="3" fill="url(#cardGrad)" />

      {/* ── Corner bracket ticks (radianite teal) ── */}
      {/* Top-left */}
      <path d="M5 10 L5 5 L10 5" stroke="#00e5bc" strokeWidth="1.8" strokeLinecap="square" fill="none" />
      {/* Top-right */}
      <path d="M31 10 L31 5 L26 5" stroke="#00e5bc" strokeWidth="1.8" strokeLinecap="square" fill="none" />
      {/* Bottom-left */}
      <path d="M5 34 L5 39 L10 39" stroke="#00e5bc" strokeWidth="1.8" strokeLinecap="square" fill="none" />
      {/* Bottom-right */}
      <path d="M31 34 L31 39 L26 39" stroke="#00e5bc" strokeWidth="1.8" strokeLinecap="square" fill="none" />

      {/* ── Targeting reticle ── */}
      {/* Outer ring */}
      <circle cx="18" cy="22" r="7" stroke="#0f111a" strokeWidth="1.6" fill="none" />
      {/* Cross-hair arms */}
      <line x1="18" y1="13" x2="18" y2="18" stroke="#0f111a" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="18" y1="26" x2="18" y2="31" stroke="#0f111a" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="9"  y1="22" x2="14" y2="22" stroke="#0f111a" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="22" y1="22" x2="27" y2="22" stroke="#0f111a" strokeWidth="1.6" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="18" cy="22" r="2" fill="#0f111a" />

      {/* Gradient def for card depth */}
      <defs>
        <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0.08" />
          <stop offset="100%" stopColor="black" stopOpacity="0.10" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Full horizontal wordmark — concept A.
 * Used on the landing page header.
 */
export function ScoutCardWordmark({ className }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <ScoutCardIcon className="h-9 w-auto" />
      <div className="leading-none">
        <div className="flex items-baseline gap-0">
          <span className="text-xl font-black uppercase tracking-[0.15em] text-foreground">
            SCOUT
          </span>
          <span className="text-xl font-black uppercase tracking-[0.15em] text-primary">
            CARD
          </span>
        </div>
        <span className="block text-[9px] font-semibold uppercase tracking-[0.25em] text-foreground-muted">
          Valorant Premier Recruiting
        </span>
      </div>
    </div>
  );
}

/**
 * Compact sidebar mark — icon + stacked "SCOUT / CARD" in tight tracking.
 * Used inside the fixed left sidebar.
 */
export function ScoutCardSidebarMark({ className }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <ScoutCardIcon className="h-8 w-auto" />
      <div className="leading-none">
        <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
          SCOUT
        </span>
        <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-primary">
          CARD
        </span>
      </div>
    </div>
  );
}
