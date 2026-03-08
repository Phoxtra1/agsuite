import React from 'react';
import { cn } from '@/lib/utils';

interface ProductIconProps {
  className?: string;
}

// AG Main - Globe/Network symbol for public website
export function IconAGHub({ className }: ProductIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-12 h-12', className)}
    >
      <rect width="64" height="64" rx="12" className="fill-primary" />
      <circle cx="32" cy="32" r="16" stroke="hsl(38 92% 50%)" strokeWidth="2" fill="none" />
      <ellipse cx="32" cy="32" rx="8" ry="16" stroke="hsl(38 92% 50%)" strokeWidth="1.5" fill="none" />
      <line x1="16" y1="32" x2="48" y2="32" stroke="hsl(38 92% 50%)" strokeWidth="1.5" />
      <line x1="32" y1="16" x2="32" y2="48" stroke="hsl(38 92% 50%)" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="2" fill="hsl(38 92% 50%)" />
      <circle cx="40" cy="40" r="2" fill="hsl(38 92% 50%)" />
      <circle cx="40" cy="24" r="1.5" fill="hsl(38 92% 50%)" />
      <circle cx="24" cy="40" r="1.5" fill="hsl(38 92% 50%)" />
    </svg>
  );
}

// AG App - Document/Workspace symbol for client portal
export function IconAGIS({ className }: ProductIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-12 h-12', className)}
    >
      <rect width="64" height="64" rx="12" className="fill-primary" />
      {/* Main document */}
      <rect x="18" y="14" width="28" height="36" rx="3" stroke="hsl(38 92% 50%)" strokeWidth="2" fill="none" />
      {/* Folded corner */}
      <path d="M38 14V22H46" stroke="hsl(38 92% 50%)" strokeWidth="2" fill="none" />
      <path d="M38 14L46 22" stroke="hsl(38 92% 50%)" strokeWidth="2" />
      {/* Content lines */}
      <line x1="24" y1="28" x2="40" y2="28" stroke="hsl(38 92% 50%)" strokeWidth="1.5" />
      <line x1="24" y1="34" x2="36" y2="34" stroke="hsl(38 92% 50%)" strokeWidth="1.5" />
      <line x1="24" y1="40" x2="38" y2="40" stroke="hsl(38 92% 50%)" strokeWidth="1.5" />
      {/* User avatar circles */}
      <circle cx="26" cy="46" r="3" fill="hsl(38 92% 50%)" />
      <circle cx="34" cy="46" r="3" fill="hsl(38 92% 50%)" opacity="0.7" />
      <circle cx="42" cy="46" r="3" fill="hsl(38 92% 50%)" opacity="0.4" />
    </svg>
  );
}

// AG Ops - Grid/Blocks symbol for business operations
export function IconAminevaOps({ className }: ProductIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-12 h-12', className)}
    >
      <rect width="64" height="64" rx="12" className="fill-primary" />
      {/* 3x3 Grid of blocks */}
      <rect x="14" y="14" width="10" height="10" rx="2" fill="hsl(38 92% 50%)" />
      <rect x="27" y="14" width="10" height="10" rx="2" fill="hsl(38 92% 50%)" opacity="0.8" />
      <rect x="40" y="14" width="10" height="10" rx="2" fill="hsl(38 92% 50%)" opacity="0.6" />
      <rect x="14" y="27" width="10" height="10" rx="2" fill="hsl(38 92% 50%)" opacity="0.8" />
      <rect x="27" y="27" width="10" height="10" rx="2" fill="hsl(38 92% 50%)" />
      <rect x="40" y="27" width="10" height="10" rx="2" fill="hsl(38 92% 50%)" opacity="0.8" />
      <rect x="14" y="40" width="10" height="10" rx="2" fill="hsl(38 92% 50%)" opacity="0.6" />
      <rect x="27" y="40" width="10" height="10" rx="2" fill="hsl(38 92% 50%)" opacity="0.8" />
      <rect x="40" y="40" width="10" height="10" rx="2" fill="hsl(38 92% 50%)" />
      {/* Connection lines */}
      <line x1="19" y1="24" x2="19" y2="27" stroke="hsl(38 92% 50%)" strokeWidth="1" opacity="0.5" />
      <line x1="32" y1="24" x2="32" y2="27" stroke="hsl(38 92% 50%)" strokeWidth="1" opacity="0.5" />
      <line x1="45" y1="24" x2="45" y2="27" stroke="hsl(38 92% 50%)" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

// AG Stock - Boxes/Inventory symbol for stock management
export function IconAGStock({ className }: ProductIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-12 h-12', className)}
    >
      <rect width="64" height="64" rx="12" className="fill-primary" />
      {/* Main box - 3D perspective */}
      <path d="M32 12L50 22V42L32 52L14 42V22L32 12Z" stroke="hsl(38 92% 50%)" strokeWidth="2" fill="none" />
      <path d="M32 12V32" stroke="hsl(38 92% 50%)" strokeWidth="2" />
      <path d="M32 32L50 22" stroke="hsl(38 92% 50%)" strokeWidth="2" />
      <path d="M32 32L14 22" stroke="hsl(38 92% 50%)" strokeWidth="2" />
      <path d="M32 32V52" stroke="hsl(38 92% 50%)" strokeWidth="2" />
      {/* Barcode pattern */}
      <rect x="22" y="36" width="1.5" height="6" fill="hsl(38 92% 50%)" opacity="0.7" />
      <rect x="25" y="36" width="2" height="6" fill="hsl(38 92% 50%)" opacity="0.7" />
      <rect x="28.5" y="36" width="1" height="6" fill="hsl(38 92% 50%)" opacity="0.7" />
      {/* Small stacked boxes */}
      <rect x="38" y="34" width="6" height="6" rx="1" stroke="hsl(38 92% 50%)" strokeWidth="1" fill="none" opacity="0.6" />
      <rect x="40" y="32" width="6" height="6" rx="1" stroke="hsl(38 92% 50%)" strokeWidth="1" fill="none" opacity="0.4" />
    </svg>
  );
}

// Amniva - Shield/Verification symbol for identity verification
export function IconAmniva({ className }: ProductIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-12 h-12', className)}
    >
      <rect width="64" height="64" rx="12" className="fill-primary" />
      {/* Shield shape */}
      <path 
        d="M32 12L48 18V30C48 40 40 48 32 52C24 48 16 40 16 30V18L32 12Z" 
        stroke="hsl(38 92% 50%)" 
        strokeWidth="2" 
        fill="none" 
      />
      {/* Checkmark inside shield */}
      <path 
        d="M24 32L30 38L40 26" 
        stroke="hsl(38 92% 50%)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none" 
      />
      {/* Fingerprint arc hint */}
      <path 
        d="M28 44C30 45 32 45.5 34 45C36 44.5 38 43 39 42" 
        stroke="hsl(38 92% 50%)" 
        strokeWidth="1" 
        strokeLinecap="round" 
        fill="none" 
        opacity="0.6"
      />
    </svg>
  );
}

// Phoxtra - Camera/Lens symbol for photo/media processing
export function IconPhoxtra({ className }: ProductIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-12 h-12', className)}
    >
      <rect width="64" height="64" rx="12" className="fill-primary" />
      {/* Camera body */}
      <rect x="14" y="22" width="36" height="24" rx="4" stroke="hsl(38 92% 50%)" strokeWidth="2" fill="none" />
      {/* Viewfinder bump */}
      <rect x="24" y="16" width="12" height="8" rx="2" stroke="hsl(38 92% 50%)" strokeWidth="1.5" fill="none" />
      {/* Lens outer ring */}
      <circle cx="32" cy="34" r="9" stroke="hsl(38 92% 50%)" strokeWidth="2" fill="none" />
      {/* Lens inner ring */}
      <circle cx="32" cy="34" r="5" stroke="hsl(38 92% 50%)" strokeWidth="1.5" fill="none" opacity="0.7" />
      {/* Lens center */}
      <circle cx="32" cy="34" r="2" fill="hsl(38 92% 50%)" />
      {/* Flash */}
      <circle cx="44" cy="26" r="2" fill="hsl(38 92% 50%)" opacity="0.6" />
    </svg>
  );
}

// AgroClimate - Leaf + Sun symbol for agricultural climate
export function IconAgroClimate({ className }: ProductIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-12 h-12', className)}
    >
      <rect width="64" height="64" rx="12" className="fill-primary" />
      {/* Sun */}
      <circle cx="40" cy="20" r="6" stroke="hsl(38 92% 50%)" strokeWidth="1.5" fill="none" />
      <circle cx="40" cy="20" r="3" fill="hsl(38 92% 50%)" opacity="0.5" />
      {/* Sun rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 40 + Math.cos(rad) * 8;
        const y1 = 20 + Math.sin(rad) * 8;
        const x2 = 40 + Math.cos(rad) * 10;
        const y2 = 20 + Math.sin(rad) * 10;
        return (
          <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(38 92% 50%)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        );
      })}
      {/* Leaf */}
      <path d="M18 48C18 48 20 28 36 24C36 24 34 44 18 48Z" stroke="hsl(38 92% 50%)" strokeWidth="2" fill="none" />
      {/* Leaf vein */}
      <path d="M27 36C23 40 20 45 18 48" stroke="hsl(38 92% 50%)" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M27 36C31 32 34 28 36 24" stroke="hsl(38 92% 50%)" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4" />
    </svg>
  );
}

// Generic placeholder icon
export function IconPlaceholder({ className }: ProductIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-12 h-12', className)}
    >
      <rect width="64" height="64" rx="12" className="fill-muted" />
      <circle cx="32" cy="32" r="12" stroke="currentColor" strokeWidth="2" className="stroke-muted-foreground" fill="none" />
      <path d="M32 26V32L36 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="stroke-muted-foreground" />
    </svg>
  );
}
