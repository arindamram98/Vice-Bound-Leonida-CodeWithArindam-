import React, { useRef, useState } from 'react';
import { Car, Compass, Crosshair, Flame, Hand, Pause, Shield, Smartphone, Zap } from 'lucide-react';
import { HudSnapshot } from '../game/types';

interface TouchControlsProps {
  hud: HudSnapshot;
  onMoveInput: (nx: number, nz: number) => void;
  onCameraLookDelta: (dyaw: number, dpitch: number) => void;
  onAttack: () => void;
  onAimChange: (active: boolean) => void;
  onJump: () => void;
  onSprintToggle: (active: boolean) => void;
  onVehicleInteract: () => void;
  onContextInteract: () => void;
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
  onAimChange,
  onJump,
  onSprintToggle,
  onVehicleInteract,
  onContextInteract,
  onThrowThrowable,
  onOpenWheel,
  onOpenMap,
  onOpenPhone,
  onOpenPause,
}) => {
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const joyPointerId = useRef<number | null>(null);
  const lookPointerId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [sprinting, setSprinting] = useState(false);
  const [aiming, setAiming] = useState(false);

  const player = hud.protagonists[hud.activeId];
  const isDriving = Boolean(hud.drivingVehicle);
  const hasThrowable = player.grenades > 0 || player.molotovs > 0;

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

  const toggleAim = () => {
    const next = !aiming;
    setAiming(next);
    onAimChange(next);
  };

  return (
    <div className="fixed inset-0 z-25 pointer-events-none select-none">
      {/* Right-side Touch Look Zone (drag anywhere on open right viewport to rotate camera) */}
      <div
        className="absolute top-16 right-0 bottom-24 w-[52%] pointer-events-auto touch-none"
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
          if (lookPointerId.current === e.pointerId) {
            lookPointerId.current = null;
          }
        }}
        onPointerCancel={(e) => {
          if (lookPointerId.current === e.pointerId) {
            lookPointerId.current = null;
          }
        }}
      />

      {/* Top Quick Utility Touch Bar (48x48px min targets) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={onOpenWheel}
          className="min-w-[48px] min-h-[48px] px-3 rounded-xl bg-[#0d0f17]/90 border border-white/20 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 active:scale-95"
        >
          <Shield className="w-4 h-4" />
          <span>GEAR</span>
        </button>
        <button
          type="button"
          onClick={onOpenMap}
          className="min-w-[48px] min-h-[48px] px-3 rounded-xl bg-[#0d0f17]/90 border border-white/20 text-[#2dd4bf] font-bold text-xs flex items-center justify-center gap-1 active:scale-95"
        >
          <Compass className="w-4 h-4" />
          <span>MAP</span>
        </button>
        <button
          type="button"
          onClick={onOpenPhone}
          className="min-w-[48px] min-h-[48px] px-3 rounded-xl bg-[#ff5a6e]/90 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-1 active:scale-95"
        >
          <Smartphone className="w-4 h-4" />
          <span>PHONE</span>
        </button>
        <button
          type="button"
          onClick={onOpenPause}
          className="min-w-[48px] min-h-[48px] px-3 rounded-xl bg-[#0d0f17]/90 border border-white/20 text-neutral-200 font-bold text-xs flex items-center justify-center active:scale-95"
          aria-label="Pause and Settings"
        >
          <Pause className="w-4 h-4" />
        </button>
      </div>

      {/* Left Floating Virtual Joystick (placed cleanly above bottom-left minimap) */}
      <div className="absolute bottom-52 left-5 pointer-events-auto">
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
          className="relative w-28 h-28 rounded-full bg-[#0d0f17]/75 border-2 border-white/25 flex items-center justify-center touch-none"
        >
          <div className="w-20 h-20 rounded-full border border-white/10 pointer-events-none" />
          <div
            className="absolute w-11 h-11 rounded-full bg-[#2dd4bf]/90 border-2 border-white shadow-lg pointer-events-none"
            style={{
              transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
            }}
          />
          <span className="absolute -bottom-5 text-[10px] font-bold tracking-wider text-white/75 pointer-events-none">
            {isDriving ? 'DRIVE / STEER' : 'MOVE'}
          </span>
        </div>
      </div>

      {/* Right Ergonomic Action Buttons (>= 48x48px) */}
      <div className="absolute bottom-6 right-5 flex flex-col items-end gap-2.5 pointer-events-auto">
        <div className="flex items-center gap-2.5">
          {hud.contextAction && (
            <button
              type="button"
              onClick={onContextInteract}
              className="min-w-[54px] min-h-[54px] px-3 rounded-full bg-amber-400 border-2 border-white text-neutral-950 font-extrabold text-xs flex flex-col items-center justify-center active:scale-95 shadow-lg"
            >
              <Hand className="w-4 h-4" />
              <span>USE</span>
            </button>
          )}
          <button
            type="button"
            onClick={onVehicleInteract}
            className="min-w-[52px] min-h-[52px] rounded-full bg-[#0d0f17]/90 border-2 border-cyan-400/70 text-cyan-300 font-bold text-[11px] flex flex-col items-center justify-center active:scale-95"
          >
            <Car className="w-4 h-4" />
            <span>{isDriving ? 'EXIT' : 'CAR'}</span>
          </button>
          {!isDriving && hasThrowable && (
            <button
              type="button"
              onClick={onThrowThrowable}
              className="min-w-[52px] min-h-[52px] rounded-full bg-orange-600/90 border-2 border-orange-300 text-white font-bold text-[11px] flex flex-col items-center justify-center active:scale-95"
            >
              <Flame className="w-4 h-4" />
              <span>THROW</span>
            </button>
          )}
        </div>

        <div className="flex items-end gap-2.5">
          {!isDriving && (
            <>
              <button
                type="button"
                onClick={toggleSprint}
                className={`min-w-[52px] min-h-[52px] rounded-full border-2 font-bold text-[11px] flex flex-col items-center justify-center active:scale-95 ${
                  sprinting
                    ? 'bg-[#2dd4bf] border-white text-neutral-950'
                    : 'bg-[#0d0f17]/90 border-white/25 text-neutral-200'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>RUN</span>
              </button>
              <button
                type="button"
                onClick={onJump}
                className="min-w-[52px] min-h-[52px] rounded-full bg-[#0d0f17]/90 border-2 border-white/25 text-white font-bold text-[11px] flex items-center justify-center active:scale-95"
              >
                JUMP
              </button>
              <button
                type="button"
                onClick={toggleAim}
                className={`min-w-[54px] min-h-[54px] rounded-full border-2 font-bold text-[11px] flex flex-col items-center justify-center active:scale-95 ${
                  aiming
                    ? 'bg-sky-400 border-white text-neutral-950'
                    : 'bg-[#0d0f17]/90 border-sky-400/55 text-sky-300'
                }`}
              >
                <Crosshair className="w-4 h-4" />
                <span>AIM</span>
              </button>
              <button
                type="button"
                onPointerDown={() => onAttack()}
                className="min-w-[68px] min-h-[68px] rounded-full bg-[#ff5a6e] border-2 border-white text-white font-extrabold text-xs flex flex-col items-center justify-center active:scale-95 shadow-xl"
              >
                <Crosshair className="w-5 h-5" />
                <span>ATK</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
