import React, { useEffect, useRef } from 'react';
import {
  Bomb,
  Car,
  CloudRain,
  Compass,
  Heart,
  HeartPulse,
  MapPin,
  Pause,
  Radio,
  Shield,
  Sun,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  AIRPORT_ZONE,
  BRIDGES,
  CENTRAL_PARK,
  NORTH_ISLAND,
  ROAD_SEGMENTS,
  SAFEHOUSE_ISLANDS,
  SOUTH_ISLAND,
  WOODEN_DOCKS,
} from '../game/worldData';
import { HudSnapshot, ProtagonistId } from '../game/types';
import { getWeaponDisplayName, t } from '../game/i18n';
import { ArrowDirSvg, CashSvg, PhoneSvg, SettingsGearSvg, StarSvg, WeaponSvg } from './GameIcons';

interface HUDProps {
  hud: HudSnapshot;
  onSwitchProtagonist: () => void;
  onTogglePartner: () => void;
  onTogglePartnerInCar: () => void;
  onOpenPhone: () => void;
  onOpenMap: () => void;
  onOpenWheel: () => void;
  onOpenPause: () => void;
  onCycleRadio: () => void;
  onToggleMute: () => void;
  onToggleSlowMo: () => void;
  onCycleWeapon: (dir: 1 | -1) => void;
  onRespawn: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  hud,
  onSwitchProtagonist,
  onTogglePartner,
  onTogglePartnerInCar,
  onOpenPhone,
  onOpenMap,
  onOpenWheel,
  onOpenPause,
  onCycleRadio,
  onToggleMute,
  onToggleSlowMo,
  onCycleWeapon,
  onRespawn,
}) => {
  const minimapRef = useRef<HTMLCanvasElement | null>(null);

  const player = hud.protagonists[hud.activeId];
  const partnerId: ProtagonistId = hud.activeId === 'jason' ? 'lucia' : 'jason';
  const lang = hud.controlSettings.language;
  const touchMode = hud.controlSettings.touchControls;
  const showHints = hud.controlSettings.pcKeyHints && !touchMode;
  const miniSize = touchMode ? 118 : 156;

  const activeWeapon =
    player.equippedWeaponId === 'fists' ||
    player.equippedWeaponId === 'grenades' ||
    player.equippedWeaponId === 'molotov'
      ? null
      : player.weapons.find((w) => w.id === player.equippedWeaponId) ?? null;

  useEffect(() => {
    const canvas = minimapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = miniSize;
    const half = size / 2;
    const scale = touchMode ? 0.36 : 0.44;

    const toMini = (wx: number, wz: number) => ({
      mx: half + (wx - player.x) * scale,
      my: half + (wz - player.z) * scale,
    });

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#0c3b55';
    ctx.fillRect(0, 0, size, size);

    const sTL = toMini(SOUTH_ISLAND.cx - SOUTH_ISLAND.hx, SOUTH_ISLAND.cz - SOUTH_ISLAND.hz);
    ctx.fillStyle = '#192030';
    ctx.fillRect(sTL.mx, sTL.my, SOUTH_ISLAND.hx * 2 * scale, SOUTH_ISLAND.hz * 2 * scale);

    const beachTL = toMini(338, SOUTH_ISLAND.cz - SOUTH_ISLAND.hz + 2);
    ctx.fillStyle = '#8b7752';
    ctx.fillRect(beachTL.mx, beachTL.my, 34 * scale, (SOUTH_ISLAND.hz * 2 - 4) * scale);

    const nTL = toMini(NORTH_ISLAND.cx - NORTH_ISLAND.hx, NORTH_ISLAND.cz - NORTH_ISLAND.hz);
    ctx.fillStyle = '#182230';
    ctx.fillRect(nTL.mx, nTL.my, NORTH_ISLAND.hx * 2 * scale, NORTH_ISLAND.hz * 2 * scale);

    const woodsTL = toMini(NORTH_ISLAND.cx - NORTH_ISLAND.hx + 3, -540);
    ctx.fillStyle = '#1c422c';
    ctx.fillRect(woodsTL.mx, woodsTL.my, (NORTH_ISLAND.hx * 2 - 6) * scale, 108 * scale);

    const airTL = toMini(-560, -520);
    ctx.fillStyle = '#202938';
    ctx.fillRect(airTL.mx, airTL.my, 240 * scale, 270 * scale);

    for (const isl of SAFEHOUSE_ISLANDS) {
      const c = toMini(isl.cx, isl.cz);
      ctx.fillStyle = '#99835b';
      ctx.beginPath();
      ctx.arc(c.mx, c.my, isl.halfSize * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#245d38';
      ctx.beginPath();
      ctx.arc(c.mx, c.my, (isl.halfSize - 18) * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    const parkTL = toMini(CENTRAL_PARK.cx - CENTRAL_PARK.w / 2, CENTRAL_PARK.cz - CENTRAL_PARK.d / 2);
    ctx.fillStyle = '#256b3b';
    ctx.fillRect(parkTL.mx, parkTL.my, CENTRAL_PARK.w * scale, CENTRAL_PARK.d * scale);

    const rwTL = toMini(
      AIRPORT_ZONE.runwayX - AIRPORT_ZONE.runwayLen / 2,
      AIRPORT_ZONE.runwayZ - AIRPORT_ZONE.runwayW / 2
    );
    ctx.fillStyle = '#3b485e';
    ctx.fillRect(rwTL.mx, rwTL.my, AIRPORT_ZONE.runwayLen * scale, AIRPORT_ZONE.runwayW * scale);

    for (const seg of ROAD_SEGMENTS) {
      const p1 = toMini(seg.x1, seg.z1);
      const p2 = toMini(seg.x2, seg.z2);
      ctx.strokeStyle = seg.isHighway ? '#4f5f7d' : '#2f3a52';
      ctx.lineWidth = Math.max(2, seg.width * scale * 0.72);
      ctx.beginPath();
      ctx.moveTo(p1.mx, p1.my);
      ctx.lineTo(p2.mx, p2.my);
      ctx.stroke();
    }

    for (const br of BRIDGES) {
      const bTL = toMini(br.cx - br.width / 2, br.cz - br.length / 2);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(bTL.mx, bTL.my, br.width * scale, br.length * scale);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      const mid = toMini(br.cx, br.cz);
      ctx.beginPath();
      ctx.moveTo(mid.mx, bTL.my);
      ctx.lineTo(mid.mx, bTL.my + br.length * scale);
      ctx.stroke();
    }
    for (const dk of WOODEN_DOCKS) {
      const dTL = toMini(dk.xMin, dk.zMin);
      ctx.fillStyle = '#9a6d43';
      ctx.fillRect(dTL.mx, dTL.my, (dk.xMax - dk.xMin) * scale, (dk.zMax - dk.zMin) * scale);
    }

    if (hud.gpsRoute && hud.gpsRoute.length >= 2) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      hud.gpsRoute.forEach((pt, idx) => {
        const m = toMini(pt.x, pt.z);
        if (idx === 0) ctx.moveTo(m.mx, m.my);
        else ctx.lineTo(m.mx, m.my);
      });
      ctx.stroke();
    }

    const drawBadge = (ex: number, ey: number, bg: string, txt: string) => {
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(ex, ey, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#090b10';
      ctx.font = 'bold 5.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(txt, ex, ey + 0.5);
    };

    for (const ent of hud.minimapEntities) {
      const { mx: ex, my: ey } = toMini(ent.x, ent.z);
      if (ex < 5 || ex > size - 5 || ey < 5 || ey > size - 5) continue;

      if (ent.kind === 'police') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(ex, ey, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (ent.kind === 'partner') {
        drawBadge(ex, ey, '#2dd4bf', hud.activeId === 'jason' ? 'L' : 'J');
      } else if (ent.kind === 'home') {
        drawBadge(ex, ey, '#ec4899', 'H');
      } else if (ent.kind === 'bungalow') {
        drawBadge(ex, ey, '#38bdf8', 'IS');
      } else if (ent.kind === 'clothes') {
        drawBadge(ex, ey, '#f472b6', 'CL');
      } else if (ent.kind === 'park') {
        drawBadge(ex, ey, '#22c55e', 'P');
      } else if (ent.kind === 'coffee') {
        drawBadge(ex, ey, '#f59e0b', 'C');
      } else if (ent.kind === 'bar') {
        drawBadge(ex, ey, '#a855f7', 'B');
      } else if (ent.kind === 'gunshop') {
        drawBadge(ex, ey, '#f97316', 'G');
      } else if (ent.kind === 'precinct') {
        drawBadge(ex, ey, '#3b82f6', 'PD');
      } else if (ent.kind === 'airport') {
        drawBadge(ex, ey, '#38bdf8', 'A');
      } else if (ent.kind === 'gym') {
        drawBadge(ex, ey, '#fb7185', 'GM');
      } else if (ent.kind === 'job') {
        drawBadge(ex, ey, '#facc15', '$');
      } else if (ent.kind === 'boat') {
        drawBadge(ex, ey, '#06b6d4', 'B');
      } else if (ent.kind === 'burgershot') {
        drawBadge(ex, ey, '#fb923c', 'BS');
      } else if (ent.kind === 'bank') {
        drawBadge(ex, ey, '#22c55e', 'BK');
      } else if (ent.kind === 'drop') {
        drawBadge(ex, ey, '#4ade80', '★');
      } else if (ent.kind === 'gas') {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(ex - 2.5, ey - 2.5, 5, 5);
      } else if (ent.kind === 'fence') {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(ex - 2.5, ey - 2.5, 5, 5);
      } else if (ent.kind === 'mission') {
        ctx.fillStyle = '#ff4d6d';
        ctx.beginPath();
        ctx.arc(ex, ey, 4.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (ent.kind === 'vehicle') {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(ex - 1.5, ey - 1.5, 3, 3);
      }
    }

    if (hud.waypoint) {
      const dx = (hud.waypoint.x - player.x) * scale;
      const dz = (hud.waypoint.z - player.z) * scale;
      const dist = Math.hypot(dx, dz);
      const ax = dist > half - 7 ? half + (dx / dist) * (half - 7) : half + dx;
      const az = dist > half - 7 ? half + (dz / dist) * (half - 7) : half + dz;
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ax, az, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(half, half);
    ctx.rotate(-player.yaw);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 4.5);
    ctx.lineTo(0, 2);
    ctx.lineTo(-4, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, [hud, player.x, player.z, player.yaw, miniSize, touchMode]);

  if (hud.screen === 'wasted') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#09090d]/85 pointer-events-auto p-4">
        <div className="bg-[#12141e] border border-white/15 rounded-xl p-8 max-w-sm w-full text-center space-y-4">
          <h2 className="font-display font-extrabold text-4xl text-[#ff4d6d]">{t(lang, 'wasted')}</h2>
          <p className="text-sm text-neutral-300">
            {player.name} {t(lang, 'wastedDesc')}
          </p>
          <button
            type="button"
            onClick={onRespawn}
            className="w-full py-3 rounded-lg bg-[#ff4d6d] hover:bg-[#ff3357] text-white font-display font-bold cursor-pointer"
          >
            {t(lang, 'continueGame')}
          </button>
        </div>
      </div>
    );
  }

  const isRain = hud.weather === 'rain' || hud.weather === 'storm';
  const isSniperAim = hud.aiming && player.equippedWeaponId === 'sniper';

  const weaponName =
    player.equippedWeaponId === 'fists'
      ? getWeaponDisplayName(lang, 'fists', 'Fists')
      : player.equippedWeaponId === 'grenades'
      ? getWeaponDisplayName(lang, 'grenades', 'Frag Grenade')
      : player.equippedWeaponId === 'molotov'
      ? getWeaponDisplayName(lang, 'molotov', 'Molotov')
      : activeWeapon
      ? getWeaponDisplayName(lang, activeWeapon.id, activeWeapon.name)
      : getWeaponDisplayName(lang, 'fists', 'Fists');

  const ammoText =
    player.equippedWeaponId === 'fists'
      ? 'MELEE'
      : player.equippedWeaponId === 'grenades'
      ? `${player.grenades}`
      : player.equippedWeaponId === 'molotov'
      ? `${player.molotovs}`
      : activeWeapon
      ? activeWeapon.category === 'melee'
        ? 'MELEE'
        : `${activeWeapon.id === 'rpg' ? player.rpgAmmo : activeWeapon.ammo}/${activeWeapon.maxAmmo}`
      : '';

  const minimapWidget = (
    <div className="bg-[#0d0f17]/92 border border-white/15 rounded-xl p-1.5 flex flex-col gap-1 pointer-events-auto shadow-lg">
      <button
        type="button"
        onClick={onOpenMap}
        className="relative group rounded-lg overflow-hidden border border-white/15 cursor-pointer block"
        title={showHints ? 'Click or press [M] to open Full Map' : 'Tap to open Full Map'}
      >
        <canvas ref={minimapRef} width={miniSize} height={miniSize} className="block" />
        <span className="absolute bottom-1 right-1 bg-[#0b0d15]/90 text-[10px] font-mono-num text-[#38bdf8] px-1.5 py-0.5 rounded border border-white/10">
          {t(lang, 'map').toUpperCase()}
          {showHints ? ' [M]' : ''}
        </span>
      </button>

      <div className="grid grid-cols-2 gap-1 px-0.5">
        <div>
          <div className="flex justify-between text-[9px] text-neutral-400">
            <span>HP</span>
            <span className="font-mono-num">{Math.round(player.health)}</span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-sm overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${player.health}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[9px] text-neutral-400">
            <span>ARM</span>
            <span className="font-mono-num">{Math.round(player.armor)}</span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-sm overflow-hidden">
            <div className="h-full bg-sky-400" style={{ width: `${player.armor}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[9px] text-neutral-400">
            <span>STM</span>
            <span className="font-mono-num">{Math.round(player.stamina)}</span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-sm overflow-hidden">
            <div className="h-full bg-amber-400" style={{ width: `${(player.stamina / player.maxStamina) * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[9px] text-neutral-400">
            <span>FOC</span>
            <span className="font-mono-num">{Math.round(player.focusMeter)}</span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-sm overflow-hidden">
            <div className="h-full bg-rose-400" style={{ width: `${(player.focusMeter / player.maxFocusMeter) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );

  const locationBadge = (
    <div className="bg-[#0d0f17]/88 border border-white/10 rounded-lg px-2.5 py-1.5 max-w-[230px] sm:max-w-xs space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] text-neutral-200">
        <MapPin className="w-3.5 h-3.5 text-[#2dd4bf] shrink-0" />
        <span className="font-semibold text-white truncate">
          {hud.currentInterior ? hud.currentInterior.name : hud.currentDistrict}
        </span>
        <span className="text-neutral-500">·</span>
        <span className="font-mono-num text-neutral-400">{hud.timeOfDayLabel}</span>
        {isRain ? <CloudRain className="w-3.5 h-3.5 text-sky-300" /> : <Sun className="w-3.5 h-3.5 text-amber-300" />}
      </div>
      {hud.activeMission && (
        <div className="text-[10px] text-amber-300 truncate">{hud.activeMission.objectiveText}</div>
      )}
      {hud.burgerJob.activeDelivery && (
        <div className="bg-orange-500/20 border border-orange-400/45 rounded px-2 py-0.5 text-[10px] text-orange-200 flex items-center justify-between gap-2 font-mono-num">
          <span className="truncate">Deliver: {hud.burgerJob.activeDelivery.customerName}</span>
          <span className="font-bold text-orange-300">{Math.ceil(hud.burgerJob.activeDelivery.timer)}s</span>
        </div>
      )}
      {player.inWater && (
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-[10px] text-cyan-300">O2</span>
          <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400" style={{ width: `${player.oxygen}%` }} />
          </div>
          <span className="text-[10px] font-mono-num text-cyan-200">{hud.underwaterTreasureFound}/5</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono-num">
        {hud.slowMoActive && <span className="text-amber-400 font-bold">DEAD-EYE FOCUS</span>}
        {player.bleeding && (
          <span className="text-rose-400 font-bold flex items-center gap-0.5">
            <HeartPulse className="w-3 h-3" /> BLEEDING
          </span>
        )}
        {player.painkillerTimer > 0 && (
          <span className="text-sky-300">PAINKILLER {Math.ceil(player.painkillerTimer)}s</span>
        )}
        {player.crouching && <span className="text-emerald-300">CROUCH</span>}
        {player.prone && <span className="text-emerald-300">PRONE</span>}
        {player.parachuting && <span className="text-amber-300 font-bold">PARACHUTE</span>}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between"
      style={{
        paddingTop: 'max(10px, env(safe-area-inset-top))',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(12px, env(safe-area-inset-left))',
        paddingRight: 'max(12px, env(safe-area-inset-right))',
      }}
    >
      {/* Crisp GTA Aim Reticle / Full Sniper Scope Overlay */}
      {!hud.drivingVehicle && (player.equippedWeaponId !== 'fists' || hud.aiming) && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          {isSniperAim ? (
            <div className="fixed inset-0 flex items-center justify-center bg-black/55">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border-2 border-emerald-400/90 bg-emerald-950/15 shadow-[0_0_0_9999px_rgba(0,0,0,0.68)] flex items-center justify-center">
                <div className="absolute inset-x-0 h-px bg-emerald-400/60" />
                <div className="absolute inset-y-0 w-px bg-emerald-400/60" />
                <div className="absolute w-24 h-24 rounded-full border border-emerald-400/35" />
                <div className="w-2 h-2 rounded-full bg-[#ff4d6d]" />
                <span className="absolute bottom-3 text-[10px] font-mono-num text-emerald-300 tracking-widest">
                  {t(lang, 'scopeZoomLabel')}
                </span>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-full border flex items-center justify-center transition-all ${
                hud.aiming ? 'w-6 h-6 border-[#ff4d6d]' : 'w-3.5 h-3.5 border-white/80'
              }`}
            >
              <div className="w-1 h-1 rounded-full bg-[#ff4d6d]" />
            </div>
          )}
        </div>
      )}

      {/* TOP ROW */}
      <div className="flex items-start justify-between gap-2.5">
        {/* Top-Left: In Mobile Touch Mode, Minimap + Health/Armor/Stamina live here! */}
        {touchMode ? (
          <div className="flex items-start gap-2">
            {minimapWidget}
            <div className="flex flex-col gap-1.5">
              {locationBadge}
              <div className="bg-[#0d0f17]/88 border border-white/10 rounded-lg px-2 py-1 flex items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={onSwitchProtagonist}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white cursor-pointer"
                >
                  {partnerId === 'jason' ? 'Jason' : 'Lucia'}
                </button>
                <button
                  type="button"
                  onClick={onTogglePartner}
                  className={`px-2 py-1 rounded text-[10px] font-semibold cursor-pointer flex items-center gap-1 ${
                    hud.relationship.duoActive ? 'bg-[#2dd4bf] text-neutral-950' : 'bg-white/10 text-neutral-200'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  {hud.relationship.duoActive ? t(lang, 'sendHome') : t(lang, 'callDuo')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          locationBadge
        )}

        {/* Top-Right: Cash, Wanted Stars, Weapon Switcher (◀ Gun ▶), Phone & Settings */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          <div className="bg-[#0d0f17]/90 border border-white/12 rounded-xl px-2.5 py-1.5 flex items-center gap-2.5 sm:gap-3">
            {/* Wanted Stars */}
            <div className="flex items-center gap-0.5" aria-label="6 Star Wanted Level">
              {[1, 2, 3, 4, 5, 6].map((star) => (
                <StarSvg
                  key={star}
                  filled={star <= hud.wanted.stars}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    star <= hud.wanted.stars ? 'text-amber-400' : 'text-neutral-700'
                  }`}
                />
              ))}
            </div>

            {/* Cash */}
            <div className="flex items-center gap-1 text-right">
              <CashSvg className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-mono-num font-bold text-sm sm:text-base text-emerald-400 leading-tight">
                  ${hud.cash.toLocaleString()}
                </div>
                <div className="font-mono-num text-[10px] text-neutral-400 hidden sm:block">
                  Bank ${hud.bankBalance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Phone & Settings Buttons */}
            <div className="flex items-center gap-1 pl-1 border-l border-white/10">
              <button
                type="button"
                onClick={onOpenPhone}
                className="p-2 rounded-lg bg-[#ff5a6e] hover:bg-[#ff4259] text-white cursor-pointer"
                aria-label={t(lang, 'phone')}
              >
                <PhoneSvg className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenPause}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-100 cursor-pointer"
                aria-label={t(lang, 'settings')}
              >
                <SettingsGearSvg className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weapon Switcher ◀ Gun ▶ + Ammo */}
          <div className="bg-[#0d0f17]/90 border border-white/12 rounded-xl px-1.5 py-1 flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => onCycleWeapon(-1)}
              className="p-1.5 rounded-lg hover:bg-white/15 text-neutral-300 cursor-pointer"
              aria-label="Previous weapon"
            >
              <ArrowDirSvg dir="left" className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onOpenWheel}
              className="px-2 py-0.5 flex items-center gap-2 hover:bg-white/10 rounded-lg cursor-pointer"
            >
              <WeaponSvg weaponId={player.equippedWeaponId} className="w-4 h-4 text-[#ff5a6e]" />
              <span className="font-semibold text-white truncate max-w-[115px]">{weaponName}</span>
              <span className="font-mono-num text-[11px] text-[#2dd4bf]">{ammoText}</span>
              {(player.grenades > 0 || player.molotovs > 0) && (
                <span className="text-[10px] text-amber-300 font-mono-num flex items-center gap-0.5 pl-1 border-l border-white/10">
                  <Bomb className="w-3 h-3" /> {player.grenades + player.molotovs}
                </span>
              )}
              {showHints && <span className="text-[10px] text-neutral-400 font-mono-num">[Q]</span>}
            </button>
            <button
              type="button"
              onClick={() => onCycleWeapon(1)}
              className="p-1.5 rounded-lg hover:bg-white/15 text-neutral-300 cursor-pointer"
              aria-label="Next weapon"
            >
              <ArrowDirSvg dir="right" className="w-3.5 h-3.5" />
            </button>
          </div>

          {(hud.wanted.witnessActive || hud.wanted.stars > 0 || hud.wanted.cctvRecorded) && (
            <div className="bg-[#181216]/92 border border-rose-500/35 rounded-lg px-3 py-1.5 text-xs space-y-1 min-w-[190px]">
              {hud.wanted.witnessActive && (
                <div>
                  <div className="flex justify-between text-amber-300 font-medium">
                    <span>{t(lang, 'witnessCalling')}</span>
                    <span className="font-mono-num">{Math.round(hud.wanted.witnessProgress)}%</span>
                  </div>
                  <div className="h-1 bg-neutral-800 rounded mt-1 overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${hud.wanted.witnessProgress}%` }} />
                  </div>
                </div>
              )}
              {hud.wanted.stars > 0 && (
                <div className="flex justify-between text-rose-300">
                  <span>{hud.wanted.evading ? t(lang, 'evadingPolice') : t(lang, 'policePursuit')}</span>
                  <span className="font-mono-num">{Math.round(hud.wanted.evadeProgress)}%</span>
                </div>
              )}
              {hud.wanted.cctvRecorded && (
                <div className="text-[10px] text-amber-200">{t(lang, 'cctvRecorded')}</div>
              )}
            </div>
          )}

          {/* Compact Vehicle Telemetry when driving in Touch Mode */}
          {touchMode && hud.drivingVehicle && (
            <div className="bg-[#0d0f17]/90 border border-white/15 rounded-lg px-3 py-1.5 flex items-center gap-3 text-xs">
              <div className="font-mono-num font-bold text-white">
                {Math.round(Math.abs(hud.drivingVehicle.speed) * 3.1)}{' '}
                <span className="text-[10px] text-neutral-400">MPH</span>
              </div>
              <div className="font-mono-num text-[10px] text-amber-300">
                FUEL {Math.round(hud.drivingVehicle.fuel)}%
              </div>
              <div className="font-mono-num text-[10px] text-cyan-300">
                NOS {Math.round(hud.drivingVehicle.nitroCharge ?? 100)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER TOAST */}
      {hud.toastMessage && (
        <div className="mx-auto bg-[#10121c]/95 border border-[#2dd4bf]/45 text-white text-xs font-medium px-4 py-2 rounded-lg">
          {hud.toastMessage}
        </div>
      )}

      {/* BOTTOM ROW */}
      <div className="flex items-end justify-between gap-4">
        {/* Bottom-Left: Desktop Minimap + Partner card (Hidden when Touch Mode moves Minimap to Top-Left) */}
        {!touchMode ? (
          <div className="flex items-end gap-2.5 pointer-events-auto">
            {minimapWidget}

            <div className="bg-[#0d0f17]/92 border border-white/15 rounded-lg p-2 space-y-1.5 min-w-[152px] hidden sm:block">
              <div className="flex items-center justify-between gap-2">
                <div className="font-display font-bold text-xs text-white">{player.name}</div>
                <div className="text-[11px] text-rose-300 flex items-center gap-1 font-mono-num">
                  <Heart className="w-3 h-3 fill-rose-400 text-rose-400" /> {hud.relationship.meter}%
                </div>
              </div>
              <div className="text-[10px] text-neutral-400">{hud.profile.label}</div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={onSwitchProtagonist}
                  className="flex-1 py-1 px-2 rounded bg-white/10 hover:bg-white/20 text-[11px] font-medium text-white cursor-pointer whitespace-nowrap"
                >
                  {showHints ? 'Tab: ' : ''}
                  {partnerId === 'jason' ? 'Jason' : 'Lucia'}
                </button>
                <button
                  type="button"
                  onClick={onTogglePartner}
                  className={`py-1 px-2 rounded text-[11px] font-medium cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                    hud.relationship.duoActive ? 'bg-[#2dd4bf] text-neutral-950 font-semibold' : 'bg-white/10 text-neutral-300'
                  }`}
                >
                  <Users className="w-3 h-3" /> {hud.relationship.duoActive ? 'Duo' : 'Call'}
                </button>
              </div>
              {(hud.drivingVehicle || hud.nearbyTrunkVehicle) && (
                <button
                  type="button"
                  onClick={onTogglePartnerInCar}
                  className="w-full py-1 px-2 rounded bg-[#ff5a6e]/20 hover:bg-[#ff5a6e]/35 border border-[#ff5a6e]/40 text-[11px] font-medium text-rose-200 cursor-pointer"
                >
                  {showHints ? '[K] ' : ''}
                  {hud.relationship.partnerInVehicleId ? t(lang, 'exitShotgun') : t(lang, 'rideShotgun')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-1" />
        )}

        {/* Bottom-Center: NPC Subtitle, Context Prompt & Desktop Utility Bar */}
        <div className="flex flex-col items-center gap-2 pointer-events-auto">
          {hud.npcSubtitle && (
            <div
              className={`bg-[#0d0f17]/95 border rounded-lg px-4 py-1.5 text-xs max-w-md text-center ${
                hud.npcSubtitle.hostile ? 'border-rose-500/60 text-rose-200' : 'border-white/20 text-neutral-100'
              }`}
            >
              <span className="font-bold text-white mr-1.5">{hud.npcSubtitle.speaker}:</span>
              <span>&ldquo;{hud.npcSubtitle.text}&rdquo;</span>
            </div>
          )}

          {hud.contextPrompt && (
            <div className="bg-[#11131d]/95 border border-amber-400/50 text-amber-200 text-xs font-medium px-4 py-1.5 rounded-lg whitespace-nowrap">
              {hud.contextPrompt}
            </div>
          )}

          {!touchMode && (
            <>
              <div className="bg-[#0d0f17]/90 border border-white/15 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenPhone}
                  className="px-3 py-1.5 rounded bg-[#ff5a6e] hover:bg-[#ff4259] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <PhoneSvg className="w-3.5 h-3.5" /> {t(lang, 'phone')}
                  {showHints ? ' [P]' : ''}
                </button>
                <button
                  type="button"
                  onClick={onOpenWheel}
                  className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-300" /> Wheel{showHints ? ' [Q]' : ''}
                </button>
                <button
                  type="button"
                  onClick={onOpenMap}
                  className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Compass className="w-3.5 h-3.5 text-[#2dd4bf]" /> {t(lang, 'map')}
                  {showHints ? ' [M]' : ''}
                </button>
                <button
                  type="button"
                  onClick={onCycleRadio}
                  className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-purple-200 text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  title={showHints ? 'Cycle Radio Station [R]' : 'Cycle Radio Station'}
                >
                  <Radio className="w-3.5 h-3.5 text-purple-400" />{' '}
                  {hud.radioStation === 'Off' ? 'FM Off' : hud.radioStation.split(' ')[0]}
                </button>
                <button
                  type="button"
                  onClick={onToggleSlowMo}
                  className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    hud.slowMoActive ? 'bg-amber-400 text-neutral-950' : 'bg-white/10 text-neutral-200 hover:bg-white/15'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" /> Focus{showHints ? ' [Caps]' : ''}
                </button>
                <button
                  type="button"
                  onClick={onOpenPause}
                  className="p-1.5 rounded bg-white/10 hover:bg-white/15 text-neutral-200 cursor-pointer"
                  title={showHints ? 'Settings & Controls [Esc]' : 'Settings & Controls'}
                >
                  <Pause className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="p-1.5 rounded bg-white/10 hover:bg-white/15 text-neutral-200 cursor-pointer"
                  title={showHints ? 'Mute / Unmute [N]' : 'Mute / Unmute'}
                >
                  {hud.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              {showHints && (
                <div className="text-[10px] font-mono-num text-neutral-300/80 bg-[#0d0f17]/75 px-3 py-0.5 rounded border border-white/10">
                  WASD Move · Click Attack · RightClick Aim · [1-9] Weapons · [Q] Wheel · [F] Car · [E] Interact · [B] Call Lucia · [Esc] Settings
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom-Right Vehicle Cluster (Desktop only; Touch Mode shows telemetry at top-right) */}
        {!touchMode && hud.drivingVehicle ? (
          <div className="bg-[#0d0f17]/92 border border-white/15 rounded-lg p-3 min-w-[235px] space-y-2 hidden sm:block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white truncate max-w-[155px]">
                <Car className="w-3.5 h-3.5 text-[#2dd4bf] shrink-0" />
                <span className="truncate">{hud.drivingVehicle.name}</span>
              </div>
              <div className="font-mono-num font-bold text-lg text-white">
                {Math.round(Math.abs(hud.drivingVehicle.speed) * 3.1)}{' '}
                <span className="text-[10px] text-neutral-400">MPH</span>
              </div>
            </div>

            {hud.drivingVehicle.gpsTrackerActive && (
              <div className="bg-rose-500/20 border border-rose-500/40 rounded px-2 py-1 text-[11px] text-rose-200 flex justify-between font-mono-num">
                <span>GPS TRACKER PING</span>
                <span>{Math.ceil(hud.drivingVehicle.gpsTimer)}s</span>
              </div>
            )}

            {hud.drivingVehicle.tireFlat && (
              <div className="bg-amber-500/20 border border-amber-400/45 rounded px-2 py-0.5 text-[10px] text-amber-200 font-mono-num">
                FLAT TIRE {showHints ? '— Press [Y] to repair ($120)' : '— Repair ($120)'}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <div className="flex justify-between text-neutral-400">
                  <span>{hud.drivingVehicle.fuelType === 'ev' ? 'EV BAT' : hud.drivingVehicle.fuelType === 'aviation' ? 'AVGAS' : 'FUEL'}</span>
                  <span className="font-mono-num">{Math.round(hud.drivingVehicle.fuel)}%</span>
                </div>
                <div className="h-1.5 bg-neutral-800 rounded-sm overflow-hidden mt-0.5">
                  <div className="h-full bg-amber-400" style={{ width: `${hud.drivingVehicle.fuel}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-neutral-400">
                  <span>BODY</span>
                  <span className="font-mono-num">{Math.round(hud.drivingVehicle.health)}%</span>
                </div>
                <div className="h-1.5 bg-neutral-800 rounded-sm overflow-hidden mt-0.5">
                  <div className="h-full bg-emerald-400" style={{ width: `${hud.drivingVehicle.health}%` }} />
                </div>
              </div>
            </div>

            {showHints && (
              <div className="flex items-center justify-between text-[10px] font-mono-num pt-1 border-t border-white/10 text-neutral-400">
                <span className={hud.drivingVehicle.leftBlinker ? 'text-amber-400 font-bold' : ''}>[Z] ◀</span>
                <span className={hud.drivingVehicle.headlightsOn ? 'text-cyan-300 font-bold' : ''}>[L] Light</span>
                <span>[T] Trunk</span>
                <span className={hud.drivingVehicle.rightBlinker ? 'text-amber-400 font-bold' : ''}>▶ [C]</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-[10px]" />
        )}
      </div>
    </div>
  );
};
