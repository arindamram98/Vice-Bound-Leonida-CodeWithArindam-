import React, { useState } from 'react';
import { ControlSettings, ProtagonistId } from '../game/types';

interface TitleScreenProps {
  onStart: (starter: ProtagonistId) => void;
  totalBuildings: number;
  totalInteriors: number;
  controlSettings?: ControlSettings;
  onToggleTouchControls?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  totalBuildings,
  totalInteriors,
  controlSettings,
  onToggleTouchControls,
}) => {
  const [starter, setStarter] = useState<ProtagonistId>('jason');

  const isNativeApp =
    typeof window !== 'undefined' &&
    Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());

  const touchMode = Boolean(controlSettings?.touchControls);
  const showPcHints = Boolean(controlSettings?.pcKeyHints) && !touchMode;

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between p-5 sm:p-8 md:p-12 overflow-y-auto pointer-events-auto bg-gradient-to-r from-[#0a0b12]/90 via-[#0a0b12]/55 to-transparent">
      {/* Top quiet descriptor + Mobile UI Quick Switch */}
      <div className="flex flex-wrap items-center justify-between text-xs tracking-wider text-neutral-300 gap-3">
        <span>LEONIDA &amp; VICE CITY OPEN WORLD</span>
        <div className="flex items-center gap-3">
          {onToggleTouchControls && (
            <button
              type="button"
              onClick={onToggleTouchControls}
              className={`px-3 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
                touchMode
                  ? 'bg-[#2dd4bf] border-[#2dd4bf] text-neutral-950'
                  : 'bg-[#11131d]/90 border-white/15 text-neutral-300 hover:border-white/30'
              }`}
            >
              Mobile Touch UI: {touchMode ? 'ON' : 'OFF'}
            </button>
          )}
          <span className="font-mono-num text-neutral-400">
            {totalBuildings} Buildings · {totalInteriors} Seamless Interiors · 32 Activities
          </span>
        </div>
      </div>

      {/* Main Left-Aligned Lockup leaving 40%+ right viewport open to live 3D Vice City */}
      <div className="max-w-xl my-auto py-4 space-y-5">
        {/* Bespoke SVG Title Lockup */}
        <svg viewBox="0 0 540 132" className="w-full max-w-lg h-auto" aria-label="Vice Bound Leonida">
          <defs>
            <linearGradient id="viceSunset" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff7b54" />
              <stop offset="52%" stopColor="#ff4d79" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>
          <text
            x="2"
            y="72"
            fill="url(#viceSunset)"
            fontFamily="Outfit, sans-serif"
            fontWeight="800"
            fontSize="74"
            letterSpacing="-2"
          >
            VICE BOUND
          </text>
          <line x1="4" y1="88" x2="210" y2="88" stroke="#2dd4bf" strokeWidth="3" />
          <text
            x="6"
            y="116"
            fill="#f4f4f6"
            fontFamily="Outfit, sans-serif"
            fontWeight="600"
            fontSize="24"
            letterSpacing="8"
          >
            STATE OF LEONIDA
          </text>
        </svg>

        <p className="text-neutral-200 text-sm sm:text-base leading-relaxed max-w-md">
          Switch seamlessly between Jason and Lucia across sunlit Vice Beach, Neon Ocean Drive, and Leonida Bay. Pull
          off clean heists, outsmart 6-star police AI, or dive the reef.
        </p>

        {/* Starting Protagonist Selector */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-neutral-400">Select Starting Protagonist</div>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setStarter('jason')}
              className={`text-left p-3 sm:p-3.5 rounded-lg border transition-colors cursor-pointer ${
                starter === 'jason'
                  ? 'bg-[#1a1d2b] border-[#ff6b6b] text-white'
                  : 'bg-[#11131d]/90 border-white/10 text-neutral-300 hover:border-white/25'
              }`}
            >
              <div className="font-display font-bold text-sm sm:text-base">Jason Duval</div>
              <div className="text-xs text-neutral-400 mt-0.5">Wheelman · Starts Unarmed (Armory Ready)</div>
            </button>

            <button
              type="button"
              onClick={() => setStarter('lucia')}
              className={`text-left p-3 sm:p-3.5 rounded-lg border transition-colors cursor-pointer ${
                starter === 'lucia'
                  ? 'bg-[#1a1d2b] border-[#2dd4bf] text-white'
                  : 'bg-[#11131d]/90 border-white/10 text-neutral-300 hover:border-white/25'
              }`}
            >
              <div className="font-display font-bold text-sm sm:text-base">Lucia Caminos</div>
              <div className="text-xs text-neutral-400 mt-0.5">Infiltrator · Smart Companion AI</div>
            </button>
          </div>
        </div>

        {/* Primary Start CTA + Android APK Download */}
        <div className="pt-1 flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => onStart(starter)}
            className="px-8 py-3.5 rounded-lg font-display font-bold text-base bg-[#ff5a6e] hover:bg-[#ff4259] text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Enter Leonida
          </button>
          {!isNativeApp && (
            <a
              href="/apk/prime-vice-city.apk"
              download="prime-vice-city.apk"
              className="px-5 py-3.5 rounded-lg font-display font-semibold text-sm bg-[#11131d]/90 hover:bg-[#1a1d2b] border border-[#2dd4bf]/60 text-[#2dd4bf] transition-colors cursor-pointer whitespace-nowrap"
            >
              Download Android .APK
            </a>
          )}
          {showPcHints && <span className="text-xs text-neutral-400 hidden sm:inline">Press Enter or Space</span>}
        </div>
      </div>

      {/* PC Control Hints (completely hidden in Mobile Touch UI mode) */}
      {showPcHints ? (
        <div className="text-xs text-neutral-300 font-mono-num">
          WASD Move · Q Weapon Wheel · Click Attack · CapsLock Focus · H Throw · F Vehicles/Boats/Planes · E Interact · Tab Switch · K Partner · M GPS Map · P Phone
        </div>
      ) : (
        <div className="text-xs text-[#2dd4bf]/90 font-medium">
          Touch Controls Active — Dual Thumbstick, Pedals, Aim &amp; Fullscreen Map Ready
        </div>
      )}
    </div>
  );
};
