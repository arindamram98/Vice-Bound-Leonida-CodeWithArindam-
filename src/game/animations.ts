import * as THREE from 'three';
import { CharacterRig, VehicleRig, WildlifeRig } from './models';
import { PlayerActionState, ProtagonistState, VehicleState, VehicleTier } from './types';

export interface CharacterAnimContext {
  walkPhase: number;
  attackSwingTimer: number;
  actionTimer: number;
  isBoarding: boolean;
  isRidingBike: boolean;
  aiming: boolean;
  timeSec: number;
  isMoving: boolean;
  sprinting: boolean;
  boardingProgress?: number;
  exitingProgress?: number;
  steerAngle?: number;
  ducking?: boolean;
  vehicleTier?: VehicleTier;
  blocking?: boolean;
  fishing?: boolean;
  fishingReeling?: boolean;
}

/**
 * Articulated procedural skeletal animation blender with shoulders, elbows, hips, knees,
 * Vehicle Enter/Sit/Drive/Exit across all vehicle tiers, Swimming, Skydiving, Jobs, Gym & Drinks.
 */
export function animateProtagonistRig(
  rig: CharacterRig,
  state: ProtagonistState,
  ctx: CharacterAnimContext,
  dt: number
) {
  const {
    walkPhase,
    attackSwingTimer,
    actionTimer,
    isBoarding,
    isRidingBike,
    aiming,
    timeSec,
    isMoving,
    sprinting,
    boardingProgress = 0,
    exitingProgress = 0,
    steerAngle = 0,
    ducking = false,
    vehicleTier,
  } = ctx;
  const act: PlayerActionState = state.actionState;

  // Per-frame attached prop visibility
  rig.phoneMesh.visible = act === 'phone';
  rig.spatulaMesh.visible = act === 'cook';
  rig.mopGroup.visible = act === 'mop';
  rig.fishingRodGroup.visible = Boolean(ctx.fishing) && act !== 'sit_drive';
  rig.coffeeCupMesh.visible = act === 'drink';
  rig.burgerBoxMesh.visible = Boolean(state.carryingBurgerBox) && act !== 'sit_drive' && act !== 'enter_vehicle';

  if (state.isSitting && act !== 'sit_drive' && act !== 'enter_vehicle' && act !== 'exit_vehicle' && !isRidingBike) {
    rig.bodyGroup.rotation.set(0, 0, 0);
    rig.torso.rotation.set(0, 0, 0);
    rig.headGroup.rotation.set(0, 0, 0);
    rig.leftCalf.rotation.x = THREE.MathUtils.lerp(rig.leftCalf.rotation.x, 1.45, 1 - Math.exp(-14 * dt));
    rig.rightCalf.rotation.x = THREE.MathUtils.lerp(rig.rightCalf.rotation.x, 1.45, 1 - Math.exp(-14 * dt));
    rig.leftForearm.rotation.x = THREE.MathUtils.lerp(rig.leftForearm.rotation.x, -0.55, 1 - Math.exp(-14 * dt));
    rig.rightForearm.rotation.x = THREE.MathUtils.lerp(rig.rightForearm.rotation.x, -0.55, 1 - Math.exp(-14 * dt));
    return;
  }

  let targetBodyY = 0;
  let targetBodyRotX = 0;
  let targetBodyRotZ = 0;
  let lLegX = 0;
  let rLegX = 0;
  let lKneeX = 0.04;
  let rKneeX = 0.04;
  let lLegZ = 0;
  let rLegZ = 0;
  let lArmX = 0;
  let rArmX = 0;
  let lElbowX = -0.12;
  let rElbowX = -0.12;
  let lArmZ = 0;
  let rArmZ = 0;
  let headX = 0;
  let headY = 0;

  if (act === 'enter_vehicle') {
    const t = THREE.MathUtils.clamp(boardingProgress, 0, 1);
    const isBikeTier = vehicleTier === 'bike';
    const isBoatTier = vehicleTier === 'boat';
    if (t < 0.35) {
      const u = t / 0.35;
      lArmX = THREE.MathUtils.lerp(0, -1.25, u);
      rArmX = THREE.MathUtils.lerp(0, isBoatTier ? -0.95 : -0.45, u);
      lElbowX = -0.45 * u;
      rElbowX = -0.35 * u;
      lLegX = isBoatTier ? -Math.sin(u * Math.PI) * 0.75 : Math.sin(u * Math.PI) * 0.45;
      lKneeX = isBoatTier ? 0.9 * u : 0.35;
      rLegX = -Math.sin(u * Math.PI) * 0.35;
      targetBodyRotX = 0.08 * u;
    } else if (t < 0.72) {
      const u = (t - 0.35) / 0.37;
      targetBodyY = isBikeTier
        ? THREE.MathUtils.lerp(0, 0.16, Math.sin(u * Math.PI))
        : isBoatTier
        ? THREE.MathUtils.lerp(0.18, -0.18, u)
        : THREE.MathUtils.lerp(0, -0.34, u);
      targetBodyRotX = isBikeTier ? 0.18 : 0.22;
      targetBodyRotZ = isBikeTier ? -0.18 * Math.sin(u * Math.PI) : 0.18 * Math.sin(u * Math.PI);
      lLegX = isBikeTier ? -0.95 * u : THREE.MathUtils.lerp(0.2, -1.35, u);
      rLegX = THREE.MathUtils.lerp(-0.15, -1.15, u);
      lKneeX = isBikeTier ? 1.05 : 1.15;
      rKneeX = isBikeTier ? 0.9 : 1.05;
      if (isBikeTier) {
        lLegZ = 0.28 * u;
        rLegZ = -0.28 * u;
      }
      lArmX = -1.05;
      rArmX = -0.95;
      lElbowX = -0.65;
      rElbowX = -0.65;
    } else {
      const u = (t - 0.72) / 0.28;
      if (isBikeTier) {
        targetBodyY = 0.04;
        targetBodyRotX = 0.2;
        lLegX = -0.78;
        rLegX = -0.78;
        lKneeX = 0.95;
        rKneeX = 0.95;
        lLegZ = 0.24;
        rLegZ = -0.24;
        lArmX = -0.82;
        rArmX = -0.82;
        lElbowX = -0.58;
        rElbowX = -0.58;
      } else {
        targetBodyY = THREE.MathUtils.lerp(-0.34, -0.5, u);
        targetBodyRotX = THREE.MathUtils.lerp(0.22, -0.04, u);
        lLegX = THREE.MathUtils.lerp(-1.35, -1.46, u);
        rLegX = THREE.MathUtils.lerp(-1.15, -1.46, u);
        lKneeX = THREE.MathUtils.lerp(1.15, 1.4, u);
        rKneeX = THREE.MathUtils.lerp(1.05, 1.4, u);
        lArmX = -0.78;
        rArmX = -0.78;
        lElbowX = -0.72;
        rElbowX = -0.72;
      }
    }
  } else if (act === 'sit_drive' || isRidingBike) {
    if (isRidingBike || vehicleTier === 'bike') {
      targetBodyY = 0.04;
      targetBodyRotX = 0.2;
      targetBodyRotZ = -steerAngle * 0.28;
      lLegX = -0.78;
      rLegX = -0.78;
      lKneeX = 0.95;
      rKneeX = 0.95;
      lLegZ = 0.24;
      rLegZ = -0.24;
      lArmX = -0.82 + steerAngle * 0.22;
      rArmX = -0.82 - steerAngle * 0.22;
      lElbowX = -0.55;
      rElbowX = -0.55;
      headY = steerAngle * 0.25;
    } else if (vehicleTier === 'heli' || vehicleTier === 'plane') {
      // Pilot collective + flight stick pose
      targetBodyY = -0.48;
      targetBodyRotX = -0.05;
      lLegX = -1.45;
      rLegX = -1.45;
      lKneeX = 1.38;
      rKneeX = 1.38;
      lArmX = -0.68;
      rArmX = -0.78 + steerAngle * 0.18;
      lElbowX = -0.85;
      rElbowX = -0.78;
      headY = steerAngle * 0.28;
    } else if (vehicleTier === 'boat') {
      targetBodyY = -0.44;
      targetBodyRotX = -0.04;
      targetBodyRotZ = -steerAngle * 0.14;
      lLegX = -1.38;
      rLegX = -1.38;
      lKneeX = 1.3;
      rKneeX = 1.3;
      lArmX = -0.82 + steerAngle * 0.25;
      rArmX = -0.78 - steerAngle * 0.25;
      lElbowX = -0.7;
      rElbowX = -0.7;
      headY = steerAngle * 0.3;
    } else {
      targetBodyY = ducking ? -0.72 : -0.5;
      targetBodyRotX = ducking ? 0.34 : -0.05;
      targetBodyRotZ = -steerAngle * 0.12;
      lLegX = -1.46;
      rLegX = -1.46;
      lKneeX = 1.42;
      rKneeX = 1.42;
      lArmX = ducking ? -0.6 : -0.82 + steerAngle * 0.28;
      rArmX = ducking ? -0.6 : -0.82 - steerAngle * 0.28;
      lElbowX = ducking ? -0.45 : -0.72;
      rElbowX = ducking ? -0.45 : -0.72;
      lArmZ = -0.14;
      rArmZ = 0.14;
      headX = ducking ? 0.32 : 0.04;
      headY = steerAngle * 0.3;
    }
  } else if (act === 'exit_vehicle') {
    const t = THREE.MathUtils.clamp(exitingProgress, 0, 1);
    const isBikeTier = vehicleTier === 'bike';
    targetBodyY = isBikeTier ? THREE.MathUtils.lerp(0.04, 0, t) : THREE.MathUtils.lerp(-0.48, 0, t);
    targetBodyRotX = 0.14 * (1 - t);
    lLegX = THREE.MathUtils.lerp(isBikeTier ? -0.78 : -1.44, 0, t) + Math.sin(t * Math.PI) * 0.32;
    rLegX = THREE.MathUtils.lerp(isBikeTier ? -0.78 : -1.44, 0, t) - Math.sin(t * Math.PI) * 0.24;
    lKneeX = THREE.MathUtils.lerp(isBikeTier ? 0.95 : 1.4, 0.08, t);
    rKneeX = THREE.MathUtils.lerp(isBikeTier ? 0.95 : 1.4, 0.08, t);
    lArmX = THREE.MathUtils.lerp(-0.85, 0, t);
    rArmX = THREE.MathUtils.lerp(-0.85, 0, t);
    lElbowX = THREE.MathUtils.lerp(-0.68, -0.12, t);
    rElbowX = THREE.MathUtils.lerp(-0.68, -0.12, t);
  } else if (act === 'knockdown') {
    targetBodyY = 0.25;
    targetBodyRotX = -Math.PI / 2.1;
    lArmZ = 0.55;
    rArmZ = -0.55;
    lKneeX = 0.28;
    rKneeX = 0.18;
  } else if (act === 'parachute' || state.parachuting) {
    targetBodyRotX = 0.14;
    lArmX = -2.25;
    rArmX = -2.25;
    lElbowX = -0.35;
    rElbowX = -0.35;
    lArmZ = 0.32;
    rArmZ = -0.32;
    lLegX = -0.35 + Math.sin(timeSec * 3.2) * 0.08;
    rLegX = -0.25 - Math.sin(timeSec * 3.2) * 0.08;
    lKneeX = 0.62;
    rKneeX = 0.68;
  } else if (state.inWater) {
    targetBodyRotX = state.underwater ? 1.35 : 1.22;
    targetBodyY = 0.68;
    const stroke = timeSec * (isMoving ? 7.5 : 3.0);
    lLegX = Math.sin(stroke) * 0.45;
    rLegX = -Math.sin(stroke) * 0.45;
    lKneeX = 0.25 + Math.max(0, Math.sin(stroke)) * 0.35;
    rKneeX = 0.25 + Math.max(0, -Math.sin(stroke)) * 0.35;
    lArmX = -1.5 + Math.cos(stroke) * 0.85;
    rArmX = -1.5 - Math.cos(stroke) * 0.85;
    lElbowX = -0.35 - Math.max(0, -Math.cos(stroke)) * 0.5;
    rElbowX = -0.35 - Math.max(0, Math.cos(stroke)) * 0.5;
  } else if (act === 'prone') {
    targetBodyRotX = 1.44;
    targetBodyY = 0.34;
    const crawl = isMoving ? Math.sin(walkPhase * 1.1) * 0.5 : 0;
    lArmX = -1.75 + crawl;
    rArmX = -1.75 - crawl;
    lElbowX = -0.85;
    rElbowX = -0.85;
    lLegX = -crawl * 0.45;
    rLegX = crawl * 0.45;
    lKneeX = 0.2;
    rKneeX = 0.2;
  } else if (act === 'slide') {
    targetBodyY = -0.36;
    targetBodyRotX = -0.45;
    lLegX = -1.05;
    lKneeX = 1.2;
    rLegX = 0.35;
    rKneeX = 0.25;
    lArmZ = 0.6;
    rArmX = -0.7;
    lElbowX = -0.5;
  } else if (act === 'crouch' || state.crouching) {
    targetBodyY = -0.28;
    targetBodyRotX = 0.16;
    const cSwing = isMoving ? Math.sin(walkPhase) * 0.36 : 0;
    lLegX = -0.58 + cSwing;
    rLegX = -0.58 - cSwing;
    lKneeX = 0.92;
    rKneeX = 0.92;
    lArmX = aiming ? -0.95 : -cSwing * 0.45;
    rArmX = aiming || state.equippedSlot !== 'unarmed' ? -1.08 : cSwing * 0.45;
    lElbowX = aiming ? -0.65 : -0.35;
    rElbowX = aiming || state.equippedSlot !== 'unarmed' ? -0.58 : -0.35;
  } else if (act === 'jump') {
    targetBodyY = 0.05;
    lLegX = -0.52;
    rLegX = 0.28;
    lKneeX = 0.95;
    rKneeX = 0.48;
    lArmX = -0.65;
    rArmX = -0.85;
    lElbowX = -0.55;
    rElbowX = -0.55;
  } else if (act === 'dodge') {
    targetBodyRotZ = Math.sin(actionTimer * 18) * 0.42;
    lArmX = -0.75;
    rArmX = -0.75;
    lElbowX = -0.75;
    rElbowX = -0.75;
    lKneeX = 0.45;
    rKneeX = 0.45;
  } else if (act === 'reload') {
    rArmX = -0.85;
    rElbowX = -0.82;
    lArmX = -0.95 + Math.sin(timeSec * 14) * 0.25;
    lElbowX = -0.92;
    lArmZ = -0.35;
  } else if (act === 'cook') {
    rArmX = -0.95 + Math.sin(timeSec * 7.5) * 0.3;
    rElbowX = -0.72 + Math.cos(timeSec * 7.5) * 0.28;
    lArmX = -0.45;
    lElbowX = -0.4;
    headX = 0.14;
  } else if (act === 'mop') {
    const sweep = Math.sin(timeSec * 6.5);
    rArmX = -0.75 + sweep * 0.3;
    lArmX = -0.75 - sweep * 0.25;
    lElbowX = -0.48;
    rElbowX = -0.48;
    targetBodyRotX = 0.15;
  } else if (act === 'gym') {
    rArmX = -1.2 + Math.sin(timeSec * 11) * 0.45;
    rElbowX = -0.65 - Math.cos(timeSec * 11) * 0.45;
    lArmX = -1.1 - Math.cos(timeSec * 11) * 0.4;
    lElbowX = -0.65 - Math.sin(timeSec * 11) * 0.4;
  } else if (act === 'phone') {
    lArmX = -0.92;
    lElbowX = -1.15;
    lArmZ = -0.22;
    headX = 0.18;
  } else if (act === 'drink') {
    // Tilt espresso cup smoothly to lips
    const sip = Math.sin(timeSec * 4.5);
    rArmX = -1.15 + sip * 0.18;
    rElbowX = -1.18 - sip * 0.18;
    headX = -0.06;
  } else if (act === 'eat') {
    rArmX = -1.05 + Math.sin(timeSec * 8) * 0.22;
    rElbowX = -1.15 + Math.sin(timeSec * 8) * 0.18;
    headX = 0.12;
  } else if (act === 'handover') {
    // Reach food box forward across counter/doorstep
    rArmX = -1.28;
    rElbowX = -0.35;
    lArmX = -0.95;
    lElbowX = -0.45;
    targetBodyRotX = 0.08;
  } else if (act === 'loot' || act === 'lockpick') {
    targetBodyY = -0.24;
    targetBodyRotX = 0.36;
    lKneeX = 0.72;
    rKneeX = 0.72;
    lArmX = -0.82 + Math.sin(timeSec * 10) * 0.18;
    rArmX = -0.82 - Math.sin(timeSec * 10) * 0.18;
    lElbowX = -0.58;
    rElbowX = -0.58;
  } else if (act === 'highfive') {
    rArmX = -2.05;
    rElbowX = -0.25;
    rArmZ = -0.2;
  } else if (ctx.blocking) {
    targetBodyY = -0.06;
    targetBodyRotX = 0.08;
    lArmX = -1.35;
    rArmX = -1.35;
    lElbowX = -1.42;
    rElbowX = -1.42;
    lArmZ = -0.35;
    rArmZ = 0.35;
    headX = 0.14;
  } else if (ctx.fishing) {
    const tug = ctx.fishingReeling ? Math.sin(timeSec * 16) * 0.24 : Math.sin(timeSec * 2.2) * 0.04;
    rArmX = -0.92 + tug;
    rElbowX = -0.62;
    lArmX = -0.82 - tug * 0.6;
    lElbowX = -0.88;
    headX = 0.1;
  } else {
    // Locomotion: Idle, Walk, Sprint, Injured Limp (< 35 HP), Umbrella, Carrying Box, ADS Aim
    const isInjured = state.health < 35 || state.bleeding;
    const isTired = state.stamina < 20;
    const rawSwing = isMoving ? Math.sin(walkPhase) : 0;
    const swing = rawSwing * (isInjured ? 0.34 : sprinting ? 0.72 : 0.48);

    if (!isMoving) {
      targetBodyY = Math.sin(timeSec * 2.4) * 0.015;
      if (isInjured || isTired) {
        targetBodyRotX = 0.14;
        headX = 0.16;
        lArmX = -0.18;
        rArmX = -0.25;
        rElbowX = -0.65;
      }
    } else {
      targetBodyRotX = isInjured ? 0.14 + Math.max(0, rawSwing) * 0.08 : sprinting ? 0.15 : 0.04;
      if (isInjured) {
        targetBodyRotZ = rawSwing * 0.09;
      }
    }

    lLegX = swing;
    rLegX = isInjured && isMoving ? -swing * 0.65 : -swing;

    // Articulated knee flexion on back-swing / sprint lift
    lKneeX = isMoving ? Math.max(0.06, -rawSwing * (sprinting ? 0.95 : 0.55) + 0.2) : 0.05;
    rKneeX = isMoving ? Math.max(0.06, rawSwing * (sprinting ? 0.95 : 0.55) + 0.2) : 0.05;

    if (state.carryingBurgerBox) {
      lArmX = -0.78;
      rArmX = -0.78;
      lElbowX = -0.88;
      rElbowX = -0.88;
    } else {
      if (state.umbrellaOpen) {
        lArmX = -1.15;
        lElbowX = -0.52;
        lArmZ = 0.1;
      } else if (aiming && state.equippedSlot !== 'unarmed') {
        lArmX = -1.05;
        lElbowX = -0.58;
        lArmZ = -0.28;
      } else {
        lArmX = -swing * 0.72;
        lElbowX = isMoving ? (sprinting ? -0.95 : -0.36 - Math.max(0, -rawSwing) * 0.32) : -0.14;
      }

      if (attackSwingTimer > 0 || isBoarding) {
        rArmX = -1.55;
        rElbowX = -0.35;
      } else if (aiming || state.equippedSlot !== 'unarmed') {
        rArmX = -1.25;
        rElbowX = -0.28;
      } else {
        rArmX = swing * 0.72;
        rElbowX = isMoving ? (sprinting ? -0.95 : -0.36 - Math.max(0, rawSwing) * 0.32) : -0.14;
      }
    }
  }

  const blend = 1 - Math.exp(-18 * dt);
  rig.bodyGroup.position.y = THREE.MathUtils.lerp(rig.bodyGroup.position.y, targetBodyY, blend);
  rig.bodyGroup.rotation.x = THREE.MathUtils.lerp(rig.bodyGroup.rotation.x, targetBodyRotX, blend);
  rig.bodyGroup.rotation.z = THREE.MathUtils.lerp(rig.bodyGroup.rotation.z, targetBodyRotZ, blend);
  rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, lLegX, blend);
  rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, rLegX, blend);
  rig.leftCalf.rotation.x = THREE.MathUtils.lerp(rig.leftCalf.rotation.x, lKneeX, blend);
  rig.rightCalf.rotation.x = THREE.MathUtils.lerp(rig.rightCalf.rotation.x, rKneeX, blend);
  rig.leftLeg.rotation.z = THREE.MathUtils.lerp(rig.leftLeg.rotation.z, lLegZ, blend);
  rig.rightLeg.rotation.z = THREE.MathUtils.lerp(rig.rightLeg.rotation.z, rLegZ, blend);
  rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, lArmX, blend);
  rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, rArmX, blend);
  rig.leftForearm.rotation.x = THREE.MathUtils.lerp(rig.leftForearm.rotation.x, lElbowX, blend);
  rig.rightForearm.rotation.x = THREE.MathUtils.lerp(rig.rightForearm.rotation.x, rElbowX, blend);
  rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, lArmZ, blend);
  rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, rArmZ, blend);
  rig.headGroup.rotation.x = THREE.MathUtils.lerp(rig.headGroup.rotation.x, headX, blend);
  rig.headGroup.rotation.y = THREE.MathUtils.lerp(rig.headGroup.rotation.y, headY, blend);
}

/**
 * Animates Vehicle doors, trunk, hood, convertible roof, windows, steering wheel, wheels, rotors, and outboard props.
 */
export function animateVehicleRig(
  rig: VehicleRig,
  state: VehicleState,
  steerAngle: number,
  wheelSpin: number,
  leftDoorAngle: number,
  rightDoorAngle: number,
  isActiveDriver: boolean,
  isFlying: boolean,
  timeSec: number,
  blinkerOnPhase: boolean,
  wantedStars: number,
  policeActive: boolean,
  dt: number
) {
  rig.leftDoorPivot.rotation.y = leftDoorAngle;
  rig.rightDoorPivot.rotation.y = rightDoorAngle;

  if (rig.wheelFL.children[0]) {
    rig.wheelFL.rotation.y = steerAngle;
    rig.wheelFL.children[0].rotation.x = wheelSpin;
  }
  if (rig.wheelFR.children[0]) {
    rig.wheelFR.rotation.y = steerAngle;
    rig.wheelFR.children[0].rotation.x = wheelSpin;
  }
  rig.wheelRL.rotation.x = wheelSpin;
  rig.wheelRR.rotation.x = wheelSpin;
  if (state.tireFlat) {
    rig.wheelRL.scale.set(1, 0.72, 1.08);
    rig.chassisGroup.position.y = Math.sin(wheelSpin * 2) * 0.03;
  } else {
    rig.wheelRL.scale.set(1, 1, 1);
    rig.chassisGroup.position.y = THREE.MathUtils.damp(rig.chassisGroup.position.y, 0, 10, dt);
  }

  if (rig.steeringWheel) {
    rig.steeringWheel.rotation.z = steerAngle * 2.4;
  }

  rig.trunkPivot.rotation.x = THREE.MathUtils.damp(rig.trunkPivot.rotation.x, state.trunkOpen ? -1.15 : 0, 10, dt);
  rig.hoodPivot.rotation.x = THREE.MathUtils.damp(rig.hoodPivot.rotation.x, state.hoodOpen ? 1.05 : 0, 10, dt);

  if (rig.convertibleRoof) {
    rig.convertibleRoof.visible = !state.convertibleOpen;
  }

  const targetWinScaleY = state.windowsDown ? 0.14 : 1;
  rig.leftWindow.scale.y = THREE.MathUtils.damp(rig.leftWindow.scale.y, targetWinScaleY, 12, dt);
  rig.rightWindow.scale.y = THREE.MathUtils.damp(rig.rightWindow.scale.y, targetWinScaleY, 12, dt);

  if (rig.mainRotor) {
    const spin = state.flooded ? 0 : isActiveDriver || isFlying ? 24 : 2.5;
    rig.mainRotor.rotation.y += dt * spin;
  }
  if (rig.tailRotor) {
    rig.tailRotor.rotation.x += dt * (state.flooded ? 0 : 30);
  }
  if (rig.propeller && (isActiveDriver || Math.abs(state.speed) > 1) && !state.flooded) {
    rig.propeller.rotation.z += dt * (10 + Math.abs(state.speed) * 1.5);
  }
  if (rig.outboardProps) {
    const pSpin = isActiveDriver || Math.abs(state.speed) > 0.5 ? 18 + Math.abs(state.speed) : 0;
    for (const op of rig.outboardProps) {
      op.rotation.z += dt * pSpin;
    }
  }
  if (rig.anchorMesh) {
    rig.anchorMesh.position.y = THREE.MathUtils.damp(rig.anchorMesh.position.y, state.anchorDropped ? -1.4 : 0.62, 6, dt);
  }

  const hlIntensity = state.headlightsOn && !state.flooded ? 1.85 : 0;
  (rig.headlightLeft.material as THREE.MeshStandardMaterial).emissiveIntensity = hlIntensity;
  (rig.headlightRight.material as THREE.MeshStandardMaterial).emissiveIntensity = hlIntensity;

  const lGlow = state.leftBlinker && blinkerOnPhase && !state.flooded ? 2.6 : 0;
  const rGlow = state.rightBlinker && blinkerOnPhase && !state.flooded ? 2.6 : 0;
  (rig.blinkerLeftFront.material as THREE.MeshStandardMaterial).emissiveIntensity = lGlow;
  (rig.blinkerLeftRear.material as THREE.MeshStandardMaterial).emissiveIntensity = lGlow;
  (rig.blinkerRightFront.material as THREE.MeshStandardMaterial).emissiveIntensity = rGlow;
  (rig.blinkerRightRear.material as THREE.MeshStandardMaterial).emissiveIntensity = rGlow;

  if (rig.lightbarRed && rig.lightbarBlue) {
    const active = (wantedStars > 0 || policeActive) && !state.flooded;
    const alt = Math.floor(timeSec * 9) % 2 === 0;
    (rig.lightbarRed.material as THREE.MeshStandardMaterial).emissiveIntensity = active && alt ? 3.2 : 0.2;
    (rig.lightbarBlue.material as THREE.MeshStandardMaterial).emissiveIntensity = active && !alt ? 3.2 : 0.2;
  }
}

export function animateNpcRig(
  rig: CharacterRig,
  walkPhase: number,
  options: {
    handsUp?: boolean;
    packing?: boolean;
    calling911?: boolean;
    umbrella?: boolean;
    checkingPhone?: boolean;
    aiming?: boolean;
    shoppingBag?: boolean;
    crouching?: boolean;
    recording?: boolean;
    boxing?: boolean;
    waving?: boolean;
    timeSec: number;
  }
) {
  rig.umbrellaGroup.visible = Boolean(options.umbrella);
  rig.phoneMesh.visible = Boolean(options.calling911 || options.checkingPhone || options.recording);
  rig.shoppingBagMesh.visible = Boolean(options.shoppingBag);

  if (options.crouching) {
    rig.bodyGroup.position.y = -0.3;
    rig.bodyGroup.rotation.x = 0.28;
    rig.leftLeg.rotation.x = -0.7;
    rig.rightLeg.rotation.x = -0.7;
    rig.leftCalf.rotation.x = 1.15;
    rig.rightCalf.rotation.x = 1.15;
    rig.leftArm.rotation.x = -1.65;
    rig.rightArm.rotation.x = -1.65;
    rig.leftForearm.rotation.x = -0.8;
    rig.rightForearm.rotation.x = -0.8;
    return;
  }

  rig.bodyGroup.position.y = 0;
  rig.bodyGroup.rotation.x = 0;

  if (options.packing) {
    const scoop = Math.sin(options.timeSec * 14);
    rig.bodyGroup.rotation.x = 0.14;
    rig.leftArm.rotation.x = -0.95 + scoop * 0.28;
    rig.rightArm.rotation.x = -0.95 - scoop * 0.28;
    rig.leftForearm.rotation.x = -0.75;
    rig.rightForearm.rotation.x = -0.75;
    rig.leftLeg.rotation.x = 0;
    rig.rightLeg.rotation.x = 0;
    rig.leftCalf.rotation.x = 0.08;
    rig.rightCalf.rotation.x = 0.08;
    return;
  }

  if (options.handsUp) {
    const shiver = Math.sin(options.timeSec * 22) * 0.045;
    rig.leftArm.rotation.x = -2.4 + shiver;
    rig.rightArm.rotation.x = -2.4 - shiver;
    rig.leftForearm.rotation.x = -0.25;
    rig.rightForearm.rotation.x = -0.25;
    rig.leftLeg.rotation.x = 0;
    rig.rightLeg.rotation.x = 0;
    rig.leftCalf.rotation.x = 0.05;
    rig.rightCalf.rotation.x = 0.05;
    return;
  }

  const s = Math.sin(walkPhase);
  if (options.recording) {
    rig.leftArm.rotation.x = -1.42;
    rig.leftForearm.rotation.x = -0.42;
    rig.headGroup.rotation.x = -0.04;
  } else if (options.calling911 || options.checkingPhone) {
    rig.leftArm.rotation.x = -0.92;
    rig.leftForearm.rotation.x = -1.15;
    rig.headGroup.rotation.x = 0.2;
  } else if (options.umbrella) {
    rig.leftArm.rotation.x = -1.15;
    rig.leftForearm.rotation.x = -0.5;
  } else if (options.shoppingBag) {
    rig.leftArm.rotation.x = -0.15;
    rig.leftForearm.rotation.x = -0.25;
  } else if (options.boxing) {
    const jab = Math.sin(options.timeSec * 8.5);
    rig.leftArm.rotation.x = -1.25 + jab * 0.45;
    rig.leftForearm.rotation.x = -0.85;
  } else {
    rig.leftArm.rotation.x = -s * 0.38;
    rig.leftForearm.rotation.x = -0.32 - Math.max(0, -s) * 0.28;
    rig.headGroup.rotation.x = 0;
  }

  if (options.waving) {
    rig.rightArm.rotation.x = -2.45;
    rig.rightArm.rotation.z = 0.25 + Math.sin(options.timeSec * 7.5) * 0.35;
    rig.rightForearm.rotation.x = -0.25;
  } else if (options.boxing) {
    const cross = Math.cos(options.timeSec * 8.5);
    rig.rightArm.rotation.x = -1.25 + cross * 0.45;
    rig.rightForearm.rotation.x = -0.85;
  } else if (options.aiming) {
    rig.rightArm.rotation.x = -1.25;
    rig.rightForearm.rotation.x = -0.32;
  } else {
    rig.rightArm.rotation.z = 0;
    rig.rightArm.rotation.x = s * 0.38;
    rig.rightForearm.rotation.x = -0.32 - Math.max(0, s) * 0.28;
  }

  const legSwing = s * 0.45;
  rig.leftLeg.rotation.x = legSwing;
  rig.rightLeg.rotation.x = -legSwing;
  rig.leftCalf.rotation.x = Math.max(0.06, -s * 0.55 + 0.16);
  rig.rightCalf.rotation.x = Math.max(0.06, s * 0.55 + 0.16);
  void options.timeSec;
}

export function animateWildlifeRig(
  rig: WildlifeRig,
  species: 'gator' | 'shark' | 'dolphin' | 'deer' | 'boar' | 'bird' | 'fish',
  timeSec: number
) {
  if (species === 'dolphin') {
    rig.tailGroup.rotation.x = Math.sin(timeSec * 7.5) * 0.45;
  } else if (species === 'bird') {
    rig.tailGroup.rotation.x = Math.sin(timeSec * 14) * 0.18;
    rig.tailGroup.scale.y = 1 + Math.sin(timeSec * 16) * 0.3;
  } else if (species === 'deer' || species === 'boar') {
    rig.root.position.y = Math.abs(Math.sin(timeSec * 7.5)) * 0.08;
    rig.tailGroup.rotation.y = Math.sin(timeSec * 6.5) * 0.22;
  } else if (species === 'fish') {
    rig.tailGroup.rotation.y = Math.sin(timeSec * 9.5) * 0.28;
  } else {
    rig.tailGroup.rotation.y = Math.sin(timeSec * (species === 'shark' ? 6.5 : 4.2)) * 0.42;
  }
}
