import React, { useEffect, useState } from 'react';
import {
  Bike,
  CheckCircle2,
  Clock,
  DollarSign,
  Flame,
  ShieldAlert,
  Shirt,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react';
import { HudSnapshot } from '../game/types';

interface BurgerJobModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onApply: () => void;
  onToggleUniform: () => void;
  onClockIn: () => void;
  onCompleteTask: (task: 'cashier' | 'grill' | 'mop', pay: number) => void;
  onLaunchDelivery: () => void;
  onStealRegister: () => void;
  onQuitChaos: () => void;
}

type MiniStation = null | 'cashier' | 'grill' | 'mop';

const MENU_ITEMS = [
  { name: 'Bleeder Combo', price: 9 },
  { name: 'Heart Stopper', price: 14 },
  { name: 'Money Shot Meal', price: 12 },
  { name: 'Double Meat Stack', price: 16 },
];

export const BurgerJobModal: React.FC<BurgerJobModalProps> = ({
  hud,
  onClose,
  onApply,
  onToggleUniform,
  onClockIn,
  onCompleteTask,
  onLaunchDelivery,
  onStealRegister,
  onQuitChaos,
}) => {
  const player = hud.protagonists[hud.activeId];
  const job = hud.burgerJob;
  const [station, setStation] = useState<MiniStation>(null);

  // Cashier POS state
  const [orderItem, setOrderItem] = useState(MENU_ITEMS[0]);
  const [orderCount, setOrderCount] = useState(2);
  const [cashierRounds, setCashierRounds] = useState(0);

  // Grill Cook state
  const [grillCursor, setGrillCursor] = useState(20);
  const [pattyLayers, setPattyLayers] = useState<string[]>([]);

  // Mop state
  const [spillsCleaned, setSpillsCleaned] = useState([false, false, false, false, false, false]);

  useEffect(() => {
    if (station !== 'grill') return;
    let v = 18;
    let dir = 1;
    const id = window.setInterval(() => {
      v += dir * 4.2;
      if (v >= 95) {
        v = 95;
        dir = -1;
      } else if (v <= 5) {
        v = 5;
        dir = 1;
      }
      setGrillCursor(v);
    }, 24);
    return () => clearInterval(id);
  }, [station]);

  const startCashierRound = () => {
    setOrderItem(MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)]);
    setOrderCount(1 + Math.floor(Math.random() * 3));
  };

  const expectedTotal = orderItem.price * orderCount;
  const optionTotals = [expectedTotal, expectedTotal + 4, Math.max(5, expectedTotal - 3)].sort((a, b) => a - b);

  const handleCashierPick = (val: number) => {
    if (val === expectedTotal) {
      const next = cashierRounds + 1;
      if (next >= 3) {
        setStation(null);
        setCashierRounds(0);
        onCompleteTask('cashier', job.isShiftManager ? 290 : 210);
      } else {
        setCashierRounds(next);
        startCashierRound();
      }
    }
  };

  const handleGrillPress = () => {
    const sweet = grillCursor >= 36 && grillCursor <= 64;
    if (!sweet) return;
    const sequence = ['Bottom Bun', 'Sizzling Patty', 'Cheddar Cheese', 'Top Bun + Sauce'];
    const nextLayer = sequence[pattyLayers.length];
    const updated = [...pattyLayers, nextLayer];
    setPattyLayers(updated);
    if (updated.length >= 4) {
      setStation(null);
      setPattyLayers([]);
      onCompleteTask('grill', job.isShiftManager ? 330 : 245);
    }
  };

  const handleMopSpot = (idx: number) => {
    const next = spillsCleaned.map((v, i) => (i === idx ? true : v));
    setSpillsCleaned(next);
    if (next.every(Boolean)) {
      setStation(null);
      setSpillsCleaned([false, false, false, false, false, false]);
      onCompleteTask('mop', job.isShiftManager ? 250 : 185);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
      <div className="bg-[#0e1018] border border-orange-400/35 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[88vh] overflow-y-auto vice-scroll">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white">Burger Shot — Ocean Drive Career</h2>
              <p className="text-xs text-neutral-400">
                Shifts: <strong className="text-white font-mono-num">{job.shiftsCompleted}</strong> ·{' '}
                {job.banned ? (
                  <span className="text-rose-400 font-bold">BANNED FROM PREMISES</span>
                ) : job.isShiftManager ? (
                  <span className="text-amber-300 font-bold">SHIFT MANAGER (Max Pay + Free Meals)</span>
                ) : job.hired ? (
                  <span className="text-[#2dd4bf] font-semibold">Line Crew</span>
                ) : (
                  'Now Hiring All Roles'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Career Onboarding & Shift Controls */}
        {job.banned ? (
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-4 text-xs text-rose-200 space-y-2">
            <div className="font-bold text-sm text-rose-300">Terminated &amp; Trespassed!</div>
            <p>
              You trashed the counter and walked out in chaos. You can still rob the cash register when security cools off,
              but Burger Shot HR won&apos;t re-hire {player.name}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={onApply}
              disabled={job.hired}
              className={`p-3 rounded-xl border text-left text-xs transition-colors ${
                job.hired
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                  : 'bg-[#ff5a6e] hover:bg-[#ff4259] border-[#ff5a6e] text-white cursor-pointer font-bold'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>1. Apply at Counter</span>
                {job.hired && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">{job.hired ? 'Hired on Payroll' : 'Instant Interview (+$0)'}</div>
            </button>

            <button
              type="button"
              onClick={onToggleUniform}
              disabled={!job.hired}
              className={`p-3 rounded-xl border text-left text-xs transition-colors ${
                !job.hired
                  ? 'bg-[#151825] border-white/10 text-neutral-500 cursor-not-allowed'
                  : player.wearingBurgerUniform
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 cursor-pointer'
                  : 'bg-[#151825] hover:bg-white/10 border-white/15 text-white cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5 text-orange-400" /> 2. Staff Uniform
                </span>
                {player.wearingBurgerUniform && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                {player.wearingBurgerUniform ? 'Visor & Apron On' : 'Equip Paper Cap & Apron'}
              </div>
            </button>

            <button
              type="button"
              onClick={onClockIn}
              disabled={!job.hired || !player.wearingBurgerUniform}
              className={`p-3 rounded-xl border text-left text-xs transition-colors ${
                !job.hired || !player.wearingBurgerUniform
                  ? 'bg-[#151825] border-white/10 text-neutral-500 cursor-not-allowed'
                  : job.clockedIn
                  ? 'bg-[#2dd4bf]/20 border-[#2dd4bf] text-[#2dd4bf] cursor-pointer font-bold'
                  : 'bg-[#2dd4bf] hover:bg-[#14b8a6] border-[#2dd4bf] text-neutral-950 cursor-pointer font-bold'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 3. {job.clockedIn ? 'Clocked IN' : 'Clock In Shift'}
                </span>
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">{job.clockedIn ? 'Active on Duty' : 'Start earning wages'}</div>
            </button>
          </div>
        )}

        {/* Active Station Mini-Game */}
        {station === 'cashier' && (
          <div className="bg-[#151926] border border-[#2dd4bf]/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Cashier POS Terminal — Customer Order {cashierRounds + 1}/3</span>
              <span className="text-[#2dd4bf] font-mono-num">
                {orderCount}x {orderItem.name} @ ${orderItem.price}
              </span>
            </div>
            <p className="text-xs text-neutral-300">Ring up the exact register total to keep the drive-thru moving:</p>
            <div className="grid grid-cols-3 gap-2">
              {optionTotals.map((amt, i) => (
                <button
                  key={`${amt}_${i}`}
                  type="button"
                  onClick={() => handleCashierPick(amt)}
                  className="py-2.5 rounded-lg bg-[#0d1018] hover:bg-[#2dd4bf] hover:text-neutral-950 border border-white/15 font-mono-num font-bold text-sm text-white cursor-pointer"
                >
                  ${amt}.00
                </button>
              ))}
            </div>
          </div>
        )}

        {station === 'grill' && (
          <div className="bg-[#151926] border border-orange-400/45 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" /> Flame Grill &amp; Stack ({pattyLayers.length}/4 Layers)
              </span>
              <span className="text-amber-300">{pattyLayers.join(' → ') || 'Ready for Bottom Bun'}</span>
            </div>
            <div className="relative h-7 bg-[#0b0d14] rounded-lg border border-white/10 overflow-hidden">
              <div className="absolute top-0 bottom-0 left-[36%] w-[28%] bg-orange-500/35 border-x border-orange-400" />
              <div className="absolute top-0 bottom-0 w-2 bg-white" style={{ left: `${grillCursor}%` }} />
            </div>
            <button
              type="button"
              onClick={handleGrillPress}
              className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-neutral-950 font-display font-bold text-sm cursor-pointer"
            >
              Flip &amp; Stack Layer in Heat Zone
            </button>
          </div>
        )}

        {station === 'mop' && (
          <div className="bg-[#151926] border border-sky-400/45 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Dining Floor Spill Cleanup</span>
              <span className="text-sky-300 font-mono-num">
                {spillsCleaned.filter(Boolean).length}/6 Clean
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {spillsCleaned.map((done, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleMopSpot(idx)}
                  disabled={done}
                  className={`py-3 rounded-lg border text-xs font-semibold ${
                    done
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-sky-500/15 hover:bg-sky-500/30 border-sky-400/40 text-sky-200 cursor-pointer'
                  }`}
                >
                  {done ? 'Spotless' : `Mop Grease #${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4 Playable Job Stations */}
        {!job.banned && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={!job.clockedIn}
              onClick={() => {
                startCashierRound();
                setCashierRounds(0);
                setStation('cashier');
              }}
              className={`p-3.5 rounded-xl border text-left space-y-1 ${
                job.clockedIn
                  ? 'bg-[#151825] hover:bg-white/10 border-white/15 cursor-pointer'
                  : 'bg-[#12141e] border-white/5 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Cashier POS Station</span>
                <span className="text-emerald-400 font-mono-num">+${job.isShiftManager ? 290 : 210}</span>
              </div>
              <p className="text-[11px] text-neutral-400">Ring up 3 fast customer orders accurately.</p>
            </button>

            <button
              type="button"
              disabled={!job.clockedIn}
              onClick={() => {
                setPattyLayers([]);
                setStation('grill');
              }}
              className={`p-3.5 rounded-xl border text-left space-y-1 ${
                job.clockedIn
                  ? 'bg-[#151825] hover:bg-white/10 border-white/15 cursor-pointer'
                  : 'bg-[#12141e] border-white/5 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Grill &amp; Stack Chef</span>
                <span className="text-emerald-400 font-mono-num">+${job.isShiftManager ? 330 : 245} + Meal</span>
              </div>
              <p className="text-[11px] text-neutral-400">Cook patties in heat zone &amp; keep a Bleeder Burger (+40 HP).</p>
            </button>

            <button
              type="button"
              disabled={!job.clockedIn}
              onClick={() => {
                setSpillsCleaned([false, false, false, false, false, false]);
                setStation('mop');
              }}
              className={`p-3.5 rounded-xl border text-left space-y-1 ${
                job.clockedIn
                  ? 'bg-[#151825] hover:bg-white/10 border-white/15 cursor-pointer'
                  : 'bg-[#12141e] border-white/5 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Mop &amp; Floor Cleanup</span>
                <span className="text-emerald-400 font-mono-num">+${job.isShiftManager ? 250 : 185}</span>
              </div>
              <p className="text-[11px] text-neutral-400">Scrub 6 dining floor soda &amp; grease spills.</p>
            </button>

            <button
              type="button"
              disabled={!job.clockedIn}
              onClick={onLaunchDelivery}
              className={`p-3.5 rounded-xl border text-left space-y-1 ${
                job.clockedIn
                  ? 'bg-orange-500/15 hover:bg-orange-500/25 border-orange-400/45 cursor-pointer'
                  : 'bg-[#12141e] border-white/5 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-orange-200">
                <span className="flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-orange-400" /> Scooter Delivery Run
                </span>
                <span className="text-emerald-400 font-mono-num">+$320</span>
              </div>
              <p className="text-[11px] text-neutral-300">Spawns a Burger Shot Faggio Scooter outside for a 75s delivery!</p>
            </button>
          </div>
        )}

        {/* Shift Manager Tip & Criminal Chaos Options */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Complete {Math.max(0, 5 - job.shiftsCompleted)} more shifts for Shift Manager promotion</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onStealRegister}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" /> Steal Register Cash
            </button>
            {!job.banned && (
              <button
                type="button"
                onClick={onQuitChaos}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/45 text-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" /> &ldquo;I QUIT!&rdquo; Chaos (+2★)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
