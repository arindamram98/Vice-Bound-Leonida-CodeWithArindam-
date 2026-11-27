import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Car, Compass, MapPin, Navigation, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import {
  AIRPORT_ZONES,
  BRIDGES,
  CENTRAL_PARK,
  CITY_JOBS,
  FENCE_SPOTS,
  GAS_STATIONS,
  NORTH_ISLAND,
  ROAD_SEGMENTS,
  SAFEHOUSE_ISLANDS,
  SOUTH_ISLAND,
  STREET_STALLS,
  TAXI_STAND,
  WOODEN_DOCKS,
} from '../game/worldData';
import { HudSnapshot } from '../game/types';

interface MapModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onSetWaypoint: (x: number, z: number, label: string) => void;
  onBookTaxi: (x: number, z: number, label: string) => void;
}

const WORLD_MIN_X = -2680;
const WORLD_MAX_X = 2980;
const WORLD_MIN_Z = -2780;
const WORLD_MAX_Z = 2780;

type MapCategory = 'All' | 'Shops & Guns' | 'Heists & Crime' | 'Jobs & Chill' | 'Safehouses' | 'Services';

interface LandmarkItem {
  name: string;
  district: string;
  x: number;
  z: number;
  color: string;
  tag: string;
  category: Exclude<MapCategory, 'All'>;
  taxiAccessible?: boolean;
}

const LANDMARKS: LandmarkItem[] = [
  { name: "Jason's Villa (Home, Bed & Gym)", district: 'Vice Downtown', x: 1050, z: 1050, color: '#ec4899', tag: 'HOME', category: 'Safehouses', taxiAccessible: true },
  { name: 'Paradise Key Tropical Bungalow', district: 'Paradise Key Island', x: 2650, z: 1060, color: '#38bdf8', tag: 'ISLAND', category: 'Safehouses', taxiAccessible: false },
  { name: 'Starlight Atoll Luxury Estate', district: 'Starlight Atoll Island', x: 2650, z: -1060, color: '#f43f5e', tag: 'ISLAND', category: 'Safehouses', taxiAccessible: false },
  { name: 'Grand Leonida Highway Bridge', district: 'Ocean Channel', x: 0, z: 0, color: '#94a3b8', tag: 'BRIDGE', category: 'Services', taxiAccessible: true },
  { name: 'Vice Downtown Taxi Stand', district: 'Vice Downtown', x: TAXI_STAND.x, z: TAXI_STAND.z, color: '#facc15', tag: 'TAXI', category: 'Services', taxiAccessible: true },
  { name: 'Vice Armory Gun Shop', district: 'Vice Downtown', x: 350, z: 525, color: '#f97316', tag: 'GUNS', category: 'Shops & Guns', taxiAccessible: true },
  { name: 'Northport Tactical Armory', district: 'Northport', x: -350, z: -1050, color: '#f97316', tag: 'GUNS', category: 'Shops & Guns', taxiAccessible: true },
  { name: 'Vice Threads Boutique (Clothes)', district: 'Vice Downtown', x: -350, z: 525, color: '#f472b6', tag: 'CLOTHES', category: 'Shops & Guns', taxiAccessible: true },
  { name: 'Northport Threads Boutique', district: 'Northport', x: 1050, z: -1050, color: '#f472b6', tag: 'CLOTHES', category: 'Shops & Guns', taxiAccessible: true },
  { name: 'Vice Exotic Motors & Mod Shop', district: 'Northport', x: 350, z: -1050, color: '#38bdf8', tag: 'CARS', category: 'Shops & Guns', taxiAccessible: true },
  { name: 'Northport Harbor Marketplace', district: 'Northport', x: 350, z: -525, color: '#eab308', tag: 'MARKET', category: 'Shops & Guns', taxiAccessible: true },
  { name: 'Burger Shot Diner (Career & Food)', district: 'Vice Downtown', x: 350, z: 1050, color: '#fb923c', tag: 'CAREER', category: 'Jobs & Chill', taxiAccessible: true },
  { name: 'Leonida Reserve Bank (ATM & Vault)', district: 'Vice Downtown', x: 1050, z: 1750, color: '#22c55e', tag: 'BANK', category: 'Heists & Crime', taxiAccessible: true },
  { name: 'Vangelico Vice Jewelry', district: 'Vice Downtown', x: -350, z: 1750, color: '#f43f5e', tag: 'HEIST', category: 'Heists & Crime', taxiAccessible: true },
  { name: 'Uncle Jack Pawn & Fence', district: 'Northport', x: -1050, z: -1050, color: '#f59e0b', tag: 'FENCE', category: 'Heists & Crime', taxiAccessible: true },
  { name: 'Leonida Central Park & Garden', district: 'Vice Downtown', x: 350, z: 1750, color: '#22c55e', tag: 'PARK', category: 'Jobs & Chill', taxiAccessible: true },
  { name: 'Vice Roast Coffee Shop', district: 'Vice Downtown', x: 1050, z: 525, color: '#f59e0b', tag: 'COFFEE', category: 'Jobs & Chill', taxiAccessible: true },
  { name: 'Neon Anchor Beer Bar', district: 'Vice Downtown', x: -1050, z: 1050, color: '#a855f7', tag: 'BAR', category: 'Jobs & Chill', taxiAccessible: true },
  { name: 'Jack of Hearts Bar', district: 'Northport', x: 1050, z: -1750, color: '#a855f7', tag: 'BAR', category: 'Jobs & Chill', taxiAccessible: true },
  { name: 'Vice Iron Gym', district: 'Vice Downtown', x: 1050, z: 2400, color: '#fb7185', tag: 'GYM', category: 'Jobs & Chill', taxiAccessible: true },
  { name: 'Paleto Ranger & Bait Outpost', district: 'Paleto Suburbs', x: 350, z: -2320, color: '#22c55e', tag: 'PALETO', category: 'Jobs & Chill', taxiAccessible: true },
  { name: 'Vice PD Central Precinct', district: 'Vice Downtown', x: -350, z: 1050, color: '#3b82f6', tag: 'POLICE', category: 'Services', taxiAccessible: true },
  { name: 'South Vice International Airport', district: 'South Vice Airport', x: -1850, z: 1365, color: '#38bdf8', tag: 'AIR-S', category: 'Services', taxiAccessible: true },
  { name: 'Northport International Airport', district: 'Northport Airport', x: -1850, z: -1365, color: '#38bdf8', tag: 'AIR-N', category: 'Services', taxiAccessible: true },
  { name: 'Port Vice Marina & Speedboats', district: 'Vice Marina', x: 1620, z: 1750, color: '#06b6d4', tag: 'BOATS', category: 'Services', taxiAccessible: true },
];

const CATEGORIES: MapCategory[] = ['All', 'Shops & Guns', 'Heists & Crime', 'Jobs & Chill', 'Safehouses', 'Services'];

export const MapModal: React.FC<MapModalProps> = ({ hud, onClose, onSetWaypoint, onBookTaxi }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const player = hud.protagonists[hud.activeId];

  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({ w: 900, h: 640 });
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [filter, setFilter] = useState<MapCategory>('All');
  const [selectedPin, setSelectedPin] = useState<{ x: number; z: number; label: string } | null>(hud.waypoint);

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const movedDuringGestureRef = useRef(false);
  const prevPinchDistRef = useRef<number | null>(null);
  const prevCenterRef = useRef<{ x: number; y: number } | null>(null);

  const clampPan = (px: number, py: number, z: number, w: number, h: number) => {
    const maxX = ((z - 1) * w) / 2 + 180;
    const maxY = ((z - 1) * h) / 2 + 180;
    return {
      x: Math.max(-maxX, Math.min(maxX, px)),
      y: Math.max(-maxY, Math.min(maxY, py)),
    };
  };

  // ResizeObserver so canvas always fills 100% of available map area on phones & desktops
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const sync = () => {
      const w = Math.max(280, Math.floor(el.clientWidth));
      const h = Math.max(240, Math.floor(el.clientHeight));
      setCanvasSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const getProjection = (w: number, h: number, z: number, p: { x: number; y: number }) => {
    const worldW = WORLD_MAX_X - WORLD_MIN_X;
    const worldH = WORLD_MAX_Z - WORLD_MIN_Z;
    const baseScale = Math.min(w / worldW, h / worldH) * 0.94;
    const effScale = baseScale * z;
    const cxWorld = (WORLD_MIN_X + WORLD_MAX_X) / 2;
    const czWorld = (WORLD_MIN_Z + WORLD_MAX_Z) / 2;
    return {
      effScale,
      worldToScreen: (wx: number, wz: number) => ({
        cx: w / 2 + p.x + (wx - cxWorld) * effScale,
        cy: h / 2 + p.y + (wz - czWorld) * effScale,
      }),
      screenToWorld: (sx: number, sy: number) => ({
        wx: Math.round(cxWorld + (sx - w / 2 - p.x) / effScale),
        wz: Math.round(czWorld + (sy - h / 2 - p.y) / effScale),
      }),
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvasSize.w;
    const h = canvasSize.h;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0c3b55';
    ctx.fillRect(0, 0, w, h);

    const { effScale, worldToScreen } = getProjection(w, h, zoom, pan);

    const drawRectWorld = (x1: number, z1: number, x2: number, z2: number, fill: string) => {
      const p1 = worldToScreen(x1, z1);
      const p2 = worldToScreen(x2, z2);
      ctx.fillStyle = fill;
      ctx.fillRect(p1.cx, p1.cy, p2.cx - p1.cx, p2.cy - p1.cy);
    };

    // 1. South Island + Beach + North Island + Paleto Woods + Both International Airports
    drawRectWorld(
      SOUTH_ISLAND.cx - SOUTH_ISLAND.hx,
      SOUTH_ISLAND.cz - SOUTH_ISLAND.hz,
      SOUTH_ISLAND.cx + SOUTH_ISLAND.hx,
      SOUTH_ISLAND.cz + SOUTH_ISLAND.hz,
      '#1a2234'
    );
    drawRectWorld(1650, SOUTH_ISLAND.cz - SOUTH_ISLAND.hz + 10, 1800, SOUTH_ISLAND.cz + SOUTH_ISLAND.hz - 10, '#99835b');

    drawRectWorld(
      NORTH_ISLAND.cx - NORTH_ISLAND.hx,
      NORTH_ISLAND.cz - NORTH_ISLAND.hz,
      NORTH_ISLAND.cx + NORTH_ISLAND.hx,
      NORTH_ISLAND.cz + NORTH_ISLAND.hz,
      '#1a2534'
    );
    drawRectWorld(
      NORTH_ISLAND.cx - NORTH_ISLAND.hx + 15,
      -2690,
      NORTH_ISLAND.cx + NORTH_ISLAND.hx - 15,
      -2170,
      '#1d4930'
    );

    for (const az of AIRPORT_ZONES) {
      drawRectWorld(az.cx - az.hx, az.cz - az.hz, az.cx + az.hx, az.cz + az.hz, '#222c3c');
    }

    // District Watermark Labels
    const labelDistrict = (wx: number, wz: number, text: string) => {
      const p = worldToScreen(wx, wz);
      ctx.fillStyle = 'rgba(255,255,255,0.24)';
      ctx.font = `bold ${Math.max(9, Math.round(11 * Math.min(1.6, zoom)))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(text, p.cx, p.cy);
    };
    labelDistrict(0, 1525, 'VICE DOWNTOWN (SOUTH ISLAND)');
    labelDistrict(0, -1530, 'NORTHPORT & PALETO (NORTH ISLAND)');
    labelDistrict(-2175, 1550, 'SOUTH AIRPORT');
    labelDistrict(-2175, -1550, 'NORTH AIRPORT');
    labelDistrict(700, 0, 'LEONIDA BAY');

    // 2 Tropical Safehouse Islands
    for (const isl of SAFEHOUSE_ISLANDS) {
      const c = worldToScreen(isl.cx, isl.cz);
      const rad = isl.halfSize * effScale;
      ctx.fillStyle = '#99835b';
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#245d38';
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, rad * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.78)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isl.name.toUpperCase(), c.cx, c.cy + rad + 11);
    }

    // Central Park
    drawRectWorld(
      CENTRAL_PARK.cx - CENTRAL_PARK.w / 2,
      CENTRAL_PARK.cz - CENTRAL_PARK.d / 2,
      CENTRAL_PARK.cx + CENTRAL_PARK.w / 2,
      CENTRAL_PARK.cz + CENTRAL_PARK.d / 2,
      '#256b3b'
    );

    // Airport Runways & Fenced Perimeters
    for (const az of AIRPORT_ZONES) {
      drawRectWorld(
        az.runwayX - az.runwayLen / 2,
        az.runwayZ - az.runwayW / 2,
        az.runwayX + az.runwayLen / 2,
        az.runwayZ + az.runwayW / 2,
        '#3b475d'
      );
      const f1 = worldToScreen(az.fenceMinX, az.fenceMinZ);
      const f2 = worldToScreen(az.fenceMaxX, az.fenceMaxZ);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(f1.cx, f1.cy, f2.cx - f1.cx, f2.cy - f1.cy);
    }

    // 2. Segmented Asphalt Road Network
    for (const seg of ROAD_SEGMENTS) {
      const p1 = worldToScreen(seg.x1, seg.z1);
      const p2 = worldToScreen(seg.x2, seg.z2);
      ctx.strokeStyle = seg.isHighway ? '#566785' : '#313c54';
      ctx.lineWidth = Math.max(2.2, seg.width * effScale * 0.85);
      ctx.beginPath();
      ctx.moveTo(p1.cx, p1.cy);
      ctx.lineTo(p2.cx, p2.cy);
      ctx.stroke();
    }

    // 3. Grand Over-Water Highway Bridge & Boat Docks
    for (const br of BRIDGES) {
      drawRectWorld(br.cx - br.width / 2, br.cz - br.length / 2, br.cx + br.width / 2, br.cz + br.length / 2, '#64748b');
      const top = worldToScreen(br.cx, br.cz - br.length / 2);
      const bot = worldToScreen(br.cx, br.cz + br.length / 2);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(top.cx, top.cy);
      ctx.lineTo(bot.cx, bot.cy);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const dk of WOODEN_DOCKS) {
      drawRectWorld(dk.xMin, dk.zMin, dk.xMax, dk.zMax, '#9a6d43');
    }

    // 4. Bright-Blue A* GPS Route Line (#38bdf8)
    if (hud.gpsRoute && hud.gpsRoute.length >= 2) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      hud.gpsRoute.forEach((pt, i) => {
        const s = worldToScreen(pt.x, pt.z);
        if (i === 0) ctx.moveTo(s.cx, s.cy);
        else ctx.lineTo(s.cx, s.cy);
      });
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      hud.gpsRoute.forEach((pt, i) => {
        const s = worldToScreen(pt.x, pt.z);
        if (i === 0) ctx.moveTo(s.cx, s.cy);
        else ctx.lineTo(s.cx, s.cy);
      });
      ctx.stroke();
    }

    const drawIcon = (wx: number, wz: number, fill: string, glyph: string, label?: string) => {
      const p = worldToScreen(wx, wz);
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#090b10';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#090b10';
      ctx.font = 'bold 7.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(glyph, p.cx, p.cy + 0.5);

      if (label && zoom >= 1.1) {
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = '600 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, p.cx + 9, p.cy + 1);
      }
    };

    if (filter === 'All' || filter === 'Services') {
      for (const g of GAS_STATIONS) drawIcon(g.x, g.z, '#10b981', 'F');
    }
    if (filter === 'All' || filter === 'Heists & Crime') {
      for (const f of FENCE_SPOTS) drawIcon(f.x, f.z, '#f59e0b', '$', 'Fence');
    }
    if (filter === 'All' || filter === 'Jobs & Chill') {
      for (const s of STREET_STALLS) drawIcon(s.x, s.z, '#eab308', 'B');
      for (const j of CITY_JOBS) drawIcon(j.x, j.z, '#facc15', 'J');
    }

    const visibleLandmarks = filter === 'All' ? LANDMARKS : LANDMARKS.filter((l) => l.category === filter);
    for (const lm of visibleLandmarks) {
      drawIcon(lm.x, lm.z, lm.color, lm.tag.slice(0, 2), lm.name.split('(')[0].trim());
    }

    for (const ent of hud.minimapEntities) {
      if (ent.kind === 'police') {
        const p = worldToScreen(ent.x, ent.z);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(p.cx, p.cy, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (ent.kind === 'partner') {
        drawIcon(ent.x, ent.z, '#2dd4bf', hud.activeId === 'jason' ? 'L' : 'J', hud.activeId === 'jason' ? 'Lucia' : 'Jason');
      } else if (ent.kind === 'drop') {
        drawIcon(ent.x, ent.z, '#4ade80', 'D', 'Dead-Drop');
      }
    }

    const activePin = selectedPin || hud.waypoint;
    if (activePin) {
      const wp = worldToScreen(activePin.x, activePin.z);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(wp.cx, wp.cy, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(wp.cx, wp.cy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player Arrow
    const pl = worldToScreen(player.x, player.z);
    ctx.save();
    ctx.translate(pl.cx, pl.cy);
    ctx.rotate(-player.yaw);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#090b10';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(7, 7);
    ctx.lineTo(0, 3);
    ctx.lineTo(-7, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }, [hud, player.x, player.z, player.yaw, zoom, pan, filter, canvasSize, selectedPin]);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.2 : 0.84;
    setZoom((prev) => {
      const next = Math.max(1, Math.min(6.0, prev * factor));
      setPan((p) => clampPan(p.x, p.y, next, canvasSize.w, canvasSize.h));
      return next;
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movedDuringGestureRef.current = false;
    prevPinchDistRef.current = null;
    prevCenterRef.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    const prev = pointersRef.current.get(e.pointerId)!;
    const dxSingle = e.clientX - prev.x;
    const dySingle = e.clientY - prev.y;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pts = Array.from(pointersRef.current.values());
    if (pts.length >= 2) {
      movedDuringGestureRef.current = true;
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const center = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      if (prevPinchDistRef.current && prevCenterRef.current && dist > 10) {
        const ratio = dist / prevPinchDistRef.current;
        const panDx = center.x - prevCenterRef.current.x;
        const panDy = center.y - prevCenterRef.current.y;
        setZoom((z) => {
          const nextZ = Math.max(1, Math.min(6.0, z * ratio));
          setPan((p) => clampPan(p.x + panDx, p.y + panDy, nextZ, canvasSize.w, canvasSize.h));
          return nextZ;
        });
      }
      prevPinchDistRef.current = dist;
      prevCenterRef.current = center;
      return;
    }

    if (Math.hypot(dxSingle, dySingle) > 2.5) movedDuringGestureRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    setPan((p) => clampPan(p.x + dxSingle * scaleX, p.y + dySingle * scaleY, zoom, canvas.width, canvas.height));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const wasTap = pointersRef.current.size === 1 && !movedDuringGestureRef.current;
    pointersRef.current.delete(e.pointerId);
    prevPinchDistRef.current = null;
    prevCenterRef.current = null;
    if (!wasTap) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * canvas.width;
    const sy = ((e.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height;
    const { screenToWorld } = getProjection(canvas.width, canvas.height, zoom, pan);
    const { wx, wz } = screenToWorld(sx, sy);
    const label = `Pin (${wx}, ${wz})`;
    setSelectedPin({ x: wx, z: wz, label });
    onSetWaypoint(wx, wz, label);
  };

  const filteredDirectory = filter === 'All' ? LANDMARKS : LANDMARKS.filter((l) => l.category === filter);
  const showHints = hud.controlSettings.pcKeyHints && !hud.controlSettings.touchControls;
  const activeTarget = selectedPin || hud.waypoint;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 w-[100vw] h-[100dvh] z-[9999] bg-[#0a0c13] flex flex-col overflow-hidden pointer-events-auto"
      style={{
        paddingTop: 'max(6px, env(safe-area-inset-top))',
        paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(6px, env(safe-area-inset-left))',
        paddingRight: 'max(6px, env(safe-area-inset-right))',
      }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-[#121622] shrink-0 rounded-t-xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <Compass className="w-5 h-5 text-[#38bdf8] shrink-0" />
          <div className="min-w-0">
            <h2 className="font-display font-bold text-sm sm:text-base text-white truncate">
              Leonida 5x Open-World GPS Map
            </h2>
            <p className="text-[11px] text-neutral-400 truncate">
              {showHints
                ? 'Scroll or +/- to zoom · Drag to pan · Click to drop GPS & Book Taxi · [M] / Esc to close'
                : 'Pinch to zoom · Drag to pan · Tap map to set GPS or Book Smart Taxi'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {activeTarget && (
            <button
              type="button"
              onClick={() => onBookTaxi(activeTarget.x, activeTarget.z, activeTarget.label)}
              className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Car className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Book Smart Taxi</span>
              <span className="sm:hidden">Taxi</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(6.0, z * 1.3))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setZoom((z) => {
                const next = Math.max(1, z / 1.3);
                setPan((p) => clampPan(p.x, p.y, next, canvasSize.w, canvasSize.h));
                return next;
              })
            }
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 cursor-pointer"
            aria-label="Close Map"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="px-3 py-1.5 border-b border-white/10 bg-[#0f131f] flex items-center gap-1.5 overflow-x-auto vice-scroll-x shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
              filter === cat ? 'bg-[#38bdf8] text-neutral-950' : 'bg-white/8 text-neutral-300 hover:bg-white/15'
            }`}
          >
            {cat}
          </button>
        ))}
        <span className="ml-auto text-[11px] font-mono-num text-neutral-400 pl-2 shrink-0">
          Zoom {zoom.toFixed(1)}x
        </span>
      </div>

      {/* Fullscreen Map Canvas + Directory */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 min-h-0 overflow-hidden">
        <div className="lg:col-span-8 flex-1 flex flex-col min-h-[45dvh] lg:min-h-0 bg-[#0a0c13] p-1.5 sm:p-3 gap-1.5">
          <div ref={wrapperRef} className="relative flex-1 min-h-0 w-full h-full">
            <canvas
              ref={canvasRef}
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-full block rounded-xl border border-white/15 cursor-grab active:cursor-grabbing bg-[#0c3b55] touch-none"
            />
            {activeTarget && (
              <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:right-auto bg-[#0d1018]/92 border border-white/15 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2.5 text-xs pointer-events-auto">
                <span className="text-[#38bdf8] font-medium truncate flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 shrink-0" /> {activeTarget.label}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSetWaypoint(activeTarget.x, activeTarget.z, activeTarget.label)}
                    className="px-2 py-1 rounded bg-[#38bdf8] text-neutral-950 font-bold text-[11px] cursor-pointer"
                  >
                    Set GPS
                  </button>
                  <button
                    type="button"
                    onClick={() => onBookTaxi(activeTarget.x, activeTarget.z, activeTarget.label)}
                    className="px-2 py-1 rounded bg-amber-400 text-neutral-950 font-bold text-[11px] cursor-pointer"
                  >
                    Smart Taxi
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-300 px-1 shrink-0">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#38bdf8] inline-block" /> GPS Route</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ec4899] inline-block" /> Villa</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] inline-block" /> Airports / Islands</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#facc15] inline-block" /> Taxi Stand</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f97316] inline-block" /> Armory</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] inline-block" /> Park / Bank</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2dd4bf] inline-block" /> Partner</span>
          </div>
        </div>

        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-white/10 p-2 sm:p-3 flex flex-col gap-2 min-h-[130px] max-h-[28dvh] lg:max-h-none lg:min-h-0 bg-[#10131e]">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 uppercase tracking-wider shrink-0">
            <MapPin className="w-4 h-4 text-[#38bdf8]" /> Locations · GPS &amp; Taxi ({filteredDirectory.length})
          </div>
          <div className="flex-1 overflow-y-auto vice-scroll space-y-1.5 pr-1">
            {filteredDirectory.map((lm) => (
              <div
                key={lm.name}
                className="bg-[#161a29] border border-white/10 rounded-lg p-2 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded text-neutral-950 shrink-0"
                      style={{ backgroundColor: lm.color }}
                    >
                      {lm.tag}
                    </span>
                    <span className="text-xs font-semibold text-white truncate">{lm.name}</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{lm.district}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSetWaypoint(lm.x, lm.z, lm.name);
                      onClose();
                    }}
                    className="px-2 py-1 rounded bg-white/10 hover:bg-[#38bdf8] hover:text-neutral-950 text-[11px] font-semibold text-white cursor-pointer transition-colors"
                  >
                    GPS
                  </button>
                  {lm.taxiAccessible !== false && (
                    <button
                      type="button"
                      onClick={() => onBookTaxi(lm.x, lm.z, lm.name)}
                      className="px-2 py-1 rounded bg-amber-400/90 hover:bg-amber-300 text-neutral-950 text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      Taxi
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
