import * as THREE from 'three';
import { OutfitId, ProtagonistId, VehicleTier } from './types';
import { createAnimatedFountainWaterMaterial } from './water';
import { createStorefrontSignTexture } from './textures';

export interface CharacterRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  torso: THREE.Mesh;
  headGroup: THREE.Group;
  hairMesh: THREE.Mesh;
  beardMesh: THREE.Mesh;
  helmetMesh: THREE.Mesh;
  burgerCap: THREE.Group;
  burgerApron: THREE.Mesh;
  earphonesGroup: THREE.Group;
  leftArm: THREE.Group;
  leftForearm: THREE.Group;
  rightArm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  leftCalf: THREE.Group;
  rightLeg: THREE.Group;
  rightCalf: THREE.Group;
  slungGun: THREE.Group;
  heldGun: THREE.Group;
  batMesh: THREE.Mesh;
  rpgMesh: THREE.Group;
  suppressorMesh: THREE.Mesh;
  scopeMesh: THREE.Mesh;
  extMagMesh: THREE.Mesh;
  duffelBag: THREE.Group;
  umbrellaGroup: THREE.Group;
  phoneMesh: THREE.Mesh;
  coffeeCupMesh: THREE.Mesh;
  shoppingBagMesh: THREE.Group;
  burgerBoxMesh: THREE.Group;
  spatulaMesh: THREE.Mesh;
  mopGroup: THREE.Group;
  parachuteGroup: THREE.Group;
  witnessMarker: THREE.Mesh;
  torsoMat: THREE.MeshStandardMaterial;
  pantsMat: THREE.MeshStandardMaterial;
  hairMat: THREE.MeshStandardMaterial;
}

export interface VehicleRig {
  root: THREE.Group;
  chassisGroup: THREE.Group;
  trunkPivot: THREE.Group;
  hoodPivot: THREE.Group;
  convertibleRoof?: THREE.Mesh;
  steeringWheel?: THREE.Group;
  leftDoorPivot: THREE.Group;
  rightDoorPivot: THREE.Group;
  leftWindow: THREE.Mesh;
  rightWindow: THREE.Mesh;
  headlightLeft: THREE.Mesh;
  headlightRight: THREE.Mesh;
  blinkerLeftFront: THREE.Mesh;
  blinkerLeftRear: THREE.Mesh;
  blinkerRightFront: THREE.Mesh;
  blinkerRightRear: THREE.Mesh;
  taillightLeft: THREE.Mesh;
  taillightRight: THREE.Mesh;
  wheelFL: THREE.Group;
  wheelFR: THREE.Group;
  wheelRL: THREE.Mesh;
  wheelRR: THREE.Mesh;
  lightbarRed?: THREE.Mesh;
  lightbarBlue?: THREE.Mesh;
  mainRotor?: THREE.Group;
  tailRotor?: THREE.Group;
  propeller?: THREE.Group;
  outboardProps?: THREE.Group[];
  anchorMesh?: THREE.Mesh;
  bodyMat: THREE.MeshPhysicalMaterial;
  halfWidth: number;
  halfLength: number;
}

export interface WildlifeRig {
  root: THREE.Group;
  tailGroup: THREE.Group;
  jawGroup?: THREE.Group;
}

const OUTFIT_COLORS: Record<OutfitId, { jasonTop: number; jasonBottom: number; luciaTop: number; luciaBottom: number }> = {
  street: { jasonTop: 0x2c4a6b, jasonBottom: 0x2b2f38, luciaTop: 0xd94b64, luciaBottom: 0x24344d },
  suited: { jasonTop: 0x1e2028, jasonBottom: 0x181a20, luciaTop: 0xf0ece6, luciaBottom: 0x1b1d24 },
  beach: { jasonTop: 0x3ec4b6, jasonBottom: 0xc9b48a, luciaTop: 0xff8566, luciaBottom: 0xf4ede2 },
  tactical: { jasonTop: 0x2b362b, jasonBottom: 0x1f241f, luciaTop: 0x262930, luciaBottom: 0x181a1f },
};

export function createCharacterRig(
  role: ProtagonistId | 'police' | 'swat' | 'npc' | 'child',
  contactShadowTex: THREE.Texture,
  shirtHex?: number
): CharacterRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const isLucia = role === 'lucia';
  const isPolice = role === 'police';
  const isSwat = role === 'swat';
  const isChild = role === 'child';

  if (isChild) bodyGroup.scale.setScalar(0.66);

  const skinColor = isLucia ? 0xc68863 : role === 'jason' ? 0xd9a17e : shirtHex ? 0xc89572 : 0xd09b79;
  const topColor = isPolice
    ? 0x1c3459
    : isSwat
    ? 0x181c22
    : isLucia
    ? OUTFIT_COLORS.street.luciaTop
    : role === 'jason'
    ? OUTFIT_COLORS.street.jasonTop
    : shirtHex ?? 0x4b7f8c;
  const bottomColor = isPolice
    ? 0x142238
    : isSwat
    ? 0x14161a
    : isLucia
    ? OUTFIT_COLORS.street.luciaBottom
    : role === 'jason'
    ? OUTFIT_COLORS.street.jasonBottom
    : isChild
    ? 0x2563eb
    : 0x2c303a;

  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.62, metalness: 0.02 });
  const torsoMat = new THREE.MeshStandardMaterial({ color: topColor, roughness: 0.68, metalness: isSwat ? 0.2 : 0.06 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: bottomColor, roughness: 0.78, metalness: 0.04 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: isChild ? 0xf43f5e : 0x18181b, roughness: 0.42, metalness: 0.1 });
  const hairMat = new THREE.MeshStandardMaterial({
    color: isLucia ? 0x1d1614 : role === 'jason' ? 0x4b3626 : 0x241d19,
    roughness: 0.85,
    metalness: 0.04,
  });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x2b3038, roughness: 0.25, metalness: 0.85 });

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(isChild ? 0.8 : 1.15, isChild ? 0.8 : 1.15),
    new THREE.MeshBasicMaterial({ map: contactShadowTex, transparent: true, depthWrite: false, opacity: 0.5 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.015;
  root.add(shadowPlane);

  const thighGeo = new THREE.BoxGeometry(0.18, 0.39, 0.2);
  const calfGeo = new THREE.BoxGeometry(0.16, 0.38, 0.18);
  const shoeGeo = new THREE.BoxGeometry(0.19, 0.1, 0.28);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.12, 0.82, 0);
  const lThigh = new THREE.Mesh(thighGeo, pantsMat);
  lThigh.position.y = -0.19;
  lThigh.castShadow = true;
  const leftCalf = new THREE.Group();
  leftCalf.position.set(0, -0.38, 0);
  const lCalfMesh = new THREE.Mesh(calfGeo, pantsMat);
  lCalfMesh.position.y = -0.19;
  lCalfMesh.castShadow = true;
  const lShoe = new THREE.Mesh(shoeGeo, shoeMat);
  lShoe.position.set(0, -0.39, 0.03);
  leftCalf.add(lCalfMesh, lShoe);
  leftLeg.add(lThigh, leftCalf);
  bodyGroup.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.12, 0.82, 0);
  const rThigh = new THREE.Mesh(thighGeo, pantsMat);
  rThigh.position.y = -0.19;
  rThigh.castShadow = true;
  const rightCalf = new THREE.Group();
  rightCalf.position.set(0, -0.38, 0);
  const rCalfMesh = new THREE.Mesh(calfGeo, pantsMat);
  rCalfMesh.position.y = -0.19;
  rCalfMesh.castShadow = true;
  const rShoe = new THREE.Mesh(shoeGeo, shoeMat);
  rShoe.position.set(0, -0.39, 0.03);
  rightCalf.add(rCalfMesh, rShoe);
  rightLeg.add(rThigh, rightCalf);
  bodyGroup.add(rightLeg);

  const torsoWidth = isLucia ? 0.44 : 0.5;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoWidth, 0.62, 0.26), torsoMat);
  torso.position.y = 1.13;
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Burger Shot Red & Yellow Apron (only visible on job shifts)
  const burgerApron = new THREE.Mesh(
    new THREE.BoxGeometry(torsoWidth + 0.03, 0.52, 0.28),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.65 })
  );
  burgerApron.position.y = 1.05;
  burgerApron.visible = false;
  bodyGroup.add(burgerApron);

  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(torsoWidth + 0.02, 0.06, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x151518, roughness: 0.35, metalness: 0.4 })
  );
  belt.position.y = 0.84;
  bodyGroup.add(belt);

  if (isPolice || isSwat) {
    const vest = new THREE.Mesh(
      new THREE.BoxGeometry(torsoWidth + 0.05, 0.44, 0.3),
      new THREE.MeshStandardMaterial({ color: isSwat ? 0x111418 : 0x1e2c44, roughness: 0.4, metalness: 0.35 })
    );
    vest.position.y = 1.16;
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.09, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.9 })
    );
    badge.position.set(0.12, 1.24, 0.15);
    bodyGroup.add(vest, badge);
  }

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.12, 10), skinMat);
  neck.position.y = 1.46;
  bodyGroup.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.y = 1.63;
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 14), skinMat);
  headMesh.scale.set(0.92, 1.08, 0.96);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  const hairGeo = isLucia
    ? new THREE.SphereGeometry(0.18, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.65)
    : new THREE.BoxGeometry(0.32, 0.12, 0.32);
  const hairMesh = new THREE.Mesh(hairGeo, hairMat);
  hairMesh.position.set(0, isLucia ? 0.03 : 0.14, isLucia ? -0.02 : -0.01);
  headGroup.add(hairMesh);

  // Dynamic Beard Growth Mesh (scales on Jason / male NPCs)
  const beardMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.12, 0.16),
    hairMat
  );
  beardMesh.position.set(0, -0.09, 0.07);
  beardMesh.visible = false;
  headGroup.add(beardMesh);

  // Motorcycle Helmet (auto-equipped on bikes)
  const helmetMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.21, 14, 12),
    new THREE.MeshPhysicalMaterial({ color: 0x111827, roughness: 0.18, metalness: 0.6, clearcoat: 0.9 })
  );
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.1, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.1, metalness: 0.85 })
  );
  visor.position.set(0, 0.02, 0.16);
  helmetMesh.add(visor);
  helmetMesh.visible = false;
  headGroup.add(helmetMesh);

  // Burger Shot Visor Cap
  const burgerCap = new THREE.Group();
  const capCrown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.18, 0.1, 12),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 })
  );
  capCrown.position.y = 0.14;
  const capBrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.03, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
  );
  capBrim.position.set(0, 0.1, 0.16);
  burgerCap.add(capCrown, capBrim);
  burgerCap.visible = false;
  headGroup.add(burgerCap);

  // Wireless Earphones (On-foot Vice FM Radio)
  const earphonesGroup = new THREE.Group();
  const budGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const budMat = new THREE.MeshStandardMaterial({ color: 0x2dd4bf, emissive: 0x0d9488, emissiveIntensity: 0.6 });
  const budL = new THREE.Mesh(budGeo, budMat);
  budL.position.set(-0.16, 0, 0.02);
  const budR = new THREE.Mesh(budGeo, budMat);
  budR.position.set(0.16, 0, 0.02);
  earphonesGroup.add(budL, budR);
  earphonesGroup.visible = false;
  headGroup.add(earphonesGroup);

  if (isLucia) {
    const ponytail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.26, 8), hairMat);
    ponytail.position.set(0, -0.02, -0.18);
    ponytail.rotation.x = 0.35;
    headGroup.add(ponytail);
  }

  if (role === 'jason' || isPolice) {
    const shades = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.055, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0e0f12, roughness: 0.12, metalness: 0.85 })
    );
    shades.position.set(0, 0.02, 0.14);
    headGroup.add(shades);
  }
  if (isPolice || isSwat) {
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.19, 0.1, 14),
      new THREE.MeshStandardMaterial({ color: isSwat ? 0x12151a : 0x162b4d, roughness: 0.45, metalness: 0.2 })
    );
    cap.position.y = 0.14;
    headGroup.add(cap);
  }
  if (isChild) {
    const kidCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 })
    );
    kidCap.position.y = 0.06;
    headGroup.add(kidCap);
  }

  bodyGroup.add(headGroup);

  const upperArmGeo = new THREE.BoxGeometry(0.14, 0.29, 0.14);
  const forearmGeo = new THREE.BoxGeometry(0.12, 0.28, 0.12);

  const leftArm = new THREE.Group();
  leftArm.position.set(-(torsoWidth / 2 + 0.09), 1.38, 0);
  const lUpperArm = new THREE.Mesh(upperArmGeo, skinMat);
  lUpperArm.position.y = -0.14;
  lUpperArm.castShadow = true;
  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.27, 0);
  const lForeMesh = new THREE.Mesh(forearmGeo, skinMat);
  lForeMesh.position.y = -0.14;
  lForeMesh.castShadow = true;
  leftForearm.add(lForeMesh);

  // Smartphone held in left hand
  const phoneMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.15, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x38bdf8, emissiveIntensity: 0.85 })
  );
  phoneMesh.position.set(0, -0.26, 0.08);
  phoneMesh.visible = false;
  leftForearm.add(phoneMesh);

  // Shopping Bag prop (for market shoppers)
  const shoppingBagMesh = new THREE.Group();
  shoppingBagMesh.position.set(-0.04, -0.36, 0.04);
  const bagBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.28, 0.14),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 })
  );
  shoppingBagMesh.add(bagBody);
  shoppingBagMesh.visible = false;
  leftForearm.add(shoppingBagMesh);

  // Rain Umbrella held in left hand
  const umbrellaGroup = new THREE.Group();
  umbrellaGroup.position.set(0, -0.22, 0.12);
  const uShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.85, 6), metalMat);
  uShaft.position.y = 0.42;
  const uDome = new THREE.Mesh(
    new THREE.ConeGeometry(0.62, 0.25, 10),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, side: THREE.DoubleSide })
  );
  uDome.position.y = 0.85;
  umbrellaGroup.add(uShaft, uDome);
  umbrellaGroup.visible = false;
  leftForearm.add(umbrellaGroup);

  leftArm.add(lUpperArm, leftForearm);
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(torsoWidth / 2 + 0.09, 1.38, 0);
  const rUpperArm = new THREE.Mesh(upperArmGeo, skinMat);
  rUpperArm.position.y = -0.14;
  rUpperArm.castShadow = true;
  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.27, 0);
  const rForeMesh = new THREE.Mesh(forearmGeo, skinMat);
  rForeMesh.position.y = -0.14;
  rForeMesh.castShadow = true;
  rightForearm.add(rForeMesh);

  // Espresso Coffee Cup prop
  const coffeeCupMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.04, 0.13, 10),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.4 })
  );
  coffeeCupMesh.position.set(0, -0.27, 0.07);
  coffeeCupMesh.visible = false;
  rightForearm.add(coffeeCupMesh);

  // Hot Burger Delivery Box prop
  const burgerBoxMesh = new THREE.Group();
  burgerBoxMesh.position.set(0, -0.26, 0.14);
  const bBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.12, 0.24),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 })
  );
  const bStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.29, 0.04, 0.25),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
  );
  burgerBoxMesh.add(bBox, bStripe);
  burgerBoxMesh.visible = false;
  rightForearm.add(burgerBoxMesh);

  rightArm.add(rUpperArm, rightForearm);
  bodyGroup.add(rightArm);

  // Weapon + Attachment Meshes attached to rightForearm
  const heldGun = new THREE.Group();
  heldGun.position.set(0, -0.26, 0.16);
  const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.34), metalMat);
  const gunGrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.12, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 })
  );
  gunGrip.position.set(0, -0.07, -0.08);
  const suppressorMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.18, 8),
    metalMat
  );
  suppressorMesh.rotation.x = Math.PI / 2;
  suppressorMesh.position.set(0, 0.01, 0.24);
  suppressorMesh.visible = false;
  const scopeMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.14, 8),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.9 })
  );
  scopeMesh.rotation.x = Math.PI / 2;
  scopeMesh.position.set(0, 0.08, 0);
  scopeMesh.visible = false;
  const extMagMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.16, 0.06),
    metalMat
  );
  extMagMesh.position.set(0, -0.14, 0.02);
  extMagMesh.visible = false;

  heldGun.add(gunBody, gunGrip, suppressorMesh, scopeMesh, extMagMesh);
  heldGun.visible = false;
  rightForearm.add(heldGun);

  const batMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.02, 0.78, 8),
    new THREE.MeshStandardMaterial({ color: 0xb47b44, roughness: 0.55 })
  );
  batMesh.position.set(0, -0.26, 0.34);
  batMesh.rotation.x = Math.PI / 2.2;
  batMesh.visible = false;
  rightForearm.add(batMesh);

  const rpgMesh = new THREE.Group();
  rpgMesh.position.set(0.02, -0.18, 0.08);
  const rpgTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.96, 10),
    new THREE.MeshStandardMaterial({ color: 0x3f4d36, roughness: 0.5, metalness: 0.45 })
  );
  rpgTube.rotation.x = Math.PI / 2;
  const rpgWarhead = new THREE.Mesh(
    new THREE.ConeGeometry(0.075, 0.24, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.6 })
  );
  rpgWarhead.rotation.x = Math.PI / 2;
  rpgWarhead.position.z = 0.56;
  rpgMesh.add(rpgTube, rpgWarhead);
  rpgMesh.visible = false;
  rightForearm.add(rpgMesh);

  // Burger Shot Spatula & Mop Props
  const spatulaMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.42), metalMat);
  spatulaMesh.position.set(0, -0.27, 0.22);
  spatulaMesh.visible = false;
  rightForearm.add(spatulaMesh);

  const mopGroup = new THREE.Group();
  mopGroup.position.set(0, -0.27, 0.25);
  const mopHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 1.35, 6),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
  );
  mopHandle.rotation.x = 0.55;
  const mopHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.08, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.95 })
  );
  mopHead.position.set(0, -0.55, 0.34);
  mopGroup.add(mopHandle, mopHead);
  mopGroup.visible = false;
  rightForearm.add(mopGroup);

  const slungGun = new THREE.Group();
  slungGun.position.set(0, 1.15, -0.17);
  slungGun.rotation.z = 0.55;
  const rifleReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.72), metalMat);
  const rifleStock = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.1, 0.24),
    new THREE.MeshStandardMaterial({ color: 0x452b1a, roughness: 0.7 })
  );
  rifleStock.position.z = -0.38;
  slungGun.add(rifleReceiver, rifleStock);
  slungGun.visible = false;
  bodyGroup.add(slungGun);

  const duffelBag = new THREE.Group();
  duffelBag.position.set(0, 1.08, -0.21);
  const duffelMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.28, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x1b1e23, roughness: 0.85, metalness: 0.1 })
  );
  const strap = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.05, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xe68a2e, roughness: 0.5 })
  );
  duffelBag.add(duffelMesh, strap);
  duffelBag.visible = false;
  bodyGroup.add(duffelBag);

  // 3D Skydiving Parachute Canopy + Risers
  const parachuteGroup = new THREE.Group();
  parachuteGroup.position.set(0, 1.5, 0);
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(2.3, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.42),
    new THREE.MeshStandardMaterial({ color: 0xff4d6d, roughness: 0.55, side: THREE.DoubleSide })
  );
  canopy.position.y = 2.6;
  canopy.scale.set(1.25, 0.65, 0.85);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
  [
    [-1.4, 2.1, 0],
    [1.4, 2.1, 0],
    [-0.9, 2.1, 0.8],
    [0.9, 2.1, -0.8],
  ].forEach(([lx, ly, lz]) => {
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.8, 4), lineMat);
    riser.position.set(lx * 0.5, ly * 0.72, lz * 0.5);
    riser.rotation.z = -lx * 0.38;
    riser.rotation.x = lz * 0.35;
    parachuteGroup.add(riser);
  });
  parachuteGroup.add(canopy);
  parachuteGroup.visible = false;
  bodyGroup.add(parachuteGroup);

  const witnessMarker = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 })
  );
  witnessMarker.position.y = 2.18;
  witnessMarker.visible = false;
  root.add(witnessMarker);

  return {
    root,
    bodyGroup,
    torso,
    headGroup,
    hairMesh,
    beardMesh,
    helmetMesh,
    burgerCap,
    burgerApron,
    earphonesGroup,
    leftArm,
    leftForearm,
    rightArm,
    rightForearm,
    leftLeg,
    leftCalf,
    rightLeg,
    rightCalf,
    slungGun,
    heldGun,
    batMesh,
    rpgMesh,
    suppressorMesh,
    scopeMesh,
    extMagMesh,
    duffelBag,
    umbrellaGroup,
    phoneMesh,
    coffeeCupMesh,
    shoppingBagMesh,
    burgerBoxMesh,
    spatulaMesh,
    mopGroup,
    parachuteGroup,
    witnessMarker,
    torsoMat,
    pantsMat,
    hairMat,
  };
}

export function applyCharacterAppearance(
  rig: CharacterRig,
  id: ProtagonistId,
  outfit: OutfitId,
  muscle: number,
  hasSlungLongGun: boolean,
  holdingWeapon: boolean,
  hasDuffelLoot: boolean,
  isSitting: boolean,
  isRidingBike = false,
  extras?: {
    helmetOn?: boolean;
    wearingBurgerUniform?: boolean;
    umbrellaOpen?: boolean;
    parachuting?: boolean;
    beardLevel?: number;
    earphonesOn?: boolean;
    suppressor?: boolean;
    scope?: boolean;
    extendedMag?: boolean;
    inVehicle?: boolean;
    weaponVisual?: 'none' | 'gun' | 'bat' | 'rpg';
  }
) {
  const palette = OUTFIT_COLORS[outfit];
  rig.torsoMat.color.setHex(id === 'jason' ? palette.jasonTop : palette.luciaTop);
  rig.pantsMat.color.setHex(id === 'jason' ? palette.jasonBottom : palette.luciaBottom);

  const mScale = 1 + (muscle / 100) * 0.22;
  rig.torso.scale.set(mScale, 1, 1 + (muscle / 100) * 0.14);

  const wVis = extras?.weaponVisual ?? (holdingWeapon ? 'gun' : 'none');
  rig.slungGun.visible = hasSlungLongGun && !extras?.inVehicle;
  rig.heldGun.visible = wVis === 'gun' && !isRidingBike && !extras?.inVehicle;
  rig.batMesh.visible = wVis === 'bat' && !isRidingBike && !extras?.inVehicle;
  rig.rpgMesh.visible = wVis === 'rpg' && !isRidingBike && !extras?.inVehicle;
  rig.duffelBag.visible = hasDuffelLoot && !extras?.inVehicle;

  if (extras) {
    rig.helmetMesh.visible = Boolean(extras.helmetOn);
    rig.hairMesh.visible = !extras.helmetOn && !extras.wearingBurgerUniform;
    rig.burgerCap.visible = Boolean(extras.wearingBurgerUniform);
    rig.burgerApron.visible = Boolean(extras.wearingBurgerUniform);
    rig.umbrellaGroup.visible = Boolean(extras.umbrellaOpen) && !isSitting && !isRidingBike && !extras.inVehicle;
    rig.parachuteGroup.visible = Boolean(extras.parachuting);
    rig.earphonesGroup.visible = Boolean(extras.earphonesOn) && !extras.helmetOn;
    rig.suppressorMesh.visible = Boolean(extras.suppressor);
    rig.scopeMesh.visible = Boolean(extras.scope);
    rig.extMagMesh.visible = Boolean(extras.extendedMag);

    if (id === 'jason' && (extras.beardLevel ?? 0) > 20 && !extras.helmetOn) {
      rig.beardMesh.visible = true;
      const bScale = 0.55 + ((extras.beardLevel ?? 0) / 100) * 0.75;
      rig.beardMesh.scale.set(1, bScale, 1);
    } else {
      rig.beardMesh.visible = false;
    }
  }

  if (isSitting && !extras?.inVehicle && !isRidingBike) {
    rig.bodyGroup.position.y = -0.34;
    rig.leftLeg.rotation.x = -Math.PI / 2.15;
    rig.rightLeg.rotation.x = -Math.PI / 2.15;
    rig.leftCalf.rotation.x = 1.45;
    rig.rightCalf.rotation.x = 1.45;
    rig.leftLeg.rotation.z = 0;
    rig.rightLeg.rotation.z = 0;
    rig.leftArm.rotation.x = -0.4;
    rig.rightArm.rotation.x = -0.4;
  }
}

export function createVehicleRig(
  tier: VehicleTier,
  colorHex: string,
  contactShadowTex: THREE.Texture,
  isSoftwareGl: boolean
): VehicleRig {
  const root = new THREE.Group();
  const chassisGroup = new THREE.Group();
  root.add(chassisGroup);

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorHex),
    roughness: tier === 'boat' ? 0.22 : 0.16,
    metalness: tier === 'boat' ? 0.18 : 0.75,
    clearcoat: isSoftwareGl ? 0 : 0.95,
    clearcoatRoughness: 0.08,
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.75, metalness: 0.2 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd9dde6, roughness: 0.15, metalness: 0.92 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x77aacc,
    roughness: 0.08,
    metalness: 0.1,
    transparent: true,
    opacity: 0.34,
  });

  const hlMatL = new THREE.MeshStandardMaterial({ color: 0xfff6d6, emissive: 0xfff0aa, emissiveIntensity: 1.2, roughness: 0.2 });
  const hlMatR = hlMatL.clone();
  const tlMat = new THREE.MeshStandardMaterial({ color: 0xcc1122, emissive: 0x880011, emissiveIntensity: 0.7, roughness: 0.25 });
  const makeBlinkerMat = () =>
    new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0xf59e0b, emissiveIntensity: 0, roughness: 0.3 });

  const trunkPivot = new THREE.Group();
  const hoodPivot = new THREE.Group();
  const leftDoorPivot = new THREE.Group();
  const rightDoorPivot = new THREE.Group();
  const leftWindow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.6), glassMat);
  const rightWindow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.6), glassMat);
  const headlightLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.08), hlMatL);
  const headlightRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.08), hlMatR);
  const taillightLeft = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.08), tlMat);
  const taillightRight = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.08), tlMat);
  const blinkerLeftFront = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.1), makeBlinkerMat());
  const blinkerLeftRear = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.1), makeBlinkerMat());
  const blinkerRightFront = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.1), makeBlinkerMat());
  const blinkerRightRear = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.1), makeBlinkerMat());

  const wheelFL = new THREE.Group();
  const wheelFR = new THREE.Group();
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.88, metalness: 0.04 });
  const makeWheel = (rad = 0.36, wid = 0.24) => {
    const g = new THREE.CylinderGeometry(rad, rad, wid, 16);
    g.rotateZ(Math.PI / 2);
    const rg = new THREE.CylinderGeometry(rad * 0.6, rad * 0.6, wid + 0.015, 10);
    rg.rotateZ(Math.PI / 2);
    const m = new THREE.Mesh(g, tireMat);
    m.add(new THREE.Mesh(rg, chromeMat));
    m.castShadow = true;
    return m;
  };
  let wheelRL = makeWheel();
  let wheelRR = makeWheel();

  // ---------------- SCULPTED V-HULL SPEEDBOAT (ZERO BOX SHAPE!) ----------------
  if (tier === 'boat') {
    const halfWidth = 1.25;
    const halfLength = 3.15;

    // Extrude realistic pointed V-Hull planform
    const hullShape = new THREE.Shape();
    hullShape.moveTo(0, 3.25); // Sharp pointed bow
    hullShape.quadraticCurveTo(1.18, 1.4, 1.22, -2.9);
    hullShape.lineTo(-1.22, -2.9);
    hullShape.quadraticCurveTo(-1.18, 1.4, 0, 3.25);

    const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
      depth: 0.68,
      bevelEnabled: true,
      bevelThickness: 0.16,
      bevelSize: 0.1,
      bevelSegments: 3,
    });
    hullGeo.rotateX(Math.PI / 2);
    const hullMesh = new THREE.Mesh(hullGeo, bodyMat);
    hullMesh.position.y = 0.65;
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    chassisGroup.add(hullMesh);

    // Teak Wood Open Cockpit Deck
    const deckShape = new THREE.Shape();
    deckShape.moveTo(0, 2.35);
    deckShape.quadraticCurveTo(0.88, 1.0, 0.92, -2.45);
    deckShape.lineTo(-0.92, -2.45);
    deckShape.quadraticCurveTo(-0.88, 1.0, 0, 2.35);
    const deckGeo = new THREE.ExtrudeGeometry(deckShape, { depth: 0.08, bevelEnabled: false });
    deckGeo.rotateX(Math.PI / 2);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x8b5a32, roughness: 0.65 });
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.position.y = 0.72;
    chassisGroup.add(deckMesh);

    // Racing Side Stripe
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.12, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.3 })
    );
    stripe.position.set(0, 0.42, -0.4);
    chassisGroup.add(stripe);

    // Wraparound Tinted Marine Windshield
    const wsFront = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.48, 0.07), glassMat);
    wsFront.position.set(0, 1.05, 0.85);
    wsFront.rotation.x = -0.58;
    const wsSideL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.95), glassMat);
    wsSideL.position.set(-0.88, 1.0, 0.4);
    const wsSideR = wsSideL.clone();
    wsSideR.position.x = 0.88;
    chassisGroup.add(wsFront, wsSideL, wsSideR);

    // Dashboard Helm & Captain/Passenger Bolstered Seats
    const consoleBox = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.48, 0.52), trimMat);
    consoleBox.position.set(0, 0.82, 0.55);
    const steeringWheel = new THREE.Group();
    steeringWheel.position.set(-0.38, 1.0, 0.28);
    steeringWheel.rotation.x = 0.45;
    const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 8, 16), chromeMat);
    steeringWheel.add(wheelRim);

    const seatMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.45 });
    const capSeat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.58, 0.55), seatMat);
    capSeat.position.set(-0.42, 0.92, -0.35);
    const passSeat = capSeat.clone();
    passSeat.position.set(0.42, 0.92, -0.35);
    const sternBench = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.5, 0.6), seatMat);
    sternBench.position.set(0, 0.88, -1.75);
    chassisGroup.add(consoleBox, steeringWheel, capSeat, passSeat, sternBench);

    // Twin Outboard Motors + Spinning Propellers!
    const outboardProps: THREE.Group[] = [];
    [-0.42, 0.42].forEach((ox) => {
      const cowl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.56, 0.52), trimMat);
      cowl.position.set(ox, 0.88, -3.15);
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.65, 0.24), trimMat);
      shaft.position.set(ox, 0.35, -3.18);
      const prop = new THREE.Group();
      prop.position.set(ox, 0.08, -3.34);
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.03), chromeMat);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.34, 0.03), chromeMat);
      prop.add(b1, b2);
      outboardProps.push(prop);
      chassisGroup.add(cowl, shaft, prop);
    });

    // Anchor Mesh (drops down when Anchor is active)
    const anchorMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.04, 6, 10),
      chromeMat
    );
    anchorMesh.position.set(0.55, 0.62, 2.2);
    chassisGroup.add(anchorMesh);

    headlightLeft.position.set(0, 0.72, 2.85);
    headlightRight.visible = false;
    chassisGroup.add(headlightLeft);

    return {
      root, chassisGroup, trunkPivot, hoodPivot, steeringWheel, leftDoorPivot, rightDoorPivot,
      leftWindow, rightWindow, headlightLeft, headlightRight,
      blinkerLeftFront, blinkerLeftRear, blinkerRightFront, blinkerRightRear,
      taillightLeft, taillightRight, wheelFL, wheelFR, wheelRL, wheelRR,
      outboardProps, anchorMesh,
      bodyMat, halfWidth, halfLength,
    };
  }

  // ---------------- MOTORCYCLE / BIKE ----------------
  if (tier === 'bike') {
    const halfWidth = 0.48;
    const halfLength = 1.15;
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 2.5),
      new THREE.MeshBasicMaterial({ map: contactShadowTex, transparent: true, depthWrite: false, opacity: 0.55 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    root.add(shadow);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 1.35), bodyMat);
    frame.position.set(0, 0.62, 0);
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.55), bodyMat);
    tank.position.set(0, 0.86, 0.24);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.65), trimMat);
    seat.position.set(0, 0.78, -0.32);
    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.42), chromeMat);
    engine.position.set(0, 0.44, 0.05);
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85, 8), chromeMat);
    fork.position.set(0, 0.75, 0.74);
    fork.rotation.x = -0.35;
    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.78, 8), trimMat);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0, 1.1, 0.58);
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), chromeMat);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(0.22, 0.36, -0.45);
    chassisGroup.add(frame, tank, seat, engine, fork, handlebar, exhaust);

    headlightLeft.position.set(0, 0.9, 0.88);
    taillightLeft.position.set(0, 0.76, -0.95);
    headlightRight.visible = false;
    taillightRight.visible = false;
    chassisGroup.add(headlightLeft, taillightLeft);

    const fw = makeWheel(0.34, 0.14);
    wheelFL.position.set(0, 0.34, 0.85);
    wheelFL.add(fw);
    wheelFR.visible = false;
    wheelRL = makeWheel(0.34, 0.16);
    wheelRL.position.set(0, 0.34, -0.82);
    wheelRR.visible = false;
    root.add(wheelFL, wheelFR, wheelRL, wheelRR);

    return {
      root, chassisGroup, trunkPivot, hoodPivot, leftDoorPivot, rightDoorPivot,
      leftWindow, rightWindow, headlightLeft, headlightRight,
      blinkerLeftFront, blinkerLeftRear, blinkerRightFront, blinkerRightRear,
      taillightLeft, taillightRight, wheelFL, wheelFR, wheelRL, wheelRR,
      bodyMat, halfWidth, halfLength,
    };
  }

  // ---------------- HELICOPTER ----------------
  if (tier === 'heli') {
    const halfWidth = 1.45;
    const halfLength = 3.2;
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 6.8),
      new THREE.MeshBasicMaterial({ map: contactShadowTex, transparent: true, depthWrite: false, opacity: 0.55 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    root.add(shadow);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.45, 3.2), bodyMat);
    cabin.position.set(0, 1.35, 0.4);
    cabin.castShadow = true;
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.95, 1.3), glassMat);
    canopy.position.set(0, 1.4, 1.65);
    canopy.rotation.x = 0.28;
    const tailBoom = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 3.8), bodyMat);
    tailBoom.position.set(0, 1.55, -2.6);
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.65), bodyMat);
    tailFin.position.set(0, 2.0, -4.3);

    const skidGeo = new THREE.CylinderGeometry(0.05, 0.05, 3.6, 8);
    skidGeo.rotateX(Math.PI / 2);
    const skidL = new THREE.Mesh(skidGeo, trimMat);
    skidL.position.set(-0.95, 0.12, 0.3);
    const skidR = new THREE.Mesh(skidGeo, trimMat);
    skidR.position.set(0.95, 0.12, 0.3);

    const mainRotor = new THREE.Group();
    mainRotor.position.set(0, 2.35, 0.3);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.45, 8), chromeMat);
    const blade1 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.05, 0.24), trimMat);
    blade1.position.y = 0.18;
    const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 7.2), trimMat);
    blade2.position.y = 0.18;
    mainRotor.add(mast, blade1, blade2);

    const tailRotor = new THREE.Group();
    tailRotor.position.set(0.18, 2.1, -4.35);
    const tb1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 0.12), trimMat);
    tailRotor.add(tb1);

    chassisGroup.add(cabin, canopy, tailBoom, tailFin, skidL, skidR, mainRotor, tailRotor);
    headlightLeft.position.set(0, 0.85, 2.1);
    chassisGroup.add(headlightLeft);

    return {
      root, chassisGroup, trunkPivot, hoodPivot, leftDoorPivot, rightDoorPivot,
      leftWindow, rightWindow, headlightLeft, headlightRight,
      blinkerLeftFront, blinkerLeftRear, blinkerRightFront, blinkerRightRear,
      taillightLeft, taillightRight, wheelFL, wheelFR, wheelRL, wheelRR,
      mainRotor, tailRotor,
      bodyMat, halfWidth, halfLength,
    };
  }

  // ---------------- AIRPLANE ----------------
  if (tier === 'plane') {
    const halfWidth = 4.2;
    const halfLength = 3.8;
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(8.5, 7.6),
      new THREE.MeshBasicMaterial({ map: contactShadowTex, transparent: true, depthWrite: false, opacity: 0.55 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    root.add(shadow);

    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.35, 6.6), bodyMat);
    fuselage.position.set(0, 1.2, 0);
    fuselage.castShadow = true;
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.72, 1.9), glassMat);
    cockpit.position.set(0, 1.95, 0.6);
    const wings = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.16, 1.7), bodyMat);
    wings.position.set(0, 1.35, 0.55);
    wings.castShadow = true;
    const tailWing = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.9), bodyMat);
    tailWing.position.set(0, 1.5, -2.9);
    const vStab = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.4, 1.1), bodyMat);
    vStab.position.set(0, 2.1, -2.85);

    const propeller = new THREE.Group();
    propeller.position.set(0, 1.22, 3.45);
    const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.45, 12), chromeMat);
    spinner.rotation.x = Math.PI / 2;
    const pBlade = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.06), trimMat);
    propeller.add(spinner, pBlade);

    chassisGroup.add(fuselage, cockpit, wings, tailWing, vStab, propeller);

    wheelFL.position.set(-1.3, 0.34, 0.9);
    wheelFL.add(makeWheel(0.32, 0.18));
    wheelFR.position.set(1.3, 0.34, 0.9);
    wheelFR.add(makeWheel(0.32, 0.18));
    wheelRL = makeWheel(0.24, 0.14);
    wheelRL.position.set(0, 0.24, -2.6);
    wheelRR.visible = false;
    root.add(wheelFL, wheelFR, wheelRL, wheelRR);

    return {
      root, chassisGroup, trunkPivot, hoodPivot, leftDoorPivot, rightDoorPivot,
      leftWindow, rightWindow, headlightLeft, headlightRight,
      blinkerLeftFront, blinkerLeftRear, blinkerRightFront, blinkerRightRear,
      taillightLeft, taillightRight, wheelFL, wheelFR, wheelRL, wheelRR,
      propeller,
      bodyMat, halfWidth, halfLength,
    };
  }

  // ---------------- SPORT BIKE ----------------
  if (tier === 'sportbike') {
    const halfWidth = 0.5;
    const halfLength = 1.2;
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 2.6),
      new THREE.MeshBasicMaterial({ map: contactShadowTex, transparent: true, depthWrite: false, opacity: 0.55 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    root.add(shadow);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 1.45), trimMat);
    chassis.position.set(0, 0.56, 0);
    const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.82), bodyMat);
    fairing.position.set(0, 0.78, 0.45);
    fairing.rotation.x = 0.22;
    const windscreen = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.35), glassMat);
    windscreen.position.set(0, 1.02, 0.56);
    windscreen.rotation.x = -0.45;
    const fuelTank = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.25, 0.58), bodyMat);
    fuelTank.position.set(0, 0.88, 0.1);
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.62), trimMat);
    saddle.position.set(0, 0.78, -0.36);
    const tailCowl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.48), bodyMat);
    tailCowl.position.set(0, 0.86, -0.78);
    tailCowl.rotation.x = 0.18;
    const clipOnBar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.72, 8), chromeMat);
    clipOnBar.rotation.z = Math.PI / 2;
    clipOnBar.position.set(0, 0.94, 0.48);
    const exhaustL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.78, 8), chromeMat);
    exhaustL.rotation.x = Math.PI / 2 - 0.14;
    exhaustL.position.set(-0.22, 0.44, -0.58);
    const exhaustR = exhaustL.clone();
    exhaustR.position.x = 0.22;
    chassisGroup.add(chassis, fairing, windscreen, fuelTank, saddle, tailCowl, clipOnBar, exhaustL, exhaustR);

    headlightLeft.position.set(-0.12, 0.82, 0.86);
    headlightRight.position.set(0.12, 0.82, 0.86);
    taillightLeft.position.set(0, 0.88, -1.04);
    taillightRight.visible = false;
    chassisGroup.add(headlightLeft, headlightRight, taillightLeft);

    const fw = makeWheel(0.35, 0.16);
    wheelFL.position.set(0, 0.35, 0.86);
    wheelFL.add(fw);
    wheelFR.visible = false;
    wheelRL = makeWheel(0.36, 0.2);
    wheelRL.position.set(0, 0.36, -0.82);
    wheelRR.visible = false;
    root.add(wheelFL, wheelFR, wheelRL, wheelRR);

    return {
      root, chassisGroup, trunkPivot, hoodPivot, leftDoorPivot, rightDoorPivot,
      leftWindow, rightWindow, headlightLeft, headlightRight,
      blinkerLeftFront, blinkerLeftRear, blinkerRightFront, blinkerRightRear,
      taillightLeft, taillightRight, wheelFL, wheelFR, wheelRL, wheelRR,
      bodyMat, halfWidth, halfLength,
    };
  }

  // ---------------- URBAN SCOOTY / MOPED ----------------
  if (tier === 'scooty') {
    const halfWidth = 0.44;
    const halfLength = 1.0;
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 2.15),
      new THREE.MeshBasicMaterial({ map: contactShadowTex, transparent: true, depthWrite: false, opacity: 0.52 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    root.add(shadow);

    const footboard = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.9), trimMat);
    footboard.position.set(0, 0.32, 0.02);
    const frontApron = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.72, 0.34), bodyMat);
    frontApron.position.set(0, 0.66, 0.54);
    frontApron.rotation.x = -0.18;
    const rearBody = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.84), bodyMat);
    rearBody.position.set(0, 0.56, -0.34);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.68), trimMat);
    seat.position.set(0, 0.82, -0.28);
    const grabRail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.22), chromeMat);
    grabRail.position.set(0, 0.85, -0.74);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), trimMat);
    stem.position.set(0, 0.98, 0.46);
    const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.66, 8), chromeMat);
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(0, 1.14, 0.44);
    const cowl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.22), bodyMat);
    cowl.position.set(0, 1.12, 0.48);
    chassisGroup.add(footboard, frontApron, rearBody, seat, grabRail, stem, handleBar, cowl);

    headlightLeft.position.set(0, 0.82, 0.72);
    headlightRight.visible = false;
    taillightLeft.position.set(0, 0.66, -0.78);
    taillightRight.visible = false;
    chassisGroup.add(headlightLeft, taillightLeft);

    const fw = makeWheel(0.26, 0.13);
    wheelFL.position.set(0, 0.26, 0.68);
    wheelFL.add(fw);
    wheelFR.visible = false;
    wheelRL = makeWheel(0.26, 0.14);
    wheelRL.position.set(0, 0.26, -0.62);
    wheelRR.visible = false;
    root.add(wheelFL, wheelFR, wheelRL, wheelRR);

    return {
      root, chassisGroup, trunkPivot, hoodPivot, leftDoorPivot, rightDoorPivot,
      leftWindow, rightWindow, headlightLeft, headlightRight,
      blinkerLeftFront, blinkerLeftRear, blinkerRightFront, blinkerRightRear,
      taillightLeft, taillightRight, wheelFL, wheelFR, wheelRL, wheelRR,
      bodyMat, halfWidth, halfLength,
    };
  }

  // ---------------- HEAVY CARGO TRUCK ----------------
  if (tier === 'truck') {
    const halfWidth = 1.32;
    const halfLength = 4.3;
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 9.2),
      new THREE.MeshBasicMaterial({ map: contactShadowTex, transparent: true, depthWrite: false, opacity: 0.6 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    root.add(shadow);

    const chassisRail = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.34, 8.2), trimMat);
    chassisRail.position.set(0, 0.62, 0);
    const cabBody = new THREE.Mesh(new THREE.BoxGeometry(2.38, 1.95, 2.25), bodyMat);
    cabBody.position.set(0, 1.72, 2.75);
    cabBody.castShadow = true;
    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.15, 1.05), bodyMat);
    hood.position.set(0, 1.32, 3.85);
    const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.65, 0.1), glassMat);
    cabGlass.position.set(0, 2.15, 3.89);
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.72, 0.12), chromeMat);
    grille.position.set(0, 1.22, 4.38);
    const cargoMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55 });
    const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(2.48, 2.65, 5.45), cargoMat);
    cargoBox.position.set(0, 2.12, -1.35);
    cargoBox.castShadow = true;
    cargoBox.receiveShadow = true;
    const stripeMat = new THREE.MeshStandardMaterial({ color: bodyMat.color, roughness: 0.4 });
    const sideStripe = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.35, 5.1), stripeMat);
    sideStripe.position.set(0, 2.1, -1.35);
    const stackL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.35, 8), chromeMat);
    stackL.position.set(-1.12, 2.45, 1.72);
    const stackR = stackL.clone();
    stackR.position.x = 1.12;
    const steeringWheel = new THREE.Group();
    steeringWheel.position.set(-0.62, 1.7, 3.2);
    steeringWheel.rotation.x = 0.4;
    steeringWheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 6, 12), trimMat));
    chassisGroup.add(chassisRail, cabBody, hood, cabGlass, grille, cargoBox, sideStripe, stackL, stackR, steeringWheel);

    headlightLeft.position.set(-0.88, 0.96, 4.4);
    headlightRight.position.set(0.88, 0.96, 4.4);
    taillightLeft.position.set(-0.95, 0.82, -4.12);
    taillightRight.position.set(0.95, 0.82, -4.12);
    chassisGroup.add(headlightLeft, headlightRight, taillightLeft, taillightRight);

    wheelFL.position.set(-1.14, 0.48, 3.25);
    wheelFL.add(makeWheel(0.48, 0.28));
    wheelFR.position.set(1.14, 0.48, 3.25);
    wheelFR.add(makeWheel(0.48, 0.28));
    wheelRL = makeWheel(0.48, 0.32);
    wheelRL.position.set(-1.14, 0.48, -2.55);
    wheelRR = makeWheel(0.48, 0.32);
    wheelRR.position.set(1.14, 0.48, -2.55);
    const midWheelL = makeWheel(0.48, 0.32);
    midWheelL.position.set(-1.14, 0.48, -0.75);
    const midWheelR = makeWheel(0.48, 0.32);
    midWheelR.position.set(1.14, 0.48, -0.75);
    root.add(wheelFL, wheelFR, wheelRL, wheelRR, midWheelL, midWheelR);

    return {
      root, chassisGroup, trunkPivot, hoodPivot, steeringWheel, leftDoorPivot, rightDoorPivot,
      leftWindow, rightWindow, headlightLeft, headlightRight,
      blinkerLeftFront, blinkerLeftRear, blinkerRightFront, blinkerRightRear,
      taillightLeft, taillightRight, wheelFL, wheelFR, wheelRL, wheelRR,
      bodyMat, halfWidth, halfLength,
    };
  }

  // ---------------- CARS, SUVS, POLICE ----------------
  const isSuv = tier === 'suv' || tier === 'police' || tier === 'pickup';
  const isLuxury = tier === 'luxury';
  const isMuscle = tier === 'muscle';
  const isTaxi = tier === 'taxi';

  const length = isSuv ? 4.65 : isLuxury ? 4.5 : 4.25;
  const width = isSuv ? 2.1 : 1.96;
  const bodyHeight = isSuv ? 0.72 : isLuxury ? 0.48 : 0.56;

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(width + 0.9, length + 1.0),
    new THREE.MeshBasicMaterial({ map: contactShadowTex, transparent: true, depthWrite: false, opacity: 0.55 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;
  root.add(shadowPlane);

  const lowerHull = new THREE.Mesh(new THREE.BoxGeometry(width, bodyHeight, length), bodyMat);
  lowerHull.position.y = 0.58;
  lowerHull.castShadow = true;
  lowerHull.receiveShadow = true;
  chassisGroup.add(lowerHull);

  const mirrorGeo = new THREE.BoxGeometry(0.16, 0.1, 0.12);
  const mL = new THREE.Mesh(mirrorGeo, bodyMat);
  mL.position.set(-width / 2 - 0.06, 0.92, 0.45);
  const mR = new THREE.Mesh(mirrorGeo, bodyMat);
  mR.position.set(width / 2 + 0.06, 0.92, 0.45);
  const exhGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.22, 8);
  exhGeo.rotateX(Math.PI / 2);
  const exL = new THREE.Mesh(exhGeo, chromeMat);
  exL.position.set(-width * 0.28, 0.34, -length / 2 - 0.06);
  const exR = new THREE.Mesh(exhGeo, chromeMat);
  exR.position.set(width * 0.28, 0.34, -length / 2 - 0.06);
  chassisGroup.add(mL, mR, exL, exR);

  const bumper = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, 0.22, 0.22), trimMat);
  bumper.position.set(0, 0.36, length / 2 + 0.02);
  chassisGroup.add(bumper);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(width * 0.58, 0.18, 0.06), chromeMat);
  grille.position.set(0, 0.54, length / 2 + 0.01);
  chassisGroup.add(grille);

  if (tier === 'police') {
    const doorWhite = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.02, bodyHeight * 0.88, length * 0.42),
      new THREE.MeshStandardMaterial({ color: 0xf3f5f8, roughness: 0.25, metalness: 0.2 })
    );
    doorWhite.position.set(0, 0.58, 0.05);
    chassisGroup.add(doorWhite);
  }

  if (isMuscle) {
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.14, 0.9), trimMat);
    scoop.position.set(0, 0.58 + bodyHeight / 2 + 0.05, length * 0.25);
    chassisGroup.add(scoop);
  }

  // Interior Cabin Bench + Dashboard + Steering Wheel (visible through glass & when convertible opens!)
  const cabinHeight = isSuv ? 0.68 : isLuxury ? 0.56 : 0.62;
  const cabinLen = tier === 'pickup' ? 1.35 : isSuv ? 2.4 : 1.95;
  const cabinZ = tier === 'pickup' ? 0.25 : -0.2;
  const cabinY = 0.58 + bodyHeight / 2 + cabinHeight / 2 - 0.04;

  // Pillars + Convertible / Hardtop Roof
  const convertibleRoof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.84, 0.1, cabinLen), bodyMat);
  convertibleRoof.position.set(0, cabinY + cabinHeight / 2 - 0.05, cabinZ);
  convertibleRoof.castShadow = true;
  chassisGroup.add(convertibleRoof);

  // Rear Pillar & Side Cabin Structure
  const rearDeck = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, cabinHeight * 0.65, 0.35), bodyMat);
  rearDeck.position.set(0, cabinY - 0.04, cabinZ - cabinLen / 2 + 0.18);
  chassisGroup.add(rearDeck);

  // Front Driver & Passenger Bucket Seats
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x262930, roughness: 0.72 });
  const driverSeat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.48, 0.44), seatMat);
  driverSeat.position.set(-width * 0.22, 0.76, cabinZ - 0.18);
  const passengerSeat = driverSeat.clone();
  passengerSeat.position.x = width * 0.22;
  chassisGroup.add(driverSeat, passengerSeat);

  // Dashboard & Rotating Steering Wheel
  const dash = new THREE.Mesh(new THREE.BoxGeometry(width * 0.76, 0.22, 0.35), trimMat);
  dash.position.set(0, 0.88, cabinZ + cabinLen / 2 - 0.18);
  const steeringWheel = new THREE.Group();
  steeringWheel.position.set(-width * 0.22, 0.96, cabinZ + cabinLen / 2 - 0.36);
  steeringWheel.rotation.x = 0.35;
  steeringWheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 6, 14), trimMat));
  chassisGroup.add(dash, steeringWheel);

  // Hinged Hood & Engine Bay (Opens for [H] Engine Repair!)
  const engineBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.32, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.8 })
  );
  engineBlock.position.set(0, 0.72, length * 0.3);
  chassisGroup.add(engineBlock);

  hoodPivot.position.set(0, 0.58 + bodyHeight / 2 + 0.01, length * 0.14);
  const hoodLid = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.06, length * 0.33), bodyMat);
  hoodLid.position.set(0, 0, length * 0.16);
  hoodPivot.add(hoodLid);
  chassisGroup.add(hoodPivot);

  // Hinged Left & Right Doors
  const doorMat = tier === 'police'
    ? new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 })
    : bodyMat;
  leftDoorPivot.position.set(-width / 2 - 0.01, 0.62, 0.55);
  const lDoorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, bodyHeight * 0.88, 1.05), doorMat);
  lDoorPanel.position.set(0, 0, -0.52);
  const lHandle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.16), chromeMat);
  lHandle.position.set(-0.04, 0.12, -0.78);
  leftDoorPivot.add(lDoorPanel, lHandle);
  chassisGroup.add(leftDoorPivot);

  rightDoorPivot.position.set(width / 2 + 0.01, 0.62, 0.55);
  const rDoorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, bodyHeight * 0.88, 1.05), doorMat);
  rDoorPanel.position.set(0, 0, -0.52);
  const rHandle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.16), chromeMat);
  rHandle.position.set(0.04, 0.12, -0.78);
  rightDoorPivot.add(rDoorPanel, rHandle);
  chassisGroup.add(rightDoorPivot);

  if (isTaxi) {
    const taxiSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.18, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xf59e0b, emissiveIntensity: 0.85 })
    );
    taxiSign.position.set(0, cabinY + cabinHeight / 2 + 0.09, cabinZ);
    chassisGroup.add(taxiSign);
  }

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(width * 0.78, cabinHeight * 0.72, 0.08), glassMat);
  windshield.position.set(0, cabinY, cabinZ + cabinLen / 2 + 0.01);
  windshield.rotation.x = -0.35;
  chassisGroup.add(windshield);

  const winGeo = new THREE.BoxGeometry(0.05, cabinHeight * 0.68, cabinLen * 0.65);
  const lw = new THREE.Mesh(winGeo, glassMat);
  lw.position.set(-width * 0.425, cabinY, cabinZ);
  const rw = new THREE.Mesh(winGeo, glassMat);
  rw.position.set(width * 0.425, cabinY, cabinZ);
  chassisGroup.add(lw, rw);

  trunkPivot.position.set(0, 0.58 + bodyHeight / 2, -length / 2 + 0.95);
  const trunkLid = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, 0.08, 0.9), bodyMat);
  trunkLid.position.set(0, 0, -0.45);
  trunkPivot.add(trunkLid);
  chassisGroup.add(trunkPivot);

  if (isLuxury || isMuscle) {
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 0.07, 0.25), trimMat);
    spoiler.position.set(0, 0.2, -0.82);
    trunkPivot.add(spoiler);
  }

  headlightLeft.position.set(-width * 0.34, 0.58, length / 2 + 0.01);
  headlightRight.position.set(width * 0.34, 0.58, length / 2 + 0.01);
  taillightLeft.position.set(-width * 0.32, 0.62, -length / 2 - 0.01);
  taillightRight.position.set(width * 0.32, 0.62, -length / 2 - 0.01);
  blinkerLeftFront.position.set(-width * 0.47, 0.56, length / 2 - 0.04);
  blinkerLeftRear.position.set(-width * 0.47, 0.62, -length / 2 + 0.04);
  blinkerRightFront.position.set(width * 0.47, 0.56, length / 2 - 0.04);
  blinkerRightRear.position.set(width * 0.47, 0.62, -length / 2 + 0.04);
  chassisGroup.add(
    headlightLeft, headlightRight, taillightLeft, taillightRight,
    blinkerLeftFront, blinkerLeftRear, blinkerRightFront, blinkerRightRear
  );

  let lightbarRed: THREE.Mesh | undefined;
  let lightbarBlue: THREE.Mesh | undefined;
  if (tier === 'police') {
    const barY = cabinY + cabinHeight / 2 + 0.08;
    lightbarRed = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.12, 0.24),
      new THREE.MeshStandardMaterial({ color: 0xff1e2d, emissive: 0xff0022, emissiveIntensity: 0.4 })
    );
    lightbarRed.position.set(-0.3, barY, cabinZ);
    lightbarBlue = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.12, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x1d7bff, emissive: 0x0066ff, emissiveIntensity: 0.4 })
    );
    lightbarBlue.position.set(0.3, barY, cabinZ);
    chassisGroup.add(lightbarRed, lightbarBlue);
  }

  wheelFL.position.set(-width / 2 + 0.04, 0.36, length * 0.31);
  wheelFL.add(makeWheel());
  wheelFR.position.set(width / 2 - 0.04, 0.36, length * 0.31);
  wheelFR.add(makeWheel());
  wheelRL = makeWheel();
  wheelRL.position.set(-width / 2 + 0.04, 0.36, -length * 0.31);
  wheelRR = makeWheel();
  wheelRR.position.set(width / 2 - 0.04, 0.36, -length * 0.31);

  root.add(wheelFL, wheelFR, wheelRL, wheelRR);

  return {
    root,
    chassisGroup,
    trunkPivot,
    hoodPivot,
    convertibleRoof,
    steeringWheel,
    leftDoorPivot,
    rightDoorPivot,
    leftWindow: lw,
    rightWindow: rw,
    headlightLeft,
    headlightRight,
    blinkerLeftFront,
    blinkerLeftRear,
    blinkerRightFront,
    blinkerRightRear,
    taillightLeft,
    taillightRight,
    wheelFL,
    wheelFR,
    wheelRL,
    wheelRR,
    lightbarRed,
    lightbarBlue,
    bodyMat,
    halfWidth: width / 2,
    halfLength: length / 2,
  };
}

// ==================== BURGER SHOT DINER INTERIOR, WILDLIFE & CITY PROPS ====================

export function createBurgerShotInteriorGroup(): THREE.Group {
  const g = new THREE.Group();
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.85 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });

  // Ordering Counter & 2 POS Registers
  const counter = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.05, 1.1), redMat);
  counter.position.set(-1.2, 0.525, -1.2);
  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(7.3, 0.08, 1.2), yellowMat);
  counterTop.position.set(-1.2, 1.08, -1.2);
  [-2.6, 0.2].forEach((px) => {
    const pos = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), darkMat);
    pos.position.set(px, 1.32, -1.2);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.28), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    screen.position.set(px, 1.4, -0.98);
    g.add(pos, screen);
  });

  // Back Kitchen Flat-Top Grill, Fryer & Soda Fountain
  const grillBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.95, 1.1), steelMat);
  grillBase.position.set(-2.5, 0.475, -5.2);
  const griddle = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 0.85), darkMat);
  griddle.position.set(-2.5, 0.99, -5.2);
  for (let p = 0; p < 3; p++) {
    const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 10), new THREE.MeshStandardMaterial({ color: 0x5c2d16 }));
    patty.position.set(-3.2 + p * 0.7, 1.05, -5.2);
    g.add(patty);
  }
  const fryer = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.95, 1.0), steelMat);
  fryer.position.set(0.4, 0.475, -5.2);
  const sodaDispenser = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.8), darkMat);
  sodaDispenser.position.set(2.4, 0.7, -5.2);
  const menuBoard = new THREE.Mesh(
    new THREE.BoxGeometry(6.8, 1.2, 0.12),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  menuBoard.position.set(-1.0, 2.8, -6.9);

  // Supply Crate Stack & Mop Bucket near East Wall
  const supplyCrate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.0), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 }));
  supplyCrate.position.set(6.2, 0.45, -4.4);
  const mopBucket = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.25, 0.55, 10), yellowMat);
  mopBucket.position.set(5.4, 0.275, 1.8);
  const spillPuddle = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 14),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, transparent: true, opacity: 0.65 })
  );
  spillPuddle.rotation.x = -Math.PI / 2;
  spillPuddle.position.set(4.5, 0.04, 2.6);

  // Customer Dining Booths
  [2.5, 5.2].forEach((bz) => {
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.74, 0.9), yellowMat);
    table.position.set(-5.2, 0.37, bz);
    const seatA = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.46, 0.45), redMat);
    seatA.position.set(-5.2, 0.23, bz - 0.75);
    const seatB = seatA.clone();
    seatB.position.set(-5.2, 0.23, bz + 0.75);
    g.add(table, seatA, seatB);
  });

  g.add(counter, counterTop, grillBase, griddle, fryer, sodaDispenser, menuBoard, supplyCrate, mopBucket, spillPuddle);
  return g;
}

export function createWildlifeRig(
  species: 'gator' | 'shark' | 'dolphin' | 'deer' | 'boar' | 'bird' | 'fish'
): WildlifeRig {
  const root = new THREE.Group();
  const tailGroup = new THREE.Group();

  if (species === 'gator') {
    const gatorMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.78 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.34, 1.9), gatorMat);
    body.position.y = 0.24;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.24, 0.9), gatorMat);
    head.position.set(0, 0.28, 1.3);
    tailGroup.position.set(0, 0.22, -0.95);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.5, 6), gatorMat);
    tail.rotation.x = -Math.PI / 2;
    tail.position.z = -0.7;
    tailGroup.add(tail);
    root.add(body, head, tailGroup);
    return { root, tailGroup };
  }

  if (species === 'deer') {
    const coatMat = new THREE.MeshStandardMaterial({ color: 0x9a6332, roughness: 0.82 });
    const antlerMat = new THREE.MeshStandardMaterial({ color: 0xe7d9c4, roughness: 0.65 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.44, 1.15), coatMat);
    torso.position.set(0, 0.78, 0);
    torso.castShadow = true;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.55, 8), coatMat);
    neck.position.set(0, 1.05, 0.46);
    neck.rotation.x = 0.35;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.38), coatMat);
    head.position.set(0, 1.28, 0.64);
    const antlerL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.35, 6), antlerMat);
    antlerL.position.set(-0.09, 1.48, 0.58);
    antlerL.rotation.z = 0.32;
    const antlerR = antlerL.clone();
    antlerR.position.x = 0.09;
    antlerR.rotation.z = -0.32;
    [
      [-0.16, -0.38],
      [0.16, -0.38],
      [-0.16, 0.38],
      [0.16, 0.38],
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.65, 6), coatMat);
      leg.position.set(lx, 0.32, lz);
      root.add(leg);
    });
    tailGroup.position.set(0, 0.85, -0.62);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.12), antlerMat);
    tailGroup.add(tail);
    root.add(torso, neck, head, antlerL, antlerR, tailGroup);
    return { root, tailGroup };
  }

  if (species === 'boar') {
    const boarMat = new THREE.MeshStandardMaterial({ color: 0x3b2f2f, roughness: 0.88 });
    const tuskMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.48, 1.05), boarMat);
    body.position.set(0, 0.46, 0);
    body.castShadow = true;
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.35), boarMat);
    snout.position.set(0, 0.44, 0.64);
    const tuskL = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.16, 5), tuskMat);
    tuskL.position.set(-0.12, 0.42, 0.82);
    tuskL.rotation.x = 0.8;
    const tuskR = tuskL.clone();
    tuskR.position.x = 0.12;
    [
      [-0.18, -0.34],
      [0.18, -0.34],
      [-0.18, 0.34],
      [0.18, 0.34],
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.04, 0.32, 6), boarMat);
      leg.position.set(lx, 0.16, lz);
      root.add(leg);
    });
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.05), boarMat);
    tailGroup.position.set(0, 0.56, -0.55);
    tailGroup.add(tail);
    root.add(body, snout, tuskL, tuskR, tailGroup);
    return { root, tailGroup };
  }

  if (species === 'bird') {
    const birdMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 });
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 6), birdMat);
    body.rotation.x = Math.PI / 2;
    const wings = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.03, 0.24), wingMat);
    tailGroup.add(wings);
    root.add(body, tailGroup);
    return { root, tailGroup };
  }

  if (species === 'fish') {
    const fishMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.25, metalness: 0.45 });
    for (let f = 0; f < 4; f++) {
      const fb = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.36, 6), fishMat);
      fb.rotation.x = Math.PI / 2;
      fb.position.set(((f % 2) - 0.5) * 0.7, ((f % 3) - 1) * 0.15, -f * 0.45);
      tailGroup.add(fb);
    }
    root.add(tailGroup);
    return { root, tailGroup };
  }

  const isShark = species === 'shark';
  const seaMat = new THREE.MeshStandardMaterial({
    color: isShark ? 0x475569 : 0x38bdf8,
    roughness: 0.25,
    metalness: 0.2,
  });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(isShark ? 0.36 : 0.26, isShark ? 1.8 : 1.3, 6, 10), seaMat);
  body.rotation.x = Math.PI / 2;
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 4), seaMat);
  dorsal.position.set(0, 0.45, -0.1);
  dorsal.rotation.x = -0.35;
  tailGroup.position.set(0, 0, -1.1);
  const fluke = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.42), seaMat);
  if (isShark) fluke.rotation.z = Math.PI / 2;
  fluke.position.z = -0.2;
  tailGroup.add(fluke);
  root.add(body, dorsal, tailGroup);
  return { root, tailGroup };
}

export function createParkFountain(): THREE.Group {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd6d3cd, roughness: 0.72 });
  const waterMat = createAnimatedFountainWaterMaterial();
  const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.7, 0.55, 24), stoneMat);
  baseRing.position.y = 0.275;
  const poolSurface = new THREE.Mesh(new THREE.CircleGeometry(3.1, 36), waterMat);
  poolSurface.rotation.x = -Math.PI / 2;
  poolSurface.position.y = 0.56;
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 1.9, 14), stoneMat);
  pillar.position.y = 1.25;
  const upperBasin = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.6, 0.35, 18), stoneMat);
  upperBasin.position.y = 2.1;
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.1, 12), waterMat);
  spire.position.y = 2.7;
  g.add(baseRing, poolSurface, pillar, upperBasin, spire);
  g.userData.waterMaterial = waterMat;
  return g;
}

export function createPlaygroundSet(): { group: THREE.Group; carousel: THREE.Group } {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.75 });
  const slideMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.35 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.4 });

  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(11, 0.06, 9),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.92 })
  );
  pad.position.y = 0.03;
  group.add(pad);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 1.6), yellowMat);
  deck.position.set(-3.2, 2.0, -2.0);
  const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.1, 8), metalMat);
  leg1.position.set(-3.9, 1.05, -2.7);
  const leg2 = leg1.clone();
  leg2.position.set(-2.5, 1.05, -2.7);
  const leg3 = leg1.clone();
  leg3.position.set(-3.9, 1.05, -1.3);
  const leg4 = leg1.clone();
  leg4.position.set(-2.5, 1.05, -1.3);
  const chute = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.14, 3.2), slideMat);
  chute.position.set(-3.2, 1.1, -0.2);
  chute.rotation.x = 0.62;
  group.add(deck, leg1, leg2, leg3, leg4, chute);

  const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.2, 10), metalMat);
  topBar.rotation.z = Math.PI / 2;
  topBar.position.set(2.4, 2.8, -2.0);
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.0, 8), metalMat);
  postL.position.set(0.4, 1.45, -2.0);
  const postR = postL.clone();
  postR.position.set(4.4, 1.45, -2.0);
  const seat1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.3), blueMat);
  seat1.position.set(1.6, 0.75, -2.0);
  const seat2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.3), slideMat);
  seat2.position.set(3.2, 0.75, -2.0);
  group.add(topBar, postL, postR, seat1, seat2);

  const carousel = new THREE.Group();
  carousel.position.set(0.2, 0, 2.2);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.16, 20), blueMat);
  disc.position.y = 0.24;
  const rail = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.05, 8, 18), yellowMat);
  rail.rotation.x = Math.PI / 2;
  rail.position.y = 0.95;
  carousel.add(disc, rail);
  group.add(carousel);

  return { group, carousel };
}

export function createParkBench(): THREE.Group {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x854d27, roughness: 0.75 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.7 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.55), wood);
  seat.position.y = 0.45;
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.08), wood);
  back.position.set(0, 0.75, -0.24);
  back.rotation.x = -0.15;
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.5), iron);
  legL.position.set(-0.75, 0.225, 0);
  const legR = legL.clone();
  legR.position.set(0.75, 0.225, 0);
  g.add(seat, back, legL, legR);
  return g;
}

export function createStreetStall(kind: 'burger' | 'fruit' | 'merch'): THREE.Group {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x7c5338, roughness: 0.7 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.7 });
  const awningColor = kind === 'burger' ? 0xef4444 : kind === 'fruit' ? 0x22c55e : 0x0ea5e9;
  const awningMat = new THREE.MeshStandardMaterial({ color: awningColor, roughness: 0.65 });

  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.05, 1.5), wood);
  counter.position.y = 0.525;
  const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.7, 8), metal);
  poleL.position.set(-1.55, 1.35, 0.6);
  const poleR = poleL.clone();
  poleR.position.set(1.55, 1.35, 0.6);
  const poleBL = poleL.clone();
  poleBL.position.set(-1.55, 1.35, -0.6);
  const poleBR = poleL.clone();
  poleBR.position.set(1.55, 1.35, -0.6);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.22, 2.1), awningMat);
  roof.position.y = 2.75;
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.45, 0.14),
    new THREE.MeshBasicMaterial({ color: kind === 'burger' ? 0xfacc15 : 0xf8fafc })
  );
  sign.position.set(0, 2.95, 0.9);
  const grill = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 0.75), metal);
  grill.position.set(-0.6, 1.18, 0);
  g.add(counter, poleL, poleR, poleBL, poleBR, roof, sign, grill);
  return g;
}

export function createRoadSign(colorHex: number): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 4.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.75, roughness: 0.3 })
  );
  pole.position.y = 2.2;
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.15, 0.12),
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 })
  );
  board.position.set(0, 3.8, 0);
  const textStrip = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.2, 0.14),
    new THREE.MeshBasicMaterial({ color: 0xf8fafc })
  );
  textStrip.position.set(0, 3.9, 0);
  const textStrip2 = textStrip.clone();
  textStrip2.position.set(0, 3.55, 0);
  g.add(pole, board, textStrip, textStrip2);
  return g;
}

export function createJasonVillaFurnitureGroup(): THREE.Group {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b442a, roughness: 0.55 });
  const lightWood = new THREE.MeshStandardMaterial({ color: 0xb88b61, roughness: 0.6 });
  const fabricSlate = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
  const fabricCream = new THREE.MeshStandardMaterial({ color: 0xe7e1d5, roughness: 0.85 });
  const fabricCoral = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.8 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.85 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xa5d8ea, transparent: true, opacity: 0.45, roughness: 0.1 });

  // Living Room
  const lSofaA = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.55, 1.05), fabricSlate);
  lSofaA.position.set(-7.0, 0.275, -2.5);
  const lSofaB = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.55, 2.5), fabricSlate);
  lSofaB.position.set(-8.6, 0.275, -1.2);
  const sofa2 = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.55, 0.95), fabricCream);
  sofa2.position.set(-4.2, 0.275, 0.6);
  const armchair = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 0.95), fabricCoral);
  armchair.position.set(-9.4, 0.325, 2.2);
  const recliner = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.75, 1.15), fabricSlate);
  recliner.position.set(-5.0, 0.375, -4.4);
  const ottoman = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.36, 0.65), fabricCream);
  ottoman.position.set(-7.0, 0.18, -0.9);
  const beanBag = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), fabricCoral);
  beanBag.scale.set(1.2, 0.72, 1.2);
  beanBag.position.set(-9.6, 0.32, 4.2);
  const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.42, 0.95), glass);
  coffeeTable.position.set(-7.0, 0.21, 0.3);
  const sideTable = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.55, 12), lightWood);
  sideTable.position.set(-4.4, 0.275, -2.5);
  const consoleTable = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.78, 0.45), wood);
  consoleTable.position.set(-2.4, 0.39, -5.5);
  const tvUnit = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 0.68), wood);
  tvUnit.position.set(-7.0, 0.275, 3.8);
  const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 0.08), new THREE.MeshBasicMaterial({ color: 0x0ea5e9 }));
  tvScreen.position.set(-7.0, 1.45, 3.8);
  const bookshelf = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.45), wood);
  bookshelf.position.set(-11.4, 1.1, 1.0);
  const showcase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.0, 0.5), glass);
  showcase.position.set(-11.4, 1.0, -3.5);
  g.add(lSofaA, lSofaB, sofa2, armchair, recliner, ottoman, beanBag, coffeeTable, sideTable, consoleTable, tvUnit, tvScreen, bookshelf, showcase);

  // Bedroom
  const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.42, 2.4), wood);
  bedFrame.position.set(7.2, 0.21, -6.2);
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.28, 2.25), fabricCream);
  mattress.position.set(7.2, 0.52, -6.2);
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(2.66, 0.14, 1.35), fabricCoral);
  blanket.position.set(7.2, 0.64, -5.75);
  const pillowL = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.16, 0.45), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  pillowL.position.set(6.55, 0.72, -7.0);
  const pillowR = pillowL.clone();
  pillowR.position.set(7.85, 0.72, -7.0);
  const blanketBench = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.46, 0.55), fabricSlate);
  blanketBench.position.set(7.2, 0.23, -4.4);
  const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 0.8), wood);
  wardrobe.position.set(11.2, 1.2, -5.8);
  const nightstandL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), lightWood);
  nightstandL.position.set(5.3, 0.275, -7.0);
  const nightstandR = nightstandL.clone();
  nightstandR.position.set(9.1, 0.275, -7.0);
  const vanity = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.78, 0.55), lightWood);
  vanity.position.set(3.4, 0.39, -7.6);
  const mirror = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 0.06), glass);
  mirror.position.set(3.4, 1.25, -7.85);
  const dresser = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.15, 0.55), wood);
  dresser.position.set(11.2, 0.575, -2.5);
  g.add(bedFrame, mattress, blanket, pillowL, pillowR, blanketBench, wardrobe, nightstandL, nightstandR, vanity, mirror, dresser);

  // Dining & Kitchen
  const diningTable = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.76, 1.3), wood);
  diningTable.position.set(0.0, 0.38, -4.0);
  for (let i = -1; i <= 1; i++) {
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.46), lightWood);
    c1.position.set(i * 0.85, 0.23, -4.9);
    const c2 = c1.clone();
    c2.position.set(i * 0.85, 0.23, -3.1);
    g.add(c1, c2);
  }
  const island = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.95, 1.1), lightWood);
  island.position.set(0, 0.475, -7.2);
  const crockery = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.85, 0.55), wood);
  crockery.position.set(-2.8, 0.925, -8.8);
  const wineRack = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.4, 0.45), wood);
  wineRack.position.set(2.2, 0.7, -8.8);
  g.add(diningTable, island, crockery, wineRack);

  // Study & Home Gym
  const officeDesk = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.76, 0.85), wood);
  officeDesk.position.set(6.5, 0.38, 3.0);
  const pcMonitor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.52, 0.07), new THREE.MeshBasicMaterial({ color: 0x2dd4bf }));
  pcMonitor.position.set(6.5, 1.08, 2.75);
  const gamingChair = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.05, 0.62), fabricCoral);
  gamingChair.position.set(6.5, 0.525, 4.0);
  const filingCab = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.25, 0.65), metal);
  filingCab.position.set(8.2, 0.625, 2.9);
  const wallShelf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.35), lightWood);
  wallShelf.position.set(6.5, 1.85, 2.2);
  g.add(officeDesk, pcMonitor, gamingChair, filingCab, wallShelf);

  const benchPress = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 0.5), new THREE.MeshStandardMaterial({ color: 0xb91c1c }));
  benchPress.position.set(10.5, 0.225, 5.2);
  const barbell = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8), metal);
  barbell.rotation.x = Math.PI / 2;
  barbell.position.set(10.5, 1.05, 5.2);
  const dumbbellRack = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 0.45), metal);
  dumbbellRack.position.set(11.4, 0.375, 7.2);
  const treadmill = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.85), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
  treadmill.position.set(8.2, 0.125, 7.2);
  g.add(benchPress, barbell, dumbbellRack, treadmill);

  // Bathroom, Utility & Patio
  const bathVanity = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.82, 0.6), fabricCream);
  bathVanity.position.set(11.2, 0.41, 0.5);
  const shoeRack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.35), lightWood);
  shoeRack.position.set(-2.2, 0.35, 8.2);
  const coatRack = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.25, 1.85, 8), wood);
  coatRack.position.set(-3.4, 0.925, 8.2);
  const laundryHamper = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.62, 10), fabricCream);
  laundryHamper.position.set(10.2, 0.31, -1.2);
  g.add(bathVanity, shoeRack, coatRack, laundryHamper);

  const patioTable = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.74, 14), lightWood);
  patioTable.position.set(-10.5, 0.37, 13.5);
  const umbrellaPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), metal);
  umbrellaPole.position.set(-10.5, 1.25, 13.5);
  const umbrellaCanopy = new THREE.Mesh(new THREE.ConeGeometry(1.9, 0.65, 12), fabricCoral);
  umbrellaCanopy.position.set(-10.5, 2.45, 13.5);
  const lounger1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 2.0), fabricCream);
  lounger1.position.set(-6.5, 0.175, 14.2);
  const swingFrame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.1, 0.14), metal);
  swingFrame.position.set(8.5, 1.05, 14.0);
  const swingSeat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.14, 0.65), fabricCoral);
  swingSeat.position.set(8.5, 0.55, 14.0);
  const barCart = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.8, 0.55), metal);
  barCart.position.set(-12.2, 0.4, 12.2);
  g.add(patioTable, umbrellaPole, umbrellaCanopy, lounger1, swingFrame, swingSeat, barCart);

  return g;
}

export function createCashPickupMesh(): THREE.Group {
  const g = new THREE.Group();
  const bill = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.14, 0.24),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, emissive: 0x15803d, emissiveIntensity: 0.55, roughness: 0.4 })
  );
  const band = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.15, 0.25),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 })
  );
  g.add(bill, band);
  return g;
}

export function createDeadDropCrateMesh(): THREE.Group {
  const g = new THREE.Group();
  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 0.72, 0.72),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.55 })
  );
  crate.position.y = 0.36;
  const beacon = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.12, 0.6),
    new THREE.MeshBasicMaterial({ color: 0x10b981 })
  );
  beacon.position.y = 0.76;
  g.add(crate, beacon);
  return g;
}

export function createOverWaterBridgeMesh(
  axis: 'x' | 'z',
  length: number,
  width: number,
  deckHeight: number,
  roadTex: THREE.Texture
): THREE.Group {
  const g = new THREE.Group();
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.75 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4, metalness: 0.65 });
  const deckMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.7 });
  const lampGlow = new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xfbbf24, emissiveIntensity: 1.5 });

  const flatSpan = length > 400 ? 520 : 104;
  const rampLen = (length - flatSpan) / 2;

  const flatDeck = new THREE.Mesh(new THREE.BoxGeometry(width, 0.55, flatSpan), deckMat);
  flatDeck.position.set(0, deckHeight - 0.27, 0);
  flatDeck.receiveShadow = true;
  g.add(flatDeck);

  // Sloped approaches at both ends (from ROAD_Y = 0.08 up to deckHeight)
  const rampRise = Math.max(0.5, deckHeight - 0.08);
  const slopeAngle = Math.atan2(rampRise, rampLen);
  const rampHyp = Math.hypot(rampLen, rampRise);
  [-1, 1].forEach((dir) => {
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(width, 0.48, rampHyp), deckMat);
    ramp.position.set(0, 0.08 + rampRise / 2 - 0.24, dir * (flatSpan / 2 + rampLen / 2));
    ramp.rotation.x = dir * slopeAngle;
    ramp.receiveShadow = true;
    g.add(ramp);
  });

  // Full-length Guardrails along flat span + Support Pylons + Streetlamps
  [-width / 2 + 0.4, width / 2 - 0.4].forEach((rx) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.05, flatSpan + 12), railMat);
    rail.position.set(rx, deckHeight + 0.52, 0);
    g.add(rail);
  });

  const pylonStep = flatSpan > 200 ? 75 : 22;
  for (let pz = -flatSpan / 2 + 25; pz <= flatSpan / 2 - 25; pz += pylonStep) {
    [-width / 2 + 1.5, width / 2 - 1.5].forEach((px) => {
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.15, deckHeight + 4.2, 8), concreteMat);
      pylon.position.set(px, deckHeight / 2 - 2.0, pz);
      g.add(pylon);
    });
    const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 5.2, 6), railMat);
    lampPole.position.set(-width / 2 + 0.55, deckHeight + 2.6, pz);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), lampGlow);
    bulb.position.set(-width / 2 + 0.55, deckHeight + 5.3, pz);
    g.add(lampPole, bulb);
  }

  if (axis === 'x') {
    g.rotation.y = Math.PI / 2;
  }
  return g;
}

export function createWoodenDockMesh(width: number, depth: number, deckY: number): THREE.Group {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x7c4a26, roughness: 0.85 });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x452b17, roughness: 0.9 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(width, 0.24, depth), woodMat);
  deck.position.y = deckY;
  deck.receiveShadow = true;
  g.add(deck);

  [-width * 0.42, 0, width * 0.42].forEach((px) => {
    [-depth * 0.4, depth * 0.4].forEach((pz) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 3.6, 8), postMat);
      post.position.set(px, deckY - 1.1, pz);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.15, 8), woodMat);
      cap.position.set(px, deckY + 0.72, pz);
      g.add(post, cap);
    });
  });
  return g;
}

export function createDealershipInteriorGroup(
  contactShadowTex: THREE.Texture,
  isSoftwareGl: boolean
): { group: THREE.Group; turntables: THREE.Group[] } {
  const group = new THREE.Group();
  const turntables: THREE.Group[] = [];
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25, metalness: 0.75 });
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf });
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.5 });

  // Sales Counter & Mod Lift Bay
  const desk = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.05, 1.0), deskMat);
  desk.position.set(-5.0, 0.525, -4.8);
  const neonTrim = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.08, 1.05), ringMat);
  neonTrim.position.set(-5.0, 1.06, -4.8);
  group.add(desk, neonTrim);

  // Two Illuminated Rotating Car Turntables with 3D Display Vehicles!
  const specs: Array<{ x: number; z: number; tier: VehicleTier; color: string }> = [
    { x: -3.8, z: 1.5, tier: 'luxury', color: '#f59e0b' },
    { x: 4.5, z: 1.5, tier: 'muscle', color: '#ff3b5c' },
  ];
  specs.forEach((sp) => {
    const tt = new THREE.Group();
    tt.position.set(sp.x, 0.12, sp.z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.22, 24), plinthMat);
    const glowRing = new THREE.Mesh(new THREE.TorusGeometry(3.22, 0.05, 6, 28), ringMat);
    glowRing.rotation.x = Math.PI / 2;
    glowRing.position.y = 0.11;
    const carRig = createVehicleRig(sp.tier, sp.color, contactShadowTex, isSoftwareGl);
    carRig.root.position.y = 0.12;
    tt.add(base, glowRing, carRig.root);
    turntables.push(tt);
    group.add(tt);
  });

  return { group, turntables };
}

// ─── TRAFFIC LIGHTS, BILLBOARDS, BUS STOPS, LUXURY BUNGALOWS & INSTANCED TREES ──

export interface TrafficLightRig {
  group: THREE.Group;
  redMat: THREE.MeshStandardMaterial;
  yellowMat: THREE.MeshStandardMaterial;
  greenMat: THREE.MeshStandardMaterial;
}

export function createTrafficLightRig(): TrafficLightRig {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.78, roughness: 0.35 });
  const housingMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6, metalness: 0.3 });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 5.4, 8), poleMat);
  pole.position.y = 2.7;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 4.2, 8), poleMat);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(-2.0, 5.15, 0);

  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.18, 0.38), housingMat);
  housing.position.set(-3.4, 4.75, 0);

  const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.8 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 0.05 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.05 });

  const rBulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), redMat);
  rBulb.position.set(-3.4, 5.1, 0.18);
  const yBulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), yellowMat);
  yBulb.position.set(-3.4, 4.75, 0.18);
  const gBulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), greenMat);
  gBulb.position.set(-3.4, 4.4, 0.18);

  const rBack = rBulb.clone();
  rBack.position.z = -0.18;
  const yBack = yBulb.clone();
  yBack.position.z = -0.18;
  const gBack = gBulb.clone();
  gBack.position.z = -0.18;

  group.add(pole, arm, housing, rBulb, yBulb, gBulb, rBack, yBack, gBack);
  return { group, redMat, yellowMat, greenMat };
}

export function createBillboardMesh(adTex: THREE.Texture, width = 10, height = 5): THREE.Group {
  const g = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.82, roughness: 0.35 });
  const pylonL = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 7.6, 8), steelMat);
  pylonL.position.set(-width * 0.3, 3.8, 0);
  const pylonR = pylonL.clone();
  pylonR.position.set(width * 0.3, 3.8, 0);
  const backing = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, height + 0.4, 0.35), steelMat);
  backing.position.set(0, 7.6, 0);
  const adMat = new THREE.MeshStandardMaterial({
    map: adTex,
    emissiveMap: adTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.65,
    roughness: 0.3,
  });
  const frontFace = new THREE.Mesh(new THREE.PlaneGeometry(width, height), adMat);
  frontFace.position.set(0, 7.6, 0.19);
  const backFace = new THREE.Mesh(new THREE.PlaneGeometry(width, height), adMat);
  backFace.position.set(0, 7.6, -0.19);
  backFace.rotation.y = Math.PI;
  g.add(pylonL, pylonR, backing, frontFace, backFace);
  return g;
}

export function createBusStopMesh(): THREE.Group {
  const g = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.35 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.38, roughness: 0.1 });
  const signMat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf });
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });

  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 1.8), frameMat);
  roof.position.set(0, 2.55, 0);
  const backGlass = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.4, 0.08), glassMat);
  backGlass.position.set(0, 1.3, -0.82);
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.55, 8), frameMat);
  postL.position.set(-1.95, 1.275, -0.82);
  const postR = postL.clone();
  postR.position.set(1.95, 1.275, -0.82);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.55), benchMat);
  bench.position.set(-0.3, 0.52, -0.35);
  const routePost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 8), frameMat);
  routePost.position.set(2.3, 1.4, 0.4);
  const routeSign = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.08), signMat);
  routeSign.position.set(2.3, 2.55, 0.4);
  g.add(roof, backGlass, postL, postR, bench, routePost, routeSign);
  return g;
}

export function createLuxuryBungalowMesh(accentColor: number): THREE.Group {
  const g = new THREE.Group();
  const stucco = new THREE.MeshStandardMaterial({ color: 0xf4ece2, roughness: 0.8 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x78492a, roughness: 0.65 });
  const accent = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.35, metalness: 0.2 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.45, roughness: 0.08 });

  // Elevated Tropical Deck & Veranda
  const deck = new THREE.Mesh(new THREE.BoxGeometry(22, 0.45, 18), wood);
  deck.position.set(0, 0.225, 2);
  deck.receiveShadow = true;

  // Main Luxury Bungalow Structure
  const body = new THREE.Mesh(new THREE.BoxGeometry(17.5, 4.4, 12.5), stucco);
  body.position.set(0, 2.65, -0.5);
  body.castShadow = true;
  body.receiveShadow = true;

  // Sloped Overhanging Coastal Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(13.5, 2.6, 4), accent);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, 6.1, -0.5);
  roof.castShadow = true;

  // Panoramic Veranda Windows & Neon Strip
  const windowWall = new THREE.Mesh(new THREE.BoxGeometry(11.5, 2.5, 0.15), glass);
  windowWall.position.set(0, 2.1, 5.8);
  const neonTrim = new THREE.Mesh(
    new THREE.BoxGeometry(18.2, 0.14, 13.0),
    new THREE.MeshBasicMaterial({ color: accentColor })
  );
  neonTrim.position.set(0, 4.9, -0.5);

  // Infinity Swimming Pool in Front Yard
  const poolBorder = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.35, 7.6), stucco);
  poolBorder.position.set(0, 0.18, 22);
  const poolWater = new THREE.Mesh(
    new THREE.PlaneGeometry(11.6, 6.4),
    createAnimatedFountainWaterMaterial()
  );
  poolWater.rotation.x = -Math.PI / 2;
  poolWater.position.set(0, 0.37, 22);
  g.userData.waterMaterial = poolWater.material;

  // Sun Loungers
  [-4.5, 4.5].forEach((lx) => {
    const lounger = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.35, 2.3), stucco);
    lounger.position.set(lx, 0.55, 16.5);
    g.add(lounger);
  });

  g.add(deck, body, roof, windowWall, neonTrim, poolBorder, poolWater);
  return g;
}

export function createAirportFenceAndGateMesh(
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  gateX: number,
  gateZ: number,
  gateWidth: number
): THREE.Group {
  const g = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.78, roughness: 0.32 });
  const jaliMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.6,
    roughness: 0.4,
    wireframe: true,
    transparent: true,
    opacity: 0.75,
  });
  const topRailMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.75, roughness: 0.35 });

  const addFenceSpan = (x1: number, z1: number, x2: number, z2: number) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    if (len < 2) return;
    const mx = (x1 + x2) / 2;
    const mz = (z1 + z2) / 2;
    const yaw = Math.atan2(dx, dz);

    const spanGroup = new THREE.Group();
    spanGroup.position.set(mx, 0, mz);
    spanGroup.rotation.y = yaw;

    const segs = Math.max(4, Math.min(28, Math.round(len / 28)));
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(len, 4.2, segs, 3), jaliMat);
    panel.rotation.y = Math.PI / 2;
    panel.position.y = 2.1;
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, len), topRailMat);
    topRail.position.y = 4.25;
    spanGroup.add(panel, topRail);

    const postCount = Math.max(2, Math.floor(len / 32));
    for (let i = 0; i <= postCount; i++) {
      const pz = -len / 2 + (len * i) / postCount;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 4.6, 6), postMat);
      post.position.set(0, 2.3, pz);
      spanGroup.add(post);
    }
    g.add(spanGroup);
  };

  const halfGate = gateWidth / 2;
  addFenceSpan(minX, minZ, maxX, minZ); // North perimeter
  addFenceSpan(minX, maxZ, maxX, maxZ); // South perimeter
  addFenceSpan(minX, minZ, minX, maxZ); // West perimeter
  addFenceSpan(gateX, minZ, gateX, gateZ - halfGate); // East upper
  addFenceSpan(gateX, gateZ + halfGate, gateX, maxZ); // East lower

  // Illuminated Security Gate Arch + Guard Booth (leaves full 40u drive-through clearance!)
  const archGroup = new THREE.Group();
  archGroup.position.set(gateX, 0, gateZ);
  const pillarL = new THREE.Mesh(new THREE.BoxGeometry(1.8, 7.2, 2.0), postMat);
  pillarL.position.set(0, 3.6, -halfGate);
  const pillarR = pillarL.clone();
  pillarR.position.z = halfGate;
  const headerBeam = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.5, gateWidth + 2.4),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.6 })
  );
  headerBeam.position.set(0, 7.6, 0);
  const neonStrip = new THREE.Mesh(
    new THREE.BoxGeometry(2.35, 0.28, gateWidth + 1.2),
    new THREE.MeshBasicMaterial({ color: 0x2dd4bf })
  );
  neonStrip.position.set(0, 7.6, 0);
  const booth = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 3.0, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
  );
  booth.position.set(-2.5, 1.5, -halfGate - 2.6);
  archGroup.add(pillarL, pillarR, headerBeam, neonStrip, booth);
  g.add(archGroup);

  return g;
}

export function createAirportTicketCounterMesh(): THREE.Group {
  const g = new THREE.Group();
  const marble = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25 });
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.6 });
  const neonMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  const desk = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.15, 1.4), deskMat);
  desk.position.set(0, 0.575, 0);
  const top = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.12, 1.6), marble);
  top.position.set(0, 1.21, 0);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.22, 2.4), deskMat);
  canopy.position.set(0, 3.6, 0);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.42, 0.22), neonMat);
  sign.position.set(0, 3.6, 1.15);
  [-2.6, 2.6].forEach((px) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.6, 8), marble);
    col.position.set(px, 1.8, -0.7);
    g.add(col);
  });
  g.add(desk, top, canopy, sign);
  return g;
}

export function createTaxiStandMesh(): THREE.Group {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.3 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xd97706, emissiveIntensity: 0.55, roughness: 0.35 });

  const roof = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.22, 2.8), metal);
  roof.position.set(0, 3.1, 0);
  const taxiCrown = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.62, 0.45), yellow);
  taxiCrown.position.set(0, 3.5, 0);
  [-2.8, 2.8].forEach((px) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 3.1, 8), metal);
    post.position.set(px, 1.55, -1.0);
    g.add(post);
  });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.14, 0.65), yellow);
  bench.position.set(0, 0.55, -0.4);
  const kiosk = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.55, 0.55), metal);
  kiosk.position.set(2.4, 0.775, 0.6);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.42), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  screen.position.set(2.4, 1.15, 0.89);
  g.add(roof, taxiCrown, bench, kiosk, screen);
  return g;
}

export function createStorefrontSignMesh(
  title: string,
  subtitle: string,
  bgColor: string,
  accentColor: string,
  width = 8.4
): THREE.Group {
  const g = new THREE.Group();
  const height = width * 0.28;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.65 });
  const signTex = createStorefrontSignTexture(title, subtitle, bgColor, accentColor);
  const faceMat = new THREE.MeshStandardMaterial({
    map: signTex,
    emissiveMap: signTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.72,
    roughness: 0.3,
  });

  const casing = new THREE.Mesh(new THREE.BoxGeometry(width + 0.24, height + 0.24, 0.28), frameMat);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height), faceMat);
  face.position.z = 0.15;
  g.add(casing, face);
  return g;
}
