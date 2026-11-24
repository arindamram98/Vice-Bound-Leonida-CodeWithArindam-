import React, { useState } from 'react';
import { Download, Gamepad2, Globe, Keyboard, Play, X } from 'lucide-react';
import { t } from '../game/i18n';
import { ControlSettings, GameLanguage, ProtagonistId } from '../game/types';

interface TitleScreenProps {
  onStart: (starter: ProtagonistId) => void;
  totalBuildings: number;
  totalInteriors: number;
  controlSettings?: ControlSettings;
  onToggleTouchControls?: () => void;
  onUpdateControlSettings?: (partial: Partial<ControlSettings>) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  totalBuildings,
  totalInteriors,
  controlSettings,
  onToggleTouchControls,
  onUpdateControlSettings,
}) => {
  const [starter, setStarter] = useState<ProtagonistId>('jason');
  const [showControlsPopup, setShowControlsPopup] = useState(false);

  const isNativeApp =
    typeof window !== 'undefined' &&
    Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());

  const touchMode = Boolean(controlSettings?.touchControls);
  const lang: GameLanguage = controlSettings?.language ?? 'en';
  const showPcHints = Boolean(controlSettings?.pcKeyHints) && !touchMode;

  const toggleLanguage = () => {
    const next: GameLanguage = lang === 'en' ? 'hinglish' : 'en';
    onUpdateControlSettings?.({ language: next });
  };

  return (
    <div
      className="fixed inset-0 z-30 h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between p-3.5 sm:p-6 md:p-10 pointer-events-auto bg-gradient-to-r from-[#0a0b12]/92 via-[#0a0b12]/65 to-transparent"
      style={{
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(14px, env(safe-area-inset-left))',
        paddingRight: 'max(14px, env(safe-area-inset-right))',
      }}
    >
      {/* Top Bar: Compact Descriptor + Quick Toggles (Language, Mobile Touch UI, Controls Popup) */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-neutral-300 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold tracking-wider text-white truncate">LEONIDA &amp; VICE CITY</span>
          <span className="hidden md:inline font-mono-num text-neutral-400">
            · {totalBuildings} Buildings · {totalInteriors} Interiors
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {onUpdateControlSettings && (
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-lg border bg-[#11131d]/90 border-white/15 hover:border-white/30 text-neutral-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#2dd4bf]" />
              {lang === 'hinglish' ? 'Hinglish' : 'English'}
            </button>
          )}

          {onToggleTouchControls && (
            <button
              type="button"
              onClick={onToggleTouchControls}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                touchMode
                  ? 'bg-[#2dd4bf] border-[#2dd4bf] text-neutral-950'
                  : 'bg-[#11131d]/90 border-white/15 text-neutral-200 hover:border-white/30'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              Touch UI: {touchMode ? 'ON' : 'OFF'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowControlsPopup(true)}
            className="px-2.5 py-1 rounded-lg border bg-[#11131d]/90 border-white/15 hover:border-white/30 text-neutral-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Keyboard className="w-3.5 h-3.5 text-[#ff5a6e]" />
            Controls
          </button>
        </div>
      </div>

      {/* Center Lockup: Fits cleanly inside 100dvh on portrait AND landscape phones without scrolling */}
      <div className="max-w-xl w-full my-auto flex flex-col gap-2 sm:gap-3.5 min-h-0">
        {/* Responsive Compact SVG Title Lockup */}
        <svg
          viewBox="0 0 540 120"
          className="h-[clamp(48px,12dvh,104px)] w-auto max-w-full self-start shrink-0"
          aria-label="Vice Bound Leonida"
        >
          <defs>
            <linearGradient id="viceSunset" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff7b54" />
              <stop offset="52%" stopColor="#ff4d79" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>
          <text
            x="2"
            y="66"
            fill="url(#viceSunset)"
            fontFamily="Outfit, sans-serif"
            fontWeight="800"
            fontSize="72"
            letterSpacing="-2"
          >
            VICE BOUND
          </text>
          <line x1="4" y1="80" x2="210" y2="80" stroke="#2dd4bf" strokeWidth="3" />
          <text
            x="6"
            y="108"
            fill="#f4f4f6"
            fontFamily="Outfit, sans-serif"
            fontWeight="600"
            fontSize="23"
            letterSpacing="8"
          >
            STATE OF LEONIDA
          </text>
        </svg>

        <p className="text-neutral-200 text-xs sm:text-sm leading-snug max-w-md [@media(max-height:460px)]:hidden">
          {lang === 'hinglish'
            ? 'Jason aur Lucia ke saath Vice Beach aur Northport ghoomo. Clean heists maaro, 6-star police ko chakma do, ya island pe chill karo.'
            : 'Switch seamlessly between Jason and Lucia across Vice Beach, Northport, and Leonida Bay. Pull off heists, outsmart 6-star police, or explore the islands.'}
        </p>

        {/* Compact Protagonist Selector */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-neutral-400">
            {lang === 'hinglish' ? 'Apna Character Chuno' : 'Select Starting Protagonist'}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setStarter('jason')}
              className={`text-left p-2 sm:p-3 rounded-lg border transition-colors cursor-pointer ${
                starter === 'jason'
                  ? 'bg-[#1a1d2b]/95 border-[#ff6b6b] text-white'
                  : 'bg-[#11131d]/90 border-white/10 text-neutral-300 hover:border-white/25'
              }`}
            >
              <div className="font-display font-bold text-xs sm:text-base truncate">Jason Duval</div>
              <div className="text-[10px] sm:text-xs text-neutral-400 truncate mt-0.5">
                {lang === 'hinglish' ? 'Wheelman · Stunt Driver' : 'Wheelman · Armory Ready'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStarter('lucia')}
              className={`text-left p-2 sm:p-3 rounded-lg border transition-colors cursor-pointer ${
                starter === 'lucia'
                  ? 'bg-[#1a1d2b]/95 border-[#2dd4bf] text-white'
                  : 'bg-[#11131d]/90 border-white/10 text-neutral-300 hover:border-white/25'
              }`}
            >
              <div className="font-display font-bold text-xs sm:text-base truncate">Lucia Caminos</div>
              <div className="text-[10px] sm:text-xs text-neutral-400 truncate mt-0.5">
                {lang === 'hinglish' ? 'Infiltrator · Smart AI' : 'Infiltrator · Smart Duo AI'}
              </div>
            </button>
          </div>
        </div>

        {/* Primary PLAY Button + Android APK Download */}
        <div className="pt-0.5 flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onStart(starter)}
            className="px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-lg font-display font-bold text-sm sm:text-base bg-[#ff5a6e] hover:bg-[#ff4259] text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shadow-lg"
          >
            <Play className="w-4 h-4 fill-current" />
            {t(lang, 'enterLeonida')}
          </button>

          {!isNativeApp && (
            <a
              href="/apk/prime-vice-city.apk"
              download="prime-vice-city.apk"
              className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-lg font-display font-semibold text-xs sm:text-sm bg-[#11131d]/90 hover:bg-[#1a1d2b] border border-[#2dd4bf]/60 text-[#2dd4bf] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Android .APK
            </a>
          )}

          {showPcHints && (
            <span className="text-[11px] text-neutral-400 hidden sm:inline">Press Enter to start</span>
          )}
        </div>
      </div>

      {/* Bottom Status Strip (Single clean line — NO large keyboard tables on mobile!) */}
      <div className="text-[11px] shrink-0 truncate">
        {touchMode ? (
          <span className="text-[#2dd4bf] font-medium">
            {lang === 'hinglish'
              ? 'Mobile Touch UI Active — Thumbstick, Steering, Pedals, Aim & Map Tayyar Hai'
              : 'Touch UI Active — Thumbstick, Steering, Pedals, Scope Aim & Fullscreen Map Ready'}
          </span>
        ) : showPcHints ? (
          <span className="text-neutral-400 font-mono-num">
            WASD Move · Mouse Aim/Fire · F Vehicle · E Interact · Q Wheel · M Map · P Phone · Tap &ldquo;Controls&rdquo; for full list
          </span>
        ) : (
          <span className="text-neutral-400">Vice City &amp; Northport · Full Open World</span>
        )}
      </div>

      {/* Compact Controls Popup Drawer / Modal */}
      {showControlsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3">
          <div className="bg-[#12141e] border border-white/15 rounded-xl max-w-[94vw] sm:max-w-lg w-full max-h-[88dvh] overflow-y-auto vice-scroll p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="font-display font-bold text-base sm:text-lg text-white">
                {touchMode ? 'Mobile Touch Controls' : 'PC & Mobile Controls'}
              </h3>
              <button
                type="button"
                onClick={() => setShowControlsPopup(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                aria-label="Close Controls"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {touchMode ? (
              <div className="space-y-2 text-xs text-neutral-200">
                <div className="p-2.5 rounded-lg bg-[#191d2b] border border-white/10">
                  <div className="font-semibold text-[#2dd4bf]">On Foot</div>
                  <p className="text-neutral-300 mt-0.5">
                    Left Thumbstick to walk/run · Drag right side to look · Tap Shoot, Aim/Scope, Jump, Sprint, Reload, or Enter Vehicle.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-[#191d2b] border border-white/10">
                  <div className="font-semibold text-amber-300">Driving &amp; Flying</div>
                  <p className="text-neutral-300 mt-0.5">
                    Left ◀ / ▶ buttons to steer · Right side Gas &amp; Brake/Reverse pedals · Nitro, Drift, Horn &amp; Exit Vehicle buttons.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['WASD / Arrows', 'Move / Drive'],
                  ['Mouse / Right-Click', 'Look / Aim Scope'],
                  ['Left Click', 'Fire / Punch'],
                  ['R / Scroll / 1-9', 'Reload / Weapons'],
                  ['F', 'Enter / Exit Vehicle'],
                  ['E', 'Interact / Shop / Job'],
                  ['Q', 'Weapon Radial Wheel'],
                  ['M / P', 'Full Map / iVice Phone'],
                  ['Tab / B / K', 'Switch / Call Lucia / Car'],
                  ['CapsLock / Space', 'Dead-Eye Focus / Jump'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[#191d2b] border border-white/10 rounded-lg p-2 flex flex-col">
                    <span className="font-mono-num font-bold text-[#2dd4bf] text-[11px]">{k}</span>
                    <span className="text-neutral-300 text-[11px]">{v}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowControlsPopup(false)}
              className="w-full py-2.5 rounded-lg bg-[#ff5a6e] hover:bg-[#ff4259] text-white font-display font-bold text-sm cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
