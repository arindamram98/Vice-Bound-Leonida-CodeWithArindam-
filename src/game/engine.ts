import * as THREE from 'three';
import { animateNpcRig, animateProtagonistRig, animateVehicleRig, animateWildlifeRig } from './animations';
import { RadioStationId, viceAudio } from './audio';
import {
  createEnvironmentLightingRig,
  createPostProcessingPipeline,
  PostProcessingRig,
  resolveSpringArmCameraPosition,
} from './graphics';
import {
  applyCharacterAppearance,
  CharacterRig,
  createBillboardMesh,
  createBurgerShotInteriorGroup,
  createBusStopMesh,
  createCashPickupMesh,
  createCharacterRig,
  createDeadDropCrateMesh,
  createJasonVillaFurnitureGroup,
  createLuxuryBungalowMesh,
  createOverWaterBridgeMesh,
  createParkBench,
  createParkFountain,
  createPlaygroundSet,
  createRoadSign,
  createStreetStall,
  createTrafficLightRig,
  createVehicleRig,
  createWildlifeRig,
  createWoodenDockMesh,
  TrafficLightRig,
  VehicleRig,
  WildlifeRig,
} from './models';
import { computeBoatBuoyancyPose, resolveVehicleOBBCollision, RigidBodyVehicleInput } from './physics';
import { createProceduralTextures, ProceduralTextureSet } from './textures';
import {
  ActiveModalType,
  ActivityDef,
  BurgerJobState,
  BusinessProperty,
  ChatMessage,
  ControlSettings,
  CriminalProfile,
  DarkWebDrop,
  HairId,
  HudSnapshot,
  InteriorInfo,
  JobDef,
  MinimapEntity,
  MissionDef,
  NpcInteractionContext,
  NpcSubtitle,
  OutfitId,
  ProtagonistId,
  ProtagonistState,
  RelationshipState,
  SeatSpot,
  SocialPost,
  StockAsset,
  VehicleState,
  VehicleTier,
  WantedState,
  WeaponItem,
  WeatherType,
} from './types';
import { createAnimatedOceanWater, getWaterWaveHeight, OceanWaterSystem } from './water';
import {
  AIRPORT_ZONE,
  BRIDGES,
  BuildingFootprint,
  CENTRAL_PARK,
  CircleCollider,
  CITY_JOBS,
  computeGpsRoute,
  DELIVERY_TARGETS,
  FENCE_SPOTS,
  GAS_STATIONS,
  generateViceCityWorld,
  getBridgeDeckInfo,
  getDistrictAt,
  getTerrainHeightAt,
  INITIAL_BUSINESSES,
  INITIAL_MISSIONS,
  INITIAL_SOCIAL_POSTS,
  INITIAL_STOCKS,
  isWaterChannel,
  LAND_Y,
  NORTH_ISLAND,
  ROAD_SEGMENTS,
  ROAD_X,
  ROAD_Y,
  ROAD_Z,
  SAFEHOUSE_ISLANDS,
  SEAT_SPOTS,
  SIDE_ACTIVITIES,
  SOUTH_ISLAND,
  STREET_STALLS,
  TreasureSpot,
  WeakTreeSpot,
  WOODEN_DOCKS,
} from './worldData';

// Pre-allocated scratch math objects (zero GC in 60fps loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _color = new THREE.Color();

interface WorldVehicle {
  state: VehicleState;
  rig: VehicleRig;
  x: number;
  y: number;
  z: number;
  yaw: number;
  vy: number;
  vx: number;
  vz: number;
  angVel: number;
  steerAngle: number;
  wheelSpin: number;
  isTraffic: boolean;
  isPoliceSpawn: boolean;
  isPrecinctUnit: boolean;
  trafficDir: number;
  trafficAxis: 'z' | 'x';
  driverPresent: boolean;
  hijackedByNpc?: WorldNPC | null;
  leftDoorAngle: number;
  rightDoorAngle: number;
  leftDoorTimer: number;
  rightDoorTimer: number;
}

interface WildlifeEntry {
  id: string;
  species: 'gator' | 'shark' | 'dolphin';
  rig: WildlifeRig;
  x: number;
  y: number;
  z: number;
  yaw: number;
  baseX: number;
  baseZ: number;
  phase: number;
}

interface WorldNPC {
  id: string;
  name: string;
  archetype: string;
  rig: CharacterRig;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  tumbleAngle: number;
  yaw: number;
  speed: number;
  walkPhase: number;
  kind: 'civilian' | 'police' | 'swat' | 'cashier' | 'child' | 'brawler' | 'gang';
  gangFaction?: 'royals' | 'skulls';
  chatterCooldown?: number;
  hp: number;
  alive: boolean;
  hostile: boolean;
  armed: boolean;
  fleeing: boolean;
  isWitness: boolean;
  witnessTimer: number;
  mood: number;
  patrolCenterX: number;
  patrolCenterZ: number;
  wanderTimer: number;
  fireCooldown: number;
  meleeCooldown: number;
  targetProtagonist: ProtagonistId;
  targetNpc: WorldNPC | null;
  interiorId?: string;
  boardingCar?: WorldVehicle | null;
  drivingCar?: WorldVehicle | null;
}

interface FirePool {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  life: number;
}

interface RocketProjectile {
  mesh: THREE.Group;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

interface TrafficSignalCtrl {
  x: number;
  z: number;
  axis: 'ns' | 'ew';
  rig: TrafficLightRig;
}

interface CashPickup {
  id: string;
  mesh: THREE.Group;
  x: number;
  z: number;
  amount: number;
  life: number;
}

interface GrenadeProjectile {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  fuse: number;
}

interface ExplosionFlash {
  mesh: THREE.Mesh;
  life: number;
}

interface BulletTracer {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  fromPlayer: boolean;
  damage: number;
}

interface DynamicBuildingMesh {
  footprint: BuildingFootprint;
  shellGroup: THREE.Group;
  roofMesh: THREE.Mesh;
  frontWall: THREE.Mesh;
  interiorGroup: THREE.Group | null;
}

interface TreeMeshEntry {
  data: WeakTreeSpot;
  group: THREE.Group;
}

interface BoardingSequence {
  vehicle: WorldVehicle;
  timer: number;
  isPartner: boolean;
}

interface PlayerBoardingSequence {
  vehicle: WorldVehicle;
  timer: number;
  duration: number;
  startX: number;
  startY: number;
  startZ: number;
  startYaw: number;
}

interface ExitingSequence {
  vehicle: WorldVehicle;
  timer: number;
  duration: number;
  startX: number;
  startY: number;
  startZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  startYaw: number;
}

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onOpenModal: (modal: ActiveModalType, payload?: unknown) => void;
}

const WEAPON_CATALOG: Record<string, WeaponItem> = {
  bat: {
    id: 'bat',
    name: 'Baseball Bat',
    category: 'melee',
    damage: 45,
    fireRate: 0.42,
    range: 2.65,
    ammo: 0,
    maxAmmo: 0,
    upgradeLevel: 0,
    condition: 100,
    attachments: { suppressor: false, scope: false, extendedMag: false },
  },
  pistol9: {
    id: 'pistol9',
    name: '9mm Pistol',
    category: 'pistol',
    damage: 28,
    fireRate: 0.24,
    range: 48,
    ammo: 15,
    maxAmmo: 15,
    silenced: false,
    upgradeLevel: 0,
    condition: 100,
    attachments: { suppressor: false, scope: false, extendedMag: false },
  },
  silenced9: {
    id: 'silenced9',
    name: 'Suppressed .45',
    category: 'pistol',
    damage: 34,
    fireRate: 0.26,
    range: 52,
    ammo: 12,
    maxAmmo: 12,
    silenced: true,
    upgradeLevel: 0,
    condition: 100,
    attachments: { suppressor: true, scope: false, extendedMag: false },
  },
  deagle: {
    id: 'deagle',
    name: 'Vice .50 Heavy Pistol',
    category: 'pistol',
    damage: 55,
    fireRate: 0.36,
    range: 55,
    ammo: 9,
    maxAmmo: 9,
    silenced: false,
    upgradeLevel: 0,
    condition: 100,
    attachments: { suppressor: false, scope: false, extendedMag: false },
  },
  smg: {
    id: 'smg',
    name: 'Micro SMG',
    category: 'smg',
    damage: 26,
    fireRate: 0.085,
    range: 56,
    ammo: 32,
    maxAmmo: 32,
    upgradeLevel: 0,
    condition: 100,
    attachments: { suppressor: false, scope: false, extendedMag: false },
  },
  shotgun: {
    id: 'shotgun',
    name: 'Pump Shotgun',
    category: 'shotgun',
    damage: 85,
    fireRate: 0.65,
    range: 30,
    ammo: 8,
    maxAmmo: 8,
    upgradeLevel: 0,
    condition: 100,
    attachments: { suppressor: false, scope: false, extendedMag: false },
  },
  carbine: {
    id: 'carbine',
    name: 'Assault Rifle',
    category: 'rifle',
    damage: 44,
    fireRate: 0.115,
    range: 84,
    ammo: 30,
    maxAmmo: 30,
    upgradeLevel: 0,
    condition: 100,
    attachments: { suppressor: false, scope: false, extendedMag: false },
  },
  sniper: {
    id: 'sniper',
    name: 'Sniper Rifle',
    category: 'sniper',
    damage: 118,
    fireRate: 0.88,
    range: 165,
    ammo: 6,
    maxAmmo: 6,
    upgradeLevel: 0,
    condition: 100,
    attachments: { suppressor: false, scope: true, extendedMag: false },
  },
  rpg: {
    id: 'rpg',
    name: 'RPG Launcher',
    category: 'heavy',
    damage: 210,
    fireRate: 1.25,
    range: 115,
    ammo: 1,
    maxAmmo: 1,
    upgradeLevel: 0,
    condition: 100,
    attachments: { suppressor: false, scope: false, extendedMag: false },
  },
};

function cloneWeapon(w: WeaponItem): WeaponItem {
  return { ...w, attachments: { ...w.attachments } };
}

const WEATHER_ORDER: WeatherType[] = ['sunny', 'sunset', 'cloudy', 'rain', 'storm'];
const WEATHER_LABELS: Record<WeatherType, string> = {
  sunny: 'Tropical Clear',
  sunset: 'Vice Golden Hour',
  cloudy: 'Overcast Breeze',
  rain: 'Tropical Rain',
  storm: 'Leonida Thunderstorm',
};

export class ViceCityEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private textures!: ProceduralTextureSet;
  private isSoftwareGl = false;

  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private envSky!: { sky: THREE.Mesh; skyUniforms: Record<string, THREE.IUniform> };
  private postProcessing!: PostProcessingRig;
  private roadMat!: THREE.MeshStandardMaterial;
  private oceanWater!: OceanWaterSystem;
  private cloudGroup!: THREE.Group;
  private waypointBeam!: THREE.Group;
  private parkCarousel: THREE.Group | null = null;
  private rainLines!: THREE.LineSegments;
  private rainPositions!: Float32Array;

  private frameId = 0;
  private disposed = false;
  private lastTime = performance.now();
  private elapsedSec = 0;
  private hudSyncTimer = 0;

  // Game State
  private screen: 'title' | 'playing' | 'wasted' | 'busted' = 'title';
  private activeModal: ActiveModalType = null;
  private activeId: ProtagonistId = 'jason';
  private cash = 3200;
  private bankBalance = 1400;
  private clout = 250;
  private radioStation: RadioStationId = 'Vice Wave FM';
  private earphonesOn = false;
  private timeNormalized = 0.66;
  private weatherIndex = 0;
  private weatherTimer = 0;
  private lightningFlash = 0;
  private slowMoActive = false;
  private aiming = false;
  private hitstopTimer = 0;
  private cameraShake = 0;
  private actionTimer = 0;
  private stockTimer = 18;
  private muggerCooldown = 25;
  private toastMessage: string | null = null;
  private toastTimer = 0;

  private protagonists!: Record<ProtagonistId, ProtagonistState>;
  private protagonistRigs!: Record<ProtagonistId, CharacterRig>;
  private relationship: RelationshipState = {
    meter: 65,
    duoActive: false,
    partnerState: 'home',
    partnerInVehicleId: null,
    comboReady: true,
    lastEvent: "At Jason's Villa — Talk to Lucia or message her on your Phone!",
  };
  private messages: ChatMessage[] = [
    { id: 'msg_1', sender: 'lucia', text: "I'm chilling on the living room sofa at our Villa. Text or call me anytime!", time: 'Just now' },
  ];
  private profile: CriminalProfile = {
    stealthPoints: 10,
    violencePoints: 5,
    robberiesCompleted: 0,
    carsBoosted: 0,
    witnessesIntimidated: 0,
    cctvWiped: 0,
    label: 'Balanced Hustler',
  };
  private wanted: WantedState = {
    stars: 0,
    heat: 0,
    evading: false,
    evadeProgress: 0,
    witnessActive: false,
    witnessProgress: 0,
    witnessPos: null,
    cctvRecorded: false,
    cctvBuildingId: null,
    disguiseNeeded: false,
  };

  private worldBuildings: BuildingFootprint[] = [];
  private worldInteriors: InteriorInfo[] = [];
  private dynamicInteriors: DynamicBuildingMesh[] = [];
  private propColliders: CircleCollider[] = [];
  private weakTreeEntries: TreeMeshEntry[] = [];
  private treasures: TreasureSpot[] = [];
  private treasureMeshes: Map<string, THREE.Mesh> = new Map();
  private underwaterTreasureFound = 0;

  private vehicles: WorldVehicle[] = [];
  private drivingVehicle: WorldVehicle | null = null;
  private nearbyTrunkVehicle: WorldVehicle | null = null;
  private boardingSeq: PlayerBoardingSequence | null = null;
  private exitingSeq: ExitingSequence | null = null;
  private partnerBoardingSeq: BoardingSequence | null = null;
  private partnerDrivingVehicle: WorldVehicle | null = null;
  private partnerRoute: Array<{ x: number; z: number }> = [];
  private partnerRouteIdx = 0;
  private currentStormFactor = 0;
  private fountainWaterMat: THREE.ShaderMaterial | null = null;
  private bungalowWaterMats: THREE.ShaderMaterial[] = [];
  private trafficSignals: TrafficSignalCtrl[] = [];
  private trafficCycleTimer = 0;
  private trafficNsGreen = true;
  private trafficYellowPhase = false;
  private npcs: WorldNPC[] = [];
  private wildlifeEntries: WildlifeEntry[] = [];
  private cashPickups: CashPickup[] = [];
  private grenades: Array<GrenadeProjectile & { isMolotov?: boolean }> = [];
  private firePools: FirePool[] = [];
  private rockets: RocketProjectile[] = [];
  private explosions: ExplosionFlash[] = [];
  private tracers: BulletTracer[] = [];
  private activities: ActivityDef[] = SIDE_ACTIVITIES.map((a) => ({ ...a }));
  private socialPosts: SocialPost[] = INITIAL_SOCIAL_POSTS.map((p) => ({ ...p }));
  private missions: MissionDef[] = INITIAL_MISSIONS.map((m) => ({ ...m }));
  private stocks: StockAsset[] = INITIAL_STOCKS.map((s) => ({ ...s }));
  private businesses: BusinessProperty[] = INITIAL_BUSINESSES.map((b) => ({ ...b }));
  private darkWebDrop: DarkWebDrop | null = null;
  private darkWebDropMesh: THREE.Group | null = null;
  private burgerJob: BurgerJobState = {
    hired: false,
    clockedIn: false,
    role: 'none',
    kitchenPhase: 'idle',
    grillProgress: 0,
    shiftsCompleted: 0,
    isShiftManager: false,
    banned: false,
    pendingPay: 0,
    activeDelivery: null,
  };
  private activeMissionId: string | null = 'mis_1';
  private waypoint: { x: number; z: number; label: string } | null = {
    x: INITIAL_MISSIONS[0].targetX,
    z: INITIAL_MISSIONS[0].targetZ,
    label: INITIAL_MISSIONS[0].title,
  };

  // Input, Touch, Camera & NPC Stare/Subtitle state
  private keys: Record<string, boolean> = {};
  private touchMoveX = 0;
  private touchMoveZ = 0;
  private touchSprinting = false;
  private controlSettings: ControlSettings = (() => {
    const isTouchCapable =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 860);
    return {
      touchControls: isTouchCapable,
      pcKeyHints: !isTouchCapable,
      autoDetectedMobile: isTouchCapable,
    };
  })();
  private stareTargetId: string | null = null;
  private stareTimer = 0;
  private stareWarned = false;
  private npcSubtitle: NpcSubtitle | null = null;
  private npcSubtitleTimer = 0;
  private npcChatterCooldown = 4;

  private camYaw = Math.PI;
  private camPitch = 0.24;
  private camCurrentPos = new THREE.Vector3(212, 9.5, 224);
  private camCurrentLook = new THREE.Vector3(206, LAND_Y + 1.5, 213);
  private playerVy = 0;
  private onGround = true;
  private walkPhase = 0;
  private attackSwingTimer = 0;
  private fireCooldown = 0;
  private blinkerTimer = 0;
  private blinkerBlinkState = false;
  private policeSpawnTimer = 0;
  private randomBrawlTimer = 6;
  private lastAttackerForJason: WorldNPC | null = null;
  private lastAttackerForLucia: WorldNPC | null = null;

  private currentInterior: InteriorInfo | null = null;
  private currentSeat: SeatSpot | null = null;
  private contextPrompt: string | null = null;
  private contextAction: (() => void) | null = null;
  private contextActionLabel: string | null = null;

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.initProtagonists();
    this.initThree();
    this.buildWorld();
    this.bindEvents();
    this.pushHud();
    this.startLoop();
  }

  private initProtagonists() {
    // Both Jason & Lucia start with FISTS ONLY! Earn cash & visit Armory for Bat -> Pistol -> SMG -> Shotgun -> Rifle -> Sniper -> Grenade/Molotov/RPG.
    this.protagonists = {
      jason: {
        id: 'jason',
        name: 'Jason Duval',
        role: 'Wheelman & Tactician',
        health: 100,
        maxHealth: 100,
        armor: 25,
        stamina: 100,
        maxStamina: 100,
        focusMeter: 100,
        maxFocusMeter: 100,
        stats: { muscle: 45, stamina: 50, focus: 50 },
        weapons: [],
        equippedWeaponId: 'fists',
        pistols: [],
        longGun: null,
        grenades: 0,
        molotovs: 0,
        rpgAmmo: 0,
        traumaKits: 1,
        painkillers: 1,
        burgers: 1,
        jerryCans: 1,
        hasFlashlight: true,
        espressoBoostTimer: 0,
        carryingBurgerBox: false,
        bleeding: false,
        painkillerTimer: 0,
        equippedSlot: 'unarmed',
        duffelBag: {
          hasKeyCloner: false,
          hasLockpick: true,
          hasMask: true,
          lootValue: 0,
          spareWeapons: [],
        },
        outfit: 'street',
        hair: 'classic',
        beardLevel: 25,
        x: 206.5,
        y: LAND_Y,
        z: 213.5,
        yaw: Math.PI,
        inWater: false,
        underwater: false,
        oxygen: 100,
        isSitting: false,
        sittingSeatId: null,
        crouching: false,
        prone: false,
        inCover: false,
        parachuting: false,
        wearingBurgerUniform: false,
        helmetOn: false,
        umbrellaOpen: false,
        actionState: 'idle',
      },
      lucia: {
        id: 'lucia',
        name: 'Lucia Caminos',
        role: 'Heist Lead & Infiltrator',
        health: 100,
        maxHealth: 100,
        armor: 25,
        stamina: 100,
        maxStamina: 100,
        focusMeter: 100,
        maxFocusMeter: 100,
        stats: { muscle: 38, stamina: 58, focus: 58 },
        weapons: [],
        equippedWeaponId: 'fists',
        pistols: [],
        longGun: null,
        grenades: 0,
        molotovs: 0,
        rpgAmmo: 0,
        traumaKits: 1,
        painkillers: 1,
        burgers: 1,
        jerryCans: 1,
        hasFlashlight: true,
        espressoBoostTimer: 0,
        carryingBurgerBox: false,
        bleeding: false,
        painkillerTimer: 0,
        equippedSlot: 'unarmed',
        duffelBag: {
          hasKeyCloner: false,
          hasLockpick: true,
          hasMask: true,
          lootValue: 0,
          spareWeapons: [],
        },
        outfit: 'street',
        hair: 'classic',
        beardLevel: 0,
        x: 204.0,
        y: LAND_Y + 0.46,
        z: 207.5,
        yaw: 0,
        inWater: false,
        underwater: false,
        oxygen: 100,
        isSitting: true,
        sittingSeatId: 'seat_home_sofa2',
        crouching: false,
        prone: false,
        inCover: false,
        parachuting: false,
        wearingBurgerUniform: false,
        helmetOn: false,
        umbrellaOpen: false,
        actionState: 'idle',
      },
    };
  }

  private initThree() {
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && !this.controlSettings.autoDetectedMobile,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.56;
    const maxPr = this.controlSettings.autoDetectedMobile ? 1.5 : 2;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, maxPr));
    this.renderer.setSize(this.container.clientWidth || window.innerWidth, this.container.clientHeight || window.innerHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x5299d8);
    this.scene.fog = new THREE.FogExp2(0x8bc0ea, 0.00075);

    this.envSky = createEnvironmentLightingRig(this.renderer, this.scene);

    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(62, w / h, 0.25, 1450);

    this.hemiLight = new THREE.HemisphereLight(0x7cc4f8, 0x3b2d24, 0.34);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffead2, 1.05);
    this.sunLight.position.set(280, 95, -90);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(this.isSoftwareGl ? 512 : 2048, this.isSoftwareGl ? 512 : 2048);
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 280;
    const d = 75;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.postProcessing = createPostProcessingPipeline(
      this.renderer,
      this.scene,
      this.camera,
      w,
      h,
      this.isSoftwareGl
    );

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso);

    // 3D Volumetric-Style Sky Clouds
    this.cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xdbeafe,
      roughness: 1.0,
      transparent: true,
      opacity: 0.56,
    });
    const puffGeo = new THREE.SphereGeometry(1, 10, 8);
    for (let i = 0; i < 42; i++) {
      const cluster = new THREE.Group();
      const cx = ((i * 197) % 1200) - 650;
      const cy = 110 + (i % 5) * 16;
      const cz = ((i * 263) % 1000) - 500;
      cluster.position.set(cx, cy, cz);
      for (let p = 0; p < 3; p++) {
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set((p - 1) * 11, (p === 1 ? 3 : 0), (p % 2) * 4);
        puff.scale.set(16 + (i % 4) * 3, 7 + (p === 1 ? 3 : 0), 12);
        cluster.add(puff);
      }
      this.cloudGroup.add(cluster);
    }
    this.scene.add(this.cloudGroup);

    // Pooled 3D Rain Streaks
    const dropCount = 700;
    this.rainPositions = new Float32Array(dropCount * 6);
    for (let i = 0; i < dropCount; i++) {
      const rx = (Math.random() - 0.5) * 85;
      const ry = Math.random() * 34;
      const rz = (Math.random() - 0.5) * 85;
      this.rainPositions[i * 6] = rx;
      this.rainPositions[i * 6 + 1] = ry;
      this.rainPositions[i * 6 + 2] = rz;
      this.rainPositions[i * 6 + 3] = rx - 0.15;
      this.rainPositions[i * 6 + 4] = ry - 1.3;
      this.rainPositions[i * 6 + 5] = rz;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    const rainMat = new THREE.LineBasicMaterial({ color: 0xcbe7ff, transparent: true, opacity: 0.45 });
    this.rainLines = new THREE.LineSegments(rainGeo, rainMat);
    this.rainLines.visible = false;
    this.rainLines.frustumCulled = false;
    this.scene.add(this.rainLines);
  }

  private buildWorld() {
    // 1. Two Distinct Cities (Vice Downtown + Northport), Airport Wing, Ocean Channel (y=0.0) & 2 Tropical Safehouse Islands
    const sidewalkMat = new THREE.MeshStandardMaterial({ map: this.textures.sidewalk, roughness: 0.85, metalness: 0.05 });
    const sandMat = new THREE.MeshStandardMaterial({ map: this.textures.sand, color: 0xe6d7b9, roughness: 0.92, metalness: 0.02 });
    const grassMat = new THREE.MeshStandardMaterial({ map: this.textures.grass, roughness: 0.92, metalness: 0.02 });

    // South Island: Vice Downtown (top face strictly at LAND_Y = 0.4, vertical seawall sides into deep water)
    const southLand = new THREE.Mesh(new THREE.BoxGeometry(SOUTH_ISLAND.hx * 2, 1.4, SOUTH_ISLAND.hz * 2), sidewalkMat);
    southLand.position.set(SOUTH_ISLAND.cx, LAND_Y - 0.7, SOUTH_ISLAND.cz);
    southLand.receiveShadow = true;
    this.scene.add(southLand);

    const southBeach = new THREE.Mesh(new THREE.BoxGeometry(34, 1.38, SOUTH_ISLAND.hz * 2 - 4), sandMat);
    southBeach.position.set(355, LAND_Y - 0.695, SOUTH_ISLAND.cz);
    southBeach.receiveShadow = true;
    this.scene.add(southBeach);

    // North Island: Northport (top face at LAND_Y = 0.4)
    const northLand = new THREE.Mesh(new THREE.BoxGeometry(NORTH_ISLAND.hx * 2, 1.4, NORTH_ISLAND.hz * 2), sidewalkMat);
    northLand.position.set(NORTH_ISLAND.cx, LAND_Y - 0.7, NORTH_ISLAND.cz);
    northLand.receiveShadow = true;
    this.scene.add(northLand);

    const northWoodsGrass = new THREE.Mesh(new THREE.PlaneGeometry(NORTH_ISLAND.hx * 2 - 6, 108), grassMat);
    northWoodsGrass.rotation.x = -Math.PI / 2;
    northWoodsGrass.position.set(NORTH_ISLAND.cx, LAND_Y + 0.006, -486);
    northWoodsGrass.receiveShadow = true;
    this.scene.add(northWoodsGrass);

    // Leonida International Airport Wing (-560..-320, -520..-250)
    const airportSlab = new THREE.Mesh(new THREE.BoxGeometry(240, 1.4, 270), sidewalkMat);
    airportSlab.position.set(-440, LAND_Y - 0.7, -385);
    airportSlab.receiveShadow = true;
    this.scene.add(airportSlab);

    // 2 Distant Safehouse Islands (Paradise Key & Starlight Atoll) with beaches, gardens & Luxury Bungalows
    for (const isl of SAFEHOUSE_ISLANDS) {
      const sandIsland = new THREE.Mesh(new THREE.CylinderGeometry(isl.halfSize, isl.halfSize + 10, 1.4, 24), sandMat);
      sandIsland.position.set(isl.cx, LAND_Y - 0.7, isl.cz);
      sandIsland.receiveShadow = true;
      const lawnPatch = new THREE.Mesh(new THREE.CylinderGeometry(isl.halfSize - 18, isl.halfSize - 18, 0.04, 20), grassMat);
      lawnPatch.position.set(isl.cx, LAND_Y + 0.015, isl.cz);
      lawnPatch.receiveShadow = true;
      const bungalow = createLuxuryBungalowMesh(isl.accentColor);
      bungalow.position.set(isl.bungalowX, LAND_Y, isl.bungalowZ);
      if (bungalow.userData.waterMaterial) {
        this.bungalowWaterMats.push(bungalow.userData.waterMaterial as THREE.ShaderMaterial);
      }
      this.scene.add(sandIsland, lawnPatch, bungalow);
    }

    // Underwater Seabed & Animated GLSL Ocean Plane strictly at y = 0.0!
    const seabed = new THREE.Mesh(
      new THREE.PlaneGeometry(1800, 1600),
      new THREE.MeshStandardMaterial({ color: 0x5c5340, roughness: 0.95 })
    );
    seabed.rotation.x = -Math.PI / 2;
    seabed.position.set(120, -3.4, 0);
    this.scene.add(seabed);

    this.oceanWater = createAnimatedOceanWater(this.textures.waterNormal);
    this.scene.add(this.oceanWater.mesh);

    // 2. Segmented Asphalt Streets & Highways strictly at ROAD_Y = 0.43 (never bleeding with water at y=0)
    this.roadMat = new THREE.MeshStandardMaterial({
      map: this.textures.asphalt,
      normalMap: this.textures.asphaltNormal,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: this.textures.asphaltRoughness,
      roughness: 0.76,
      metalness: 0.08,
    });
    const highwayMat = new THREE.MeshStandardMaterial({
      map: this.textures.highway,
      normalMap: this.textures.asphaltNormal,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughnessMap: this.textures.asphaltRoughness,
      roughness: 0.72,
      metalness: 0.1,
    });

    for (const seg of ROAD_SEGMENTS) {
      const dx = seg.x2 - seg.x1;
      const dz = seg.z2 - seg.z1;
      const len = Math.hypot(dx, dz);
      const isEw = Math.abs(dx) > Math.abs(dz);
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(seg.width, len),
        seg.isHighway ? highwayMat : this.roadMat
      );
      mesh.rotation.x = -Math.PI / 2;
      if (isEw) mesh.rotation.z = Math.PI / 2;
      mesh.position.set((seg.x1 + seg.x2) / 2, isEw ? ROAD_Y + 0.005 : ROAD_Y, (seg.z1 + seg.z2) / 2);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }

    // Zebra Crosswalks at key intersections (Instanced)
    const cwGeo = new THREE.PlaneGeometry(13, 3.2);
    const cwMat = new THREE.MeshStandardMaterial({
      map: this.textures.crosswalk,
      transparent: true,
      roughness: 0.82,
      depthWrite: false,
    });
    const cwPositions: Array<[number, number, number]> = [];
    for (const rx of [-140, 0, 140]) {
      for (const rz of [-280, -140, 140, 280]) {
        cwPositions.push([rx, rz + 10.5, 0], [rx, rz - 10.5, 0], [rx + 10.5, rz, Math.PI / 2], [rx - 10.5, rz, Math.PI / 2]);
      }
    }
    const instCrosswalks = new THREE.InstancedMesh(cwGeo, cwMat, cwPositions.length);
    cwPositions.forEach(([cx, cz, rotY], i) => {
      _euler.set(-Math.PI / 2, 0, rotY);
      _quat.setFromEuler(_euler);
      _v1.set(cx, ROAD_Y + 0.012, cz);
      _v2.set(1, 1, 1);
      _mat4.compose(_v1, _quat, _v2);
      instCrosswalks.setMatrixAt(i, _mat4);
    });
    instCrosswalks.instanceMatrix.needsUpdate = true;
    instCrosswalks.computeBoundingSphere();
    this.scene.add(instCrosswalks);

    // 3. Grand Over-Water Highway Bridge & Marina Boat Docks
    for (const br of BRIDGES) {
      const bridgeMesh = createOverWaterBridgeMesh(br.axis, br.length, br.width, br.deckHeight, this.textures.highway);
      bridgeMesh.position.set(br.cx, 0, br.cz);
      this.scene.add(bridgeMesh);
    }
    for (const dock of WOODEN_DOCKS) {
      const dockMesh = createWoodenDockMesh(dock.xMax - dock.xMin, dock.zMax - dock.zMin, dock.deckY);
      dockMesh.position.set((dock.xMin + dock.xMax) / 2, 0, (dock.zMin + dock.zMax) / 2);
      this.scene.add(dockMesh);
    }

    // 4. Leonida International Airport Runway, Helipad & Control Tower
    this.buildAirportZone();

    // 5. Leonida Central Park City Garden & Kids Playground
    this.buildCentralParkGarden();

    // 6. Roadside Market Stalls
    for (const st of STREET_STALLS) {
      const stallMesh = createStreetStall(st.kind);
      stallMesh.position.set(st.x, LAND_Y, st.z);
      stallMesh.rotation.y = st.yaw;
      this.scene.add(stallMesh);
      this.propColliders.push({ x: st.x, z: st.z, radius: 1.9 });
    }

    // 7. Generate Buildings, Traffic Lights, Billboards, Bus Stops, Road Signs, Trees & Interiors
    const world = generateViceCityWorld();
    this.worldBuildings = world.buildings;
    this.worldInteriors = world.interiors;
    this.treasures = world.treasures;

    for (const rs of world.roadSigns) {
      const sign = createRoadSign(rs.color);
      sign.position.set(rs.x, LAND_Y, rs.z);
      sign.rotation.y = rs.yaw;
      this.scene.add(sign);
      this.propColliders.push({ x: rs.x, z: rs.z, radius: 0.35 });
    }

    for (const tl of world.trafficLights) {
      const rig = createTrafficLightRig();
      rig.group.position.set(tl.x, LAND_Y, tl.z);
      rig.group.rotation.y = tl.axis === 'ns' ? 0 : Math.PI / 2;
      this.scene.add(rig.group);
      this.trafficSignals.push({ x: tl.x, z: tl.z, axis: tl.axis, rig });
      this.propColliders.push({ x: tl.x, z: tl.z, radius: 0.35 });
    }

    for (const bb of world.billboards) {
      const adTex = this.textures.billboardAds[bb.adIdx % this.textures.billboardAds.length];
      const board = createBillboardMesh(adTex);
      board.position.set(bb.x, LAND_Y, bb.z);
      board.rotation.y = bb.yaw;
      this.scene.add(board);
      this.propColliders.push({ x: bb.x, z: bb.z, radius: 0.65 });
    }

    for (const bs of world.busStops) {
      const stop = createBusStopMesh();
      stop.position.set(bs.x, LAND_Y, bs.z);
      stop.rotation.y = bs.yaw;
      this.scene.add(stop);
      this.propColliders.push({ x: bs.x, z: bs.z, radius: 0.85 });
    }

    this.buildStreetLamps();
    this.buildGasAndFenceSpots();

    const heroAndCoreBuildings = this.worldBuildings.filter((b) => b.interior !== undefined);
    const skylineBuildings = this.worldBuildings.filter((b) => b.interior === undefined);

    if (skylineBuildings.length > 0) {
      const boxGeo = new THREE.BoxGeometry(1, 1, 1);
      const skyMat = new THREE.MeshStandardMaterial({
        map: this.textures.facadeModern,
        normalMap: this.textures.concreteNormal,
        normalScale: new THREE.Vector2(0.45, 0.45),
        roughness: 0.38,
        metalness: 0.45,
      });
      const instSky = new THREE.InstancedMesh(boxGeo, skyMat, skylineBuildings.length);
      instSky.castShadow = !this.isSoftwareGl;
      instSky.receiveShadow = true;

      const crownMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.6 });
      const instCrown = new THREE.InstancedMesh(boxGeo, crownMat, skylineBuildings.length);

      for (let i = 0; i < skylineBuildings.length; i++) {
        const b = skylineBuildings[i];
        _v1.set(b.x, LAND_Y + b.h / 2, b.z);
        _v2.set(b.w, b.h, b.d);
        _quat.identity();
        _mat4.compose(_v1, _quat, _v2);
        instSky.setMatrixAt(i, _mat4);
        _color.setHex(b.color);
        instSky.setColorAt(i, _color);

        _v1.set(b.x, LAND_Y + b.h + 1.2, b.z);
        _v2.set(b.w * 0.62, 2.4, b.d * 0.62);
        _mat4.compose(_v1, _quat, _v2);
        instCrown.setMatrixAt(i, _mat4);
      }
      instSky.instanceMatrix.needsUpdate = true;
      instCrown.instanceMatrix.needsUpdate = true;
      if (instSky.instanceColor) instSky.instanceColor.needsUpdate = true;
      instSky.computeBoundingSphere();
      instCrown.computeBoundingSphere();
      this.scene.add(instSky, instCrown);
    }

    this.buildEnterableShells(heroAndCoreBuildings);
    this.buildDestructibleTrees(world.weakTrees);

    // Underwater Treasure Crates
    const crateGeo = new THREE.BoxGeometry(1.1, 0.85, 0.85);
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.5,
      roughness: 0.35,
      metalness: 0.75,
    });
    for (const tr of this.treasures) {
      const m = new THREE.Mesh(crateGeo, crateMat);
      m.position.set(tr.x, tr.y, tr.z);
      this.scene.add(m);
      this.treasureMeshes.set(tr.id, m);
    }

    // Waypoint Sky Beam
    this.waypointBeam = new THREE.Group();
    const beamMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 110, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false })
    );
    beamMesh.position.y = 55;
    const ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.7, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.08;
    this.waypointBeam.add(beamMesh, ringMesh);
    this.scene.add(this.waypointBeam);

    // Spawn Jason & Lucia Rigs
    this.protagonistRigs = {
      jason: createCharacterRig('jason', this.textures.contactShadow),
      lucia: createCharacterRig('lucia', this.textures.contactShadow),
    };
    this.scene.add(this.protagonistRigs.jason.root, this.protagonistRigs.lucia.root);

    this.spawnInitialVehicles();
    this.spawnInitialNpcs();
    this.spawnWildlife();
  }

  private buildAirportZone() {
    const g = new THREE.Group();
    const runway = new THREE.Mesh(
      new THREE.PlaneGeometry(AIRPORT_ZONE.runwayLen, AIRPORT_ZONE.runwayW),
      new THREE.MeshStandardMaterial({ map: this.textures.runway, roughness: 0.75 })
    );
    runway.rotation.x = -Math.PI / 2;
    runway.position.set(AIRPORT_ZONE.runwayX, LAND_Y + 0.025, AIRPORT_ZONE.runwayZ);
    g.add(runway);

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(7.5, 7.5, 0.1, 24),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
    );
    pad.position.set(AIRPORT_ZONE.helipadX, LAND_Y + 0.05, AIRPORT_ZONE.helipadZ);
    const hRing = new THREE.Mesh(
      new THREE.RingGeometry(5.6, 6.2, 24),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    hRing.rotation.x = -Math.PI / 2;
    hRing.position.set(AIRPORT_ZONE.helipadX, LAND_Y + 0.11, AIRPORT_ZONE.helipadZ);
    g.add(pad, hRing);

    const towerShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.8, 26, 10),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.5 })
    );
    towerShaft.position.set(-465, LAND_Y + 13, -340);
    const towerCab = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 3.4, 4.2, 12),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65, roughness: 0.1 })
    );
    towerCab.position.set(-465, LAND_Y + 27.5, -340);
    g.add(towerShaft, towerCab);
    this.propColliders.push({ x: -465, z: -340, radius: 3.0 });

    this.scene.add(g);
  }

  private buildCentralParkGarden() {
    const parkGroup = new THREE.Group();
    const { cx, cz, w, d, fountainX, fountainZ, playgroundX, playgroundZ } = CENTRAL_PARK;

    const lawn = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshStandardMaterial({ map: this.textures.grass, roughness: 0.9 })
    );
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(cx, LAND_Y + 0.02, cz);
    lawn.receiveShadow = true;
    parkGroup.add(lawn);

    const pathMat = new THREE.MeshStandardMaterial({ map: this.textures.parkPath, roughness: 0.85 });
    const pathNS = new THREE.Mesh(new THREE.PlaneGeometry(3.6, d), pathMat);
    pathNS.rotation.x = -Math.PI / 2;
    pathNS.position.set(cx, LAND_Y + 0.03, cz);
    const pathEW = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.6), pathMat);
    pathEW.rotation.x = -Math.PI / 2;
    pathEW.position.set(cx, LAND_Y + 0.035, cz);
    parkGroup.add(pathNS, pathEW);

    const fountain = createParkFountain();
    fountain.position.set(fountainX, LAND_Y, fountainZ);
    this.fountainWaterMat = (fountain.userData.waterMaterial as THREE.ShaderMaterial) || null;
    parkGroup.add(fountain);
    this.propColliders.push({ x: fountainX, z: fountainZ, radius: 3.8 });

    const { group: pgGroup, carousel } = createPlaygroundSet();
    pgGroup.position.set(playgroundX, LAND_Y, playgroundZ);
    parkGroup.add(pgGroup);
    this.parkCarousel = carousel;
    this.propColliders.push({ x: playgroundX - 3.2, z: playgroundZ - 2.0, radius: 1.6 });
    this.propColliders.push({ x: playgroundX + 2.4, z: playgroundZ - 2.0, radius: 2.2 });

    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.8 });
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 });
    [
      [cx - 12, cz - 12],
      [cx + 12, cz - 12],
      [cx - 12, cz + 12],
      [cx + 12, cz + 12],
    ].forEach(([fx, fz]) => {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), bushMat);
      bush.position.set(fx, LAND_Y + 0.55, fz);
      const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), flowerMat);
      blossom.position.set(fx + 0.35, LAND_Y + 0.85, fz + 0.25);
      parkGroup.add(bush, blossom);
      this.propColliders.push({ x: fx, z: fz, radius: 1.1 });
    });

    SEAT_SPOTS.filter((s) => s.venue === 'park').forEach((seat) => {
      const bench = createParkBench();
      bench.position.set(seat.x, LAND_Y, seat.z);
      bench.rotation.y = seat.yaw;
      parkGroup.add(bench);
    });

    this.scene.add(parkGroup);
  }

  private buildStreetLamps() {
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 5.4, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });
    const bulbGeo = new THREE.SphereGeometry(0.26, 8, 8);
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xfbbf24, emissiveIntensity: 1.4 });

    const coords: [number, number][] = [];
    for (const rx of ROAD_X) {
      for (const rz of ROAD_Z) {
        if (isWaterChannel(rx - 10.5, rz - 10.5)) continue;
        coords.push([rx - 10.5, rz - 10.5]);
      }
    }
    const poles = new THREE.InstancedMesh(poleGeo, poleMat, coords.length);
    const bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, coords.length);
    coords.forEach(([lx, lz], i) => {
      _quat.identity();
      _v1.set(lx, LAND_Y + 2.7, lz);
      _v2.set(1, 1, 1);
      _mat4.compose(_v1, _quat, _v2);
      poles.setMatrixAt(i, _mat4);
      _v1.set(lx, LAND_Y + 5.4, lz);
      _mat4.compose(_v1, _quat, _v2);
      bulbs.setMatrixAt(i, _mat4);
      this.propColliders.push({ x: lx, z: lz, radius: 0.35 });
    });
    poles.instanceMatrix.needsUpdate = true;
    bulbs.instanceMatrix.needsUpdate = true;
    poles.computeBoundingSphere();
    bulbs.computeBoundingSphere();
    this.scene.add(poles, bulbs);
  }

  private buildGasAndFenceSpots() {
    const stationMat = new THREE.MeshStandardMaterial({ color: 0xf4f5f7, roughness: 0.4, metalness: 0.3 });
    const evAccent = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.8 });
    for (const gs of GAS_STATIONS) {
      const g = new THREE.Group();
      g.position.set(gs.x, LAND_Y, gs.z);
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 6), stationMat);
      canopy.position.y = 4.2;
      const trim = new THREE.Mesh(new THREE.BoxGeometry(10.1, 0.25, 6.1), evAccent);
      trim.position.y = 4.5;
      const pillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.2, 0.45), stationMat);
      pillar1.position.set(-3.5, 2.1, 0);
      const pillar2 = pillar1.clone();
      pillar2.position.set(3.5, 2.1, 0);
      const pump = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.5, 0.6),
        new THREE.MeshStandardMaterial({ color: gs.isEV ? 0x0ea5e9 : 0xef4444, roughness: 0.35 })
      );
      pump.position.set(0, 0.75, 0);
      g.add(canopy, trim, pillar1, pillar2, pump);
      this.scene.add(g);
      this.propColliders.push({ x: gs.x - 3.5, z: gs.z, radius: 0.5 });
      this.propColliders.push({ x: gs.x + 3.5, z: gs.z, radius: 0.5 });
    }

    for (const fn of FENCE_SPOTS) {
      const fg = new THREE.Group();
      fg.position.set(fn.x, LAND_Y, fn.z);
      const pad = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.7 })
      );
      pad.rotation.x = -Math.PI / 2;
      pad.position.y = 0.02;
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(3.4, 0.16, 8, 20, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.6 })
      );
      arch.position.y = 0.2;
      fg.add(pad, arch);
      this.scene.add(fg);
    }
  }

  private buildEnterableShells(buildings: BuildingFootprint[]) {
    const wallMatCache = new Map<number, THREE.MeshStandardMaterial>();
    const floorTileMat = new THREE.MeshStandardMaterial({ map: this.textures.interiorFloor, roughness: 0.65 });
    const woodFloorMat = new THREE.MeshStandardMaterial({
      map: this.textures.woodFloor,
      normalMap: this.textures.woodNormal,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughness: 0.58,
    });
    const glassDoorMat = new THREE.MeshPhysicalMaterial({ color: 0x8ad4eb, transparent: true, opacity: 0.32, roughness: 0.1 });
    const neonMatPink = new THREE.MeshBasicMaterial({ color: 0xff4d88 });
    const neonMatCyan = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const neonMatAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    for (const b of buildings) {
      const info = b.interior!;
      // Safehouse island bungalows already have bespoke createLuxuryBungalowMesh exterior
      if (info.kind === 'bungalow') continue;

      const isHero = !info.id.startsWith('int_proc_');
      const shellGroup = new THREE.Group();
      shellGroup.position.set(b.x, LAND_Y, b.z);

      let wallMat = wallMatCache.get(b.color);
      if (!wallMat) {
        wallMat = new THREE.MeshStandardMaterial({
          color: b.color,
          map:
            info.kind === 'safehouse'
              ? this.textures.villaStucco
              : b.isModern
              ? this.textures.facadeModern
              : b.isDeco
              ? this.textures.facadeDeco
              : this.textures.facadeWarm,
          normalMap: this.textures.concreteNormal,
          normalScale: new THREE.Vector2(0.45, 0.45),
          roughness: b.isModern ? 0.38 : 0.58,
          metalness: b.isModern ? 0.45 : 0.15,
          transparent: true,
          opacity: 1,
        });
        wallMatCache.set(b.color, wallMat);
      } else {
        wallMat = wallMat.clone();
      }

      const w = b.w;
      const d = b.d;
      const h = b.h;
      const wallThick = 0.3;

      const useWood = info.kind === 'safehouse' || info.kind === 'coffee' || info.kind === 'bar' || info.kind === 'clothes';
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.3, d - 0.3), useWood ? woodFloorMat : floorTileMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0.03;
      floor.receiveShadow = true;
      shellGroup.add(floor);

      const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, wallThick), wallMat);
      backWall.position.set(0, h / 2, -d / 2 + wallThick / 2);
      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, h, d), wallMat);
      leftWall.position.set(-w / 2 + wallThick / 2, h / 2, 0);
      const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, h, d), wallMat);
      rightWall.position.set(w / 2 - wallThick / 2, h / 2, 0);
      shellGroup.add(backWall, leftWall, rightWall);

      const frontUpper = new THREE.Mesh(new THREE.BoxGeometry(w, Math.max(1, h - 3.4), wallThick), wallMat);
      frontUpper.position.set(0, 3.4 + Math.max(1, h - 3.4) / 2, d / 2 - wallThick / 2);
      const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(w * 0.32, 3.4, wallThick), glassDoorMat);
      frontLeft.position.set(-w * 0.34, 1.7, d / 2 - wallThick / 2);
      const frontRight = new THREE.Mesh(new THREE.BoxGeometry(w * 0.32, 3.4, wallThick), glassDoorMat);
      frontRight.position.set(w * 0.34, 1.7, d / 2 - wallThick / 2);
      shellGroup.add(frontUpper, frontLeft, frontRight);

      const roofMesh = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.4),
        new THREE.MeshStandardMaterial({
          color: info.kind === 'safehouse' ? 0x8b4513 : 0x334155,
          roughness: 0.7,
          transparent: true,
          opacity: 1,
        })
      );
      roofMesh.position.set(0, h - 0.2, 0);
      if (h > 8) {
        const acUnit = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.35, 1.1, d * 0.32),
          new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.5 })
        );
        acUnit.position.set(0, 0.75, 0);
        roofMesh.add(acUnit);
      }
      shellGroup.add(roofMesh);

      const awningColor =
        info.kind === 'coffee'
          ? 0x7c2d12
          : info.kind === 'bar'
          ? 0x1e1b4b
          : info.kind === 'gunshop'
          ? 0x991b1b
          : info.kind === 'clothes'
          ? 0x9d174d
          : info.kind === 'precinct'
          ? 0x1d4ed8
          : b.isDeco
          ? 0xf43f5e
          : 0x0f766e;
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.66, 0.24, 1.3),
        new THREE.MeshStandardMaterial({ color: awningColor, roughness: 0.65 })
      );
      awning.position.set(0, 3.25, d / 2 + 0.62);
      awning.rotation.x = 0.22;
      shellGroup.add(awning);

      const neonBar = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.65, 0.16, 0.16),
        info.kind === 'coffee' ? neonMatAmber : info.kind === 'precinct' || info.kind === 'gunshop' ? neonMatCyan : neonMatPink
      );
      neonBar.position.set(0, 3.55, d / 2 + 0.1);
      shellGroup.add(neonBar);

      const interiorGroup = new THREE.Group();
      this.populateInteriorFurniture(interiorGroup, info, isHero);
      shellGroup.add(interiorGroup);

      this.scene.add(shellGroup);
      this.dynamicInteriors.push({
        footprint: b,
        shellGroup,
        roofMesh,
        frontWall: frontUpper,
        interiorGroup,
      });
    }
  }

  private populateInteriorFurniture(group: THREE.Group, info: InteriorInfo, isHero: boolean) {
    const w = info.width;
    const d = info.depth;
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x452b1f, roughness: 0.45 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x8b95a5, roughness: 0.25, metalness: 0.85 });

    if (info.kind === 'safehouse') {
      group.add(createJasonVillaFurnitureGroup());
      return;
    }

    if (info.kind === 'burgershot') {
      group.add(createBurgerShotInteriorGroup());
      return;
    }

    if (info.hasRegister || info.kind === 'bar' || info.kind === 'club' || info.kind === 'coffee' || info.kind === 'gunshop' || info.kind === 'precinct' || info.kind === 'clothes') {
      const counter = new THREE.Mesh(new THREE.BoxGeometry(w * 0.48, 1.05, 0.85), counterMat);
      counter.position.set(-w * 0.15, 0.525, -d * 0.22);
      group.add(counter);

      if (info.hasRegister) {
        const reg = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 0.42), metalMat);
        reg.position.set(-w * 0.15, 1.22, -d * 0.22);
        group.add(reg);
      }
    }

    if (info.hasCCTV) {
      const cam = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.35), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      cam.position.set(w * 0.4, 2.8, -d * 0.35);
      const recLight = new THREE.Mesh(new THREE.SphereGeometry(0.06), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      recLight.position.set(w * 0.4, 2.75, -d * 0.2);

      const desk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.85, 0.7), counterMat);
      desk.position.set(w * 0.32, 0.425, -d * 0.35);
      const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.08), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
      monitor.position.set(w * 0.32, 1.08, -d * 0.35);
      group.add(cam, recLight, desk, monitor);
    }

    if (info.hasATM) {
      const atm = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.65, 0.65), new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.3 }));
      atm.position.set(w * 0.36, 0.825, d * 0.18);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.35), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
      screen.position.set(w * 0.36, 1.25, d * 0.18 - 0.34);
      screen.rotation.y = Math.PI;
      group.add(atm, screen);
    }

    if (info.kind === 'gunshop') {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 2.2, 0.45), counterMat);
      rack.position.set(0, 1.1, -d * 0.44);
      const armorStand = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 1.45, 10), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      armorStand.position.set(w * 0.32, 0.725, 1.2);
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 0.7), new THREE.MeshStandardMaterial({ color: 0x3f6212 }));
      crate.position.set(-w * 0.32, 0.325, 1.8);
      group.add(rack, armorStand, crate);
    } else if (info.kind === 'clothes') {
      const rackColors = [0xf43f5e, 0x0ea5e9, 0xf59e0b, 0x10b981];
      for (let r = 0; r < 2; r++) {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.2, 6), metalMat);
        rail.rotation.z = Math.PI / 2;
        rail.position.set(r === 0 ? -2.8 : 2.8, 1.5, 1.2);
        group.add(rail);
        for (let h = -2; h <= 2; h++) {
          const shirt = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.65, 0.45),
            new THREE.MeshStandardMaterial({ color: rackColors[(r * 2 + Math.abs(h)) % rackColors.length], roughness: 0.7 })
          );
          shirt.position.set((r === 0 ? -2.8 : 2.8) + h * 0.52, 1.15, 1.2);
          group.add(shirt);
        }
      }
    } else if (info.kind === 'precinct') {
      const reception = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.05, 0.9), counterMat);
      reception.position.set(0, 0.525, 2.0);
      const fileCab = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 0.65), metalMat);
      fileCab.position.set(-w * 0.35, 0.75, 0);
      group.add(reception, fileCab);
    } else if (info.kind === 'coffee') {
      const espresso = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.6, 0.55), metalMat);
      espresso.position.set(-w * 0.15, 1.35, -d * 0.22);
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.75, 14), counterMat);
      table.position.set(-1.0, 0.375, 2.0);
      const chair1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.55), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
      chair1.position.set(-2.5, 0.25, 2.0);
      const chair2 = chair1.clone();
      chair2.position.set(0.5, 0.25, 2.0);
      group.add(espresso, table, chair1, chair2);
    } else if (info.kind === 'bar' || info.kind === 'club') {
      const tap = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.35), metalMat);
      tap.position.set(-w * 0.15, 1.32, -d * 0.22);
      const stoolMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.4 });
      const stool1 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.65, 12), stoolMat);
      stool1.position.set(-2.0, 0.325, -1.6);
      const stool2 = stool1.clone();
      stool2.position.set(0.0, 0.325, -1.6);
      const felt = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 1.35), new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.85 }));
      felt.position.set(2.5, 0.425, 2.0);
      group.add(tap, stool1, stool2, felt);
    } else if (info.kind === 'gym') {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.55), new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 }));
      bench.position.set(1.5, 0.225, 0);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), metalMat);
      bar.rotation.x = Math.PI / 2;
      bar.position.set(1.5, 1.1, 0);
      const bag = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.35, 12), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      bag.position.set(-2.6, 1.4, 1.2);
      group.add(bench, bar, bag);
    } else if (isHero || info.kind === 'mart' || info.kind === 'storefront') {
      const shelfMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(w * 0.35, 1.6, 0.6), shelfMat);
      shelf.position.set(w * 0.15, 0.8, 0);
      group.add(shelf);
    }
  }

  private buildDestructibleTrees(trees: WeakTreeSpot[]) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7c5338, roughness: 0.9 });
    const palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.72, side: THREE.DoubleSide });
    const oakLeafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.78 });
    const pineLeafMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.82 });

    const palmTrunkGeo = new THREE.CylinderGeometry(0.14, 0.26, 6.2, 7);
    const frondGeo = new THREE.ConeGeometry(0.55, 2.6, 4);
    const oakTrunkGeo = new THREE.CylinderGeometry(0.24, 0.38, 3.6, 7);
    const oakCrownGeo = new THREE.DodecahedronGeometry(2.15, 0);
    const pineTrunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 4.2, 7);
    const pineTier1Geo = new THREE.ConeGeometry(2.1, 2.5, 7);
    const pineTier2Geo = new THREE.ConeGeometry(1.6, 2.2, 7);

    for (const t of trees) {
      const group = new THREE.Group();
      group.position.set(t.x, LAND_Y, t.z);
      group.scale.setScalar(t.scale);

      if (t.species === 'palm') {
        const trunk = new THREE.Mesh(palmTrunkGeo, trunkMat);
        trunk.position.y = 3.1;
        trunk.rotation.z = 0.08;
        trunk.castShadow = !this.isSoftwareGl;
        group.add(trunk);
        for (let f = 0; f < 5; f++) {
          const frond = new THREE.Mesh(frondGeo, palmLeafMat);
          const ang = (f / 5) * Math.PI * 2;
          frond.position.set(Math.cos(ang) * 0.9 - 0.2, 6.05, Math.sin(ang) * 0.9);
          frond.rotation.z = -1.1;
          frond.rotation.y = ang;
          group.add(frond);
        }
      } else if (t.species === 'pine') {
        const trunk = new THREE.Mesh(pineTrunkGeo, trunkMat);
        trunk.position.y = 2.1;
        trunk.castShadow = !this.isSoftwareGl;
        const t1 = new THREE.Mesh(pineTier1Geo, pineLeafMat);
        t1.position.y = 3.7;
        t1.castShadow = !this.isSoftwareGl;
        const t2 = new THREE.Mesh(pineTier2Geo, pineLeafMat);
        t2.position.y = 5.3;
        group.add(trunk, t1, t2);
      } else {
        const trunk = new THREE.Mesh(oakTrunkGeo, trunkMat);
        trunk.position.y = 1.8;
        trunk.castShadow = !this.isSoftwareGl;
        const crown = new THREE.Mesh(oakCrownGeo, oakLeafMat);
        crown.position.y = 4.3;
        crown.castShadow = !this.isSoftwareGl;
        group.add(trunk, crown);
      }

      this.scene.add(group);
      this.weakTreeEntries.push({ data: t, group });
    }
  }

  private spawnInitialVehicles() {
    const presets: Array<{
      name: string;
      tier: VehicleTier;
      fuelType: 'petrol' | 'ev' | 'aviation';
      color: string;
      x: number;
      z: number;
      yaw: number;
      isTraffic?: boolean;
      isPrecinctUnit?: boolean;
      dir?: number;
      axis?: 'z' | 'x';
    }> = [
      // Jason's Driveway outside Jason's Villa (210, 210)
      { name: 'Jason Sabre Turbo', tier: 'muscle', fuelType: 'petrol', color: '#e63946', x: 207, z: 229, yaw: Math.PI },
      { name: 'Vice Nagasaki Sport Bike', tier: 'bike', fuelType: 'petrol', color: '#2dd4bf', x: 215, z: 229, yaw: Math.PI },
      // South & North Island Motorcycles & Supercars
      { name: 'Bati 801RR Superbike', tier: 'bike', fuelType: 'petrol', color: '#f59e0b', x: 52, z: 125, yaw: 0 },
      { name: 'Pegassi Chopper Bike', tier: 'bike', fuelType: 'petrol', color: '#a855f7', x: -195, z: 228, yaw: Math.PI / 2 },
      { name: 'Grotti Cheetah Carbon', tier: 'luxury', fuelType: 'petrol', color: '#f59e0b', x: 295, z: 195, yaw: 0 },
      { name: 'Pegassi Zentorno EV', tier: 'luxury', fuelType: 'ev', color: '#06b6d4', x: 70, z: -186, yaw: Math.PI / 2 },
      { name: 'Dewbauchee Vice EV', tier: 'luxury', fuelType: 'ev', color: '#ec4899', x: 24, z: 162, yaw: 0 },
      { name: 'Bravado Gauntlet Hellfire', tier: 'muscle', fuelType: 'petrol', color: '#7c3aed', x: 185, z: 265, yaw: 0 },
      { name: 'Vice Cab Taxi', tier: 'taxi', fuelType: 'petrol', color: '#facc15', x: 22, z: 256, yaw: Math.PI / 2 },
      { name: 'Sandking Pickup 4x4', tier: 'pickup', fuelType: 'petrol', color: '#16a34a', x: -195, z: -230, yaw: 0 },
      { name: 'Dundreary Landstalker SUV', tier: 'suv', fuelType: 'petrol', color: '#334155', x: -240, z: 260, yaw: Math.PI },
      { name: 'Obey Tailgater EV', tier: 'sedan', fuelType: 'ev', color: '#e2e8f0', x: 210, z: -230, yaw: 0 },
      { name: 'Vapid Dominator Classic', tier: 'classic', fuelType: 'petrol', color: '#2563eb', x: -245, z: 122, yaw: 0 },
      // Vice PD Central Precinct Cruisers (-70, 210)!
      { name: 'Vice PD Precinct Cruiser 1', tier: 'police', fuelType: 'petrol', color: '#111827', x: -84, z: 228, yaw: Math.PI, isPrecinctUnit: true },
      { name: 'Vice PD Precinct Cruiser 2', tier: 'police', fuelType: 'petrol', color: '#111827', x: -56, z: 228, yaw: Math.PI, isPrecinctUnit: true },
      // Port Vice, Northport & Island Speedboats
      { name: 'Vice Marquis Speedboat', tier: 'boat', fuelType: 'petrol', color: '#f8fafc', x: 396, z: 348, yaw: Math.PI / 2 },
      { name: 'Channel Cruiser Speedboat', tier: 'boat', fuelType: 'ev', color: '#fb923c', x: 84, z: -68, yaw: Math.PI / 2 },
      { name: 'Paradise Key Yacht Tender', tier: 'boat', fuelType: 'petrol', color: '#38bdf8', x: 462, z: 240, yaw: -Math.PI / 2 },
      { name: 'Starlight Jet Boat', tier: 'boat', fuelType: 'ev', color: '#f43f5e', x: 462, z: -240, yaw: -Math.PI / 2 },
      // Leonida International Airport Helicopter & Airplanes (-440, -385)!
      { name: 'Vice News Maverick Helicopter', tier: 'heli', fuelType: 'aviation', color: '#2563eb', x: AIRPORT_ZONE.helipadX, z: AIRPORT_ZONE.helipadZ, yaw: 0 },
      { name: 'Dodo Prop Charter Plane', tier: 'plane', fuelType: 'aviation', color: '#f8fafc', x: AIRPORT_ZONE.runwayX - 45, z: AIRPORT_ZONE.runwayZ, yaw: Math.PI / 2 },
      { name: 'Mammatus Stunt Plane', tier: 'plane', fuelType: 'aviation', color: '#ef4444', x: AIRPORT_ZONE.runwayX + 42, z: AIRPORT_ZONE.runwayZ, yaw: Math.PI / 2 },
      // Ambient City & Over-Water Highway Bridge Traffic Cruisers!
      { name: 'Imponte Ruiner', tier: 'muscle', fuelType: 'petrol', color: '#10b981', x: 4.5, z: 180, yaw: 0, isTraffic: true, dir: -1, axis: 'z' },
      { name: 'Albany Cavalcade', tier: 'suv', fuelType: 'petrol', color: '#475569', x: -4.5, z: -180, yaw: 0, isTraffic: true, dir: 1, axis: 'z' },
      { name: 'Karin Asterope', tier: 'sedan', fuelType: 'ev', color: '#94a3b8', x: -135, z: 220, yaw: 0, isTraffic: true, dir: 1, axis: 'z' },
      { name: 'Vice Yellow Cab', tier: 'taxi', fuelType: 'petrol', color: '#eab308', x: -160, z: 144, yaw: Math.PI / 2, isTraffic: true, dir: 1, axis: 'x' },
      { name: 'Vapid Bobcat Pickup', tier: 'pickup', fuelType: 'petrol', color: '#dc2626', x: 180, z: -144, yaw: -Math.PI / 2, isTraffic: true, dir: -1, axis: 'x' },
      { name: 'Highway Patrol Cruiser', tier: 'police', fuelType: 'petrol', color: '#111827', x: 144, z: 265, yaw: 0, isTraffic: true, dir: 1, axis: 'z' },
    ];

    presets.forEach((p, idx) => {
      const rig = createVehicleRig(p.tier, p.color, this.textures.contactShadow, this.isSoftwareGl);
      const startY = p.tier === 'boat' ? -0.15 : getTerrainHeightAt(p.x, p.z);
      rig.root.position.set(p.x, startY, p.z);
      rig.root.rotation.y = p.yaw;
      this.scene.add(rig.root);

      const maxSpeed =
        p.tier === 'plane'
          ? 74
          : p.tier === 'heli'
          ? 54
          : p.tier === 'luxury'
          ? 48
          : p.tier === 'bike'
          ? 46
          : p.tier === 'muscle'
          ? 42
          : p.tier === 'police'
          ? 41
          : p.tier === 'boat'
          ? 32
          : 35;

      const state: VehicleState = {
        id: `veh_${idx}`,
        name: p.name,
        tier: p.tier,
        fuelType: p.fuelType,
        fuel: 80 + (idx % 4) * 5,
        maxFuel: 100,
        health: 100,
        maxHealth: 100,
        speed: 0,
        maxSpeed,
        hotwired: idx <= 3 || p.tier === 'boat' || p.tier === 'heli' || p.tier === 'plane',
        needsKeyCloner: p.tier === 'luxury',
        gpsTrackerActive: false,
        gpsTimer: 60,
        headlightsOn: true,
        leftBlinker: false,
        rightBlinker: false,
        windowsDown: false,
        trunkOpen: false,
        hoodOpen: false,
        convertibleOpen: false,
        roofIsConvertible: p.tier === 'luxury' || p.tier === 'classic',
        seat: 'driver',
        ducking: false,
        wheelieActive: false,
        tireFlat: false,
        anchorDropped: false,
        trunkWeapons: [],
        trunkLoot: 0,
        trunkOutfits: ['street', 'suited', 'beach', 'tactical'],
        flooded: false,
        submersionDepth: 0,
        turboLevel: 0,
        wheelStyle: 'stock',
        colorHex: p.color,
      };

      this.vehicles.push({
        state,
        rig,
        x: p.x,
        y: startY,
        z: p.z,
        yaw: p.yaw,
        vy: 0,
        vx: 0,
        vz: 0,
        angVel: 0,
        steerAngle: 0,
        wheelSpin: 0,
        isTraffic: Boolean(p.isTraffic),
        isPoliceSpawn: false,
        isPrecinctUnit: Boolean(p.isPrecinctUnit),
        trafficDir: p.dir ?? 1,
        trafficAxis: p.axis ?? 'z',
        driverPresent: Boolean(p.isTraffic),
        leftDoorAngle: 0,
        rightDoorAngle: 0,
        leftDoorTimer: 0,
        rightDoorTimer: 0,
      });
    });
  }

  private spawnInitialNpcs() {
    const names = ['Mateo', 'Elena', 'Darius', 'Camila', 'Trey', 'Sofia', 'Carlos', 'Maya', 'Rico', 'Chloe', 'Devon', 'Valeria'];
    const archetypes = ['Vice Local', 'Beach Tourist', 'Club Promoter', 'Street Racer', 'Shopper', 'Financier'];
    const shirts = [0xe11d48, 0x0284c7, 0x16a34a, 0xd97706, 0x7c3aed, 0x0d9488];

    // 32 City Pedestrians split cleanly between Vice Downtown & Northport sidewalks!
    for (let i = 0; i < 32; i++) {
      const onNorth = i % 2 === 1;
      let x = ((i * 113) % 560) - 280;
      let z = onNorth ? -120 - ((i * 73) % 340) : 115 + ((i * 73) % 340);
      if (this.collidesWithSolidWall(x, z, 0.8)) {
        x += 18;
        z += 12;
      }
      const groundY = getTerrainHeightAt(x, z);
      const rig = createCharacterRig('npc', this.textures.contactShadow, shirts[i % shirts.length]);
      rig.root.position.set(x, groundY, z);
      this.scene.add(rig.root);
      this.npcs.push({
        id: `npc_${i}`,
        name: names[i % names.length],
        archetype: archetypes[i % archetypes.length],
        rig,
        x, y: groundY, z,
        vx: 0, vy: 0, vz: 0, tumbleAngle: 0,
        yaw: (i * 1.1) % (Math.PI * 2),
        speed: 2.3,
        walkPhase: i * 0.5,
        kind: 'civilian',
        chatterCooldown: (i % 6) * 2,
        hp: 80,
        alive: true,
        hostile: false,
        armed: false,
        fleeing: false,
        isWitness: false,
        witnessTimer: 0,
        mood: 20,
        patrolCenterX: x,
        patrolCenterZ: z,
        wanderTimer: 2 + (i % 4),
        fireCooldown: 0,
        meleeCooldown: 0,
        targetProtagonist: 'jason',
        targetNpc: null,
      });
    }

    // 2 Rival Street Gang Factions (Royals in Vice Downtown West, Skulls in Northport Docks)
    const gangConfigs: Array<{ faction: 'royals' | 'skulls'; cx: number; cz: number; color: number; label: string }> = [
      { faction: 'royals', cx: -175, cz: 255, color: 0x9333ea, label: 'Vice Royals Crew' },
      { faction: 'skulls', cx: -175, cz: -178, color: 0x991b1b, label: 'Northport Skulls' },
    ];
    gangConfigs.forEach((gc) => {
      for (let m = 0; m < 4; m++) {
        const gx = gc.cx + (m - 1.5) * 3.5;
        const gz = gc.cz + (m % 2 === 0 ? -2.5 : 2.5);
        const rig = createCharacterRig('npc', this.textures.contactShadow, gc.color);
        rig.root.position.set(gx, LAND_Y, gz);
        this.scene.add(rig.root);
        this.npcs.push({
          id: `gang_${gc.faction}_${m}`,
          name: `${gc.faction === 'royals' ? 'Royal' : 'Skull'} #${m + 1}`,
          archetype: gc.label,
          gangFaction: gc.faction,
          rig,
          x: gx, y: LAND_Y, z: gz,
          vx: 0, vy: 0, vz: 0, tumbleAngle: 0,
          yaw: m * 1.4,
          speed: 3.0,
          walkPhase: m * 0.8,
          kind: 'gang',
          chatterCooldown: m * 2,
          hp: 105,
          alive: true,
          hostile: false,
          armed: true,
          fleeing: false,
          isWitness: false,
          witnessTimer: 0,
          mood: -25,
          patrolCenterX: gc.cx,
          patrolCenterZ: gc.cz,
          wanderTimer: 2.5 + m,
          fireCooldown: 0.4,
          meleeCooldown: 0,
          targetProtagonist: 'jason',
          targetNpc: null,
        });
      }
    });

    // Shoppers browsing Roadside Market Stalls!
    STREET_STALLS.forEach((st, idx) => {
      for (let b = 0; b < 2; b++) {
        const bx = st.x + (b === 0 ? -1.4 : 1.5);
        const bz = st.z + 2.4;
        const rig = createCharacterRig('npc', this.textures.contactShadow, shirts[(idx + b) % shirts.length]);
        rig.root.position.set(bx, LAND_Y, bz);
        this.scene.add(rig.root);
        this.npcs.push({
          id: `stall_buyer_${idx}_${b}`,
          name: names[(idx + b) % names.length],
          archetype: 'Stall Customer',
          rig,
          x: bx, y: LAND_Y, z: bz,
          vx: 0, vy: 0, vz: 0, tumbleAngle: 0,
          yaw: Math.PI,
          speed: 1.4,
          walkPhase: 0,
          kind: 'civilian',
          hp: 75,
          alive: true,
          hostile: false,
          armed: false,
          fleeing: false,
          isWitness: false,
          witnessTimer: 0,
          mood: 50,
          patrolCenterX: bx,
          patrolCenterZ: bz,
          wanderTimer: 5,
          fireCooldown: 0,
          meleeCooldown: 0,
          targetProtagonist: 'jason',
          targetNpc: null,
        });
      }
    });

    // Vice PD Officers stationed at Central Police Precinct (-70, 210)
    for (let c = 0; c < 2; c++) {
      const cx = -78 + c * 16;
      const cz = 225;
      const rig = createCharacterRig('police', this.textures.contactShadow);
      rig.root.position.set(cx, LAND_Y, cz);
      this.scene.add(rig.root);
      this.npcs.push({
        id: `precinct_cop_${c}`,
        name: `Precinct Officer #${c + 1}`,
        archetype: 'Vice PD Patrol',
        rig,
        x: cx, y: LAND_Y, z: cz,
        vx: 0, vy: 0, vz: 0, tumbleAngle: 0,
        yaw: 0,
        speed: 5.2,
        walkPhase: 0,
        kind: 'police',
        hp: 95,
        alive: true,
        hostile: false,
        armed: true,
        fleeing: false,
        isWitness: false,
        witnessTimer: 0,
        mood: 10,
        patrolCenterX: cx,
        patrolCenterZ: cz,
        wanderTimer: 3,
        fireCooldown: 0,
        meleeCooldown: 0,
        targetProtagonist: 'jason',
        targetNpc: null,
      });
    }

    // 5 Playing Children in Leonida Central Park Playground
    const kidNames = ['Leo', 'Mia', 'Toby', 'Zoe', 'Lucas'];
    const kidColors = [0xf43f5e, 0x06b6d4, 0xfacc15, 0x22c55e, 0xa855f7];
    for (let k = 0; k < 5; k++) {
      const kx = CENTRAL_PARK.playgroundX + (k - 2) * 2.4;
      const kz = CENTRAL_PARK.playgroundZ + ((k % 2 === 0 ? 1 : -1) * 2.2);
      const rig = createCharacterRig('child', this.textures.contactShadow, kidColors[k]);
      rig.root.position.set(kx, LAND_Y, kz);
      this.scene.add(rig.root);
      this.npcs.push({
        id: `kid_${k}`,
        name: kidNames[k],
        archetype: 'Playground Kid',
        rig,
        x: kx, y: LAND_Y, z: kz,
        vx: 0, vy: 0, vz: 0, tumbleAngle: 0,
        yaw: k * 1.2,
        speed: 3.1,
        walkPhase: k,
        kind: 'child',
        hp: 999,
        alive: true,
        hostile: false,
        armed: false,
        fleeing: false,
        isWitness: false,
        witnessTimer: 0,
        mood: 80,
        patrolCenterX: CENTRAL_PARK.playgroundX,
        patrolCenterZ: CENTRAL_PARK.playgroundZ,
        wanderTimer: 1.5,
        fireCooldown: 0,
        meleeCooldown: 0,
        targetProtagonist: 'jason',
        targetNpc: null,
      });
    }

    // Hero interior cashiers / baristas / gun dealer / boutique clerks
    for (const hInt of this.worldInteriors) {
      if (hInt.id.startsWith('int_proc_') || hInt.kind === 'bungalow') continue;
      if (!hInt.hasRegister && hInt.kind !== 'gym' && hInt.kind !== 'barber' && hInt.kind !== 'gunshop' && hInt.kind !== 'clothes') continue;
      const rig = createCharacterRig(
        'npc',
        this.textures.contactShadow,
        hInt.kind === 'gunshop' ? 0x7f1d1d : hInt.kind === 'clothes' ? 0x9d174d : hInt.kind === 'coffee' ? 0x78350f : 0x0f766e
      );
      const cx = hInt.x - hInt.width * 0.15;
      const cz = hInt.z - hInt.depth * 0.34;
      rig.root.position.set(cx, LAND_Y, cz);
      this.scene.add(rig.root);
      this.npcs.push({
        id: `clerk_${hInt.id}`,
        name:
          hInt.kind === 'gunshop'
            ? 'Marcus (Armory Dealer)'
            : hInt.kind === 'clothes'
            ? 'Camila (Stylist)'
            : hInt.kind === 'barber'
            ? 'Marco Styles'
            : hInt.kind === 'pawn'
            ? 'Uncle Jack'
            : hInt.kind === 'coffee'
            ? 'Barista Sofia'
            : hInt.kind === 'bar'
            ? 'Bartender Rico'
            : `${hInt.name.split(' ')[0]} Clerk`,
        archetype: hInt.kind === 'gunshop' ? 'Arms Dealer' : hInt.kind === 'clothes' ? 'Stylist' : hInt.kind === 'pawn' ? 'Fence & Dealer' : 'Shopkeeper',
        rig,
        x: cx, y: LAND_Y, z: cz,
        vx: 0, vy: 0, vz: 0, tumbleAngle: 0,
        yaw: 0,
        speed: 0,
        walkPhase: 0,
        kind: 'cashier',
        hp: 95,
        alive: true,
        hostile: false,
        armed: hInt.kind === 'pawn' || hInt.kind === 'bank' || hInt.kind === 'gunshop',
        fleeing: false,
        isWitness: false,
        witnessTimer: 0,
        mood: 35,
        patrolCenterX: cx,
        patrolCenterZ: cz,
        wanderTimer: 99,
        fireCooldown: 0,
        meleeCooldown: 0,
        targetProtagonist: 'jason',
        targetNpc: null,
        interiorId: hInt.id,
      });
    }
  }

  private spawnWildlife() {
    // Northport Woods Alligators
    const gatorCoords: [number, number][] = [
      [-60, -475],
      [-185, -490],
      [45, -470],
      [-265, -485],
    ];
    gatorCoords.forEach(([gx, gz], idx) => {
      const rig = createWildlifeRig('gator');
      rig.root.position.set(gx, LAND_Y, gz);
      this.scene.add(rig.root);
      this.wildlifeEntries.push({
        id: `gator_${idx}`,
        species: 'gator',
        rig,
        x: gx,
        y: LAND_Y,
        z: gz,
        yaw: idx * 1.4,
        baseX: gx,
        baseZ: gz,
        phase: idx * 1.2,
      });
    });

    // Vice Bay & Ocean Channel Sharks & Jumping Dolphins
    const oceanLife: Array<{ species: 'shark' | 'dolphin'; x: number; z: number }> = [
      { species: 'dolphin', x: 185, z: -15 },
      { species: 'dolphin', x: 432, z: 120 },
      { species: 'dolphin', x: 446, z: -145 },
      { species: 'shark', x: -165, z: 10 },
      { species: 'shark', x: 472, z: 35 },
      { species: 'shark', x: 460, z: -190 },
    ];
    oceanLife.forEach((ol, idx) => {
      const rig = createWildlifeRig(ol.species);
      const startY = ol.species === 'shark' ? -0.55 : -0.2;
      rig.root.position.set(ol.x, startY, ol.z);
      this.scene.add(rig.root);
      this.wildlifeEntries.push({
        id: `${ol.species}_${idx}`,
        species: ol.species,
        rig,
        x: ol.x,
        y: startY,
        z: ol.z,
        yaw: idx * 0.9,
        baseX: ol.x,
        baseZ: ol.z,
        phase: idx * 1.7,
      });
    });
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.addEventListener('mousedown', this.onCanvasMouseDown);
    this.renderer.domElement.addEventListener('contextmenu', this.onContextMenu);
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost);
  }

  private onContextLost = (e: Event) => e.preventDefault();
  private onContextMenu = (e: Event) => e.preventDefault();

  private onResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const maxPr = this.controlSettings.autoDetectedMobile ? 1.5 : 2;
    const pr = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, maxPr);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(pr);
    this.postProcessing?.resize(w, h, pr);
  };

  private onWindowBlur = () => {
    this.keys = {};
    this.aiming = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (this.screen !== 'playing' || (this.activeModal !== null && this.activeModal !== 'phone')) return;
    if (document.pointerLockElement === this.renderer.domElement || (e.buttons & 2) !== 0) {
      this.camYaw -= e.movementX * 0.0028;
      this.camPitch = THREE.MathUtils.clamp(this.camPitch + e.movementY * 0.0024, -0.35, 0.85);
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 2) {
      this.aiming = false;
    }
  };

  private onCanvasMouseDown = (e: MouseEvent) => {
    viceAudio.init();
    if (this.screen !== 'playing') return;
    if (this.activeModal !== null && this.activeModal !== 'phone') return;
    if (e.button === 2) {
      this.aiming = true;
      return;
    }
    if (e.button === 0) {
      if (this.activeModal === null && document.pointerLockElement !== this.renderer.domElement && !this.isSoftwareGl) {
        this.renderer.domElement.requestPointerLock?.();
      }
      this.triggerPrimaryAttack();
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const code = e.code;
    this.keys[code] = true;

    if (this.screen === 'title') {
      if (code === 'Enter' || code === 'Space') {
        e.preventDefault();
        this.startGame(this.activeId);
      }
      return;
    }

    if (code === 'Escape') {
      if (this.activeModal) this.closeModal();
      else this.openModal('pause');
      return;
    }

    if (this.screen !== 'playing') return;

    // P opens/closes Side Phone (GTA style!)
    if (code === 'KeyP') {
      e.preventDefault();
      if (this.activeModal === 'phone') this.closeModal();
      else this.openModal('phone');
      return;
    }

    // Q opens/closes Radial Weapon & Gear Wheel!
    if (code === 'KeyQ') {
      e.preventDefault();
      if (this.activeModal === 'wheel') this.closeModal();
      else this.openModal('wheel');
      return;
    }

    // M opens/closes Full Interactive City Map!
    if (code === 'KeyM') {
      e.preventDefault();
      if (this.activeModal === 'map') this.closeModal();
      else this.openModal('map');
      return;
    }

    if (code === 'KeyN') {
      this.toggleMute();
      return;
    }

    // Allow full movement while Side Phone is open, block controls only for full-screen modals
    if (this.activeModal !== null && this.activeModal !== 'phone') return;

    const p = this.protagonists[this.activeId];
    if (p.isSitting && (code === 'Space' || code === 'KeyW' || code === 'KeyE')) {
      if (code === 'KeyE' && this.currentSeat && (this.currentSeat.venue === 'coffee' || this.currentSeat.venue === 'bar')) {
        this.orderSeatedRefreshment();
        return;
      }
      this.standUp();
      return;
    }

    if (code === 'Tab') {
      e.preventDefault();
      this.switchProtagonist();
    } else if (code === 'KeyB') {
      this.togglePartnerFollow();
    } else if (code === 'KeyK') {
      this.togglePartnerInCar();
    } else if (code === 'CapsLock' || code === 'Backquote' || code === 'KeyI') {
      e.preventDefault();
      this.toggleSlowMo();
    } else if (code === 'KeyH') {
      if (p.equippedWeaponId === 'molotov') this.throwMolotov();
      else this.throwGrenade();
    } else if (code === 'KeyE') {
      this.triggerContextInteract();
    } else if (code === 'KeyF') {
      this.toggleVehicleEnterExit();
    } else if (code === 'KeyT') {
      this.toggleTrunk();
    } else if (code === 'KeyY') {
      this.repairNearbyVehicleHood();
    } else if (code === 'Digit1') {
      this.selectWeapon('fists');
    } else if (code.startsWith('Digit')) {
      const idx = Number(code.replace('Digit', ''));
      if (idx >= 2 && idx <= 9) {
        const w = p.weapons[idx - 2];
        if (w) this.selectWeapon(w.id);
      }
    } else if (this.drivingVehicle) {
      if (code === 'KeyZ') {
        this.drivingVehicle.state.leftBlinker = !this.drivingVehicle.state.leftBlinker;
        if (this.drivingVehicle.state.leftBlinker) this.drivingVehicle.state.rightBlinker = false;
        viceAudio.playBlinkerTick();
      } else if (code === 'KeyC') {
        this.drivingVehicle.state.rightBlinker = !this.drivingVehicle.state.rightBlinker;
        if (this.drivingVehicle.state.rightBlinker) this.drivingVehicle.state.leftBlinker = false;
        viceAudio.playBlinkerTick();
      } else if (code === 'KeyL') {
        this.drivingVehicle.state.headlightsOn = !this.drivingVehicle.state.headlightsOn;
        viceAudio.playUiChime(true);
      } else if (code === 'KeyU') {
        this.drivingVehicle.state.windowsDown = !this.drivingVehicle.state.windowsDown;
        this.showToast(this.drivingVehicle.state.windowsDown ? 'Windows rolled down' : 'Windows rolled up');
      } else if (code === 'KeyO') {
        if (this.drivingVehicle.state.roofIsConvertible) {
          this.drivingVehicle.state.convertibleOpen = !this.drivingVehicle.state.convertibleOpen;
          this.showToast(this.drivingVehicle.state.convertibleOpen ? 'Convertible Roof Lowered' : 'Convertible Roof Closed');
        } else {
          this.drivingVehicle.state.hoodOpen = !this.drivingVehicle.state.hoodOpen;
          this.showToast(this.drivingVehicle.state.hoodOpen ? 'Hood Popped' : 'Hood Closed');
        }
      } else if (code === 'KeyV') {
        if (this.drivingVehicle.state.tier === 'boat') {
          this.drivingVehicle.state.anchorDropped = !this.drivingVehicle.state.anchorDropped;
          this.showToast(this.drivingVehicle.state.anchorDropped ? 'Anchor Dropped!' : 'Anchor Raised!');
        } else if (this.drivingVehicle.state.tier === 'bike') {
          this.drivingVehicle.state.wheelieActive = !this.drivingVehicle.state.wheelieActive;
        } else {
          this.drivingVehicle.state.ducking = !this.drivingVehicle.state.ducking;
          this.showToast(this.drivingVehicle.state.ducking ? 'Ducking Behind Dash' : 'Sitting Upright');
        }
      } else if (code === 'KeyG') {
        this.cycleSeatInsideVehicle();
      } else if (code === 'KeyR') {
        this.cycleRadioStation();
      }
    } else {
      // On-foot tactical locomotion, melee & gear toggles
      if (code === 'KeyG') {
        this.triggerPrimaryAttack();
      } else if (code === 'KeyR') {
        this.reloadWeapon();
      } else if (code === 'KeyC' && !p.inWater) {
        p.crouching = !p.crouching;
        p.prone = false;
      } else if (code === 'KeyX' && !p.inWater) {
        p.prone = !p.prone;
        p.crouching = false;
      } else if (code === 'AltLeft' || code === 'AltRight') {
        e.preventDefault();
        if (!p.inWater && p.stamina > 12) {
          p.stamina = Math.max(0, p.stamina - 12);
          p.actionState = 'dodge';
          this.actionTimer = 0.42;
          const dx = Math.sin(p.yaw);
          const dz = Math.cos(p.yaw);
          if (!this.collidesWithSolidWall(p.x + dx * 2.2, p.z + dz * 2.2, 0.45)) {
            p.x += dx * 2.0;
            p.z += dz * 2.0;
          }
        }
      } else if (code === 'ControlLeft' || code === 'ControlRight') {
        p.inCover = !p.inCover;
        p.crouching = p.inCover;
      } else if (code === 'KeyV') {
        this.toggleEarphones();
      } else if (code === 'KeyO') {
        this.toggleUmbrella();
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  // ================= PUBLIC API =================

  public startGame(starter: ProtagonistId) {
    viceAudio.init();
    this.activeId = starter;
    this.screen = 'playing';
    this.activeModal = null;
    const partnerName = starter === 'jason' ? 'Lucia' : 'Jason';
    this.showToast(`Jason's Villa · Talk to ${partnerName} [E], Phone [P], Map [M]`);
    this.pushHud();
  }

  public respawnPlayer() {
    const p = this.protagonists[this.activeId];
    p.health = p.maxHealth;
    p.armor = 50;
    p.x = 206.5;
    p.y = LAND_Y;
    p.z = 213.5;
    p.isSitting = false;
    p.actionState = 'idle';
    p.oxygen = 100;
    p.bleeding = false;
    this.drivingVehicle = null;
    this.boardingSeq = null;
    this.exitingSeq = null;
    this.wanted.stars = 0;
    this.wanted.heat = 0;
    this.wanted.witnessActive = false;
    this.cash = Math.max(0, this.cash - 250);
    this.screen = 'playing';
    this.showToast('Discharged from Vice General (-$250)');
    this.pushHud();
  }

  public openModal(modal: ActiveModalType, payload?: unknown) {
    this.activeModal = modal;
    if (modal !== 'phone') this.keys = {};
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }
    this.callbacks.onOpenModal(modal, payload);
    this.pushHud();
  }

  public closeModal() {
    this.activeModal = null;
    this.callbacks.onOpenModal(null);
    this.pushHud();
  }

  public toggleMute() {
    viceAudio.setMuted(!viceAudio.isMuted());
    this.pushHud();
  }

  public cycleWeather() {
    this.weatherIndex = (this.weatherIndex + 1) % WEATHER_ORDER.length;
    this.weatherTimer = 0;
    this.pushHud();
  }

  public switchProtagonist() {
    if (this.drivingVehicle || this.boardingSeq || this.exitingSeq) {
      this.showToast('Exit vehicle before switching protagonists');
      return;
    }
    this.activeId = this.activeId === 'jason' ? 'lucia' : 'jason';
    viceAudio.playUiChime(true);
    this.showToast(`Switched to ${this.protagonists[this.activeId].name}`);
    this.pushHud();
  }

  public togglePartnerFollow() {
    const partnerName = this.activeId === 'jason' ? 'Lucia' : 'Jason';
    if (!this.relationship.duoActive) {
      this.callPartnerOnPhone();
    } else {
      this.relationship.duoActive = false;
      this.relationship.partnerState = 'home';
      this.relationship.partnerInVehicleId = null;
      const partner = this.protagonists[this.activeId === 'jason' ? 'lucia' : 'jason'];
      partner.isSitting = false;
      viceAudio.playUiChime(false);
      this.showToast(`${partnerName} is heading back to Jason's Villa.`);
      this.pushHud();
    }
  }

  public togglePartnerInCar() {
    const partnerId: ProtagonistId = this.activeId === 'jason' ? 'lucia' : 'jason';
    const partnerName = partnerId === 'lucia' ? 'Lucia' : 'Jason';
    const partner = this.protagonists[partnerId];
    const targetVeh = this.drivingVehicle || this.nearbyTrunkVehicle;

    if (this.relationship.partnerInVehicleId) {
      // Let Lucia exit the car cleanly!
      const v = this.vehicles.find((vh) => vh.state.id === this.relationship.partnerInVehicleId);
      if (v) {
        v.rightDoorTimer = 0.55;
        partner.x = v.x + Math.cos(v.yaw) * 2.2;
        partner.z = v.z - Math.sin(v.yaw) * 2.2;
        partner.y = v.y;
      }
      this.relationship.partnerInVehicleId = null;
      this.relationship.partnerState = 'following';
      viceAudio.playDoorLatch();
      this.showToast(`${partnerName} stepped out of the vehicle.`);
      this.pushHud();
      return;
    }

    if (!targetVeh) {
      this.showToast('Get near or inside a vehicle to invite your partner in!');
      return;
    }

    partner.isSitting = false;
    partner.sittingSeatId = null;
    this.relationship.duoActive = true;
    this.partnerBoardingSeq = { vehicle: targetVeh, timer: 0.55, isPartner: true };
    const dist = Math.hypot(targetVeh.x - partner.x, targetVeh.z - partner.z);
    if (dist >= 45) {
      this.relationship.partnerState = 'driving_to_player';
      this.partnerRoute = [];
      this.partnerRouteIdx = 0;
      this.showToast(`${partnerName} is grabbing a ride and driving to you!`);
    } else {
      this.relationship.partnerState = 'coming';
      this.showToast(`Invited ${partnerName} into ${targetVeh.state.name}!`);
    }
    this.pushHud();
  }

  public callPartnerOnPhone() {
    const partnerId: ProtagonistId = this.activeId === 'jason' ? 'lucia' : 'jason';
    const partnerName = partnerId === 'lucia' ? 'Lucia' : 'Jason';
    const partner = this.protagonists[partnerId];
    const player = this.protagonists[this.activeId];

    partner.isSitting = false;
    partner.sittingSeatId = null;
    this.relationship.duoActive = true;
    viceAudio.playPhoneRing();

    const dist = Math.hypot(player.x - partner.x, player.z - partner.z);
    if (dist < 45) {
      this.relationship.partnerState = 'coming';
      this.partnerDrivingVehicle = null;
      this.showToast(`Calling ${partnerName}... Jogging over to you!`);
    } else {
      this.relationship.partnerState = 'driving_to_player';
      this.partnerRoute = computeGpsRoute(partner.x, partner.z, player.x, player.z);
      this.partnerRouteIdx = 0;
      this.showToast(`Calling ${partnerName}... Grabbing a car and driving to your location!`);
    }

    this.messages.push({
      id: `msg_${Date.now()}_a`,
      sender: this.activeId,
      text: `Hey ${partnerName}, calling you — come meet me right now!`,
      time: 'Now',
    });
    this.messages.push({
      id: `msg_${Date.now()}_b`,
      sender: partnerId,
      text: dist < 45 ? `I'm close by, jogging right to you!` : `Hold tight, I'm grabbing a car and driving over!`,
      time: 'Now',
    });

    this.adjustRelationship(3, `Called ${partnerName} to join you`);
    this.pushHud();
  }

  public sendPartnerMessage(text: string, goToVenue?: 'coffee' | 'bar' | 'park') {
    const partnerId: ProtagonistId = this.activeId === 'jason' ? 'lucia' : 'jason';
    const partnerName = partnerId === 'lucia' ? 'Lucia' : 'Jason';
    const partner = this.protagonists[partnerId];
    const player = this.protagonists[this.activeId];

    viceAudio.playUiChime(true);
    this.messages.push({ id: `msg_${Date.now()}_u`, sender: this.activeId, text, time: 'Now' });

    partner.isSitting = false;
    partner.sittingSeatId = null;
    this.relationship.duoActive = true;

    const dist = Math.hypot(player.x - partner.x, player.z - partner.z);
    if (dist < 45) {
      this.relationship.partnerState = 'coming';
    } else {
      this.relationship.partnerState = 'driving_to_player';
      this.partnerRoute = computeGpsRoute(partner.x, partner.z, player.x, player.z);
      this.partnerRouteIdx = 0;
    }

    let reply = dist < 45 ? `Got your text! Jogging over to you now.` : `Got your text! Driving over to meet you now.`;
    if (goToVenue === 'coffee') {
      reply = `Coffee sounds perfect! Let's head to Vice Roast Coffee Shop.`;
      this.setWaypoint(210, 105, 'Vice Roast Coffee Shop');
    } else if (goToVenue === 'bar') {
      reply = `Yes! Let's grab drinks at Neon Anchor Beer Bar!`;
      this.setWaypoint(-210, 210, 'Neon Anchor Beer Bar');
    } else if (goToVenue === 'park') {
      reply = `Love it — let's walk over to Leonida Central Park!`;
      this.setWaypoint(70, 350, 'Leonida Central Park');
    }

    this.messages.push({ id: `msg_${Date.now()}_r`, sender: partnerId, text: reply, time: 'Now' });
    this.adjustRelationship(4, `Messaged ${partnerName}`);
    this.showToast(`${partnerName}: "${reply}"`);
    this.pushHud();
  }

  public handlePartnerDirectChoice(choice: 'follow' | 'coffee' | 'bar' | 'flirt' | 'stay' | 'incar') {
    const partnerId: ProtagonistId = this.activeId === 'jason' ? 'lucia' : 'jason';
    const partnerName = partnerId === 'lucia' ? 'Lucia' : 'Jason';
    const partner = this.protagonists[partnerId];

    if (choice === 'stay') {
      this.relationship.duoActive = false;
      this.relationship.partnerState = 'home';
      this.relationship.partnerInVehicleId = null;
      this.partnerDrivingVehicle = null;
      this.showToast(`${partnerName}: "Alright, I'll hold down the Villa!"`);
    } else if (choice === 'flirt') {
      this.adjustRelationship(6, `Shared a moment with ${partnerName}`);
      this.showToast(`${partnerName}: "Always got your back, partner." (+6% Bond)`);
    } else if (choice === 'incar') {
      this.closeModal();
      this.togglePartnerInCar();
      return;
    } else {
      partner.isSitting = false;
      this.relationship.duoActive = true;
      this.relationship.partnerState = 'following';
      if (choice === 'coffee') {
        this.setWaypoint(210, 105, 'Vice Roast Coffee Shop');
        this.showToast(`${partnerName}: "Let's grab espresso at Vice Roast!"`);
      } else if (choice === 'bar') {
        this.setWaypoint(-210, 210, 'Neon Anchor Beer Bar');
        this.showToast(`${partnerName}: "First round's on us at Neon Anchor!"`);
      } else {
        this.showToast(`${partnerName} is rolling with you now!`);
      }
    }
    this.closeModal();
  }

  public sleepAtVillaBed() {
    const p = this.protagonists[this.activeId];
    p.health = p.maxHealth;
    p.stamina = p.maxStamina;
    p.focusMeter = p.maxFocusMeter;
    this.timeNormalized = 0.31; // 07:30 Sunny Morning!
    viceAudio.playUiChime(true);
    this.showToast('Slept at Jason’s Villa — Morning 07:30, Health & Stamina 100%!');
    this.pushHud();
  }

  private sitDownAt(seat: SeatSpot) {
    const p = this.protagonists[this.activeId];
    p.x = seat.x;
    p.y = seat.y;
    p.z = seat.z;
    p.yaw = seat.yaw;
    p.isSitting = true;
    p.sittingSeatId = seat.id;
    this.currentSeat = seat;
    viceAudio.playUiChime(true);

    if (this.relationship.duoActive && !this.relationship.partnerInVehicleId) {
      const partnerId: ProtagonistId = this.activeId === 'jason' ? 'lucia' : 'jason';
      const partner = this.protagonists[partnerId];
      const nearbySeat = SEAT_SPOTS.find(
        (s) => s.id !== seat.id && s.venue === seat.venue && Math.hypot(s.x - seat.x, s.z - seat.z) < 7
      );
      if (nearbySeat) {
        partner.x = nearbySeat.x;
        partner.y = nearbySeat.y;
        partner.z = nearbySeat.z;
        partner.yaw = nearbySeat.yaw;
        partner.isSitting = true;
        partner.sittingSeatId = nearbySeat.id;
        this.adjustRelationship(5, `Sat together at ${seat.label}`);
      }
    }

    this.showToast(
      seat.venue === 'coffee'
        ? `Seated at ${seat.label}. [E] Order Espresso ($12) · [Space] Stand`
        : seat.venue === 'bar'
        ? `Seated at ${seat.label}. [E] Order Craft Beer ($18) · [Space] Stand`
        : `Sitting on ${seat.label}. [Space / W] Stand Up`
    );
    this.pushHud();
  }

  private standUp() {
    const p = this.protagonists[this.activeId];
    p.isSitting = false;
    p.sittingSeatId = null;
    p.z += Math.cos(p.yaw) * 0.85;
    p.x += Math.sin(p.yaw) * 0.85;
    p.y = getTerrainHeightAt(p.x, p.z);
    this.currentSeat = null;

    const partnerId: ProtagonistId = this.activeId === 'jason' ? 'lucia' : 'jason';
    const partner = this.protagonists[partnerId];
    if (partner.isSitting && this.relationship.duoActive) {
      partner.isSitting = false;
      partner.y = getTerrainHeightAt(partner.x, partner.z);
    }
    this.pushHud();
  }

  public orderSeatedRefreshment() {
    if (!this.currentSeat) return;
    const isCoffee = this.currentSeat.venue === 'coffee';
    const cost = isCoffee ? 12 : 18;
    if (this.cash < cost) {
      this.showToast(`Need $${cost}!`);
      return;
    }
    this.cash -= cost;
    const p = this.protagonists[this.activeId];
    p.health = Math.min(p.maxHealth, p.health + 25);
    p.stamina = p.maxStamina;
    p.focusMeter = p.maxFocusMeter;
    if (this.relationship.duoActive) {
      this.adjustRelationship(6, isCoffee ? 'Coffee date together' : 'Drinks at Neon Anchor Bar');
    }
    viceAudio.playCashRegister();
    this.showToast(isCoffee ? 'Cuban Espresso (-$12): Full Stamina & Focus!' : 'Vice Craft Beer (-$18): +25 HP & +6% Bond!');
    this.pushHud();
  }

  public toggleSlowMo() {
    const p = this.protagonists[this.activeId];
    if (!this.slowMoActive && p.focusMeter < 15) {
      this.showToast('Focus meter too low!');
      return;
    }
    this.slowMoActive = !this.slowMoActive;
    viceAudio.playUiChime(this.slowMoActive);
    this.pushHud();
  }

  private syncProtagonistWeapons(p: ProtagonistState) {
    p.pistols = p.weapons.filter((w) => w.category === 'pistol').slice(0, 2);
    p.longGun = p.weapons.find((w) => w.category === 'smg' || w.category === 'shotgun' || w.category === 'rifle' || w.category === 'sniper' || w.category === 'heavy') ?? null;
    if (p.equippedWeaponId === 'fists') {
      p.equippedSlot = 'unarmed';
    } else {
      const active = p.weapons.find((w) => w.id === p.equippedWeaponId);
      if (!active) {
        p.equippedWeaponId = 'fists';
        p.equippedSlot = 'unarmed';
      } else if (active.category === 'pistol') {
        p.equippedSlot = p.pistols[1]?.id === active.id ? 'pistol1' : 'pistol0';
      } else {
        p.equippedSlot = 'longgun';
      }
    }
  }

  public selectWeapon(weaponId: string) {
    const p = this.protagonists[this.activeId];
    if (weaponId === 'fists' || weaponId === 'unarmed') {
      p.equippedWeaponId = 'fists';
      p.equippedSlot = 'unarmed';
      viceAudio.playUiChime(false);
      this.showToast('Equipped: Fists (Unarmed)');
      this.pushHud();
      return;
    }
    if (weaponId === 'grenades') {
      if (p.grenades <= 0) {
        this.showToast('No Frag Grenades! Buy them at Vice Armory.');
        return;
      }
      p.equippedWeaponId = 'grenades';
      p.equippedSlot = 'unarmed';
      viceAudio.playUiChime(true);
      this.showToast(`Equipped: Frag Grenades (${p.grenades}) — Press [H] or Click to throw!`);
      this.pushHud();
      return;
    }
    if (weaponId === 'molotov') {
      if (p.molotovs <= 0) {
        this.showToast('No Molotov Cocktails! Buy them at Vice Armory.');
        return;
      }
      p.equippedWeaponId = 'molotov';
      p.equippedSlot = 'unarmed';
      viceAudio.playUiChime(true);
      this.showToast(`Equipped: Molotov (${p.molotovs}) — Press [H] or Click to throw!`);
      this.pushHud();
      return;
    }
    const found = p.weapons.find((w) => w.id === weaponId);
    if (!found) return;
    p.equippedWeaponId = found.id;
    this.syncProtagonistWeapons(p);
    viceAudio.playUiChime(true);
    this.showToast(`Equipped: ${found.name}`);
    this.pushHud();
  }

  public equipSlot(slot: ProtagonistState['equippedSlot']) {
    const p = this.protagonists[this.activeId];
    if (slot === 'unarmed') {
      this.selectWeapon('fists');
      return;
    }
    if (slot === 'pistol0' && p.pistols[0]) this.selectWeapon(p.pistols[0].id);
    else if (slot === 'pistol1' && p.pistols[1]) this.selectWeapon(p.pistols[1].id);
    else if (slot === 'longgun' && p.longGun) this.selectWeapon(p.longGun.id);
  }

  public reloadWeapon() {
    const p = this.protagonists[this.activeId];
    const w = this.getActiveWeapon(p);
    if (!w || w.category === 'melee') return;
    w.ammo = w.maxAmmo;
    p.actionState = 'reload';
    this.actionTimer = 0.55;
    viceAudio.playUiChime(true);
    this.showToast(`Reloaded ${w.name}`);
    this.pushHud();
  }

  public clearWaypoint() {
    this.waypoint = null;
    this.pushHud();
  }

  public cycleRadioStation() {
    const stations: RadioStationId[] = ['Off', 'Vice Wave FM', 'Calle 8 Latin', 'Leonida Talk Podcast'];
    const idx = stations.indexOf(this.radioStation);
    this.radioStation = stations[(idx + 1) % stations.length];
    viceAudio.setRadioStation(this.radioStation);
    viceAudio.playUiChime(true);
    this.showToast(`Radio: ${this.radioStation}`);
    this.pushHud();
  }

  public toggleEarphones() {
    this.earphonesOn = !this.earphonesOn;
    if (this.earphonesOn && this.radioStation === 'Off') {
      this.radioStation = 'Vice Wave FM';
      viceAudio.setRadioStation(this.radioStation);
    }
    viceAudio.playUiChime(this.earphonesOn);
    this.showToast(this.earphonesOn ? `Earphones ON (${this.radioStation})` : 'Earphones removed');
    this.pushHud();
  }

  public toggleUmbrella() {
    const p = this.protagonists[this.activeId];
    if (this.drivingVehicle || p.inWater) return;
    p.umbrellaOpen = !p.umbrellaOpen;
    viceAudio.playUiChime(p.umbrellaOpen);
    this.showToast(p.umbrellaOpen ? 'Umbrella opened' : 'Umbrella closed');
    this.pushHud();
  }

  public shaveBeard() {
    const p = this.protagonists[this.activeId];
    if (this.cash < 35) {
      this.showToast('Need $35 for a clean shave & trim!');
      return;
    }
    this.cash -= 35;
    p.beardLevel = 0;
    viceAudio.playCashRegister();
    this.showToast(`${p.name} got a fresh razor shave & beard trim!`);
    this.pushHud();
  }

  public useTraumaKit() {
    const p = this.protagonists[this.activeId];
    if (p.traumaKits <= 0) {
      this.showToast('Out of Trauma Kits! Buy them at Vice Armory or Dark Web.');
      return;
    }
    p.traumaKits--;
    p.bleeding = false;
    p.health = Math.min(p.maxHealth, p.health + 55);
    p.actionState = 'eat';
    this.actionTimer = 0.7;
    viceAudio.playUiChime(true);
    this.showToast('Trauma Kit applied: Bleeding stopped & +55 HP!');
    this.pushHud();
  }

  public usePainkiller() {
    const p = this.protagonists[this.activeId];
    if (p.painkillers <= 0) {
      this.showToast('Out of Painkillers! Buy them at Vice Armory.');
      return;
    }
    p.painkillers--;
    p.painkillerTimer = 30;
    p.health = Math.min(p.maxHealth, p.health + 20);
    p.actionState = 'eat';
    this.actionTimer = 0.45;
    viceAudio.playUiChime(true);
    this.showToast('Painkillers active (30s dmg reduction +20 HP)');
    this.pushHud();
  }

  public eatBurger() {
    const p = this.protagonists[this.activeId];
    if (p.burgers <= 0) {
      this.showToast('No Burger Shot Bleeder meals in bag!');
      return;
    }
    p.burgers--;
    p.health = Math.min(p.maxHealth, p.health + 40);
    p.stamina = p.maxStamina;
    p.actionState = 'eat';
    this.actionTimer = 0.65;
    viceAudio.playUiChime(true);
    this.showToast('Ate Burger Shot Bleeder (+40 HP, Stamina 100%)');
    this.pushHud();
  }

  public cleanEquippedWeapon() {
    const p = this.protagonists[this.activeId];
    const w = this.getActiveWeapon(p);
    if (!w) {
      this.showToast('Equip a firearm to clean & oil it!');
      return;
    }
    w.condition = 100;
    p.actionState = 'reload';
    this.actionTimer = 0.65;
    viceAudio.playUiChime(true);
    this.showToast(`${w.name} cleaned & oiled (Condition 100%)`);
    this.pushHud();
  }

  public buyAttachment(kind: 'suppressor' | 'scope' | 'extendedMag' | 'traumakit' | 'painkillers' | 'clean_kit') {
    const costs: Record<string, number> = {
      suppressor: 420,
      scope: 360,
      extendedMag: 320,
      traumakit: 220,
      painkillers: 140,
      clean_kit: 110,
    };
    const cost = costs[kind];
    if (this.cash < cost) {
      this.showToast(`Need $${cost} cash!`);
      return;
    }
    const p = this.protagonists[this.activeId];
    if (kind === 'traumakit') {
      p.traumaKits++;
      this.cash -= cost;
      this.showToast('Bought Trauma Kit (+1)');
    } else if (kind === 'painkillers') {
      p.painkillers += 2;
      this.cash -= cost;
      this.showToast('Bought Painkillers (+2)');
    } else if (kind === 'clean_kit') {
      const w = this.getActiveWeapon(p) || p.longGun || p.pistols[0];
      if (!w) {
        this.showToast('Own a firearm to use Cleaning Kit!');
        return;
      }
      w.condition = 100;
      this.cash -= cost;
      this.showToast(`${w.name} restored to 100% Condition!`);
    } else {
      const w = this.getActiveWeapon(p) || p.longGun || p.pistols[0];
      if (!w) {
        this.showToast('Own or equip a firearm first!');
        return;
      }
      if (w.attachments[kind]) {
        this.showToast(`${w.name} already has ${kind}!`);
        return;
      }
      w.attachments[kind] = true;
      if (kind === 'suppressor') w.silenced = true;
      if (kind === 'scope') w.range += 22;
      if (kind === 'extendedMag') {
        w.maxAmmo += 10;
        w.ammo = w.maxAmmo;
      }
      this.cash -= cost;
      this.showToast(`Installed ${kind} on ${w.name}!`);
    }
    viceAudio.playCashRegister();
    this.pushHud();
  }

  public cycleSeatInsideVehicle() {
    if (!this.drivingVehicle) return;
    const seats: VehicleState['seat'][] = ['driver', 'passenger', 'rear'];
    const idx = seats.indexOf(this.drivingVehicle.state.seat);
    this.drivingVehicle.state.seat = seats[(idx + 1) % seats.length];
    viceAudio.playDoorLatch();
    this.showToast(`Switched seat: ${this.drivingVehicle.state.seat.replace('_', ' ')}`);
    this.pushHud();
  }

  public repairNearbyVehicleHood() {
    const veh = this.drivingVehicle || this.nearbyTrunkVehicle;
    if (!veh) {
      this.showToast('Stand near a damaged vehicle to pop hood & repair!');
      return;
    }
    if (this.cash < 120) {
      this.showToast('Need $120 for roadside engine & tire repair!');
      return;
    }
    this.cash -= 120;
    veh.state.hoodOpen = true;
    veh.state.health = veh.state.maxHealth;
    veh.state.tireFlat = false;
    this.protagonists[this.activeId].actionState = 'lockpick';
    this.actionTimer = 0.8;
    viceAudio.playCashRegister();
    this.showToast(`Repaired ${veh.state.name} engine & tires (-$120)!`);
    this.pushHud();
  }

  public depositBank(amount: number) {
    const amt = Math.min(this.cash, Math.max(0, Math.floor(amount)));
    if (amt <= 0) {
      this.showToast('Not enough cash to deposit!');
      return;
    }
    this.cash -= amt;
    this.bankBalance += amt;
    viceAudio.playCashRegister();
    this.showToast(`Deposited $${amt.toLocaleString()} to Maze/Leonida Bank!`);
    this.pushHud();
  }

  public withdrawBank(amount: number) {
    const amt = Math.min(this.bankBalance, Math.max(0, Math.floor(amount)));
    if (amt <= 0) {
      this.showToast('Insufficient bank funds!');
      return;
    }
    this.bankBalance -= amt;
    this.cash += amt;
    viceAudio.playCashRegister();
    this.showToast(`Withdrew $${amt.toLocaleString()} cash!`);
    this.pushHud();
  }

  public buyBusiness(id: string) {
    const b = this.businesses.find((biz) => biz.id === id);
    if (!b || b.owned) return;
    if (this.bankBalance >= b.cost) {
      this.bankBalance -= b.cost;
    } else if (this.cash >= b.cost) {
      this.cash -= b.cost;
    } else {
      this.showToast(`Need $${b.cost.toLocaleString()} in Bank or Cash!`);
      return;
    }
    b.owned = true;
    this.clout += 150;
    viceAudio.playCashRegister();
    this.showToast(`Acquired ${b.name}! Paying +$${b.dailyIncome}/cycle passively.`);
    this.pushHud();
  }

  public tradeStock(symbol: string, side: 'buy' | 'sell') {
    const st = this.stocks.find((s) => s.symbol === symbol);
    if (!st) return;
    if (side === 'buy') {
      if (this.bankBalance < st.price) {
        this.showToast(`Need $${st.price.toFixed(0)} in Bank Account to buy ${st.symbol}!`);
        return;
      }
      this.bankBalance -= Math.round(st.price);
      st.sharesOwned++;
      viceAudio.playUiChime(true);
      this.showToast(`Bought 1 ${st.symbol} @ $${st.price.toFixed(1)}`);
    } else {
      if (st.sharesOwned <= 0) {
        this.showToast(`No ${st.symbol} shares to sell!`);
        return;
      }
      st.sharesOwned--;
      this.bankBalance += Math.round(st.price);
      viceAudio.playCashRegister();
      this.showToast(`Sold 1 ${st.symbol} for +$${st.price.toFixed(0)}`);
    }
    this.pushHud();
  }

  public orderDarkWebItem(itemKey: DarkWebDrop['itemKey'], cost: number) {
    if (this.darkWebDrop) {
      this.showToast(`Pick up your active Dead-Drop crate in Wynwood/Docks first!`);
      return;
    }
    if (this.bankBalance < cost && this.cash < cost) {
      this.showToast(`Need $${cost} in Bank or Cash!`);
      return;
    }
    if (this.bankBalance >= cost) this.bankBalance -= cost;
    else this.cash -= cost;

    const dropSpots = [
      { x: 162, z: 168, name: 'Downtown Alley Stash' },
      { x: -135, z: 165, name: 'West Avenue Underpass Stash' },
      { x: 295, z: 325, name: 'Vice Harbor Pier 4 Crate' },
      { x: -245, z: -178, name: 'Northport Chop Shop Drop' },
    ];
    const spot = dropSpots[Math.floor(Math.random() * dropSpots.length)];
    const drop: DarkWebDrop = {
      id: `drop_${Date.now()}`,
      label: `${itemKey.toUpperCase()} (${spot.name})`,
      itemKey,
      x: spot.x,
      z: spot.z,
    };
    this.darkWebDrop = drop;
    if (this.darkWebDropMesh) {
      this.scene.remove(this.darkWebDropMesh);
    }
    this.darkWebDropMesh = createDeadDropCrateMesh();
    this.darkWebDropMesh.position.set(spot.x, LAND_Y, spot.z);
    this.scene.add(this.darkWebDropMesh);
    this.setWaypoint(spot.x, spot.z, `Dead-Drop: ${spot.name}`);
    viceAudio.playUiChime(true);
    this.showToast(`Dark Web order placed! Retrieve green crate at ${spot.name}.`);
    this.pushHud();
  }

  // ---- BURGER SHOT CAREER SYSTEM ----
  public applyBurgerShot() {
    if (this.burgerJob.banned) {
      this.showToast('You are permanently banned from Burger Shot!');
      return;
    }
    this.burgerJob.hired = true;
    this.clout += 25;
    viceAudio.playUiChime(true);
    this.showToast('Hired as Burger Shot Line Crew! Put on your Uniform to clock in.');
    this.pushHud();
  }

  public putOnBurgerUniform() {
    const p = this.protagonists[this.activeId];
    p.wearingBurgerUniform = !p.wearingBurgerUniform;
    viceAudio.playUiChime(p.wearingBurgerUniform);
    this.showToast(p.wearingBurgerUniform ? 'Burger Shot Uniform & Paper Cap equipped!' : 'Changed back to street clothes');
    this.pushHud();
  }

  public clockInBurgerShot() {
    if (!this.burgerJob.hired || this.burgerJob.banned) return;
    const p = this.protagonists[this.activeId];
    if (!p.wearingBurgerUniform) {
      this.showToast('Put on your Burger Shot Uniform first!');
      return;
    }
    this.burgerJob.clockedIn = !this.burgerJob.clockedIn;
    viceAudio.playUiChime(this.burgerJob.clockedIn);
    this.showToast(this.burgerJob.clockedIn ? 'Clocked IN at Burger Shot! Pick a station.' : 'Clocked OUT.');
    this.pushHud();
  }

  public completeBurgerShiftTask(task: 'cashier' | 'grill' | 'mop', pay: number) {
    if (!this.burgerJob.clockedIn) {
      this.showToast('Clock in before starting a shift!');
      return;
    }
    const p = this.protagonists[this.activeId];
    this.cash += pay;
    this.burgerJob.shiftsCompleted++;
    this.clout += 35;
    if (task === 'grill') {
      viceAudio.playSizzle();
      p.actionState = 'cook';
      p.burgers = Math.min(5, p.burgers + 1);
    } else if (task === 'mop') {
      viceAudio.playMop();
      p.actionState = 'mop';
    } else {
      viceAudio.playCashRegister();
      p.actionState = 'idle';
    }
    this.actionTimer = 1.1;

    if (this.burgerJob.shiftsCompleted >= 5 && !this.burgerJob.isShiftManager) {
      this.burgerJob.isShiftManager = true;
      p.burgers = Math.min(5, p.burgers + 2);
      this.showToast(`PROMOTED TO SHIFT MANAGER! +$${pay} & Free Bleeder Meals!`);
    } else {
      this.showToast(`Burger Shot ${task.toUpperCase()} complete! +$${pay}`);
    }
    this.pushHud();
  }

  public launchBurgerDelivery() {
    if (!this.burgerJob.clockedIn) {
      this.showToast('Clock in at Burger Shot first!');
      return;
    }
    const target = DELIVERY_TARGETS[Math.floor(Math.random() * DELIVERY_TARGETS.length)];
    this.burgerJob.activeDelivery = {
      targetX: target.x,
      targetZ: target.z,
      customerName: target.customerName,
      timer: 75,
      reward: 320,
      parkedNearTarget: false,
    };

    // Spawn an orange Burger Shot scooter right outside!
    const scooterId = `faggio_bs_${Date.now()}`;
    const scooterState: VehicleState = {
      id: scooterId,
      name: 'Burger Shot Faggio Scooter',
      tier: 'bike',
      fuelType: 'petrol',
      fuel: 100,
      maxFuel: 100,
      health: 100,
      maxHealth: 100,
      speed: 0,
      maxSpeed: 32,
      hotwired: true,
      needsKeyCloner: false,
      gpsTrackerActive: false,
      gpsTimer: 0,
      headlightsOn: true,
      leftBlinker: false,
      rightBlinker: false,
      windowsDown: false,
      trunkOpen: false,
      hoodOpen: false,
      convertibleOpen: false,
      roofIsConvertible: false,
      seat: 'driver',
      ducking: false,
      wheelieActive: false,
      tireFlat: false,
      anchorDropped: false,
      trunkWeapons: [],
      trunkLoot: 0,
      trunkOutfits: [],
      flooded: false,
      submersionDepth: 0,
      turboLevel: 0,
      wheelStyle: 'stock',
      colorHex: '#f97316',
    };
    const rig = createVehicleRig('bike', '#f97316', this.textures.contactShadow, this.isSoftwareGl);
    rig.root.position.set(70, LAND_Y, 224);
    this.scene.add(rig.root);
    this.vehicles.push({
      state: scooterState,
      rig,
      x: 70,
      y: LAND_Y,
      z: 224,
      yaw: Math.PI / 2,
      vy: 0,
      vx: 0,
      vz: 0,
      angVel: 0,
      steerAngle: 0,
      wheelSpin: 0,
      isTraffic: false,
      isPoliceSpawn: false,
      isPrecinctUnit: false,
      trafficDir: 1,
      trafficAxis: 'z',
      driverPresent: false,
      leftDoorAngle: 0,
      rightDoorAngle: 0,
      leftDoorTimer: 0,
      rightDoorTimer: 0,
    });

    this.setWaypoint(target.x, target.z, `Deliver to ${target.customerName}`);
    this.closeModal();
    this.showToast(`Scooter parked outside! Deliver to ${target.customerName} in 75s for +$320!`);
  }

  public stealBurgerRegister() {
    const loot = 650 + Math.floor(Math.random() * 450);
    this.cash += loot;
    this.profile.robberiesCompleted++;
    this.profile.violencePoints += 10;
    this.updateCriminalProfileLabel();
    this.addWantedStars(2);
    viceAudio.playCashRegister();
    this.closeModal();
    this.showToast(`Robbed Burger Shot Register (+$${loot})! 2-Star Police Alert!`);
  }

  public quitBurgerShotChaos() {
    const p = this.protagonists[this.activeId];
    this.burgerJob.hired = false;
    this.burgerJob.clockedIn = false;
    this.burgerJob.banned = true;
    this.burgerJob.activeDelivery = null;
    p.wearingBurgerUniform = false;
    this.clout += 120;
    this.cash += 450;
    this.addWantedStars(2);
    viceAudio.playImpact(true);
    this.closeModal();
    this.showToast(`"I QUIT!" Smashed counter, grabbed $450 & triggered 2-Star Wanted!`);
  }

  public setWaypoint(x: number, z: number, label: string) {
    this.waypoint = { x, z, label };
    this.showToast(`GPS Waypoint: ${label}`);
    this.pushHud();
  }

  public selectMission(id: string) {
    const m = this.missions.find((ms) => ms.id === id);
    if (!m) return;
    this.activeMissionId = m.id;
    m.stage = 'active';
    this.setWaypoint(m.targetX, m.targetZ, m.title);
    this.closeModal();
  }

  public getActivities(): ActivityDef[] { return this.activities; }
  public getSocialPosts(): SocialPost[] { return this.socialPosts; }
  public getMissions(): MissionDef[] { return this.missions; }
  public getJobs(): JobDef[] { return CITY_JOBS; }

  public launchActivityFromPhone(activityId: string) {
    const act = this.activities.find((a) => a.id === activityId);
    if (!act) return;
    this.setWaypoint(act.x, act.z, act.name);
    this.openModal('minigame', { activity: act });
  }

  public completeJobShift(jobId: string, bonus: number) {
    const job = CITY_JOBS.find((j) => j.id === jobId);
    if (!job) return;
    const earned = job.pay + bonus * 85;
    this.cash += earned;
    const p = this.protagonists[this.activeId];
    p.stats.stamina = Math.min(100, p.stats.stamina + 2);
    viceAudio.playCashRegister();
    this.showToast(`${job.name} Complete! ${p.name} earned +$${earned.toLocaleString()}`);
    this.closeModal();
  }

  public completeMiniGame(activityId: string, success: boolean, scoreBonus = 0) {
    const act = this.activities.find((a) => a.id === activityId);
    const p = this.protagonists[this.activeId];
    if (!act) return;
    if (success) {
      act.completedCount++;
      const boost = 5 + Math.min(5, scoreBonus);
      if (act.statReward === 'muscle') {
        p.stats.muscle = Math.min(100, p.stats.muscle + boost);
        this.showToast(`${act.name} Complete! Muscle +${boost}`);
      } else if (act.statReward === 'stamina') {
        p.stats.stamina = Math.min(100, p.stats.stamina + boost);
        p.maxStamina = 100 + p.stats.stamina * 0.5;
        this.showToast(`${act.name} Complete! Stamina +${boost}`);
      } else if (act.statReward === 'focus') {
        p.stats.focus = Math.min(100, p.stats.focus + boost);
        p.maxFocusMeter = 100 + p.stats.focus * 0.5;
        this.showToast(`${act.name} Complete! Focus +${boost}`);
      } else if (act.statReward === 'relationship') {
        this.adjustRelationship(8, `Great time together at ${act.name}`);
      } else if (act.statReward === 'cash') {
        const win = 650 + scoreBonus * 150;
        this.cash += win;
        this.showToast(`${act.name} Won! +$${win.toLocaleString()}`);
      }
      if (this.relationship.duoActive) {
        this.adjustRelationship(3, `Shared ${act.name} together`);
      }
      viceAudio.playCashRegister();
    } else {
      this.showToast(`${act.name} ended — try again anytime!`);
    }
    this.closeModal();
  }

  public resolveHotwire(vehicleId: string, success: boolean) {
    const veh = this.vehicles.find((v) => v.state.id === vehicleId);
    if (!veh) return;
    if (success) {
      veh.state.hotwired = true;
      this.profile.carsBoosted++;
      if (veh.state.needsKeyCloner) {
        veh.state.gpsTrackerActive = true;
        veh.state.gpsTimer = 65;
        this.showToast(`Key Cloned! GPS active — drive to Fence within 65s!`);
        this.setWaypoint(FENCE_SPOTS[0].x, FENCE_SPOTS[0].z, 'Wynwood Chop Shop Fence');
      }
      this.enterVehicleWithDoorAnim(veh);
      this.triggerCrimeEvent(veh.x, veh.z, 1, false);
    } else {
      this.showToast('Hotwire alarm tripped!');
      this.triggerCrimeEvent(veh.x, veh.z, 1, false);
    }
    this.closeModal();
  }

  public resolveRobbery(interiorId: string, amount: number, cleanStealth: boolean) {
    const intInfo = this.worldInteriors.find((i) => i.id === interiorId);
    if (intInfo) intInfo.robbedCooldown = 90;
    const p = this.protagonists[this.activeId];
    p.duffelBag.lootValue += amount;
    this.cash += amount;
    this.profile.robberiesCompleted++;
    if (cleanStealth) {
      this.profile.stealthPoints += 12;
      this.showToast(`Clean Score +$${amount.toLocaleString()}! Wipe CCTV before leaving.`);
    } else {
      this.profile.violencePoints += 12;
      if (intInfo?.hasCCTV && !intInfo.cctvWiped) {
        this.wanted.cctvRecorded = true;
        this.wanted.cctvBuildingId = interiorId;
        this.wanted.disguiseNeeded = true;
        this.addWantedStars(2);
      }
      this.showToast(`Robbery +$${amount.toLocaleString()}!`);
    }
    this.updateCriminalProfileLabel();
    viceAudio.playCashRegister();
    this.checkMissionProgress();
    this.closeModal();
  }

  public wipeCctvFootage(interiorId: string) {
    const intInfo = this.worldInteriors.find((i) => i.id === interiorId);
    if (intInfo) intInfo.cctvWiped = true;
    this.wanted.cctvRecorded = false;
    this.wanted.cctvBuildingId = null;
    this.profile.cctvWiped++;
    this.profile.stealthPoints += 10;
    this.updateCriminalProfileLabel();
    if (this.wanted.stars > 0) this.wanted.evadeProgress = Math.min(100, this.wanted.evadeProgress + 45);
    viceAudio.playUiChime(true);
    this.showToast('CCTV Footage Erased!');
    this.checkMissionProgress();
    this.closeModal();
  }

  public handleNpcChoice(npcId: string, action: 'greet' | 'taunt' | 'defuse' | 'provoke') {
    const npc = this.npcs.find((n) => n.id === npcId);
    if (!npc) return;
    if (action === 'greet') {
      npc.mood = Math.min(100, npc.mood + 20);
      this.showToast(`${npc.name}: "Looking sharp, Vice style!"`);
    } else if (action === 'defuse') {
      if (npc.isWitness) {
        npc.isWitness = false;
        npc.rig.witnessMarker.visible = false;
        this.wanted.witnessActive = false;
        this.wanted.witnessProgress = 0;
        this.profile.witnessesIntimidated++;
        this.profile.stealthPoints += 8;
        this.updateCriminalProfileLabel();
        this.showToast(`${npc.name} hung up 911!`);
      } else {
        this.showToast(`${npc.name}: "Alright, we're cool."`);
      }
    } else if (action === 'taunt') {
      npc.mood -= 30;
      this.showToast(`${npc.name}: "Watch who you're talking to!"`);
    } else if (action === 'provoke') {
      npc.mood = -80;
      npc.hostile = true;
      npc.targetProtagonist = this.activeId;
      this.profile.violencePoints += 5;
      this.updateCriminalProfileLabel();
      this.showToast(`${npc.name} is fighting back!`);
    }
    this.closeModal();
  }

  public changeAppearance(outfit: OutfitId, hair: HairId, clearHeat: boolean) {
    const p = this.protagonists[this.activeId];
    p.outfit = outfit;
    p.hair = hair;
    if (clearHeat && this.wanted.stars > 0) {
      this.wanted.disguiseNeeded = false;
      this.wanted.evading = true;
      this.wanted.evadeProgress = Math.min(100, this.wanted.evadeProgress + 55);
      this.showToast('New look! Police recognition reset.');
    } else {
      this.showToast(`Equipped ${outfit.toUpperCase()} outfit & ${hair} cut`);
    }
    this.pushHud();
  }

  public swapWeaponWithTrunk(weaponId: string, direction: 'toTrunk' | 'fromTrunk') {
    const veh = this.nearbyTrunkVehicle || this.drivingVehicle;
    if (!veh) return;
    const p = this.protagonists[this.activeId];
    if (direction === 'toTrunk') {
      const wIdx = p.weapons.findIndex((w) => w.id === weaponId);
      if (wIdx >= 0) {
        const [removed] = p.weapons.splice(wIdx, 1);
        veh.state.trunkWeapons.push(removed);
        if (p.equippedWeaponId === weaponId) p.equippedWeaponId = 'fists';
        this.syncProtagonistWeapons(p);
      }
    } else {
      const tIdx = veh.state.trunkWeapons.findIndex((w) => w.id === weaponId);
      if (tIdx < 0) return;
      const item = veh.state.trunkWeapons[tIdx];
      if (!p.weapons.some((w) => w.id === item.id)) {
        veh.state.trunkWeapons.splice(tIdx, 1);
        p.weapons.push(item);
        p.equippedWeaponId = item.id;
        this.syncProtagonistWeapons(p);
      } else {
        this.showToast(`Already carrying ${item.name}!`);
        return;
      }
    }
    viceAudio.playUiChime(true);
    this.pushHud();
  }

  public buyWeaponStoreItem(id: string) {
    const p = this.protagonists[this.activeId];
    const costs: Record<string, number> = {
      armor: 300,
      bat: 180,
      pistol9: 550,
      smg: 980,
      shotgun: 1250,
      carbine: 1850,
      sniper: 2600,
      grenades: 450,
      molotov: 420,
      rpg: 4200,
      ammo: 180,
    };
    const cost = costs[id] ?? 0;
    if (cost <= 0) return;
    if (this.cash < cost) {
      this.showToast(`Need $${cost.toLocaleString()} cash!`);
      return;
    }

    if (id === 'armor') {
      p.armor = 100;
      this.cash -= cost;
      this.showToast('Heavy Armor restored to 100%!');
    } else if (id === 'grenades') {
      p.grenades += 3;
      this.cash -= cost;
      this.showToast('+3 Frag Grenades added!');
    } else if (id === 'molotov') {
      p.molotovs += 3;
      this.cash -= cost;
      this.showToast('+3 Molotov Cocktails added!');
    } else if (id === 'ammo') {
      for (const w of p.weapons) {
        if (w.category !== 'melee') w.ammo = w.maxAmmo;
      }
      if (p.weapons.some((w) => w.id === 'rpg')) p.rpgAmmo += 3;
      this.cash -= cost;
      this.showToast('All carried weapons refilled with fresh ammo!');
    } else if (WEAPON_CATALOG[id]) {
      const existing = p.weapons.find((w) => w.id === id);
      if (existing) {
        if (id === 'rpg') {
          p.rpgAmmo += 3;
          existing.ammo = existing.maxAmmo;
          this.cash -= cost;
          this.showToast('+3 RPG Rockets stocked!');
        } else if (existing.category !== 'melee') {
          existing.ammo = existing.maxAmmo;
          this.cash -= cost;
          this.showToast(`Refilled ${existing.name} magazine!`);
        } else {
          this.showToast(`Already carrying ${existing.name}!`);
          return;
        }
      } else {
        const w = cloneWeapon(WEAPON_CATALOG[id]);
        p.weapons.push(w);
        if (id === 'rpg') p.rpgAmmo = Math.max(p.rpgAmmo, 3);
        p.equippedWeaponId = w.id;
        this.syncProtagonistWeapons(p);
        this.cash -= cost;
        this.showToast(`Purchased & equipped ${w.name}!`);
      }
    }
    viceAudio.playCashRegister();
    this.pushHud();
  }

  public buyClothesOutfit(outfit: OutfitId, hair: HairId, clearHeat: boolean, cost: number) {
    if (cost > 0 && this.cash < cost) {
      this.showToast(`Need $${cost} cash!`);
      return;
    }
    this.cash -= cost;
    this.changeAppearance(outfit, hair, clearHeat);
  }

  public buyBungalow(businessId: string) {
    this.buyBusiness(businessId);
  }

  public updateControlSettings(partial: Partial<ControlSettings>) {
    this.controlSettings = { ...this.controlSettings, ...partial };
    this.pushHud();
  }

  public setTouchMoveInput(nx: number, nz: number) {
    this.touchMoveX = THREE.MathUtils.clamp(nx, -1, 1);
    this.touchMoveZ = THREE.MathUtils.clamp(nz, -1, 1);
  }

  public addCameraLookDelta(dyaw: number, dpitch: number) {
    this.camYaw -= dyaw;
    this.camPitch = THREE.MathUtils.clamp(this.camPitch + dpitch, -0.35, 0.85);
  }

  public triggerPrimaryAttackPublic() {
    this.triggerPrimaryAttack();
  }

  public setSprintingTouch(active: boolean) {
    this.touchSprinting = active;
  }

  public triggerJumpTouch() {
    const p = this.protagonists[this.activeId];
    if (this.drivingVehicle || p.isSitting || p.inWater || !this.onGround) return;
    this.playerVy = 7.2;
    this.onGround = false;
    p.crouching = false;
    p.prone = false;
    p.actionState = 'jump';
  }

  public triggerSecondaryAim(active: boolean) {
    this.aiming = active;
  }

  public triggerVehicleInteractPublic() {
    this.toggleVehicleEnterExit();
  }

  public triggerContextInteractPublic() {
    this.triggerContextInteract();
  }

  public buyFenceItem(item: 'keycloner' | 'armor' | 'silenced9' | 'deagle' | 'shotgun' | 'smg' | 'carbine' | 'upgrade' | 'grenades') {
    if (item === 'armor' || item === 'shotgun' || item === 'smg' || item === 'carbine' || item === 'grenades') {
      this.buyWeaponStoreItem(item);
      return;
    }
    const costs: Record<string, number> = {
      keycloner: 450,
      silenced9: 650,
      deagle: 850,
      upgrade: 550,
    };
    const cost = costs[item];
    if (this.cash < cost) {
      this.showToast(`Need $${cost} cash!`);
      return;
    }
    const p = this.protagonists[this.activeId];
    if (item === 'keycloner') {
      p.duffelBag.hasKeyCloner = true;
      this.cash -= cost;
      this.showToast('Bought Luxury Key Cloner!');
    } else if (item === 'upgrade') {
      const w = this.getActiveWeapon(p) || p.weapons.find((x) => x.category !== 'melee');
      if (!w) {
        this.showToast('Own a firearm to upgrade!');
        return;
      }
      if ((w.upgradeLevel ?? 0) >= 3) {
        this.showToast(`${w.name} is already Max Tier (Mk.III)!`);
        return;
      }
      w.upgradeLevel = (w.upgradeLevel ?? 0) + 1;
      w.damage = Math.round(w.damage * 1.24);
      w.maxAmmo += 5;
      w.ammo = w.maxAmmo;
      this.cash -= cost;
      this.showToast(`Upgraded ${w.name} to Mk.${w.upgradeLevel}!`);
    } else {
      const w = cloneWeapon(WEAPON_CATALOG[item]);
      if (!p.weapons.some((x) => x.id === w.id)) {
        p.weapons.push(w);
      }
      p.equippedWeaponId = w.id;
      this.syncProtagonistWeapons(p);
      this.cash -= cost;
      this.showToast(`Purchased ${w.name}`);
    }
    viceAudio.playCashRegister();
    this.pushHud();
  }

  // ================= COMBAT, GRENADES, MOLOTOVS, RPG & TRUE LOS WITNESS POLICE =================

  private getActiveWeapon(p: ProtagonistState): WeaponItem | null {
    if (p.equippedWeaponId === 'fists' || p.equippedWeaponId === 'grenades' || p.equippedWeaponId === 'molotov') {
      return null;
    }
    return p.weapons.find((w) => w.id === p.equippedWeaponId) ?? null;
  }

  public throwGrenade() {
    if (this.drivingVehicle) return;
    const p = this.protagonists[this.activeId];
    if (p.grenades <= 0) {
      this.showToast('Out of Grenades! Buy more at Vice Armory Gun Shop.');
      return;
    }
    p.grenades--;
    this.attackSwingTimer = 0.25;
    const dirX = -Math.sin(this.camYaw);
    const dirZ = -Math.cos(this.camYaw);
    p.yaw = Math.atan2(dirX, dirZ);

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.4, metalness: 0.5 })
    );
    mesh.position.set(p.x + dirX * 0.6, p.y + 1.5, p.z + dirZ * 0.6);
    this.scene.add(mesh);
    this.grenades.push({
      mesh,
      x: p.x + dirX * 0.6,
      y: p.y + 1.5,
      z: p.z + dirZ * 0.6,
      vx: dirX * 15,
      vy: 7.5,
      vz: dirZ * 15,
      fuse: 1.5,
      isMolotov: false,
    });
    this.pushHud();
  }

  public throwMolotov() {
    if (this.drivingVehicle) return;
    const p = this.protagonists[this.activeId];
    if (p.molotovs <= 0) {
      this.showToast('Out of Molotovs! Buy more at Vice Armory Gun Shop.');
      return;
    }
    p.molotovs--;
    this.attackSwingTimer = 0.25;
    const dirX = -Math.sin(this.camYaw);
    const dirZ = -Math.cos(this.camYaw);
    p.yaw = Math.atan2(dirX, dirZ);

    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.34, 8),
      new THREE.MeshStandardMaterial({ color: 0xb45309, emissive: 0xf97316, emissiveIntensity: 0.9 })
    );
    mesh.position.set(p.x + dirX * 0.6, p.y + 1.5, p.z + dirZ * 0.6);
    this.scene.add(mesh);
    this.grenades.push({
      mesh,
      x: p.x + dirX * 0.6,
      y: p.y + 1.5,
      z: p.z + dirZ * 0.6,
      vx: dirX * 16,
      vy: 6.5,
      vz: dirZ * 16,
      fuse: 0.85,
      isMolotov: true,
    });
    this.pushHud();
  }

  private spawnFirePool(x: number, z: number) {
    const groundY = getTerrainHeightAt(x, z);
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 3.2, 0.18, 14),
      new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.78 })
    );
    mesh.position.set(x, groundY + 0.1, z);
    this.scene.add(mesh);
    this.firePools.push({ mesh, x, y: groundY, z, life: 6.5 });
    viceAudio.playMolotov();
    this.triggerCrimeEvent(x, z, 1, false);
  }

  private triggerPrimaryAttack() {
    if (this.drivingVehicle || this.boardingSeq || this.fireCooldown > 0) return;
    const p = this.protagonists[this.activeId];
    if (p.isSitting) this.standUp();

    if (p.equippedWeaponId === 'grenades') {
      this.fireCooldown = 0.5;
      this.throwGrenade();
      return;
    }
    if (p.equippedWeaponId === 'molotov') {
      this.fireCooldown = 0.5;
      this.throwMolotov();
      return;
    }

    const weapon = this.getActiveWeapon(p);
    if (!weapon || weapon.category === 'melee') {
      const isBat = weapon?.id === 'bat';
      this.fireCooldown = isBat ? 0.42 : 0.36;
      this.attackSwingTimer = 0.28;
      const meleeDmg = (isBat ? 48 : 26) + p.stats.muscle * 0.45;
      const reach = isBat ? 2.75 : 2.25;
      viceAudio.playImpact(isBat);
      for (const npc of this.npcs) {
        if (!npc.alive || npc.kind === 'child') continue;
        if (Math.hypot(npc.x - p.x, npc.z - p.z) < reach) {
          this.damageNpc(npc, meleeDmg, true, this.activeId);
          this.cameraShake = isBat ? 0.2 : 0.14;
          break;
        }
      }
      return;
    }

    if (weapon.id === 'rpg') {
      if (p.rpgAmmo <= 0) {
        this.showToast('Out of RPG Rockets! Visit Vice Armory for ammo.');
        return;
      }
      p.rpgAmmo--;
      weapon.ammo = p.rpgAmmo > 0 ? 1 : 0;
      this.fireCooldown = weapon.fireRate;
      p.actionState = 'combat_aim';
      this.actionTimer = 0.4;
      const dirX = -Math.sin(this.camYaw);
      const dirZ = -Math.cos(this.camYaw);
      p.yaw = Math.atan2(dirX, dirZ);

      const rocketGroup = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.72, 8),
        new THREE.MeshStandardMaterial({ color: 0x365314, metalness: 0.5, roughness: 0.4 })
      );
      body.rotation.x = Math.PI / 2;
      const warhead = new THREE.Mesh(
        new THREE.ConeGeometry(0.11, 0.28, 8),
        new THREE.MeshBasicMaterial({ color: 0xf97316 })
      );
      warhead.rotation.x = Math.PI / 2;
      warhead.position.z = 0.46;
      rocketGroup.add(body, warhead);
      const sx = p.x + dirX * 0.9;
      const sy = p.y + 1.48;
      const sz = p.z + dirZ * 0.9;
      rocketGroup.position.set(sx, sy, sz);
      rocketGroup.rotation.y = Math.atan2(dirX, dirZ);
      this.scene.add(rocketGroup);
      this.rockets.push({
        mesh: rocketGroup,
        x: sx,
        y: sy,
        z: sz,
        vx: dirX * 48,
        vy: -Math.sin(this.camPitch) * 14,
        vz: dirZ * 48,
        life: 3.0,
      });
      viceAudio.playRocketLaunch();
      this.cameraShake = 0.34;
      this.triggerCrimeEvent(p.x, p.z, 2, false);
      this.pushHud();
      return;
    }

    if (weapon.ammo <= 0) {
      this.reloadWeapon();
      return;
    }

    if (weapon.condition < 30 && Math.random() < 0.25) {
      viceAudio.playJamClick();
      this.fireCooldown = 0.45;
      this.showToast(`${weapon.name} JAMMED! Clean it at Vice Armory or Wheel [Q]!`);
      return;
    }

    weapon.ammo--;
    weapon.condition = Math.max(5, weapon.condition - 1.1);
    this.fireCooldown = weapon.fireRate;
    p.actionState = 'combat_aim';
    this.actionTimer = 0.3;

    const isSilenced = Boolean(weapon.silenced || weapon.attachments.suppressor);
    const shotDmg = weapon.attachments.scope ? Math.round(weapon.damage * 1.2) : weapon.damage;
    viceAudio.playGunshot(isSilenced);
    this.cameraShake = weapon.category === 'rifle' || weapon.category === 'shotgun' || weapon.category === 'sniper' ? 0.16 : 0.08;

    const dirX = -Math.sin(this.camYaw);
    const dirZ = -Math.cos(this.camYaw);
    p.yaw = Math.atan2(dirX, dirZ);

    if (weapon.category === 'shotgun') {
      for (let pellet = -2; pellet <= 2; pellet++) {
        const spread = pellet * 0.055;
        const px = -Math.sin(this.camYaw + spread);
        const pz = -Math.cos(this.camYaw + spread);
        this.spawnTracer(p.x + px * 0.6, p.y + 1.38, p.z + pz * 0.6, px * 88, 0, pz * 88, true, Math.round(shotDmg * 0.36));
      }
    } else {
      const speed = weapon.category === 'sniper' ? 145 : 98;
      this.spawnTracer(p.x + dirX * 0.6, p.y + 1.38, p.z + dirZ * 0.6, dirX * speed, 0, dirZ * speed, true, shotDmg);
    }
    if (!isSilenced) {
      this.triggerCrimeEvent(p.x, p.z, 1, false);
    }
    this.pushHud();
  }

  private spawnTracer(x: number, y: number, z: number, vx: number, vy: number, vz: number, fromPlayer: boolean, damage: number) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.65),
      new THREE.MeshBasicMaterial({ color: fromPlayer ? 0xfbbf24 : 0xef4444 })
    );
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.atan2(vx, vz);
    this.scene.add(mesh);
    this.tracers.push({ mesh, x, y, z, vx, vy, vz, life: 0.75, fromPlayer, damage });
  }

  private spawnCashPickup(x: number, z: number, amount: number) {
    const mesh = createCashPickupMesh();
    const gy = getTerrainHeightAt(x, z);
    mesh.position.set(x, gy + 0.25, z);
    this.scene.add(mesh);
    this.cashPickups.push({
      id: `cash_${Date.now()}_${Math.random()}`,
      mesh,
      x,
      z,
      amount,
      life: 60,
    });
  }

  private damageNpc(npc: WorldNPC, dmg: number, silent: boolean, attackerId: ProtagonistId | 'npc', knockVx = 0, knockVz = 0) {
    if (npc.kind === 'child') return;
    npc.hp -= dmg;
    if (Math.hypot(knockVx, knockVz) > 0.1) {
      npc.vx = knockVx;
      npc.vz = knockVz;
      npc.vy = 4.2;
      npc.tumbleAngle = 0.6;
    }
    if (attackerId === 'jason') this.lastAttackerForJason = npc;
    else if (attackerId === 'lucia') this.lastAttackerForLucia = npc;

    if (npc.hp <= 0) {
      npc.alive = false;
      npc.rig.witnessMarker.visible = false;
      npc.rig.root.rotation.x = -Math.PI / 2;
      npc.rig.root.position.y = getTerrainHeightAt(npc.x, npc.z) + 0.2;
      if (npc.isWitness) {
        this.wanted.witnessActive = false;
        this.wanted.witnessProgress = 0;
      }

      const lootAmt =
        npc.kind === 'police' || npc.kind === 'swat'
          ? 120 + Math.floor(Math.random() * 220)
          : 45 + Math.floor(Math.random() * 195);
      this.spawnCashPickup(npc.x, npc.z, lootAmt);

      if (attackerId !== 'npc') {
        this.profile.violencePoints += 8;
        this.updateCriminalProfileLabel();

        if (npc.kind === 'police' || npc.kind === 'swat') {
          this.addWantedStars(1);
        } else if (!silent) {
          this.triggerCrimeEvent(npc.x, npc.z, 1, false);
        } else {
          const seen = this.checkWitnessNearby(npc.x, npc.z);
          if (!seen) {
            this.showToast(`Eliminated ${npc.name} unseen (+$${lootAmt} drop). No witnesses!`);
          }
        }
      }
    } else {
      npc.hostile = true;
      npc.fleeing = false;
      if (attackerId !== 'npc') {
        npc.targetProtagonist = attackerId;
        if (npc.kind === 'gang' && npc.gangFaction) {
          for (const ally of this.npcs) {
            if (ally.alive && ally.gangFaction === npc.gangFaction && Math.hypot(ally.x - npc.x, ally.z - npc.z) < 25) {
              ally.hostile = true;
              ally.targetProtagonist = attackerId;
            }
          }
        }
        this.triggerCrimeEvent(npc.x, npc.z, 1, false);
      }
    }
  }

  private hasLineOfSight(x1: number, z1: number, x2: number, z2: number): boolean {
    const steps = 8;
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const sx = x1 + (x2 - x1) * t;
      const sz = z1 + (z2 - z1) * t;
      for (const b of this.worldBuildings) {
        if (Math.abs(sx - b.x) < b.w / 2 && Math.abs(sz - b.z) < b.d / 2) {
          return false;
        }
      }
    }
    return true;
  }

  private checkWitnessNearby(x: number, z: number): boolean {
    let closestWitness: WorldNPC | null = null;
    let bestD = 30;
    for (const npc of this.npcs) {
      if (!npc.alive || npc.kind === 'child' || npc.drivingCar) continue;
      const d = Math.hypot(npc.x - x, npc.z - z);
      if ((npc.kind === 'police' || npc.kind === 'swat') && d < 36 && this.hasLineOfSight(npc.x, npc.z, x, z)) {
        this.addWantedStars(1);
        return true;
      }
      if (d < bestD && npc.kind === 'civilian' && this.hasLineOfSight(npc.x, npc.z, x, z)) {
        bestD = d;
        closestWitness = npc;
      }
    }
    if (closestWitness) {
      if (!this.wanted.witnessActive && this.wanted.stars === 0) {
        closestWitness.isWitness = true;
        closestWitness.witnessTimer = 0;
        closestWitness.rig.witnessMarker.visible = true;
        this.wanted.witnessActive = true;
        this.wanted.witnessProgress = 0;
        this.wanted.witnessPos = { x: closestWitness.x, z: closestWitness.z };
        this.showToast(`Witness ${closestWitness.name} spotted crime! Stop them before 911 connects!`);
      }
      return true;
    }
    return false;
  }

  private damageProtagonist(targetId: ProtagonistId, dmg: number, attacker: WorldNPC | null) {
    const p = this.protagonists[targetId];
    const effectiveDmg = p.painkillerTimer > 0 ? dmg * 0.6 : dmg;
    if (p.armor > 0) {
      p.armor = Math.max(0, p.armor - effectiveDmg);
    } else {
      p.health = Math.max(0, p.health - effectiveDmg);
      if (effectiveDmg >= 8 && Math.random() < 0.25 && p.painkillerTimer <= 0) {
        p.bleeding = true;
      }
    }

    if (targetId === this.activeId) this.cameraShake = 0.2;
    if (attacker) {
      if (targetId === 'jason') this.lastAttackerForJason = attacker;
      else this.lastAttackerForLucia = attacker;
    }

    if (p.health <= 0 && targetId === this.activeId) {
      this.screen = 'wasted';
      this.pushHud();
    }
  }

  private triggerCrimeEvent(x: number, z: number, baseStars: number, immediateAlert: boolean) {
    if (immediateAlert) {
      this.addWantedStars(baseStars);
      return;
    }
    const witnessed = this.checkWitnessNearby(x, z);
    if (witnessed && this.wanted.stars > 0) {
      this.wanted.evading = false;
      this.wanted.evadeProgress = 0;
    }
  }

  private addWantedStars(add: number) {
    const prev = this.wanted.stars;
    this.wanted.stars = Math.min(6, Math.max(prev, prev + add));
    this.wanted.evading = false;
    this.wanted.evadeProgress = 0;
    if (this.wanted.stars > prev) {
      this.policeSpawnTimer = 2.0;
      this.dispatchPrecinctOfficers();
      this.showToast(`WANTED ${this.wanted.stars}/6 STARS — Vice PD Dispatching from Precinct!`);
    }
  }

  private dispatchPrecinctOfficers() {
    // Precinct officers visibly run to precinct cruisers, open the doors, and drive out!
    const precinctCops = this.npcs.filter((n) => n.alive && n.id.startsWith('precinct_cop_') && !n.drivingCar && !n.boardingCar);
    const precinctCars = this.vehicles.filter((v) => v.isPrecinctUnit && !v.driverPresent);
    precinctCops.forEach((cop, idx) => {
      const car = precinctCars[idx];
      if (car) {
        cop.boardingCar = car;
        cop.hostile = true;
      }
    });
  }

  private getVehicleSeatWorldPos(veh: WorldVehicle, seat: VehicleState['seat']) {
    const tier = veh.state.tier;
    let lx = 0;
    let ly = 0.34;
    let lz = -0.2;
    if (tier === 'bike') {
      lx = 0;
      ly = 0.42;
      lz = seat === 'driver' ? -0.22 : -0.58;
    } else if (tier === 'boat') {
      lx = seat === 'driver' ? -0.38 : seat === 'passenger' ? 0.38 : 0;
      ly = 0.46;
      lz = seat === 'rear' ? -1.6 : -0.35;
    } else if (tier === 'heli') {
      lx = seat === 'driver' ? -0.36 : 0.36;
      ly = 0.72;
      lz = 1.0;
    } else if (tier === 'plane') {
      lx = 0;
      ly = 1.18;
      lz = seat === 'driver' ? 0.55 : -0.35;
    } else {
      lx = seat === 'driver' ? -veh.rig.halfWidth * 0.42 : seat === 'passenger' ? veh.rig.halfWidth * 0.42 : 0;
      ly = tier === 'suv' || tier === 'police' || tier === 'pickup' ? 0.44 : 0.36;
      lz = seat === 'rear' ? -0.82 : -0.22;
    }
    const cosY = Math.cos(veh.yaw);
    const sinY = Math.sin(veh.yaw);
    return {
      x: veh.x + lx * cosY + lz * sinY,
      y: veh.y + ly,
      z: veh.z - lx * sinY + lz * cosY,
    };
  }

  private toggleVehicleEnterExit() {
    if (this.boardingSeq || this.exitingSeq) return;

    if (this.drivingVehicle) {
      const veh = this.drivingVehicle;
      const p = this.protagonists[this.activeId];
      let bailingWithChute = false;
      if (veh.state.tier === 'heli' || veh.state.tier === 'plane') {
        if (veh.y > 12) {
          bailingWithChute = true;
          p.parachuting = true;
          p.actionState = 'parachute';
          this.onGround = false;
          this.playerVy = -2;
        } else if (veh.y > 2.2) {
          this.showToast('Land safely near ground (or climb >12m for Parachute Jump)!');
          return;
        }
      }

      const seatPos = this.getVehicleSeatWorldPos(veh, veh.state.seat);
      const exitX = veh.x - Math.cos(veh.yaw) * (veh.rig.halfWidth + 1.05);
      const exitZ = veh.z + Math.sin(veh.yaw) * (veh.rig.halfWidth + 1.05);
      const exitY = bailingWithChute
        ? veh.y - 1.5
        : veh.state.tier === 'boat'
        ? getWaterWaveHeight(exitX, exitZ, this.elapsedSec, this.currentStormFactor) - 0.25
        : getTerrainHeightAt(exitX, exitZ);

      if (veh.state.tier !== 'bike' && veh.state.tier !== 'boat') {
        veh.leftDoorTimer = 0.72;
      }
      viceAudio.playDoorLatch();
      p.helmetOn = false;
      this.drivingVehicle = null;

      // If partner was inside the car, let them exit cleanly too!
      if (this.relationship.partnerInVehicleId === veh.state.id) {
        const partnerId: ProtagonistId = this.activeId === 'jason' ? 'lucia' : 'jason';
        const partner = this.protagonists[partnerId];
        if (veh.state.tier !== 'bike' && veh.state.tier !== 'boat') {
          veh.rightDoorTimer = 0.65;
        }
        partner.x = veh.x + Math.cos(veh.yaw) * (veh.rig.halfWidth + 1.1);
        partner.z = veh.z - Math.sin(veh.yaw) * (veh.rig.halfWidth + 1.1);
        partner.y = bailingWithChute ? LAND_Y : exitY;
        partner.actionState = 'idle';
        this.relationship.partnerInVehicleId = null;
        this.relationship.partnerState = 'following';
      }

      if (bailingWithChute) {
        p.x = exitX;
        p.y = exitY;
        p.z = exitZ;
        this.showToast('Bailed out — Parachute Deployed!');
      } else {
        p.x = seatPos.x;
        p.y = seatPos.y;
        p.z = seatPos.z;
        p.actionState = 'exit_vehicle';
        this.exitingSeq = {
          vehicle: veh,
          timer: 0.44,
          duration: 0.44,
          startX: seatPos.x,
          startY: seatPos.y,
          startZ: seatPos.z,
          targetX: exitX,
          targetY: exitY,
          targetZ: exitZ,
          startYaw: veh.yaw,
        };
        this.showToast(`Exited ${veh.state.name}`);
      }
      this.pushHud();
      return;
    }

    const p = this.protagonists[this.activeId];
    if (p.isSitting) this.standUp();

    let best: WorldVehicle | null = null;
    let bestD = 5.4;
    for (const v of this.vehicles) {
      const d = Math.hypot(v.x - p.x, v.z - p.z);
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    if (!best) return;

    if (best.state.hotwired) {
      this.enterVehicleWithDoorAnim(best);
    } else if (best.state.needsKeyCloner) {
      if (!p.duffelBag.hasKeyCloner) {
        this.showToast('Luxury Immobilizer! Buy a Key Cloner at Uncle Jack Pawn.');
        return;
      }
      this.openModal('hotwire', { vehicle: best.state, isLuxury: true });
    } else {
      this.openModal('hotwire', { vehicle: best.state, isLuxury: false });
    }
  }

  private enterVehicleWithDoorAnim(veh: WorldVehicle) {
    const p = this.protagonists[this.activeId];
    const sideOffset = veh.state.tier === 'bike' ? veh.rig.halfWidth + 0.42 : veh.rig.halfWidth + 0.58;
    const doorX = veh.x - Math.cos(veh.yaw) * sideOffset;
    const doorZ = veh.z + Math.sin(veh.yaw) * sideOffset;
    const startX = Math.hypot(p.x - doorX, p.z - doorZ) < 2.4 ? p.x : doorX;
    const startZ = Math.hypot(p.x - doorX, p.z - doorZ) < 2.4 ? p.z : doorZ;
    const startY = veh.state.tier === 'boat' ? Math.max(p.y, veh.y - 0.1) : p.y;

    p.x = startX;
    p.y = startY;
    p.z = startZ;
    p.yaw = Math.atan2(veh.x - p.x, veh.z - p.z);
    p.crouching = false;
    p.prone = false;
    p.umbrellaOpen = false;
    p.isSitting = false;
    p.actionState = 'enter_vehicle';

    if (veh.state.tier !== 'bike' && veh.state.tier !== 'boat') {
      veh.leftDoorTimer = 0.85;
    }
    viceAudio.playDoorLatch();

    const duration = veh.state.tier === 'bike' || veh.state.tier === 'boat' ? 0.54 : 0.68;
    this.boardingSeq = {
      vehicle: veh,
      timer: duration,
      duration,
      startX,
      startY,
      startZ,
      startYaw: p.yaw,
    };
  }

  private finalizeEnterVehicle(veh: WorldVehicle) {
    veh.isTraffic = false;
    veh.driverPresent = false;
    this.drivingVehicle = veh;
    this.boardingSeq = null;
    const p = this.protagonists[this.activeId];
    p.helmetOn = veh.state.tier === 'bike';
    p.umbrellaOpen = false;
    p.crouching = false;
    p.prone = false;
    p.isSitting = false;
    p.actionState = 'sit_drive';
    this.showToast(`Driving ${veh.state.name}`);

    // If partner is actively following, have them board the passenger door too!
    if (this.relationship.duoActive && !this.relationship.partnerInVehicleId) {
      this.partnerBoardingSeq = { vehicle: veh, timer: 0.6, isPartner: true };
    }
    this.pushHud();
  }

  private toggleTrunk() {
    const veh = this.drivingVehicle || this.nearbyTrunkVehicle;
    if (!veh) return;
    veh.state.trunkOpen = !veh.state.trunkOpen;
    viceAudio.playUiChime(veh.state.trunkOpen);
    if (!this.drivingVehicle && veh.state.trunkOpen) {
      this.openModal('trunk', { vehicle: veh.state });
    } else {
      this.showToast(veh.state.trunkOpen ? 'Trunk Opened' : 'Trunk Closed');
    }
    this.pushHud();
  }

  private triggerContextInteract() {
    if (this.contextAction) this.contextAction();
  }

  private adjustRelationship(delta: number, reason: string) {
    this.relationship.meter = THREE.MathUtils.clamp(this.relationship.meter + delta, 0, 100);
    this.relationship.comboReady = this.relationship.meter >= 50;
    this.relationship.lastEvent = reason;
  }

  private updateCriminalProfileLabel() {
    const diff = this.profile.stealthPoints - this.profile.violencePoints;
    if (diff >= 12) this.profile.label = 'Clean Operator';
    else if (diff <= -12) this.profile.label = 'Ruthless Enforcer';
    else this.profile.label = 'Balanced Hustler';
  }

  private checkMissionProgress() {
    if (!this.activeMissionId) return;
    const m = this.missions.find((ms) => ms.id === this.activeMissionId);
    if (!m || m.stage === 'completed') return;

    let done = false;
    if (m.id === 'mis_1' && this.profile.robberiesCompleted >= 1 && !this.wanted.cctvRecorded) done = true;
    if (m.id === 'mis_2' && this.profile.carsBoosted >= 1 && this.wanted.stars === 0) done = true;
    if (m.id === 'mis_3' && this.profile.robberiesCompleted >= 2 && this.wanted.stars === 0) done = true;
    if (m.id === 'mis_4' && this.underwaterTreasureFound >= 1) done = true;
    if (m.id === 'mis_5' && this.profile.robberiesCompleted >= 3 && this.wanted.stars === 0) done = true;

    if (done) {
      m.stage = 'completed';
      this.cash += m.rewardCash;
      this.adjustRelationship(m.rewardBond, `Completed "${m.title}" together`);
      viceAudio.playCashRegister();
      this.showToast(`MISSION PASSED: ${m.title} (+$${m.rewardCash.toLocaleString()})`);
      const next = this.missions.find((ms) => ms.stage === 'available');
      if (next) {
        this.activeMissionId = next.id;
        next.stage = 'active';
        this.waypoint = { x: next.targetX, z: next.targetZ, label: next.title };
      } else {
        this.activeMissionId = null;
      }
    }
  }

  private showToast(msg: string) {
    this.toastMessage = msg;
    this.toastTimer = 3.8;
  }

  // ================= MAIN 60FPS SIMULATION LOOP =================

  private startLoop() {
    const tick = () => {
      if (this.disposed) return;
      const now = performance.now();
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      this.update(dt);
      this.postProcessing.render(this.scene, this.camera, this.renderer);

      if (this.isSoftwareGl) this.afterDraw(tick);
      else this.frameId = requestAnimationFrame(tick);
    };

    if (this.isSoftwareGl) this.afterDraw(tick);
    else this.frameId = requestAnimationFrame(tick);
  }

  private afterDraw(cb: () => void) {
    try {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    } catch {
      this.frameId = window.setTimeout(cb, 80);
    }
  }

  private update(rawDt: number) {
    this.elapsedSec += rawDt;
    if (this.toastTimer > 0) {
      this.toastTimer -= rawDt;
      if (this.toastTimer <= 0) this.toastMessage = null;
    }

    if (this.fountainWaterMat) {
      this.fountainWaterMat.uniforms.uTime.value = this.elapsedSec;
    }
    for (const bMat of this.bungalowWaterMats) {
      bMat.uniforms.uTime.value = this.elapsedSec;
    }
    if (this.npcSubtitleTimer > 0) {
      this.npcSubtitleTimer -= rawDt;
      if (this.npcSubtitleTimer <= 0) this.npcSubtitle = null;
    }

    // Cycle Traffic Signals between North-South and East-West every 9 seconds
    this.trafficCycleTimer += rawDt;
    if (this.trafficCycleTimer > 9.0) {
      this.trafficCycleTimer = 0;
      this.trafficNsGreen = !this.trafficNsGreen;
    }
    this.trafficYellowPhase = this.trafficCycleTimer > 7.2;
    for (const ts of this.trafficSignals) {
      const activeGreen = (ts.axis === 'ns' && this.trafficNsGreen) || (ts.axis === 'ew' && !this.trafficNsGreen);
      ts.rig.greenMat.emissiveIntensity = activeGreen && !this.trafficYellowPhase ? 2.0 : 0.05;
      ts.rig.yellowMat.emissiveIntensity = activeGreen && this.trafficYellowPhase ? 2.0 : 0.05;
      ts.rig.redMat.emissiveIntensity = !activeGreen ? 2.0 : 0.05;
    }

    // Drifting Sky Clouds
    if (this.cloudGroup) {
      for (const c of this.cloudGroup.children) {
        c.position.x += rawDt * 2.4;
        if (c.position.x > 650) c.position.x = -650;
      }
    }

    if (this.parkCarousel) this.parkCarousel.rotation.y += rawDt * 0.9;

    // Topple animation on struck weak trees
    for (const wt of this.weakTreeEntries) {
      if (!wt.data.intact && wt.data.fallAngle < Math.PI / 2) {
        wt.data.fallAngle = Math.min(Math.PI / 2, wt.data.fallAngle + rawDt * 3.8);
        wt.group.rotation.z = wt.data.fallAngle * wt.data.fallDirX;
        wt.group.rotation.x = wt.data.fallAngle * wt.data.fallDirZ;
      }
    }

    if (this.waypoint) {
      this.waypointBeam.visible = true;
      this.waypointBeam.position.set(this.waypoint.x, getTerrainHeightAt(this.waypoint.x, this.waypoint.z), this.waypoint.z);
      this.waypointBeam.rotation.y += rawDt * 1.4;
    } else {
      this.waypointBeam.visible = false;
    }

    // Silent Auto Weather (zero annoying popup toasts!)
    this.updateWeatherAndAtmosphere(rawDt);

    if (this.screen === 'title') {
      const angle = this.elapsedSec * 0.11;
      this.camera.position.set(60 + Math.cos(angle) * 115, 34 + Math.sin(angle * 0.5) * 5, 65 + Math.sin(angle) * 115);
      this.camera.lookAt(10, 5, 10);
      this.syncProtagonistRigs(rawDt);
      return;
    }

    const pausedByFullModal = this.activeModal !== null && this.activeModal !== 'phone';
    if (this.screen !== 'playing' || pausedByFullModal) {
      viceAudio.updateContinuous(0, false, 0, this.elapsedSec, false, 0, 0, 'car', false, rawDt);
      return;
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= rawDt;
      return;
    }

    const p = this.protagonists[this.activeId];
    if (this.slowMoActive) {
      p.focusMeter = Math.max(0, p.focusMeter - rawDt * 18);
      if (p.focusMeter <= 0) this.slowMoActive = false;
    } else {
      p.focusMeter = Math.min(p.maxFocusMeter, p.focusMeter + rawDt * 7);
    }
    const simDt = this.slowMoActive ? rawDt * 0.35 : rawDt;

    this.timeNormalized = (this.timeNormalized + rawDt * 0.0018) % 1;
    this.fireCooldown = Math.max(0, this.fireCooldown - rawDt);
    this.attackSwingTimer = Math.max(0, this.attackSwingTimer - rawDt);
    if (this.actionTimer > 0) {
      this.actionTimer = Math.max(0, this.actionTimer - rawDt);
      if (this.actionTimer === 0 && (p.actionState === 'reload' || p.actionState === 'eat' || p.actionState === 'cook' || p.actionState === 'mop' || p.actionState === 'lockpick' || p.actionState === 'dodge' || p.actionState === 'combat_aim')) {
        p.actionState = 'idle';
      }
    }

    // Survival ticks: bleeding, painkiller decay & dynamic beard growth
    if (p.bleeding) {
      p.health = Math.max(0, p.health - rawDt * 1.4);
      if (p.health <= 0) {
        this.screen = 'wasted';
        this.pushHud();
      }
    }
    if (p.painkillerTimer > 0) p.painkillerTimer = Math.max(0, p.painkillerTimer - rawDt);
    if (this.activeId === 'jason') {
      p.beardLevel = Math.min(100, p.beardLevel + rawDt * 0.32);
    }

    // Dynamic Stock Market + Owned Businesses Passive Income
    this.stockTimer -= rawDt;
    if (this.stockTimer <= 0) {
      this.stockTimer = 18;
      for (const st of this.stocks) {
        const pct = (Math.random() - 0.47) * 8.5;
        st.changePct = Number(pct.toFixed(1));
        st.price = Math.max(12, Number((st.price * (1 + pct / 100)).toFixed(2)));
      }
      const bizIncome = this.businesses.reduce((acc, b) => (b.owned ? acc + b.dailyIncome : acc), 0);
      if (bizIncome > 0) {
        this.bankBalance += bizIncome;
        this.showToast(`Business Payout: +$${bizIncome.toLocaleString()} wired to Bank!`);
      }
    }

    // High-Cash Street Mugger Risk (deposit cash at Bank / ATM to protect it!)
    if (!this.drivingVehicle && !this.currentInterior && this.cash > 5000) {
      this.muggerCooldown -= rawDt;
      if (this.muggerCooldown <= 0) {
        this.muggerCooldown = 55;
        const stolen = Math.min(this.cash, 350 + Math.floor(Math.random() * 450));
        this.cash -= stolen;
        viceAudio.playImpact(false);
        this.cameraShake = 0.2;
        this.showToast(`Street Pickpocket snatched $${stolen}! Deposit extra cash at Leonida Bank!`);
      }
    }

    // Dark Web Dead-Drop Crate Collection
    if (this.darkWebDrop && Math.hypot(p.x - this.darkWebDrop.x, p.z - this.darkWebDrop.z) < 2.6) {
      const k = this.darkWebDrop.itemKey;
      if (k === 'keycloner') p.duffelBag.hasKeyCloner = true;
      else if (k === 'armor') p.armor = 100;
      else if (k === 'grenades') p.grenades += 4;
      else if (k === 'traumakit') p.traumaKits += 2;
      else if (k === 'cleaningkit') {
        const aw = this.getActiveWeapon(p) || p.longGun || p.pistols[0];
        if (aw) aw.condition = 100;
      } else if (k === 'silenced9' || k === 'carbine') {
        const w = cloneWeapon(WEAPON_CATALOG[k]);
        if (!p.weapons.some((x) => x.id === w.id)) p.weapons.push(w);
        p.equippedWeaponId = w.id;
        this.syncProtagonistWeapons(p);
      }
      if (this.darkWebDropMesh) {
        this.scene.remove(this.darkWebDropMesh);
        this.darkWebDropMesh = null;
      }
      viceAudio.playCashRegister();
      this.showToast(`Retrieved Dark Web Dead-Drop: ${this.darkWebDrop.label}!`);
      this.darkWebDrop = null;
      this.waypoint = null;
    }

    // Burger Shot Timed Delivery Tracker
    if (this.burgerJob.activeDelivery) {
      const del = this.burgerJob.activeDelivery;
      del.timer -= rawDt;
      if (Math.hypot(p.x - del.targetX, p.z - del.targetZ) < 6.5) {
        this.cash += del.reward;
        this.burgerJob.shiftsCompleted++;
        this.clout += 45;
        this.burgerJob.activeDelivery = null;
        this.waypoint = null;
        viceAudio.playCashRegister();
        this.showToast(`Delivered hot Bleeder Combo to ${del.customerName}! +$${del.reward}`);
      } else if (del.timer <= 0) {
        this.burgerJob.activeDelivery = null;
        this.waypoint = null;
        this.showToast(`Burger Shot delivery timed out — customer canceled.`);
      }
    }

    if (this.keys['ArrowLeft']) this.camYaw += rawDt * 2.4;
    if (this.keys['ArrowRight']) this.camYaw -= rawDt * 2.4;

    if (this.boardingSeq) {
      const b = this.boardingSeq;
      b.timer -= simDt;
      const prog = THREE.MathUtils.clamp(1 - b.timer / b.duration, 0, 1);
      const seatPos = this.getVehicleSeatWorldPos(b.vehicle, b.vehicle.state.seat);
      const moveT = THREE.MathUtils.smoothstep(prog, 0.2, 0.95);
      p.x = THREE.MathUtils.lerp(b.startX, seatPos.x, moveT);
      p.y = THREE.MathUtils.lerp(b.startY, seatPos.y, moveT);
      p.z = THREE.MathUtils.lerp(b.startZ, seatPos.z, moveT);
      const yawT = THREE.MathUtils.smoothstep(prog, 0.35, 1.0);
      let dYaw = ((b.vehicle.yaw - b.startYaw + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (dYaw < -Math.PI) dYaw += Math.PI * 2;
      p.yaw = b.startYaw + dYaw * yawT;
      p.actionState = 'enter_vehicle';
      if (b.timer <= 0) {
        this.finalizeEnterVehicle(b.vehicle);
      }
      this.syncProtagonistRigs(simDt);
    } else if (this.exitingSeq) {
      const ex = this.exitingSeq;
      ex.timer -= simDt;
      const prog = THREE.MathUtils.clamp(1 - ex.timer / ex.duration, 0, 1);
      const moveT = THREE.MathUtils.smoothstep(prog, 0.05, 0.95);
      p.x = THREE.MathUtils.lerp(ex.startX, ex.targetX, moveT);
      p.y = THREE.MathUtils.lerp(ex.startY, ex.targetY, moveT);
      p.z = THREE.MathUtils.lerp(ex.startZ, ex.targetZ, moveT);
      const outYaw = Math.atan2(ex.targetX - ex.startX, ex.targetZ - ex.startZ);
      let dYaw = ((outYaw - ex.startYaw + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (dYaw < -Math.PI) dYaw += Math.PI * 2;
      p.yaw = ex.startYaw + dYaw * moveT;
      p.actionState = 'exit_vehicle';
      if (ex.timer <= 0) {
        p.x = ex.targetX;
        p.y = ex.targetY;
        p.z = ex.targetZ;
        p.actionState = 'idle';
        this.exitingSeq = null;
      }
      this.syncProtagonistRigs(simDt);
    } else if (this.drivingVehicle) {
      this.updateDriving(simDt);
    } else {
      this.updateOnFoot(simDt);
    }

    this.updatePartnerAI(simDt);
    this.updateVehicles(simDt);
    if (this.drivingVehicle) {
      this.syncProtagonistRigs(simDt);
    }
    this.updateNpcsAndPolice(simDt);
    this.updateGrenadesAndExplosions(simDt);
    this.updateCashPickups(simDt);
    this.updateTracers(simDt);
    this.updateWantedAndWitness(simDt);
    this.updateInteriorCutaways();
    this.updateContextPrompts();
    this.updateCamera(rawDt);

    const wType = WEATHER_ORDER[this.weatherIndex];
    const rainLevel = wType === 'storm' ? 1 : wType === 'rain' ? 0.65 : 0;
    const oceanProximity = p.x > 330 ? Math.min(1, (p.x - 330) / 80) : 0;
    const speedRatio = this.drivingVehicle ? this.drivingVehicle.state.speed / this.drivingVehicle.state.maxSpeed : 0;
    const vehMode = !this.drivingVehicle
      ? 'car'
      : this.drivingVehicle.state.tier === 'bike'
      ? 'bike'
      : this.drivingVehicle.state.tier === 'heli'
      ? 'heli'
      : this.drivingVehicle.state.tier === 'plane'
      ? 'plane'
      : this.drivingVehicle.state.tier === 'boat'
      ? 'boat'
      : 'car';

    const radioAudible = (Boolean(this.drivingVehicle) || this.earphonesOn) && this.radioStation !== 'Off';
    viceAudio.updateContinuous(speedRatio, Boolean(this.drivingVehicle), this.wanted.stars, this.elapsedSec, this.slowMoActive, rainLevel, oceanProximity, vehMode, radioAudible, rawDt);

    this.hudSyncTimer += rawDt;
    if (this.hudSyncTimer >= 0.08) {
      this.hudSyncTimer = 0;
      this.pushHud();
    }
  }

  private updateWeatherAndAtmosphere(dt: number) {
    this.weatherTimer += dt;
    if (this.weatherTimer >= 55) {
      this.weatherTimer = 0;
      this.weatherIndex = (this.weatherIndex + 1) % WEATHER_ORDER.length;
    }

    const weather = WEATHER_ORDER[this.weatherIndex];
    const isRaining = weather === 'rain' || weather === 'storm';
    const p = this.protagonists[this.activeId];
    if (isRaining && !this.drivingVehicle && !this.currentInterior && !p.inWater && !p.parachuting) {
      p.umbrellaOpen = true;
    } else if (!isRaining && p.umbrellaOpen) {
      p.umbrellaOpen = false;
    }

    this.rainLines.visible = isRaining;
    if (isRaining) {
      const dropCount = this.rainPositions.length / 6;
      const speed = weather === 'storm' ? 38 : 26;
      for (let i = 0; i < dropCount; i++) {
        let ry = this.rainPositions[i * 6 + 1] - speed * dt;
        if (ry < 0) ry = 32 + Math.random() * 6;
        this.rainPositions[i * 6 + 1] = ry;
        this.rainPositions[i * 6 + 4] = ry - 1.35;
      }
      this.rainLines.position.set(p.x, 0, p.z);
      this.rainLines.geometry.attributes.position.needsUpdate = true;
    }

    const targetRoadRough = isRaining ? 0.2 : 0.76;
    if (this.roadMat) {
      this.roadMat.roughness = THREE.MathUtils.damp(this.roadMat.roughness, targetRoadRough, 1.5, dt);
    }

    if (weather === 'storm' && Math.random() < dt * 0.14) {
      this.lightningFlash = 1.0;
      viceAudio.playThunder();
    }
    this.lightningFlash = Math.max(0, this.lightningFlash - dt * 4.5);

    this.sunLight.position.set(p.x + 85, 85, p.z - 55);
    this.sunLight.target.position.set(p.x, 0, p.z);

    let sunElevDeg = 32;
    const skyTop = new THREE.Color(0x154794);
    const skyHorizon = new THREE.Color(0x7cb8e8);
    let stormFactor = 0;

    if (weather === 'sunny') {
      sunElevDeg = 32;
      this.sunLight.intensity = 1.05;
      this.sunLight.color.setHex(0xffebd2);
      this.hemiLight.intensity = 0.34;
      this.scene.environmentIntensity = 0.25;
      this.renderer.toneMappingExposure = 0.56;
      (this.scene.fog as THREE.FogExp2).color.setHex(0x8bc0ea);
      (this.scene.fog as THREE.FogExp2).density = 0.00075;
    } else if (weather === 'sunset') {
      sunElevDeg = 6;
      skyTop.setHex(0x1e3a6e);
      skyHorizon.setHex(0xe89b6c);
      this.sunLight.intensity = 0.92;
      this.sunLight.color.setHex(0xffab6b);
      this.hemiLight.intensity = 0.28;
      this.scene.environmentIntensity = 0.22;
      this.renderer.toneMappingExposure = 0.58;
      (this.scene.fog as THREE.FogExp2).color.setHex(0xc97b63);
      (this.scene.fog as THREE.FogExp2).density = 0.00105;
    } else if (weather === 'cloudy') {
      sunElevDeg = 20;
      skyTop.setHex(0x38465a);
      skyHorizon.setHex(0x7a8a9e);
      stormFactor = 0.4;
      this.sunLight.intensity = 0.52;
      this.sunLight.color.setHex(0xcbd5e1);
      this.hemiLight.intensity = 0.30;
      this.scene.environmentIntensity = 0.18;
      this.renderer.toneMappingExposure = 0.54;
      (this.scene.fog as THREE.FogExp2).color.setHex(0x78889c);
      (this.scene.fog as THREE.FogExp2).density = 0.00125;
    } else {
      sunElevDeg = 5;
      skyTop.setHex(0x16202e);
      skyHorizon.setHex(0x3b495c);
      stormFactor = weather === 'storm' ? 1 : 0.72;
      this.sunLight.intensity = 0.36 + this.lightningFlash * 1.35;
      this.sunLight.color.setHex(0x7da6d8);
      this.hemiLight.intensity = 0.24 + this.lightningFlash * 0.35;
      this.scene.environmentIntensity = 0.15;
      this.renderer.toneMappingExposure = 0.52;
      (this.scene.fog as THREE.FogExp2).color.setHex(0x283240);
      (this.scene.fog as THREE.FogExp2).density = weather === 'storm' ? 0.0018 : 0.0014;
    }

    const hrs = Math.floor(this.timeNormalized * 24);
    const isNight = hrs >= 20 || hrs < 6;
    if (isNight) {
      sunElevDeg = -2;
      this.sunLight.intensity = 0.22 + this.lightningFlash * 1.1;
      this.sunLight.color.setHex(0x88b0e6);
      this.hemiLight.intensity = 0.18 + this.lightningFlash * 0.28;
      this.scene.environmentIntensity = 0.14;
      this.renderer.toneMappingExposure = 0.62;
      skyTop.setHex(0x091324);
      skyHorizon.setHex(0x1b2e4a);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x142238);
    }

    const phi = THREE.MathUtils.degToRad(90 - sunElevDeg);
    const theta = THREE.MathUtils.degToRad(142);
    _v1.setFromSphericalCoords(1, phi, theta);
    if (this.envSky?.skyUniforms) {
      this.envSky.skyUniforms['sunPosition'].value.copy(_v1);
      this.envSky.skyUniforms['turbidity'].value = isRaining ? 9.5 : weather === 'sunset' ? 6.5 : 2.6;
      this.envSky.skyUniforms['rayleigh'].value = isNight ? 0.45 : weather === 'sunset' ? 2.6 : isRaining ? 0.7 : 2.1;
      this.envSky.skyUniforms['mieCoefficient'].value = weather === 'sunset' ? 0.004 : 0.002;
      this.envSky.sky.position.set(p.x, 0, p.z);
    }
    if (this.oceanWater) {
      this.currentStormFactor = stormFactor;
      this.oceanWater.update(this.elapsedSec, _v1, skyTop, skyHorizon, stormFactor);
    }
    if (this.fountainWaterMat) {
      this.fountainWaterMat.uniforms.uSunDir.value.copy(_v1).normalize();
    }
  }

  private updateOnFoot(dt: number) {
    const p = this.protagonists[this.activeId];
    if (p.isSitting) {
      this.syncProtagonistRigs(dt);
      return;
    }

    const bridgeInfo = getBridgeDeckInfo(p.x, p.z);
    const groundFloor = getTerrainHeightAt(p.x, p.z);
    const inOceanZone = isWaterChannel(p.x, p.z) && !bridgeInfo.onBridge && !p.parachuting && p.y <= 0.35;
    p.inWater = inOceanZone;

    let moveX = 0;
    let moveZ = 0;
    const fwdX = -Math.sin(this.camYaw);
    const fwdZ = -Math.cos(this.camYaw);
    const rightX = Math.cos(this.camYaw);
    const rightZ = -Math.sin(this.camYaw);

    if (this.keys['KeyW']) { moveX += fwdX; moveZ += fwdZ; }
    if (this.keys['KeyS']) { moveX -= fwdX; moveZ -= fwdZ; }
    if (this.keys['KeyD']) { moveX += rightX; moveZ += rightZ; }
    if (this.keys['KeyA']) { moveX -= rightX; moveZ -= rightZ; }

    if (Math.abs(this.touchMoveX) > 0.05 || Math.abs(this.touchMoveZ) > 0.05) {
      moveX += rightX * this.touchMoveX - fwdX * this.touchMoveZ;
      moveZ += rightZ * this.touchMoveX - fwdZ * this.touchMoveZ;
    }

    const moving = Math.hypot(moveX, moveZ) > 0.05;
    const sprinting = (Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight']) || this.touchSprinting) && moving && p.stamina > 2 && !p.crouching && !p.prone && !p.parachuting;

    if (sprinting) {
      p.stamina = Math.max(0, p.stamina - dt * 16);
      p.stats.stamina = Math.min(100, p.stats.stamina + dt * 0.25);
    } else {
      p.stamina = Math.min(p.maxStamina, p.stamina + dt * 12);
    }

    const baseSpeed = p.parachuting ? 14.5 : inOceanZone ? 5.8 : p.prone ? 2.4 : p.crouching ? 3.8 : sprinting ? 10.6 : 6.2;
    if (moving || p.parachuting) {
      const mx = moving ? moveX : -Math.sin(p.yaw);
      const mz = moving ? moveZ : -Math.cos(p.yaw);
      const len = Math.max(0.01, Math.hypot(mx, mz));
      const nx = mx / len;
      const nz = mz / len;
      const nextX = THREE.MathUtils.clamp(p.x + nx * baseSpeed * dt, -600, 680);
      const nextZ = THREE.MathUtils.clamp(p.z + nz * baseSpeed * dt, -560, 560);

      if (p.parachuting || !this.collidesWithSolidWall(nextX, p.z, 0.44)) p.x = nextX;
      if (p.parachuting || !this.collidesWithSolidWall(p.x, nextZ, 0.44)) p.z = nextZ;

      if (moving) {
        const targetYaw = Math.atan2(nx, nz);
        p.yaw = this.dampAngle(p.yaw, targetYaw, 12, dt);
      }
      this.walkPhase += dt * (sprinting ? 14 : 9);
    } else {
      this.walkPhase = 0;
    }

    if (!p.parachuting) {
      this.resolveCharacterCollisions(p, 0.45);
    }

    if (p.parachuting) {
      p.actionState = 'parachute';
      p.y -= 5.2 * dt;
      const landingFloor = Math.max(0, groundFloor);
      if (p.y <= landingFloor + 0.02) {
        p.y = landingFloor;
        p.parachuting = false;
        p.actionState = 'idle';
        this.onGround = true;
        viceAudio.playImpact(false);
        this.showToast('Parachute Touchdown!');
      }
    } else if (inOceanZone) {
      const waveY = getWaterWaveHeight(p.x, p.z, this.elapsedSec, this.currentStormFactor);
      if (this.keys['KeyC']) p.y = Math.max(-2.9, p.y - dt * 3.2);
      else if (this.keys['Space']) p.y = Math.min(waveY - 0.15, p.y + dt * 3.4);
      else p.y = THREE.MathUtils.damp(p.y, p.y < -0.9 ? p.y : waveY - 0.3, 4, dt);

      p.underwater = p.y < -0.95;
      p.actionState = p.underwater ? 'dive_water' : 'swim';
      if (p.underwater) {
        p.oxygen = Math.max(0, p.oxygen - dt * 6.5);
        if (p.oxygen <= 0) p.health = Math.max(0, p.health - dt * 10);
        for (const tr of this.treasures) {
          if (!tr.found && Math.hypot(p.x - tr.x, p.z - tr.z) < 2.8) {
            tr.found = true;
            this.underwaterTreasureFound++;
            this.cash += tr.value;
            p.duffelBag.lootValue += tr.value;
            const mesh = this.treasureMeshes.get(tr.id);
            if (mesh) mesh.visible = false;
            viceAudio.playCashRegister();
            this.showToast(`Recovered Underwater Treasure! +$${tr.value.toLocaleString()}`);
            this.checkMissionProgress();
          }
        }
      } else {
        p.oxygen = Math.min(100, p.oxygen + dt * 24);
      }
    } else {
      p.underwater = false;
      p.oxygen = 100;
      if (this.keys['Space'] && this.onGround) {
        this.playerVy = 7.2;
        this.onGround = false;
        p.crouching = false;
        p.prone = false;
        p.actionState = 'jump';
      }
      this.playerVy -= 20 * dt;
      p.y += this.playerVy * dt;
      const floorH = groundFloor > 0 ? groundFloor : LAND_Y;
      if (p.y <= floorH) {
        p.y = floorH;
        this.playerVy = 0;
        this.onGround = true;
      }

      if (this.actionTimer <= 0) {
        if (!this.onGround) p.actionState = 'jump';
        else if (p.prone) p.actionState = 'prone';
        else if (p.crouching) p.actionState = 'crouch';
        else if (this.aiming) p.actionState = 'combat_aim';
        else if (moving) p.actionState = sprinting ? 'run' : 'walk';
        else p.actionState = 'idle';
      }
    }

    if (p.health <= 0) {
      this.screen = 'wasted';
      this.pushHud();
    }

    this.syncProtagonistRigs(dt);
  }

  private resolveCharacterCollisions(p: ProtagonistState, radius: number) {
    for (const c of this.propColliders) {
      const dx = p.x - c.x;
      const dz = p.z - c.z;
      const dist = Math.hypot(dx, dz);
      const minD = radius + c.radius;
      if (dist > 0.001 && dist < minD) {
        const push = minD - dist;
        p.x += (dx / dist) * push;
        p.z += (dz / dist) * push;
      }
    }
    for (const wt of this.weakTreeEntries) {
      if (!wt.data.intact) continue;
      const dx = p.x - wt.data.x;
      const dz = p.z - wt.data.z;
      const dist = Math.hypot(dx, dz);
      const minD = radius + 0.45;
      if (dist > 0.001 && dist < minD) {
        p.x += (dx / dist) * (minD - dist);
        p.z += (dz / dist) * (minD - dist);
      }
    }
    // Size-accurate OBB collision against vehicles!
    for (const v of this.vehicles) {
      if (v === this.drivingVehicle || v.y > 1.8) continue;
      const cos = Math.cos(-v.yaw);
      const sin = Math.sin(-v.yaw);
      const dx = p.x - v.x;
      const dz = p.z - v.z;
      const lx = dx * cos - dz * sin;
      const lz = dx * sin + dz * cos;
      const hw = v.rig.halfWidth + radius;
      const hl = v.rig.halfLength + radius;
      if (Math.abs(lx) < hw && Math.abs(lz) < hl) {
        const penX = hw - Math.abs(lx);
        const penZ = hl - Math.abs(lz);
        let pushLx = 0;
        let pushLz = 0;
        if (penX < penZ) pushLx = (lx >= 0 ? 1 : -1) * penX;
        else pushLz = (lz >= 0 ? 1 : -1) * penZ;
        const wCos = Math.cos(v.yaw);
        const wSin = Math.sin(v.yaw);
        p.x += pushLx * wCos - pushLz * wSin;
        p.z += pushLx * wSin + pushLz * wCos;
      }
    }
    // People never pass through people!
    for (const npc of this.npcs) {
      if (!npc.alive || npc.drivingCar) continue;
      const dx = p.x - npc.x;
      const dz = p.z - npc.z;
      const dist = Math.hypot(dx, dz);
      const minD = radius + 0.44;
      if (dist > 0.001 && dist < minD) {
        const push = (minD - dist) * 0.6;
        p.x += (dx / dist) * push;
        p.z += (dz / dist) * push;
        npc.x -= (dx / dist) * push * 0.4;
        npc.z -= (dz / dist) * push * 0.4;
      }
    }
  }

  private syncProtagonistRigs(dt: number) {
    (['jason', 'lucia'] as ProtagonistId[]).forEach((id) => {
      const state = this.protagonists[id];
      const rig = this.protagonistRigs[id];
      const isActive = id === this.activeId;
      const isDriverInVeh = Boolean(this.drivingVehicle && isActive);
      const partnerVeh =
        !isActive && this.relationship.partnerInVehicleId
          ? this.vehicles.find((vh) => vh.state.id === this.relationship.partnerInVehicleId) || null
          : null;
      const activeVeh = isDriverInVeh ? this.drivingVehicle : partnerVeh;

      rig.root.visible = true;

      const ridingBike = Boolean(activeVeh && activeVeh.state.tier === 'bike');
      let renderX = state.x;
      let renderY = state.y;
      let renderZ = state.z;
      let renderYaw = state.yaw;

      if (activeVeh) {
        const seatPos = this.getVehicleSeatWorldPos(activeVeh, isDriverInVeh ? activeVeh.state.seat : 'passenger');
        renderX = seatPos.x;
        renderY = seatPos.y;
        renderZ = seatPos.z;
        renderYaw = activeVeh.yaw;
        state.actionState = 'sit_drive';
      }

      rig.root.position.set(renderX, renderY, renderZ);
      rig.root.rotation.y = renderYaw;
      if (activeVeh && (activeVeh.state.tier === 'bike' || activeVeh.state.tier === 'boat')) {
        rig.root.rotation.z = activeVeh.rig.chassisGroup.rotation.z * 0.7;
        rig.root.rotation.x = activeVeh.rig.chassisGroup.rotation.x * 0.7;
      } else {
        rig.root.rotation.z = 0;
        rig.root.rotation.x = 0;
      }

      const isBoardingSelf = isActive && Boolean(this.boardingSeq);
      const isExitingSelf = isActive && Boolean(this.exitingSeq);
      const boardingProgress =
        isBoardingSelf && this.boardingSeq
          ? THREE.MathUtils.clamp(1 - this.boardingSeq.timer / this.boardingSeq.duration, 0, 1)
          : 0;
      const exitingProgress =
        isExitingSelf && this.exitingSeq
          ? THREE.MathUtils.clamp(1 - this.exitingSeq.timer / this.exitingSeq.duration, 0, 1)
          : 0;

      const moving = isActive ? this.walkPhase > 0 && !state.isSitting && !activeVeh && !isBoardingSelf && !isExitingSelf : false;
      const sprinting = isActive && Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
      const aw = this.getActiveWeapon(state);
      const seqVeh = activeVeh || (isBoardingSelf ? this.boardingSeq!.vehicle : isExitingSelf ? this.exitingSeq!.vehicle : null);

      animateProtagonistRig(
        rig,
        state,
        {
          walkPhase: isActive ? this.walkPhase : this.elapsedSec * 9,
          attackSwingTimer: isActive ? this.attackSwingTimer : 0,
          actionTimer: isActive ? this.actionTimer : 0,
          isBoarding: isBoardingSelf,
          isRidingBike: ridingBike,
          aiming: isActive && this.aiming,
          timeSec: this.elapsedSec,
          isMoving: moving,
          sprinting,
          boardingProgress,
          exitingProgress,
          steerAngle: activeVeh ? activeVeh.steerAngle : 0,
          ducking: Boolean(activeVeh?.state.ducking),
          vehicleTier: seqVeh?.state.tier,
        },
        dt
      );

      const wVis: 'none' | 'gun' | 'bat' | 'rpg' =
        aw?.id === 'bat' ? 'bat' : aw?.id === 'rpg' ? 'rpg' : aw ? 'gun' : 'none';

      applyCharacterAppearance(
        rig,
        id,
        state.outfit,
        state.stats.muscle,
        state.longGun !== null && state.equippedWeaponId !== state.longGun.id,
        wVis !== 'none',
        state.duffelBag.lootValue > 0 || state.duffelBag.hasKeyCloner,
        state.isSitting,
        ridingBike,
        {
          helmetOn: state.helmetOn,
          wearingBurgerUniform: state.wearingBurgerUniform,
          umbrellaOpen: state.umbrellaOpen,
          parachuting: state.parachuting,
          beardLevel: state.beardLevel,
          earphonesOn: isActive && this.earphonesOn,
          suppressor: Boolean(aw?.attachments?.suppressor),
          scope: Boolean(aw?.attachments?.scope),
          extendedMag: Boolean(aw?.attachments?.extendedMag),
          inVehicle: Boolean(activeVeh || isBoardingSelf || isExitingSelf),
          weaponVisual: wVis,
        }
      );
    });
  }

  private updatePartnerAI(dt: number) {
    const partnerId: ProtagonistId = this.activeId === 'jason' ? 'lucia' : 'jason';
    const player = this.protagonists[this.activeId];
    const partner = this.protagonists[partnerId];
    const rig = this.protagonistRigs[partnerId];

    // Partner boarding player's car with passenger door animation!
    if (this.partnerBoardingSeq) {
      const v = this.partnerBoardingSeq.vehicle;
      const doorX = v.x + Math.cos(v.yaw) * (v.rig.halfWidth + 0.65);
      const doorZ = v.z - Math.sin(v.yaw) * (v.rig.halfWidth + 0.65);
      const d = Math.hypot(doorX - partner.x, doorZ - partner.z);
      if (d > 1.4 && d < 45) {
        const nx = (doorX - partner.x) / d;
        const nz = (doorZ - partner.z) / d;
        partner.x += nx * 9.5 * dt;
        partner.z += nz * 9.5 * dt;
        partner.y = getTerrainHeightAt(partner.x, partner.z);
        partner.yaw = Math.atan2(nx, nz);
        const swing = Math.sin(this.elapsedSec * 12) * 0.55;
        rig.leftLeg.rotation.x = swing;
        rig.rightLeg.rotation.x = -swing;
        return;
      } else if (d <= 1.4) {
        v.rightDoorTimer = 0.6;
        this.partnerBoardingSeq.timer -= dt;
        if (this.partnerBoardingSeq.timer <= 0) {
          this.relationship.partnerInVehicleId = v.state.id;
          this.relationship.partnerState = 'in_car';
          this.partnerBoardingSeq = null;
          viceAudio.playDoorLatch();
          this.showToast(`${partner.name} hopped into the passenger seat!`);
        }
        return;
      } else {
        // Too far away -> drive to player first!
        this.relationship.partnerState = 'driving_to_player';
      }
    }

    if (this.relationship.partnerInVehicleId) {
      const v = this.vehicles.find((vh) => vh.state.id === this.relationship.partnerInVehicleId);
      if (v) {
        partner.x = v.x;
        partner.y = v.y;
        partner.z = v.z;
        this.relationship.partnerState = 'in_car';
      }
      return;
    }

    if (!this.relationship.duoActive) {
      this.relationship.partnerState = 'home';
      return;
    }

    if (partner.isSitting) return;

    // Mutual Defense AI: Lucia defends Jason if anyone attacks him (and vice versa)
    const threatNpc = this.activeId === 'jason' ? this.lastAttackerForJason : this.lastAttackerForLucia;
    if (threatNpc && threatNpc.alive && Math.hypot(threatNpc.x - partner.x, threatNpc.z - partner.z) < 32) {
      if (Math.random() < dt * 2.2) {
        const dx = threatNpc.x - partner.x;
        const dz = threatNpc.z - partner.z;
        const len = Math.max(0.1, Math.hypot(dx, dz));
        partner.yaw = Math.atan2(dx, dz);
        this.spawnTracer(partner.x, partner.y + 1.35, partner.z, (dx / len) * 78, 0, (dz / len) * 78, true, 24);
        viceAudio.playGunshot(true);
      }
    } else {
      for (const npc of this.npcs) {
        if (npc.alive && npc.hostile && Math.hypot(npc.x - player.x, npc.z - player.z) < 26) {
          if (Math.random() < dt * 1.6) {
            const dx = npc.x - partner.x;
            const dz = npc.z - partner.z;
            const len = Math.max(0.1, Math.hypot(dx, dz));
            partner.yaw = Math.atan2(dx, dz);
            this.spawnTracer(partner.x, partner.y + 1.35, partner.z, (dx / len) * 78, 0, (dz / len) * 78, true, 24);
            viceAudio.playGunshot(true);
          }
          break;
        }
      }
    }

    // Distance-based Smart Companion AI (ZERO Teleportation):
    // >= 45m -> Lucia runs to nearest vehicle, pulls out driver if occupied, drives via A* street/bridge route & honks on arrival!
    const directDist = Math.hypot(player.x - partner.x, player.z - partner.z);
    if (this.relationship.partnerState === 'driving_to_player' || (directDist >= 45 && !this.partnerDrivingVehicle)) {
      this.relationship.partnerState = 'driving_to_player';
      if (!this.partnerDrivingVehicle) {
        let bestCar: WorldVehicle | null = null;
        let bestD = 90;
        for (const v of this.vehicles) {
          if (v === this.drivingVehicle || v.state.tier === 'boat' || v.state.tier === 'plane' || v.state.tier === 'heli') continue;
          const d = Math.hypot(v.x - partner.x, v.z - partner.z);
          if (d < bestD) { bestD = d; bestCar = v; }
        }
        if (bestCar) {
          if (bestD > 2.6) {
            const nx = (bestCar.x - partner.x) / bestD;
            const nz = (bestCar.z - partner.z) / bestD;
            partner.x += nx * 10.5 * dt;
            partner.z += nz * 10.5 * dt;
            partner.y = getTerrainHeightAt(partner.x, partner.z);
            partner.yaw = Math.atan2(nx, nz);
            const swing = Math.sin(this.elapsedSec * 12) * 0.55;
            rig.leftLeg.rotation.x = swing;
            rig.rightLeg.rotation.x = -swing;
          } else {
            bestCar.leftDoorTimer = 0.65;
            bestCar.isTraffic = false;
            bestCar.driverPresent = false;
            bestCar.state.hotwired = true;
            this.partnerDrivingVehicle = bestCar;
            this.partnerRoute = computeGpsRoute(bestCar.x, bestCar.z, player.x, player.z);
            this.partnerRouteIdx = 0;
            viceAudio.playDoorLatch();
          }
          return;
        }
      }

      if (this.partnerDrivingVehicle) {
        const car = this.partnerDrivingVehicle;
        const distToPlayer = Math.hypot(player.x - car.x, player.z - car.z);
        if (distToPlayer <= 15) {
          car.state.speed = 0;
          car.leftDoorTimer = 0.65;
          partner.x = car.x - Math.cos(car.yaw) * (car.rig.halfWidth + 1.1);
          partner.z = car.z + Math.sin(car.yaw) * (car.rig.halfWidth + 1.1);
          partner.y = getTerrainHeightAt(partner.x, partner.z);
          this.partnerDrivingVehicle = null;
          this.partnerRoute = [];
          this.relationship.partnerState = 'following';
          viceAudio.playHorn();
          this.showToast(`${partner.name} pulled up beside you in a ${car.state.name} and honked!`);
          return;
        }

        if (this.partnerRoute.length === 0 || Math.hypot(this.partnerRoute[this.partnerRoute.length - 1].x - player.x, this.partnerRoute[this.partnerRoute.length - 1].z - player.z) > 25) {
          this.partnerRoute = computeGpsRoute(car.x, car.z, player.x, player.z);
          this.partnerRouteIdx = 0;
        }
        const wp = this.partnerRoute[Math.min(this.partnerRouteIdx, this.partnerRoute.length - 1)] ?? { x: player.x, z: player.z };
        const dx = wp.x - car.x;
        const dz = wp.z - car.z;
        const wpDist = Math.hypot(dx, dz);
        if (wpDist < 10 && this.partnerRouteIdx < this.partnerRoute.length - 1) {
          this.partnerRouteIdx++;
        }
        const targetYaw = Math.atan2(dx, dz);
        car.yaw = this.dampAngle(car.yaw, targetYaw, 4.5, dt);
        const drvSpeed = 23;
        const nx = car.x + Math.sin(car.yaw) * drvSpeed * dt;
        const nz = car.z + Math.cos(car.yaw) * drvSpeed * dt;
        if (!this.collidesWithSolidWall(nx, nz, 1.3)) {
          car.x = nx;
          car.z = nz;
        } else {
          car.yaw += 1.2 * dt;
        }
        car.y = getTerrainHeightAt(car.x, car.z);
        car.wheelSpin += drvSpeed * dt * 2.4;
        partner.x = car.x;
        partner.y = car.y;
        partner.z = car.z;
        partner.yaw = car.yaw;
        return;
      }
    }

    const targetX = player.x + Math.cos(player.yaw) * 2.2;
    const targetZ = player.z - Math.sin(player.yaw) * 2.2;
    const dist = Math.hypot(targetX - partner.x, targetZ - partner.z);

    if (dist > 1.8) {
      const speed = dist > 8 ? 10.5 : 6.2;
      const nx = (targetX - partner.x) / dist;
      const nz = (targetZ - partner.z) / dist;
      const nextX = partner.x + nx * speed * dt;
      const nextZ = partner.z + nz * speed * dt;
      if (!this.collidesWithSolidWall(nextX, partner.z, 0.4)) partner.x = nextX;
      else partner.z += (nz >= 0 ? 1 : -1) * speed * 0.6 * dt;
      if (!this.collidesWithSolidWall(partner.x, nextZ, 0.4)) partner.z = nextZ;
      else partner.x += (nx >= 0 ? 1 : -1) * speed * 0.6 * dt;
      const floorY = getTerrainHeightAt(partner.x, partner.z);
      partner.y = THREE.MathUtils.damp(partner.y, floorY > 0 ? floorY : player.y, 8, dt);
      partner.yaw = Math.atan2(nx, nz);

      const swing = Math.sin(this.elapsedSec * 11) * 0.5;
      rig.leftLeg.rotation.x = swing;
      rig.rightLeg.rotation.x = -swing;
      rig.leftArm.rotation.x = -swing * 0.6;
      rig.rightArm.rotation.x = swing * 0.6;
    } else {
      this.relationship.partnerState = 'following';
      rig.leftLeg.rotation.x = 0;
      rig.rightLeg.rotation.x = 0;
      rig.leftArm.rotation.x = 0;
      rig.rightArm.rotation.x = 0;
    }
  }

  private updateDriving(dt: number) {
    const veh = this.drivingVehicle!;
    const s = veh.state;
    const isBoat = s.tier === 'boat';
    const isHeli = s.tier === 'heli';
    const isPlane = s.tier === 'plane';
    const isBike = s.tier === 'bike';

    const accelInput = (this.keys['KeyW'] ? 1 : 0) - (this.keys['KeyS'] ? 1 : 0) - this.touchMoveZ;
    const steerInput = (this.keys['KeyA'] ? 1 : 0) - (this.keys['KeyD'] ? 1 : 0) - this.touchMoveX;
    const handbrake = Boolean(this.keys['Space']);
    const effectiveMaxSpeed = s.tireFlat ? s.maxSpeed * 0.55 : s.maxSpeed;

    if (s.fuel <= 0 || (isBoat && s.anchorDropped)) {
      s.speed = THREE.MathUtils.damp(s.speed, 0, s.anchorDropped ? 4.5 : 2.5, dt);
    } else if (Math.abs(accelInput) > 0.05) {
      const accel = isPlane ? 22 : s.tier === 'luxury' || isBike ? 30 : 21;
      s.speed = THREE.MathUtils.clamp(s.speed + accelInput * accel * dt, -14, effectiveMaxSpeed);
      s.fuel = Math.max(0, s.fuel - Math.abs(accelInput) * dt * (s.fuelType === 'ev' ? 0.4 : 0.55));
    } else {
      s.speed = THREE.MathUtils.damp(s.speed, 0, handbrake && !isHeli && !isPlane ? 5.0 : 1.8, dt);
    }

    // Helicopter & Airplane Vertical Flight Physics!
    if (isHeli) {
      const climb = (this.keys['Space'] ? 1 : 0) - (this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? 1 : 0);
      veh.vy = THREE.MathUtils.damp(veh.vy, climb * 16, 5, dt);
      veh.y = THREE.MathUtils.clamp(veh.y + veh.vy * dt, LAND_Y, 140);
      const turnRate = veh.y > LAND_Y + 0.5 ? 1.8 : 0.4;
      veh.yaw += steerInput * turnRate * dt;
    } else if (isPlane) {
      const liftReady = s.speed > 24;
      const climb = (this.keys['Space'] ? 1 : 0) - (this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? 1 : 0);
      if (liftReady && climb !== 0) {
        veh.vy = THREE.MathUtils.damp(veh.vy, climb * 18, 4, dt);
      } else if (veh.y > LAND_Y && s.speed < 20) {
        veh.vy = -8;
      } else {
        veh.vy = THREE.MathUtils.damp(veh.vy, 0, 4, dt);
      }
      veh.y = THREE.MathUtils.clamp(veh.y + veh.vy * dt, LAND_Y, 180);
      const turnFactor = Math.min(1, Math.abs(s.speed) / 8);
      veh.yaw += steerInput * 1.45 * turnFactor * dt;
    } else {
      const turnFactor = Math.min(1, Math.abs(s.speed) / 5.5) * (s.speed >= 0 ? 1 : -1);
      veh.steerAngle = THREE.MathUtils.damp(veh.steerAngle, steerInput * 0.5, 12, dt);
      veh.yaw += veh.steerAngle * (isBike ? 3.5 : 2.9) * turnFactor * dt;
    }

    const dirX = Math.sin(veh.yaw);
    const dirZ = Math.cos(veh.yaw);
    veh.vx = dirX * s.speed;
    veh.vz = dirZ * s.speed;
    const nextX = THREE.MathUtils.clamp(veh.x + veh.vx * dt, -600, 660);
    const nextZ = THREE.MathUtils.clamp(veh.z + veh.vz * dt, -550, 550);

    const wallPad = Math.max(veh.rig.halfWidth, veh.rig.halfLength * 0.72);
    if (veh.y < 10) {
      if (isBoat) {
        if (isWaterChannel(nextX, nextZ)) {
          veh.x = nextX;
          veh.z = nextZ;
        } else {
          s.speed *= -0.35;
        }
      } else {
        const nextBridge = getBridgeDeckInfo(nextX, nextZ);
        if (!nextBridge.onBridge && isWaterChannel(nextX, nextZ) && !isHeli && !isPlane) {
          // Keep land vehicles out of deep water channel unless on Grand Highway Bridge!
          s.speed *= -0.35;
        } else {
          if (!this.collidesWithSolidWall(nextX, veh.z, wallPad)) {
            veh.x = nextX;
          } else {
            s.speed *= -0.35;
            s.health = Math.max(10, s.health - 6);
            viceAudio.playImpact(true);
            this.cameraShake = 0.25;
          }

          if (!this.collidesWithSolidWall(veh.x, nextZ, wallPad)) {
            veh.z = nextZ;
          } else {
            s.speed *= -0.35;
            s.health = Math.max(10, s.health - 6);
            viceAudio.playImpact(true);
          }
        }
        const curBridge = getBridgeDeckInfo(veh.x, veh.z);
        if (curBridge.onBridge && curBridge.nearGuardrail && curBridge.bridge) {
          if (curBridge.bridge.axis === 'z') {
            veh.x = THREE.MathUtils.clamp(veh.x, curBridge.bridge.cx - curBridge.bridge.width / 2 + 1.2, curBridge.bridge.cx + curBridge.bridge.width / 2 - 1.2);
          }
          s.speed *= 0.88;
        }
        if (!isHeli && !isPlane) {
          const groundY = getTerrainHeightAt(veh.x, veh.z);
          veh.y = THREE.MathUtils.damp(veh.y, groundY > 0 ? groundY : LAND_Y, 16, dt);
        }
      }

      // Destructible Weak Trees!
      for (const wt of this.weakTreeEntries) {
        if (!wt.data.intact) continue;
        const dx = veh.x - wt.data.x;
        const dz = veh.z - wt.data.z;
        const dist = Math.hypot(dx, dz);
        if (dist < wallPad + 0.55) {
          if (Math.abs(s.speed) > 7.5) {
            wt.data.intact = false;
            wt.data.fallDirX = -Math.sign(dirX || 1);
            wt.data.fallDirZ = Math.sign(dirZ || 1);
            s.speed *= 0.72;
            viceAudio.playTreeSnap();
            this.cameraShake = 0.18;
          } else {
            veh.x += (dx / Math.max(0.01, dist)) * (wallPad + 0.55 - dist);
            veh.z += (dz / Math.max(0.01, dist)) * (wallPad + 0.55 - dist);
          }
        }
      }

      // Solid Props
      for (const c of this.propColliders) {
        const dx = veh.x - c.x;
        const dz = veh.z - c.z;
        const dist = Math.hypot(dx, dz);
        const minD = wallPad + c.radius;
        if (dist > 0.001 && dist < minD) {
          veh.x += (dx / dist) * (minD - dist);
          veh.z += (dz / dist) * (minD - dist);
          if (Math.abs(s.speed) > 4) {
            s.speed *= 0.45;
            s.health = Math.max(10, s.health - 4);
            viceAudio.playImpact(true);
            this.cameraShake = 0.18;
          }
        }
      }

      // Rigid-Body 2D OBB SAT Vehicle-to-Vehicle Collision Physics!
      for (const other of this.vehicles) {
        if (other === veh || Math.abs(veh.y - other.y) > 2.2) continue;
        const otherIsBike = other.state.tier === 'bike';
        const otherIsBoat = other.state.tier === 'boat';
        const otherIsAir = other.state.tier === 'plane' || other.state.tier === 'heli';
        const bodyA: RigidBodyVehicleInput = {
          x: veh.x,
          y: veh.y,
          z: veh.z,
          yaw: veh.yaw,
          vx: veh.vx,
          vz: veh.vz,
          angVel: veh.angVel,
          speed: s.speed,
          halfWidth: veh.rig.halfWidth,
          halfLength: veh.rig.halfLength,
          mass: isBike ? 0.55 : isBoat || isPlane || isHeli ? 2.4 : 1.35,
          health: s.health,
          maxHealth: s.maxHealth,
          isBoat,
          isBike,
          isAir: isPlane || isHeli,
          tireFlat: s.tireFlat,
        };
        const bodyB: RigidBodyVehicleInput = {
          x: other.x,
          y: other.y,
          z: other.z,
          yaw: other.yaw,
          vx: other.vx,
          vz: other.vz,
          angVel: other.angVel,
          speed: other.state.speed,
          halfWidth: other.rig.halfWidth,
          halfLength: other.rig.halfLength,
          mass: otherIsBike ? 0.55 : otherIsBoat || otherIsAir ? 2.4 : 1.35,
          health: other.state.health,
          maxHealth: other.state.maxHealth,
          isBoat: otherIsBoat,
          isBike: otherIsBike,
          isAir: otherIsAir,
          tireFlat: other.state.tireFlat,
        };
        const res = resolveVehicleOBBCollision(bodyA, bodyB);
        if (res.collided) {
          veh.x = bodyA.x;
          veh.z = bodyA.z;
          veh.vx = bodyA.vx;
          veh.vz = bodyA.vz;
          veh.angVel = bodyA.angVel;
          s.speed = bodyA.speed;
          s.health = bodyA.health;

          other.x = bodyB.x;
          other.z = bodyB.z;
          other.vx = bodyB.vx;
          other.vz = bodyB.vz;
          other.angVel = bodyB.angVel;
          other.state.speed = bodyB.speed * 0.9;
          other.state.health = bodyB.health;

          if (res.impactSpeed > 4.5) {
            if (res.impactSpeed > 22 && !s.tireFlat && !isBoat && !isPlane && !isHeli) {
              s.tireFlat = true;
              this.showToast('Tire Blowout! Speed capped — press [Y] near hood or visit Gas Station!');
            }
            viceAudio.playImpact(true);
            this.cameraShake = 0.24;
          }
        }
      }

      // Car-to-NPC Knockback & Impact Physics!
      if (Math.abs(s.speed) > 5.0) {
        for (const npc of this.npcs) {
          if (!npc.alive || npc.kind === 'child' || npc.drivingCar) continue;
          const dx = npc.x - veh.x;
          const dz = npc.z - veh.z;
          const dist = Math.hypot(dx, dz);
          if (dist < wallPad + 0.65) {
            const nx = dx / Math.max(0.1, dist);
            const nz = dz / Math.max(0.1, dist);
            const impulse = Math.abs(s.speed) * 0.65;
            this.damageNpc(npc, Math.abs(s.speed) * 5.2, false, this.activeId, nx * impulse, nz * impulse);
            viceAudio.playImpact(false);
          }
        }
      }
    }

    const p = this.protagonists[this.activeId];
    p.x = veh.x;
    p.y = veh.y;
    p.z = veh.z;
    p.yaw = veh.yaw;

    if (s.gpsTrackerActive) {
      s.gpsTimer -= dt;
      if (s.gpsTimer <= 0) {
        s.gpsTrackerActive = false;
        this.addWantedStars(2);
        this.showToast('GPS Tracker pinged Vice PD! Lose them or reach a Fence!');
      }
    }

    if (isBoat) {
      const buoy = computeBoatBuoyancyPose(veh.x, veh.z, veh.yaw, s.speed, this.elapsedSec, this.currentStormFactor);
      veh.y = buoy.y;
      veh.rig.chassisGroup.rotation.x = THREE.MathUtils.damp(veh.rig.chassisGroup.rotation.x, buoy.pitch, 6, dt);
      veh.rig.chassisGroup.rotation.z = THREE.MathUtils.damp(veh.rig.chassisGroup.rotation.z, buoy.roll, 6, dt);
    } else {
      const leanTarget = isBike
        ? -steerInput * Math.min(1, Math.abs(s.speed) / 22) * 0.42
        : isPlane || isHeli
        ? -steerInput * 0.35
        : -veh.steerAngle * (s.speed / Math.max(1, s.maxSpeed)) * 0.14;
      veh.rig.chassisGroup.rotation.z = THREE.MathUtils.damp(veh.rig.chassisGroup.rotation.z, leanTarget, 8, dt);
      if (isPlane || isHeli) {
        veh.rig.chassisGroup.rotation.x = THREE.MathUtils.damp(veh.rig.chassisGroup.rotation.x, (accelInput * 0.14) - (veh.vy * 0.015), 6, dt);
      } else if (isBike && s.wheelieActive && Math.abs(s.speed) > 6) {
        veh.rig.chassisGroup.rotation.x = THREE.MathUtils.damp(veh.rig.chassisGroup.rotation.x, -0.34, 8, dt);
      } else {
        veh.rig.chassisGroup.rotation.x = THREE.MathUtils.damp(veh.rig.chassisGroup.rotation.x, 0, 8, dt);
      }
    }
    veh.wheelSpin += s.speed * dt * 2.4;
  }

  private updateVehicles(dt: number) {
    this.blinkerTimer += dt;
    if (this.blinkerTimer > 0.42) {
      this.blinkerTimer = 0;
      this.blinkerBlinkState = !this.blinkerBlinkState;
      if (this.drivingVehicle && (this.drivingVehicle.state.leftBlinker || this.drivingVehicle.state.rightBlinker)) {
        viceAudio.playBlinkerTick();
      }
    }

    for (const v of this.vehicles) {
      // Decay collision rotational impulse
      if (Math.abs(v.angVel) > 0.005) {
        v.yaw += v.angVel * dt;
        v.angVel *= Math.exp(-5.0 * dt);
      }
      if (v.state.tier === 'boat' && v !== this.drivingVehicle) {
        const buoy = computeBoatBuoyancyPose(v.x, v.z, v.yaw, 0, this.elapsedSec, this.currentStormFactor);
        v.y = buoy.y;
        v.rig.chassisGroup.rotation.x = THREE.MathUtils.damp(v.rig.chassisGroup.rotation.x, buoy.pitch, 5, dt);
        v.rig.chassisGroup.rotation.z = THREE.MathUtils.damp(v.rig.chassisGroup.rotation.z, buoy.roll, 5, dt);
      }

      if (v.leftDoorTimer > 0) v.leftDoorTimer = Math.max(0, v.leftDoorTimer - dt);
      if (v.rightDoorTimer > 0) v.rightDoorTimer = Math.max(0, v.rightDoorTimer - dt);
      v.leftDoorAngle = THREE.MathUtils.damp(v.leftDoorAngle, v.leftDoorTimer > 0 ? -1.05 : 0, 12, dt);
      v.rightDoorAngle = THREE.MathUtils.damp(v.rightDoorAngle, v.rightDoorTimer > 0 ? 1.05 : 0, 12, dt);

      if (v.hijackedByNpc && v.hijackedByNpc.alive && v !== this.drivingVehicle) {
        const npc = v.hijackedByNpc;
        const speed = 15;
        const nx = v.x + Math.sin(v.yaw) * speed * dt;
        const nz = v.z + Math.cos(v.yaw) * speed * dt;
        if (!this.collidesWithSolidWall(nx, nz, 1.5) && (!isWaterChannel(nx, nz) || getBridgeDeckInfo(nx, nz).onBridge)) {
          v.x = nx;
          v.z = nz;
        } else {
          v.yaw += 1.6 * dt;
        }
        npc.x = v.x;
        npc.z = v.z;
        v.wheelSpin += speed * dt * 2.4;
      } else if (v.isTraffic && v !== this.drivingVehicle) {
        // Respect red traffic signals ahead
        let redLightHold = false;
        for (const sig of this.trafficSignals) {
          const sameAxis = (v.trafficAxis === 'z' && sig.axis === 'ns') || (v.trafficAxis === 'x' && sig.axis === 'ew');
          if (!sameAxis) continue;
          const isGreen = sig.axis === 'ns' ? this.trafficNsGreen : !this.trafficNsGreen;
          if (isGreen) continue;
          if (v.trafficAxis === 'z' && Math.abs(v.x - sig.x) < 14) {
            const ahead = (sig.z - v.z) * v.trafficDir;
            if (ahead > 4 && ahead < 16) {
              redLightHold = true;
              break;
            }
          } else if (v.trafficAxis === 'x' && Math.abs(v.z - sig.z) < 14) {
            const ahead = (sig.x - v.x) * v.trafficDir;
            if (ahead > 4 && ahead < 16) {
              redLightHold = true;
              break;
            }
          }
        }

        if (!redLightHold) {
          if (v.trafficAxis === 'z') {
            const nz = v.z + v.trafficDir * 10.5 * dt;
            if (!this.collidesWithVehicle(v, v.x, nz)) v.z = nz;
            if (Math.abs(v.x) < 10) {
              // Central Highway x=0 crosses Grand Leonida Bridge between Northport & Vice Downtown
              if (v.z > 490) v.z = -490;
              if (v.z < -490) v.z = 490;
            } else if (v.z > 0) {
              if (v.z > 490) v.z = 104;
              if (v.z < 104) v.z = 490;
            } else {
              if (v.z > -104) v.z = -490;
              if (v.z < -490) v.z = -104;
            }
          } else {
            const nx = v.x + v.trafficDir * 10.5 * dt;
            if (!this.collidesWithVehicle(v, nx, v.z)) v.x = nx;
            if (v.x > 315) v.x = -315;
            if (v.x < -315) v.x = 315;
          }
          v.wheelSpin += 10.5 * dt * 2.4;
        }
      }

      if ((v.isPoliceSpawn || (v.isPrecinctUnit && v.driverPresent)) && this.wanted.stars > 0 && v !== this.drivingVehicle) {
        const p = this.protagonists[this.activeId];
        const dx = p.x - v.x;
        const dz = p.z - v.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 10 && dist < 260) {
          const targetYaw = Math.atan2(dx, dz);
          v.yaw = this.dampAngle(v.yaw, targetYaw, 3.8, dt);
          const pSpeed = 19 + this.wanted.stars * 2.2;
          const nx = v.x + Math.sin(v.yaw) * pSpeed * dt;
          const nz = v.z + Math.cos(v.yaw) * pSpeed * dt;
          const onLandOrBridge = !isWaterChannel(nx, nz) || getBridgeDeckInfo(nx, nz).onBridge;
          if (onLandOrBridge && !this.collidesWithSolidWall(nx, nz, 1.45) && !this.collidesWithVehicle(v, nx, nz)) {
            v.x = nx;
            v.z = nz;
          } else {
            v.yaw += 1.4 * dt;
          }
          v.wheelSpin += pSpeed * dt * 2.4;
        }
      }

      if (v !== this.drivingVehicle && v.state.tier !== 'boat' && v.state.tier !== 'plane' && v.state.tier !== 'heli') {
        const terrainY = getTerrainHeightAt(v.x, v.z);
        if (terrainY > 0) v.y = terrainY;
      }

      v.rig.root.position.set(v.x, v.y, v.z);
      v.rig.root.rotation.y = v.yaw;

      animateVehicleRig(
        v.rig,
        v.state,
        v.steerAngle,
        v.wheelSpin,
        v.leftDoorAngle,
        v.rightDoorAngle,
        v === this.drivingVehicle,
        v.y > 0.65,
        this.elapsedSec,
        this.blinkerBlinkState,
        this.wanted.stars,
        Boolean(v.driverPresent),
        dt
      );
    }
  }

  private collidesWithVehicle(self: WorldVehicle, nx: number, nz: number): boolean {
    for (const o of this.vehicles) {
      if (o === self) continue;
      if (Math.hypot(nx - o.x, nz - o.z) < 3.6) return true;
    }
    return false;
  }

  private updateNpcsAndPolice(dt: number) {
    const p = this.protagonists[this.activeId];

    // Occasional Random Street Fight between 2 Civilians (with Police response if nearby!)
    this.randomBrawlTimer -= dt;
    if (this.randomBrawlTimer <= 0) {
      this.randomBrawlTimer = 28;
      const civs = this.npcs.filter((n) => n.alive && n.kind === 'civilian' && !n.hostile && !n.fleeing && !n.drivingCar);
      if (civs.length >= 2) {
        const a = civs[0];
        let b: WorldNPC | null = null;
        let bestD = 30;
        for (let i = 1; i < civs.length; i++) {
          const d = Math.hypot(civs[i].x - a.x, civs[i].z - a.z);
          if (d < bestD) { bestD = d; b = civs[i]; }
        }
        if (b) {
          a.kind = 'brawler';
          a.targetNpc = b;
          b.kind = 'brawler';
          b.targetNpc = a;
        }
      }
    }

    if (this.wanted.stars > 0) {
      this.policeSpawnTimer += dt;
      const activeCops = this.npcs.filter((n) => n.alive && (n.kind === 'police' || n.kind === 'swat')).length;
      const targetCops = Math.min(12, this.wanted.stars * 2 + 2);

      if (activeCops < targetCops && this.policeSpawnTimer > 2.2) {
        this.policeSpawnTimer = 0;
        const angle = Math.random() * Math.PI * 2;
        let sx = THREE.MathUtils.clamp(p.x + Math.cos(angle) * 34, -330, 330);
        let sz = THREE.MathUtils.clamp(p.z + Math.sin(angle) * 34, -490, 490);
        if (isWaterChannel(sx, sz) && !getBridgeDeckInfo(sx, sz).onBridge) {
          sx = p.x;
          sz = p.z > 0 ? Math.max(106, p.z - 22) : Math.min(-106, p.z + 22);
        }
        const sy = Math.max(LAND_Y, getTerrainHeightAt(sx, sz));
        const isSwat = this.wanted.stars >= 4;

        const rig = createCharacterRig(isSwat ? 'swat' : 'police', this.textures.contactShadow);
        rig.root.position.set(sx, sy, sz);
        this.scene.add(rig.root);
        this.npcs.push({
          id: `cop_${Math.random().toString(36).slice(2, 7)}`,
          name: isSwat ? 'NOOSE Tactical' : 'Vice PD Officer',
          archetype: isSwat ? 'SWAT Unit' : 'Law Enforcement',
          rig,
          x: sx, y: sy, z: sz,
          vx: 0, vy: 0, vz: 0, tumbleAngle: 0,
          yaw: 0,
          speed: isSwat ? 5.8 : 5.1,
          walkPhase: 0,
          kind: isSwat ? 'swat' : 'police',
          hp: isSwat ? 130 : 85,
          alive: true,
          hostile: true,
          armed: true,
          fleeing: false,
          isWitness: false,
          witnessTimer: 0,
          mood: -100,
          patrolCenterX: sx,
          patrolCenterZ: sz,
          wanderTimer: 0,
          fireCooldown: 1.0,
          meleeCooldown: 0,
          targetProtagonist: this.activeId,
          targetNpc: null,
        });
      }
    }

    for (const npc of this.npcs) {
      if (npc.chatterCooldown && npc.chatterCooldown > 0) {
        npc.chatterCooldown = Math.max(0, npc.chatterCooldown - dt);
      }

      if (!npc.alive) {
        const floorY = Math.max(LAND_Y, getTerrainHeightAt(npc.x, npc.z));
        if (npc.y > floorY + 0.2 || Math.abs(npc.vx) > 0.1 || Math.abs(npc.vz) > 0.1) {
          npc.x += npc.vx * dt;
          npc.z += npc.vz * dt;
          npc.vx *= Math.exp(-5 * dt);
          npc.vz *= Math.exp(-5 * dt);
          npc.vy -= 18 * dt;
          npc.y = Math.max(floorY + 0.2, npc.y + npc.vy * dt);
          npc.rig.root.position.set(npc.x, npc.y, npc.z);
        }
        continue;
      }

      if (npc.drivingCar) {
        npc.rig.root.visible = false;
        continue;
      }

      const floorY = Math.max(LAND_Y, getTerrainHeightAt(npc.x, npc.z));

      // Apply knockback velocity if struck by car!
      if (Math.abs(npc.vx) > 0.15 || Math.abs(npc.vz) > 0.15 || npc.y > floorY + 0.02) {
        npc.x += npc.vx * dt;
        npc.z += npc.vz * dt;
        npc.vx *= Math.exp(-4.5 * dt);
        npc.vz *= Math.exp(-4.5 * dt);
        npc.vy -= 20 * dt;
        npc.y = Math.max(floorY, npc.y + npc.vy * dt);
        if (npc.y <= floorY) { npc.vy = 0; npc.tumbleAngle = 0; }
      } else {
        npc.y = floorY;
      }

      // Precinct Police Officer boarding parked Police Cruiser with door animation!
      if (npc.boardingCar) {
        const car = npc.boardingCar;
        const d = Math.hypot(car.x - npc.x, car.z - npc.z);
        if (d > 2.2) {
          const nx = (car.x - npc.x) / d;
          const nz = (car.z - npc.z) / d;
          npc.x += nx * npc.speed * 1.3 * dt;
          npc.z += nz * npc.speed * 1.3 * dt;
          npc.yaw = Math.atan2(nx, nz);
          npc.walkPhase += dt * 11;
          npc.rig.root.position.set(npc.x, npc.y, npc.z);
          npc.rig.root.rotation.y = npc.yaw;
          const swing = Math.sin(npc.walkPhase) * 0.5;
          npc.rig.leftLeg.rotation.x = swing;
          npc.rig.rightLeg.rotation.x = -swing;
        } else {
          car.leftDoorTimer = 0.65;
          car.driverPresent = true;
          car.isPoliceSpawn = true;
          npc.boardingCar = null;
          npc.drivingCar = car;
          npc.rig.root.visible = false;
        }
        continue;
      }

      if (npc.isWitness) {
        npc.rig.witnessMarker.rotation.y += dt * 4;
        npc.witnessTimer += dt;
        this.wanted.witnessProgress = Math.min(100, (npc.witnessTimer / 4.2) * 100);
        if (npc.witnessTimer >= 4.2) {
          npc.isWitness = false;
          npc.rig.witnessMarker.visible = false;
          this.wanted.witnessActive = false;
          this.wanted.witnessProgress = 0;
          this.addWantedStars(1);
        }
      }

      if (npc.kind === 'child') {
        npc.wanderTimer -= dt;
        if (npc.wanderTimer <= 0) {
          npc.wanderTimer = 1.6 + Math.random() * 2.2;
          npc.yaw = Math.atan2(
            CENTRAL_PARK.playgroundX - npc.x + (Math.random() - 0.5) * 10,
            CENTRAL_PARK.playgroundZ - npc.z + (Math.random() - 0.5) * 9
          );
        }
        npc.x += Math.sin(npc.yaw) * npc.speed * dt;
        npc.z += Math.cos(npc.yaw) * npc.speed * dt;
        npc.walkPhase += dt * 11;
        npc.rig.root.position.set(npc.x, LAND_Y + Math.abs(Math.sin(npc.walkPhase * 0.5)) * 0.14, npc.z);
        npc.rig.root.rotation.y = npc.yaw;
        const kSwing = Math.sin(npc.walkPhase) * 0.6;
        npc.rig.leftLeg.rotation.x = kSwing;
        npc.rig.rightLeg.rotation.x = -kSwing;
        npc.rig.leftArm.rotation.x = -kSwing;
        npc.rig.rightArm.rotation.x = kSwing;
        continue;
      }

      if (npc.kind === 'cashier') {
        npc.yaw = Math.atan2(p.x - npc.x, p.z - npc.z);
        npc.rig.root.rotation.y = npc.yaw;
        continue;
      }

      // Random NPC-vs-NPC street brawl AI!
      if (npc.kind === 'brawler' && npc.targetNpc && npc.targetNpc.alive) {
        const foe = npc.targetNpc;
        const dFoe = Math.hypot(foe.x - npc.x, foe.z - npc.z);
        npc.meleeCooldown = Math.max(0, npc.meleeCooldown - dt);
        if (dFoe > 1.35) {
          const nx = (foe.x - npc.x) / dFoe;
          const nz = (foe.z - npc.z) / dFoe;
          npc.x += nx * 3.8 * dt;
          npc.z += nz * 3.8 * dt;
          npc.yaw = Math.atan2(nx, nz);
          npc.walkPhase += dt * 9;
        } else if (npc.meleeCooldown <= 0) {
          npc.meleeCooldown = 1.1;
          this.damageNpc(foe, 14, true, 'npc');
        }
        npc.rig.root.position.set(npc.x, npc.y, npc.z);
        npc.rig.root.rotation.y = npc.yaw;
        continue;
      }

      const target = this.protagonists[npc.targetProtagonist] ?? p;
      const distToTarget = Math.hypot(target.x - npc.x, target.z - npc.z);

      // Civilians panic ONLY if the player actively aims a firearm right at them in LOS (never for merely carrying a weapon)
      if (
        npc.kind === 'civilian' &&
        this.aiming &&
        p.equippedWeaponId !== 'fists' &&
        distToTarget < 7.5 &&
        !npc.fleeing &&
        !npc.hostile &&
        this.hasLineOfSight(npc.x, npc.z, p.x, p.z)
      ) {
        npc.fleeing = true;
      }

      // Rival gang reacts defensively if player aims a firearm in their turf within 9m
      if (
        npc.kind === 'gang' &&
        this.aiming &&
        p.equippedWeaponId !== 'fists' &&
        distToTarget < 9.5 &&
        !npc.hostile &&
        this.hasLineOfSight(npc.x, npc.z, p.x, p.z)
      ) {
        npc.hostile = true;
        npc.targetProtagonist = this.activeId;
        this.npcSubtitle = {
          speaker: npc.name,
          text: npc.gangFaction === 'royals' ? 'Wrong block! Light them up!' : 'Step off Northport Docks, now!',
          hostile: true,
        };
        this.npcSubtitleTimer = 3.2;
        viceAudio.speakNpcLine(this.npcSubtitle.text, 0.92);
      }

      if (npc.hostile && (this.wanted.stars > 0 || npc.kind === 'civilian' || npc.kind === 'brawler' || npc.kind === 'gang')) {
        const stopDist = npc.armed ? 7.5 : 1.35;
        if (distToTarget > stopDist && distToTarget < 85) {
          const nx = (target.x - npc.x) / distToTarget;
          const nz = (target.z - npc.z) / distToTarget;
          const nextX = npc.x + nx * npc.speed * 1.65 * dt;
          const nextZ = npc.z + nz * npc.speed * 1.65 * dt;
          if (!this.collidesWithSolidWall(nextX, npc.z, 0.35) && (!isWaterChannel(nextX, npc.z) || getBridgeDeckInfo(nextX, npc.z).onBridge)) npc.x = nextX;
          if (!this.collidesWithSolidWall(npc.x, nextZ, 0.35) && (!isWaterChannel(npc.x, nextZ) || getBridgeDeckInfo(npc.x, nextZ).onBridge)) npc.z = nextZ;
          npc.yaw = Math.atan2(nx, nz);
          npc.walkPhase += dt * 10;
        } else {
          npc.yaw = Math.atan2(target.x - npc.x, target.z - npc.z);
        }

        npc.meleeCooldown = Math.max(0, npc.meleeCooldown - dt);
        npc.fireCooldown = Math.max(0, npc.fireCooldown - dt);

        if (distToTarget < 1.8 && npc.meleeCooldown <= 0 && !this.drivingVehicle) {
          npc.meleeCooldown = 1.05;
          viceAudio.playImpact(false);
          this.damageProtagonist(npc.targetProtagonist, 9, npc);
        } else if (npc.armed && distToTarget < 28 && npc.fireCooldown <= 0 && !this.currentInterior) {
          npc.fireCooldown = npc.kind === 'swat' ? 0.65 : npc.kind === 'gang' ? 0.95 : 1.15;
          const dx = target.x - npc.x;
          const dz = target.z - npc.z;
          const len = Math.max(0.1, Math.hypot(dx, dz));
          this.spawnTracer(npc.x, npc.y + 1.35, npc.z, (dx / len) * 58, 0, (dz / len) * 58, false, npc.kind === 'swat' ? 10 : 6);
          viceAudio.playGunshot(false);
        }
      } else if (npc.fleeing && distToTarget < 50) {
        // Panicked NPC can hijack an empty parked car to escape!
        const nearbyEmptyCar = this.vehicles.find(
          (v) => !v.driverPresent && !v.hijackedByNpc && v !== this.drivingVehicle && v.state.tier !== 'boat' && v.state.tier !== 'plane' && v.state.tier !== 'heli' && Math.hypot(v.x - npc.x, v.z - npc.z) < 6.5
        );
        if (nearbyEmptyCar) {
          nearbyEmptyCar.leftDoorTimer = 0.55;
          nearbyEmptyCar.hijackedByNpc = npc;
          nearbyEmptyCar.driverPresent = true;
          npc.drivingCar = nearbyEmptyCar;
          npc.rig.root.visible = false;
          continue;
        }
        const nx = (npc.x - p.x) / Math.max(0.1, distToTarget);
        const nz = (npc.z - p.z) / Math.max(0.1, distToTarget);
        const fx = npc.x + nx * 5.6 * dt;
        const fz = npc.z + nz * 5.6 * dt;
        if (!isWaterChannel(fx, fz) || getBridgeDeckInfo(fx, fz).onBridge) {
          npc.x = fx;
          npc.z = fz;
        }
        npc.yaw = Math.atan2(nx, nz);
        npc.walkPhase += dt * 11;
      } else {
        npc.wanderTimer -= dt;
        if (npc.wanderTimer <= 0) {
          npc.wanderTimer = 3 + Math.random() * 4;
          const roam = npc.kind === 'gang' ? 9 : 14;
          npc.yaw = Math.atan2(
            npc.patrolCenterX - npc.x + (Math.random() - 0.5) * roam,
            npc.patrolCenterZ - npc.z + (Math.random() - 0.5) * roam
          );
        }
        const nx = npc.x + Math.sin(npc.yaw) * npc.speed * 0.55 * dt;
        const nz = npc.z + Math.cos(npc.yaw) * npc.speed * 0.55 * dt;
        if (!this.collidesWithSolidWall(nx, nz, 0.4) && (!isWaterChannel(nx, nz) || getBridgeDeckInfo(nx, nz).onBridge)) {
          npc.x = nx;
          npc.z = nz;
          npc.walkPhase += dt * 5;
        } else {
          npc.yaw += Math.PI * 0.7;
        }
      }

      npc.rig.root.position.set(npc.x, npc.y, npc.z);
      npc.rig.root.rotation.y = npc.yaw;
      const weather = WEATHER_ORDER[this.weatherIndex];
      const npcRaining = (weather === 'rain' || weather === 'storm') && npc.kind === 'civilian' && !npc.fleeing && !npc.hostile;
      animateNpcRig(npc.rig, npc.walkPhase, {
        handsUp: npc.fleeing && !npc.isWitness,
        calling911: npc.isWitness,
        umbrella: npcRaining,
        checkingPhone: npc.kind === 'civilian' && !npc.fleeing && !npc.isWitness && npc.walkPhase < 0.01,
        aiming: npc.hostile && npc.armed,
        timeSec: this.elapsedSec,
      });
    }

    this.updateNpcIntelAndStare(dt);
    this.updateWildlife(dt);
  }

  private updateNpcIntelAndStare(dt: number) {
    const p = this.protagonists[this.activeId];

    // 1. Proximity Spoken NPC Chatter + Subtitle
    this.npcChatterCooldown = Math.max(0, this.npcChatterCooldown - dt);
    if (this.npcChatterCooldown <= 0 && !this.drivingVehicle) {
      let spokenNpc: WorldNPC | null = null;
      let bestDist = 9.5;
      for (const npc of this.npcs) {
        if (!npc.alive || npc.drivingCar || npc.kind === 'child' || (npc.chatterCooldown ?? 0) > 0) continue;
        const d = Math.hypot(npc.x - p.x, npc.z - p.z);
        if (d < bestDist && this.hasLineOfSight(p.x, p.z, npc.x, npc.z)) {
          bestDist = d;
          spokenNpc = npc;
        }
      }
      if (spokenNpc) {
        const linePool =
          spokenNpc.kind === 'police' || spokenNpc.kind === 'swat'
            ? ['Keep the streets clean today, citizen.', 'Dispatch says Vice Downtown is busy tonight.', 'Stay sharp out there.']
            : spokenNpc.kind === 'gang'
            ? ['Youre walking on our turf, watch yourself.', 'Royals and Skulls run these blocks.', 'Dont stare too long if you want peace.']
            : [
                'Love that ocean breeze off the Grand Bridge!',
                'Did you see those yachts out by Paradise Key?',
                'Coffee at Vice Roast hits different in the sun.',
                'Traffic on the Northport highway is crazy today.',
              ];
        const line = linePool[Math.floor(Math.random() * linePool.length)];
        spokenNpc.chatterCooldown = 26;
        this.npcChatterCooldown = 7.5;
        this.npcSubtitle = { speaker: spokenNpc.name, text: line, hostile: spokenNpc.hostile };
        this.npcSubtitleTimer = 3.2;
        viceAudio.speakNpcLine(line, spokenNpc.kind === 'gang' ? 0.92 : 1.04);
      }
    }

    // 2. 4-Second Stare Confrontation Mechanic
    if (this.drivingVehicle || this.currentInterior || this.activeModal !== null) {
      this.stareTargetId = null;
      this.stareTimer = 0;
      this.stareWarned = false;
      return;
    }

    const fwdX = Math.sin(p.yaw);
    const fwdZ = Math.cos(p.yaw);
    let staredNpc: WorldNPC | null = null;
    let bestD = 5.5;
    for (const npc of this.npcs) {
      if (!npc.alive || npc.drivingCar || npc.hostile || npc.fleeing || npc.kind === 'child' || npc.kind === 'cashier') continue;
      const dx = npc.x - p.x;
      const dz = npc.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.8 || d > bestD) continue;
      const dot = (dx / d) * fwdX + (dz / d) * fwdZ;
      if (dot > 0.58 && this.hasLineOfSight(p.x, p.z, npc.x, npc.z)) {
        bestD = d;
        staredNpc = npc;
      }
    }

    if (!staredNpc) {
      this.stareTargetId = null;
      this.stareTimer = 0;
      this.stareWarned = false;
      return;
    }

    if (this.stareTargetId !== staredNpc.id) {
      this.stareTargetId = staredNpc.id;
      this.stareTimer = 0;
      this.stareWarned = false;
    }

    this.stareTimer += dt;
    if (this.stareTimer >= 2.0 && !this.stareWarned) {
      this.stareWarned = true;
      const warnText =
        staredNpc.kind === 'gang'
          ? 'Quit mugging me or we got a serious problem!'
          : 'What are you staring at? Keep walking!';
      this.npcSubtitle = { speaker: staredNpc.name, text: warnText, hostile: true };
      this.npcSubtitleTimer = 2.6;
      viceAudio.speakNpcLine(warnText, 0.95);
    }

    if (this.stareTimer >= 4.0) {
      staredNpc.hostile = true;
      staredNpc.fleeing = false;
      staredNpc.targetProtagonist = this.activeId;
      if (staredNpc.kind === 'gang' && staredNpc.gangFaction) {
        for (const ally of this.npcs) {
          if (ally.alive && ally.gangFaction === staredNpc.gangFaction && Math.hypot(ally.x - staredNpc.x, ally.z - staredNpc.z) < 22) {
            ally.hostile = true;
            ally.targetProtagonist = this.activeId;
          }
        }
      }
      const aggroText =
        staredNpc.kind === 'police' || staredNpc.kind === 'swat'
          ? 'Step back right now! Youre obstructing an officer!'
          : 'Alright, you asked for it!';
      this.npcSubtitle = { speaker: staredNpc.name, text: aggroText, hostile: true };
      this.npcSubtitleTimer = 3.2;
      viceAudio.speakNpcLine(aggroText, 0.88);
      if (staredNpc.kind === 'police' || staredNpc.kind === 'swat') {
        this.addWantedStars(1);
      }
      this.stareTargetId = null;
      this.stareTimer = 0;
      this.stareWarned = false;
    }
  }

  private updateWildlife(dt: number) {
    for (const wl of this.wildlifeEntries) {
      wl.phase += dt * (wl.species === 'dolphin' ? 3.2 : 1.6);
      if (wl.species === 'gator') {
        const patrolX = wl.baseX + Math.sin(wl.phase * 0.45) * 9;
        const patrolZ = wl.baseZ + Math.cos(wl.phase * 0.45) * 9;
        wl.yaw = Math.atan2(patrolX - wl.x, patrolZ - wl.z);
        wl.x = patrolX;
        wl.z = patrolZ;
        wl.rig.root.position.set(wl.x, LAND_Y + 0.04, wl.z);
      } else {
        const patrolX = wl.baseX + Math.sin(wl.phase * 0.35) * 26;
        const patrolZ = wl.baseZ + Math.cos(wl.phase * 0.35) * 26;
        wl.yaw = Math.atan2(patrolX - wl.x, patrolZ - wl.z);
        wl.x = patrolX;
        wl.z = patrolZ;
        const waveY = getWaterWaveHeight(wl.x, wl.z, this.elapsedSec, this.currentStormFactor);
        const jumpY = wl.species === 'dolphin' ? Math.max(-0.5, Math.sin(wl.phase * 1.4) * 1.35) : -0.35;
        wl.rig.root.position.set(wl.x, waveY + jumpY, wl.z);
      }
      wl.rig.root.rotation.y = wl.yaw;
      animateWildlifeRig(wl.rig, wl.species, this.elapsedSec);
    }
  }

  private updateGrenadesAndExplosions(dt: number) {
    const p = this.protagonists[this.activeId];

    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.fuse -= dt;
      g.vy -= 18 * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.z += g.vz * dt;
      const floorY = Math.max(0.14, getTerrainHeightAt(g.x, g.z) + 0.14);
      const hitFloor = g.y <= floorY;
      if (hitFloor) {
        g.y = floorY;
        g.vy = Math.abs(g.vy) * 0.45;
        g.vx *= 0.65;
        g.vz *= 0.65;
      }
      g.mesh.position.set(g.x, g.y, g.z);
      g.mesh.rotation.x += dt * 8;

      if ((g.isMolotov && hitFloor) || g.fuse <= 0) {
        if (g.isMolotov) this.spawnFirePool(g.x, g.z);
        else this.detonateAt(g.x, g.z);
        this.scene.remove(g.mesh);
        g.mesh.geometry.dispose();
        (g.mesh.material as THREE.Material).dispose();
        this.grenades.splice(i, 1);
      }
    }

    // Active Molotov Fire Pools
    for (let i = this.firePools.length - 1; i >= 0; i--) {
      const fp = this.firePools[i];
      fp.life -= dt;
      const pulse = 0.94 + Math.sin(this.elapsedSec * 14 + i) * 0.08;
      fp.mesh.scale.set(pulse, 1 + Math.sin(this.elapsedSec * 18) * 0.25, pulse);
      (fp.mesh.material as THREE.MeshBasicMaterial).opacity = Math.min(0.82, fp.life * 0.35);

      for (const npc of this.npcs) {
        if (!npc.alive || npc.kind === 'child' || npc.drivingCar) continue;
        if (Math.hypot(npc.x - fp.x, npc.z - fp.z) < 3.4) {
          this.damageNpc(npc, 22 * dt, false, this.activeId);
        }
      }
      if (!this.drivingVehicle && Math.hypot(p.x - fp.x, p.z - fp.z) < 2.8) {
        this.damageProtagonist(this.activeId, 12 * dt, null);
      }

      if (fp.life <= 0) {
        this.scene.remove(fp.mesh);
        fp.mesh.geometry.dispose();
        (fp.mesh.material as THREE.Material).dispose();
        this.firePools.splice(i, 1);
      }
    }

    // Flying RPG Rockets
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.life -= dt;
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.z += r.vz * dt;
      r.mesh.position.set(r.x, r.y, r.z);

      const terrainY = getTerrainHeightAt(r.x, r.z);
      let impact = r.life <= 0 || r.y <= terrainY + 0.15 || this.collidesWithSolidWall(r.x, r.z, 0.35);
      if (!impact) {
        for (const npc of this.npcs) {
          if (npc.alive && !npc.drivingCar && npc.kind !== 'child' && Math.hypot(npc.x - r.x, npc.z - r.z) < 1.35) {
            impact = true;
            break;
          }
        }
      }
      if (!impact) {
        for (const veh of this.vehicles) {
          if (veh !== this.drivingVehicle && Math.hypot(veh.x - r.x, veh.z - r.z) < 2.4 && Math.abs(veh.y + 0.8 - r.y) < 2.0) {
            impact = true;
            break;
          }
        }
      }

      if (impact) {
        this.detonateAt(r.x, r.z, 14, 210);
        this.scene.remove(r.mesh);
        r.mesh.traverse((ch) => {
          if ((ch as THREE.Mesh).isMesh) {
            const m = ch as THREE.Mesh;
            m.geometry.dispose();
            (m.material as THREE.Material).dispose();
          }
        });
        this.rockets.splice(i, 1);
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i];
      ex.life -= dt;
      const sc = 1 + (0.45 - ex.life) * 14;
      ex.mesh.scale.setScalar(sc);
      (ex.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, ex.life * 2.2);
      if (ex.life <= 0) {
        this.scene.remove(ex.mesh);
        ex.mesh.geometry.dispose();
        (ex.mesh.material as THREE.Material).dispose();
        this.explosions.splice(i, 1);
      }
    }
  }

  private detonateAt(x: number, z: number, radius = 9.5, maxDamage = 140) {
    viceAudio.playExplosion();
    this.cameraShake = radius > 11 ? 0.72 : 0.45;
    const blastY = Math.max(0.2, getTerrainHeightAt(x, z));

    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(radius > 11 ? 1.35 : 0.8, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.9 })
    );
    flash.position.set(x, blastY + 0.8, z);
    this.scene.add(flash);
    this.explosions.push({ mesh: flash, life: 0.45 });

    for (const npc of this.npcs) {
      if (!npc.alive || npc.kind === 'child') continue;
      const d = Math.hypot(npc.x - x, npc.z - z);
      if (d < radius) {
        const nx = (npc.x - x) / Math.max(0.1, d);
        const nz = (npc.z - z) / Math.max(0.1, d);
        this.damageNpc(npc, maxDamage, false, this.activeId, nx * 14, nz * 14);
      }
    }
    for (const veh of this.vehicles) {
      if (veh === this.drivingVehicle) continue;
      const d = Math.hypot(veh.x - x, veh.z - z);
      if (d < radius) {
        veh.state.health = Math.max(0, veh.state.health - 55);
        const nx = (veh.x - x) / Math.max(0.1, d);
        const nz = (veh.z - z) / Math.max(0.1, d);
        veh.vx += nx * 12;
        veh.vz += nz * 12;
      }
    }
    this.triggerCrimeEvent(x, z, radius > 11 ? 3 : 2, false);
  }

  private updateCashPickups(dt: number) {
    const p = this.protagonists[this.activeId];
    for (let i = this.cashPickups.length - 1; i >= 0; i--) {
      const cp = this.cashPickups[i];
      cp.life -= dt;
      cp.mesh.rotation.y += dt * 2.6;
      cp.mesh.position.y = 0.28 + Math.sin(this.elapsedSec * 4) * 0.08;

      if (Math.hypot(cp.x - p.x, cp.z - p.z) < 1.9) {
        this.cash += cp.amount;
        viceAudio.playCashRegister();
        this.showToast(`Looted +$${cp.amount} cash!`);
        this.scene.remove(cp.mesh);
        this.cashPickups.splice(i, 1);
      } else if (cp.life <= 0) {
        this.scene.remove(cp.mesh);
        this.cashPickups.splice(i, 1);
      }
    }
  }

  private updateTracers(dt: number) {
    const p = this.protagonists[this.activeId];
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.z += t.vz * dt;
      t.mesh.position.set(t.x, t.y, t.z);

      let remove = t.life <= 0;
      if (!remove && t.fromPlayer) {
        for (const npc of this.npcs) {
          if (!npc.alive || npc.kind === 'child' || npc.drivingCar) continue;
          if (Math.hypot(t.x - npc.x, t.z - npc.z) < 0.85) {
            this.damageNpc(npc, t.damage, false, this.activeId);
            remove = true;
            break;
          }
        }
      } else if (!remove && !t.fromPlayer && !this.drivingVehicle) {
        if (Math.hypot(t.x - p.x, t.z - p.z) < 0.75) {
          this.damageProtagonist(this.activeId, t.damage, null);
          remove = true;
        }
      }

      if (remove) {
        this.scene.remove(t.mesh);
        t.mesh.geometry.dispose();
        (t.mesh.material as THREE.Material).dispose();
        this.tracers.splice(i, 1);
      }
    }
  }

  private updateWantedAndWitness(dt: number) {
    for (const intInfo of this.worldInteriors) {
      if (intInfo.robbedCooldown > 0) intInfo.robbedCooldown = Math.max(0, intInfo.robbedCooldown - dt);
    }

    if (this.wanted.stars === 0) return;
    const p = this.protagonists[this.activeId];
    const copVisible = this.npcs.some(
      (n) => n.alive && (n.kind === 'police' || n.kind === 'swat') && Math.hypot(n.x - p.x, n.z - p.z) < 38
    );

    if (copVisible && !this.currentInterior) {
      this.wanted.evading = false;
      this.wanted.evadeProgress = Math.max(0, this.wanted.evadeProgress - dt * 15);
    } else {
      this.wanted.evading = true;
      const rate = this.wanted.disguiseNeeded ? 6.5 : 14.5;
      this.wanted.evadeProgress += dt * rate;
      if (this.wanted.evadeProgress >= 100) {
        this.wanted.stars = 0;
        this.wanted.evading = false;
        this.wanted.evadeProgress = 0;
        this.wanted.disguiseNeeded = false;
        this.showToast('Wanted Level Cleared! Clean escape.');
        this.checkMissionProgress();
      }
    }
  }

  private updateInteriorCutaways() {
    const p = this.protagonists[this.activeId];
    let inside: InteriorInfo | null = null;

    for (const dyn of this.dynamicInteriors) {
      const b = dyn.footprint;
      const halfW = b.w / 2;
      const halfD = b.d / 2;
      const playerInside = Math.abs(p.x - b.x) < halfW && Math.abs(p.z - b.z) < halfD && !this.drivingVehicle;
      const dist = Math.hypot(p.x - b.x, p.z - b.z);

      if (playerInside) inside = b.interior!;

      dyn.roofMesh.visible = !playerInside;
      dyn.frontWall.visible = !playerInside;
      if (dyn.interiorGroup) dyn.interiorGroup.visible = dist < 52;
    }
    this.currentInterior = inside;
  }

  private updateContextPrompts() {
    const p = this.protagonists[this.activeId];
    const partnerId: ProtagonistId = this.activeId === 'jason' ? 'lucia' : 'jason';
    const partner = this.protagonists[partnerId];
    this.contextPrompt = null;
    this.contextAction = null;
    this.contextActionLabel = null;

    if (p.isSitting && this.currentSeat) {
      if (this.currentSeat.venue === 'coffee') {
        this.contextPrompt = `[E] Order Cuban Espresso ($12) · [Space] Stand Up`;
        return;
      }
      if (this.currentSeat.venue === 'bar') {
        this.contextPrompt = `[E] Order Vice Craft Beer ($18) · [Space] Stand Up`;
        return;
      }
      this.contextPrompt = `Sitting on ${this.currentSeat.label} · [Space / W] Stand Up`;
      return;
    }

    if (!this.drivingVehicle && !this.relationship.partnerInVehicleId && Math.hypot(p.x - partner.x, p.z - partner.z) < 2.8) {
      this.contextPrompt = `[E] Talk to ${partner.name} · [K] Invite into Car`;
      this.contextActionLabel = `Talk to ${partner.name}`;
      this.contextAction = () => this.openModal('partner', { partnerName: partner.name });
      return;
    }

    if (!this.drivingVehicle) {
      for (const seat of SEAT_SPOTS) {
        if (Math.hypot(p.x - seat.x, p.z - seat.z) < 2.0) {
          this.contextPrompt = `[E] Sit on ${seat.label}`;
          this.contextActionLabel = 'Sit Down';
          this.contextAction = () => this.sitDownAt(seat);
          return;
        }
      }
    }

    if (this.currentInterior) {
      const info = this.currentInterior;
      // Jason's Villa interactive King Bed (Sleep at Night!) & Home Gym!
      if (info.kind === 'safehouse') {
        // Bed at (217.2, 203.8)
        if (Math.hypot(p.x - 217.2, p.z - 203.8) < 3.0) {
          this.contextPrompt = `[E] Sleep in King Bed (Advance to Morning & Full HP)`;
          this.contextActionLabel = 'Sleep';
          this.contextAction = () => this.sleepAtVillaBed();
          return;
        }
        // Home Gym at (220.5, 215.2)
        if (Math.hypot(p.x - 220.5, p.z - 215.2) < 3.0) {
          const gymAct = this.activities.find((a) => a.id === 'act_boxing');
          if (gymAct) {
            this.contextPrompt = `[E] Work Out at Villa Private Home Gym`;
            this.contextActionLabel = 'Home Gym';
            this.contextAction = () => this.openModal('minigame', { activity: gymAct });
            return;
          }
        }
        this.contextPrompt = `[E] Open Villa Wardrobe & Haircut`;
        this.contextActionLabel = 'Wardrobe';
        this.contextAction = () => this.openModal('wardrobe', { interior: info });
        return;
      }

      if (info.kind === 'clothes') {
        this.contextPrompt = `[E] Browse ${info.name} (Outfits & Disguise)`;
        this.contextActionLabel = 'Clothes Store';
        this.contextAction = () => this.openModal('clothes', { interior: info });
        return;
      }

      if (info.kind === 'bungalow') {
        this.contextPrompt = `[E] Tropical Bungalow Estate (${info.name})`;
        this.contextActionLabel = 'Bungalow';
        this.contextAction = () => this.openModal('bungalow', { interior: info });
        return;
      }

      if (info.kind === 'burgershot') {
        this.contextPrompt = `[E] Burger Shot Career Counter (Work Shifts, Grill, Mop, Scooter Delivery or Chaos!)`;
        this.contextActionLabel = 'Burger Shot Counter';
        this.contextAction = () => this.openModal('burgerjob', { interior: info });
        return;
      }

      if (info.kind === 'bank') {
        const atmX = info.x + info.width * 0.36;
        const atmZ = info.z + info.depth * 0.18;
        if (Math.hypot(p.x - atmX, p.z - atmZ) < 3.6 || !info.hasRegister || info.robbedCooldown > 0) {
          this.contextPrompt = `[E] Leonida Reserve Bank & Vault ATM (Deposit / Withdraw / Buy Businesses)`;
          this.contextActionLabel = 'Bank ATM';
          this.contextAction = () => this.openModal('bank', { interior: info });
          return;
        }
      }

      if (info.kind === 'gunshop') {
        this.contextPrompt = `[E] Vice Armory Gun Shop (Buy Guns, Attachments, Trauma Kits & Upgrades)`;
        this.contextActionLabel = 'Gun Shop';
        this.contextAction = () => this.openModal('gunshop', { interior: info });
        return;
      }

      if (info.hasCCTV && !info.cctvWiped) {
        const termX = info.x + info.width * 0.32;
        const termZ = info.z - info.depth * 0.35;
        if (Math.hypot(p.x - termX, p.z - termZ) < 2.8) {
          this.contextPrompt = `[E] Wipe CCTV Security Footage (${info.name})`;
          this.contextActionLabel = 'Wipe CCTV';
          this.contextAction = () => this.openModal('cctv', { interior: info });
          return;
        }
      }
      if (info.kind === 'barber') {
        this.contextPrompt = `[E] Open Barber & Shave / Disguise`;
        this.contextActionLabel = 'Barber';
        this.contextAction = () => this.openModal('wardrobe', { interior: info });
        return;
      }
      if (info.kind === 'pawn') {
        this.contextPrompt = `[E] Trade with Uncle Jack Fence (Key Cloner / Guns)`;
        this.contextActionLabel = 'Fence Shop';
        this.contextAction = () => this.openModal('wardrobe', { interior: info, isFenceShop: true });
        return;
      }
      if (info.activityId) {
        const act = this.activities.find((a) => a.id === info.activityId);
        if (act) {
          this.contextPrompt = `[E] Start ${act.name}`;
          this.contextActionLabel = act.name;
          this.contextAction = () => this.openModal('minigame', { activity: act });
          return;
        }
      }
      if (info.hasRegister && info.robbedCooldown <= 0) {
        this.contextPrompt = `[E] Rob Cash Register / Intimidate Clerk`;
        this.contextActionLabel = 'Rob Store';
        this.contextAction = () => this.openModal('robbery', { interior: info });
        return;
      }
    }

    // Tropical Safehouse Island Bungalow Decks (Paradise Key & Starlight Atoll)
    if (!this.drivingVehicle) {
      for (const isl of SAFEHOUSE_ISLANDS) {
        if (Math.hypot(p.x - isl.bungalowX, p.z - isl.bungalowZ) < 12) {
          this.contextPrompt = `[E] ${isl.name} Bungalow Estate (Buy / Rest / Full Health)`;
          this.contextActionLabel = `${isl.name} Bungalow`;
          this.contextAction = () => this.openModal('bungalow', { island: isl });
          return;
        }
      }
    }

    // Playable Jobs & Burger Shot Street Stalls!
    if (!this.drivingVehicle) {
      for (const job of CITY_JOBS) {
        if (Math.hypot(p.x - job.x, p.z - job.z) < 4.5) {
          this.contextPrompt = `[E] Start Job: ${job.name} (+$${job.pay})`;
          this.contextActionLabel = job.name;
          this.contextAction = () => this.openModal('job', { job });
          return;
        }
      }
    }

    for (const gs of GAS_STATIONS) {
      if (Math.hypot(p.x - gs.x, p.z - gs.z) < 7.0 && this.drivingVehicle) {
        this.contextPrompt = `[E] Refuel / EV Charge & Repair at ${gs.name} ($80)`;
        this.contextActionLabel = 'Refuel & Repair';
        this.contextAction = () => {
          if (!this.drivingVehicle) return;
          if (this.cash < 80) {
            this.showToast('Need $80 for fuel & repair!');
            return;
          }
          this.cash -= 80;
          this.drivingVehicle.state.fuel = 100;
          this.drivingVehicle.state.health = 100;
          viceAudio.playCashRegister();
          this.showToast(`${this.drivingVehicle.state.name} 100% fueled & repaired!`);
        };
        return;
      }
    }

    if (this.drivingVehicle && this.drivingVehicle.state.gpsTrackerActive) {
      for (const fn of FENCE_SPOTS) {
        if (Math.hypot(p.x - fn.x, p.z - fn.z) < 8.0) {
          this.contextPrompt = `[E] Strip GPS Tracker & Respray Car at ${fn.name}`;
          this.contextActionLabel = 'Strip GPS';
          this.contextAction = () => {
            if (!this.drivingVehicle) return;
            this.drivingVehicle.state.gpsTrackerActive = false;
            this.wanted.disguiseNeeded = false;
            this.cash += 1200;
            viceAudio.playCashRegister();
            this.showToast('GPS Tracker removed! +$1,200 Fence Bonus');
            this.checkMissionProgress();
          };
          return;
        }
      }
    }

    this.nearbyTrunkVehicle = null;
    if (!this.drivingVehicle) {
      for (const v of this.vehicles) {
        if (Math.hypot(v.x - p.x, v.z - p.z) < 5.2) {
          this.nearbyTrunkVehicle = v;
          this.contextPrompt = `[F] ${v.state.hotwired ? 'Drive / Pilot' : v.state.needsKeyCloner ? 'Clone Key & Steal' : 'Hotwire'} ${v.state.name} · [K] Partner In/Out · [T] Trunk · [Y] Hood Repair ($120)`;
          return;
        }
      }

      for (const act of this.activities) {
        if (Math.hypot(act.x - p.x, act.z - p.z) < 5.5) {
          this.contextPrompt = `[E] Play ${act.name} (${act.category})`;
          this.contextActionLabel = act.name;
          this.contextAction = () => this.openModal('minigame', { activity: act });
          return;
        }
      }

      for (const npc of this.npcs) {
        if (!npc.alive || npc.kind === 'police' || npc.kind === 'swat' || npc.kind === 'child' || npc.drivingCar) continue;
        if (Math.hypot(npc.x - p.x, npc.z - p.z) < 3.0) {
          this.contextPrompt = `[E] Interact with ${npc.name} (${npc.isWitness ? 'WITNESS!' : npc.archetype})`;
          this.contextActionLabel = 'Talk to NPC';
          this.contextAction = () => {
            const ctx: NpcInteractionContext = {
              npcId: npc.id,
              name: npc.name,
              archetype: npc.archetype,
              reaction:
                p.equippedWeaponId !== 'fists'
                  ? `"Whoa, put that ${this.getActiveWeapon(p)?.name ?? 'weapon'} away!"`
                  : p.stats.muscle > 65
                  ? `"Dang, you've been hitting the gym hard."`
                  : `"Beautiful day in Leonida, huh?"`,
              isWitness: npc.isWitness,
              hostile: npc.hostile,
              mood: npc.mood,
            };
            this.openModal('npc', ctx);
          };
          return;
        }
      }
    } else {
      this.contextPrompt = `[F] Exit · [K] ${this.relationship.partnerInVehicleId ? 'Let Partner Out' : 'Invite Partner Into Car'}`;
    }
  }

  private updateCamera(dt: number) {
    const p = this.protagonists[this.activeId];
    const isDriving = Boolean(this.drivingVehicle);
    const isAir = this.drivingVehicle && (this.drivingVehicle.state.tier === 'plane' || this.drivingVehicle.state.tier === 'heli');
    const dist = isAir ? 15.5 : isDriving ? 9.2 : this.aiming ? (p.equippedWeaponId === 'sniper' ? 2.1 : 2.8) : this.currentInterior ? 5.0 : this.slowMoActive ? 3.2 : 5.4;
    const height = isAir ? 5.2 : isDriving ? 3.3 : this.currentInterior ? 3.2 : 2.15;

    const focusX = p.x;
    const focusY = p.y + (isDriving ? 1.15 : 1.48);
    const focusZ = p.z;
    const targetCamX = p.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * dist;
    const targetCamY = Math.max(p.y + 0.8, p.y + height + Math.sin(this.camPitch) * dist * 0.6);
    const targetCamZ = p.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * dist;

    resolveSpringArmCameraPosition(
      focusX,
      focusY,
      focusZ,
      targetCamX,
      targetCamY,
      targetCamZ,
      (x, y, z) => y < 9 && this.collidesWithSolidWall(x, z, 0.25),
      _v1
    );
    const camGroundY = getTerrainHeightAt(_v1.x, _v1.z);
    if (_v1.y < camGroundY + 0.6) _v1.y = camGroundY + 0.6;
    const k = isDriving ? 9 : 14;
    this.camCurrentPos.lerp(_v1, 1 - Math.exp(-k * dt));

    _v2.set(focusX, focusY, focusZ);
    this.camCurrentLook.lerp(_v2, 1 - Math.exp(-15 * dt));

    if (this.cameraShake > 0.005) {
      this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 12, dt);
      this.camera.position.set(
        this.camCurrentPos.x + (Math.random() - 0.5) * this.cameraShake,
        this.camCurrentPos.y + (Math.random() - 0.5) * this.cameraShake,
        this.camCurrentPos.z
      );
    } else {
      this.camera.position.copy(this.camCurrentPos);
    }

    const targetFov = this.aiming
      ? p.equippedWeaponId === 'sniper'
        ? 24
        : 44
      : this.slowMoActive
      ? 48
      : isDriving && this.drivingVehicle
      ? 62 + (Math.abs(this.drivingVehicle.state.speed) / this.drivingVehicle.state.maxSpeed) * 14
      : 62;
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 8, dt);
      this.camera.updateProjectionMatrix();
    }

    this.camera.lookAt(this.camCurrentLook);
  }

  private collidesWithSolidWall(x: number, z: number, radius: number): boolean {
    for (const b of this.worldBuildings) {
      const halfW = b.w / 2 + radius;
      const halfD = b.d / 2 + radius;
      if (Math.abs(x - b.x) < halfW && Math.abs(z - b.z) < halfD) {
        if (!b.interior) return true;

        const inDoorway = Math.abs(x - b.x) < 1.8 && z > b.z + b.d / 2 - 1.8 && z < b.z + b.d / 2 + radius + 0.8;
        if (inDoorway) return false;

        const insideRoom = Math.abs(x - b.x) < b.w / 2 - 0.5 && Math.abs(z - b.z) < b.d / 2 - 0.5;
        if (insideRoom) return false;

        return true;
      }
    }
    return false;
  }

  private dampAngle(current: number, target: number, lambda: number, dt: number): number {
    let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return current + diff * (1 - Math.exp(-lambda * dt));
  }

  private pushHud() {
    const p = this.protagonists[this.activeId];
    const partnerId: ProtagonistId = this.activeId === 'jason' ? 'lucia' : 'jason';
    const partner = this.protagonists[partnerId];

    const minimapEntities: MinimapEntity[] = [];
    minimapEntities.push({ x: partner.x, z: partner.z, kind: 'partner', label: partner.name });
    minimapEntities.push({ x: CENTRAL_PARK.cx, z: CENTRAL_PARK.cz, kind: 'park', label: 'Central Park & Playground' });
    minimapEntities.push({ x: 210, z: 210, kind: 'home', label: "Jason's Villa" });
    minimapEntities.push({ x: 210, z: 105, kind: 'coffee', label: 'Vice Roast Coffee Shop' });
    minimapEntities.push({ x: -210, z: 210, kind: 'bar', label: 'Neon Anchor Beer Bar' });
    minimapEntities.push({ x: 210, z: -350, kind: 'bar', label: 'Jack of Hearts Bar' });
    minimapEntities.push({ x: 70, z: 105, kind: 'gunshop', label: 'Vice Armory Gun Shop' });
    minimapEntities.push({ x: -70, z: -210, kind: 'gunshop', label: 'Northport Tactical Armory' });
    minimapEntities.push({ x: -70, z: 210, kind: 'precinct', label: 'Vice PD Precinct' });
    minimapEntities.push({ x: 210, z: 480, kind: 'gym', label: 'Vice Iron Gym' });
    minimapEntities.push({ x: AIRPORT_ZONE.runwayX, z: AIRPORT_ZONE.runwayZ, kind: 'airport', label: 'Leonida International Airport' });
    minimapEntities.push({ x: 320, z: 350, kind: 'boat', label: 'Vice Marina Boats' });
    minimapEntities.push({ x: 70, z: 210, kind: 'burgershot', label: 'Burger Shot Diner' });
    minimapEntities.push({ x: 210, z: 350, kind: 'bank', label: 'Leonida Reserve Bank' });
    minimapEntities.push({ x: -70, z: 105, kind: 'clothes', label: 'Vice Threads Boutique' });
    minimapEntities.push({ x: 210, z: -210, kind: 'clothes', label: 'Northport Streetwear' });
    minimapEntities.push({ x: 560, z: 230, kind: 'bungalow', label: 'Paradise Key Bungalow' });
    minimapEntities.push({ x: 560, z: -230, kind: 'bungalow', label: 'Starlight Atoll Bungalow' });
    if (this.darkWebDrop) {
      minimapEntities.push({ x: this.darkWebDrop.x, z: this.darkWebDrop.z, kind: 'drop', label: this.darkWebDrop.label });
    }

    for (const job of CITY_JOBS) minimapEntities.push({ x: job.x, z: job.z, kind: 'job', label: job.name });
    for (const npc of this.npcs) {
      if (npc.alive && (npc.kind === 'police' || npc.kind === 'swat')) {
        minimapEntities.push({ x: npc.x, z: npc.z, kind: 'police' });
      }
    }
    for (const v of this.vehicles) {
      if (!v.isTraffic && v !== this.drivingVehicle && Math.hypot(v.x - p.x, v.z - p.z) < 120) {
        minimapEntities.push({ x: v.x, z: v.z, kind: 'vehicle', label: v.state.name });
      }
    }
    for (const gs of GAS_STATIONS) minimapEntities.push({ x: gs.x, z: gs.z, kind: 'gas', label: gs.name });
    for (const fn of FENCE_SPOTS) minimapEntities.push({ x: fn.x, z: fn.z, kind: 'fence', label: fn.name });
    if (this.waypoint) minimapEntities.push({ x: this.waypoint.x, z: this.waypoint.z, kind: 'mission', label: this.waypoint.label });

    const hrs = Math.floor(this.timeNormalized * 24);
    const mins = Math.floor((this.timeNormalized * 24 - hrs) * 60);
    const timeOfDayLabel = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    const isNight = hrs >= 20 || hrs < 6;
    const weather = WEATHER_ORDER[this.weatherIndex];

    const gpsRoute = this.waypoint
      ? computeGpsRoute(p.x, p.z, this.waypoint.x, this.waypoint.z)
      : [];

    this.callbacks.onHudUpdate({
      screen: this.screen,
      activeId: this.activeId,
      protagonists: {
        jason: {
          ...this.protagonists.jason,
          weapons: this.protagonists.jason.weapons.map(cloneWeapon),
          pistols: this.protagonists.jason.pistols.map(cloneWeapon),
          longGun: this.protagonists.jason.longGun ? cloneWeapon(this.protagonists.jason.longGun) : null,
        },
        lucia: {
          ...this.protagonists.lucia,
          weapons: this.protagonists.lucia.weapons.map(cloneWeapon),
          pistols: this.protagonists.lucia.pistols.map(cloneWeapon),
          longGun: this.protagonists.lucia.longGun ? cloneWeapon(this.protagonists.lucia.longGun) : null,
        },
      },
      cash: this.cash,
      bankBalance: this.bankBalance,
      clout: this.clout,
      relationship: { ...this.relationship },
      profile: { ...this.profile },
      wanted: { ...this.wanted },
      drivingVehicle: this.drivingVehicle ? { ...this.drivingVehicle.state } : null,
      nearbyTrunkVehicle: this.nearbyTrunkVehicle ? { ...this.nearbyTrunkVehicle.state } : null,
      currentDistrict: getDistrictAt(p.x, p.z),
      currentInterior: this.currentInterior ? { ...this.currentInterior } : null,
      currentSeat: this.currentSeat ? { ...this.currentSeat } : null,
      timeOfDayLabel,
      timeNormalized: this.timeNormalized,
      isNight,
      weather,
      weatherLabel: WEATHER_LABELS[weather],
      slowMoActive: this.slowMoActive,
      aiming: this.aiming,
      contextPrompt: this.contextPrompt,
      contextAction: this.contextActionLabel,
      waypoint: this.waypoint ? { ...this.waypoint } : null,
      gpsRoute,
      activeMission: this.missions.find((m) => m.id === this.activeMissionId) ?? null,
      minimapEntities,
      toastMessage: this.toastMessage,
      npcSubtitle: this.npcSubtitle ? { ...this.npcSubtitle } : null,
      controlSettings: { ...this.controlSettings },
      muted: viceAudio.isMuted(),
      radioStation: this.radioStation,
      earphonesOn: this.earphonesOn,
      burgerJob: {
        ...this.burgerJob,
        activeDelivery: this.burgerJob.activeDelivery ? { ...this.burgerJob.activeDelivery } : null,
      },
      stocks: this.stocks.map((s) => ({ ...s })),
      businesses: this.businesses.map((b) => ({ ...b })),
      darkWebDrop: this.darkWebDrop ? { ...this.darkWebDrop } : null,
      totalBuildingsCount: this.worldBuildings.length,
      totalInteriorsCount: this.worldInteriors.length,
      underwaterTreasureFound: this.underwaterTreasureFound,
      messages: [...this.messages],
    });
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.removeEventListener('mousedown', this.onCanvasMouseDown);
    this.renderer.domElement.removeEventListener('contextmenu', this.onContextMenu);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
        else m.material?.dispose();
      }
    });
    this.postProcessing?.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
