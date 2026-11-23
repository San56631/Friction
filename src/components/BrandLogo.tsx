import React from 'react';
import { LOGO_MARK_SRC } from '../domain/friction';

type BrandLogoSize = 'sm' | 'md' | 'lg';

const SIZE_CONFIG: Record<
  BrandLogoSize,
  { boxClass: string; textClass: string; gapClass: string }
> = {
  sm: {
    boxClass: 'w-10 h-8',
    textClass: 'text-base',
    gapClass: 'gap-2'
  },
  md: {
    boxClass: 'w-12 h-10',
    textClass: 'text-xl',
    gapClass: 'gap-2.5'
  },
  lg: {
    boxClass: 'w-14 h-11',
    textClass: 'text-2xl',
    gapClass: 'gap-2.5'
  }
};

export function BrandLogo({
  size = 'md',
  showWordmark = true,
  className = ''
}: {
  size?: BrandLogoSize;
  showWordmark?: boolean;
  className?: string;
}) {
  const cfg = SIZE_CONFIG[size];

  return (
    <span className={`inline-flex items-center ${cfg.gapClass} select-none ${className}`}>
      <span
        className={`relative ${cfg.boxClass} shrink-0 overflow-hidden flex items-center justify-center`}
      >
        <img
          src={LOGO_MARK_SRC}
          alt={showWordmark ? '' : 'Friction'}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain mix-blend-multiply scale-[2.25] translate-y-[4%]"
        />
      </span>
      {showWordmark && (
        <span
          className={`font-display font-extrabold tracking-tight text-brand-navy leading-none ${cfg.textClass}`}
        >
          Friction
        </span>
      )}
    </span>
  );
}
