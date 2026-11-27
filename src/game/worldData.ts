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

export const LAND_Y = 0.0;
export const ROAD_Y = 0.08;

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

export interface AirportDef {
  id: string;
  name: string;
  district: string;
  cx: number;
  cz: number;
  hx: number;
  hz: number;
  fenceMinX: number;
  fenceMaxX: number;
  fenceMinZ: number;
  fenceMaxZ: number;
  gateX: number;
  gateZ: number;
  gateWidth: number;
  runwayX: number;
  runwayZ: number;
  runwayLen: number;
  runwayW: number;
  helipadX: number;
  helipadZ: number;
  towerX: number;
  towerZ: number;
  terminalX: number;
  terminalZ: number;
  ticketX: number;
  ticketZ: number;
  destinationId: string;
  destinationName: string;
}

export interface AirportFenceWall {
  id: string;
  cx: number;
  cz: number;
  hx: number;
  hz: number;
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

// ─── 5x Scale Road Grid & Multi-City Geography ───────────────────────────────
export const ROAD_X = [-1400, -700, 0, 700, 1400];
export const SOUTH_ROAD_Z = [700, 1400, 2100];
export const NORTH_ROAD_Z = [-2450, -2100, -1400, -700];
export const ROAD_Z = [...NORTH_ROAD_Z, ...SOUTH_ROAD_Z];
export const HIGHWAY_X = [0];
export const HIGHWAY_Z = [-1400, 1400];

export const SOUTH_ISLAND = {
  name: 'Vice Downtown',
  cx: 25,
  cz: 1525,
  hx: 1775,
  hz: 1150,
};

export const NORTH_ISLAND = {
  name: 'Northport',
  cx: -25,
  cz: -1537.5,
  hx: 1725,
  hz: 1162.5,
};

// Two Complete Fenced International Airports (South Vice + Northport)
export const AIRPORT_ZONES: AirportDef[] = [
  {
    id: 'air_south',
    name: 'South Vice International Airport',
    district: 'South Vice Airport',
    cx: -2175,
    cz: 1550,
    hx: 425,
    hz: 420,
    fenceMinX: -2560,
    fenceMaxX: -1750,
    fenceMinZ: 1170,
    fenceMaxZ: 1930,
    gateX: -1750,
    gateZ: 1400,
    gateWidth: 40,
    runwayX: -2220,
    runwayZ: 1720,
    runwayLen: 520,
    runwayW: 44,
    helipadX: -1920,
    helipadZ: 1490,
    towerX: -1980,
    towerZ: 1600,
    terminalX: -1870,
    terminalZ: 1340,
    ticketX: -1850,
    ticketZ: 1365,
    destinationId: 'air_north',
    destinationName: 'Northport International Airport',
  },
  {
    id: 'air_north',
    name: 'Northport International Airport',
    district: 'Northport Airport',
    cx: -2175,
    cz: -1550,
    hx: 425,
    hz: 420,
    fenceMinX: -2560,
    fenceMaxX: -1750,
    fenceMinZ: -1930,
    fenceMaxZ: -1170,
    gateX: -1750,
    gateZ: -1400,
    gateWidth: 40,
    runwayX: -2220,
    runwayZ: -1720,
    runwayLen: 520,
    runwayW: 44,
    helipadX: -1920,
    helipadZ: -1490,
    towerX: -1980,
    towerZ: -1600,
    terminalX: -1870,
    terminalZ: -1340,
    ticketX: -1850,
    ticketZ: -1365,
    destinationId: 'air_south',
    destinationName: 'South Vice International Airport',
  },
];

export const AIRPORT_ZONE = AIRPORT_ZONES[1];

// Solid Jali perimeter fence segments (4 sides per airport, east wall split around main gate)
export const AIRPORT_FENCE_WALLS: AirportFenceWall[] = AIRPORT_ZONES.flatMap((az) => {
  const halfGate = az.gateWidth / 2;
  const wallT = 0.7;
  const cxW = (az.fenceMinX + az.fenceMaxX) / 2;
  const hxW = (az.fenceMaxX - az.fenceMinX) / 2;
  const northLen = Math.max(4, az.gateZ - halfGate - az.fenceMinZ);
  const southLen = Math.max(4, az.fenceMaxZ - (az.gateZ + halfGate));
  return [
    { id: `${az.id}_w_north`, cx: cxW, cz: az.fenceMinZ, hx: hxW, hz: wallT },
    { id: `${az.id}_w_south`, cx: cxW, cz: az.fenceMaxZ, hx: hxW, hz: wallT },
    {
      id: `${az.id}_w_west`,
      cx: az.fenceMinX,
      cz: (az.fenceMinZ + az.fenceMaxZ) / 2,
      hx: wallT,
      hz: (az.fenceMaxZ - az.fenceMinZ) / 2,
    },
    {
      id: `${az.id}_w_east_top`,
      cx: az.gateX,
      cz: az.fenceMinZ + northLen / 2,
      hx: wallT,
      hz: northLen / 2,
    },
    {
      id: `${az.id}_w_east_bot`,
      cx: az.gateX,
      cz: az.gateZ + halfGate + southLen / 2,
      hx: wallT,
      hz: southLen / 2,
    },
  ];
});

export const SAFEHOUSE_ISLANDS: SafehouseIslandDef[] = [
  {
    id: 'isl_paradise',
    name: 'Paradise Key',
    cx: 2650,
    cz: 1100,
    halfSize: 220,
    cornerRadius: 90,
    bungalowX: 2650,
    bungalowZ: 1060,
    poolX: 2650,
    poolZ: 1140,
    accentColor: 0x0ea5e9,
  },
  {
    id: 'isl_starlight',
    name: 'Starlight Atoll',
    cx: 2650,
    cz: -1100,
    halfSize: 220,
    cornerRadius: 90,
    bungalowX: 2650,
    bungalowZ: -1060,
    poolX: 2650,
    poolZ: -1140,
    accentColor: 0xf43f5e,
  },
];

export const TAXI_STAND = {
  id: 'taxi_stand_main',
  name: 'Vice Downtown Taxi Stand',
  x: 110,
  z: 1225,
};

export const ROAD_SEGMENTS: RoadSegmentDef[] = [
  // Vice Downtown (South Island) North-South Streets
  ...ROAD_X.map((rx) => ({
    id: `s_ns_${rx}`,
    x1: rx,
    z1: rx === 0 ? 460 : 420,
    x2: rx,
    z2: 2620,
    width: rx === 0 ? 28 : 20,
    isHighway: rx === 0,
    island: 'south' as const,
  })),
  // Vice Downtown East-West Streets (z=1400 connects west through South Airport Security Gate)
  ...SOUTH_ROAD_Z.map((rz) => ({
    id: `s_ew_${rz}`,
    x1: rz === 1400 ? -1880 : -1680,
    z1: rz,
    x2: 1700,
    z2: rz,
    width: rz === 1400 ? 26 : 20,
    isHighway: rz === 1400,
    island: 'south' as const,
  })),
  // South Airport Terminal Access Road inside gate
  {
    id: 'air_south_ns',
    x1: -1870,
    z1: 1365,
    x2: -1870,
    z2: 1680,
    width: 20,
    isHighway: false,
    island: 'airport' as const,
  },
  // Northport & Paleto Suburbs North-South Streets
  ...ROAD_X.map((rx) => ({
    id: `n_ns_${rx}`,
    x1: rx,
    z1: -2620,
    x2: rx,
    z2: rx === 0 ? -460 : -420,
    width: rx === 0 ? 28 : 20,
    isHighway: rx === 0,
    island: 'north' as const,
  })),
  // Northport East-West Streets (z=-1400 connects west through North Airport Security Gate)
  ...NORTH_ROAD_Z.map((rz) => ({
    id: `n_ew_${rz}`,
    x1: rz === -1400 ? -1880 : -1680,
    z1: rz,
    x2: 1640,
    z2: rz,
    width: rz === -1400 ? 26 : 20,
    isHighway: rz === -1400,
    island: 'north' as const,
  })),
  // North Airport Terminal Access Road inside gate
  {
    id: 'air_north_ns',
    x1: -1870,
    z1: -1680,
    x2: -1870,
    z2: -1365,
    width: 20,
    isHighway: false,
    island: 'airport' as const,
  },
  // Neighborhood Secondary Avenues & Beachfront Boulevard (preserves every hero building, park, stall & gas station)
  { id: 's_sec_552', x1: -1400, z1: 552, x2: 1680, z2: 552, width: 14, isHighway: false, island: 'south' as const },
  { id: 's_sec_1090', x1: -1400, z1: 1090, x2: 1680, z2: 1090, width: 14, isHighway: false, island: 'south' as const },
  { id: 's_sec_1782_w', x1: -1400, z1: 1782, x2: 250, z2: 1782, width: 14, isHighway: false, island: 'south' as const },
  { id: 's_sec_1782_e', x1: 450, z1: 1782, x2: 1680, z2: 1782, width: 14, isHighway: false, island: 'south' as const },
  { id: 's_sec_2430', x1: -1400, z1: 2430, x2: 1680, z2: 2430, width: 14, isHighway: false, island: 'south' as const },
  { id: 's_ns_sec_w525', x1: -525, z1: 440, x2: -525, z2: 2580, width: 14, isHighway: false, island: 'south' as const },
  { id: 's_ns_sec_175', x1: 175, z1: 440, x2: 175, z2: 2580, width: 14, isHighway: false, island: 'south' as const },
  { id: 's_ns_sec_525', x1: 525, z1: 440, x2: 525, z2: 2580, width: 14, isHighway: false, island: 'south' as const },
  { id: 's_ns_sec_1225', x1: 1225, z1: 440, x2: 1225, z2: 2580, width: 14, isHighway: false, island: 'south' as const },
  { id: 's_ns_ocean_dr', x1: 1660, z1: 450, x2: 1660, z2: 2550, width: 16, isHighway: false, island: 'south' as const },
  { id: 'n_sec_555', x1: -1400, z1: -555, x2: 1620, z2: -555, width: 14, isHighway: false, island: 'north' as const },
  { id: 'n_sec_1082', x1: -1400, z1: -1082, x2: 1620, z2: -1082, width: 14, isHighway: false, island: 'north' as const },
  { id: 'n_sec_1782', x1: -1400, z1: -1782, x2: 1620, z2: -1782, width: 14, isHighway: false, island: 'north' as const },
  { id: 'n_ns_sec_w525', x1: -525, z1: -2580, x2: -525, z2: -440, width: 14, isHighway: false, island: 'north' as const },
  { id: 'n_ns_sec_525', x1: 525, z1: -2580, x2: 525, z2: -440, width: 14, isHighway: false, island: 'north' as const },
  { id: 'n_ns_sec_1225', x1: 1225, z1: -2580, x2: 1225, z2: -440, width: 14, isHighway: false, island: 'north' as const },
];

// Grand Over-Water Main Highway Bridge connecting Vice Downtown & Northport across the wide 5x Ocean Channel
export const BRIDGES: BridgeDef[] = [
  {
    id: 'br_grand_highway',
    name: 'Grand Leonida Highway Bridge',
    axis: 'z',
    cx: 0,
    cz: 0,
    length: 960,
    width: 32,
    deckHeight: 11.5,
  },
];

// Boat Docks over Water (5x coordinates matching coastlines & islands)
export const WOODEN_DOCKS: DockDef[] = [
  { id: 'dock_marina', name: 'Port Vice Marina Dock', xMin: 1785, xMax: 1855, zMin: 1735, zMax: 1765, deckY: 0.28 },
  { id: 'dock_northport', name: 'Northport Harbor Dock', xMin: 310, xMax: 345, zMin: -430, zMax: -360, deckY: 0.28 },
  { id: 'dock_paradise', name: 'Paradise Key Island Dock', xMin: 2380, xMax: 2450, zMin: 1085, zMax: 1115, deckY: 0.28 },
  { id: 'dock_starlight', name: 'Starlight Atoll Dock', xMin: 2380, xMax: 2450, zMin: -1115, zMax: -1085, deckY: 0.28 },
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
    const flatSpan = br.length > 400 ? 260 : 52;
    if (br.axis === 'x') {
      const dx = Math.abs(x - br.cx);
      const dz = Math.abs(z - br.cz);
      if (dx <= halfL && dz <= halfW) {
        let h = br.deckHeight;
        if (dx > flatSpan) {
          const t = 1 - (dx - flatSpan) / (halfL - flatSpan);
          const smooth = t * t * (3 - 2 * t);
          h = ROAD_Y + (br.deckHeight - ROAD_Y) * smooth;
        }
        return { onBridge: true, height: h, bridge: br, nearGuardrail: dz > halfW - 1.3 };
      }
    } else {
      const dx = Math.abs(x - br.cx);
      const dz = Math.abs(z - br.cz);
      if (dz <= halfL && dx <= halfW) {
        let h = br.deckHeight;
        if (dz > flatSpan) {
          const t = 1 - (dz - flatSpan) / (halfL - flatSpan);
          const smooth = t * t * (3 - 2 * t);
          h = ROAD_Y + (br.deckHeight - ROAD_Y) * smooth;
        }
        return { onBridge: true, height: h, bridge: br, nearGuardrail: dx > halfW - 1.3 };
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

// ─── A* Road-Node GPS Pathfinder (5x Map: South, North, Paleto, Bridge & Both Airports) ──
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

  // North Island + Paleto Suburbs grid nodes
  for (let xi = 0; xi < ROAD_X.length; xi++) {
    for (let zi = 0; zi < NORTH_ROAD_Z.length; zi++) {
      const n = addNode(`n_${xi}_${zi}`, ROAD_X[xi], NORTH_ROAD_Z[zi]);
      if (xi > 0) link(n, addNode(`n_${xi - 1}_${zi}`, ROAD_X[xi - 1], NORTH_ROAD_Z[zi]));
      if (zi > 0) link(n, addNode(`n_${xi}_${zi - 1}`, ROAD_X[xi], NORTH_ROAD_Z[zi - 1]));
    }
  }

  // Grand Over-Water Highway Bridge link along x = 0
  const sBridgePortal = addNode('br_s', 0, 480);
  const nBridgePortal = addNode('br_n', 0, -480);
  const sCenter = byKey.get('s_2_0')!; // (0, 700)
  const nCenter = byKey.get('n_2_3')!; // (0, -700)
  link(sCenter, sBridgePortal);
  link(sBridgePortal, nBridgePortal);
  link(nBridgePortal, nCenter);

  // South Airport security gate & terminal link
  const southWestRoad = byKey.get('s_0_1')!; // (-1400, 1400)
  const southAirGate = addNode('air_s_gate', -1750, 1400);
  const southAirCorner = addNode('air_s_corner', -1870, 1400);
  const southAirTerm = addNode('air_s_term', -1870, 1620);
  link(southWestRoad, southAirGate);
  link(southAirGate, southAirCorner);
  link(southAirCorner, southAirTerm);

  // North Airport security gate & terminal link
  const northWestRoad = byKey.get('n_0_2')!; // (-1400, -1400)
  const northAirGate = addNode('air_n_gate', -1750, -1400);
  const northAirCorner = addNode('air_n_corner', -1870, -1400);
  const northAirTerm = addNode('air_n_term', -1870, -1620);
  link(northWestRoad, northAirGate);
  link(northAirGate, northAirCorner);
  link(northAirCorner, northAirTerm);

  // Marina dock node on South Island east coast
  const southEastRoad = byKey.get('s_4_1')!; // (1400, 1400)
  const marinaRoad = addNode('marina_road', 1680, 1400);
  const marinaGate = addNode('marina_gate', 1680, 1750);
  const marinaDock = addNode('marina_dock', 1785, 1750);
  link(southEastRoad, marinaRoad);
  link(marinaRoad, marinaGate);
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
 * Computes a bright-blue GTA GPS polyline along real streets, airports & the Grand Over-Water Highway Bridge using A*.
 */
export function computeGpsRoute(x1: number, z1: number, x2: number, z2: number): Array<{ x: number; z: number }> {
  if (Math.hypot(x2 - x1, z2 - z1) < 90) {
    return [
      { x: x1, z: z1 },
      { x: x2, z: z2 },
    ];
  }

  const destOnIsland = SAFEHOUSE_ISLANDS.some((isl) => Math.hypot(x2 - isl.cx, z2 - isl.cz) < 250);
  const srcOnIsland = SAFEHOUSE_ISLANDS.some((isl) => Math.hypot(x1 - isl.cx, z1 - isl.cz) < 250);
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
  const fScore = new Map<string, number>([
    [startNode.id, Math.hypot(goalNode.x - startNode.x, goalNode.z - startNode.z)],
  ]);

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
    if (!curId || curId === goalNode.id) break;

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
    if (Math.hypot(n.x - last.x, n.z - last.z) > 12) {
      pts.push({ x: n.x, z: n.z });
    }
  }
  const endLast = pts[pts.length - 1];
  if (Math.hypot(x2 - endLast.x, z2 - endLast.z) > 8) {
    pts.push({ x: x2, z: z2 });
  }
  return pts;
}

export const CENTRAL_PARK = {
  cx: 350,
  cz: 1750,
  w: 160,
  d: 160,
  fountainX: 350,
  fountainZ: 1715,
  playgroundX: 350,
  playgroundZ: 1785,
};

// Relative to Burger Shot Diner at (350, 1050)
export const BURGER_SHOT_STATIONS = {
  grill: { x: 347.5, z: 1044.8, label: 'Flat-Top Grill' },
  assembly: { x: 351.5, z: 1046.0, label: 'Burger Assembly Table' },
  counter: { x: 348.8, z: 1048.8, label: 'Customer Pickup Counter' },
};

export const HERO_INTERIORS: InteriorInfo[] = [
  // ─── SOUTH ISLAND: VICE DOWNTOWN (5x Anchors, Human-Scale Interiors) ────────
  {
    id: 'int_jason_house',
    name: "Jason's Villa (Ocean View)",
    district: 'Vice Downtown',
    kind: 'safehouse',
    x: 1050,
    z: 1050,
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
    x: 350,
    z: 1050,
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
    x: -350,
    z: 1050,
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
    x: 350,
    z: 525,
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
    x: -350,
    z: 525,
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
    x: 1050,
    z: 525,
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
    x: -1050,
    z: 1050,
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
    x: 1050,
    z: 1750,
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
    x: -350,
    z: 1750,
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
    x: -1050,
    z: 1750,
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
    x: 1050,
    z: 2400,
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
    x: 1580,
    z: 525,
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
    x: 1580,
    z: 1050,
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
    x: 1620,
    z: 1750,
    width: 18,
    depth: 14,
    hasRegister: false,
    robbedCooldown: 0,
    hasCCTV: false,
    cctvWiped: false,
    hasATM: false,
    activityId: 'act_scuba',
  },
  {
    id: 'int_airport_south',
    name: 'South Vice International Terminal',
    district: 'South Vice Airport',
    kind: 'airport',
    x: -1870,
    z: 1340,
    width: 30,
    depth: 18,
    hasRegister: false,
    robbedCooldown: 0,
    hasCCTV: true,
    cctvWiped: false,
    hasATM: true,
  },

  // ─── NORTH ISLAND: NORTHPORT, PALETO SUBURBS & NORTH AIRPORT ─────────────────
  {
    id: 'int_gunshop_north',
    name: 'Northport Armory Gun Shop',
    district: 'Northport',
    kind: 'gunshop',
    x: -350,
    z: -1050,
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
    x: 1050,
    z: -1050,
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
    x: 350,
    z: -1050,
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
    x: -1050,
    z: -1050,
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
    x: -350,
    z: -525,
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
    x: 350,
    z: -525,
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
    x: -1050,
    z: -1750,
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
    x: 1050,
    z: -1750,
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
    name: 'Paleto Ranger & Bait Outpost',
    district: 'Paleto Suburbs',
    kind: 'storefront',
    x: 350,
    z: -2320,
    width: 16,
    depth: 14,
    hasRegister: true,
    robbedCooldown: 0,
    hasCCTV: false,
    cctvWiped: false,
    hasATM: false,
  },
  {
    id: 'int_airport_north',
    name: 'Northport International Terminal',
    district: 'Northport Airport',
    kind: 'airport',
    x: -1870,
    z: -1340,
    width: 30,
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
    x: 2650,
    z: 1060,
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
    x: 2650,
    z: -1060,
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
  { id: 'seat_home_sofa1', x: 1042.2, y: LAND_Y + 0.46, z: 1047.5, yaw: 0, label: 'Villa L-Sofa (Left)', venue: 'home' },
  { id: 'seat_home_sofa2', x: 1044.0, y: LAND_Y + 0.46, z: 1047.5, yaw: 0, label: 'Villa L-Sofa (Right)', venue: 'home' },
  { id: 'seat_home_patio', x: 1039.5, y: LAND_Y + 0.46, z: 1063.5, yaw: Math.PI, label: 'Villa Garden Patio', venue: 'home' },
  { id: 'seat_coffee_1', x: 1047.5, y: LAND_Y + 0.46, z: 527.0, yaw: Math.PI / 2, label: 'Coffee Booth Seat A', venue: 'coffee' },
  { id: 'seat_coffee_2', x: 1050.5, y: LAND_Y + 0.46, z: 527.0, yaw: -Math.PI / 2, label: 'Coffee Booth Seat B', venue: 'coffee' },
  { id: 'seat_bar_stool1', x: -1052.0, y: LAND_Y + 0.62, z: 1048.4, yaw: Math.PI, label: 'Beer Bar Stool 1', venue: 'bar' },
  { id: 'seat_bar_stool2', x: -1050.0, y: LAND_Y + 0.62, z: 1048.4, yaw: Math.PI, label: 'Beer Bar Stool 2', venue: 'bar' },
  { id: 'seat_bar_booth', x: -1045.5, y: LAND_Y + 0.46, z: 1052.5, yaw: -Math.PI / 2, label: 'VIP Lounge Booth', venue: 'bar' },
  { id: 'seat_bar2_stool', x: 1048.5, y: LAND_Y + 0.62, z: -1751.8, yaw: Math.PI, label: 'Jack of Hearts Stool', venue: 'bar' },
  { id: 'seat_burger_booth1', x: 344.8, y: LAND_Y + 0.46, z: 1052.5, yaw: 0, label: 'Burger Shot Booth 1', venue: 'burger' },
  { id: 'seat_burger_booth2', x: 344.8, y: LAND_Y + 0.46, z: 1055.2, yaw: Math.PI, label: 'Burger Shot Booth 2', venue: 'burger' },
  { id: 'seat_park_1', x: 340.5, y: LAND_Y + 0.46, z: 1715.0, yaw: Math.PI / 2, label: 'Garden Bench (West)', venue: 'park' },
  { id: 'seat_park_2', x: 359.5, y: LAND_Y + 0.46, z: 1715.0, yaw: -Math.PI / 2, label: 'Garden Bench (East)', venue: 'park' },
  { id: 'seat_park_3', x: 350.0, y: LAND_Y + 0.46, z: 1706.5, yaw: 0, label: 'Garden Bench (North)', venue: 'park' },
  { id: 'seat_park_4', x: 342.0, y: LAND_Y + 0.46, z: 1776.0, yaw: 0, label: 'Playground Parent Bench', venue: 'park' },
];

export const STREET_STALLS: StreetStallSpot[] = [
  { id: 'stall_burger_beach', name: 'Burger Shot Coastal Stall', kind: 'burger', x: 1580, z: 820, yaw: 0 },
  { id: 'stall_fruit_park', name: 'Central Park Mango & Smoothie Stall', kind: 'fruit', x: 300, z: 1690, yaw: Math.PI / 4 },
  { id: 'stall_burger_north', name: 'Northport Open Market Grill', kind: 'burger', x: 190, z: -860, yaw: 0 },
  { id: 'stall_merch_north', name: 'Northport Vinyl & Gear Stall', kind: 'merch', x: -860, z: -860, yaw: Math.PI },
];

export const GAS_STATIONS: GasStationSpot[] = [
  { id: 'gas_1', name: 'Ron Petrol & EV Hub (Vice Downtown)', x: 860, z: 860, isEV: true },
  { id: 'gas_2', name: 'Downtown Charge & Fuel', x: -180, z: 860, isEV: true },
  { id: 'gas_3', name: 'Northport Highway Fuel & EV', x: -180, z: -860, isEV: true },
  { id: 'gas_4', name: 'South Airport AvGas Depot', x: -1795, z: 1325, isEV: true },
  { id: 'gas_5', name: 'North Airport AvGas Depot', x: -1795, z: -1325, isEV: true },
];

export const FENCE_SPOTS: FenceSpot[] = [
  { id: 'fence_1', name: 'Northport Chop Shop & GPS Wipe', x: -1220, z: -880 },
  { id: 'fence_2', name: 'Port Vice Dock Fence', x: 1280, z: 1860 },
];

export const DELIVERY_TARGETS = [
  { customerName: 'Marco (Ocean View Villa)', x: 1068, z: 1070 },
  { customerName: 'Sofia (Central Park Fountain)', x: 350, z: 1705 },
  { customerName: 'Rico (Neon Anchor Bar)', x: -1050, z: 1032 },
  { customerName: 'Camila (Vice Galleria Entrance)', x: -1050, z: 1728 },
  { customerName: 'Darius (Northport Dealership)', x: 350, z: -1030 },
  { customerName: 'Elena (Paleto Suburbs Outpost)', x: 350, z: -2300 },
];

export const INITIAL_STOCKS: StockAsset[] = [
  { symbol: 'VICE', name: 'Vice Shore Holdings', price: 142.5, changePct: 2.4, sharesOwned: 0 },
  { symbol: 'BSHOT', name: 'Burger Shot Corp', price: 68.2, changePct: 1.1, sharesOwned: 0 },
  { symbol: 'AMMO', name: 'Ammu-Nation Leonida', price: 215.0, changePct: -0.8, sharesOwned: 0 },
  { symbol: 'VLIFE', name: 'ViceLife Luxury', price: 310.4, changePct: 3.2, sharesOwned: 0 },
  { symbol: 'LCOIN', name: 'Leonida Coin (Crypto)', price: 94.0, changePct: 5.6, sharesOwned: 0 },
];

export const INITIAL_BUSINESSES: BusinessProperty[] = [
  { id: 'biz_carwash', name: 'Vice Shine Car Wash', kind: 'carwash', district: 'Northport', x: -860, z: -525, cost: 4500, owned: false, dailyIncome: 450 },
  { id: 'biz_nightclub', name: 'Club Malibu Neon (Front)', kind: 'nightclub', district: 'Ocean Drive', x: 1580, z: 1050, cost: 12000, owned: false, dailyIncome: 1100 },
  { id: 'biz_bungalow_paradise', name: 'Paradise Key Luxury Bungalow', kind: 'bungalow', district: 'Paradise Key', x: 2650, z: 1060, cost: 18500, owned: false, dailyIncome: 1650 },
  { id: 'biz_bungalow_starlight', name: 'Starlight Atoll Luxury Estate', kind: 'bungalow', district: 'Starlight Atoll', x: 2650, z: -1060, cost: 28000, owned: false, dailyIncome: 2500 },
];

export const CITY_JOBS: JobDef[] = [
  {
    id: 'job_burger_diner',
    name: 'Burger Shot Diner (Physical Shift & Delivery)',
    role: 'Kitchen Crew & Scooter Rider',
    district: 'Vice Downtown',
    x: 350,
    z: 1050,
    pay: 30,
    description: 'Walk inside Burger Shot Diner to cook patties, assemble & serve ($15–$35) or deliver ($40–$80).',
  },
  {
    id: 'job_burger_beach',
    name: 'Burger Shot Coastal Stall',
    role: 'Grill Cook & Cashier',
    district: 'Ocean Drive',
    x: 1580,
    z: 820,
    pay: 28,
    description: 'Flip Vice Burgers & serve beach customers at Burger Shot Stall.',
  },
  {
    id: 'job_burger_north',
    name: 'Northport Market Grill',
    role: 'Street Vendor',
    district: 'Northport',
    x: 190,
    z: -860,
    pay: 32,
    description: 'Cook rush-hour street orders across the Grand Highway Bridge.',
  },
  {
    id: 'job_taxi_downtown',
    name: 'Vice Cab Fare Run',
    role: 'City Driver',
    district: 'Vice Downtown',
    x: TAXI_STAND.x,
    z: TAXI_STAND.z,
    pay: 55,
    description: 'Pick up VIP fares from the Taxi Stand across Vice Downtown & Northport.',
  },
  {
    id: 'job_airport_cargo',
    name: 'South Vice Air Freight Run',
    role: 'Ramp & Pilot Crew',
    district: 'South Vice Airport',
    x: -1870,
    z: 1340,
    pay: 85,
    description: 'Load cargo & prep charter flights between South Vice & Northport Airports.',
  },
];

/**
 * Strict road-corridor, water-shoreline, park, fenced-airport, and landmark bounding-box collision check.
 * Guarantees NO procedural building, bungalow, or tree ever overlaps asphalt, airport fences/runways, or water.
 */
export function isTooCloseToRoadOrWater(bx: number, bz: number, halfW: number, halfD: number): boolean {
  for (const seg of ROAD_SEGMENTS) {
    const segMinX = Math.min(seg.x1, seg.x2) - seg.width / 2 - 7;
    const segMaxX = Math.max(seg.x1, seg.x2) + seg.width / 2 + 7;
    const segMinZ = Math.min(seg.z1, seg.z2) - seg.width / 2 - 7;
    const segMaxZ = Math.max(seg.z1, seg.z2) + seg.width / 2 + 7;
    if (bx + halfW > segMinX && bx - halfW < segMaxX && bz + halfD > segMinZ && bz - halfD < segMaxZ) {
      return true;
    }
  }

  for (const br of BRIDGES) {
    const bw = br.axis === 'z' ? br.width / 2 + 8 : br.length / 2 + 8;
    const bd = br.axis === 'z' ? br.length / 2 + 8 : br.width / 2 + 8;
    if (Math.abs(bx - br.cx) < halfW + bw && Math.abs(bz - br.cz) < halfD + bd) {
      return true;
    }
  }

  // Entire fenced interior of BOTH airports is reserved for tarmac, runways, helipads, towers & terminals
  for (const az of AIRPORT_ZONES) {
    if (
      bx + halfW > az.fenceMinX - 8 &&
      bx - halfW < az.fenceMaxX + 8 &&
      bz + halfD > az.fenceMinZ - 8 &&
      bz - halfD < az.fenceMaxZ + 8
    ) {
      return true;
    }
  }

  // Central Park boundary clearance
  if (
    Math.abs(bx - CENTRAL_PARK.cx) < CENTRAL_PARK.w / 2 + halfW + 8 &&
    Math.abs(bz - CENTRAL_PARK.cz) < CENTRAL_PARK.d / 2 + halfD + 8
  ) {
    return true;
  }

  // Taxi Stand clearance
  if (Math.abs(bx - TAXI_STAND.x) < 22 + halfW && Math.abs(bz - TAXI_STAND.z) < 22 + halfD) {
    return true;
  }

  // Ocean & Shoreline margin
  const corners: Array<[number, number]> = [
    [bx, bz],
    [bx - halfW - 10, bz - halfD - 10],
    [bx + halfW + 10, bz - halfD - 10],
    [bx - halfW - 10, bz + halfD + 10],
    [bx + halfW + 10, bz + halfD + 10],
  ];
  for (const [cx, cz] of corners) {
    if (getWaterShoreDistance(cx, cz) > -8.5) return true;
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
    } else if (hInt.district === 'Paleto Suburbs' || hInt.kind === 'boathouse') {
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
          ? 24
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
  // 5x Scale City Districts: spaced generously to keep draw calls optimal (~320 buildings across 5x area)
  const blockXCenters = [-1050, -350, 350, 1050, 1550];
  const blockZCenters = [-2320, -1750, -1050, -525, 525, 1050, 1750, 2380];

  for (const blockCx of blockXCenters) {
    for (const blockCz of blockZCenters) {
      if (Math.abs(blockCx - CENTRAL_PARK.cx) < 120 && Math.abs(blockCz - CENTRAL_PARK.cz) < 120) continue;

      const isPaletoSuburbs = blockCz < -2150;
      const isNorthport = blockCz < 0;
      const isOceanDrive = blockCx > 1400 && blockCz > 0;

      const offsets = isPaletoSuburbs
        ? [
            [-140, -60],
            [0, 50],
            [140, -40],
          ]
        : [
            [-240, -210],
            [-95, -210],
            [95, -210],
            [240, -210],
            [-240, -75],
            [-95, -75],
            [95, -75],
            [240, -75],
            [-240, 75],
            [-95, 75],
            [95, 75],
            [240, 75],
            [-240, 210],
            [-95, 210],
            [95, 210],
            [240, 210],
          ];

      for (const [ox, oz] of offsets) {
        const bx = blockCx + ox;
        const bz = blockCz + oz;
        const seed = Math.abs(Math.sin((idx + 1) * 12.9898 + bx * 0.041 + bz * 0.067) * 43758.5453) % 1;
        if (isPaletoSuburbs && seed > 0.58) continue;

        const w = isNorthport ? 28 + seed * 14 : 34 + seed * 16;
        const d = isNorthport ? 24 + (1 - seed) * 12 : 30 + (1 - seed) * 14;

        if (isTooCloseToRoadOrWater(bx, bz, w / 2, d / 2)) continue;

        const overlapsHero = HERO_INTERIORS.some(
          (hi) => Math.abs(hi.x - bx) < hi.width / 2 + w / 2 + 16 && Math.abs(hi.z - bz) < hi.depth / 2 + d / 2 + 16
        );
        const overlapsGas = GAS_STATIONS.some((g) => Math.abs(g.x - bx) < 34 && Math.abs(g.z - bz) < 34);
        const overlapsFence = FENCE_SPOTS.some((f) => Math.abs(f.x - bx) < 32 && Math.abs(f.z - bz) < 32);
        const overlapsStall = STREET_STALLS.some((st) => Math.abs(st.x - bx) < 28 && Math.abs(st.z - bz) < 28);
        const overlapsExisting = buildings.some(
          (b) => Math.abs(b.x - bx) < b.w / 2 + w / 2 + 14 && Math.abs(b.z - bz) < b.d / 2 + d / 2 + 14
        );
        if (overlapsHero || overlapsGas || overlapsFence || overlapsStall || overlapsExisting) continue;

        idx++;
        const district = getDistrictAt(bx, bz);
        let archStyle: BuildingArchStyle = 'brick_shop';
        let h = 14 + Math.floor(seed * 16);
        let color = brickPalette[idx % brickPalette.length];

        if (isPaletoSuburbs) {
          archStyle = idx % 2 === 0 ? 'suburban_house' : 'cabin_warehouse';
          h = 7.2 + Math.floor(seed * 3.5);
          color = archStyle === 'suburban_house' ? suburbPalette[idx % suburbPalette.length] : 0x6b4423;
        } else if (!isNorthport && !isOceanDrive && Math.abs(bx) < 1280) {
          archStyle = seed > 0.25 ? 'glass_tower' : 'art_deco';
          h = 34 + Math.floor(seed * 68);
          color = archStyle === 'glass_tower' ? towerPalette[idx % towerPalette.length] : decoPalette[idx % decoPalette.length];
        } else if (isOceanDrive) {
          archStyle = 'art_deco';
          h = 16 + Math.floor(seed * 24);
          color = decoPalette[idx % decoPalette.length];
        } else if (isNorthport) {
          archStyle = idx % 3 === 0 ? 'cabin_warehouse' : idx % 2 === 0 ? 'suburban_house' : 'brick_shop';
          h = archStyle === 'suburban_house' ? 7.5 + seed * 3.2 : 12 + seed * 12;
          color =
            archStyle === 'suburban_house'
              ? suburbPalette[idx % suburbPalette.length]
              : archStyle === 'cabin_warehouse'
              ? 0x475569
              : brickPalette[idx % brickPalette.length];
        }

        const isCoreEnterable = Math.abs(bx) < 1450 && idx % 6 === 0;
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

  // ─── Trees (Strictly checked against roads, buildings, airports & water!) ──
  let treeId = 0;
  const tryPushTree = (x: number, z: number, species: TreeSpecies, scale = 1.0) => {
    if (isTooCloseToRoadOrWater(x, z, 3.0, 3.0)) return;
    if (buildings.some((b) => Math.abs(b.x - x) < b.w / 2 + 5 && Math.abs(b.z - z) < b.d / 2 + 5)) return;
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
  for (let z = 480; z <= 2550; z += 95) {
    tryPushTree(1715, z, 'palm', 1.15);
  }
  // Ocean Channel Shore Palms
  for (let x = -1550; x <= 1550; x += 140) {
    tryPushTree(x, -425, 'palm', 1.05);
    tryPushTree(x, 425, 'palm', 1.05);
  }
  // Central Park Trees
  const parkTrees: Array<[number, number, TreeSpecies]> = [
    [295, 1690, 'oak'],
    [405, 1690, 'palm'],
    [295, 1810, 'palm'],
    [405, 1810, 'oak'],
    [295, 1750, 'oak'],
    [405, 1750, 'oak'],
  ];
  for (const [px, pz, sp] of parkTrees) {
    weakTrees.push({
      id: `tree_${treeId++}`,
      x: px,
      z: pz,
      scale: 1.1,
      species: sp,
      intact: true,
      fallAngle: 0,
      fallDirX: 0,
      fallDirZ: 1,
    });
  }

  // Paleto Suburbs Pine & Oak Forest (z in [-2610 .. -2190])
  for (let fx = -1550; fx <= 1550; fx += 145) {
    for (let fz = -2600; fz <= -2200; fz += 125) {
      const hash = Math.abs(Math.sin(fx * 0.037 + fz * 0.089) * 1000) % 1;
      if (hash > 0.62) continue;
      tryPushTree(fx + (hash - 0.3) * 24, fz + (hash - 0.3) * 24, hash > 0.3 ? 'pine' : 'oak', 1.0 + hash * 0.45);
    }
  }

  // Major Boulevard & Neighborhood Street Palms / Oaks (close to player & skyline!)
  for (const rx of [-700, -525, 0, 175, 525, 700, 1225, 1660]) {
    const isPalmBlvd = rx === 0 || rx === 1660 || rx === 1225 || rx === 525;
    for (let z = 480; z <= 2520; z += 90) {
      if (SOUTH_ROAD_Z.some((rz) => Math.abs(z - rz) < 32)) continue;
      if (Math.abs(z - 1090) < 24 || Math.abs(z - 552) < 24 || Math.abs(z - 1782) < 24) continue;
      tryPushTree(rx + 17, z, isPalmBlvd ? 'palm' : 'oak', 1.05);
      tryPushTree(rx - 17, z, isPalmBlvd ? 'palm' : 'oak', 1.05);
    }
    for (let z = -2380; z <= -480; z += 110) {
      if (NORTH_ROAD_Z.some((rz) => Math.abs(z - rz) < 32)) continue;
      if (Math.abs(z + 1082) < 24 || Math.abs(z + 555) < 24 || Math.abs(z + 1782) < 24) continue;
      tryPushTree(rx + 17, z, rx === 0 ? 'palm' : 'pine', 1.02);
    }
  }
  for (const rz of [552, 700, 1090, 1400, 1782, 2100]) {
    for (let x = -1320; x <= 1560; x += 115) {
      if (Math.abs(x - 350) < 95 && Math.abs(rz - 1782) < 40) continue;
      if (Math.abs(x - 1050) < 35 && Math.abs(rz - 1090) < 35) continue; // keep Jason's Villa driveway wide open
      if (Math.abs(x - 350) < 35 && Math.abs(rz - 1090) < 35) continue;
      tryPushTree(x, rz + 15.5, rz === 1090 || rz === 1400 ? 'palm' : 'oak', 1.0);
    }
  }

  // Safehouse Islands Tropical Palms around Paradise Key & Starlight Atoll
  for (const isl of SAFEHOUSE_ISLANDS) {
    const offsets: Array<[number, number]> = [
      [-110, -85],
      [110, -85],
      [-135, 35],
      [135, 35],
      [-75, 110],
      [75, 110],
    ];
    for (const [ox, oz] of offsets) {
      weakTrees.push({
        id: `tree_${treeId++}`,
        x: isl.cx + ox,
        z: isl.cz + oz,
        scale: 1.15,
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
      if (getWaterShoreDistance(rx + 18, rz + 18) > -3) continue;
      roadSigns.push({
        x: rx + 16,
        z: rz + 16,
        yaw: sIdx % 2 === 0 ? 0 : Math.PI / 2,
        color: signColors[sIdx++ % signColors.length],
      });

      if (rx >= -700 && rx <= 700 && (rz === 700 || rz === 1400 || rz === -700 || rz === -1400)) {
        trafficLights.push({ x: rx + 14.5, z: rz + 14.5, axis: 'ns' });
        trafficLights.push({ x: rx - 14.5, z: rz - 14.5, axis: 'ew' });
      }
    }
  }

  const billboardCoords: Array<[number, number, number]> = [
    [22, 920, Math.PI / 2],
    [-22, 1650, -Math.PI / 2],
    [22, -920, Math.PI / 2],
    [-22, -1650, -Math.PI / 2],
    [520, 676, 0],
    [-520, -676, Math.PI],
    [1180, 1376, 0],
    [-1180, -1376, Math.PI],
    [-1720, 1370, Math.PI / 2],
    [-1720, -1370, Math.PI / 2],
    [980, 1072, 0],
    [420, 1072, 0],
    [1202, 920, -Math.PI / 2],
    [198, 920, Math.PI / 2],
    [722, 1068, Math.PI / 2],
    [1640, 1180, -Math.PI / 2],
  ];
  billboardCoords.forEach(([x, z, yaw], i) => {
    if (!buildings.some((b) => Math.abs(b.x - x) < b.w / 2 + 6 && Math.abs(b.z - z) < b.d / 2 + 6)) {
      billboards.push({ x, z, yaw, adIdx: i % 4 });
    }
  });

  const busStopCoords: Array<[number, number, number]> = [
    [18, 1050, -Math.PI / 2],
    [-18, 1750, Math.PI / 2],
    [718, 1050, -Math.PI / 2],
    [18, -1050, -Math.PI / 2],
    [-682, -1050, Math.PI / 2],
  ];
  busStopCoords.forEach(([x, z, yaw]) => {
    busStops.push({ x, z, yaw });
  });

  const treasures: TreasureSpot[] = [
    { id: 'tr_1', x: 2050, y: -2.6, z: 220, found: false, value: 850 },
    { id: 'tr_2', x: 2180, y: -3.2, z: -180, found: false, value: 1100 },
    { id: 'tr_3', x: -620, y: -2.4, z: 0, found: false, value: 950 },
    { id: 'tr_4', x: 640, y: -2.5, z: -60, found: false, value: 1200 },
    { id: 'tr_5', x: 2350, y: -3.4, z: 600, found: false, value: 1800 },
  ];

  return { buildings, interiors, treasures, weakTrees, roadSigns, billboards, busStops, trafficLights };
}

export const SIDE_ACTIVITIES: ActivityDef[] = [
  { id: 'act_basketball', name: 'Ocean Beach Basketball', category: 'Sports', district: 'Ocean Drive', x: 1680, z: 880, statReward: 'stamina', description: 'Sink rhythm jump shots on the beachfront court.', completedCount: 0 },
  { id: 'act_tennis', name: 'Vice Country Club Tennis', category: 'Sports', district: 'Ocean Drive', x: 1680, z: 1220, statReward: 'focus', description: 'Time precision baseline rallies.', completedCount: 0 },
  { id: 'act_minigolf', name: 'Boardwalk Mini-Golf', category: 'Sports', district: 'Ocean Drive', x: 1680, z: 1550, statReward: 'focus', description: 'Line up the angle & power putt across Neon Palms.', completedCount: 0 },
  { id: 'act_pool', name: '8-Ball Pool', category: 'Nightlife & Chill', district: 'Vice Downtown', x: -1050, z: 1050, statReward: 'relationship', description: 'Play 8-ball pool together at Neon Anchor Beer Bar.', completedCount: 0 },
  { id: 'act_fishing', name: 'Vice Pier Fishing', category: 'Water & Wild', district: 'Vice Marina', x: 1820, z: 1750, statReward: 'focus', description: 'Cast off the marina pier & balance reel tension.', completedCount: 0 },
  { id: 'act_hunting', name: 'Paleto Suburbs Tracking', category: 'Water & Wild', district: 'Paleto Suburbs', x: 350, z: -2320, statReward: 'focus', description: 'Track & tag wild targets in Paleto Pine Woods.', completedCount: 0 },
  { id: 'act_scuba', name: 'Scuba Reef Treasure Hunt', category: 'Water & Wild', district: 'Vice Bay', x: 2050, z: 220, statReward: 'cash', description: 'Dive underwater to recover sunken cartel crates.', completedCount: 0 },
  { id: 'act_kayaking', name: 'Channel Kayaking', category: 'Water & Wild', district: 'Ocean Channel', x: 750, z: 0, statReward: 'stamina', description: 'Paddle through turquoise channel buoys.', completedCount: 0 },
  { id: 'act_wrestling', name: 'Northport Backyard Brawl', category: 'Combat & Crime', district: 'Northport', x: -1220, z: -880, statReward: 'muscle', description: 'Underground alley brawl — block, counter & slam.', completedCount: 0 },
  { id: 'act_gym', name: 'Vice Iron Bench & Bag', category: 'Sports', district: 'Vice Downtown', x: 1050, z: 2400, statReward: 'muscle', description: 'Pump iron to boost Muscle & intimidation.', completedCount: 0 },
  { id: 'act_range', name: 'Vice Armory Tactical Range', category: 'Combat & Crime', district: 'Vice Downtown', x: 350, z: 525, statReward: 'focus', description: 'Sharpen slow-motion Dead-Eye Focus.', completedCount: 0 },
  { id: 'act_arcade', name: 'Galleria Retro Arcade', category: 'Nightlife & Chill', district: 'Vice Downtown', x: -1050, z: 1750, statReward: 'focus', description: 'Beat the Neon Outrun high score.', completedCount: 0 },
  { id: 'act_yoga', name: 'Central Park Sunrise Yoga', category: 'Sports', district: 'Leonida Central Park', x: 350, z: 1715, statReward: 'stamina', description: 'Breath timing in Leonida Central Park.', completedCount: 0 },
  { id: 'act_jetski', name: 'Vice Bay Jet-Ski Sprint', category: 'Water & Wild', district: 'Vice Marina', x: 1840, z: 1750, statReward: 'stamina', description: 'Hit wave gates at top throttle.', completedCount: 0 },
  { id: 'act_streetrace', name: 'Grand Bridge Midnight Sprint', category: 'Combat & Crime', district: 'Grand Highway Bridge', x: 0, z: 480, statReward: 'cash', description: 'High-stakes bridge & boulevard sprint.', completedCount: 0 },
  { id: 'act_armwrestle', name: 'Diner Arm Wrestling', category: 'Sports', district: 'Northport', x: -1050, z: -1750, statReward: 'muscle', description: 'Rapid-power grip duel.', completedCount: 0 },
  { id: 'act_darts', name: 'Club Malibu Darts', category: 'Nightlife & Chill', district: 'Ocean Drive', x: 1580, z: 1050, statReward: 'focus', description: 'Nail bullseyes for cash & bond.', completedCount: 0 },
  { id: 'act_poker', name: 'High-Stakes Vice Poker', category: 'Nightlife & Chill', district: 'Vice Downtown', x: 1050, z: 1750, statReward: 'cash', description: 'Bluff & read the table in downtown VIP room.', completedCount: 0 },
  { id: 'act_bowling', name: 'Northport Lanes Bowling', category: 'Sports', district: 'Northport', x: -1050, z: -1050, statReward: 'relationship', description: 'Date-night strikes with Jason & Lucia.', completedCount: 0 },
  { id: 'act_surfing', name: 'Paradise Key Reef Surfing', category: 'Water & Wild', district: 'Paradise Key', x: 2450, z: 1100, statReward: 'stamina', description: 'Carve the swell balance meter.', completedCount: 0 },
  { id: 'act_parkour', name: 'Downtown Rooftop Parkour', category: 'Sports', district: 'Vice Downtown', x: -350, z: 1050, statReward: 'stamina', description: 'Vault neon AC units under the clock.', completedCount: 0 },
  { id: 'act_carmeet', name: 'Leonida Car Meet Showoff', category: 'Nightlife & Chill', district: 'Northport', x: 350, z: -1050, statReward: 'relationship', description: 'Rev engines, flash lights & drift donuts.', completedCount: 0 },
  { id: 'act_atm_skim', name: 'ATM Cyber Skimming', category: 'Combat & Crime', district: 'Vice Downtown', x: 1050, z: 1750, statReward: 'cash', description: 'Crack security pins without tripping alarms.', completedCount: 0 },
  { id: 'act_drone', name: 'Airport Tower Drone Recon', category: 'Combat & Crime', district: 'Northport Airport', x: -1870, z: -1340, statReward: 'focus', description: 'Scout cargo flights from control tower.', completedCount: 0 },
  { id: 'act_photo', name: 'Paleto Wildlife Safari', category: 'Water & Wild', district: 'Paleto Suburbs', x: -350, z: -2320, statReward: 'relationship', description: 'Snap rare deer, birds & forest wildlife.', completedCount: 0 },
  { id: 'act_gator', name: 'Bayou Gator Challenge', category: 'Water & Wild', district: 'Paleto Suburbs', x: -700, z: -2320, statReward: 'muscle', description: 'Spot and dodge stray gators in Paleto Suburbs.', completedCount: 0 },
  { id: 'act_karaoke', name: 'Northport Salsa & Karaoke', category: 'Nightlife & Chill', district: 'Northport', x: 1050, z: -1750, statReward: 'relationship', description: 'Sync beats with your partner.', completedCount: 0 },
  { id: 'act_delivery', name: 'Express Vice Courier', category: 'Combat & Crime', district: 'Northport', x: 190, z: -860, statReward: 'cash', description: 'No-damage high-speed parcel run.', completedCount: 0 },
  { id: 'act_boxing', name: 'Villa Home Gym Heavy Bag', category: 'Combat & Crime', district: 'Vice Downtown', x: 1060, z: 1055, statReward: 'muscle', description: 'Combo strike rhythm training at Jason’s Villa.', completedCount: 0 },
  { id: 'act_triathlon', name: 'Vice Boardwalk Triathlon', category: 'Sports', district: 'Ocean Drive', x: 1715, z: 950, statReward: 'stamina', description: 'Swim, sprint & cycle endurance test.', completedCount: 0 },
  { id: 'act_blackjack', name: 'Ocean Drive Blackjack', category: 'Nightlife & Chill', district: 'Ocean Drive', x: 1580, z: 1050, statReward: 'cash', description: 'Hit 21 without busting.', completedCount: 0 },
  { id: 'act_barber', name: 'Fresh Fade & Threads', category: 'Nightlife & Chill', district: 'Vice Downtown', x: -350, z: 525, statReward: 'relationship', description: 'Swap outfit & style to drop police heat.', completedCount: 0 },
];

export const INITIAL_SOCIAL_POSTS: SocialPost[] = [
  {
    id: 'soc_1',
    handle: '@ViceDriftKing',
    author: 'Marco_V8',
    district: 'Northport',
    caption: 'LIVE: Cross the Grand Leonida Bridge! Vice Exotic Motors in Northport just stocked Sport Bikes, Trucks & hypercars!',
    isLive: true,
    viewers: 4820,
    likes: 12900,
    eventKind: 'takeover',
    x: 350,
    z: -1050,
    timeAgo: 'LIVE NOW',
    visited: false,
  },
  {
    id: 'soc_2',
    handle: '@LeonidaAviation',
    author: 'Pilot_Kira',
    district: 'South Vice Airport',
    caption: 'Commercial charters ($150) departing South Vice & Northport Airports! Stunt planes & choppers on both runways!',
    isLive: true,
    viewers: 3110,
    likes: 9400,
    eventKind: 'chase',
    x: -1850,
    z: 1365,
    timeAgo: 'LIVE NOW',
    visited: false,
  },
  {
    id: 'soc_3',
    handle: '@DowntownAlert305',
    author: 'ViceScanner',
    district: 'Vice Downtown',
    caption: 'Burger Shot Diner serving fresh Vice Burgers ($15) & hiring Delivery Scooty Riders ($40-$80/drop)!',
    isLive: true,
    viewers: 6190,
    likes: 15200,
    eventKind: 'armored',
    x: 350,
    z: 1050,
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
    x: 2650,
    z: 1060,
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
    x: 350,
    z: 1750,
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
    targetX: 1580,
    targetZ: 525,
    rewardCash: 1650,
    rewardBond: 12,
    stage: 'available',
    objectiveText: 'Bring Lucia & hit 24/7 Ocean Mart on Ocean Drive, rob & wipe CCTV.',
  },
  {
    id: 'mis_2',
    title: 'Bridge Run: Northport Exotic Boost',
    giver: 'Uncle Jack (Fence)',
    district: 'Northport',
    summary: 'Cross the Grand Leonida Highway Bridge into Northport, steal a Luxury Exotic and deliver to the Chop Shop Fence.',
    duoRecommended: false,
    targetX: -1220,
    targetZ: -880,
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
    targetX: -350,
    targetZ: 1750,
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
    targetX: 2050,
    targetZ: 220,
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
    targetX: 1050,
    targetZ: 1750,
    rewardCash: 12000,
    rewardBond: 25,
    stage: 'available',
    objectiveText: 'Storm Leonida Reserve Bank, clean the vault & escape Vice PD!',
  },
  {
    id: 'mis_6',
    title: 'Airport Cargo Smuggling',
    giver: 'Kira (Pilot)',
    district: 'South Vice Airport',
    summary: 'Enter the Security Gate at South Vice Airport, board an airplane or charter flight, and touch down at Northport Airport!',
    duoRecommended: false,
    targetX: -1870,
    targetZ: -1340,
    rewardCash: 5500,
    rewardBond: 12,
    stage: 'available',
    objectiveText: 'Fly a plane or charter ticket from South Vice Airport to Northport Airport.',
  },
  {
    id: 'mis_7',
    title: 'Highway Truck Hijack',
    giver: 'Uncle Jack (Fence)',
    district: 'Grand Highway Bridge',
    summary: 'Commandeer a heavy Cargo Truck and haul its trailer load safely to the Port Vice Dock Fence!',
    duoRecommended: false,
    targetX: 1280,
    targetZ: 1860,
    rewardCash: 4200,
    rewardBond: 10,
    stage: 'available',
    objectiveText: 'Hijack any Cargo Truck and drive it to Port Vice Dock Fence.',
  },
  {
    id: 'mis_8',
    title: 'Midnight Street Bike Race',
    giver: 'Marco_V8',
    district: 'Vice Downtown',
    summary: 'Hop on a Sport Bike and tear across the Grand Leonida Highway Bridge into Northport Exotic Motors!',
    duoRecommended: false,
    targetX: 350,
    targetZ: -1050,
    rewardCash: 3800,
    rewardBond: 12,
    stage: 'available',
    objectiveText: 'Ride a Sport Bike to Vice Exotic Motors in Northport.',
  },
  {
    id: 'mis_9',
    title: 'VIP Taxi Escort',
    giver: 'Vice Cab Dispatch',
    district: 'Vice Downtown',
    summary: 'Book a Smart Phone Taxi or drive a Cab to pick up & complete a paid VIP drop at Leonida Reserve Bank.',
    duoRecommended: true,
    targetX: 1050,
    targetZ: 1750,
    rewardCash: 2400,
    rewardBond: 15,
    stage: 'available',
    objectiveText: 'Take or drive a Taxi to Leonida Reserve Bank and pay the fare cleanly.',
  },
];

export function getDistrictAt(x: number, z: number): string {
  if (getBridgeDeckInfo(x, z).onBridge) return 'Grand Highway Bridge';
  if (Math.hypot(x - 2650, z - 1100) < 250) return 'Paradise Key';
  if (Math.hypot(x - 2650, z + 1100) < 250) return 'Starlight Atoll';
  if (isWaterChannel(x, z)) {
    return Math.abs(z) <= 380 && x < 1850 && x > -1850 ? 'Ocean Channel' : 'Vice Bay (Ocean)';
  }
  if (x <= -1750 && z > 1000) return 'South Vice Airport';
  if (x <= -1750 && z < -1000) return 'Northport Airport';
  if (z < -2150) return 'Paleto Suburbs';
  if (z < -360) return 'Northport';
  if (Math.abs(x - CENTRAL_PARK.cx) <= CENTRAL_PARK.w / 2 && Math.abs(z - CENTRAL_PARK.cz) <= CENTRAL_PARK.d / 2) {
    return 'Leonida Central Park';
  }
  if (x > 1480 && z > 1500) return 'Vice Marina';
  if (x > 1420) return 'Ocean Drive';
  return 'Vice Downtown';
}
