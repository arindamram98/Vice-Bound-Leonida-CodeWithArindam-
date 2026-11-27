import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, Flame, Hand, Zap } from 'lucide-react';
import { HudSnapshot } from '../game/types';
import { t } from '../game/i18n';
import {
  ArrowDirSvg,
  BrakePedalSvg,
  CarSvg,
  GasPedalSvg,
  HandbrakeSvg,
  HornSvg,
  NitroFlameSvg,
  ReloadSvg,
  ScopeSvg,
} from './GameIcons';

interface TouchControlsProps {
  hud: HudSnapshot;
  onMoveInput: (nx: number, nz: number) => void;
  onCameraLookDelta: (dyaw: number, dpitch: number) => void;
  onAttack: () => void;
  onAimChange: (active: boolean) => void;
  onToggleAim: () => void;
  onReload: () => void;
  onJump: () => void;
  onSprintToggle: (active: boolean) => void;
  onVehicleInteract: () => void;
  onContextInteract: () => void;
  onVehicleInputs: (inputs: {
    gas?: number;
    brake?: number;
    steer?: number;
    handbrake?: boolean;
    nitro?: boolean;
  }) => void;
  onHorn: () => void;
  onThrowThrowable: () => void;
  onOpenWheel: () => void;
  onOpenMap: () => void;
  onOpenPhone: () => void;
  onOpenPause: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  hud,
  onMoveInput,
  onCameraLookDelta,
  onAttack,
  onToggleAim,
  onReload,
  onJump,
  onSprintToggle,
  onVehicleInteract,
  onContextInteract,
  onVehicleInputs,
  onHorn,
  onThrowThrowable,
}) => {
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const joyPointerId = useRef<number | null>(null);
  const lookPointerId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [sprinting, setSprinting] = useState(false);

  // Track multitouch steering / pedals cleanly
  const [steerLeft, setSteerLeft] = useState(false);
  const [steerRight, setSteerRight] = useState(false);
  const [gasPressed, setGasPressed] = useState(false);
  const [brakePressed, setBrakePressed] = useState(false);
  const [handbrakePressed, setHandbrakePressed] = useState(false);
  const [nitroPressed, setNitroPressed] = useState(false);

  const player = hud.protagonists[hud.activeId];
  const lang = hud.controlSettings.language;
  const inVehicle = Boolean(hud.drivingVehicle);
  const canEnterVehicle = Boolean(hud.nearbyVehicle) && !inVehicle;
  const nearInteractable = Boolean(hud.contextAction);
  const hasThrowable = player.grenades > 0 || player.molotovs > 0;
  const isGunEquipped =
    player.equippedWeaponId !== 'fists' &&
    player.equippedWeaponId !== 'bat' &&
    player.equippedWeaponId !== 'grenades' &&
    player.equippedWeaponId !== 'molotov';

  // Reset vehicle touch inputs whenever leaving vehicle
  useEffect(() => {
    if (!inVehicle) {
      setSteerLeft(false);
      setSteerRight(false);
      setGasPressed(false);
      setBrakePressed(false);
      setHandbrakePressed(false);
      setNitroPressed(false);
      onVehicleInputs({ gas: 0, brake: 0, steer: 0, handbrake: false, nitro: false });
    } else {
      joyPointerId.current = null;
      setKnobOffset({ x: 0, y: 0 });
      onMoveInput(0, 0);
    }
  }, [inVehicle, onMoveInput, onVehicleInputs]);

  useEffect(() => {
    if (!inVehicle) return;
    const steer = (steerRight ? 1 : 0) - (steerLeft ? 1 : 0);
    onVehicleInputs({
      steer,
      gas: gasPressed ? 1 : 0,
      brake: brakePressed ? 1 : 0,
      handbrake: handbrakePressed,
      nitro: nitroPressed,
    });
  }, [inVehicle, steerLeft, steerRight, gasPressed, brakePressed, handbrakePressed, nitroPressed, onVehicleInputs]);

  const updateJoystick = (clientX: number, clientY: number) => {
    const el = joyBaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.42;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR && dist > 0) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setKnobOffset({ x: dx, y: dy });
    onMoveInput(dx / maxR, dy / maxR);
  };

  const resetJoystick = () => {
    joyPointerId.current = null;
    setKnobOffset({ x: 0, y: 0 });
    onMoveInput(0, 0);
  };

  const toggleSprint = () => {
    const next = !sprinting;
    setSprinting(next);
    onSprintToggle(next);
  };

  return (
    <div className="fixed inset-0 z-25 h-[100dvh] max-h-[100dvh] overflow-hidden pointer-events-none select-none">
      {/* Right-side Touch Look Zone (open center-right area for smooth 3D camera orbit) */}
      <div
        className="absolute top-28 right-0 bottom-36 w-[52%] pointer-events-auto touch-none"
        onPointerDown={(e) => {
          if (lookPointerId.current !== null) return;
          lookPointerId.current = e.pointerId;
          lastLookPos.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (lookPointerId.current !== e.pointerId) return;
          const dx = e.clientX - lastLookPos.current.x;
          const dy = e.clientY - lastLookPos.current.y;
          lastLookPos.current = { x: e.clientX, y: e.clientY };
          onCameraLookDelta(dx * 0.0055, dy * 0.0042);
        }}
        onPointerUp={(e) => {
          if (lookPointerId.current === e.pointerId) lookPointerId.current = null;
        }}
        onPointerCancel={(e) => {
          if (lookPointerId.current === e.pointerId) lookPointerId.current = null;
        }}
      />

      {/* ================= BOTTOM-LEFT CONTROLS (Safe-Area Padded) ================= */}
      {!inVehicle ? (
        /* ON FOOT: Virtual Thumbstick */
        <div
          className="absolute pointer-events-auto"
          style={{
            left: 'max(16px, env(safe-area-inset-left))',
            bottom: 'max(16px, env(safe-area-inset-bottom))',
          }}
        >
          <div
            ref={joyBaseRef}
            onPointerDown={(e) => {
              joyPointerId.current = e.pointerId;
              e.currentTarget.setPointerCapture(e.pointerId);
              updateJoystick(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (joyPointerId.current === e.pointerId) {
                updateJoystick(e.clientX, e.clientY);
              }
            }}
            onPointerUp={(e) => {
              if (joyPointerId.current === e.pointerId) resetJoystick();
            }}
            onPointerCancel={(e) => {
              if (joyPointerId.current === e.pointerId) resetJoystick();
            }}
            className="relative w-32 h-32 rounded-full bg-[#0d0f17]/75 border-2 border-white/25 flex items-center justify-center touch-none shadow-xl"
          >
            <div className="w-20 h-20 rounded-full border border-white/10 pointer-events-none" />
            <div
              className="absolute w-12 h-12 rounded-full bg-[#2dd4bf]/90 border-2 border-white shadow-lg pointer-events-none"
              style={{
                transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
              }}
            />
          </div>
        </div>
      ) : (
        /* INSIDE VEHICLE: Hide Thumbstick Completely -> Show Crisp Left/Right Steer Buttons */
        <div
          className="absolute flex items-center gap-3 pointer-events-auto"
          style={{
            left: 'max(16px, env(safe-area-inset-left))',
            bottom: 'max(16px, env(safe-area-inset-bottom))',
          }}
        >
          <button
            type="button"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setSteerLeft(true);
            }}
            onPointerUp={() => setSteerLeft(false)}
            onPointerCancel={() => setSteerLeft(false)}
            className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center touch-none shadow-lg transition-transform ${
              steerLeft
                ? 'bg-[#2dd4bf] border-white text-neutral-950 scale-95'
                : 'bg-[#0d0f17]/88 border-white/30 text-white'
            }`}
            aria-label={t(lang, 'left')}
          >
            <ArrowDirSvg dir="left" className="w-7 h-7" />
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setSteerRight(true);
            }}
            onPointerUp={() => setSteerRight(false)}
            onPointerCancel={() => setSteerRight(false)}
            className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center touch-none shadow-lg transition-transform ${
              steerRight
                ? 'bg-[#2dd4bf] border-white text-neutral-950 scale-95'
                : 'bg-[#0d0f17]/88 border-white/30 text-white'
            }`}
            aria-label={t(lang, 'right')}
          >
            <ArrowDirSvg dir="right" className="w-7 h-7" />
          </button>
        </div>
      )}

      {/* ================= BOTTOM-RIGHT CONTROLS (Safe-Area Padded) ================= */}
      {!inVehicle ? (
        /* ON FOOT: Context Buttons (Enter Car / Interact) + Sprint, Jump, Aim/Scope, Reload, Fire */
        <div
          className="absolute flex flex-col items-end gap-2.5 pointer-events-auto"
          style={{
            right: 'max(16px, env(safe-area-inset-right))',
            bottom: 'max(16px, env(safe-area-inset-bottom))',
          }}
        >
          {/* Context-only row */}
          {(nearInteractable || canEnterVehicle || hasThrowable) && (
            <div className="flex items-center gap-2.5">
              {nearInteractable && (
                <button
                  type="button"
                  onClick={onContextInteract}
                  className="min-w-[54px] min-h-[54px] px-3.5 rounded-full bg-amber-400 border-2 border-white text-neutral-950 font-extrabold text-[11px] flex flex-col items-center justify-center active:scale-95 shadow-lg max-w-[130px]"
                >
                  <Hand className="w-4 h-4 shrink-0" />
                  <span className="truncate max-w-full">
                    {(hud.contextAction || t(lang, 'interact').split(' ')[0]).toUpperCase()}
                  </span>
                </button>
              )}

              {canEnterVehicle && (
                <button
                  type="button"
                  onClick={onVehicleInteract}
                  className="min-w-[58px] min-h-[54px] px-3 rounded-full bg-[#0d0f17]/92 border-2 border-cyan-400 text-cyan-300 font-bold text-[10px] flex flex-col items-center justify-center active:scale-95 shadow-lg"
                >
                  <CarSvg className="w-5 h-5" />
                  <span>{t(lang, 'enterCar').toUpperCase()}</span>
                </button>
              )}

              {hasThrowable && (
                <button
                  type="button"
                  onClick={onThrowThrowable}
                  className="min-w-[52px] min-h-[52px] rounded-full bg-orange-600/90 border-2 border-orange-300 text-white font-bold text-[10px] flex flex-col items-center justify-center active:scale-95 shadow-lg"
                >
                  <Flame className="w-4 h-4" />
                  <span>{t(lang, 'throwItem').toUpperCase()}</span>
                </button>
              )}
            </div>
          )}

          {/* Primary On-Foot Combat & Locomotion Row */}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={toggleSprint}
              className={`min-w-[50px] min-h-[50px] rounded-full border-2 font-bold text-[10px] flex flex-col items-center justify-center active:scale-95 ${
                sprinting
                  ? 'bg-[#2dd4bf] border-white text-neutral-950'
                  : 'bg-[#0d0f17]/88 border-white/25 text-neutral-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{t(lang, 'sprint').split(' ')[0].toUpperCase()}</span>
            </button>

            <button
              type="button"
              onClick={onJump}
              className="min-w-[50px] min-h-[50px] rounded-full bg-[#0d0f17]/88 border-2 border-white/25 text-white font-bold text-[10px] flex items-center justify-center active:scale-95"
            >
              {t(lang, 'jump').toUpperCase()}
            </button>

            {isGunEquipped && (
              <button
                type="button"
                onClick={onReload}
                className="min-w-[50px] min-h-[50px] rounded-full bg-[#0d0f17]/88 border-2 border-amber-400/65 text-amber-300 font-bold text-[10px] flex flex-col items-center justify-center active:scale-95"
                aria-label={t(lang, 'reload')}
              >
                <ReloadSvg className="w-4 h-4" />
                <span>{t(lang, 'reload').split(' ')[0].toUpperCase()}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleAim}
              className={`min-w-[54px] min-h-[54px] rounded-full border-2 font-bold text-[10px] flex flex-col items-center justify-center active:scale-95 ${
                hud.aiming
                  ? 'bg-sky-400 border-white text-neutral-950'
                  : 'bg-[#0d0f17]/88 border-sky-400/65 text-sky-300'
              }`}
              aria-label={t(lang, 'aim')}
            >
              <ScopeSvg className="w-4 h-4" />
              <span>
                {player.equippedWeaponId === 'sniper'
                  ? t(lang, 'scope').toUpperCase()
                  : t(lang, 'aim').toUpperCase()}
              </span>
            </button>

            <button
              type="button"
              onPointerDown={() => onAttack()}
              className="min-w-[68px] min-h-[68px] rounded-full bg-[#ff5a6e] border-2 border-white text-white font-extrabold text-xs flex flex-col items-center justify-center active:scale-95 shadow-xl"
            >
              <Crosshair className="w-5 h-5" />
              <span>{t(lang, 'fire').split(' ')[0].toUpperCase()}</span>
            </button>
          </div>
        </div>
      ) : (
        /* INSIDE VEHICLE: Exit Car, Horn, Nitro, Handbrake, Brake/Reverse Pedal, Gas Pedal */
        <div
          className="absolute flex flex-col items-end gap-2.5 pointer-events-auto"
          style={{
            right: 'max(16px, env(safe-area-inset-right))',
            bottom: 'max(16px, env(safe-area-inset-bottom))',
          }}
        >
          {/* Secondary Vehicle Actions Row */}
          <div className="flex items-center gap-2">
            {nearInteractable && (
              <button
                type="button"
                onClick={onContextInteract}
                className="min-w-[50px] min-h-[50px] px-3 rounded-full bg-amber-400 border-2 border-white text-neutral-950 font-extrabold text-[10px] flex flex-col items-center justify-center active:scale-95 shadow-lg"
              >
                <Hand className="w-4 h-4" />
                <span>USE</span>
              </button>
            )}

            <button
              type="button"
              onClick={onHorn}
              className="min-w-[50px] min-h-[50px] rounded-full bg-[#0d0f17]/88 border-2 border-amber-300/60 text-amber-300 font-bold text-[10px] flex flex-col items-center justify-center active:scale-95"
              aria-label={t(lang, 'horn')}
            >
              <HornSvg className="w-4 h-4" />
              <span>HORN</span>
            </button>

            <button
              type="button"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setNitroPressed(true);
              }}
              onPointerUp={() => setNitroPressed(false)}
              onPointerCancel={() => setNitroPressed(false)}
              className={`min-w-[52px] min-h-[52px] rounded-full border-2 font-bold text-[10px] flex flex-col items-center justify-center touch-none ${
                nitroPressed
                  ? 'bg-sky-400 border-white text-neutral-950 scale-95'
                  : 'bg-[#0d0f17]/88 border-sky-400/70 text-sky-300'
              }`}
              aria-label={t(lang, 'nitro')}
            >
              <NitroFlameSvg className="w-4 h-4" />
              <span>NOS</span>
            </button>

            <button
              type="button"
              onClick={onVehicleInteract}
              className="min-w-[52px] min-h-[52px] rounded-full bg-rose-600/90 border-2 border-white text-white font-bold text-[10px] flex flex-col items-center justify-center active:scale-95 shadow-lg"
              aria-label={t(lang, 'exitCar')}
            >
              <CarSvg className="w-4 h-4" />
              <span>EXIT</span>
            </button>
          </div>

          {/* Dedicated Pedals Row: Handbrake, Brake/Reverse, Gas */}
          <div className="flex items-end gap-2.5">
            <button
              type="button"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setHandbrakePressed(true);
              }}
              onPointerUp={() => setHandbrakePressed(false)}
              onPointerCancel={() => setHandbrakePressed(false)}
              className={`w-14 h-14 rounded-2xl border-2 font-bold text-[10px] flex flex-col items-center justify-center touch-none ${
                handbrakePressed
                  ? 'bg-amber-400 border-white text-neutral-950 scale-95'
                  : 'bg-[#0d0f17]/88 border-white/30 text-neutral-200'
              }`}
              aria-label={t(lang, 'handbrake')}
            >
              <HandbrakeSvg className="w-5 h-5" />
              <span>PARK</span>
            </button>

            <button
              type="button"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setBrakePressed(true);
              }}
              onPointerUp={() => setBrakePressed(false)}
              onPointerCancel={() => setBrakePressed(false)}
              className={`w-16 h-16 rounded-2xl border-2 font-bold text-[10px] flex flex-col items-center justify-center touch-none ${
                brakePressed
                  ? 'bg-rose-500 border-white text-white scale-95'
                  : 'bg-[#0d0f17]/88 border-rose-400/65 text-rose-300'
              }`}
              aria-label={t(lang, 'brake')}
            >
              <BrakePedalSvg className="w-6 h-6" />
              <span>BRAKE</span>
            </button>

            <button
              type="button"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setGasPressed(true);
              }}
              onPointerUp={() => setGasPressed(false)}
              onPointerCancel={() => setGasPressed(false)}
              className={`w-16 h-24 rounded-2xl border-2 font-extrabold text-[11px] flex flex-col items-center justify-center gap-1 touch-none shadow-xl ${
                gasPressed
                  ? 'bg-emerald-400 border-white text-neutral-950 scale-95'
                  : 'bg-emerald-600/85 border-emerald-300 text-white'
              }`}
              aria-label={t(lang, 'gas')}
            >
              <GasPedalSvg className="w-7 h-7" />
              <span>GAS</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
