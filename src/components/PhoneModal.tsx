import React, { useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Briefcase,
  Building2,
  Car,
  Compass,
  Headphones,
  Heart,
  HeartPulse,
  Home,
  Landmark,
  MapPin,
  MessageSquare,
  Navigation,
  PhoneCall,
  Pill,
  Radio,
  Send,
  Skull,
  Target,
  TrendingUp,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { ActivityDef, DarkWebDrop, HudSnapshot, JobDef, MissionDef, SocialPost } from '../game/types';

interface PhoneModalProps {
  hud: HudSnapshot;
  socialPosts: SocialPost[];
  activities: ActivityDef[];
  missions: MissionDef[];
  jobs: JobDef[];
  onClose: () => void;
  onOpenMap: () => void;
  onSetWaypoint: (x: number, z: number, label: string) => void;
  onLaunchActivity: (id: string) => void;
  onSelectMission: (id: string) => void;
  onSwitchProtagonist: () => void;
  onTogglePartner: () => void;
  onTogglePartnerInCar: () => void;
  onCallPartner: () => void;
  onSendMessage: (text: string, goToVenue?: 'coffee' | 'bar' | 'park') => void;
  onDepositBank: (amount: number) => void;
  onWithdrawBank: (amount: number) => void;
  onBuyBusiness: (id: string) => void;
  onTradeStock: (symbol: string, side: 'buy' | 'sell') => void;
  onOrderDarkWeb: (itemKey: DarkWebDrop['itemKey'], cost: number) => void;
  onCycleRadio: () => void;
  onToggleEarphones: () => void;
  onUseTraumaKit: () => void;
  onUsePainkiller: () => void;
  onEatBurger: () => void;
}

type PhoneTab = 'messages' | 'bank' | 'stocks' | 'darkweb' | 'jobs' | 'social' | 'duo' | 'gps';

export const PhoneModal: React.FC<PhoneModalProps> = ({
  hud,
  socialPosts,
  activities,
  missions,
  jobs,
  onClose,
  onOpenMap,
  onSetWaypoint,
  onLaunchActivity,
  onSelectMission,
  onSwitchProtagonist,
  onTogglePartner,
  onTogglePartnerInCar,
  onCallPartner,
  onSendMessage,
  onDepositBank,
  onWithdrawBank,
  onBuyBusiness,
  onTradeStock,
  onOrderDarkWeb,
  onCycleRadio,
  onToggleEarphones,
  onUseTraumaKit,
  onUsePainkiller,
  onEatBurger,
}) => {
  const [tab, setTab] = useState<PhoneTab>('messages');
  const [customMsg, setCustomMsg] = useState('');
  const player = hud.protagonists[hud.activeId];
  const partnerName = hud.activeId === 'jason' ? 'Lucia Caminos' : 'Jason Duval';
  const showHints = hud.controlSettings.pcKeyHints && !hud.controlSettings.touchControls;

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;
    onSendMessage(customMsg.trim());
    setCustomMsg('');
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-2.5 sm:p-3 pointer-events-auto">
      <div className="w-[min(360px,94vw)] max-w-[94vw] h-[min(640px,88dvh)] max-h-[88dvh] bg-[#0b0d15] border-[3px] border-neutral-700/90 rounded-[26px] sm:rounded-[30px] flex flex-col overflow-hidden shadow-2xl">
        {/* GTA Phone Top Speaker Notch & Status */}
        <div className="px-4 pt-2.5 pb-2 bg-[#121624] border-b border-white/10 shrink-0">
          <div className="w-14 h-1 rounded-full bg-neutral-700 mx-auto mb-2" />
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono-num text-neutral-300">{hud.timeOfDayLabel}</span>
            <span className="font-display font-bold text-white">iVice · Clout {hud.clout}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono-num text-emerald-400 font-semibold">${hud.cash.toLocaleString()}</span>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                aria-label="Close Phone"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* 4x2 Smartphone App Launcher Grid */}
        <div className="grid grid-cols-4 gap-1 px-2 py-2 bg-[#101320] border-b border-white/10">
          {[
            { id: 'messages' as const, icon: MessageSquare, label: 'Chat' },
            { id: 'bank' as const, icon: Landmark, label: 'Bank/Biz' },
            { id: 'stocks' as const, icon: TrendingUp, label: 'Stocks' },
            { id: 'darkweb' as const, icon: Skull, label: 'DarkWeb' },
            { id: 'jobs' as const, icon: Target, label: 'Jobs' },
            { id: 'social' as const, icon: Radio, label: 'Live' },
            { id: 'duo' as const, icon: Users, label: 'Duo/FM' },
            { id: 'gps' as const, icon: Compass, label: 'GPS' },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`py-1 rounded-lg flex flex-col items-center gap-0.5 text-[10px] cursor-pointer ${
                  active ? 'bg-[#ff5a6e] text-white font-semibold' : 'text-neutral-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Phone Body */}
        <div className="flex-1 overflow-y-auto p-3.5 vice-scroll space-y-3">
          {tab === 'messages' && (
            <div className="space-y-3">
              <div className="bg-[#151928] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-display font-bold text-xs text-white truncate">{partnerName}</div>
                  <div className="text-[11px] text-[#2dd4bf] truncate">
                    {hud.relationship.partnerInVehicleId
                      ? 'Inside Vehicle'
                      : hud.relationship.partnerState === 'home'
                      ? "At Jason's Villa"
                      : hud.relationship.partnerState === 'coming'
                      ? 'Heading to you...'
                      : 'With you (Duo)'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCallPartner}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call
                </button>
              </div>

              {(hud.drivingVehicle || hud.nearbyTrunkVehicle) && (
                <button
                  type="button"
                  onClick={onTogglePartnerInCar}
                  className="w-full py-2 px-3 rounded-lg bg-[#2dd4bf]/15 hover:bg-[#2dd4bf]/25 border border-[#2dd4bf]/40 text-[#2dd4bf] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Car className="w-3.5 h-3.5" />
                  {hud.relationship.partnerInVehicleId
                    ? `Let Partner Exit Vehicle${showHints ? ' [K]' : ''}`
                    : `Invite Partner Into Car${showHints ? ' [K]' : ''}`}
                </button>
              )}

              <div className="bg-[#151928] border border-white/10 rounded-xl p-2.5 space-y-2 max-h-[140px] overflow-y-auto vice-scroll">
                {hud.messages.map((msg) => {
                  const isMe = msg.sender === hud.activeId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-[11px] ${
                          isMe ? 'bg-[#ff5a6e] text-white' : 'bg-[#0c0f18] border border-white/10 text-neutral-200'
                        }`}
                      >
                        <div>{msg.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onSendMessage(`Meet me right now, ${partnerName.split(' ')[0]}!`)}
                  className="p-2 rounded-lg bg-[#151928] hover:bg-white/10 border border-white/10 text-[11px] text-white text-left cursor-pointer"
                >
                  Call Over Now
                </button>
                <button
                  type="button"
                  onClick={() => onSendMessage("Let's grab coffee at Vice Roast!", 'coffee')}
                  className="p-2 rounded-lg bg-[#151928] hover:bg-white/10 border border-white/10 text-[11px] text-amber-200 text-left cursor-pointer"
                >
                  Meet at Coffee Shop
                </button>
                <button
                  type="button"
                  onClick={() => onSendMessage("Let's hit Neon Anchor Beer Bar!", 'bar')}
                  className="p-2 rounded-lg bg-[#151928] hover:bg-white/10 border border-white/10 text-[11px] text-purple-200 text-left cursor-pointer"
                >
                  Meet at Beer Bar
                </button>
                <button
                  type="button"
                  onClick={() => onSendMessage("Let's walk Central Park Garden!", 'park')}
                  className="p-2 rounded-lg bg-[#151928] hover:bg-white/10 border border-white/10 text-[11px] text-emerald-200 text-left cursor-pointer"
                >
                  Meet at Park Garden
                </button>
              </div>

              <form onSubmit={handleSendCustom} className="flex gap-1.5">
                <input
                  type="text"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder={`Text ${partnerName.split(' ')[0]}...`}
                  className="flex-1 bg-[#151928] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2dd4bf]"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1.5 rounded-lg bg-[#2dd4bf] text-neutral-950 font-semibold text-xs cursor-pointer"
                  aria-label="Send"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {tab === 'bank' && (
            <div className="space-y-3">
              <div className="bg-[#151928] border border-emerald-500/35 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Leonida Maze Bank</span>
                  <span className="font-mono-num font-bold text-emerald-400">${hud.bankBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Pocket Cash (Mugger Risk &gt;$5k)</span>
                  <span className="font-mono-num text-white">${hud.cash.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onDepositBank(1000)}
                    className="py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-[11px] font-bold cursor-pointer"
                  >
                    Deposit $1,000
                  </button>
                  <button
                    type="button"
                    onClick={() => onWithdrawBank(500)}
                    className="py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Withdraw $500
                  </button>
                </div>
              </div>

              <div className="text-[11px] font-semibold text-[#2dd4bf] uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Leonida Empire Properties
              </div>
              {hud.businesses.map((biz) => (
                <div key={biz.id} className="bg-[#151928] border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{biz.name}</div>
                    <div className="text-[10px] text-neutral-400">
                      {biz.district} · +${biz.dailyIncome}/cycle
                    </div>
                  </div>
                  {biz.owned ? (
                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold shrink-0">
                      OWNED
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onBuyBusiness(biz.id)}
                      className="px-2.5 py-1 rounded bg-[#ff5a6e] hover:bg-[#ff4259] text-white text-[11px] font-mono-num font-bold cursor-pointer shrink-0"
                    >
                      ${biz.cost.toLocaleString()}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'stocks' && (
            <div className="space-y-2.5">
              <div className="bg-[#151928] border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs">
                <span className="text-neutral-300">LCN &amp; BAWSAQ Exchange</span>
                <span className="font-mono-num text-emerald-400 font-bold">Bank ${hud.bankBalance.toLocaleString()}</span>
              </div>
              {hud.stocks.map((st) => {
                const up = st.changePct >= 0;
                return (
                  <div key={st.symbol} className="bg-[#151928] border border-white/10 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white">{st.symbol}</span>{' '}
                        <span className="text-[10px] text-neutral-400">{st.name}</span>
                      </div>
                      <div className="text-right font-mono-num">
                        <div className="text-xs font-bold text-white">${st.price.toFixed(2)}</div>
                        <div className={`text-[10px] ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {up ? '+' : ''}
                          {st.changePct}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
                      <span className="text-neutral-400 font-mono-num">Shares: {st.sharesOwned}</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => onTradeStock(st.symbol, 'buy')}
                          className="px-2.5 py-1 rounded bg-[#2dd4bf] text-neutral-950 font-bold cursor-pointer"
                        >
                          Buy 1
                        </button>
                        <button
                          type="button"
                          onClick={() => onTradeStock(st.symbol, 'sell')}
                          className="px-2.5 py-1 rounded bg-white/10 text-white font-semibold cursor-pointer"
                        >
                          Sell 1
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'darkweb' && (
            <div className="space-y-2.5">
              <div className="bg-rose-500/10 border border-rose-500/35 rounded-xl p-2.5 text-[11px] text-rose-200">
                Onion Dead-Drop Network — Order illicit hardware. Pick up the green crate beacon on your GPS!
              </div>
              {hud.darkWebDrop && (
                <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-2.5 text-[11px] text-emerald-200 flex items-center justify-between">
                  <span className="truncate">Active Drop: {hud.darkWebDrop.label}</span>
                  <button
                    type="button"
                    onClick={() => onSetWaypoint(hud.darkWebDrop!.x, hud.darkWebDrop!.z, hud.darkWebDrop!.label)}
                    className="px-2 py-0.5 rounded bg-emerald-400 text-neutral-950 font-bold cursor-pointer shrink-0"
                  >
                    GPS
                  </button>
                </div>
              )}
              {[
                { key: 'keycloner' as const, title: 'Transponder Key Cloner', desc: 'Steal locked exotic hypercars', price: 420 },
                { key: 'carbine' as const, title: 'Military Leonida Carbine', desc: 'High-impact long gun drop', price: 1450 },
                { key: 'silenced9' as const, title: 'Suppressed .45 Operative', desc: 'Silent takedowns without witnesses', price: 600 },
                { key: 'grenades' as const, title: '4x Frag Grenade Crate', desc: 'Heavy explosives resupply', price: 380 },
                { key: 'traumakit' as const, title: '2x Field Trauma Kits', desc: 'Stops heavy bleeding & heals', price: 290 },
                { key: 'cleaningkit' as const, title: 'Gunsmith Oil & Cleaning Kit', desc: 'Restores equipped weapon 100%', price: 120 },
              ].map((item) => (
                <div key={item.key} className="bg-[#151928] border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{item.title}</div>
                    <div className="text-[10px] text-neutral-400 truncate">{item.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOrderDarkWeb(item.key, item.price)}
                    className="px-2.5 py-1 rounded bg-[#ff5a6e] hover:bg-[#ff4259] text-white text-[11px] font-mono-num font-bold cursor-pointer shrink-0"
                  >
                    ${item.price}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'jobs' && (
            <div className="space-y-3">
              <div className="bg-orange-500/15 border border-orange-400/40 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-orange-200">Burger Shot Career Diner</div>
                  <div className="text-[10px] text-neutral-300">
                    Cashier · Grill · Mop · Scooter Delivery ({hud.burgerJob.shiftsCompleted} shifts)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSetWaypoint(70, 210, 'Burger Shot Diner')}
                  className="px-2.5 py-1 rounded bg-orange-400 text-neutral-950 text-[11px] font-bold cursor-pointer shrink-0"
                >
                  GPS
                </button>
              </div>

              <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Side Hustles</div>
              {jobs.map((j) => (
                <div key={j.id} className="bg-[#151928] border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{j.name}</div>
                    <div className="text-[11px] text-neutral-400 truncate">{j.district} · +${j.pay}+</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSetWaypoint(j.x, j.z, j.name)}
                    className="px-2.5 py-1 rounded bg-amber-400 text-neutral-950 text-[11px] font-bold cursor-pointer shrink-0"
                  >
                    GPS
                  </button>
                </div>
              ))}

              <div className="text-[11px] font-semibold text-[#ff5a6e] uppercase tracking-wider pt-1">Story Heists</div>
              {missions.map((m) => (
                <div key={m.id} className="bg-[#151928] border border-white/10 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{m.title}</span>
                    <span className="text-[11px] font-mono-num text-emerald-400">+${m.rewardCash}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">{m.summary}</p>
                  <button
                    type="button"
                    onClick={() => onSelectMission(m.id)}
                    className="w-full py-1.5 rounded bg-[#ff5a6e] hover:bg-[#ff4259] text-white text-[11px] font-semibold cursor-pointer"
                  >
                    {m.stage === 'completed' ? 'Completed' : m.stage === 'active' ? 'Track Mission GPS' : 'Start Mission'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'social' && (
            <div className="space-y-2.5">
              {socialPosts.map((post) => (
                <div key={post.id} className="bg-[#151928] border border-white/10 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-white">{post.handle}</span>
                    <span className={post.isLive ? 'text-rose-400 font-semibold' : 'text-neutral-400'}>
                      {post.isLive ? `LIVE · ${post.viewers}` : post.timeAgo}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-snug">{post.caption}</p>
                  <button
                    type="button"
                    onClick={() => onSetWaypoint(post.x, post.z, `Viral: ${post.handle}`)}
                    className="w-full py-1 rounded bg-[#2dd4bf] text-neutral-950 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" /> Set GPS
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'duo' && (
            <div className="space-y-3">
              {/* Radio & Earphones Controls */}
              <div className="bg-[#151928] border border-purple-500/35 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-purple-400" /> {hud.radioStation}
                  </span>
                  <button
                    type="button"
                    onClick={onCycleRadio}
                    className="px-2 py-0.5 rounded bg-purple-500/25 text-purple-200 text-[10px] font-semibold cursor-pointer"
                  >
                    Switch FM{showHints ? ' [R]' : ''}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onToggleEarphones}
                  className={`w-full py-1.5 rounded text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    hud.earphonesOn ? 'bg-[#2dd4bf] text-neutral-950' : 'bg-white/10 text-neutral-300'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5" />{' '}
                  {hud.earphonesOn
                    ? `Earphones Active on Foot${showHints ? ' [V]' : ''}`
                    : `Put On Earphones${showHints ? ' [V]' : ''}`}
                </button>
              </div>

              {/* Survival Meds & Food */}
              <div className="bg-[#151928] border border-white/10 rounded-xl p-3 space-y-2">
                <div className="text-[11px] font-bold text-white">Survival Gear ({player.bleeding ? 'BLEEDING!' : 'Stable'})</div>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={onUseTraumaKit}
                    className="p-2 rounded bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-200 font-semibold flex flex-col items-center gap-0.5 cursor-pointer"
                  >
                    <HeartPulse className="w-3.5 h-3.5" /> Trauma ({player.traumaKits})
                  </button>
                  <button
                    type="button"
                    onClick={onUsePainkiller}
                    className="p-2 rounded bg-sky-500/20 hover:bg-sky-500/35 border border-sky-500/40 text-sky-200 font-semibold flex flex-col items-center gap-0.5 cursor-pointer"
                  >
                    <Pill className="w-3.5 h-3.5" /> Pills ({player.painkillers})
                  </button>
                  <button
                    type="button"
                    onClick={onEatBurger}
                    className="p-2 rounded bg-orange-500/20 hover:bg-orange-500/35 border border-orange-500/40 text-orange-200 font-semibold flex flex-col items-center gap-0.5 cursor-pointer"
                  >
                    <Utensils className="w-3.5 h-3.5" /> Burger ({player.burgers})
                  </button>
                </div>
              </div>

              <div className="bg-[#151928] border border-white/10 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Jason &amp; Lucia Bond</span>
                  <span className="text-xs font-mono-num text-rose-400 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-rose-400" /> {hud.relationship.meter}%
                  </span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ff5a6e]" style={{ width: `${hud.relationship.meter}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={onSwitchProtagonist}
                    className="py-1.5 rounded bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white cursor-pointer"
                  >
                    Switch Character
                  </button>
                  <button
                    type="button"
                    onClick={onTogglePartner}
                    className={`py-1.5 rounded text-[11px] font-semibold cursor-pointer ${
                      hud.relationship.duoActive ? 'bg-[#2dd4bf] text-neutral-950' : 'bg-white/10 text-white'
                    }`}
                  >
                    {hud.relationship.duoActive ? 'Send Home' : 'Call Duo'}
                  </button>
                </div>
              </div>

              <div className="bg-[#151928] border border-white/10 rounded-xl p-3 space-y-1.5 text-[11px]">
                <div className="font-semibold text-white flex items-center justify-between">
                  <span>{player.name} — Body &amp; Profile</span>
                  <span className="text-neutral-400">Beard {Math.round(player.beardLevel)}%</span>
                </div>
                <div>Muscle: {Math.round(player.stats.muscle)}/100 · Stamina: {Math.round(player.stats.stamina)}/100</div>
                <div>Focus: {Math.round(player.stats.focus)}/100 · {hud.profile.label}</div>
                <div className="pt-1 border-t border-white/10 flex items-center gap-1 text-[#2dd4bf]">
                  <Briefcase className="w-3 h-3" /> Grenades: {player.grenades} · Loot: ${player.duffelBag.lootValue}
                </div>
              </div>
            </div>
          )}

          {tab === 'gps' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={onOpenMap}
                className="w-full py-2.5 rounded-xl bg-[#2dd4bf] hover:bg-[#14b8a6] text-neutral-950 font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Compass className="w-4 h-4" /> Open Full 5-City Interactive Map{showHints ? ' [M]' : ''}
              </button>
              {[
                { name: "Jason's Villa (Home & Gym)", x: 210, z: 210 },
                { name: 'Burger Shot Diner (Work / Food)', x: 70, z: 210 },
                { name: 'Leonida Reserve Bank (ATM & Safe)', x: 210, z: 350 },
                { name: 'Central Park & Playground', x: -70, z: 350 },
                { name: 'Vice Roast Coffee Shop', x: 210, z: 105 },
                { name: 'Neon Anchor Beer Bar', x: -210, z: 210 },
                { name: 'Vice Armory Gun Shop', x: 70, z: 105 },
                { name: 'Vice Threads Boutique (Clothes)', x: -70, z: 105 },
                { name: 'Vice PD Central Precinct', x: -70, z: 210 },
                { name: 'Grand Leonida Highway Bridge', x: 0, z: 0 },
                { name: 'Northport Tactical Armory', x: -70, z: -210 },
                { name: 'Leonida Intl Airport (Planes/Heli)', x: -460, z: -380 },
                { name: 'Port Vice Marina (Boats)', x: 320, z: 350 },
                { name: 'Paradise Key Bungalow Island', x: 560, z: 230 },
              ].map((lm) => (
                <div key={lm.name} className="bg-[#151928] border border-white/10 rounded-lg p-2 flex items-center justify-between text-[11px]">
                  <span className="text-white flex items-center gap-1.5 truncate">
                    <MapPin className="w-3 h-3 text-[#ff5a6e] shrink-0" /> {lm.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSetWaypoint(lm.x, lm.z, lm.name)}
                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0"
                  >
                    GPS
                  </button>
                </div>
              ))}
              {activities.slice(0, 3).map((act) => (
                <div key={act.id} className="bg-[#151928] border border-white/10 rounded-lg p-2 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-300 flex items-center gap-1.5 truncate">
                    <Activity className="w-3 h-3 text-amber-400 shrink-0" /> {act.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onLaunchActivity(act.id)}
                    className="px-2 py-1 rounded bg-[#ff5a6e] text-white cursor-pointer shrink-0"
                  >
                    Play
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Phone Bottom Navigation Bar (Back / Home / Close) */}
        <div className="px-4 py-2 bg-[#121624] border-t border-white/10 flex items-center justify-around shrink-0">
          <button
            type="button"
            onClick={() => (tab !== 'messages' ? setTab('messages') : onClose())}
            className="px-3 py-1 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button
            type="button"
            onClick={() => setTab('messages')}
            className="px-4 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            aria-label="Home"
          >
            <Home className="w-3.5 h-3.5" /> Home
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg hover:bg-rose-500/20 text-rose-300 flex items-center gap-1 text-[11px] cursor-pointer"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" /> Exit
          </button>
        </div>
      </div>
    </div>
  );
};

