import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export interface PostProcessingRig {
  composer: EffectComposer | null;
  bloomPass: UnrealBloomPass | null;
  fxaaPass: ShaderPass | null;
  resize: (width: number, height: number, pixelRatio: number) => void;
  render: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => void;
  dispose: () => void;
}

export function createEnvironmentLightingRig(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.25;
  pmremGenerator.dispose();

  const sky = new Sky();
  sky.scale.setScalar(4500);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;
  skyUniforms['turbidity'].value = 2.2;
  skyUniforms['rayleigh'].value = 1.45;
  skyUniforms['mieCoefficient'].value = 0.0006;
  skyUniforms['mieDirectionalG'].value = 0.58;

  return { sky, skyUniforms };
}

export function createPostProcessingPipeline(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  isSoftwareGl: boolean
): PostProcessingRig {
  if (isSoftwareGl) {
    return {
      composer: null,
      bloomPass: null,
      fxaaPass: null,
      resize: () => undefined,
      render: (sc, cam, r) => r.render(sc, cam),
      dispose: () => undefined,
    };
  }

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    0.22,
    0.35,
    0.88
  );
  composer.addPass(bloomPass);

  const fxaaPass = new ShaderPass(FXAAShader);
  const pr = renderer.getPixelRatio();
  fxaaPass.material.uniforms['resolution'].value.set(1 / (width * pr), 1 / (height * pr));
  composer.addPass(fxaaPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  return {
    composer,
    bloomPass,
    fxaaPass,
    resize(w, h, pixelRatio) {
      composer.setSize(w, h);
      bloomPass.setSize(w, h);
      fxaaPass.material.uniforms['resolution'].value.set(1 / (w * pixelRatio), 1 / (h * pixelRatio));
    },
    render() {
      composer.render();
    },
    dispose() {
      composer.dispose();
    },
  };
}

/**
 * Spring-arm third-person camera wall collision detector.
 * Raymarches from focus point to desired camera position so walls never clip the view.
 */
export function resolveSpringArmCameraPosition(
  focusX: number,
  focusY: number,
  focusZ: number,
  desiredX: number,
  desiredY: number,
  desiredZ: number,
  isPointInsideBuilding: (x: number, y: number, z: number) => boolean,
  outPos: THREE.Vector3
) {
  const steps = 10;
  let safeT = 1.0;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const sx = focusX + (desiredX - focusX) * t;
    const sy = focusY + (desiredY - focusY) * t;
    const sz = focusZ + (desiredZ - focusZ) * t;
    if (isPointInsideBuilding(sx, sy, sz)) {
      safeT = Math.max(0.22, (i - 1) / steps);
      break;
    }
  }
  outPos.set(
    focusX + (desiredX - focusX) * safeT,
    focusY + (desiredY - focusY) * safeT,
    focusZ + (desiredZ - focusZ) * safeT
  );
}

/**
 * Optional GLTF (.glb) Asset Plugin Loader with THREE.AnimationMixer & crossFadeTo support.
 * Allows plugging in external Poly Pizza / Sketchfab CC0 / Mixamo .glb models seamlessly.
 */
export class GltfCharacterPlugin {
  private loader = new GLTFLoader();
  public mixer: THREE.AnimationMixer | null = null;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private currentAction: THREE.AnimationAction | null = null;

  public async loadCharacterGlb(url: string, parentGroup: THREE.Group): Promise<boolean> {
    try {
      const gltf = await this.loader.loadAsync(url);
      gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      parentGroup.add(gltf.scene);
      if (gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(gltf.scene);
        gltf.animations.forEach((clip) => {
          this.actions.set(clip.name.toLowerCase(), this.mixer!.clipAction(clip));
        });
        const first = this.actions.values().next().value;
        if (first) {
          first.play();
          this.currentAction = first;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  public crossFadeTo(clipName: string, duration = 0.25) {
    if (!this.mixer) return;
    const next = this.actions.get(clipName.toLowerCase());
    if (!next || next === this.currentAction) return;
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
    if (this.currentAction) {
      this.currentAction.crossFadeTo(next, duration, true);
    }
    this.currentAction = next;
  }

  public update(dt: number) {
    if (this.mixer) this.mixer.update(dt);
  }
}
