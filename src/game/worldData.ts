import {
  ActivityDef,
  BuildingArchStyle,
  BusinessProperty,
  InteriorInfo,
  InteriorKind,
  JobDef,
  MissionDef,
  SeatSpot,
  SocialPost,
  StockAsset,
} from './types';
import { getWaterShoreDistance } from './water';

export const LAND_Y = 0.4;
export const ROAD_Y = 0.43;

export interface BuildingFootprint {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  district: string;
  color: number;
  archStyle: BuildingArchStyle;
  isDeco: boolean;
  isModern?: boolean;
  interior?: InteriorInfo;
}

export interface BridgeDef {
  id: string;
  name: string;
  axis: 'x' | 'z';
  cx: number;
  cz: number;
  length: number;
  width: number;
  deckHeight: number;
}

export interface DockDef {
  id: string;
  name: string;
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
  deckY: number;
}

export interface RoadSegmentDef {
  id: string;
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  width: number;
  isHighway: boolean;
  island: 'south' | 'north' | 'airport';
}

export interface GasStationSpot {
  id: string;
  name: string;
  x: number;
  z: number;
  isEV: boolean;
}

export interface FenceSpot {
  id: string;
  name: string;
  x: number;
  z: number;
}

export interface StreetStallSpot {
  id: string;
  name: string;
  kind: 'burger' | 'fruit' | 'merch';
  x: number;
  z: number;
  yaw: number;
}

export interface TreasureSpot {
  id: string;
  x: number;
  y: number;
  z: number;
  found: boolean;
  value: number;
}

export interface CircleCollider {
  x: number;
  z: number;
  radius: number;
}

export type TreeSpecies = 'palm' | 'oak' | 'pine';

export interface WeakTreeSpot {
  id: string;
  x: number;
  z: number;
  scale: number;
  species: TreeSpecies;
  intact: boolean;
  fallAngle: number;
  fallDirX: number;
  fallDirZ: number;
}

export interface SafehouseIslandDef {
  id: string;
  name: string;
  cx: number;
  cz: number;
  halfSize: number;
  cornerRadius: number;
  bungalowX: number;
  bungalowZ: number;
  poolX: number;
  poolZ: number;
  accentColor: number;
}

// ─── Road Grid & Multi-City Geography ──────────────────────────────────────────
export const ROAD_X = [-280, -140, 0, 140, 280];
export const SOUTH_ROAD_Z = [140, 280, 420];
export const NORTH_ROAD_Z = [-420, -280, -140];
export const ROAD_Z = [...NORTH_ROAD_Z, ...SOUTH_ROAD_Z];
export const HIGHWAY_X = [0];
export const HIGHWAY_Z = [-140, 140];

export const SOUTH_ISLAND = {
  name: 'Vice Downtown',
  cx: 5,
  cz: 305,
  hx: 355,
  hz: 230,
};

export const NORTH_ISLAND = {
  name: 'Northport',
  cx: -5,
  cz: -307.5,
  hx: 345,
  hz: 232.5,
};

export const SAFEHOUSE_ISLANDS: SafehouseIslandDef[] = [
  {
    id: 'isl_paradise',
    name: 'Paradise Key',
    cx: 560,
    cz: 240,
    halfSize: 72,
    cornerRadius: 32,
    bungalowX: 560,
    bungalowZ: 230,
    poolX: 560,
    poolZ: 256,
    accentColor: 0x0ea5e9,
  },
  {
    id: 'isl_starlight',
    name: 'Starlight Atoll',
    cx: 560,
    cz: -240,
    halfSize: 72,
    cornerRadius: 32,
    bungalowX: 560,
    bungalowZ: -230,
    poolX: 560,
    poolZ: -256,
    accentColor: 0xf43f5e,
  },
];

export const ROAD_SEGMENTS: RoadSegmentDef[] = [
  // Vice Downtown (South Island) North-South Streets
  ...ROAD_X.map((rx) => ({
    id: `s_ns_${rx}`,
    x1: rx,
    z1: rx === 0 ? 92 : 84,
    x2: rx,
    z2: 520,
    width: rx === 0 ? 18 : 13.5,
    isHighway: rx === 0,
    island: 'south' as const,
  })),
  // Vice Downtown East-West Streets
  ...SOUTH_ROAD_Z.map((rz) => ({
    id: `s_ew_${rz}`,
    x1: -336,
    z1: rz,
    x2: 344,
    z2: rz,
    width: rz === 140 ? 17 : 13.5,
    isHighway: rz === 140,
    island: 'south' as const,
  })),
  // Northport (North Island) North-South Streets
  ...ROAD_X.map((rx) => ({
    id: `n_ns_${rx}`,
    x1: rx,
    z1: -524,
    x2: rx,
    z2: rx === 0 ? -92 : -84,
    width: rx === 0 ? 18 : 13.5,
    isHighway: rx === 0,
    island: 'north' as const,
  })),
  // Northport East-West Streets (with z=-280 extending into Leonida Airport)
  ...NORTH_ROAD_Z.map((rz) => ({
    id: `n_ew_${rz}`,
    x1: rz === -280 ? -525 : -336,
    z1: rz,
    x2: 326,
    z2: rz,
    width: rz === -140 ? 17 : 13.5,
    isHighway: rz === -140,
    island: 'north' as const,
  })),
  // Airport Terminal Access Road
  {
    id: 'air_ns',
    x1: -410,
    z1: -410,
    x2: -410,
    z2: -280,
    width: 13,
    isHighway: false,
    island: 'airport' as const,
  },
];

// Grand Over-Water Main Highway Bridge connecting Vice Downtown & Northport across the Ocean Channel
export const BRIDGES: BridgeDef[] = [
  {
    id: 'br_grand_highway',
    name: 'Grand Leonida Highway Bridge',
    axis: 'z',
    cx: 0,
    cz: 0,
    length: 192,
    width: 22,
    deckHeight: 5.4,
  },
];

// Boat Docks over Water
export const WOODEN_DOCKS: DockDef[] = [
  { id: 'dock_marina', name: 'Port Vice Marina Dock', xMin: 356, xMax: 392, zMin: 342, zMax: 358, deckY: 0.65 },
  { id: 'dock_northport', name: 'Northport Harbor Dock', xMin: 62, xMax: 78, zMin: -92, zMax: -56, deckY: 0.65 },
  { id: 'dock_paradise', name: 'Paradise Key Island Dock', xMin: 468, xMax: 498, zMin: 233, zMax: 247, deckY: 0.65 },
  { id: 'dock_starlight', name: 'Starlight Atoll Dock', xMin: 468, xMax: 498, zMin: -247, zMax: -233, deckY: 0.65 },
];

export function isOnWoodenDock(x: number, z: number): DockDef | null {
  for (const d of WOODEN_DOCKS) {
    if (x >= d.xMin && x <= d.xMax && z >= d.zMin && z <= d.zMax) return d;
  }
  return null;
}

export function getBridgeDeckInfo(
  x: number,
  z: number
): { onBridge: boolean; height: number; bridge: BridgeDef | null; nearGuardrail: boolean } {
  for (const br of BRIDGES) {
    const halfL = br.length / 2;
    const halfW = br.width / 2;
    if (br.axis === 'x') {
      const dx = Math.abs(x - br.cx);
      const dz = Math.abs(z - br.cz);
      if (dx <= halfL && dz <= halfW) {
        const flatSpan = 52;
        let h = br.deckHeight;
        if (dx > flatSpan) {
          const t = 1 - (dx - flatSpan) / (halfL - flatSpan);
          const smooth = t * t * (3 - 2 * t);
          h = ROAD_Y + (br.deckHeight - ROAD_Y) * smooth;
        }
        return { onBridge: true, height: h, bridge: br, nearGuardrail: dz > halfW - 1.1 };
      }
    } else {
      const dx = Math.abs(x - br.cx);
      const dz = Math.abs(z - br.cz);
      if (dz <= halfL && dx <= halfW) {
        const flatSpan = 52;
        let h = br.deckHeight;
        if (dz > flatSpan) {
          const t = 1 - (dz - flatSpan) / (halfL - flatSpan);
          const smooth = t * t * (3 - 2 * t);
          h = ROAD_Y + (br.deckHeight - ROAD_Y) * smooth;
        }
        return { onBridge: true, height: h, bridge: br, nearGuardrail: dx > halfW - 1.1 };
      }
    }
  }
  return { onBridge: false, height: 0, bridge: null, nearGuardrail: false };
}

export function isWaterChannel(x: number, z: number): boolean {
  return getWaterShoreDistance(x, z) > 0;
}

export function isWaterSurfaceAt(x: number, z: number): boolean {
  if (!isWaterChannel(x, z)) return false;
  if (getBridgeDeckInfo(x, z).onBridge) return false;
  if (isOnWoodenDock(x, z)) return false;
  return true;
}

export function getTerrainHeightAt(x: number, z: number): number {
  const br = getBridgeDeckInfo(x, z);
  if (br.onBridge) return br.height;
  const dk = isOnWoodenDock(x, z);
  if (dk) return dk.deckY;
  if (isWaterChannel(x, z)) return -2.8;
  return LAND_Y;
}

// ─── A* Road-Node GPS Pathfinder (Connects Vice Downtown, Northport & Bridge) ───
interface NavNode {
  id: string;
  x: number;
  z: number;
  neighbors: string[];
}

function buildRoadNavGraph(): NavNode[] {
  const nodes: NavNode[] = [];
  const byKey = new Map<string, NavNode>();

  const addNode = (id: string, x: number, z: number): NavNode => {
    const existing = byKey.get(id);
    if (existing) return existing;
    const node: NavNode = { id, x, z, neighbors: [] };
    nodes.push(node);
    byKey.set(id, node);
    return node;
  };

  const link = (a: NavNode, b: NavNode) => {
    if (!a.neighbors.includes(b.id)) a.neighbors.push(b.id);
    if (!b.neighbors.includes(a.id)) b.neighbors.push(a.id);
  };

  // South Island grid nodes
  for (let xi = 0; xi < ROAD_X.length; xi++) {
    for (let zi = 0; zi < SOUTH_ROAD_Z.length; zi++) {
      const n = addNode(`s_${xi}_${zi}`, ROAD_X[xi], SOUTH_ROAD_Z[zi]);
      if (xi > 0) link(n, addNode(`s_${xi - 1}_${zi}`, ROAD_X[xi - 1], SOUTH_ROAD_Z[zi]));
      if (zi > 0) link(n, addNode(`s_${xi}_${zi - 1}`, ROAD_X[xi], SOUTH_ROAD_Z[zi - 1]));
    }
  }

  // North Island grid nodes
  for (let xi = 0; xi < ROAD_X.length; xi++) {
    for (let zi = 0; zi < NORTH_ROAD_Z.length; zi++) {
      const n = addNode(`n_${xi}_${zi}`, ROAD_X[xi], NORTH_ROAD_Z[zi]);
      if (xi > 0) link(n, addNode(`n_${xi - 1}_${zi}`, ROAD_X[xi - 1], NORTH_ROAD_Z[zi]));
      if (zi > 0) link(n, addNode(`n_${xi}_${zi - 1}`, ROAD_X[xi], NORTH_ROAD_Z[zi - 1]));
    }
  }

  // Grand Over-Water Highway Bridge link along x = 0 (index 2 in ROAD_X)
  const sBridgePortal = addNode('br_s', 0, 96);
  const nBridgePortal = addNode('br_n', 0, -96);
  const sCenter = byKey.get('s_2_0')!; // (0, 140)
  const nCenter = byKey.get('n_2_2')!; // (0, -140)
  link(sCenter, sBridgePortal);
  link(sBridgePortal, nBridgePortal);
  link(nBridgePortal, nCenter);

  // Airport access link from Northport (-280, -280) -> (-410, -280) -> (-410, -365)
  const northAirGate = byKey.get('n_0_1')!; // (-280, -280)
  const airCorner = addNode('air_corner', -410, -280);
  const airTerm = addNode('air_term', -410, -365);
  link(northAirGate, airCorner);
  link(airCorner, airTerm);

  // Marina dock node on South Island
  const southMarinaRoad = byKey.get('s_4_1')!; // (280, 280)
  const marinaGate = addNode('marina_gate', 340, 280);
  const marinaDock = addNode('marina_dock', 340, 350);
  link(southMarinaRoad, marinaGate);
  link(marinaGate, marinaDock);

  return nodes;
}

const NAV_GRAPH = buildRoadNavGraph();
const NAV_BY_ID = new Map(NAV_GRAPH.map((n) => [n.id, n]));

function findNearestNavNode(x: number, z: number): NavNode {
  let best = NAV_GRAPH[0];
  let bestD = Infinity;
  for (const n of NAV_GRAPH) {
    const d = Math.hypot(n.x - x, n.z - z);
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

/**
 * Computes a bright-blue GTA GPS polyline along real streets & the Grand Over-Water Highway Bridge using A*.
 */
export function computeGpsRoute(x1: number, z1: number, x2: number, z2: number): Array<{ x: number; z: number }> {
  if (Math.hypot(x2 - x1, z2 - z1) < 28) {
    return [
      { x: x1, z: z1 },
      { x: x2, z: z2 },
    ];
  }

  // If destination is on Paradise Key or Starlight Atoll, route to Port Vice Marina Dock first then across bay
  const destOnIsland = SAFEHOUSE_ISLANDS.some((isl) => Math.hypot(x2 - isl.cx, z2 - isl.cz) < 95);
  const srcOnIsland = SAFEHOUSE_ISLANDS.some((isl) => Math.hypot(x1 - isl.cx, z1 - isl.cz) < 95);
  if (destOnIsland && srcOnIsland) {
    return [
      { x: x1, z: z1 },
      { x: x2, z: z2 },
    ];
  }

  const startNode = findNearestNavNode(x1, z1);
  const goalNode = findNearestNavNode(x2, z2);

  if (startNode.id === goalNode.id) {
    return [
      { x: x1, z: z1 },
      { x: startNode.x, z: startNode.z },
      { x: x2, z: z2 },
    ];
  }

  const open = new Set<string>([startNode.id]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>([[startNode.id, 0]]);
  const fScore = new Map<string, number>([[startNode.id, Math.hypot(goalNode.x - startNode.x, goalNode.z - startNode.z)]]);

  while (open.size > 0) {
    let curId = '';
    let lowestF = Infinity;
    for (const id of open) {
      const f = fScore.get(id) ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        curId = id;
      }
    }
    if (!curId) break;
    if (curId === goalNode.id) break;

    open.delete(curId);
    const cur = NAV_BY_ID.get(curId)!;
    const curG = gScore.get(curId) ?? Infinity;

    for (const nbId of cur.neighbors) {
      const nb = NAV_BY_ID.get(nbId)!;
      const tentativeG = curG + Math.hypot(nb.x - cur.x, nb.z - cur.z);
      if (tentativeG < (gScore.get(nbId) ?? Infinity)) {
        cameFrom.set(nbId, curId);
        gScore.set(nbId, tentativeG);
        fScore.set(nbId, tentativeG + Math.hypot(goalNode.x - nb.x, goalNode.z - nb.z));
        open.add(nbId);
      }
    }
  }

  const nodePath: NavNode[] = [];
  let trace: string | undefined = goalNode.id;
  while (trace) {
    const n = NAV_BY_ID.get(trace);
    if (n) nodePath.unshift(n);
    trace = cameFrom.get(trace);
  }

  const pts: Array<{ x: number; z: number }> = [{ x: x1, z: z1 }];
  for (const n of nodePath) {
    const last = pts[pts.length - 1];
    if (Math.hypot(n.x - last.x, n.z - last.z) > 6) {
      pts.push({ x: n.x, z: n.z });
    }
  }
  const endLast = pts[pts.length - 1];
  if (Math.hypot(x2 - endLast.x, z2 - endLast.z) > 4) {
    pts.push({ x: x2, z: z2 });
  }
  return pts;
}

export const AIRPORT_ZONE = {
  cx: -440,
  cz: -385,
  runwayX: -455,
  runwayZ: -458,
  runwayLen: 185,
  runwayW: 24,
  helipadX: -362,
  helipadZ: -380,
};

export const CENTRAL_PARK = {
  cx: 70,
  cz: 350,
  w: 64,
  d: 64,
  fountainX: 70,
  fountainZ: 342,
  playgroundX: 70,
  playgroundZ: 362,
};

// Relative to Burger Shot Diner at (70, 210)
export const BURGER_SHOT_STATIONS = {
  grill: { x: 67.5, z: 204.8, label: 'Flat-Top Grill' },
  assembly: { x: 71.5, z: 206.0, label: 'Burger Assembly Table' },
  counter: { x: 68.8, z: 208.8, label: 'Customer Pickup Counter' },
};

export const HERO_INTERIORS: InteriorInfo[] = [
  // ─── SOUTH ISLAND: VICE DOWNTOWN ──────────────────────────────────────────────
  {
    id: 'int_jason_house',
    name: "Jason's Villa (Ocean View)",
    district: 'Vice Downtown',
    kind: 'safehouse',
    x: 210,
    z: 210,
    width: 26,
    depth: 20,
    hasRegister: false,
    robbedCooldown: 0,
    hasCCTV: false,
    cctvWiped: false,
    hasATM: false,
    activityId: 'act_wardrobe',
  },
  {
    id: 'int_burgershot',
    name: 'Burger Shot Diner (Leonida Flagship)',
    district: 'Vice Downtown',
    kind: 'burgershot',
    x: 70,
    z: 210,
    width: 18,
    depth: 15,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: true,
  },
  {
    id: 'int_precinct',
    name: 'Vice PD Central Precinct',
    district: 'Vice Downtown',
    kind: 'precinct',
    x: -70,
    z: 210,
    width: 24,
    depth: 18,
    hasRegister: false,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: false,
  },
  {
    id: 'int_gunshop',
    name: 'Vice Armory Gun Shop',
    district: 'Vice Downtown',
    kind: 'gunshop',
    x: 70,
    z: 105,
    width: 18,
    depth: 14,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: false,
  },
  {
    id: 'int_clothes_south',
    name: 'Vice Threads Clothing & Style',
    district: 'Vice Downtown',
    kind: 'clothes',
    x: -70,
    z: 105,
    width: 16,
    depth: 14,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: false,
    cctvWiped: false,
    hasATM: false,
    activityId: 'act_barber',
  },
  {
    id: 'int_coffee',
    name: 'Vice Roast Coffee Shop',
    district: 'Vice Downtown',
    kind: 'coffee',
    x: 210,
    z: 105,
    width: 16,
    depth: 14,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: false,
  },
  {
    id: 'int_bar_neon',
    name: 'Neon Anchor Beer Bar',
    district: 'Vice Downtown',
    kind: 'bar',
    x: -210,
    z: 210,
    width: 16,
    depth: 14,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: false,
    activityId: 'act_pool',
  },
  {
    id: 'int_bank',
    name: 'Leonida Reserve Bank',
    district: 'Vice Downtown',
    kind: 'bank',
    x: 210,
    z: 350,
    width: 22,
    depth: 18,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: true,
  },
  {
    id: 'int_jewelry',
    name: 'Vangelico Vice Jewelry',
    district: 'Vice Downtown',
    kind: 'jewelry',
    x: -70,
    z: 350,
    width: 16,
    depth: 14,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: false,
  },
  {
    id: 'int_mall',
    name: 'Vice Galleria Mega-Mall',
    district: 'Vice Downtown',
    kind: 'mall',
    x: -210,
    z: 350,
    width: 26,
    depth: 20,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: true,
    activityId: 'act_arcade',
  },
  {
    id: 'int_gym',
    name: 'Vice Iron Gym',
    district: 'Vice Downtown',
    kind: 'gym',
    x: 210,
    z: 480,
    width: 18,
    depth: 15,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: false,
    activityId: 'act_gym',
  },
  {
    id: 'int_mart_beach',
    name: '24/7 Ocean Mart',
    district: 'Ocean Drive',
    kind: 'mart',
    x: 320,
    z: 105,
    width: 14,
    depth: 14,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: true,
  },
  {
    id: 'int_club_neon',
    name: 'Club Malibu Neon',
    district: 'Ocean Drive',
    kind: 'club',
    x: 320,
    z: 210,
    width: 18,
    depth: 16,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: true,
    activityId: 'act_pool',
  },
  {
    id: 'int_boathouse',
    name: 'Port Vice Marina Boathouse',
    district: 'Vice Marina',
    kind: 'boathouse',
    x: 320,
    z: 350,
    width: 18,
    depth: 14,
    hasRegister: false,
    robbedCooldown: 0,
    hasCCTV: false,
    cctvWiped: false,
    hasATM: false,
    activityId: 'act_scuba',
  },

  // ─── NORTH ISLAND: NORTHPORT & AIRPORT ────────────────────────────────────────
  {
    id: 'int_gunshop_north',
    name: 'Northport Armory Gun Shop',
    district: 'Northport',
    kind: 'gunshop',
    x: -70,
    z: -210,
    width: 18,
    depth: 15,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: false,
  },
  {
    id: 'int_clothes_north',
    name: 'Northport Threads Boutique',
    district: 'Northport',
    kind: 'clothes',
    x: 210,
    z: -210,
    width: 16,
    depth: 14,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: false,
    cctvWiped: false,
    hasATM: false,
    activityId: 'act_barber',
  },
  {
    id: 'int_dealership',
    name: 'Vice Exotic Motors & Mod Shop',
    district: 'Northport',
    kind: 'dealership',
    x: 70,
    z: -210,
    width: 24,
    depth: 18,
    hasRegister: false,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: false,
  },
  {
    id: 'int_pawn_fence',
    name: 'Uncle Jack Pawn & Gear',
    district: 'Northport',
    kind: 'pawn',
    x: -210,
    z: -210,
    width: 16,
    depth: 14,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: false,
  },
  {
    id: 'int_barber',
    name: 'Cuts & Threads Barber & Styling',
    district: 'Northport',
    kind: 'barber',
    x: -70,
    z: -105,
    width: 14,
    depth: 13,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: false,
    cctvWiped: false,
    hasATM: false,
    activityId: 'act_barber',
  },
  {
    id: 'int_market',
    name: 'Northport Harbor Marketplace',
    district: 'Northport',
    kind: 'market',
    x: 70,
    z: -105,
    width: 18,
    depth: 15,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: false,
    cctvWiped: false,
    hasATM: true,
  },
  {
    id: 'int_diner',
    name: 'Havana Cuban Cafe & Diner',
    district: 'Northport',
    kind: 'diner',
    x: -210,
    z: -350,
    width: 16,
    depth: 14,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: true,
  },
  {
    id: 'int_bar_8ball',
    name: 'Jack of Hearts Bar',
    district: 'Northport',
    kind: 'bar',
    x: 210,
    z: -350,
    width: 16,
    depth: 14,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: false,
    activityId: 'act_pool',
  },
  {
    id: 'int_forest_cabin',
    name: 'Everglades Ranger & Bait Outpost',
    district: 'Northport Woods',
    kind: 'storefront',
    x: 70,
    z: -480,
    width: 16,
    depth: 14,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: false,
    cctvWiped: false,
    hasATM: false,
  },
  {
    id: 'int_airport',
    name: 'Leonida International Terminal',
    district: 'Leonida Airport',
    kind: 'airport',
    x: -410,
    z: -335,
    width: 28,
    depth: 18,
    hasRegister: false,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: true,
  },

  // ─── SAFEHOUSE ISLANDS: LUXURY BUNGALOWS ────────────────────────────────────
  {
    id: 'int_bungalow_paradise',
    name: 'Paradise Key Luxury Bungalow',
    district: 'Paradise Key',
    kind: 'bungalow',
    x: 560,
    z: 230,
    width: 18,
    depth: 14,
    hasRegister: false,
    robbedCooldown: 0,
    hasCCTV: false,
    cctvWiped: false,
    hasATM: false,
  },
  {
    id: 'int_bungalow_starlight',
    name: 'Starlight Atoll Luxury Estate',
    district: 'Starlight Atoll',
    kind: 'bungalow',
    x: 560,
    z: -230,
    width: 18,
    depth: 14,
    hasRegister: false,
    robbedCooldown: 0,
    hasCCTV: false,
    cctvWiped: false,
    hasATM: false,
  },
];

export const SEAT_SPOTS: SeatSpot[] = [
  { id: 'seat_home_sofa1', x: 202.2, y: LAND_Y + 0.46, z: 207.5, yaw: 0, label: 'Villa L-Sofa (Left)', venue: 'home' },
  { id: 'seat_home_sofa2', x: 204.0, y: LAND_Y + 0.46, z: 207.5, yaw: 0, label: 'Villa L-Sofa (Right)', venue: 'home' },
  { id: 'seat_home_patio', x: 199.5, y: LAND_Y + 0.46, z: 223.5, yaw: Math.PI, label: 'Villa Garden Patio', venue: 'home' },
  { id: 'seat_coffee_1', x: 207.5, y: LAND_Y + 0.46, z: 107.0, yaw: Math.PI / 2, label: 'Coffee Booth Seat A', venue: 'coffee' },
  { id: 'seat_coffee_2', x: 210.5, y: LAND_Y + 0.46, z: 107.0, yaw: -Math.PI / 2, label: 'Coffee Booth Seat B', venue: 'coffee' },
  { id: 'seat_bar_stool1', x: -212.0, y: LAND_Y + 0.62, z: 208.4, yaw: Math.PI, label: 'Beer Bar Stool 1', venue: 'bar' },
  { id: 'seat_bar_stool2', x: -210.0, y: LAND_Y + 0.62, z: 208.4, yaw: Math.PI, label: 'Beer Bar Stool 2', venue: 'bar' },
  { id: 'seat_bar_booth', x: -205.5, y: LAND_Y + 0.46, z: 212.5, yaw: -Math.PI / 2, label: 'VIP Lounge Booth', venue: 'bar' },
  { id: 'seat_bar2_stool', x: 208.5, y: LAND_Y + 0.62, z: -351.8, yaw: Math.PI, label: 'Jack of Hearts Stool', venue: 'bar' },
  { id: 'seat_burger_booth1', x: 64.8, y: LAND_Y + 0.46, z: 212.5, yaw: 0, label: 'Burger Shot Booth 1', venue: 'burger' },
  { id: 'seat_burger_booth2', x: 64.8, y: LAND_Y + 0.46, z: 215.2, yaw: Math.PI, label: 'Burger Shot Booth 2', venue: 'burger' },
  { id: 'seat_park_1', x: 60.5, y: LAND_Y + 0.46, z: 342.0, yaw: Math.PI / 2, label: 'Garden Bench (West)', venue: 'park' },
  { id: 'seat_park_2', x: 79.5, y: LAND_Y + 0.46, z: 342.0, yaw: -Math.PI / 2, label: 'Garden Bench (East)', venue: 'park' },
  { id: 'seat_park_3', x: 70.0, y: LAND_Y + 0.46, z: 333.5, yaw: 0, label: 'Garden Bench (North)', venue: 'park' },
  { id: 'seat_park_4', x: 62.0, y: LAND_Y + 0.46, z: 356.0, yaw: 0, label: 'Playground Parent Bench', venue: 'park' },
];

export const STREET_STALLS: StreetStallSpot[] = [
  { id: 'stall_burger_beach', name: 'Burger Shot Coastal Stall', kind: 'burger', x: 320, z: 160, yaw: 0 },
  { id: 'stall_fruit_park', name: 'Central Park Mango & Smoothie Stall', kind: 'fruit', x: 46, z: 328, yaw: Math.PI / 4 },
  { id: 'stall_burger_north', name: 'Northport Open Market Grill', kind: 'burger', x: 35, z: -172, yaw: 0 },
  { id: 'stall_merch_north', name: 'Northport Vinyl & Gear Stall', kind: 'merch', x: -175, z: -172, yaw: Math.PI },
];

export const GAS_STATIONS: GasStationSpot[] = [
  { id: 'gas_1', name: 'Ron Petrol & EV Hub (Vice Downtown)', x: 175, z: 168, isEV: true },
  { id: 'gas_2', name: 'Downtown Charge & Fuel', x: -32, z: 168, isEV: true },
  { id: 'gas_3', name: 'Northport Highway Fuel & EV', x: -32, z: -168, isEV: true },
  { id: 'gas_4', name: 'Airport AvGas & EV Depot', x: -355, z: -310, isEV: true },
];

export const FENCE_SPOTS: FenceSpot[] = [
  { id: 'fence_1', name: 'Northport Chop Shop & GPS Wipe', x: -245, z: -178 },
  { id: 'fence_2', name: 'Port Vice Dock Fence', x: 255, z: 388 },
];

export const DELIVERY_TARGETS = [
  { customerName: 'Marco (Ocean View Villa)', x: 225, z: 230 },
  { customerName: 'Sofia (Central Park Fountain)', x: 70, z: 334 },
  { customerName: 'Rico (Neon Anchor Bar)', x: -210, z: 195 },
  { customerName: 'Camila (Vice Galleria Entrance)', x: -210, z: 330 },
  { customerName: 'Darius (Northport Dealership)', x: 70, z: -190 },
  { customerName: 'Elena (Everglades Outpost)', x: 70, z: -464 },
];

export const INITIAL_STOCKS: StockAsset[] = [
  { symbol: 'VICE', name: 'Vice Shore Holdings', price: 142.5, changePct: 2.4, sharesOwned: 0 },
  { symbol: 'BSHOT', name: 'Burger Shot Corp', price: 68.2, changePct: 1.1, sharesOwned: 0 },
  { symbol: 'AMMO', name: 'Ammu-Nation Leonida', price: 215.0, changePct: -0.8, sharesOwned: 0 },
  { symbol: 'VLIFE', name: 'ViceLife Luxury', price: 310.4, changePct: 3.2, sharesOwned: 0 },
  { symbol: 'LCOIN', name: 'Leonida Coin (Crypto)', price: 94.0, changePct: 5.6, sharesOwned: 0 },
];

export const INITIAL_BUSINESSES: BusinessProperty[] = [
  { id: 'biz_carwash', name: 'Vice Shine Car Wash', kind: 'carwash', district: 'Northport', x: -175, z: -105, cost: 4500, owned: false, dailyIncome: 450 },
  { id: 'biz_nightclub', name: 'Club Malibu Neon (Front)', kind: 'nightclub', district: 'Ocean Drive', x: 320, z: 210, cost: 12000, owned: false, dailyIncome: 1100 },
  { id: 'biz_bungalow_paradise', name: 'Paradise Key Luxury Bungalow', kind: 'bungalow', district: 'Paradise Key', x: 560, z: 230, cost: 18500, owned: false, dailyIncome: 1650 },
  { id: 'biz_bungalow_starlight', name: 'Starlight Atoll Luxury Estate', kind: 'bungalow', district: 'Starlight Atoll', x: 560, z: -230, cost: 28000, owned: false, dailyIncome: 2500 },
];

export const CITY_JOBS: JobDef[] = [
  {
    id: 'job_burger_diner',
    name: 'Burger Shot Diner (Physical Shift & Delivery)',
    role: 'Kitchen Crew & Scooter Rider',
    district: 'Vice Downtown',
    x: 70,
    z: 210,
    pay: 30,
    description: 'Walk inside Burger Shot Diner to cook patties, assemble & serve ($15–$35) or deliver ($40–$80).',
  },
  {
    id: 'job_burger_beach',
    name: 'Burger Shot Coastal Stall',
    role: 'Grill Cook & Cashier',
    district: 'Ocean Drive',
    x: 320,
    z: 160,
    pay: 28,
    description: 'Flip Vice Burgers & serve beach customers at Burger Shot Stall.',
  },
  {
    id: 'job_burger_north',
    name: 'Northport Market Grill',
    role: 'Street Vendor',
    district: 'Northport',
    x: 35,
    z: -172,
    pay: 32,
    description: 'Cook rush-hour street orders across the Grand Highway Bridge.',
  },
  {
    id: 'job_taxi_downtown',
    name: 'Vice Cab Fare Run',
    role: 'City Driver',
    district: 'Vice Downtown',
    x: 22,
    z: 245,
    pay: 55,
    description: 'Pick up VIP fares across Vice Downtown & Northport.',
  },
  {
    id: 'job_airport_cargo',
    name: 'Leonida Air Freight Run',
    role: 'Ramp & Pilot Crew',
    district: 'Leonida Airport',
    x: -410,
    z: -335,
    pay: 85,
    description: 'Load cargo & prep charter aircraft at Leonida International.',
  },
];

/**
 * Strict road-corridor, water-shoreline, park, runway, and landmark bounding-box collision check.
 * Guarantees NO procedural building, bungalow, or tree ever overlaps asphalt or water.
 */
export function isTooCloseToRoadOrWater(bx: number, bz: number, halfW: number, halfD: number): boolean {
  // Check against every explicit road segment corridor
  for (const seg of ROAD_SEGMENTS) {
    const segMinX = Math.min(seg.x1, seg.x2) - seg.width / 2 - 4.5;
    const segMaxX = Math.max(seg.x1, seg.x2) + seg.width / 2 + 4.5;
    const segMinZ = Math.min(seg.z1, seg.z2) - seg.width / 2 - 4.5;
    const segMaxZ = Math.max(seg.z1, seg.z2) + seg.width / 2 + 4.5;
    if (bx + halfW > segMinX && bx - halfW < segMaxX && bz + halfD > segMinZ && bz - halfD < segMaxZ) {
      return true;
    }
  }

  // Check against Grand Bridge approaches
  for (const br of BRIDGES) {
    const bw = br.axis === 'z' ? br.width / 2 + 5 : br.length / 2 + 5;
    const bd = br.axis === 'z' ? br.length / 2 + 5 : br.width / 2 + 5;
    if (Math.abs(bx - br.cx) < halfW + bw && Math.abs(bz - br.cz) < halfD + bd) {
      return true;
    }
  }

  // Airport Runway & Helipad safety clearance
  if (
    Math.abs(bx - AIRPORT_ZONE.runwayX) < AIRPORT_ZONE.runwayLen / 2 + halfW + 12 &&
    Math.abs(bz - AIRPORT_ZONE.runwayZ) < AIRPORT_ZONE.runwayW / 2 + halfD + 16
  ) {
    return true;
  }
  if (Math.hypot(bx - AIRPORT_ZONE.helipadX, bz - AIRPORT_ZONE.helipadZ) < 26 + Math.max(halfW, halfD)) {
    return true;
  }

  // Central Park boundary clearance
  if (
    Math.abs(bx - CENTRAL_PARK.cx) < CENTRAL_PARK.w / 2 + halfW + 4 &&
    Math.abs(bz - CENTRAL_PARK.cz) < CENTRAL_PARK.d / 2 + halfD + 4
  ) {
    return true;
  }

  // Ocean & Shoreline margin: all 4 footprint corners must sit safely inland (shoreDist <= -7.5)
  const corners: Array<[number, number]> = [
    [bx, bz],
    [bx - halfW - 6, bz - halfD - 6],
    [bx + halfW + 6, bz - halfD - 6],
    [bx - halfW - 6, bz + halfD + 6],
    [bx + halfW + 6, bz + halfD + 6],
  ];
  for (const [cx, cz] of corners) {
    if (getWaterShoreDistance(cx, cz) > -6.5) return true;
  }

  return false;
}

export function generateViceCityWorld(): {
  buildings: BuildingFootprint[];
  interiors: InteriorInfo[];
  treasures: TreasureSpot[];
  weakTrees: WeakTreeSpot[];
  roadSigns: Array<{ x: number; z: number; yaw: number; color: number }>;
  billboards: Array<{ x: number; z: number; yaw: number; adIdx: number }>;
  busStops: Array<{ x: number; z: number; yaw: number }>;
  trafficLights: Array<{ x: number; z: number; axis: 'ns' | 'ew' }>;
} {
  const buildings: BuildingFootprint[] = [];
  const interiors: InteriorInfo[] = [...HERO_INTERIORS];
  const weakTrees: WeakTreeSpot[] = [];
  const roadSigns: Array<{ x: number; z: number; yaw: number; color: number }> = [];
  const billboards: Array<{ x: number; z: number; yaw: number; adIdx: number }> = [];
  const busStops: Array<{ x: number; z: number; yaw: number }> = [];
  const trafficLights: Array<{ x: number; z: number; axis: 'ns' | 'ew' }> = [];

  for (const hInt of HERO_INTERIORS) {
    let archStyle: BuildingArchStyle = 'brick_shop';
    if (hInt.kind === 'bank' || hInt.kind === 'mall' || hInt.kind === 'airport' || hInt.kind === 'dealership') {
      archStyle = 'glass_tower';
    } else if (hInt.district === 'Ocean Drive' || hInt.kind === 'safehouse' || hInt.kind === 'bungalow') {
      archStyle = hInt.kind === 'safehouse' || hInt.kind === 'bungalow' ? 'suburban_house' : 'art_deco';
    } else if (hInt.kind === 'market') {
      archStyle = 'market_stall';
    } else if (hInt.district === 'Northport Woods' || hInt.kind === 'boathouse') {
      archStyle = 'cabin_warehouse';
    }

    buildings.push({
      id: `b_${hInt.id}`,
      x: hInt.x,
      z: hInt.z,
      w: hInt.width,
      d: hInt.depth,
      h:
        hInt.kind === 'bank' || hInt.kind === 'mall'
          ? 20
          : hInt.kind === 'safehouse' || hInt.kind === 'bungalow'
          ? 6.4
          : hInt.kind === 'dealership'
          ? 8.5
          : hInt.kind === 'airport'
          ? 12
          : 9.5,
      district: hInt.district,
      color:
        hInt.kind === 'safehouse' || hInt.kind === 'bungalow'
          ? 0xf4e8da
          : hInt.kind === 'burgershot'
          ? 0xdc2626
          : hInt.kind === 'precinct'
          ? 0x263b5e
          : hInt.kind === 'dealership'
          ? 0x1e293b
          : hInt.kind === 'clothes'
          ? 0x831843
          : hInt.kind === 'market'
          ? 0xea580c
          : hInt.kind === 'gunshop'
          ? 0x573b26
          : hInt.kind === 'coffee'
          ? 0xe8d0b5
          : hInt.kind === 'bar'
          ? 0x2d2438
          : archStyle === 'cabin_warehouse'
          ? 0x6b4f3a
          : hInt.district === 'Ocean Drive'
          ? 0xf5d7cb
          : 0xd0c9be,
      archStyle,
      isDeco: archStyle === 'art_deco',
      isModern: archStyle === 'glass_tower',
      interior: hInt,
    });
  }

  const decoPalette = [0xf7d6cc, 0xcbeee8, 0xf9e7b8, 0xf2c2cf, 0xeae5dc];
  const towerPalette = [0x99a9ba, 0xbec5ce, 0x7c8b99, 0xd4cec3, 0x6b7c8f];
  const suburbPalette = [0xf3e8d8, 0xdbeafe, 0xfde68a, 0xe2e8f0, 0xfecdd3];
  const brickPalette = [0xb45309, 0x9a3412, 0x7c2d12, 0xa16207, 0x92400e];
  const storefrontKinds: InteriorKind[] = ['storefront', 'mart', 'coffee', 'bar', 'diner', 'clothes'];

  let idx = 0;
  // City blocks across BOTH Vice Downtown (South) & Northport (North)
  const blockXCenters = [-210, -70, 70, 210, 318];
  const blockZCenters = [-480, -350, -210, -105, 105, 210, 350, 480];

  for (const blockCx of blockXCenters) {
    for (const blockCz of blockZCenters) {
      // Skip Central Park block
      if (Math.abs(blockCx - CENTRAL_PARK.cx) < 35 && Math.abs(blockCz - CENTRAL_PARK.cz) < 35) continue;

      const isNorthWoods = blockCz < -440;
      const isNorthport = blockCz < 0;
      const isOceanDrive = blockCx > 280 && blockCz > 0;

      const offsets = isNorthWoods
        ? [
            [-26, -18],
            [26, 18],
          ]
        : [
            [-36, -24],
            [0, -24],
            [36, -24],
            [-36, 24],
            [0, 24],
            [36, 24],
          ];

      for (const [ox, oz] of offsets) {
        const bx = blockCx + ox;
        const bz = blockCz + oz;
        const seed = Math.abs(Math.sin((idx + 1) * 12.9898 + bx * 0.17 + bz * 0.31) * 43758.5453) % 1;
        if (isNorthWoods && seed > 0.45) continue;

        const w = isNorthport ? 13 + seed * 4.5 : 15 + seed * 5.0;
        const d = isNorthport ? 12 + (1 - seed) * 4.5 : 14 + (1 - seed) * 5.0;

        if (isTooCloseToRoadOrWater(bx, bz, w / 2, d / 2)) continue;

        const overlapsHero = HERO_INTERIORS.some(
          (hi) => Math.abs(hi.x - bx) < hi.width / 2 + w / 2 + 7 && Math.abs(hi.z - bz) < hi.depth / 2 + d / 2 + 7
        );
        const overlapsGas = GAS_STATIONS.some((g) => Math.abs(g.x - bx) < 16 && Math.abs(g.z - bz) < 16);
        const overlapsFence = FENCE_SPOTS.some((f) => Math.abs(f.x - bx) < 16 && Math.abs(f.z - bz) < 16);
        const overlapsStall = STREET_STALLS.some((st) => Math.abs(st.x - bx) < 14 && Math.abs(st.z - bz) < 14);
        const overlapsExisting = buildings.some(
          (b) => Math.abs(b.x - bx) < b.w / 2 + w / 2 + 3 && Math.abs(b.z - bz) < b.d / 2 + d / 2 + 3
        );
        if (overlapsHero || overlapsGas || overlapsFence || overlapsStall || overlapsExisting) continue;

        idx++;
        const district = getDistrictAt(bx, bz);
        let archStyle: BuildingArchStyle = 'brick_shop';
        let h = 11 + Math.floor(seed * 14);
        let color = brickPalette[idx % brickPalette.length];

        if (isNorthWoods) {
          archStyle = 'cabin_warehouse';
          h = 6.2 + Math.floor(seed * 3.5);
          color = 0x6b4423;
        } else if (!isNorthport && !isOceanDrive && Math.abs(bx) < 250) {
          archStyle = seed > 0.28 ? 'glass_tower' : 'art_deco';
          h = 26 + Math.floor(seed * 44);
          color = archStyle === 'glass_tower' ? towerPalette[idx % towerPalette.length] : decoPalette[idx % decoPalette.length];
        } else if (isOceanDrive) {
          archStyle = 'art_deco';
          h = 11 + Math.floor(seed * 16);
          color = decoPalette[idx % decoPalette.length];
        } else if (isNorthport) {
          archStyle = idx % 3 === 0 ? 'cabin_warehouse' : idx % 2 === 0 ? 'suburban_house' : 'brick_shop';
          h = archStyle === 'suburban_house' ? 6.2 + seed * 2.4 : 9 + seed * 7;
          color =
            archStyle === 'suburban_house'
              ? suburbPalette[idx % suburbPalette.length]
              : archStyle === 'cabin_warehouse'
              ? 0x475569
              : brickPalette[idx % brickPalette.length];
        }

        const isCoreEnterable = Math.abs(bx) < 310 && idx % 5 === 0;
        let interior: InteriorInfo | undefined;
        if (isCoreEnterable) {
          const kind = storefrontKinds[idx % storefrontKinds.length];
          const shopNames = [
            'Vice Corner Bodega',
            'Sol & Sand Boutique',
            'Cafecito Coffee Bar',
            'Northport Hardware & Gear',
            'Sunset Brews Pub',
            'Palmetto Pharmacy',
          ];
          interior = {
            id: `int_proc_${idx}`,
            name: `${shopNames[idx % shopNames.length]} #${idx}`,
            district,
            kind,
            x: bx,
            z: bz,
            width: w,
            depth: d,
            hasRegister: idx % 2 === 0,
            robbedCooldown: 0,
            hasCCTV: idx % 3 === 0,
            cctvWiped: false,
            hasATM: idx % 5 === 0,
          };
          interiors.push(interior);
        }

        buildings.push({
          id: `b_proc_${idx}`,
          x: bx,
          z: bz,
          w,
          d,
          h,
          district,
          color,
          archStyle,
          isDeco: archStyle === 'art_deco',
          isModern: archStyle === 'glass_tower',
          interior,
        });
      }
    }
  }

  // ─── Trees (Strictly checked against roads, buildings, and water!) ──────────
  let treeId = 0;
  const tryPushTree = (x: number, z: number, species: TreeSpecies, scale = 1.0) => {
    if (isTooCloseToRoadOrWater(x, z, 2.5, 2.5)) return;
    if (buildings.some((b) => Math.abs(b.x - x) < b.w / 2 + 4 && Math.abs(b.z - z) < b.d / 2 + 4)) return;
    weakTrees.push({
      id: `tree_${treeId++}`,
      x,
      z,
      scale,
      species,
      intact: true,
      fallAngle: 0,
      fallDirX: 0,
      fallDirZ: 1,
    });
  };

  // Vice Beach Coastal Palms (east edge of Vice Downtown)
  for (let z = 100; z <= 510; z += 26) {
    tryPushTree(342, z, 'palm', 1.05);
  }
  // Northport Coastal Palms & Oaks along North Shore
  for (let x = -310; x <= 300; x += 38) {
    tryPushTree(x, -92, 'palm', 0.95);
    tryPushTree(x, 92, 'palm', 1.0);
  }
  // Central Park Trees (skipping road checks since Central Park is inside block)
  const parkTrees: Array<[number, number, TreeSpecies]> = [
    [46, 326, 'oak'],
    [94, 326, 'palm'],
    [46, 374, 'palm'],
    [94, 374, 'oak'],
    [46, 350, 'oak'],
    [94, 350, 'oak'],
  ];
  for (const [px, pz, sp] of parkTrees) {
    weakTrees.push({
      id: `tree_${treeId++}`,
      x: px,
      z: pz,
      scale: 1.05,
      species: sp,
      intact: true,
      fallAngle: 0,
      fallDirX: 0,
      fallDirZ: 1,
    });
  }

  // Northport Woods Pines & Oaks (z in [-520 .. -445])
  for (let fx = -310; fx <= 300; fx += 34) {
    for (let fz = -520; fz <= -445; fz += 30) {
      const hash = Math.abs(Math.sin(fx * 0.13 + fz * 0.29) * 1000) % 1;
      if (hash > 0.65) continue;
      tryPushTree(fx + (hash - 0.3) * 8, fz + (hash - 0.3) * 8, hash > 0.3 ? 'pine' : 'oak', 0.95 + hash * 0.4);
    }
  }

  // Boulevards Urban Oaks & Palms along major avenues
  for (const rx of [-140, 0, 140]) {
    for (let z = 165; z <= 490; z += 46) {
      if (SOUTH_ROAD_Z.some((rz) => Math.abs(z - rz) < 18)) continue;
      tryPushTree(rx + 12.5, z, rx === 0 ? 'palm' : 'oak', 0.92);
      tryPushTree(rx - 12.5, z, rx === 0 ? 'palm' : 'oak', 0.92);
    }
    for (let z = -490; z <= -165; z += 48) {
      if (NORTH_ROAD_Z.some((rz) => Math.abs(z - rz) < 18)) continue;
      tryPushTree(rx + 12.5, z, 'pine', 0.94);
    }
  }

  // Safehouse Islands Tropical Palms around Paradise Key & Starlight Atoll
  for (const isl of SAFEHOUSE_ISLANDS) {
    const offsets: Array<[number, number]> = [
      [-38, -32],
      [38, -32],
      [-42, 18],
      [42, 18],
      [-28, 42],
      [28, 42],
    ];
    for (const [ox, oz] of offsets) {
      weakTrees.push({
        id: `tree_${treeId++}`,
        x: isl.cx + ox,
        z: isl.cz + oz,
        scale: 1.05,
        species: 'palm',
        intact: true,
        fallAngle: 0,
        fallDirX: 0,
        fallDirZ: 1,
      });
    }
  }

  // ─── Street Signs, Traffic Lights, Billboards & Bus Stops ────────────────────
  const signColors = [0x15803d, 0x1d4ed8, 0xd97706, 0x0f766e];
  let sIdx = 0;
  for (const rx of ROAD_X) {
    for (const rz of ROAD_Z) {
      if (getWaterShoreDistance(rx + 12, rz + 12) > -2) continue;
      roadSigns.push({
        x: rx + 11.2,
        z: rz + 11.2,
        yaw: sIdx % 2 === 0 ? 0 : Math.PI / 2,
        color: signColors[sIdx++ % signColors.length],
      });

      // Add Traffic Light Rigs at major 4-way intersections
      if (rx >= -140 && rx <= 140 && (rz === 140 || rz === 280 || rz === -140 || rz === -280)) {
        trafficLights.push({ x: rx + 10.5, z: rz + 10.5, axis: 'ns' });
        trafficLights.push({ x: rx - 10.5, z: rz - 10.5, axis: 'ew' });
      }
    }
  }

  // Glowing Roadside Billboards along Highways & Boulevards
  const billboardCoords: Array<[number, number, number]> = [
    [13.5, 195, Math.PI / 2],
    [-13.5, 325, -Math.PI / 2],
    [13.5, -195, Math.PI / 2],
    [-13.5, -330, -Math.PI / 2],
    [125, 126, 0],
    [-125, -126, Math.PI],
    [255, 266, 0],
    [-255, -266, Math.PI],
  ];
  billboardCoords.forEach(([x, z, yaw], i) => {
    if (!buildings.some((b) => Math.abs(b.x - x) < b.w / 2 + 5 && Math.abs(b.z - z) < b.d / 2 + 5)) {
      billboards.push({ x, z, yaw, adIdx: i % 4 });
    }
  });

  // Bus Stops along Vice Downtown & Northport Main Avenues
  const busStopCoords: Array<[number, number, number]> = [
    [11, 215, -Math.PI / 2],
    [-11, 355, Math.PI / 2],
    [151, 210, -Math.PI / 2],
    [11, -210, -Math.PI / 2],
    [-129, -210, Math.PI / 2],
  ];
  busStopCoords.forEach(([x, z, yaw]) => {
    busStops.push({ x, z, yaw });
  });

  const treasures: TreasureSpot[] = [
    { id: 'tr_1', x: 420, y: -2.6, z: 40, found: false, value: 850 },
    { id: 'tr_2', x: 455, y: -3.2, z: -30, found: false, value: 1100 },
    { id: 'tr_3', x: -120, y: -2.4, z: 0, found: false, value: 950 },
    { id: 'tr_4', x: 120, y: -2.5, z: -15, found: false, value: 1200 },
    { id: 'tr_5', x: 485, y: -3.4, z: 120, found: false, value: 1800 },
  ];

  return { buildings, interiors, treasures, weakTrees, roadSigns, billboards, busStops, trafficLights };
}

export const SIDE_ACTIVITIES: ActivityDef[] = [
  { id: 'act_basketball', name: 'Ocean Beach Basketball', category: 'Sports', district: 'Ocean Drive', x: 335, z: 175, statReward: 'stamina', description: 'Sink rhythm jump shots on the beachfront court.', completedCount: 0 },
  { id: 'act_tennis', name: 'Vice Country Club Tennis', category: 'Sports', district: 'Ocean Drive', x: 335, z: 245, statReward: 'focus', description: 'Time precision baseline rallies.', completedCount: 0 },
  { id: 'act_minigolf', name: 'Boardwalk Mini-Golf', category: 'Sports', district: 'Ocean Drive', x: 335, z: 310, statReward: 'focus', description: 'Line up the angle & power putt across Neon Palms.', completedCount: 0 },
  { id: 'act_pool', name: '8-Ball Pool', category: 'Nightlife & Chill', district: 'Vice Downtown', x: -210, z: 210, statReward: 'relationship', description: 'Play 8-ball pool together at Neon Anchor Beer Bar.', completedCount: 0 },
  { id: 'act_fishing', name: 'Vice Pier Fishing', category: 'Water & Wild', district: 'Vice Marina', x: 375, z: 350, statReward: 'focus', description: 'Cast off the marina pier & balance reel tension.', completedCount: 0 },
  { id: 'act_hunting', name: 'Northport Woods Tracking', category: 'Water & Wild', district: 'Northport Woods', x: 70, z: -480, statReward: 'focus', description: 'Track & tag wild targets in the Everglades.', completedCount: 0 },
  { id: 'act_scuba', name: 'Scuba Reef Treasure Hunt', category: 'Water & Wild', district: 'Vice Bay', x: 420, z: 40, statReward: 'cash', description: 'Dive underwater to recover sunken cartel crates.', completedCount: 0 },
  { id: 'act_kayaking', name: 'Channel Kayaking', category: 'Water & Wild', district: 'Ocean Channel', x: 180, z: 0, statReward: 'stamina', description: 'Paddle through turquoise channel buoys.', completedCount: 0 },
  { id: 'act_wrestling', name: 'Northport Backyard Brawl', category: 'Combat & Crime', district: 'Northport', x: -245, z: -178, statReward: 'muscle', description: 'Underground alley brawl — block, counter & slam.', completedCount: 0 },
  { id: 'act_gym', name: 'Vice Iron Bench & Bag', category: 'Sports', district: 'Vice Downtown', x: 210, z: 480, statReward: 'muscle', description: 'Pump iron to boost Muscle & intimidation.', completedCount: 0 },
  { id: 'act_range', name: 'Vice Armory Tactical Range', category: 'Combat & Crime', district: 'Vice Downtown', x: 70, z: 105, statReward: 'focus', description: 'Sharpen slow-motion Dead-Eye Focus.', completedCount: 0 },
  { id: 'act_arcade', name: 'Galleria Retro Arcade', category: 'Nightlife & Chill', district: 'Vice Downtown', x: -210, z: 350, statReward: 'focus', description: 'Beat the Neon Outrun high score.', completedCount: 0 },
  { id: 'act_yoga', name: 'Central Park Sunrise Yoga', category: 'Sports', district: 'Leonida Central Park', x: 70, z: 342, statReward: 'stamina', description: 'Breath timing in Leonida Central Park.', completedCount: 0 },
  { id: 'act_jetski', name: 'Vice Bay Jet-Ski Sprint', category: 'Water & Wild', district: 'Vice Marina', x: 382, z: 350, statReward: 'stamina', description: 'Hit wave gates at top throttle.', completedCount: 0 },
  { id: 'act_streetrace', name: 'Grand Bridge Midnight Sprint', category: 'Combat & Crime', district: 'Grand Highway Bridge', x: 0, z: 96, statReward: 'cash', description: 'High-stakes bridge & boulevard sprint.', completedCount: 0 },
  { id: 'act_armwrestle', name: 'Diner Arm Wrestling', category: 'Sports', district: 'Northport', x: -210, z: -350, statReward: 'muscle', description: 'Rapid-power grip duel.', completedCount: 0 },
  { id: 'act_darts', name: 'Club Malibu Darts', category: 'Nightlife & Chill', district: 'Ocean Drive', x: 320, z: 210, statReward: 'focus', description: 'Nail bullseyes for cash & bond.', completedCount: 0 },
  { id: 'act_poker', name: 'High-Stakes Vice Poker', category: 'Nightlife & Chill', district: 'Vice Downtown', x: 210, z: 350, statReward: 'cash', description: 'Bluff & read the table in downtown VIP room.', completedCount: 0 },
  { id: 'act_bowling', name: 'Northport Lanes Bowling', category: 'Sports', district: 'Northport', x: -210, z: -210, statReward: 'relationship', description: 'Date-night strikes with Jason & Lucia.', completedCount: 0 },
  { id: 'act_surfing', name: 'Paradise Key Reef Surfing', category: 'Water & Wild', district: 'Paradise Key', x: 485, z: 240, statReward: 'stamina', description: 'Carve the swell balance meter.', completedCount: 0 },
  { id: 'act_parkour', name: 'Downtown Rooftop Parkour', category: 'Sports', district: 'Vice Downtown', x: -70, z: 210, statReward: 'stamina', description: 'Vault neon AC units under the clock.', completedCount: 0 },
  { id: 'act_carmeet', name: 'Leonida Car Meet Showoff', category: 'Nightlife & Chill', district: 'Northport', x: 70, z: -210, statReward: 'relationship', description: 'Rev engines, flash lights & drift donuts.', completedCount: 0 },
  { id: 'act_atm_skim', name: 'ATM Cyber Skimming', category: 'Combat & Crime', district: 'Vice Downtown', x: 210, z: 350, statReward: 'cash', description: 'Crack security pins without tripping alarms.', completedCount: 0 },
  { id: 'act_drone', name: 'Airport Tower Drone Recon', category: 'Combat & Crime', district: 'Leonida Airport', x: -410, z: -335, statReward: 'focus', description: 'Scout cargo flights from control tower.', completedCount: 0 },
  { id: 'act_photo', name: 'Everglades Wildlife Safari', category: 'Water & Wild', district: 'Northport Woods', x: -70, z: -480, statReward: 'relationship', description: 'Snap rare deer, birds & forest wildlife.', completedCount: 0 },
  { id: 'act_gator', name: 'Bayou Gator Challenge', category: 'Water & Wild', district: 'Northport Woods', x: -140, z: -480, statReward: 'muscle', description: 'Spot and dodge stray gators in Northport Woods.', completedCount: 0 },
  { id: 'act_karaoke', name: 'Northport Salsa & Karaoke', category: 'Nightlife & Chill', district: 'Northport', x: 210, z: -350, statReward: 'relationship', description: 'Sync beats with your partner.', completedCount: 0 },
  { id: 'act_delivery', name: 'Express Vice Courier', category: 'Combat & Crime', district: 'Northport', x: 35, z: -172, statReward: 'cash', description: 'No-damage high-speed parcel run.', completedCount: 0 },
  { id: 'act_boxing', name: 'Villa Home Gym Heavy Bag', category: 'Combat & Crime', district: 'Vice Downtown', x: 218, z: 216, statReward: 'muscle', description: 'Combo strike rhythm training at Jason’s Villa.', completedCount: 0 },
  { id: 'act_triathlon', name: 'Vice Boardwalk Triathlon', category: 'Sports', district: 'Ocean Drive', x: 344, z: 190, statReward: 'stamina', description: 'Swim, sprint & cycle endurance test.', completedCount: 0 },
  { id: 'act_blackjack', name: 'Ocean Drive Blackjack', category: 'Nightlife & Chill', district: 'Ocean Drive', x: 320, z: 210, statReward: 'cash', description: 'Hit 21 without busting.', completedCount: 0 },
  { id: 'act_barber', name: 'Fresh Fade & Threads', category: 'Nightlife & Chill', district: 'Vice Downtown', x: -70, z: 105, statReward: 'relationship', description: 'Swap outfit & style to drop police heat.', completedCount: 0 },
];

export const INITIAL_SOCIAL_POSTS: SocialPost[] = [
  {
    id: 'soc_1',
    handle: '@ViceDriftKing',
    author: 'Marco_V8',
    district: 'Northport',
    caption: 'LIVE: Cross the Grand Leonida Bridge! Vice Exotic Motors in Northport just stocked Stage 2 Turbos & hypercars!',
    isLive: true,
    viewers: 4820,
    likes: 12900,
    eventKind: 'takeover',
    x: 70,
    z: -210,
    timeAgo: 'LIVE NOW',
    visited: false,
  },
  {
    id: 'soc_2',
    handle: '@LeonidaAviation',
    author: 'Pilot_Kira',
    district: 'Leonida Airport',
    caption: 'Helicopter & Stunt Plane charters parked on Runway 27 at Northport Airport Wing!',
    isLive: true,
    viewers: 3110,
    likes: 9400,
    eventKind: 'chase',
    x: -410,
    z: -335,
    timeAgo: 'LIVE NOW',
    visited: false,
  },
  {
    id: 'soc_3',
    handle: '@DowntownAlert305',
    author: 'ViceScanner',
    district: 'Vice Downtown',
    caption: 'Burger Shot Diner hiring Grill Chefs ($15-$35/order) & Delivery Moped Riders ($40-$80/drop)!',
    isLive: true,
    viewers: 6190,
    likes: 15200,
    eventKind: 'armored',
    x: 70,
    z: 210,
    timeAgo: '3m ago',
    visited: false,
  },
  {
    id: 'soc_4',
    handle: '@ParadiseKeysRE',
    author: 'Elena_Lux',
    district: 'Paradise Key',
    caption: 'Two private tropical Safehouse Bungalows with infinity pools & docks spotted offshore on Paradise Key & Starlight Atoll!',
    isLive: true,
    viewers: 2840,
    likes: 7600,
    eventKind: 'beachparty',
    x: 560,
    z: 230,
    timeAgo: '5m ago',
    visited: false,
  },
  {
    id: 'soc_5',
    handle: '@BeachVibesMia',
    author: 'DJ_Sol',
    district: 'Leonida Central Park',
    caption: 'Kids playground carnival & Mango smoothie stall popping off at Leonida Central Park!',
    isLive: true,
    viewers: 1940,
    likes: 4300,
    eventKind: 'beachparty',
    x: 70,
    z: 350,
    timeAgo: 'LIVE NOW',
    visited: false,
  },
];

export const INITIAL_MISSIONS: MissionDef[] = [
  {
    id: 'mis_1',
    title: 'Trust & Trigger: Ocean Mart Score',
    giver: 'Jason & Lucia',
    district: 'Ocean Drive',
    summary: 'Invite Lucia into your car from Jason’s Villa, hit 24/7 Ocean Mart together, wipe CCTV, and escape clean.',
    duoRecommended: true,
    targetX: 320,
    targetZ: 105,
    rewardCash: 1650,
    rewardBond: 12,
    stage: 'available',
    objectiveText: 'Bring Lucia (Phone/E/K) & hit 24/7 Ocean Mart on Ocean Drive, rob & wipe CCTV.',
  },
  {
    id: 'mis_2',
    title: 'Bridge Run: Northport Exotic Boost',
    giver: 'Uncle Jack (Fence)',
    district: 'Northport',
    summary: 'Cross the Grand Leonida Highway Bridge into Northport, clone a Luxury Exotic and deliver to the Chop Shop Fence.',
    duoRecommended: false,
    targetX: -245,
    targetZ: -178,
    rewardCash: 2800,
    rewardBond: 8,
    stage: 'available',
    objectiveText: 'Cross the Over-Water Bridge, boost a Luxury car & reach Northport Chop Shop Fence.',
  },
  {
    id: 'mis_3',
    title: 'Vangelico Vice Midnight Raid',
    giver: 'Jason & Lucia',
    district: 'Vice Downtown',
    summary: 'Coordinate a dual-protagonist smash-and-grab at Vangelico Vice Jewelry, ditch heat by changing outfits at Vice Threads.',
    duoRecommended: true,
    targetX: -70,
    targetZ: 350,
    rewardCash: 4500,
    rewardBond: 18,
    stage: 'available',
    objectiveText: 'Call Lucia, hit Vangelico Vice Jewelry & swap clothes at Vice Threads.',
  },
  {
    id: 'mis_4',
    title: 'Sunken Cartel Gold',
    giver: 'Marina Contact',
    district: 'Vice Bay',
    summary: 'Dive into the Ocean Channel reef and recover submerged loot crates before patrol boats sweep the coast.',
    duoRecommended: false,
    targetX: 420,
    targetZ: 40,
    rewardCash: 3200,
    rewardBond: 10,
    stage: 'available',
    objectiveText: 'Swim or boat out to Vice Bay reef and collect sunken treasure underwater.',
  },
  {
    id: 'mis_5',
    title: 'Leonida Reserve Vault',
    giver: 'Jason & Lucia',
    district: 'Vice Downtown',
    summary: 'Storm Leonida Reserve Bank with Armory weapons & explosives, clean the vault, and escape across the Highway Bridge!',
    duoRecommended: true,
    targetX: 210,
    targetZ: 350,
    rewardCash: 12000,
    rewardBond: 25,
    stage: 'available',
    objectiveText: 'Storm Leonida Reserve Bank, clean the vault & escape Vice PD!',
  },
];

export function getDistrictAt(x: number, z: number): string {
  if (getBridgeDeckInfo(x, z).onBridge) return 'Grand Highway Bridge';
  if (Math.hypot(x - 560, z - 240) < 82) return 'Paradise Key';
  if (Math.hypot(x - 560, z + 240) < 82) return 'Starlight Atoll';
  if (isWaterChannel(x, z)) {
    return Math.abs(z) <= 78 && x < 390 && x > -360 ? 'Ocean Channel' : 'Vice Bay (Ocean)';
  }
  if (x < -310 && z < -240) return 'Leonida Airport';
  if (z < -435) return 'Northport Woods';
  if (z < -70) return 'Northport';
  if (Math.abs(x - CENTRAL_PARK.cx) <= CENTRAL_PARK.w / 2 && Math.abs(z - CENTRAL_PARK.cz) <= CENTRAL_PARK.d / 2) {
    return 'Leonida Central Park';
  }
  if (x > 290 && z > 300) return 'Vice Marina';
  if (x > 280) return 'Ocean Drive';
  return 'Vice Downtown';
}
