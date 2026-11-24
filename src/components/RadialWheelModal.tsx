import React, { useState } from 'react';
import {
  Bomb,
  Crosshair,
  Flame,
  Headphones,
  HeartPulse,
  Pill,
  Rocket,
  Shield,
  Sparkles,
  Umbrella,
  Utensils,
  Wrench,
  X,
} from 'lucide-react';
import { HudSnapshot } from '../game/types';

interface RadialWheelModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onSelectWeapon: (weaponId: string) => void;
  onUseTraumaKit: () => void;
  onUsePainkiller: () => void;
  onEatBurger: () => void;
  onCleanWeapon: () => void;
  onToggleEarphones: () => void;
  onToggleUmbrella: () => void;
  onCycleRadio: () => void;
}

interface WheelSlice {
  id: string;
  label: string;
  sub: string;
  accent: string;
  disabled?: boolean;
  active?: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
}

export const RadialWheelModal: React.FC<RadialWheelModalProps> = ({
  hud,
  onClose,
  onSelectWeapon,
  onUseTraumaKit,
  onUsePainkiller,
  onEatBurger,
  onCleanWeapon,
  onToggleEarphones,
  onToggleUmbrella,
  onCycleRadio,
}) => {
  const player = hud.protagonists[hud.activeId];
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const activeWeapon =
    player.equippedWeaponId === 'fists' ||
    player.equippedWeaponId === 'grenades' ||
    player.equippedWeaponId === 'molotov'
      ? null
      : player.weapons.find((w) => w.id === player.equippedWeaponId) ?? null;

  const findOwned = (id: string) => player.weapons.find((w) => w.id === id);

  const firearmDefs: Array<{
    id: string;
    fallbackName: string;
    accent: string;
    icon: React.ReactNode;
    isThrowable?: boolean;
  }> = [
    { id: 'bat', fallbackName: 'Baseball Bat', accent: '#cbd5e1', icon: <Shield className="w-4 h-4" /> },
    { id: 'pistol9', fallbackName: '9mm Pistol', accent: '#ff5a6e', icon: <Crosshair className="w-4 h-4" /> },
    { id: 'smg', fallbackName: 'Micro SMG', accent: '#fb7185', icon: <Crosshair className="w-4 h-4" /> },
    { id: 'shotgun', fallbackName: 'Pump Shotgun', accent: '#f59e0b', icon: <Crosshair className="w-4 h-4" /> },
    { id: 'carbine', fallbackName: 'Assault Rifle', accent: '#fb923c', icon: <Crosshair className="w-4 h-4" /> },
    { id: 'sniper', fallbackName: 'Sniper Rifle', accent: '#38bdf8', icon: <Crosshair className="w-4 h-4" /> },
    { id: 'grenades', fallbackName: 'Frag Grenades', accent: '#eab308', icon: <Bomb className="w-4 h-4" />, isThrowable: true },
    { id: 'molotov', fallbackName: 'Molotov', accent: '#f97316', icon: <Flame className="w-4 h-4" />, isThrowable: true },
    { id: 'rpg', fallbackName: 'RPG Launcher', accent: '#ef4444', icon: <Rocket className="w-4 h-4" /> },
  ];

  // Include any special Fence/DarkWeb sidearms (e.g., silenced9 / deagle) if owned
  const extraWeapons = player.weapons.filter(
    (w) => !firearmDefs.some((d) => d.id === w.id)
  );

  const weaponSlices: WheelSlice[] = [
    {
      id: 'fists',
      label: 'Fists / Melee',
      sub: 'Unarmed Takedown [1]',
      accent: '#e2e8f0',
      active: player.equippedWeaponId === 'fists',
      icon: <Shield className="w-4 h-4" />,
      onSelect: () => {
        onSelectWeapon('fists');
        onClose();
      },
    },
    ...firearmDefs.map((def) => {
      if (def.id === 'grenades') {
        return {
          id: 'grenades',
          label: 'Frag Grenades',
          sub: player.grenades > 0 ? `${player.grenades} Carried · [H] Throw` : 'Buy at Armory',
          accent: def.accent,
          disabled: player.grenades <= 0,
          active: player.equippedWeaponId === 'grenades',
          icon: def.icon,
          onSelect: () => {
            onSelectWeapon('grenades');
            onClose();
          },
        };
      }
      if (def.id === 'molotov') {
        return {
          id: 'molotov',
          label: 'Molotov Cocktail',
          sub: player.molotovs > 0 ? `${player.molotovs} Carried · [H] Throw` : 'Buy at Armory',
          accent: def.accent,
          disabled: player.molotovs <= 0,
          active: player.equippedWeaponId === 'molotov',
          icon: def.icon,
          onSelect: () => {
            onSelectWeapon('molotov');
            onClose();
          },
        };
      }
      const owned = findOwned(def.id);
      return {
        id: def.id,
        label: owned ? owned.name : def.fallbackName,
        sub: owned
          ? owned.category === 'melee'
            ? 'Melee Ready'
            : owned.id === 'rpg'
            ? `${player.rpgAmmo} Rockets · ${Math.round(owned.condition)}%`
            : `${owned.ammo}/${owned.maxAmmo} · ${Math.round(owned.condition)}%`
          : 'Buy at Vice Armory',
        accent: def.accent,
        disabled: !owned,
        active: player.equippedWeaponId === def.id,
        icon: def.icon,
        onSelect: () => {
          onSelectWeapon(def.id);
          onClose();
        },
      };
    }),
    ...extraWeapons.map((ew) => ({
      id: ew.id,
      label: ew.name,
      sub: `${ew.ammo}/${ew.maxAmmo} · ${Math.round(ew.condition)}%`,
      accent: '#2dd4bf',
      active: player.equippedWeaponId === ew.id,
      icon: <Crosshair className="w-4 h-4" />,
      onSelect: () => {
        onSelectWeapon(ew.id);
        onClose();
      },
    })),
  ];

  const cx = 230;
  const cy = 230;
  const rInner = 84;
  const rOuter = 206;
  const total = weaponSlices.length;
  const step = (Math.PI * 2) / total;
  const hovered = hoveredIdx !== null ? weaponSlices[hoveredIdx] : null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
      <div className="bg-[#0b0d15] border border-white/15 rounded-3xl p-5 max-w-xl w-full flex flex-col items-center gap-3.5 shadow-2xl">
        <div className="w-full flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-white">Leonida Weapon &amp; Gear Wheel</h3>
            <p className="text-[11px] text-neutral-400">
              Select Fists, All 9 Arsenal Weapons, Meds &amp; Radio · Press [Q] or Esc to close
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive SVG Radial Weapon Wheel */}
        <div className="relative w-[420px] max-w-full aspect-square flex items-center justify-center">
          <svg viewBox="0 0 460 460" className="w-full h-full select-none">
            {weaponSlices.map((slice, idx) => {
              const a0 = -Math.PI / 2 + idx * step - step / 2 + 0.02;
              const a1 = -Math.PI / 2 + (idx + 1) * step - step / 2 - 0.02;
              const x0i = cx + Math.cos(a0) * rInner;
              const y0i = cy + Math.sin(a0) * rInner;
              const x0o = cx + Math.cos(a0) * rOuter;
              const y0o = cy + Math.sin(a0) * rOuter;
              const x1o = cx + Math.cos(a1) * rOuter;
              const y1o = cy + Math.sin(a1) * rOuter;
              const x1i = cx + Math.cos(a1) * rInner;
              const y1i = cy + Math.sin(a1) * rInner;

              const pathD = [
                `M ${x0i} ${y0i}`,
                `L ${x0o} ${y0o}`,
                `A ${rOuter} ${rOuter} 0 0 1 ${x1o} ${y1o}`,
                `L ${x1i} ${y1i}`,
                `A ${rInner} ${rInner} 0 0 0 ${x0i} ${y0i}`,
                'Z',
              ].join(' ');

              const midA = (a0 + a1) / 2;
              const lx = cx + Math.cos(midA) * ((rInner + rOuter) / 2);
              const ly = cy + Math.sin(midA) * ((rInner + rOuter) / 2);
              const isHov = hoveredIdx === idx;

              return (
                <g
                  key={slice.id}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => !slice.disabled && slice.onSelect()}
                  className={slice.disabled ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'}
                >
                  <path
                    d={pathD}
                    fill={slice.active ? '#1d263b' : isHov ? '#1b2234' : '#121622'}
                    stroke={slice.active || isHov ? slice.accent : 'rgba(255,255,255,0.12)'}
                    strokeWidth={slice.active || isHov ? 2.5 : 1.2}
                  />
                  <foreignObject x={lx - 42} y={ly - 22} width={84} height={44} className="pointer-events-none">
                    <div className="w-full h-full flex flex-col items-center justify-center text-center leading-tight">
                      <span style={{ color: slice.accent }}>{slice.icon}</span>
                      <span className="text-[10px] font-bold text-white truncate max-w-[78px] mt-0.5">
                        {slice.label.split(' ')[0]}
                      </span>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
            <circle cx={cx} cy={cy} r={rInner - 6} fill="#0e121c" stroke="rgba(255,255,255,0.16)" strokeWidth={1.5} />
          </svg>

          {/* Center Wheel Telemetry Hub */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[144px] text-center space-y-1 px-2">
              <div className="text-[10px] uppercase tracking-wider text-[#2dd4bf] font-semibold">
                {hovered
                  ? hovered.label
                  : player.equippedWeaponId === 'grenades'
                  ? 'Frag Grenades'
                  : player.equippedWeaponId === 'molotov'
                  ? 'Molotov Cocktail'
                  : activeWeapon
                  ? activeWeapon.name
                  : 'Fists (Unarmed)'}
              </div>
              <div className="text-[11px] text-neutral-300 font-mono-num">
                {hovered
                  ? hovered.sub
                  : activeWeapon
                  ? `${activeWeapon.id === 'rpg' ? player.rpgAmmo : activeWeapon.ammo}/${activeWeapon.maxAmmo} · ${Math.round(activeWeapon.condition)}%`
                  : `${player.name} Ready`}
              </div>
              {activeWeapon && !hovered && (
                <div className="text-[9px] text-amber-300 font-mono-num">
                  {[
                    activeWeapon.attachments.suppressor && 'SUPP',
                    activeWeapon.attachments.scope && 'SCOPE',
                    activeWeapon.attachments.extendedMag && 'EXT-MAG',
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Standard Spec'}
                </div>
              )}
              {player.bleeding && (
                <div className="text-[10px] font-bold text-rose-400">BLEEDING — USE TRAUMA KIT</div>
              )}
            </div>
          </div>
        </div>

        {/* Survival & Tactical Quick Strip */}
        <div className="w-full grid grid-cols-5 gap-1.5 text-[10px]">
          <button
            type="button"
            disabled={player.traumaKits <= 0}
            onClick={() => {
              onUseTraumaKit();
              onClose();
            }}
            className="p-2 rounded-lg bg-[#151825] border border-white/10 hover:border-rose-400/50 disabled:opacity-40 text-rose-300 font-semibold flex flex-col items-center gap-0.5 cursor-pointer"
          >
            <HeartPulse className="w-3.5 h-3.5" /> Trauma ({player.traumaKits})
          </button>
          <button
            type="button"
            disabled={player.painkillers <= 0}
            onClick={() => {
              onUsePainkiller();
              onClose();
            }}
            className="p-2 rounded-lg bg-[#151825] border border-white/10 hover:border-sky-400/50 disabled:opacity-40 text-sky-300 font-semibold flex flex-col items-center gap-0.5 cursor-pointer"
          >
            <Pill className="w-3.5 h-3.5" /> Pills ({player.painkillers})
          </button>
          <button
            type="button"
            disabled={player.burgers <= 0}
            onClick={() => {
              onEatBurger();
              onClose();
            }}
            className="p-2 rounded-lg bg-[#151825] border border-white/10 hover:border-orange-400/50 disabled:opacity-40 text-orange-300 font-semibold flex flex-col items-center gap-0.5 cursor-pointer"
          >
            <Utensils className="w-3.5 h-3.5" /> Burger ({player.burgers})
          </button>
          <button
            type="button"
            disabled={!activeWeapon}
            onClick={() => {
              onCleanWeapon();
              onClose();
            }}
            className="p-2 rounded-lg bg-[#151825] border border-white/10 hover:border-[#2dd4bf]/50 disabled:opacity-40 text-[#2dd4bf] font-semibold flex flex-col items-center gap-0.5 cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5" /> Clean Gun
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleUmbrella();
              onClose();
            }}
            className={`p-2 rounded-lg border font-semibold flex flex-col items-center gap-0.5 cursor-pointer ${
              player.umbrellaOpen
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-[#151825] border-white/10 text-neutral-300'
            }`}
          >
            <Umbrella className="w-3.5 h-3.5" /> Umbrella
          </button>
        </div>

        {/* Bottom Radio Bar */}
        <div className="w-full flex items-center justify-between bg-[#141826] border border-white/10 rounded-xl px-3.5 py-2 text-xs gap-2">
          <div className="flex items-center gap-2 text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-[#ff5a6e]" />
            <span>Station: <strong className="text-white">{hud.radioStation}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleEarphones}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                hud.earphonesOn ? 'bg-[#2dd4bf] text-neutral-950' : 'bg-white/10 text-neutral-300'
              }`}
            >
              <Headphones className="w-3 h-3" /> Earphones
            </button>
            <button
              type="button"
              onClick={onCycleRadio}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] cursor-pointer"
            >
              Cycle FM [R]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
