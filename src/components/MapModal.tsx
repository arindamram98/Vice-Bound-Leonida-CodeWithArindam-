import React, { useEffect, useRef, useState } from 'react';
import { Compass, MapPin, Navigation, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import {
  AIRPORT_ZONE,
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
  WOODEN_DOCKS,
} from '../game/worldData';
import { HudSnapshot } from '../game/types';

interface MapModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onSetWaypoint: (x: number, z: number, label: string) => void;
}

const WORLD_MIN_X = -580;
const WORLD_MAX_X = 680;
const WORLD_MIN_Z = -560;
const WORLD_MAX_Z = 560;

type MapCategory = 'All' | 'Shops & Guns' | 'Heists & Crime' | 'Jobs & Chill' | 'Safehouses' | 'Services';

interface LandmarkItem {
  name: string;
  district: string;
  x: number;
  z: number;
  color: string;
  tag: string;
  category: Exclude<MapCategory, 'All'>;
}

const LANDMARKS: LandmarkItem[] = [
  { name: "Jason's Villa (Home, Bed & Gym)", district: 'Vice Beach', x: 210, z: 210, color: '#ec4899', tag: 'HOME', category: 'Safehouses' },
  { name: 'Paradise Key Tropical Bungalow', district: 'Paradise Key Island', x: 560, z: 230, color: '#38bdf8', tag: 'ISLAND', category: 'Safehouses' },
  { name: 'Starlight Atoll Luxury Bungalow', district: 'Starlight Atoll Island', x: 560, z: -230, color: '#f43f5e', tag: 'ISLAND', category: 'Safehouses' },
  { name: 'Grand Leonida Highway Bridge', district: 'Ocean Channel', x: 0, z: 0, color: '#94a3b8', tag: 'BRIDGE', category: 'Services' },
  { name: 'Vice Armory Gun Shop (9 Weapons)', district: 'Vice Downtown', x: 70, z: 105, color: '#f97316', tag: 'GUNS', category: 'Shops & Guns' },
  { name: 'Northport Tactical Armory', district: 'Northport', x: -70, z: -210, color: '#f97316', tag: 'GUNS', category: 'Shops & Guns' },
  { name: 'Vice Threads Boutique (Clothes)', district: 'Vice Downtown', x: -70, z: 105, color: '#f472b6', tag: 'CLOTHES', category: 'Shops & Guns' },
  { name: 'Northport Streetwear (Clothes)', district: 'Northport', x: 210, z: -210, color: '#f472b6', tag: 'CLOTHES', category: 'Shops & Guns' },
  { name: 'Burger Shot Diner (Career & Food)', district: 'Vice Downtown', x: 70, z: 210, color: '#fb923c', tag: 'CAREER', category: 'Jobs & Chill' },
  { name: 'Leonida Reserve Bank (ATM & Vault)', district: 'Vice Downtown', x: 210, z: 350, color: '#22c55e', tag: 'BANK', category: 'Heists & Crime' },
  { name: 'Vangelico Vice Jewelry', district: 'Northport', x: -70, z: -350, color: '#f43f5e', tag: 'HEIST', category: 'Heists & Crime' },
  { name: 'Uncle Jack Pawn & Fence', district: 'Vice Downtown', x: -210, z: 350, color: '#f59e0b', tag: 'FENCE', category: 'Heists & Crime' },
  { name: 'Leonida Central Park & Playground', district: 'Vice Downtown', x: -70, z: 350, color: '#22c55e', tag: 'PARK', category: 'Jobs & Chill' },
  { name: 'Vice Roast Coffee Shop', district: 'Vice Beach', x: 210, z: 105, color: '#f59e0b', tag: 'COFFEE', category: 'Jobs & Chill' },
  { name: 'Neon Anchor Beer Bar', district: 'Vice Downtown West', x: -210, z: 210, color: '#a855f7', tag: 'BAR', category: 'Jobs & Chill' },
  { name: 'Jack of Hearts Bar', district: 'Northport', x: 210, z: -350, color: '#a855f7', tag: 'BAR', category: 'Jobs & Chill' },
  { name: 'Vice Iron Gym', district: 'Vice Beach', x: 210, z: 480, color: '#fb7185', tag: 'GYM', category: 'Jobs & Chill' },
  { name: 'Vice PD Central Precinct', district: 'Vice Downtown', x: -70, z: 210, color: '#3b82f6', tag: 'POLICE', category: 'Services' },
  { name: 'Leonida International Airport', district: 'Airport Keys', x: -460, z: -380, color: '#38bdf8', tag: 'AIRPORT', category: 'Services' },
  { name: 'Port Vice Marina & Speedboats', district: 'Vice Marina', x: 320, z: 350, color: '#06b6d4', tag: 'BOATS', category: 'Services' },
];

const CATEGORIES: MapCategory[] = ['All', 'Shops & Guns', 'Heists & Crime', 'Jobs & Chill', 'Safehouses', 'Services'];

export const MapModal: React.FC<MapModalProps> = ({ hud, onClose, onSetWaypoint }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const player = hud.protagonists[hud.activeId];

  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [filter, setFilter] = useState<MapCategory>('All');
  const draggingRef = useRef(false);
  const movedDuringDragRef = useRef(false);
  const lastDragRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const clampPan = (px: number, py: number, z: number, w: number, h: number) => {
    const maxX = ((z - 1) * w) / 2 + 120;
    const maxY = ((z - 1) * h) / 2 + 120;
    return {
      x: Math.max(-maxX, Math.min(maxX, px)),
      y: Math.max(-maxY, Math.min(maxY, py)),
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Deep Ocean Background
    ctx.fillStyle = '#0c3b55';
    ctx.fillRect(0, 0, w, h);

    const worldToScreen = (wx: number, wz: number) => {
      const bx = ((wx - WORLD_MIN_X) / (WORLD_MAX_X - WORLD_MIN_X)) * w;
      const by = ((wz - WORLD_MIN_Z) / (WORLD_MAX_Z - WORLD_MIN_Z)) * h;
      return {
        cx: (bx - w / 2) * zoom + w / 2 + pan.x,
        cy: (by - h / 2) * zoom + h / 2 + pan.y,
      };
    };

    const drawRectWorld = (x1: number, z1: number, x2: number, z2: number, fill: string) => {
      const p1 = worldToScreen(x1, z1);
      const p2 = worldToScreen(x2, z2);
      ctx.fillStyle = fill;
      ctx.fillRect(p1.cx, p1.cy, p2.cx - p1.cx, p2.cy - p1.cy);
    };

    // 1. Two Distinct Islands + Airport + 2 Tropical Safehouse Islands
    drawRectWorld(
      SOUTH_ISLAND.cx - SOUTH_ISLAND.hx,
      SOUTH_ISLAND.cz - SOUTH_ISLAND.hz,
      SOUTH_ISLAND.cx + SOUTH_ISLAND.hx,
      SOUTH_ISLAND.cz + SOUTH_ISLAND.hz,
      '#1a2234'
    );
    drawRectWorld(338, SOUTH_ISLAND.cz - SOUTH_ISLAND.hz + 2, 372, SOUTH_ISLAND.cz + SOUTH_ISLAND.hz - 2, '#99835b');

    drawRectWorld(
      NORTH_ISLAND.cx - NORTH_ISLAND.hx,
      NORTH_ISLAND.cz - NORTH_ISLAND.hz,
      NORTH_ISLAND.cx + NORTH_ISLAND.hx,
      NORTH_ISLAND.cz + NORTH_ISLAND.hz,
      '#1a2534'
    );
    drawRectWorld(NORTH_ISLAND.cx - NORTH_ISLAND.hx + 3, -540, NORTH_ISLAND.cx + NORTH_ISLAND.hx - 3, -432, '#1d4930');
    drawRectWorld(-560, -520, -320, -250, '#222c3c');

    // District Watermark Labels
    const labelDistrict = (wx: number, wz: number, text: string) => {
      const p = worldToScreen(wx, wz);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.font = `bold ${Math.round(11 * Math.min(1.5, zoom))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(text, p.cx, p.cy);
    };
    labelDistrict(0, 305, 'VICE DOWNTOWN (SOUTH ISLAND)');
    labelDistrict(0, -300, 'NORTHPORT (NORTH ISLAND)');
    labelDistrict(-440, -455, 'LEONIDA AIRPORT');
    labelDistrict(160, 0, 'OCEAN CHANNEL');

    // 2 Tropical Safehouse Islands
    for (const isl of SAFEHOUSE_ISLANDS) {
      const c = worldToScreen(isl.cx, isl.cz);
      const edge = worldToScreen(isl.cx + isl.halfSize, isl.cz);
      const rad = Math.abs(edge.cx - c.cx);
      ctx.fillStyle = '#99835b';
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#245d38';
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, rad * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isl.name.toUpperCase(), c.cx, c.cy + rad + 12);
    }

    // Central Park
    drawRectWorld(
      CENTRAL_PARK.cx - CENTRAL_PARK.w / 2,
      CENTRAL_PARK.cz - CENTRAL_PARK.d / 2,
      CENTRAL_PARK.cx + CENTRAL_PARK.w / 2,
      CENTRAL_PARK.cz + CENTRAL_PARK.d / 2,
      '#256b3b'
    );

    // Airport Runway
    drawRectWorld(
      AIRPORT_ZONE.runwayX - AIRPORT_ZONE.runwayLen / 2,
      AIRPORT_ZONE.runwayZ - AIRPORT_ZONE.runwayW / 2,
      AIRPORT_ZONE.runwayX + AIRPORT_ZONE.runwayLen / 2,
      AIRPORT_ZONE.runwayZ + AIRPORT_ZONE.runwayW / 2,
      '#3b475d'
    );

    // 2. Segmented Asphalt Road Network
    const pxPerWorld = (w / (WORLD_MAX_X - WORLD_MIN_X)) * zoom;
    for (const seg of ROAD_SEGMENTS) {
      const p1 = worldToScreen(seg.x1, seg.z1);
      const p2 = worldToScreen(seg.x2, seg.z2);
      ctx.strokeStyle = seg.isHighway ? '#566785' : '#313c54';
      ctx.lineWidth = Math.max(2.5, seg.width * pxPerWorld * 0.72);
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
      ctx.lineWidth = 8;
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
      ctx.lineWidth = 3.5;
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
      ctx.arc(p.cx, p.cy, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#090b10';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#090b10';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(glyph, p.cx, p.cy + 0.5);

      if (label) {
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = '600 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, p.cx + 10, p.cy + 1);
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

    if (hud.waypoint) {
      const wp = worldToScreen(hud.waypoint.x, hud.waypoint.z);
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
  }, [hud, player.x, player.z, player.yaw, zoom, pan, filter]);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.18 : 0.85;
    setZoom((prev) => {
      const next = Math.max(1, Math.min(4.2, prev * factor));
      setPan((p) => clampPan(p.x, p.y, next, 780, 560));
      return next;
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = true;
    movedDuringDragRef.current = false;
    lastDragRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastDragRef.current.x;
    const dy = e.clientY - lastDragRef.current.y;
    if (Math.hypot(dx, dy) > 2) movedDuringDragRef.current = true;
    lastDragRef.current = { x: e.clientX, y: e.clientY };
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    setPan((prev) => clampPan(prev.x + dx * scaleX, prev.y + dy * scaleY, zoom, canvas.width, canvas.height));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (movedDuringDragRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const cy = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const bx = (cx - pan.x - canvas.width / 2) / zoom + canvas.width / 2;
    const by = (cy - pan.y - canvas.height / 2) / zoom + canvas.height / 2;
    const wx = Math.round(WORLD_MIN_X + (bx / canvas.width) * (WORLD_MAX_X - WORLD_MIN_X));
    const wz = Math.round(WORLD_MIN_Z + (by / canvas.height) * (WORLD_MAX_Z - WORLD_MIN_Z));
    onSetWaypoint(wx, wz, `GPS Pin (${wx}, ${wz})`);
  };

  const filteredDirectory = filter === 'All' ? LANDMARKS : LANDMARKS.filter((l) => l.category === filter);

  const showHints = hud.controlSettings.pcKeyHints && !hud.controlSettings.touchControls;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-2 sm:p-4 pointer-events-auto">
      <div className="bg-[#0d1018] border border-white/15 rounded-2xl w-[94vw] h-[88dvh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-white/10 bg-[#121622] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Compass className="w-5 h-5 text-[#38bdf8] shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display font-bold text-sm sm:text-base text-white truncate">
                Leonida Dual-Island &amp; Safehouse Map
              </h2>
              <p className="text-[11px] text-neutral-400 truncate">
                {showHints
                  ? 'Scroll or +/- to zoom · Drag to pan · Click to drop bright-blue GPS route · [M] or Esc to close'
                  : 'Use +/- to zoom · Drag to pan · Tap anywhere to drop blue GPS route'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {hud.waypoint && (
              <div className="hidden md:flex text-xs text-[#38bdf8] font-medium items-center gap-1 mr-2">
                <Navigation className="w-3.5 h-3.5" /> GPS: {hud.waypoint.label}
              </div>
            )}
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(4.2, z * 1.25))}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                setZoom((z) => {
                  const next = Math.max(1, z / 1.25);
                  setPan((p) => clampPan(p.x, p.y, next, 780, 560));
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
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              aria-label="Close Map"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="px-3 sm:px-4 py-2 border-b border-white/10 bg-[#0f131f] flex items-center gap-1.5 overflow-x-auto shrink-0">
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

        {/* Map Canvas + Right Directory */}
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 min-h-0 overflow-hidden">
          <div className="lg:col-span-8 p-2.5 sm:p-4 flex-1 flex flex-col gap-2 min-h-[46dvh] lg:min-h-0 bg-[#0a0c13]">
            <div className="relative flex-1 min-h-0 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={780}
                height={560}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full h-full max-h-full object-contain rounded-xl border border-white/15 cursor-grab active:cursor-grabbing bg-[#0c3b55] touch-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-300 px-1">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#38bdf8] inline-block" /> GPS Route</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ec4899] inline-block" /> Villa</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] inline-block" /> Islands / Airport</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f472b6] inline-block" /> Clothes</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f97316] inline-block" /> Armory</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] inline-block" /> Park / Bank</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2dd4bf] inline-block" /> Partner</span>
            </div>
          </div>

          <div className="lg:col-span-4 border-l border-white/10 p-4 flex flex-col gap-2.5 min-h-0 bg-[#10131e]">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-[#38bdf8]" /> Locations &amp; Quick GPS ({filteredDirectory.length})
            </div>
            <div className="flex-1 overflow-y-auto vice-scroll space-y-1.5 pr-1">
              {filteredDirectory.map((lm) => (
                <div
                  key={lm.name}
                  className="bg-[#161a29] border border-white/10 rounded-lg p-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded text-neutral-950 shrink-0"
                        style={{ backgroundColor: lm.color }}
                      >
                        {lm.tag}
                      </span>
                      <span className="text-xs font-semibold text-white truncate">{lm.name}</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{lm.district}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSetWaypoint(lm.x, lm.z, lm.name);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-[#38bdf8] hover:text-neutral-950 text-[11px] font-semibold text-white cursor-pointer shrink-0 transition-colors"
                  >
                    Set GPS
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
