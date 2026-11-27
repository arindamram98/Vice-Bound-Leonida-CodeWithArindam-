import * as THREE from 'three';

export interface ProceduralTextureSet {
  asphalt: THREE.CanvasTexture;
  intersectionAsphalt: THREE.CanvasTexture;
  asphaltNormal: THREE.CanvasTexture;
  asphaltRoughness: THREE.CanvasTexture;
  highway: THREE.CanvasTexture;
  runway: THREE.CanvasTexture;
  sidewalk: THREE.CanvasTexture;
  facadeWarm: THREE.CanvasTexture;
  facadeDeco: THREE.CanvasTexture;
  facadeModern: THREE.CanvasTexture;
  concreteNormal: THREE.CanvasTexture;
  villaStucco: THREE.CanvasTexture;
  interiorFloor: THREE.CanvasTexture;
  woodFloor: THREE.CanvasTexture;
  woodNormal: THREE.CanvasTexture;
  sand: THREE.CanvasTexture;
  grass: THREE.CanvasTexture;
  parkPath: THREE.CanvasTexture;
  waterBump: THREE.CanvasTexture;
  waterNormal: THREE.CanvasTexture;
  waterColor: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  billboardAds: THREE.CanvasTexture[];
  crosswalk: THREE.CanvasTexture;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

/**
 * Generates a linear tangent-space normal map from a procedural height field callback.
 * Uses THREE.NoColorSpace so shaders/PBR materials decode normals accurately without gamma distortion.
 */
function buildNormalMap(
  size: number,
  repeatX: number,
  repeatY: number,
  maxAniso: number,
  strength: number,
  sampleHeight: (x: number, y: number) => number
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(size, size);
  const img = ctx.createImageData(size, size);
  const heights = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      heights[y * size + x] = sampleHeight(x, y);
    }
  }
  const at = (x: number, y: number) => {
    const wx = ((x % size) + size) % size;
    const wy = ((y % size) + size) % size;
    return heights[wy * size + wx];
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const nx = -dx * inv;
      const ny = -dy * inv;
      const nz = inv;
      const idx = (y * size + x) * 4;
      img.data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      img.data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      img.data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  // 1. Photorealistic Aggregate Asphalt with tire wear tracks & weathered road paint
  const [asphC, asphCtx] = makeCanvas(512, 512);
  asphCtx.fillStyle = '#191c22';
  asphCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 18000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 18 + Math.floor(Math.random() * 26);
    asphCtx.fillStyle = `rgb(${v},${v + 1},${v + 4})`;
    asphCtx.fillRect(x, y, 2, 2);
  }
  // Subtle rubber tire-wear grooves
  asphCtx.fillStyle = 'rgba(0,0,0,0.22)';
  asphCtx.fillRect(68, 0, 48, 512);
  asphCtx.fillRect(170, 0, 48, 512);
  asphCtx.fillRect(292, 0, 48, 512);
  asphCtx.fillRect(394, 0, 48, 512);

  // Subtle asphalt crack lines
  asphCtx.strokeStyle = 'rgba(8,10,14,0.45)';
  asphCtx.lineWidth = 1.2;
  for (let c = 0; c < 6; c++) {
    asphCtx.beginPath();
    let cx = 40 + c * 82;
    let cy = (c * 90) % 512;
    asphCtx.moveTo(cx, cy);
    for (let s = 0; s < 5; s++) {
      cx += (Math.random() - 0.5) * 18;
      cy += 24;
      asphCtx.lineTo(cx, cy);
    }
    asphCtx.stroke();
  }

  asphCtx.fillStyle = '#eab308';
  asphCtx.fillRect(246, 0, 6, 512);
  asphCtx.fillRect(260, 0, 6, 512);
  asphCtx.fillStyle = 'rgba(248,250,252,0.88)';
  for (let y = 16; y < 512; y += 64) {
    asphCtx.fillRect(128, y, 6, 34);
    asphCtx.fillRect(378, y, 6, 34);
  }
  asphCtx.fillStyle = 'rgba(241,245,249,0.75)';
  asphCtx.fillRect(12, 0, 7, 512);
  asphCtx.fillRect(493, 0, 7, 512);
  const asphalt = new THREE.CanvasTexture(asphC);
  asphalt.wrapS = THREE.RepeatWrapping;
  asphalt.wrapT = THREE.RepeatWrapping;
  asphalt.repeat.set(1, 1);
  asphalt.colorSpace = THREE.SRGBColorSpace;
  asphalt.anisotropy = maxAnisotropy;

  // Clean Intersection Asphalt Box (no longitudinal stripes cutting across junctions)
  const [intAsphC, intAsphCtx] = makeCanvas(256, 256);
  intAsphCtx.fillStyle = '#1b1f26';
  intAsphCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6000; i++) {
    const v = 20 + Math.floor(Math.random() * 24);
    intAsphCtx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    intAsphCtx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  intAsphCtx.strokeStyle = 'rgba(255,255,255,0.22)';
  intAsphCtx.lineWidth = 4;
  intAsphCtx.strokeRect(4, 4, 248, 248);
  const intersectionAsphalt = new THREE.CanvasTexture(intAsphC);
  intersectionAsphalt.wrapS = THREE.RepeatWrapping;
  intersectionAsphalt.wrapT = THREE.RepeatWrapping;
  intersectionAsphalt.colorSpace = THREE.SRGBColorSpace;
  intersectionAsphalt.anisotropy = maxAnisotropy;

  // Linear Asphalt Normal & Roughness maps (aggregate micro-grain + puddle patches)
  const asphaltNormal = buildNormalMap(128, 4, 144, maxAnisotropy, 1.8, (x, y) => {
    const n = Math.sin(x * 1.9 + y * 2.3) * 0.4 + Math.cos(x * 4.7 - y * 3.1) * 0.3;
    return n;
  });

  const [arC, arCtx] = makeCanvas(256, 256);
  arCtx.fillStyle = '#c8c8c8'; // ~0.78 roughness base
  arCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) {
    const shade = 155 + Math.floor(Math.random() * 85);
    arCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
    arCtx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  // Smooth glossy tire tracks
  arCtx.fillStyle = 'rgba(115,115,115,0.4)';
  arCtx.fillRect(32, 0, 30, 256);
  arCtx.fillRect(92, 0, 30, 256);
  arCtx.fillRect(140, 0, 30, 256);
  arCtx.fillRect(198, 0, 30, 256);
  const asphaltRoughness = new THREE.CanvasTexture(arC);
  asphaltRoughness.wrapS = THREE.RepeatWrapping;
  asphaltRoughness.wrapT = THREE.RepeatWrapping;
  asphaltRoughness.repeat.set(1, 36);
  asphaltRoughness.colorSpace = THREE.NoColorSpace;
  asphaltRoughness.anisotropy = maxAnisotropy;

  // 2. Wide Multi-Lane Highway Texture
  const [hwC, hwCtx] = makeCanvas(512, 512);
  hwCtx.fillStyle = '#171a21';
  hwCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14000; i++) {
    const v = 16 + Math.floor(Math.random() * 24);
    hwCtx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    hwCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  hwCtx.fillStyle = '#e59910';
  hwCtx.fillRect(246, 0, 6, 512);
  hwCtx.fillRect(260, 0, 6, 512);
  hwCtx.fillStyle = 'rgba(241,245,249,0.78)';
  for (let y = 12; y < 512; y += 64) {
    hwCtx.fillRect(92, y, 4, 34);
    hwCtx.fillRect(170, y, 4, 34);
    hwCtx.fillRect(338, y, 4, 34);
    hwCtx.fillRect(416, y, 4, 34);
  }
  hwCtx.fillStyle = '#cbd5e1';
  hwCtx.fillRect(12, 0, 7, 512);
  hwCtx.fillRect(493, 0, 7, 512);
  const highway = new THREE.CanvasTexture(hwC);
  highway.wrapS = THREE.RepeatWrapping;
  highway.wrapT = THREE.RepeatWrapping;
  highway.repeat.set(1, 1);
  highway.colorSpace = THREE.SRGBColorSpace;
  highway.anisotropy = maxAnisotropy;

  // 3. Airport Runway Asphalt with Rubber Skid Marks & Threshold Bars
  const [rwC, rwCtx] = makeCanvas(512, 512);
  rwCtx.fillStyle = '#1e222a';
  rwCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 10000; i++) {
    const v = 22 + Math.floor(Math.random() * 20);
    rwCtx.fillStyle = `rgb(${v},${v},${v + 3})`;
    rwCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  rwCtx.fillStyle = 'rgba(10,12,16,0.38)';
  rwCtx.fillRect(195, 0, 26, 512);
  rwCtx.fillRect(290, 0, 26, 512);
  rwCtx.fillStyle = '#e2e8f0';
  rwCtx.fillRect(18, 0, 10, 512);
  rwCtx.fillRect(484, 0, 10, 512);
  for (let y = 20; y < 512; y += 84) {
    rwCtx.fillRect(250, y, 12, 48);
  }
  const runway = new THREE.CanvasTexture(rwC);
  runway.wrapS = THREE.RepeatWrapping;
  runway.wrapT = THREE.RepeatWrapping;
  runway.repeat.set(1, 14);
  runway.colorSpace = THREE.SRGBColorSpace;
  runway.anisotropy = maxAnisotropy;

  // 4. Crisp Concrete Sidewalk Pavers & Expansion Joints
  const [swC, swCtx] = makeCanvas(512, 512);
  swCtx.fillStyle = '#c5bfb3';
  swCtx.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 4; c++) {
      const shade = 188 + ((r * 7 + c * 13) % 20);
      swCtx.fillStyle = `rgb(${shade}, ${shade - 4}, ${shade - 10})`;
      swCtx.fillRect(c * 128 + (r % 2) * 64 + 3, r * 64 + 3, 122, 58);
    }
  }
  swCtx.strokeStyle = 'rgba(70,66,60,0.42)';
  swCtx.lineWidth = 3;
  for (let r = 0; r <= 8; r++) {
    swCtx.beginPath();
    swCtx.moveTo(0, r * 64);
    swCtx.lineTo(512, r * 64);
    swCtx.stroke();
  }
  const sidewalk = new THREE.CanvasTexture(swC);
  sidewalk.wrapS = THREE.RepeatWrapping;
  sidewalk.wrapT = THREE.RepeatWrapping;
  sidewalk.repeat.set(1, 1);
  sidewalk.colorSpace = THREE.SRGBColorSpace;
  sidewalk.anisotropy = maxAnisotropy;

  // 5. Realistic Architectural Masonry, Limestone & Reflective Glass Facade
  const [facC, facCtx] = makeCanvas(512, 512);
  facCtx.fillStyle = '#b4a99b';
  facCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6000; i++) {
    facCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(40,35,30,0.07)';
    facCtx.fillRect(Math.random() * 512, Math.random() * 512, 3, 2);
  }
  for (let row = 0; row < 6; row++) {
    facCtx.fillStyle = '#8b8072';
    facCtx.fillRect(0, row * 85, 512, 10);
    for (let col = 0; col < 6; col++) {
      const x = col * 85 + 14;
      const y = row * 85 + 18;
      facCtx.fillStyle = '#1b242d';
      facCtx.fillRect(x, y, 56, 56);
      const lit = (row * 5 + col * 3) % 4 !== 0;
      const grad = facCtx.createLinearGradient(x, y, x + 50, y + 50);
      grad.addColorStop(0, lit ? '#84b7cc' : '#16202a');
      grad.addColorStop(1, lit ? '#325a72' : '#0f161f');
      facCtx.fillStyle = grad;
      facCtx.fillRect(x + 4, y + 4, 48, 48);
      facCtx.fillStyle = '#151c24';
      facCtx.fillRect(x + 26, y + 4, 4, 48);
      facCtx.fillRect(x + 4, y + 26, 48, 4);
      facCtx.fillStyle = '#dcd5ca';
      facCtx.fillRect(x - 3, y + 54, 62, 6);
    }
  }
  const facadeWarm = new THREE.CanvasTexture(facC);
  facadeWarm.wrapS = THREE.RepeatWrapping;
  facadeWarm.wrapT = THREE.RepeatWrapping;
  facadeWarm.colorSpace = THREE.SRGBColorSpace;
  facadeWarm.anisotropy = maxAnisotropy;

  // 6. Photorealistic Ocean Drive Art Deco Limestone & Glass
  const [decoC, decoCtx] = makeCanvas(512, 512);
  decoCtx.fillStyle = '#e3d1c5';
  decoCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4500; i++) {
    decoCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(90,70,60,0.06)';
    decoCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  decoCtx.fillStyle = '#e05363';
  decoCtx.fillRect(0, 0, 512, 20);
  decoCtx.fillStyle = '#1d9a8d';
  decoCtx.fillRect(0, 242, 512, 12);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const x = col * 102 + 16;
      const y = row * 124 + 34;
      decoCtx.fillStyle = '#1b2b36';
      decoCtx.fillRect(x, y, 68, 76);
      decoCtx.fillStyle = row % 2 === 0 ? '#55a2b5' : '#cfa06e';
      decoCtx.fillRect(x + 6, y + 6, 56, 64);
      decoCtx.fillStyle = '#e5e7eb';
      decoCtx.fillRect(x + 32, y + 6, 4, 64);
    }
  }
  const facadeDeco = new THREE.CanvasTexture(decoC);
  facadeDeco.wrapS = THREE.RepeatWrapping;
  facadeDeco.wrapT = THREE.RepeatWrapping;
  facadeDeco.colorSpace = THREE.SRGBColorSpace;
  facadeDeco.anisotropy = maxAnisotropy;

  // 7. High-Rise Curtain-Wall Steel & Tinted Glass Skyscraper
  const [modC, modCtx] = makeCanvas(512, 512);
  modCtx.fillStyle = '#111824';
  modCtx.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row++) {
    modCtx.fillStyle = '#253142';
    modCtx.fillRect(0, row * 64, 512, 8);
    for (let col = 0; col < 8; col++) {
      const warmGlow = (row * 11 + col * 7) % 5 === 0;
      const g = modCtx.createLinearGradient(col * 64, row * 64, col * 64 + 54, row * 64 + 54);
      g.addColorStop(0, warmGlow ? '#e0aa42' : '#4a7ba3');
      g.addColorStop(1, warmGlow ? '#924d10' : '#1b354d');
      modCtx.fillStyle = g;
      modCtx.fillRect(col * 64 + 6, row * 64 + 10, 52, 48);
    }
  }
  const facadeModern = new THREE.CanvasTexture(modC);
  facadeModern.wrapS = THREE.RepeatWrapping;
  facadeModern.wrapT = THREE.RepeatWrapping;
  facadeModern.colorSpace = THREE.SRGBColorSpace;
  facadeModern.anisotropy = maxAnisotropy;

  // Linear Concrete & Architectural Seam Normal Map
  const concreteNormal = buildNormalMap(128, 2, 2, maxAnisotropy, 1.5, (x, y) => {
    const seam = x % 32 === 0 || y % 21 === 0 ? -0.8 : 0;
    const grain = Math.sin(x * 1.3 + y * 2.1) * 0.22;
    return seam + grain;
  });

  // 8. Luxury Coastal Villa Stucco & Travertine Trim
  const [vilC, vilCtx] = makeCanvas(512, 512);
  vilCtx.fillStyle = '#e5dcd0';
  vilCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8000; i++) {
    vilCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(130,115,98,0.14)';
    vilCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  vilCtx.fillStyle = '#bfa990';
  vilCtx.fillRect(0, 440, 512, 72);
  vilCtx.fillStyle = '#5c3f2c';
  vilCtx.fillRect(0, 0, 512, 24);
  const villaStucco = new THREE.CanvasTexture(vilC);
  villaStucco.wrapS = THREE.RepeatWrapping;
  villaStucco.wrapT = THREE.RepeatWrapping;
  villaStucco.colorSpace = THREE.SRGBColorSpace;
  villaStucco.anisotropy = maxAnisotropy;

  // 9. Marble Tile Interior Floor
  const [intC, intCtx] = makeCanvas(512, 512);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      intCtx.fillStyle = (r + c) % 2 === 0 ? '#dcd7ce' : '#bab4aa';
      intCtx.fillRect(c * 64, r * 64, 64, 64);
      intCtx.strokeStyle = 'rgba(0,0,0,0.14)';
      intCtx.strokeRect(c * 64, r * 64, 64, 64);
    }
  }
  const interiorFloor = new THREE.CanvasTexture(intC);
  interiorFloor.wrapS = THREE.RepeatWrapping;
  interiorFloor.wrapT = THREE.RepeatWrapping;
  interiorFloor.repeat.set(4, 4);
  interiorFloor.colorSpace = THREE.SRGBColorSpace;
  interiorFloor.anisotropy = maxAnisotropy;

  // 10. Rich Oak Hardwood Planks + Normal Map
  const [woodC, woodCtx] = makeCanvas(512, 512);
  woodCtx.fillStyle = '#68432b';
  woodCtx.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 16; r++) {
    const tone = 90 + ((r * 17) % 24);
    woodCtx.fillStyle = `rgb(${tone + 15}, ${Math.floor(tone * 0.66)}, ${Math.floor(tone * 0.42)})`;
    woodCtx.fillRect(0, r * 32, 512, 29);
    woodCtx.fillStyle = '#3a2213';
    woodCtx.fillRect(0, r * 32 + 29, 512, 3);
    for (let g = 0; g < 22; g++) {
      woodCtx.fillStyle = 'rgba(42,20,8,0.16)';
      woodCtx.fillRect(0, r * 32 + Math.random() * 26, 512, 1.5);
    }
  }
  const woodFloor = new THREE.CanvasTexture(woodC);
  woodFloor.wrapS = THREE.RepeatWrapping;
  woodFloor.wrapT = THREE.RepeatWrapping;
  woodFloor.repeat.set(4, 4);
  woodFloor.colorSpace = THREE.SRGBColorSpace;
  woodFloor.anisotropy = maxAnisotropy;

  const woodNormal = buildNormalMap(128, 4, 4, maxAnisotropy, 1.6, (x, y) => {
    const plankEdge = y % 8 === 0 ? -0.9 : 0;
    const grain = Math.sin(x * 0.4 + Math.sin(y * 1.4)) * 0.2;
    return plankEdge + grain;
  });

  // 11. Warm Golden Coastal Sand
  const [sandC, sandCtx] = makeCanvas(512, 512);
  sandCtx.fillStyle = '#e5cf95';
  sandCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14000; i++) {
    sandCtx.fillStyle = Math.random() > 0.45 ? 'rgba(255,244,214,0.34)' : 'rgba(176,142,84,0.28)';
    sandCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  const sand = new THREE.CanvasTexture(sandC);
  sand.wrapS = THREE.RepeatWrapping;
  sand.wrapT = THREE.RepeatWrapping;
  sand.repeat.set(1, 1);
  sand.colorSpace = THREE.SRGBColorSpace;
  sand.anisotropy = maxAnisotropy;

  // 12. Lush Tropical Turf & Lawn Grass
  const [grassC, grassCtx] = makeCanvas(512, 512);
  grassCtx.fillStyle = '#316e35';
  grassCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 18000; i++) {
    grassCtx.fillStyle = Math.random() > 0.5 ? '#438b43' : '#245728';
    grassCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 5);
  }
  const grass = new THREE.CanvasTexture(grassC);
  grass.wrapS = THREE.RepeatWrapping;
  grass.wrapT = THREE.RepeatWrapping;
  grass.repeat.set(1, 1);
  grass.colorSpace = THREE.SRGBColorSpace;
  grass.anisotropy = maxAnisotropy;

  // 13. Garden Brick Cobblestone Path
  const [ppC, ppCtx] = makeCanvas(256, 256);
  ppCtx.fillStyle = '#9c755e';
  ppCtx.fillRect(0, 0, 256, 256);
  ppCtx.strokeStyle = 'rgba(52,32,24,0.48)';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 4; c++) {
      ppCtx.strokeRect(c * 64 + (r % 2) * 32, r * 32, 64, 32);
    }
  }
  const parkPath = new THREE.CanvasTexture(ppC);
  parkPath.wrapS = THREE.RepeatWrapping;
  parkPath.wrapT = THREE.RepeatWrapping;
  parkPath.repeat.set(5, 5);
  parkPath.colorSpace = THREE.SRGBColorSpace;
  parkPath.anisotropy = maxAnisotropy;

  // 14. Ocean Water Bump, Linear Tangent Normal Map & Caustics Albedo
  const [watC, watCtx] = makeCanvas(512, 512);
  watCtx.fillStyle = '#808080';
  watCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 950; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 10 + Math.random() * 28;
    const grad = watCtx.createRadialGradient(x, y, 1, x, y, r);
    grad.addColorStop(0, 'rgba(235,235,235,0.52)');
    grad.addColorStop(1, 'rgba(128,128,128,0)');
    watCtx.fillStyle = grad;
    watCtx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const waterBump = new THREE.CanvasTexture(watC);
  waterBump.wrapS = THREE.RepeatWrapping;
  waterBump.wrapT = THREE.RepeatWrapping;
  waterBump.repeat.set(28, 42);
  waterBump.colorSpace = THREE.NoColorSpace;

  const waterNormal = buildNormalMap(256, 1, 1, maxAnisotropy, 2.2, (x, y) => {
    const a = (x / 256) * Math.PI * 2;
    const b = (y / 256) * Math.PI * 2;
    return (
      Math.sin(a * 3 + b * 2) * 0.45 +
      Math.cos(a * 5 - b * 4) * 0.3 +
      Math.sin(a * 9 + b * 7) * 0.16
    );
  });

  const [wcC, wcCtx] = makeCanvas(512, 512);
  const oceanGrad = wcCtx.createLinearGradient(0, 0, 512, 512);
  oceanGrad.addColorStop(0, '#10899c');
  oceanGrad.addColorStop(0.5, '#0b687c');
  oceanGrad.addColorStop(1, '#0e7d91');
  wcCtx.fillStyle = oceanGrad;
  wcCtx.fillRect(0, 0, 512, 512);
  const waterColor = new THREE.CanvasTexture(wcC);
  waterColor.wrapS = THREE.RepeatWrapping;
  waterColor.wrapT = THREE.RepeatWrapping;
  waterColor.repeat.set(24, 38);
  waterColor.colorSpace = THREE.SRGBColorSpace;
  waterColor.anisotropy = maxAnisotropy;

  // 15. Radial Contact Shadow
  const [csC, csCtx] = makeCanvas(128, 128);
  const csGrad = csCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
  csGrad.addColorStop(0, 'rgba(0,0,0,0.72)');
  csGrad.addColorStop(0.55, 'rgba(0,0,0,0.34)');
  csGrad.addColorStop(1, 'rgba(0,0,0,0)');
  csCtx.fillStyle = csGrad;
  csCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(csC);
  contactShadow.colorSpace = THREE.SRGBColorSpace;

  // 16. Glowing Vice City Roadside Billboard Ads (4 vibrant local themes)
  const adSpecs = [
    { bg1: '#ff2e63', bg2: '#3f0d36', title: 'BURGER SHOT', sub: 'BLEEDER MEAL $4.99 · HIRING', accent: '#facc15' },
    { bg1: '#0ea5e9', bg2: '#0f172a', title: 'EXOTIC MOTORS', sub: 'CROSS THE GRAND BRIDGE', accent: '#2dd4bf' },
    { bg1: '#f97316', bg2: '#2d1208', title: 'AMMUNATION', sub: '9 WEAPONS & KEVLAR IN STOCK', accent: '#ffffff' },
    { bg1: '#8b5cf6', bg2: '#130b2c', title: 'PARADISE KEYS', sub: 'PRIVATE ISLAND BUNGALOWS', accent: '#fb7185' },
  ];
  const billboardAds = adSpecs.map((ad) => {
    const [bc, bctx] = makeCanvas(512, 256);
    const grad = bctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, ad.bg1);
    grad.addColorStop(1, ad.bg2);
    bctx.fillStyle = grad;
    bctx.fillRect(0, 0, 512, 256);
    bctx.strokeStyle = ad.accent;
    bctx.lineWidth = 8;
    bctx.strokeRect(12, 12, 488, 232);
    bctx.fillStyle = '#ffffff';
    bctx.font = '900 54px sans-serif';
    bctx.textAlign = 'center';
    bctx.fillText(ad.title, 256, 122);
    bctx.fillStyle = ad.accent;
    bctx.font = 'bold 24px sans-serif';
    bctx.fillText(ad.sub, 256, 178);
    const tex = new THREE.CanvasTexture(bc);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAnisotropy;
    return tex;
  });

  // 17. Crisp Pedestrian Zebra Crosswalk Texture
  const [cwC, cwCtx] = makeCanvas(256, 128);
  cwCtx.clearRect(0, 0, 256, 128);
  cwCtx.fillStyle = 'rgba(241,245,249,0.88)';
  for (let i = 0; i < 6; i++) {
    cwCtx.fillRect(10 + i * 42, 8, 24, 112);
  }
  const crosswalk = new THREE.CanvasTexture(cwC);
  crosswalk.colorSpace = THREE.SRGBColorSpace;
  crosswalk.anisotropy = maxAnisotropy;

  return {
    asphalt,
    intersectionAsphalt,
    asphaltNormal,
    asphaltRoughness,
    highway,
    runway,
    sidewalk,
    facadeWarm,
    facadeDeco,
    facadeModern,
    concreteNormal,
    villaStucco,
    interiorFloor,
    woodFloor,
    woodNormal,
    sand,
    grass,
    parkPath,
    waterBump,
    waterNormal,
    waterColor,
    contactShadow,
    billboardAds,
    crosswalk,
  };
}

export function createStorefrontSignTexture(
  title: string,
  subtitle: string,
  bgColor: string,
  accentColor: string
): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 144);
  const grad = ctx.createLinearGradient(0, 0, 512, 144);
  grad.addColorStop(0, bgColor);
  grad.addColorStop(1, '#090d16');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 144);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 132);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title.toUpperCase(), 256, 56);

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 21px sans-serif';
  ctx.fillText(subtitle.toUpperCase(), 256, 106);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
