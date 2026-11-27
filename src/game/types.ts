export type ProtagonistId = 'jason' | 'lucia';

export type WeaponCategory = 'melee' | 'pistol' | 'smg' | 'shotgun' | 'rifle' | 'sniper' | 'heavy' | 'throwable';

export interface WeaponAttachments {
  suppressor: boolean;
  scope: boolean;
  extendedMag: boolean;
}

export interface WeaponItem {
  id: string;
  name: string;
  category: WeaponCategory;
  damage: number;
  fireRate: number;
  range: number;
  ammo: number;
  maxAmmo: number;
  silenced?: boolean;
  upgradeLevel?: number;
  condition: number;
  attachments: WeaponAttachments;
}

export type OutfitId = 'street' | 'suited' | 'beach' | 'tactical';
export type HairId = 'classic' | 'fade' | 'slick' | 'braids';
export type WeatherType = 'sunny' | 'sunset' | 'cloudy' | 'rain' | 'storm';
export type PartnerState = 'home' | 'coming' | 'following' | 'driving_to_player' | 'in_car';

export type GameLanguage = 'en' | 'hinglish';

export interface ControlSettings {
  touchControls: boolean;
  pcKeyHints: boolean;
  autoDetectedMobile: boolean;
  language: GameLanguage;
}

export interface NpcSubtitle {
  speaker: string;
  text: string;
  hostile?: boolean;
}

export type PlayerActionState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'crouch'
  | 'prone'
  | 'slide'
  | 'jump'
  | 'swim'
  | 'dive_water'
  | 'combat_aim'
  | 'reload'
  | 'melee'
  | 'dodge'
  | 'loot'
  | 'lockpick'
  | 'eat'
  | 'drink'
  | 'handover'
  | 'phone'
  | 'parachute'
  | 'knockdown'
  | 'gym'
  | 'cook'
  | 'mop'
  | 'highfive'
  | 'enter_vehicle'
  | 'sit_drive'
  | 'exit_vehicle';

export type VehicleSeat = 'driver' | 'passenger' | 'rear';

export interface ChatMessage {
  id: string;
  sender: 'jason' | 'lucia';
  text: string;
  time: string;
}

export interface ProtagonistStats {
  muscle: number;
  stamina: number;
  focus: number;
}

export interface ProtagonistState {
  id: ProtagonistId;
  name: string;
  role: string;
  health: number;
  maxHealth: number;
  armor: number;
  stamina: number;
  maxStamina: number;
  focusMeter: number;
  maxFocusMeter: number;
  stats: ProtagonistStats;
    weapons: WeaponItem[];
  ownedWeapons: string[];
  equippedWeaponId: string; // 'fists' or WeaponItem['id']
  pistols: WeaponItem[];
  longGun: WeaponItem | null;
  grenades: number;
  molotovs: number;
  rpgAmmo: number;
  traumaKits: number;
  painkillers: number;
  burgers: number;
  jerryCans: number;
  hasFlashlight: boolean;
  espressoBoostTimer: number;
  bleeding: boolean;
  painkillerTimer: number;
  equippedSlot: 'unarmed' | 'pistol0' | 'pistol1' | 'longgun';
  duffelBag: {
    hasKeyCloner: boolean;
    hasLockpick: boolean;
    hasMask: boolean;
    lootValue: number;
    spareWeapons: WeaponItem[];
  };
  outfit: OutfitId;
  hair: HairId;
  beardLevel: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  inWater: boolean;
  underwater: boolean;
  oxygen: number;
  isSitting: boolean;
  sittingSeatId: string | null;
  crouching: boolean;
  prone: boolean;
  inCover: boolean;
  parachuting: boolean;
  wearingBurgerUniform: boolean;
  helmetOn: boolean;
  umbrellaOpen: boolean;
  carryingBurgerBox: boolean;
  actionState: PlayerActionState;
}

export interface RelationshipState {
  meter: number;
  duoActive: boolean;
  partnerState: PartnerState;
  partnerInVehicleId: string | null;
  comboReady: boolean;
  lastEvent: string;
}

export interface CriminalProfile {
  stealthPoints: number;
  violencePoints: number;
  robberiesCompleted: number;
  carsBoosted: number;
  witnessesIntimidated: number;
  cctvWiped: number;
  label: 'Clean Operator' | 'Balanced Hustler' | 'Ruthless Enforcer';
}

export interface WantedState {
  stars: number;
  heat: number;
  evading: boolean;
  evadeProgress: number;
  witnessActive: boolean;
  witnessProgress: number;
  witnessPos: { x: number; z: number } | null;
  cctvRecorded: boolean;
  cctvBuildingId: string | null;
  disguiseNeeded: boolean;
}

export type VehicleTier =
  | 'classic'
  | 'sedan'
  | 'suv'
  | 'luxury'
  | 'police'
  | 'boat'
  | 'taxi'
  | 'muscle'
  | 'pickup'
  | 'truck'
  | 'bike'
  | 'sportbike'
  | 'scooty'
  | 'heli'
  | 'plane';

export type WheelStyle = 'stock' | 'sport' | 'gold' | 'offroad';

export interface VehicleState {
  id: string;
  name: string;
  tier: VehicleTier;
  fuelType: 'petrol' | 'ev' | 'aviation';
  fuel: number;
  maxFuel: number;
  health: number;
  maxHealth: number;
  speed: number;
  maxSpeed: number;
  hotwired: boolean;
  needsKeyCloner: boolean;
  gpsTrackerActive: boolean;
  gpsTimer: number;
  headlightsOn: boolean;
  leftBlinker: boolean;
  rightBlinker: boolean;
  windowsDown: boolean;
  trunkOpen: boolean;
  hoodOpen: boolean;
  convertibleOpen: boolean;
  roofIsConvertible: boolean;
  seat: VehicleSeat;
  ducking: boolean;
  wheelieActive: boolean;
  tireFlat: boolean;
  anchorDropped: boolean;
  flooded: boolean;
  submersionDepth: number;
  turboLevel: number;
  wheelStyle: WheelStyle;
  trunkWeapons: WeaponItem[];
  trunkLoot: number;
  trunkOutfits: OutfitId[];
  colorHex: string;
  nitroCharge?: number;
  nitroActive?: boolean;
  airspeed?: number;
  altitude?: number;
  pitch?: number;
  roll?: number;
}

export type BuildingArchStyle =
  | 'glass_tower'
  | 'art_deco'
  | 'suburban_house'
  | 'brick_shop'
  | 'market_stall'
  | 'cabin_warehouse';

export type InteriorKind =
  | 'mart'
  | 'gym'
  | 'bar'
  | 'coffee'
  | 'jewelry'
  | 'pawn'
  | 'safehouse'
  | 'bungalow'
  | 'mall'
  | 'bank'
  | 'barber'
  | 'clothes'
  | 'club'
  | 'diner'
  | 'burgershot'
  | 'boathouse'
  | 'precinct'
  | 'gunshop'
  | 'airport'
  | 'dealership'
  | 'market'
  | 'storefront';

export interface InteriorInfo {
  id: string;
  name: string;
  district: string;
  kind: InteriorKind;
  x: number;
  z: number;
  width: number;
  depth: number;
  hasRegister: boolean;
  robbedCooldown: number;
  hasCCTV: boolean;
  cctvWiped: boolean;
  hasATM: boolean;
  activityId?: string;
}

export interface SeatSpot {
  id: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  label: string;
  venue: 'home' | 'coffee' | 'bar' | 'park' | 'burger';
}

export interface SocialPost {
  id: string;
  handle: string;
  author: string;
  district: string;
  caption: string;
  isLive: boolean;
  viewers: number;
  likes: number;
  eventKind: 'takeover' | 'gator' | 'armored' | 'beachparty' | 'chase' | 'treasure';
  x: number;
  z: number;
  timeAgo: string;
  visited: boolean;
}

export interface ActivityDef {
  id: string;
  name: string;
  category: 'Sports' | 'Water & Wild' | 'Combat & Crime' | 'Nightlife & Chill';
  district: string;
  x: number;
  z: number;
  statReward: 'muscle' | 'stamina' | 'focus' | 'relationship' | 'cash';
  description: string;
  completedCount: number;
}

export interface JobDef {
  id: string;
  name: string;
  role: string;
  district: string;
  x: number;
  z: number;
  pay: number;
  description: string;
}

export type BurgerKitchenPhase = 'idle' | 'need_grill' | 'need_assemble' | 'need_serve';

export interface BurgerJobState {
  hired: boolean;
  clockedIn: boolean;
  role: 'none' | 'kitchen' | 'delivery';
  kitchenPhase: BurgerKitchenPhase;
  grillProgress: number; // 0..100 while holding E at grill
  shiftsCompleted: number;
  isShiftManager: boolean;
  banned: boolean;
  pendingPay: number;
  activeDelivery: {
    targetX: number;
    targetZ: number;
    customerName: string;
    timer: number;
    reward: number;
    parkedNearTarget: boolean;
  } | null;
}

export interface StockAsset {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  sharesOwned: number;
}

export interface BusinessProperty {
  id: string;
  name: string;
  kind: 'carwash' | 'nightclub' | 'safehouse' | 'penthouse' | 'bungalow';
  district: string;
  x: number;
  z: number;
  cost: number;
  owned: boolean;
  dailyIncome: number;
}

export interface DarkWebDrop {
  id: string;
  label: string;
  itemKey: 'keycloner' | 'armor' | 'silenced9' | 'carbine' | 'grenades' | 'traumakit' | 'cleaningkit';
  x: number;
  z: number;
}

export type ActiveModalType =
  | null
  | 'phone'
  | 'map'
  | 'minigame'
  | 'npc'
  | 'partner'
  | 'hotwire'
  | 'robbery'
  | 'cctv'
  | 'trunk'
  | 'wardrobe'
  | 'clothes'
  | 'bungalow'
  | 'gunshop'
  | 'dealership'
  | 'cafe'
  | 'market'
  | 'job'
  | 'burgerjob'
  | 'bank'
  | 'wheel'
  | 'pause';

export interface NpcInteractionContext {
  npcId: string;
  name: string;
  archetype: string;
  reaction: string;
  isWitness: boolean;
  hostile: boolean;
  mood: number;
}

export type MinimapEntityKind =
  | 'police'
  | 'partner'
  | 'vehicle'
  | 'mission'
  | 'activity'
  | 'social'
  | 'fence'
  | 'gas'
  | 'park'
  | 'home'
  | 'bungalow'
  | 'clothes'
  | 'coffee'
  | 'bar'
  | 'gunshop'
  | 'dealership'
  | 'market'
  | 'precinct'
  | 'airport'
  | 'gym'
  | 'job'
  | 'boat'
  | 'burgershot'
  | 'taxistand'
  | 'bank'
  | 'drop';

export interface MinimapEntity {
  x: number;
  z: number;
  kind: MinimapEntityKind;
  label?: string;
}

export interface MissionDef {
  id: string;
  title: string;
  giver: string;
  district: string;
  summary: string;
  duoRecommended: boolean;
  targetX: number;
  targetZ: number;
  rewardCash: number;
  rewardBond: number;
  stage: 'available' | 'active' | 'completed';
  objectiveText: string;
}

export interface TaxiRideState {
  status: 'idle' | 'en_route_pickup' | 'waiting_board' | 'driving_to_dest' | 'payment_due';
  destLabel: string;
  destX: number;
  destZ: number;
  fare: number;
  upiId: string;
  qrSeed: number;
}

export interface FlightCutsceneState {
  active: boolean;
  fromName: string;
  toName: string;
  progress: number;
}

export interface HudSnapshot {
  screen: 'title' | 'playing' | 'wasted' | 'busted';
  activeId: ProtagonistId;
  protagonists: Record<ProtagonistId, ProtagonistState>;
  cash: number;
  bankBalance: number;
  clout: number;
  relationship: RelationshipState;
  profile: CriminalProfile;
  wanted: WantedState;
  drivingVehicle: VehicleState | null;
  nearbyVehicle: VehicleState | null;
  nearbyTrunkVehicle: VehicleState | null;
  currentDistrict: string;
  currentInterior: InteriorInfo | null;
  currentSeat: SeatSpot | null;
  timeOfDayLabel: string;
  timeNormalized: number;
  isNight: boolean;
  weather: WeatherType;
  weatherLabel: string;
  slowMoActive: boolean;
  aiming: boolean;
  contextPrompt: string | null;
  contextAction: string | null;
  contextKind:
    | 'door'
    | 'shop'
    | 'npc'
    | 'activity'
    | 'seat'
    | 'fuel'
    | 'airport_ticket'
    | 'taxi_stand'
    | 'rob_cashier'
    | 'take_cash_bag'
    | 'deliver_burger'
    | 'eat_burger'
    | null;
  robberyHud: {
    stage: 'none' | 'intimidated' | 'packing' | 'bag_ready';
    cashierName: string;
    amount: number;
    interiorId: string | null;
  };
  waypoint: { x: number; z: number; label: string } | null;
  gpsRoute: Array<{ x: number; z: number }>;
  activeMission: MissionDef | null;
  minimapEntities: MinimapEntity[];
  toastMessage: string | null;
  npcSubtitle: NpcSubtitle | null;
  controlSettings: ControlSettings;
  muted: boolean;
  radioStation: 'Off' | 'Vice Wave FM' | 'Calle 8 Latin' | 'Leonida Talk Podcast';
  earphonesOn: boolean;
  burgerJob: BurgerJobState;
  stocks: StockAsset[];
  businesses: BusinessProperty[];
  darkWebDrop: DarkWebDrop | null;
  taxiRide: TaxiRideState;
  flightCutscene: FlightCutsceneState | null;
  canEatAtBurgerShop: boolean;
  canInvitePartnerSit: boolean;
  totalBuildingsCount: number;
  totalInteriorsCount: number;
  underwaterTreasureFound: number;
  messages: ChatMessage[];
}
