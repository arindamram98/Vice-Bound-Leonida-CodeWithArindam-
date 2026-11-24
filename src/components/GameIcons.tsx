import React from 'react';

interface IconProps {
  className?: string;
}

export const WeaponSvg: React.FC<{ weaponId: string; className?: string }> = ({ weaponId, className = 'w-5 h-5' }) => {
  switch (weaponId) {
    case 'fists':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M7 12V7.5a1.5 1.5 0 0 1 3 0V11" />
          <path d="M10 10.5V6.5a1.5 1.5 0 0 1 3 0V11" />
          <path d="M13 10.5V7a1.5 1.5 0 0 1 3 0v4.5" />
          <path d="M16 11V8.5a1.5 1.5 0 0 1 3 0v6a5.5 5.5 0 0 1-5.5 5.5H11a5 5 0 0 1-5-5v-2a2 2 0 0 1 2-2h6" />
        </svg>
      );
    case 'bat':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M4 20l3-3" />
          <path d="M6.5 17.5l9-11.5a2.2 2.2 0 0 1 3.3 2.8L7.5 18.5z" />
        </svg>
      );
    case 'pistol9':
    case 'silenced9':
    case 'deagle':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M3 8h16v4h-8l-2 7H5.5l1.5-7H3z" />
          {weaponId === 'silenced9' && <path d="M19 9h3v2h-3" />}
          <path d="M10 12v2.5h2" />
        </svg>
      );
    case 'smg':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M3 9h15v4H3z" />
          <path d="M18 10h3v2h-3" />
          <path d="M7 13l-1 6H4l1-6" />
          <path d="M12 13v6h2.2l.4-6" />
          <path d="M8 7h5v2H8z" />
        </svg>
      );
    case 'shotgun':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M2 13l4-2h16v2.2H10l-3 3.8H3z" />
          <path d="M11 13.5h5v1.5h-5z" />
        </svg>
      );
    case 'carbine':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M2 10h16l1 1.5h3v1.5h-4l-1 1H9l-1.5 5H5l1.2-5H2z" />
          <path d="M12 14l1 5h2l-.7-5" />
          <path d="M9 8h5v2H9z" />
        </svg>
      );
    case 'sniper':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M1.5 11.5h15l1 1h5v1h-5.5l-1 1.5H8l-2 4H3.5l1.5-4H1.5z" />
          <path d="M8.5 8h6v2.2h-6z" />
          <path d="M10 10.2v1.3M13 10.2v1.3" />
        </svg>
      );
    case 'grenades':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="7" y="7" width="10" height="13" rx="5" />
          <path d="M10 7V4h4v3" />
          <path d="M14 5l3 1.5v3" />
          <path d="M7.5 12h9M7.5 15.5h9M12 7v13" />
        </svg>
      );
    case 'molotov':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M10 7h4v3l2.5 3.5V20a1.5 1.5 0 0 1-1.5 1.5H9A1.5 1.5 0 0 1 7.5 20v-6.5L10 10V7z" />
          <path d="M12 2.5c1.5 1.5 2 3 0 4.5-1.8-1.4-1.5-3 0-4.5z" />
        </svg>
      );
    case 'rpg':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M2 10h14v4H2z" />
          <path d="M16 9.5l5.5 2.5-5.5 2.5z" />
          <path d="M7 14v4M12 14v3.5" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
        </svg>
      );
  }
};

export const CashSvg: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
    <circle cx="12" cy="12" r="3" />
    <path d="M6 9.5v5M18 9.5v5" />
  </svg>
);

export const StarSvg: React.FC<{ filled?: boolean; className?: string }> = ({ filled, className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2.5 14.9 8.6 21.6 9.5 16.7 14.2 17.9 20.9 12 17.7 6.1 20.9 7.3 14.2 2.4 9.5 9.1 8.6" />
  </svg>
);

export const PhoneSvg: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
    <path d="M10.5 5.5h3M12 18.2h.01" />
  </svg>
);

export const SettingsGearSvg: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const CarSvg: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 11l2-4.5h10L19 11" />
    <rect x="3" y="11" width="18" height="6" rx="1.8" />
    <circle cx="7" cy="17" r="1.8" />
    <circle cx="17" cy="17" r="1.8" />
  </svg>
);

export const ScopeSvg: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className}>
    <circle cx="12" cy="12" r="7.5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
  </svg>
);

export const ReloadSvg: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <polyline points="21 3 21 8.5 15.5 8.5" />
  </svg>
);

export const GasPedalSvg: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 4h10l1.2 15a1.5 1.5 0 0 1-1.5 1.6H7.3A1.5 1.5 0 0 1 5.8 19L7 4z" />
    <path d="M8.5 9h7M8.5 13h7M8.5 17h7" />
  </svg>
);

export const BrakePedalSvg: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="6" width="16" height="12" rx="2.5" />
    <path d="M8 10v4M12 10v4M16 10v4" />
  </svg>
);

export const NitroFlameSvg: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2.5c3 3.2 5.5 6.2 5.5 10a5.5 5.5 0 1 1-11 0c0-2.5 1.2-4.8 2.8-6.7.2 2 1.2 3 2.7 3.2-.6-2.2-.6-4.2 0-6.5z" />
  </svg>
);

export const HornSvg: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 10v4h4l5 4V6L7 10H3z" />
    <path d="M16 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
  </svg>
);

export const HandbrakeSvg: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="7" />
    <path d="M10.5 15V9h2.2a2 2 0 0 1 0 4h-2.2" />
    <path d="M3.5 7.5a11 11 0 0 0 0 9M20.5 7.5a11 11 0 0 1 0 9" />
  </svg>
);

export const ArrowDirSvg: React.FC<{ dir: 'left' | 'right'; className?: string }> = ({ dir, className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
  </svg>
);
