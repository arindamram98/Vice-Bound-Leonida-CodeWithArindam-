import { getWaterWaveHeight } from './water';

export interface RigidBodyVehicleInput {
  x: number;
  y: number;
  z: number;
  yaw: number;
  vx: number;
  vz: number;
  angVel: number;
  speed: number;
  halfWidth: number;
  halfLength: number;
  mass: number;
  health: number;
  maxHealth: number;
  isBoat: boolean;
  isBike: boolean;
  isAir: boolean;
  tireFlat: boolean;
}

export interface RigidBodyContactResult {
  collided: boolean;
  impactSpeed: number;
}

/**
 * 2D Oriented Bounding Box (OBB) corner projection for accurate rigid-body vehicle-to-vehicle collisions
 * with separation impulse, rotational torque deflection, and restitution.
 */
export function resolveVehicleOBBCollision(
  a: RigidBodyVehicleInput,
  b: RigidBodyVehicleInput
): RigidBodyContactResult {
  if (Math.abs(a.y - b.y) > 2.2) return { collided: false, impactSpeed: 0 };

  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const maxReach = a.halfLength + b.halfLength + a.halfWidth + b.halfWidth;
  if (dx * dx + dz * dz > maxReach * maxReach) {
    return { collided: false, impactSpeed: 0 };
  }

  const axes = [
    { x: Math.cos(a.yaw), z: -Math.sin(a.yaw) },
    { x: Math.sin(a.yaw), z: Math.cos(a.yaw) },
    { x: Math.cos(b.yaw), z: -Math.sin(b.yaw) },
    { x: Math.sin(b.yaw), z: Math.cos(b.yaw) },
  ];

  const aRightX = axes[0].x;
  const aRightZ = axes[0].z;
  const aFwdX = axes[1].x;
  const aFwdZ = axes[1].z;

  const bRightX = axes[2].x;
  const bRightZ = axes[2].z;
  const bFwdX = axes[3].x;
  const bFwdZ = axes[3].z;

  let minOverlap = Infinity;
  let bestAxisX = 0;
  let bestAxisZ = 0;

  for (const axis of axes) {
    const projA =
      Math.abs(aRightX * axis.x + aRightZ * axis.z) * a.halfWidth +
      Math.abs(aFwdX * axis.x + aFwdZ * axis.z) * a.halfLength;
    const projB =
      Math.abs(bRightX * axis.x + bRightZ * axis.z) * b.halfWidth +
      Math.abs(bFwdX * axis.x + bFwdZ * axis.z) * b.halfLength;
    const centerDist = Math.abs(dx * axis.x + dz * axis.z);
    const overlap = projA + projB - centerDist;
    if (overlap <= 0) return { collided: false, impactSpeed: 0 };
    if (overlap < minOverlap) {
      minOverlap = overlap;
      const sign = dx * axis.x + dz * axis.z >= 0 ? 1 : -1;
      bestAxisX = axis.x * sign;
      bestAxisZ = axis.z * sign;
    }
  }

  // Separate along Minimum Translation Vector (normal points A -> B)
  const invMassA = 1 / Math.max(0.5, a.mass);
  const invMassB = 1 / Math.max(0.5, b.mass);
  const totalInv = invMassA + invMassB;

  a.x -= bestAxisX * minOverlap * (invMassA / totalInv);
  a.z -= bestAxisZ * minOverlap * (invMassA / totalInv);
  b.x += bestAxisX * minOverlap * (invMassB / totalInv);
  b.z += bestAxisZ * minOverlap * (invMassB / totalInv);

  // Relative velocity along contact normal
  const relVx = b.vx - a.vx;
  const relVz = b.vz - a.vz;
  const sepVel = relVx * bestAxisX + relVz * bestAxisZ;
  if (sepVel > 0) return { collided: true, impactSpeed: 0 };

  const restitution = 0.36;
  const impulseMag = (-(1 + restitution) * sepVel) / totalInv;

  a.vx -= bestAxisX * impulseMag * invMassA;
  a.vz -= bestAxisZ * impulseMag * invMassA;
  b.vx += bestAxisX * impulseMag * invMassB;
  b.vz += bestAxisZ * impulseMag * invMassB;

  // Rotational spin torque on corner impacts
  const crossSpin = (aFwdX * bestAxisZ - aFwdZ * bestAxisX) * impulseMag * 0.08;
  a.angVel -= crossSpin * invMassA;
  b.angVel += crossSpin * invMassB;

  // Project updated world velocities back into forward vehicle speed
  a.speed = a.vx * aFwdX + a.vz * aFwdZ;
  b.speed = b.vx * bFwdX + b.vz * bFwdZ;

  const impactSpeed = Math.abs(sepVel);
  if (impactSpeed > 4.5) {
    const dmg = Math.min(18, impactSpeed * 0.42);
    a.health = Math.max(5, a.health - dmg * (invMassA / totalInv) * 1.4);
    b.health = Math.max(5, b.health - dmg * (invMassB / totalInv) * 1.4);
  }

  return { collided: true, impactSpeed };
}

/**
 * Buoyancy spring & wave pitch/roll solver for boats in ocean water.
 */
export function computeBoatBuoyancyPose(
  x: number,
  z: number,
  yaw: number,
  speed: number,
  timeSec: number,
  stormFactor = 0
): { y: number; pitch: number; roll: number } {
  const fwdX = Math.sin(yaw);
  const fwdZ = Math.cos(yaw);
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);

  const hCenter = getWaterWaveHeight(x, z, timeSec, stormFactor);
  const hBow = getWaterWaveHeight(x + fwdX * 2.4, z + fwdZ * 2.4, timeSec, stormFactor);
  const hStern = getWaterWaveHeight(x - fwdX * 2.4, z - fwdZ * 2.4, timeSec, stormFactor);
  const hPort = getWaterWaveHeight(x - rightX * 1.1, z - rightZ * 1.1, timeSec, stormFactor);
  const hStarboard = getWaterWaveHeight(x + rightX * 1.1, z + rightZ * 1.1, timeSec, stormFactor);

  const wavePitch = Math.atan2(hStern - hBow, 4.8);
  const planingBowLift = -Math.min(0.18, Math.max(0, speed) * 0.0055);
  const waveRoll = Math.atan2(hPort - hStarboard, 2.2);

  return {
    y: -0.35 + hCenter + 0.08 + Math.min(0.12, Math.abs(speed) * 0.003),
    pitch: wavePitch + planingBowLift,
    roll: waveRoll,
  };
}
