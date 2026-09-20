import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Scene } from "@babylonjs/core/scene";
import topoTextureAsset from "../../../assets/magina-topo-texture.jpg";

export type GameHandle = {
  scene: Scene;
  dispose: () => void;
};

const TOPO_TEXTURE = topoTextureAsset;

function mat(scene: Scene, name: string, color: Color3, emissive?: Color3) {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = color;
  material.specularColor = new Color3(0.05, 0.07, 0.08);
  if (emissive) material.emissiveColor = emissive;
  return material;
}

export async function createGameScene(engine: Engine, canvas: HTMLCanvasElement): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.015, 0.035, 0.055, 0.56);

  const camera = new ArcRotateCamera("expedition-camera", -Math.PI / 2.6, 1.08, 22, new Vector3(0, 1.2, 0), scene);
  camera.lowerRadiusLimit = 18;
  camera.upperRadiusLimit = 28;
  camera.attachControl(canvas, false);
  camera.inputs.removeByType("ArcRotateCameraMouseWheelInput");
  camera.panningSensibility = 0;
  camera.wheelPrecision = 120;

  const hemi = new HemisphericLight("moonlight", new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.52;
  hemi.diffuse = new Color3(0.38, 0.52, 0.66);
  hemi.groundColor = new Color3(0.025, 0.04, 0.055);

  const lantern = new PointLight("lantern", new Vector3(0.5, 3.2, -1.5), scene);
  lantern.diffuse = new Color3(1, 0.48, 0.12);
  lantern.intensity = 24;
  lantern.range = 16;

  const groundMaterial = new StandardMaterial("topo-ground", scene);
  const topoTexture = new Texture(TOPO_TEXTURE, scene);
  topoTexture.uScale = 2.8;
  topoTexture.vScale = 2.8;
  groundMaterial.diffuseTexture = topoTexture;
  groundMaterial.diffuseColor = new Color3(0.32, 0.42, 0.44);
  groundMaterial.emissiveColor = new Color3(0.015, 0.028, 0.035);

  const ground = MeshBuilder.CreateGround("mágina-terrain", { width: 34, height: 25, subdivisions: 24 }, scene);
  ground.material = groundMaterial;
  ground.position.y = -0.15;

  const ridgeMaterial = mat(scene, "ridge", new Color3(0.055, 0.12, 0.14));
  const ridgeBackMaterial = mat(scene, "ridge-back", new Color3(0.035, 0.075, 0.095));
  const peakMaterial = mat(scene, "peak-light", new Color3(0.16, 0.24, 0.24));

  const ridges = [
    { x: -10, z: 4.2, r: 5.4, h: 6.2, material: ridgeBackMaterial },
    { x: -5.8, z: 5.6, r: 4.1, h: 5.2, material: ridgeMaterial },
    { x: 0, z: 6.4, r: 5.9, h: 7.5, material: ridgeBackMaterial },
    { x: 6.4, z: 5.5, r: 4.5, h: 5.8, material: ridgeMaterial },
    { x: 10.8, z: 3.9, r: 4.6, h: 6.8, material: ridgeBackMaterial },
  ];

  ridges.forEach((item, index) => {
    const mesh = MeshBuilder.CreateCylinder(`ridge-${index}`, { diameterTop: 0.2, diameterBottom: item.r, height: item.h, tessellation: 7 }, scene);
    mesh.position = new Vector3(item.x, item.h / 2 - 0.1, item.z);
    mesh.rotation.y = 0.2 * index;
    mesh.material = item.material;
  });

  const nearPeak = MeshBuilder.CreateCylinder("near-peak", { diameterTop: 0.1, diameterBottom: 3.4, height: 3.4, tessellation: 6 }, scene);
  nearPeak.position = new Vector3(-5.6, 1.55, 1.6);
  nearPeak.rotation.y = 0.35;
  nearPeak.material = peakMaterial;

  const beaconMaterial = mat(scene, "beacon-amber", new Color3(0.8, 0.3, 0.05), new Color3(1, 0.12, 0.01));
  const beacon = MeshBuilder.CreateSphere("active-beacon", { diameter: 0.48, segments: 18 }, scene);
  beacon.position = new Vector3(1.9, 0.72, 0.9);
  beacon.material = beaconMaterial;

  const beaconHalo = MeshBuilder.CreateTorus("beacon-halo", { diameter: 1.1, thickness: 0.035, tessellation: 32 }, scene);
  beaconHalo.position = new Vector3(1.9, 0.35, 0.9);
  beaconHalo.rotation.x = Math.PI / 2;
  beaconHalo.material = mat(scene, "halo", new Color3(1, 0.45, 0.1), new Color3(1, 0.13, 0.01));

  const markerMaterial = mat(scene, "marker-ivory", new Color3(0.78, 0.69, 0.48), new Color3(0.18, 0.12, 0.04));
  const marker = MeshBuilder.CreateBox("stone-marker", { width: 0.35, height: 0.9, depth: 0.35 }, scene);
  marker.position = new Vector3(2.0, 0.35, 0.9);
  marker.rotation.y = -0.22;
  marker.material = markerMaterial;

  const update = scene.onBeforeRenderObservable.add(() => {
    const t = performance.now() / 1000;
    beacon.position.y = 0.72 + Math.sin(t * 2.4) * 0.08;
    beaconHalo.scaling.x = 1 + Math.sin(t * 2.4) * 0.12;
    beaconHalo.scaling.z = 1 + Math.sin(t * 2.4) * 0.12;
    lantern.intensity = 22 + Math.sin(t * 4.5) * 1.6;
    camera.alpha += 0.00018;
  });

  return {
    scene,
    dispose: () => {
      scene.onBeforeRenderObservable.remove(update);
      scene.dispose();
    },
  };
}
