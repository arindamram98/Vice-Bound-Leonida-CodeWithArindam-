import * as THREE from 'three';

// ─── Ashima 2D Simplex Noise (identical in TypeScript & GLSL) ─────────────────
function mod289(x: number): number {
  return x - Math.floor(x * (1.0 / 289.0)) * 289.0;
}

function permute(x: number): number {
  return mod289((x * 34.0 + 1.0) * x);
}

/**
 * Continuous 2D Simplex Noise returning values in [-1, 1], matching GLSL snoise(vec2).
 */
export function simplex2D(vx: number, vy: number): number {
  const C0 = 0.211324865405187;
  const C1 = 0.366025403784439;
  const C2 = -0.577350269189626;
  const C3 = 0.024390243902439;

  const s = (vx + vy) * C1;
  const ix = Math.floor(vx + s);
  const iy = Math.floor(vy + s);

  const t = (ix + iy) * C0;
  const X0 = ix - t;
  const Y0 = iy - t;
  const x0 = vx - X0;
  const y0 = vy - Y0;

  const i1x = x0 > y0 ? 1.0 : 0.0;
  const i1y = x0 > y0 ? 0.0 : 1.0;

  const x1 = x0 - i1x + C0;
  const y1 = y0 - i1y + C0;
  const x2 = x0 + C2;
  const y2 = y0 + C2;

  const miX = mod289(ix);
  const miY = mod289(iy);

  const py0 = permute(miY);
  const py1 = permute(miY + i1y);
  const py2 = permute(miY + 1.0);

  const p0 = permute(py0 + miX);
  const p1 = permute(py1 + miX + i1x);
  const p2 = permute(py2 + miX + 1.0);

  let m0 = Math.max(0.0, 0.5 - (x0 * x0 + y0 * y0));
  let m1 = Math.max(0.0, 0.5 - (x1 * x1 + y1 * y1));
  let m2 = Math.max(0.0, 0.5 - (x2 * x2 + y2 * y2));
  m0 = m0 * m0 * m0 * m0;
  m1 = m1 * m1 * m1 * m1;
  m2 = m2 * m2 * m2 * m2;

  const gx0 = 2.0 * (p0 * C3 - Math.floor(p0 * C3)) - 1.0;
  const gy0 = Math.abs(gx0) - 0.5;
  const ox0 = Math.floor(gx0 + 0.5);
  const ax0 = gx0 - ox0;

  const gx1 = 2.0 * (p1 * C3 - Math.floor(p1 * C3)) - 1.0;
  const gy1 = Math.abs(gx1) - 0.5;
  const ox1 = Math.floor(gx1 + 0.5);
  const ax1 = gx1 - ox1;

  const gx2 = 2.0 * (p2 * C3 - Math.floor(p2 * C3)) - 1.0;
  const gy2 = Math.abs(gx2) - 0.5;
  const ox2 = Math.floor(gx2 + 0.5);
  const ax2 = gx2 - ox2;

  m0 *= 1.79284291400159 - 0.85373472095314 * (ax0 * ax0 + gy0 * gy0);
  m1 *= 1.79284291400159 - 0.85373472095314 * (ax1 * ax1 + gy1 * gy1);
  m2 *= 1.79284291400159 - 0.85373472095314 * (ax2 * ax2 + gy2 * gy2);

  const g0 = ax0 * x0 + gy0 * y0;
  const g1 = ax1 * x1 + gy1 * y1;
  const g2 = ax2 * x2 + gy2 * y2;

  return 130.0 * (m0 * g0 + m1 * g1 + m2 * g2);
}

function sdRoundBox2D(px: number, pz: number, cx: number, cz: number, hx: number, hz: number, r: number): number {
  const dx = Math.abs(px - cx) - (hx - r);
  const dz = Math.abs(pz - cz) - (hz - r);
  const ox = Math.max(dx, 0);
  const oz = Math.max(dz, 0);
  return Math.hypot(ox, oz) + Math.min(Math.max(dx, dz), 0) - r;
}

/**
 * Signed distance into Vice City ocean across Vice Downtown (South Island),
 * Northport + Airport (North Island), Wide Ocean Channel (z in -75..75),
 * and the 2 distant Tropical Safehouse Islands (Paradise Key & Starlight Atoll).
 * Positive inside water, negative on land.
 */
export function getWaterShoreDistance(x: number, z: number): number {
  const dSouth = sdRoundBox2D(x, z, 25, 1525, 1775, 1150, 70);
  const dNorth = sdRoundBox2D(x, z, -25, -1537.5, 1725, 1162.5, 70);
  const dAirSouth = sdRoundBox2D(x, z, -2175, 1550, 425, 420, 36);
  const dAirNorth = sdRoundBox2D(x, z, -2175, -1550, 425, 420, 36);
  const dIsland1 = sdRoundBox2D(x, z, 2650, 1100, 220, 220, 90);
  const dIsland2 = sdRoundBox2D(x, z, 2650, -1100, 220, 220, 90);
  return Math.min(dSouth, dNorth, dAirSouth, dAirNorth, dIsland1, dIsland2);
}

/**
 * Deterministic multi-layered displacement map height (directional ocean swells + 2-octave
 * Simplex Noise displacement) matching the GLSL vertex shader, centered strictly around y = 0.0.
 */
export function getWaterWaveHeight(x: number, z: number, timeSec: number, stormFactor = 0): number {
  const shoreDist = Math.max(0, getWaterShoreDistance(x, z));
  const t = Math.min(1, shoreDist / 26);
  const smoothShore = t * t * (3 - 2 * t);
  const ampScale = (0.08 + 0.72 * smoothShore) * (1 + stormFactor * 0.35);

  const p1 = (x * -0.92 + z * 0.39) * 0.105 + timeSec * 1.45;
  const p2 = (x * -0.55 + z * -0.835) * 0.165 + timeSec * 1.85;
  const swell = Math.sin(p1) * 0.17 + Math.sin(p2) * 0.1;

  const sx1 = x * 0.055 - timeSec * 0.32;
  const sy1 = z * 0.055 + timeSec * 0.21;
  const sx2 = x * 0.125 + timeSec * 0.44;
  const sy2 = z * 0.125 - timeSec * 0.38;
  const simplexWaves = simplex2D(sx1, sy1) * 0.12 + simplex2D(sx2, sy2) * 0.055;

  return Math.max(-0.15, Math.min(0.15, (swell + simplexWaves) * ampScale));
}

const GLSL_SIMPLEX_2D = `
  vec3 mod289_3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289_2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute_3(vec3 x) { return mod289_3(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(
      0.211324865405187,
      0.366025403784439,
      -0.577350269189626,
      0.024390243902439
    );
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod289_2(i);
    vec3 p = permute_3(permute_3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
`;

export interface OceanWaterSystem {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  update: (
    timeSec: number,
    sunDir: THREE.Vector3,
    skyTop: THREE.Color,
    skyHorizon: THREE.Color,
    stormFactor: number
  ) => void;
}

export function createAnimatedOceanWater(waterNormalTex: THREE.Texture): OceanWaterSystem {
  const geo = new THREE.PlaneGeometry(7800, 7400, 220, 200);
  geo.rotateX(-Math.PI / 2);

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    uniforms: {
      uTime: { value: 0 },
      uNormalMap: { value: waterNormalTex },
      uSunDir: { value: new THREE.Vector3(0.6, 0.5, -0.3).normalize() },
      uSkyTop: { value: new THREE.Color(0x154794) },
      uSkyHorizon: { value: new THREE.Color(0x7cb8e8) },
      uShallowColor: { value: new THREE.Color(0x10a5a8) },
      uMidColor: { value: new THREE.Color(0x07688a) },
      uDeepColor: { value: new THREE.Color(0x03263d) },
      uStorm: { value: 0.0 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uStorm;

      varying vec3 vWorldPos;
      varying vec3 vWaveNormal;
      varying float vWaveH;
      varying float vSteepness;

      ${GLSL_SIMPLEX_2D}

      float sdRoundBox(vec2 p, vec2 c, vec2 h, float r) {
        vec2 d = abs(p - c) - (h - r);
        return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
      }

      float evalShoreSignedDist(vec2 xz) {
        float dSouth = sdRoundBox(xz, vec2(25.0, 1525.0), vec2(1775.0, 1150.0), 70.0);
        float dNorth = sdRoundBox(xz, vec2(-25.0, -1537.5), vec2(1725.0, 1162.5), 70.0);
        float dAirSouth = sdRoundBox(xz, vec2(-2175.0, 1550.0), vec2(425.0, 420.0), 36.0);
        float dAirNorth = sdRoundBox(xz, vec2(-2175.0, -1550.0), vec2(425.0, 420.0), 36.0);
        float dIsland1 = sdRoundBox(xz, vec2(2650.0, 1100.0), vec2(220.0, 220.0), 90.0);
        float dIsland2 = sdRoundBox(xz, vec2(2650.0, -1100.0), vec2(220.0, 220.0), 90.0);
        return min(dSouth, min(dNorth, min(dAirSouth, min(dAirNorth, min(dIsland1, dIsland2)))));
      }

      float evalDisplacementHeight(vec2 xz, float ampScale) {
        vec2 d1 = vec2(-0.92, 0.39);
        vec2 d2 = vec2(-0.55, -0.835);
        float p1 = dot(d1, xz) * 0.105 + uTime * 1.45;
        float p2 = dot(d2, xz) * 0.165 + uTime * 1.85;
        float swell = sin(p1) * 0.17 + sin(p2) * 0.10;

        float sn1 = snoise(xz * 0.055 + vec2(-uTime * 0.32, uTime * 0.21)) * 0.12;
        float sn2 = snoise(xz * 0.125 + vec2(uTime * 0.44, -uTime * 0.38)) * 0.055;
        return clamp((swell + sn1 + sn2) * ampScale, -0.15, 0.15);
      }

      void main() {
        vec4 worldBase = modelMatrix * vec4(position, 1.0);
        float signedDist = evalShoreSignedDist(worldBase.xz);
        float shoreDist = max(0.0, signedDist);
        float ampScale = mix(0.08, 0.80, smoothstep(0.0, 26.0, shoreDist)) * (1.0 + uStorm * 0.35);

        float hCenter = evalDisplacementHeight(worldBase.xz, ampScale);

        float eps = 0.55;
        float hRight = evalDisplacementHeight(worldBase.xz + vec2(eps, 0.0), ampScale);
        float hLeft = evalDisplacementHeight(worldBase.xz - vec2(eps, 0.0), ampScale);
        float hFwd = evalDisplacementHeight(worldBase.xz + vec2(0.0, eps), ampScale);
        float hBack = evalDisplacementHeight(worldBase.xz - vec2(0.0, eps), ampScale);

        float dHx = (hRight - hLeft) / (2.0 * eps);
        float dHz = (hFwd - hBack) / (2.0 * eps);
        vec3 waveN = normalize(vec3(-dHx, 1.0, -dHz));

        worldBase.x += -dHx * 0.28;
        worldBase.z += -dHz * 0.28;
        worldBase.y += hCenter;

        vWorldPos = worldBase.xyz;
        vWaveNormal = waveN;
        vWaveH = hCenter;
        vSteepness = clamp((1.0 - waveN.y) * 7.5 + max(0.0, hCenter) * 1.4, 0.0, 1.0);

        gl_Position = projectionMatrix * viewMatrix * worldBase;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform sampler2D uNormalMap;
      uniform vec3 uSunDir;
      uniform vec3 uSkyTop;
      uniform vec3 uSkyHorizon;
      uniform vec3 uShallowColor;
      uniform vec3 uMidColor;
      uniform vec3 uDeepColor;
      uniform float uStorm;

      varying vec3 vWorldPos;
      varying vec3 vWaveNormal;
      varying float vWaveH;
      varying float vSteepness;

      ${GLSL_SIMPLEX_2D}

      float sdRoundBoxF(vec2 p, vec2 c, vec2 h, float r) {
        vec2 d = abs(p - c) - (h - r);
        return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
      }

      float evalShoreOffset(vec2 xz) {
        float dSouth = sdRoundBoxF(xz, vec2(25.0, 1525.0), vec2(1775.0, 1150.0), 70.0);
        float dNorth = sdRoundBoxF(xz, vec2(-25.0, -1537.5), vec2(1725.0, 1162.5), 70.0);
        float dAirSouth = sdRoundBoxF(xz, vec2(-2175.0, 1550.0), vec2(425.0, 420.0), 36.0);
        float dAirNorth = sdRoundBoxF(xz, vec2(-2175.0, -1550.0), vec2(425.0, 420.0), 36.0);
        float dIsland1 = sdRoundBoxF(xz, vec2(2650.0, 1100.0), vec2(220.0, 220.0), 90.0);
        float dIsland2 = sdRoundBoxF(xz, vec2(2650.0, -1100.0), vec2(220.0, 220.0), 90.0);
        return min(dSouth, min(dNorth, min(dAirSouth, min(dAirNorth, min(dIsland1, dIsland2)))));
      }

      void main() {
        float shoreOffset = evalShoreOffset(vWorldPos.xz);

        // Discard cleanly beneath interior island landmasses so water never bleeds into streets
        if (shoreOffset < -3.5) discard;

        vec2 uv1 = vWorldPos.xz * 0.032 + vec2(uTime * 0.021, uTime * 0.013);
        vec2 uv2 = vWorldPos.xz * 0.068 - vec2(uTime * 0.017, uTime * 0.027);
        vec2 uv3 = vWorldPos.xz * 0.145 + vec2(-uTime * 0.029, uTime * 0.019);

        vec3 n1 = texture2D(uNormalMap, uv1).xyz * 2.0 - 1.0;
        vec3 n2 = texture2D(uNormalMap, uv2).xyz * 2.0 - 1.0;
        vec3 n3 = texture2D(uNormalMap, uv3).xyz * 2.0 - 1.0;

        float rippleAmp = 0.36 + uStorm * 0.24;
        vec3 microPerturb = vec3(
          (n1.x * 0.5 + n2.x * 0.35 + n3.x * 0.22) * rippleAmp,
          0.0,
          (n1.y * 0.5 + n2.y * 0.35 + n3.y * 0.22) * rippleAmp
        );
        vec3 N = normalize(vWaveNormal + microPerturb);

        vec3 V = normalize(cameraPosition - vWorldPos);
        float NdotV = clamp(dot(N, V), 0.0, 1.0);

        float fresnel = 0.025 + 0.975 * pow(1.0 - NdotV, 5.0);
        fresnel = clamp(fresnel * 0.92 + 0.05, 0.0, 0.92);

        float shallowMask = clamp(shoreOffset / 18.0, 0.0, 1.0);
        float deepMask = clamp(shoreOffset / 70.0, 0.0, 1.0);
        vec3 waterBody = mix(uShallowColor, uMidColor, smoothstep(0.0, 1.0, shallowMask));
        waterBody = mix(waterBody, uDeepColor, smoothstep(0.15, 1.0, deepMask));

        float sss = pow(max(dot(V, -uSunDir + N * 0.55), 0.0), 3.2) * clamp(vWaveH * 3.0 + 0.35, 0.0, 1.0);
        waterBody += vec3(0.03, 0.24, 0.26) * sss * (1.0 - uStorm * 0.7);

        vec3 R = reflect(-V, N);
        float skyGrad = clamp(R.y * 0.85 + 0.12, 0.0, 1.0);
        vec3 skyRefl = mix(uSkyHorizon, uSkyTop, pow(skyGrad, 0.75));
        float sunHalo = pow(max(dot(R, uSunDir), 0.0), 16.0) * (0.28 - uStorm * 0.22);
        vec3 sunWarm = mix(vec3(1.0, 0.88, 0.68), vec3(0.55, 0.65, 0.78), uStorm);
        skyRefl += sunWarm * sunHalo;

        vec3 H = normalize(uSunDir + V);
        float NdotH = max(dot(N, H), 0.0);
        float specSharp = pow(NdotH, 260.0) * (0.85 - uStorm * 0.65);
        float specBroad = pow(NdotH, 36.0) * (0.12 - uStorm * 0.08);
        vec3 specular = sunWarm * (specSharp + specBroad);

        float swashWave =
          sin((vWorldPos.z + vWorldPos.x) * 0.11 + uTime * 1.35) * 1.25 +
          snoise(vec2(vWorldPos.z * 0.08, uTime * 0.35)) * 1.15;
        float foamNoise =
          0.5 +
          0.35 * snoise(vWorldPos.xz * 0.26 + vec2(-uTime * 0.28, uTime * 0.11)) +
          0.2 * snoise(vWorldPos.xz * 0.62 - vec2(uTime * 0.42, 0.0));

        float surfCoord = shoreOffset - swashWave;
        float edgeFoam = smoothstep(3.6, -0.4, surfCoord) * smoothstep(-2.4, -0.2, surfCoord);
        edgeFoam *= smoothstep(0.32, 0.72, foamNoise);

        float surfPhase = surfCoord * 0.65 + uTime * 1.75;
        float surfBands = pow(max(0.0, sin(surfPhase)), 4.0) * smoothstep(14.0, 1.5, surfCoord) * smoothstep(-1.0, 1.2, surfCoord);
        surfBands *= smoothstep(0.36, 0.74, foamNoise);

        float crestMask = smoothstep(0.14, 0.30, vWaveH + vSteepness * 0.14);
        float crestFoam = crestMask * smoothstep(0.45 - uStorm * 0.14, 0.76, foamNoise) * (0.48 + uStorm * 0.42);

        float totalFoam = clamp(edgeFoam * 0.92 + surfBands * 0.75 + crestFoam, 0.0, 1.0);

        vec3 color = mix(waterBody, skyRefl, fresnel) + specular;
        vec3 foamColor = mix(vec3(0.76, 0.83, 0.86), vec3(0.54, 0.60, 0.65), uStorm);
        color = mix(color, foamColor, totalFoam);

        float dist = length(cameraPosition - vWorldPos);
        float fogAmt = 1.0 - exp(-0.00018 * dist * 0.00018 * dist);
        color = mix(color, uSkyHorizon, clamp(fogAmt, 0.0, 0.85));

        float shoreFeather = smoothstep(-2.2, 0.8, surfCoord);
        float alpha = shoreFeather * clamp(mix(0.72, 0.95, shallowMask * 0.85 + totalFoam * 0.35), 0.0, 0.97);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(150, -0.35, 0);

  return {
    mesh,
    material,
    update(timeSec, sunDir, skyTop, skyHorizon, stormFactor) {
      material.uniforms.uTime.value = timeSec;
      material.uniforms.uSunDir.value.copy(sunDir).normalize();
      material.uniforms.uSkyTop.value.copy(skyTop);
      material.uniforms.uSkyHorizon.value.copy(skyHorizon);
      material.uniforms.uStorm.value = stormFactor;
    },
  };
}

/**
 * Animated GLSL ripple & Fresnel shader material for park fountains.
 */
export function createAnimatedFountainWaterMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.6, 0.6, -0.3).normalize() },
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying vec3 vLocalPos;
      varying vec3 vNormalW;

      void main() {
        vLocalPos = position;
        float r = length(position.xz);
        float ripple = sin(r * 9.0 - uTime * 5.2) * 0.025 * smoothstep(0.1, 3.0, r);
        vec3 displaced = position + vec3(0.0, ripple, 0.0);
        vec4 wp = modelMatrix * vec4(displaced, 1.0);
        vWorldPos = wp.xyz;

        float dr = cos(r * 9.0 - uTime * 5.2) * 0.22;
        vec2 dir = r > 0.01 ? position.xz / r : vec2(0.0);
        vNormalW = normalize((modelMatrix * vec4(-dir.x * dr, 1.0, -dir.y * dr, 0.0)).xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      varying vec3 vWorldPos;
      varying vec3 vLocalPos;
      varying vec3 vNormalW;

      void main() {
        vec3 N = normalize(vNormalW);
        vec3 V = normalize(cameraPosition - vWorldPos);
        float fresnel = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 4.0);
        float r = length(vLocalPos.xz);
        float ring = pow(max(0.0, sin(r * 10.0 - uTime * 5.2)), 6.0) * 0.35;
        vec3 base = vec3(0.05, 0.42, 0.54);
        vec3 sky = vec3(0.45, 0.72, 0.92);
        vec3 H = normalize(uSunDir + V);
        float spec = pow(max(dot(N, H), 0.0), 96.0) * 0.75;
        vec3 col = mix(base, sky, fresnel * 0.65) + vec3(0.75, 0.88, 0.94) * ring + vec3(1.0, 0.92, 0.8) * spec;
        gl_FragColor = vec4(col, 0.86);
      }
    `,
  });
}
