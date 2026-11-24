import React, { useEffect, useState } from 'react';
import {
  Beer,
  Bomb,
  Briefcase,
  Building2,
  Coffee,
  Crosshair,
  Flame,
  Globe,
  Heart,
  Home,
  KeyRound,
  Landmark,
  Rocket,
  ShieldAlert,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Users,
  VideoOff,
  Wrench,
  X,
} from 'lucide-react';
import {
  ActiveModalType,
  ActivityDef,
  ControlSettings,
  HairId,
  HudSnapshot,
  InteriorInfo,
  JobDef,
  NpcInteractionContext,
  OutfitId,
  VehicleState,
} from '../game/types';

interface MiniGameModalProps {
  modal: ActiveModalType;
  payload: unknown;
  hud: HudSnapshot;
  onClose: () => void;
  onResolveHotwire: (vehicleId: string, success: boolean) => void;
  onResolveRobbery: (interiorId: string, amount: number, cleanStealth: boolean) => void;
  onWipeCctv: (interiorId: string) => void;
  onNpcChoice: (npcId: string, action: 'greet' | 'taunt' | 'defuse' | 'provoke') => void;
  onPartnerChoice: (choice: 'follow' | 'coffee' | 'bar' | 'flirt' | 'stay' | 'incar') => void;
  onChangeAppearance: (outfit: OutfitId, hair: HairId, clearHeat: boolean) => void;
  onBuyClothesOutfit: (outfit: OutfitId, hair: HairId, clearHeat: boolean, cost: number) => void;
  onBuyBungalow: (businessId: string) => void;
  onRestAtEstate: () => void;
  onUpdateControlSettings: (partial: Partial<ControlSettings>) => void;
  onShaveBeard: () => void;
  onSwapTrunkWeapon: (weaponId: string, dir: 'toTrunk' | 'fromTrunk') => void;
  onBuyWeaponStoreItem: (id: string) => void;
  onBuyFenceItem: (item: 'keycloner' | 'armor' | 'silenced9' | 'deagle' | 'shotgun' | 'smg' | 'carbine' | 'grenades' | 'upgrade') => void;
  onBuyAttachment: (kind: 'suppressor' | 'scope' | 'extendedMag' | 'traumakit' | 'painkillers' | 'clean_kit') => void;
  onDepositBank: (amount: number) => void;
  onWithdrawBank: (amount: number) => void;
  onBuyBusiness: (id: string) => void;
  onCompleteActivity: (activityId: string, success: boolean, scoreBonus: number) => void;
  onCompleteJob: (jobId: string, bonus: number) => void;
}

export const MiniGameModal: React.FC<MiniGameModalProps> = ({
  modal,
  payload,
  hud,
  onClose,
  onResolveHotwire,
  onResolveRobbery,
  onWipeCctv,
  onNpcChoice,
  onPartnerChoice,
  onChangeAppearance,
  onBuyClothesOutfit,
  onBuyBungalow,
  onRestAtEstate,
  onUpdateControlSettings,
  onShaveBeard,
  onSwapTrunkWeapon,
  onBuyWeaponStoreItem,
  onBuyFenceItem,
  onBuyAttachment,
  onDepositBank,
  onWithdrawBank,
  onBuyBusiness,
  onCompleteActivity,
  onCompleteJob,
}) => {
  const data = (payload as Record<string, unknown>) || {};
  const player = hud.protagonists[hud.activeId];

  const [cursor, setCursor] = useState(15);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitId>(player.outfit);
  const [selectedHair, setSelectedHair] = useState<HairId>(player.hair);

  useEffect(() => {
    setCursor(15);
    setScore(0);
    setRound(1);
    setSelectedOutfit(player.outfit);
    setSelectedHair(player.hair);
  }, [modal, payload, player.outfit, player.hair]);

  useEffect(() => {
    if (modal !== 'hotwire' && modal !== 'minigame' && modal !== 'cctv' && modal !== 'job') return;
    let dir = 1;
    let val = 15;
    const id = window.setInterval(() => {
      val += dir * 3.8;
      if (val >= 95) {
        val = 95;
        dir = -1;
      } else if (val <= 5) {
        val = 5;
        dir = 1;
      }
      setCursor(val);
    }, 24);
    return () => clearInterval(id);
  }, [modal]);

  if (!modal || modal === 'phone' || modal === 'map') return null;

  // DIRECT PARTNER COMMUNICATION MODAL
  if (modal === 'partner') {
    const partnerName = String(data.partnerName ?? (hud.activeId === 'jason' ? 'Lucia Caminos' : 'Jason Duval'));
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-2.5 sm:p-4 pointer-events-auto">
        <div className="bg-[#0e1018] border border-white/15 rounded-2xl p-3.5 sm:p-6 max-w-[94vw] sm:max-w-md w-full max-h-[88dvh] overflow-y-auto vice-scroll space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#2dd4bf]" />
              <div>
                <h3 className="font-display font-bold text-lg text-white">{partnerName}</h3>
                <div className="text-xs text-rose-300 flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-400 text-rose-400" /> Bond: {hud.relationship.meter}%
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded bg-white/10 text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-neutral-300">
            &ldquo;What&apos;s the move, partner? Want me to ride shotgun, hit Coffee or Beer Bar, or watch the Villa?&rdquo;
          </p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => onPartnerChoice('follow')}
              className="py-2.5 px-4 rounded-lg bg-[#2dd4bf] hover:bg-[#14b8a6] text-neutral-950 font-semibold text-xs text-left cursor-pointer"
            >
              Come with me — Back me up across Vice &amp; Northport!
            </button>
            <button
              type="button"
              onClick={() => onPartnerChoice('incar')}
              className="py-2.5 px-4 rounded-lg bg-[#151825] hover:bg-white/10 border border-cyan-500/35 text-cyan-200 font-semibold text-xs text-left cursor-pointer"
            >
              {hud.relationship.partnerInVehicleId ? 'Step Out of Car [K]' : 'Invite / Hop Into Car Passenger Seat [K]'}
            </button>
            <button
              type="button"
              onClick={() => onPartnerChoice('coffee')}
              className="py-2.5 px-4 rounded-lg bg-[#151825] hover:bg-white/10 border border-amber-500/35 text-amber-200 font-semibold text-xs flex items-center gap-2 cursor-pointer"
            >
              <Coffee className="w-4 h-4 text-amber-400" /> Let&apos;s go to Vice Roast Coffee Shop
            </button>
            <button
              type="button"
              onClick={() => onPartnerChoice('bar')}
              className="py-2.5 px-4 rounded-lg bg-[#151825] hover:bg-white/10 border border-purple-500/35 text-purple-200 font-semibold text-xs flex items-center gap-2 cursor-pointer"
            >
              <Beer className="w-4 h-4 text-purple-400" /> Let&apos;s hit Neon Anchor Beer Bar
            </button>
            <button
              type="button"
              onClick={() => onPartnerChoice('flirt')}
              className="py-2.5 px-4 rounded-lg bg-[#ff5a6e] hover:bg-[#ff4259] text-white font-semibold text-xs text-left cursor-pointer"
            >
              Flirt / Check In (+6% Relationship Bond)
            </button>
            <button
              type="button"
              onClick={() => onPartnerChoice('stay')}
              className="py-2 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-neutral-300 text-xs text-left cursor-pointer"
            >
              Stay at Jason&apos;s Villa for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VICE ARMORY & NORTHPORT TACTICAL ARMORY (9 WEAPONS + ARMOR + AMMO + ATTACHMENTS)
  if (modal === 'gunshop') {
    const storeInfo = data.interior as InteriorInfo | undefined;
    const isOwned = (id: string) => player.weapons.some((w) => w.id === id);

    const arsenal = [
      { id: 'armor', label: 'Heavy Ballistic Kevlar Vest (100% Armor)', price: 300, tag: 'ARMOR' },
      { id: 'bat', label: 'Baseball Bat (Heavy Melee Takedown)', price: 180, tag: 'MELEE' },
      { id: 'pistol9', label: '9mm Pistol (Reliable Sidearm)', price: 550, tag: 'PISTOL' },
      { id: 'smg', label: 'Micro SMG (Rapid-Fire Submachine)', price: 980, tag: 'SMG' },
      { id: 'shotgun', label: 'Pump Shotgun (Close-Quarters Spread)', price: 1250, tag: 'SHOTGUN' },
      { id: 'carbine', label: 'Assault Rifle (Full-Auto Carbine)', price: 1850, tag: 'RIFLE' },
      { id: 'sniper', label: 'Sniper Rifle (Long-Range Scope Zoom)', price: 2600, tag: 'SNIPER' },
      { id: 'grenades', label: '+3 Frag Grenades (Throw with [H])', price: 450, tag: 'EXPLOSIVE' },
      { id: 'molotov', label: '+3 Molotov Cocktails (Ground Fire Pool)', price: 420, tag: 'FIRE' },
      { id: 'rpg', label: 'RPG Launcher (+3 Heavy Rockets)', price: 4200, tag: 'HEAVY' },
      { id: 'ammo', label: 'Full Ammo Resupply (All Carried Guns)', price: 180, tag: 'AMMO' },
    ];

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-2.5 sm:p-4 pointer-events-auto">
        <div className="bg-[#0e1018] border border-white/15 rounded-2xl p-3.5 sm:p-6 max-w-[94vw] sm:max-w-lg w-full max-h-[88dvh] flex flex-col space-y-3 sm:space-y-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-orange-400" />
              <h3 className="font-display font-bold text-lg text-white">
                {storeInfo?.name || 'Vice Armory Gun Shop'}
              </h3>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded bg-white/10 text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Cash: <strong className="text-emerald-400 font-mono-num">${hud.cash.toLocaleString()}</strong></span>
            <span>
              Carried: <strong className="text-white font-mono-num">{player.weapons.length}/9</strong> ·{' '}
              <span className="text-amber-300">Grenades {player.grenades}</span> ·{' '}
              <span className="text-orange-300">Molotovs {player.molotovs}</span>
            </span>
          </div>
          <div className="space-y-2 flex-1 min-h-0 overflow-y-auto vice-scroll pr-1">
            {arsenal.map((item) => {
              const owned = isOwned(item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border bg-[#151825] border-white/10 gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-white font-medium flex items-center gap-1.5 truncate">
                      {item.id === 'grenades' && <Bomb className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {item.id === 'molotov' && <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                      {item.id === 'rpg' && <Rocket className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      {item.tag} {owned ? '· OWNED (Click to Refill Ammo)' : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onBuyWeaponStoreItem(item.id)}
                    className={`px-3 py-1.5 rounded-lg font-mono-num text-xs font-bold cursor-pointer shrink-0 ${
                      owned
                        ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30'
                        : 'bg-[#2dd4bf] hover:bg-[#14b8a6] text-neutral-950'
                    }`}
                  >
                    ${item.price.toLocaleString()}
                  </button>
                </div>
              );
            })}

            <div className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
              Upgrades, Attachments &amp; Field Survival
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-500/10 border border-orange-400/40">
              <span className="text-xs text-white font-medium">Upgrade Equipped Weapon (+24% Damage &amp; +5 Mag)</span>
              <button
                type="button"
                onClick={() => onBuyFenceItem('upgrade')}
                className="px-3 py-1 rounded-lg bg-orange-400 hover:bg-orange-300 text-neutral-950 font-mono-num text-xs font-bold cursor-pointer shrink-0"
              >
                $550
              </button>
            </div>
            {[
              { id: 'suppressor' as const, label: 'Tactical Suppressor (Silent Shots on Equipped Gun)', price: 420 },
              { id: 'scope' as const, label: 'Holo Reflex Scope (+20% Damage & +22m Range)', price: 360 },
              { id: 'extendedMag' as const, label: 'Extended Drum Magazine (+10 Rounds)', price: 320 },
              { id: 'clean_kit' as const, label: 'Gunsmith Cleaning Kit (100% Condition, Prevent Jam)', price: 110 },
              { id: 'traumakit' as const, label: 'Field Trauma Kit (+55 HP & Stop Bleeding)', price: 220 },
              { id: 'painkillers' as const, label: '+2 Painkiller Packs (-40% Incoming Damage 30s)', price: 140 },
            ].map((att) => (
              <div key={att.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#151825] border border-white/10">
                <span className="text-xs text-neutral-200 font-medium">{att.label}</span>
                <button
                  type="button"
                  onClick={() => onBuyAttachment(att.id)}
                  className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-mono-num text-xs font-bold cursor-pointer shrink-0"
                >
                  ${att.price}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // CLOTHES STORE (VICE THREADS BOUTIQUE / NORTHPORT STREETWEAR)
  if (modal === 'clothes') {
    const storeInfo = data.interior as InteriorInfo | undefined;
    const outfits: Array<{ id: OutfitId; name: string; desc: string; price: number }> = [
      { id: 'street', name: 'Vice Street Casual', desc: 'Open tropical shirt & denim', price: 0 },
      { id: 'beach', name: 'Ocean Drive Resort', desc: 'Sun-bleached coastal fit', price: 140 },
      { id: 'suited', name: 'Downtown High-Roller Suit', desc: 'Tailored blazer & clean cut', price: 360 },
      { id: 'tactical', name: 'Black-Ops Heist Rig', desc: 'Armored vest & dark cargo', price: 580 },
    ];
    const picked = outfits.find((o) => o.id === selectedOutfit) ?? outfits[0];

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-2.5 sm:p-4 pointer-events-auto">
        <div className="bg-[#0e1018] border border-pink-500/30 rounded-2xl p-3.5 sm:p-6 max-w-[94vw] sm:max-w-lg w-full max-h-[88dvh] overflow-y-auto vice-scroll space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shirt className="w-5 h-5 text-pink-400" />
              <h3 className="font-display font-bold text-lg text-white">
                {storeInfo?.name || 'Vice Threads Boutique'}
              </h3>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded bg-white/10 text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-neutral-400">
            Pocket Cash: <strong className="text-emerald-400 font-mono-num">${hud.cash.toLocaleString()}</strong> ·{' '}
            Changing outfit resets police visual recognition!
          </div>
          <div className="grid grid-cols-2 gap-2">
            {outfits.map((of) => (
              <button
                key={of.id}
                type="button"
                onClick={() => setSelectedOutfit(of.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer ${
                  selectedOutfit === of.id
                    ? 'bg-pink-500/20 border-pink-400 text-white'
                    : 'bg-[#151825] border-white/10 text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{of.name}</span>
                  <span className="text-[11px] font-mono-num text-emerald-400">${of.price}</span>
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">{of.desc}</div>
              </button>
            ))}
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-300 mb-1.5">Hairstyle Pairing</div>
            <div className="grid grid-cols-4 gap-2">
              {(['classic', 'fade', 'slick', 'braids'] as HairId[]).map((hr) => (
                <button
                  key={hr}
                  type="button"
                  onClick={() => setSelectedHair(hr)}
                  className={`py-2 rounded-lg text-xs capitalize cursor-pointer border ${
                    selectedHair === hr
                      ? 'bg-[#2dd4bf] border-[#2dd4bf] text-neutral-950 font-semibold'
                      : 'bg-[#151825] border-white/10 text-neutral-300'
                  }`}
                >
                  {hr}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onBuyClothesOutfit(selectedOutfit, selectedHair, true, picked.price);
              onClose();
            }}
            className="w-full py-3 rounded-lg bg-pink-500 hover:bg-pink-400 text-white font-display font-bold text-sm cursor-pointer"
          >
            {picked.price > 0 ? `Buy & Wear ${picked.name} ($${picked.price})` : 'Wear Outfit & Clear Heat'}
          </button>
        </div>
      </div>
    );
  }

  // TROPICAL SAFEHOUSE ISLAND BUNGALOW ESTATE
  if (modal === 'bungalow') {
    const island = data.island as { id?: string; name?: string } | undefined;
    const interior = data.interior as InteriorInfo | undefined;
    const estateName = island?.name || interior?.name || 'Paradise Key';
    const isStarlight = estateName.toLowerCase().includes('starlight');
    const biz = hud.businesses.find((b) =>
      isStarlight ? b.id === 'biz_starlight' : b.id === 'biz_paradise'
    ) || hud.businesses.find((b) => b.kind === 'bungalow');

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-2.5 sm:p-4 pointer-events-auto">
        <div className="bg-[#0e1018] border border-sky-400/35 rounded-2xl p-3.5 sm:p-6 max-w-[94vw] sm:max-w-md w-full max-h-[88dvh] overflow-y-auto vice-scroll space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-[#38bdf8]" />
              <h3 className="font-display font-bold text-lg text-white">{estateName} Bungalow</h3>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded bg-white/10 text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-neutral-300">
            Private oceanfront tropical bungalow with infinity pool, helipad/boat access, and safehouse suite.
          </p>
          {biz && (
            <div className="bg-[#151825] border border-white/10 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">{biz.name}</div>
                <div className="text-[11px] text-neutral-400">
                  {biz.district} · Passive +${biz.dailyIncome}/cycle
                </div>
              </div>
              {biz.owned ? (
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">OWNED</span>
              ) : (
                <button
                  type="button"
                  onClick={() => onBuyBungalow(biz.id)}
                  className="px-3 py-1.5 rounded-lg bg-[#38bdf8] hover:bg-sky-300 text-neutral-950 font-mono-num text-xs font-bold cursor-pointer"
                >
                  Buy ${biz.cost.toLocaleString()}
                </button>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              onRestAtEstate();
              onClose();
            }}
            className="w-full py-2.5 rounded-lg bg-[#2dd4bf] hover:bg-[#14b8a6] text-neutral-950 font-display font-bold text-sm cursor-pointer"
          >
            Rest &amp; Restore Full Health / Advance Morning
          </button>
        </div>
      </div>
    );
  }

  // LEONIDA RESERVE BANK ATM & PROPERTY ACQUISITION
  if (modal === 'bank') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-2.5 sm:p-4 pointer-events-auto">
        <div className="bg-[#0e1018] border border-emerald-500/35 rounded-2xl p-3.5 sm:p-6 max-w-[94vw] sm:max-w-lg w-full max-h-[88dvh] overflow-y-auto vice-scroll space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-400" />
              <h3 className="font-display font-bold text-lg text-white">Leonida Reserve Bank &amp; Vault ATM</h3>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded bg-white/10 text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 bg-[#151825] border border-white/10 rounded-xl p-3 text-xs">
            <div>
              <div className="text-neutral-400">Pocket Cash</div>
              <div className="font-mono-num text-lg font-bold text-white">${hud.cash.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-neutral-400">Bank Account (Protected)</div>
              <div className="font-mono-num text-lg font-bold text-emerald-400">${hud.bankBalance.toLocaleString()}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onDepositBank(1000)}
              className="py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs cursor-pointer"
            >
              Deposit $1,000
            </button>
            <button
              type="button"
              onClick={() => onWithdrawBank(1000)}
              className="py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs cursor-pointer"
            >
              Withdraw $1,000
            </button>
          </div>
          <div className="space-y-2 max-h-[38vh] overflow-y-auto vice-scroll">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#2dd4bf] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Acquire Income Properties &amp; Island Bungalows
            </div>
            {hud.businesses.map((b) => (
              <div key={b.id} className="flex items-center justify-between bg-[#151825] p-3 rounded-xl border border-white/10">
                <div>
                  <div className="text-xs font-bold text-white">{b.name}</div>
                  <div className="text-[11px] text-neutral-400">
                    {b.district} · Passive +${b.dailyIncome}/cycle
                  </div>
                </div>
                {b.owned ? (
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">OWNED</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onBuyBusiness(b.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#ff5a6e] hover:bg-[#ff4259] text-white font-mono-num text-xs font-bold cursor-pointer"
                  >
                    ${b.cost.toLocaleString()}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // INTERACTIVE CITY JOB SHIFT
  if (modal === 'job') {
    const job = (data.job as JobDef) || {
      id: 'job_burger_beach',
      name: 'Burger Shot Chef Shift',
      role: 'Grill Cook',
      district: 'Vice Beach',
      pay: 380,
      description: 'Cook fresh burgers cleanly for beach customers.',
    };
    const hitSweet = cursor >= 36 && cursor <= 64;
    const handleOrder = () => {
      const nextScore = hitSweet ? score + 1 : score;
      if (hitSweet) setScore(nextScore);
      if (round >= 3) onCompleteJob(job.id, nextScore);
      else setRound((r) => r + 1);
    };

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-2.5 sm:p-4 pointer-events-auto">
        <div className="bg-[#0e1018] border border-white/15 rounded-2xl p-3.5 sm:p-6 max-w-[94vw] sm:max-w-md w-full max-h-[88dvh] overflow-y-auto vice-scroll space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-400" />
              <h3 className="font-display font-bold text-lg text-white">{job.name}</h3>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded bg-white/10 text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>{job.role} · {job.district}</span>
            <span className="font-mono-num text-emerald-400">Order {round}/3 · Tips: {score}</span>
          </div>
          <p className="text-xs text-neutral-300">{job.description} Base Pay: ${job.pay} (+$85 tip per clean hit).</p>
          <div className="relative h-7 bg-[#151825] rounded-lg border border-white/10 overflow-hidden">
            <div className="absolute top-0 bottom-0 left-[36%] w-[28%] bg-emerald-500/35 border-x border-emerald-400" />
            <div className="absolute top-0 bottom-0 w-2 bg-amber-400" style={{ left: `${cursor}%` }} />
          </div>
          <button
            type="button"
            onClick={handleOrder}
            className="w-full py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-display font-bold text-sm cursor-pointer"
          >
            {round >= 3 ? 'Serve Final Order & Collect Pay' : 'Serve Order in Green Zone'}
          </button>
        </div>
      </div>
    );
  }

  // PAUSE & CONTROLS SETTINGS MENU
  if (modal === 'pause') {
    const cs = hud.controlSettings;
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-2.5 sm:p-4 pointer-events-auto">
        <div className="bg-[#0e1018] border border-white/15 rounded-2xl p-3.5 sm:p-6 max-w-[94vw] sm:max-w-md w-full max-h-[88dvh] overflow-y-auto vice-scroll space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-[#2dd4bf]" />
              <h3 className="font-display font-bold text-lg sm:text-xl text-white">Pause &amp; Control Settings</h3>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded bg-white/10 text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Language, Touch Controls & PC Key Hints Toggles */}
          <div className="bg-[#151825] border border-white/10 rounded-xl p-3 sm:p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#2dd4bf]" /> Game Language
                </div>
                <div className="text-[10px] text-neutral-400">
                  Switch HUD &amp; Touch UI between English and Hinglish
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateControlSettings({ language: cs.language === 'hinglish' ? 'en' : 'hinglish' })
                }
                className="min-w-[78px] py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer bg-[#ff5a6e] text-white"
              >
                {cs.language === 'hinglish' ? 'Hinglish' : 'English'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div>
                <div className="text-xs font-bold text-white">Mobile Touch Controls</div>
                <div className="text-[10px] text-neutral-400">
                  Virtual joystick, drag-to-look &amp; touch buttons ({cs.autoDetectedMobile ? 'Auto-Detected Mobile' : 'Desktop Detected'})
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateControlSettings({ touchControls: !cs.touchControls })}
                className={`min-w-[64px] py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer ${
                  cs.touchControls ? 'bg-[#2dd4bf] text-neutral-950' : 'bg-white/10 text-neutral-300'
                }`}
              >
                {cs.touchControls ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div>
                <div className="text-xs font-bold text-white">PC Key Hints</div>
                <div className="text-[10px] text-neutral-400">Show [Q], [M], [E], [F] hotkey badges on HUD</div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateControlSettings({ pcKeyHints: !cs.pcKeyHints })}
                className={`min-w-[64px] py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer ${
                  cs.pcKeyHints ? 'bg-[#38bdf8] text-neutral-950' : 'bg-white/10 text-neutral-300'
                }`}
              >
                {cs.pcKeyHints ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {!cs.touchControls && cs.pcKeyHints && (
            <div className="text-xs text-neutral-300 space-y-1.5 bg-[#151825] p-3.5 rounded-xl border border-white/10">
              <div><strong className="text-white">On Foot:</strong> W A S D · Shift Sprint · Space Jump · C Crouch · X Prone · Alt Dodge</div>
              <div><strong className="text-white">Interact / Shops:</strong> E near Doors, Clothes, Armory, Bungalows, Bed, Burger Shot, or Lucia</div>
              <div><strong className="text-white">Combat &amp; Wheel:</strong> Click Attack · Right Click Aim/Scope · Q Weapon Wheel · 1-9 Quick Select · H Throw · CapsLock Focus · R Reload</div>
              <div><strong className="text-white">Vehicles &amp; Map:</strong> F Board/Bailout · B Call Lucia · K Partner In/Out · M Full GPS Map · P Phone</div>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-[#ff5a6e] hover:bg-[#ff4259] text-white font-display font-bold text-sm cursor-pointer"
          >
            Resume Leonida
          </button>
        </div>
      </div>
    );
  }

  // HOTWIRE / KEY CLONER
  if (modal === 'hotwire') {
    const vehicle = data.vehicle as VehicleState;
    const isLuxury = Boolean(data.isLuxury);
    const inSweetSpot = cursor >= 38 && cursor <= 62;

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-2.5 sm:p-4 pointer-events-auto">
        <div className="bg-[#0e1018] border border-white/15 rounded-2xl p-3.5 sm:p-6 max-w-[94vw] sm:max-w-md w-full max-h-[88dvh] overflow-y-auto vice-scroll space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <h3 className="font-display font-bold text-lg text-white">
                {isLuxury ? 'Luxury Key Cloner Bypass' : 'Hotwire Ignition'}
              </h3>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded bg-white/10 text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-neutral-300">
            {isLuxury
              ? `Cloning digital transponder for ${vehicle.name}. Trigger inside the green sync zone!`
              : `Strike the ignition wire for ${vehicle.name} inside the green zone.`}
          </p>
          <div className="relative h-6 bg-[#151825] rounded-lg border border-white/10 overflow-hidden">
            <div className="absolute top-0 bottom-0 left-[38%] w-[24%] bg-emerald-500/35 border-x border-emerald-400" />
            <div className="absolute top-0 bottom-0 w-1.5 bg-white" style={{ left: `${cursor}%` }} />
          </div>
          <button
            type="button"
            onClick={() => onResolveHotwire(vehicle.id, inSweetSpot)}
            className="w-full py-3 rounded-lg bg-[#2dd4bf] hover:bg-[#14b8a6] text-neutral-950 font-display font-bold text-sm cursor-pointer"
          >
            {isLuxury ? 'Clone Transponder Key' : 'Spark Ignition Wires'}
          </button>
        </div>
      </div>
    );
  }

  // ROBBERY
  if (modal === 'robbery') {
    const interior = data.interior as InteriorInfo;
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-2.5 sm:p-4 pointer-events-auto">
        <div className="bg-[#0e1018] border border-white/15 rounded-2xl p-3.5 sm:p-6 max-w-[94vw] sm:max-w-md w-full max-h-[88dvh] overflow-y-auto vice-scroll space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h3 className="font-display font-bold text-lg text-white">Hold Up — {interior.name}</h3>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded bg-white/10 text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-neutral-300">
            Cashier has their hands up. Choose stealth intimidation or loud smash-and-grab.
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            <button
              type="button"
              onClick={() => onResolveRobbery(interior.id, interior.kind === 'bank' ? 9500 : interior.kind === 'jewelry' ? 5200 : 1400, true)}
              className="py-3 px-4 rounded-lg bg-[#2dd4bf] hover:bg-[#14b8a6] text-neutral-950 font-semibold text-sm text-left cursor-pointer"
            >
              Quiet Intimidation — Clean Cash (+Stealth Profile)
            </button>
            <button
              type="button"
              onClick={() => onResolveRobbery(interior.id, interior.kind === 'bank' ? 18500 : interior.kind === 'jewelry' ? 9800 : 2600, false)}
              className="py-3 px-4 rounded-lg bg-[#ff5a6e] hover:bg-[#ff4259] text-white font-semibold text-sm text-left cursor-pointer"
            >
              Smash Safe &amp; Registers — Max Cash (+Wanted Stars)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CCTV
  if (modal === 'cctv') {
    const interior = data.interior as InteriorInfo;
    const hit = cursor >= 32 && cursor <= 68;
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-2.5 sm:p-4 pointer-events-auto">
        <div className="bg-[#0e1018] border border-white/15 rounded-2xl p-3.5 sm:p-6 max-w-[94vw] sm:max-w-md w-full max-h-[88dvh] overflow-y-auto vice-scroll space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VideoOff className="w-5 h-5 text-[#2dd4bf]" />
              <h3 className="font-display font-bold text-lg text-white">CCTV Security Terminal</h3>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded bg-white/10 text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-neutral-300">Erase security footage inside {interior.name} to drop evidence.</p>
          <div className="relative h-6 bg-[#151825] rounded-lg border border-white/10 overflow-hidden">
            <div className="absolute top-0 bottom-0 left-[32%] w-[36%] bg-cyan-500/35 border-x border-cyan-400" />
            <div className="absolute top-0 bottom-0 w-1.5 bg-white" style={{ left: `${cursor}%` }} />
          </div>
          <button
            type="button"
            onClick={() => {
              if (hit) onWipeCctv(interior.id);
              else setRound((r) => r + 1);
            }}
            className="w-full py-3 rounded-lg bg-[#2dd4bf] hover:bg-[#14b8a6] text-neutral-950 font-display font-bold text-sm cursor-pointer"
          >
            {round > 1 ? 'Purge Security Log (Retry)' : 'Purge Security Log'}
          </button>
        </div>
      </div>
    );
  }

  // NPC INTERACTION
  if (modal === 'npc') {
    const npc = payload as NpcInteractionContext;
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-2.5 sm:p-4 pointer-events-auto">
        <div className="bg-[#0e1018] border border-white/15 rounded-2xl p-3.5 sm:p-6 max-w-[94vw] sm:max-w-md w-full max-h-[88dvh] overflow-y-auto vice-scroll space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-white">{npc.name}</h3>
              <div className="text-xs text-neutral-400">
                {npc.archetype} {npc.isWitness ? '· Calling 911!' : ''}
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded bg-white/10 text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-[#151825] border border-white/10 rounded-xl p-3.5 text-sm text-neutral-200 italic">
            {npc.reaction}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onNpcChoice(npc.npcId, 'greet')}
              className="py-2.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
            >
              Greet
            </button>
            <button
              type="button"
              onClick={() => onNpcChoice(npc.npcId, 'defuse')}
              className="py-2.5 rounded-lg bg-[#2dd4bf] hover:bg-[#14b8a6] text-neutral-950 text-xs font-semibold cursor-pointer"
            >
              {npc.isWitness ? 'Intimidate / Stop 911' : 'Defuse'}
            </button>
            <button
              type="button"
              onClick={() => onNpcChoice(npc.npcId, 'taunt')}
              className="py-2.5 rounded-lg bg-amber-500/85 hover:bg-amber-500 text-neutral-950 text-xs font-semibold cursor-pointer"
            >
              Taunt
            </button>
            <button
              type="button"
              onClick={() => onNpcChoice(npc.npcId, 'provoke')}
              className="py-2.5 rounded-lg bg-[#ff5a6e] hover:bg-[#ff4259] text-white text-xs font-semibold cursor-pointer"
            >
              Provoke
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CAR TRUNK (Synced with player.weapons!)
  if (modal === 'trunk') {
    const veh = (hud.nearbyTrunkVehicle || hud.drivingVehicle) as VehicleState | null;
    if (!veh) return null;
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-2.5 sm:p-4 pointer-events-auto">
        <div className="bg-[#0e1018] border border-white/15 rounded-2xl p-3.5 sm:p-6 max-w-[94vw] sm:max-w-lg w-full max-h-[88dvh] overflow-y-auto vice-scroll space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base sm:text-lg text-white truncate">Vehicle Trunk — {veh.name}</h3>
            <button type="button" onClick={onClose} className="p-1.5 rounded bg-white/10 text-white cursor-pointer shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-[#151825] border border-white/10 rounded-xl p-3 space-y-2 max-h-56 overflow-y-auto vice-scroll">
              <div className="text-xs font-semibold text-neutral-300">On Person ({player.name})</div>
              {player.weapons.length === 0 ? (
                <div className="text-xs text-neutral-500">Unarmed (Fists Only).</div>
              ) : (
                player.weapons.map((w) => (
                  <div key={w.id} className="flex items-center justify-between text-xs bg-[#0e1018] p-2 rounded">
                    <span className="text-white truncate">{w.name}</span>
                    <button
                      type="button"
                      onClick={() => onSwapTrunkWeapon(w.id, 'toTrunk')}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[11px] text-white cursor-pointer"
                    >
                      Stash
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="bg-[#151825] border border-white/10 rounded-xl p-3 space-y-2 max-h-56 overflow-y-auto vice-scroll">
              <div className="text-xs font-semibold text-neutral-300">Trunk Storage</div>
              {veh.trunkWeapons.length === 0 ? (
                <div className="text-xs text-neutral-500">No weapons stored in trunk.</div>
              ) : (
                veh.trunkWeapons.map((w, i) => (
                  <div key={`${w.id}_${i}`} className="flex items-center justify-between text-xs bg-[#0e1018] p-2 rounded">
                    <span className="text-[#2dd4bf] truncate">{w.name}</span>
                    <button
                      type="button"
                      onClick={() => onSwapTrunkWeapon(w.id, 'fromTrunk')}
                      className="px-2 py-0.5 rounded bg-[#2dd4bf] text-neutral-950 font-semibold text-[11px] cursor-pointer"
                    >
                      Equip
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-xs text-neutral-300">Quick Trunk Disguise:</span>
            <div className="flex gap-1.5">
              {(['street', 'suited', 'beach', 'tactical'] as OutfitId[]).map((of) => (
                <button
                  key={of}
                  type="button"
                  onClick={() => onChangeAppearance(of, player.hair, true)}
                  className={`px-2.5 py-1 rounded text-xs capitalize cursor-pointer ${
                    player.outfit === of ? 'bg-[#ff5a6e] text-white' : 'bg-white/10 text-neutral-300'
                  }`}
                >
                  {of}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // WARDROBE / BARBER / FENCE
  if (modal === 'wardrobe') {
    const isFenceShop = Boolean(data.isFenceShop);
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-2.5 sm:p-4 pointer-events-auto">
        <div className="bg-[#0e1018] border border-white/15 rounded-2xl p-3.5 sm:p-6 max-w-[94vw] sm:max-w-lg w-full max-h-[88dvh] overflow-y-auto vice-scroll space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isFenceShop ? <Wrench className="w-5 h-5 text-amber-400" /> : <Sparkles className="w-5 h-5 text-[#2dd4bf]" />}
              <h3 className="font-display font-bold text-lg text-white">
                {isFenceShop ? 'Uncle Jack Pawn & Underground Fence' : 'Wardrobe, Barber & Disguise'}
              </h3>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded bg-white/10 text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          {isFenceShop ? (
            <div className="space-y-2.5">
              <p className="text-xs text-neutral-400">Cash: ${hud.cash.toLocaleString()}</p>
              {[
                { id: 'keycloner' as const, label: 'Luxury Key Cloner (Bypass exotic cars)', price: 450 },
                { id: 'armor' as const, label: 'Tactical Kevlar Armor (100%)', price: 300 },
                { id: 'grenades' as const, label: '+3 Frag Grenades [H]', price: 450 },
                { id: 'silenced9' as const, label: 'Suppressed .45 Pistol (Stealth)', price: 650 },
                { id: 'smg' as const, label: 'Micro SMG', price: 980 },
                { id: 'shotgun' as const, label: 'Pump Shotgun', price: 1250 },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-[#151825] p-3 rounded-xl border border-white/10">
                  <span className="text-xs text-white font-medium">{item.label}</span>
                  <button
                    type="button"
                    onClick={() => onBuyFenceItem(item.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#2dd4bf] hover:bg-[#14b8a6] text-neutral-950 font-mono-num text-xs font-bold cursor-pointer"
                  >
                    ${item.price}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-neutral-300 mb-2">Outfit Style</div>
                <div className="grid grid-cols-4 gap-2">
                  {(['street', 'suited', 'beach', 'tactical'] as OutfitId[]).map((of) => (
                    <button
                      key={of}
                      type="button"
                      onClick={() => setSelectedOutfit(of)}
                      className={`py-2 rounded-lg text-xs capitalize cursor-pointer border ${
                        selectedOutfit === of ? 'bg-[#ff5a6e] border-[#ff5a6e] text-white font-semibold' : 'bg-[#151825] border-white/10 text-neutral-300'
                      }`}
                    >
                      {of}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-neutral-300 mb-2">Haircut</div>
                <div className="grid grid-cols-4 gap-2">
                  {(['classic', 'fade', 'slick', 'braids'] as HairId[]).map((hr) => (
                    <button
                      key={hr}
                      type="button"
                      onClick={() => setSelectedHair(hr)}
                      className={`py-2 rounded-lg text-xs capitalize cursor-pointer border ${
                        selectedHair === hr ? 'bg-[#2dd4bf] border-[#2dd4bf] text-neutral-950 font-semibold' : 'bg-[#151825] border-white/10 text-neutral-300'
                      }`}
                    >
                      {hr}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onShaveBeard}
                  className="px-4 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-display font-bold text-xs cursor-pointer shrink-0"
                >
                  Shave Beard ({Math.round(player.beardLevel)}%) · $35
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeAppearance(selectedOutfit, selectedHair, true);
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-lg bg-[#2dd4bf] hover:bg-[#14b8a6] text-neutral-950 font-display font-bold text-sm cursor-pointer"
                >
                  Apply New Look &amp; Clear Heat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // MINI-GAME
  if (modal === 'minigame') {
    const act = data.activity as ActivityDef;
    const hitSweet = cursor >= 36 && cursor <= 64;
    const handleAttempt = () => {
      const nextScore = hitSweet ? score + 1 : score;
      if (hitSweet) setScore(nextScore);
      if (round >= 3) onCompleteActivity(act.id, nextScore >= 1, nextScore);
      else setRound((r) => r + 1);
    };

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-2.5 sm:p-4 pointer-events-auto">
        <div className="bg-[#0e1018] border border-white/15 rounded-2xl p-3.5 sm:p-6 max-w-[94vw] sm:max-w-md w-full max-h-[88dvh] overflow-y-auto vice-scroll space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-display font-bold text-lg text-white">{act.name}</h3>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded bg-white/10 text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>{act.category} · {act.district}</span>
            <span className="font-mono-num text-[#2dd4bf]">Round {round}/3 · Hits: {score}</span>
          </div>
          <p className="text-sm text-neutral-200">{act.description}</p>
          <div className="bg-[#151825] border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span className="flex items-center gap-1"><Crosshair className="w-3.5 h-3.5 text-[#ff5a6e]" /> Timing / Aim Zone</span>
              <span className="uppercase text-amber-300">Reward: +{act.statReward}</span>
            </div>
            <div className="relative h-7 bg-[#0b0d14] rounded-lg border border-white/10 overflow-hidden">
              <div className="absolute top-0 bottom-0 left-[36%] w-[28%] bg-[#2dd4bf]/35 border-x border-[#2dd4bf]" />
              <div className="absolute top-0 bottom-0 w-2 bg-[#ff5a6e]" style={{ left: `${cursor}%` }} />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAttempt}
            className="w-full py-3 rounded-lg bg-[#ff5a6e] hover:bg-[#ff4259] text-white font-display font-bold text-sm cursor-pointer"
          >
            {round >= 3 ? 'Finish Final Shot / Rep' : 'Execute Action'}
          </button>
        </div>
      </div>
    );
  }

  return null;
};
