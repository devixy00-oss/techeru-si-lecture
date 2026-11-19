'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { speechManager, LipSyncData } from '@/audio/SpeechManager';
import { TeacherState } from '@/teacher/TeacherStateMachine';

export type AnimationName =
  | 'idle'
  | 'breathing'
  | 'blinking'
  | 'explaining'
  | 'pointing'
  | 'point'
  | 'raisingHands'
  | 'nodding'
  | 'greeting'
  | 'waving'
  | 'demonstrating'
  | 'encouraging'
  | 'thinking'
  | 'happy'
  | 'sad'
  | 'confused'
  | 'surprised'
  | 'excited'
  | 'concerned'
  | 'curious'
  | 'proud'
  | 'walking'
  | 'running'
  | 'jumping'
  | 'sitting'
  | 'standing'
  | 'turning'
  | 'clap'
  | 'nod'
  | 'angry'
  | 'goodbye'
  | 'listening';

export type CameraPreset = 'face' | 'waist' | 'full';

interface TeacherCat3DProps {
  state?: TeacherState;
  animation?: AnimationName;
  isCameraOn?: boolean;
  cameraPreset?: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
  className?: string;
}

// ════════════════════════════════════════════════════════════════════
// 1. PROCEDURAL PBR TEXTURES (HIGH-RESOLUTION COAT, SUIT & LEATHER)
// ════════════════════════════════════════════════════════════════════

/**
 * Rich Orange Tabby Coat Texture with fine hair grain and organic stripes
 */
function createTabbyFurTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Warm amber-orange base gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#f28a2a');
  grad.addColorStop(0.35, '#f89a38');
  grad.addColorStop(0.7, '#ea7c20');
  grad.addColorStop(1, '#db6916');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Soft organic tabby tiger stripes
  ctx.strokeStyle = '#993a05';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let y = 50; y < 1000; y += 70) {
    ctx.lineWidth = 26 + Math.sin(y * 0.04) * 8;
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.bezierCurveTo(320, y + 35, 680, y - 25, 960, y + 15);
    ctx.stroke();

    // Secondary subtle feathered stripe
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(153, 58, 5, 0.42)';
    ctx.beginPath();
    ctx.moveTo(120, y + 36);
    ctx.bezierCurveTo(380, y + 60, 640, y + 10, 900, y + 42);
    ctx.stroke();
    ctx.strokeStyle = '#993a05';
  }

  // Realistic microscopic fur fibers
  ctx.strokeStyle = 'rgba(255, 230, 185, 0.25)';
  ctx.lineWidth = 2.0;
  for (let i = 0; i < 4000; i++) {
    const rx = Math.random() * 1024;
    const ry = Math.random() * 1024;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + (Math.random() - 0.5) * 8, ry + 14);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Tailored Royal Navy Wool Fabric Weave Texture
 */
function createSuitWoolTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#182b4c';
  ctx.fillRect(0, 0, 512, 512);

  // Fine twill micro-weave
  ctx.strokeStyle = 'rgba(38, 64, 108, 0.5)';
  ctx.lineWidth = 1.5;
  for (let i = -512; i < 1024; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 512, 512);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(15, 28, 52, 0.6)';
  for (let i = 0; i < 1024; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i - 512, 512);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

/**
 * Bespoke Navy & Golden-Yellow Diagonal Striped Tie Texture
 */
function createTieTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#142542';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = -512; i < 1024; i += 64) {
    // Bold Gold stripe
    ctx.strokeStyle = '#e5b03f';
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 512, 512);
    ctx.stroke();

    // Crisp silver pin-stripe
    ctx.strokeStyle = '#a4bedd';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(i + 22, 0);
    ctx.lineTo(i + 534, 512);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Green Iris Texture with Limbal Ring & Radial Fibers
 */
function createIrisTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;
  const r = 240;

  const grad = ctx.createRadialGradient(cx, cy, 25, cx, cy, r);
  grad.addColorStop(0, '#66d158');
  grad.addColorStop(0.42, '#3fa643');
  grad.addColorStop(0.8, '#1e6824');
  grad.addColorStop(1, '#08280d');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(185, 250, 170, 0.45)';
  ctx.lineWidth = 2.5;
  for (let a = 0; a < Math.PI * 2; a += 0.065) {
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 35, cy + Math.sin(a) * 35);
    ctx.lineTo(cx + Math.cos(a) * 228, cy + Math.sin(a) * 228);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Cognac Leather Texture for Oxford Shoes with subtle patina
 */
function createShoeLeatherTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 360);
  grad.addColorStop(0, '#753b15');
  grad.addColorStop(0.7, '#59290a');
  grad.addColorStop(1, '#341503');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Microscopic leather pores
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = 0; i < 2000; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ════════════════════════════════════════════════════════════════════
// 2. MASTER SCULPTED 3D GEOMETRY GENERATORS (NATURAL HUMAN-CAT PROPORTIONS)
// ════════════════════════════════════════════════════════════════════

/**
 * Creates naturally proportioned sculpted feline head (radius 0.29m, down from oversized 0.38m)
 * with zygomatic cheek flares, orbital sockets, protruding whisker lobes, and philtrum.
 */
function createMasterFelineHeadGeometry(): THREE.BufferGeometry {
  const geom = new THREE.SphereGeometry(0.29, 80, 80);
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // 1. Crown shaping: gently flattened top crown
    if (v.y > 0.12) {
      const crownFactor = (v.y - 0.12) / 0.17;
      v.x *= 1.0 - crownFactor * 0.1;
      v.z *= 1.0 - crownFactor * 0.07;
    }

    // 2. Cheeks (Zygomatic fullness & soft fur flares matching reference illustration)
    if (v.y > -0.18 && v.y < 0.08) {
      const cheekWeight = Math.exp(-Math.pow((v.y + 0.04) / 0.1, 2));
      const sideFactor = Math.abs(v.x) / 0.26;
      v.x += Math.sign(v.x) * cheekWeight * sideFactor * 0.075;
      // Organic fur tuft silhouette
      if (Math.abs(v.x) > 0.16) {
        v.x += Math.sign(v.x) * (Math.sin(v.y * 36) * 0.012 + Math.cos(v.y * 20) * 0.007);
      }
    }

    // 3. Eye Sockets (Orbital depressions where eyes sit naturally)
    const eyeDistL = Math.hypot(v.x + 0.12, v.y - 0.045, v.z - 0.22);
    const eyeDistR = Math.hypot(v.x - 0.12, v.y - 0.045, v.z - 0.22);
    const minEyeDist = Math.min(eyeDistL, eyeDistR);
    if (minEyeDist < 0.13 && v.z > 0.09) {
      const socketDepress = (0.13 - minEyeDist) * 0.35;
      v.z -= socketDepress;
    }

    // 4. Muzzle & Whisker Pads (Integrated dual forward lobes with philtrum)
    if (v.z > 0.1 && v.y > -0.17 && v.y < 0.04) {
      const muzzleDistL = Math.hypot(v.x + 0.065, v.y + 0.06);
      const muzzleDistR = Math.hypot(v.x - 0.065, v.y + 0.06);
      const lobeWeight = Math.max(0, 0.14 - Math.min(muzzleDistL, muzzleDistR)) / 0.14;
      v.z += lobeWeight * 0.095;
      // Central philtrum indentation between lobes
      if (Math.abs(v.x) < 0.03 && v.y < -0.01) {
        v.z -= 0.026;
      }
    }

    // 5. Chin (Soft rounded feline chin)
    if (v.y < -0.12 && v.z > 0.1) {
      const chinWeight = Math.max(0, 1.0 - Math.hypot(v.x, v.y + 0.17) / 0.12);
      v.z += chinWeight * 0.038;
      v.y += chinWeight * 0.018;
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates anatomical cupped cat ear with hollowed concha and curved tip
 */
function createMasterEarGeometry(): THREE.BufferGeometry {
  const geom = new THREE.ConeGeometry(0.13, 0.28, 36, 18, true);
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // Flatten back and cup the front
    if (v.z < 0) {
      v.z *= 0.52;
    } else {
      v.z *= 1.38;
    }
    const tipH = (v.y + 0.14) / 0.28;
    v.z -= Math.pow(tipH, 2) * 0.055;
    v.x += Math.pow(tipH, 2) * 0.028;

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * Genuine sculpted rounded-rectangular acetate glasses frames
 */
function createMasterGlassesGroup(frameMat: THREE.Material, lensMat: THREE.Material): THREE.Group {
  const glasses = new THREE.Group();
  glasses.name = 'Glasses';

  const createRim = (xOffset: number) => {
    const rimGroup = new THREE.Group();
    rimGroup.position.set(xOffset, 0, 0);

    const w = 0.11;
    const h = 0.088;
    const r = 0.028;

    const outer = new THREE.Shape();
    outer.moveTo(-w + r, -h);
    outer.lineTo(w - r, -h);
    outer.quadraticCurveTo(w, -h, w, -h + r);
    outer.lineTo(w, h - r);
    outer.quadraticCurveTo(w, h, w - r, h);
    outer.lineTo(-w + r, h);
    outer.quadraticCurveTo(-w, h, -w, h - r);
    outer.lineTo(-w, -h + r);
    outer.quadraticCurveTo(-w, -h, -w + r, -h);

    const holeW = w - 0.02;
    const holeH = h - 0.02;
    const holeR = r * 0.75;
    const hole = new THREE.Path();
    hole.moveTo(-holeW + holeR, -holeH);
    hole.lineTo(holeW - holeR, -holeH);
    hole.quadraticCurveTo(holeW, -holeH, holeW, -holeH + holeR);
    hole.lineTo(holeW, holeH - holeR);
    hole.quadraticCurveTo(holeW, holeH, holeW - holeR, holeH);
    hole.lineTo(-holeW + holeR, holeH);
    hole.quadraticCurveTo(-holeW, holeH, -holeW, holeH - holeR);
    hole.lineTo(-holeW, -holeH + holeR);
    hole.quadraticCurveTo(-holeW, -holeH, -holeW + holeR, -holeH);
    outer.holes.push(hole);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.015,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.006,
      bevelThickness: 0.006,
    };

    const rimMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, extrudeSettings), frameMat);
    rimMesh.position.z = -0.015;
    rimGroup.add(rimMesh);

    // Reflective Glass Lens
    const lensShape = new THREE.Shape();
    lensShape.moveTo(-holeW + holeR, -holeH);
    lensShape.lineTo(holeW - holeR, -holeH);
    lensShape.quadraticCurveTo(holeW, -holeH, holeW, -holeH + holeR);
    lensShape.lineTo(holeW, holeH - holeR);
    lensShape.quadraticCurveTo(holeW, holeH, holeW - holeR, holeH);
    lensShape.lineTo(-holeW + holeR, holeH);
    lensShape.quadraticCurveTo(-holeW, holeH, -holeW, holeH - holeR);
    lensShape.lineTo(-holeW, -holeH + holeR);
    lensShape.quadraticCurveTo(-holeW, -holeH, -holeW + holeR, -holeH);

    const lensMesh = new THREE.Mesh(new THREE.ShapeGeometry(lensShape), lensMat);
    lensMesh.position.z = -0.005;
    rimGroup.add(lensMesh);

    return rimGroup;
  };

  glasses.add(createRim(-0.125));
  glasses.add(createRim(0.125));

  // Arched Nose Bridge
  const bridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.038, 0.015, 0),
    new THREE.Vector3(0, 0.035, 0.014),
    new THREE.Vector3(0.038, 0.015, 0),
  ]);
  const bridge = new THREE.Mesh(
    new THREE.TubeGeometry(bridgeCurve, 16, 0.01, 10, false),
    frameMat
  );
  glasses.add(bridge);

  // Side Temple Arms
  for (const side of [-1, 1]) {
    const templeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.23, 0.025, 0),
      new THREE.Vector3(side * 0.25, 0.02, -0.14),
      new THREE.Vector3(side * 0.23, 0.01, -0.36),
    ]);
    const temple = new THREE.Mesh(
      new THREE.TubeGeometry(templeCurve, 20, 0.008, 10, false),
      frameMat
    );
    glasses.add(temple);
  }

  return glasses;
}

/**
 * Creates Tailored Royal Navy Suit Jacket with narrow human-like torso:
 * - Broad deltoid shoulders (~0.52m span)
 * - Athletic V-taper with waist suppression (~0.24m waist)
 * - Flared jacket skirt over hips (~0.28m)
 * - Open V-neck showing the shirt and tie
 */
function createMasterTailoredSuitGeometry(): THREE.BufferGeometry {
  const geom = new THREE.CylinderGeometry(0.24, 0.26, 0.62, 40, 28, true);
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const ny = v.y / 0.31;

    // 1. Deltoid Shoulders
    if (ny > 0.3) {
      const shoulderFactor = (ny - 0.3) / 0.7;
      v.x *= 1.0 + shoulderFactor * 0.28;
      v.z *= 0.85;
    }

    // 2. Athletic Waist Suppression (narrow natural waist)
    if (ny > -0.35 && ny < 0.3) {
      const waistFactor = 1.0 - Math.pow(ny / 0.32, 2);
      v.x *= 1.0 - waistFactor * 0.16;
      v.z *= 1.0 - waistFactor * 0.1;
    }

    // 3. Flared Jacket Skirt
    if (ny < -0.35) {
      const skirtFactor = (-ny - 0.35) / 0.65;
      v.x *= 1.0 + skirtFactor * 0.12;
      v.z *= 1.0 + skirtFactor * 0.08;
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates sculpted stepped feline cheek fur tufts (Pixar/Disney fluffy mutton chops)
 * exactly matching the tiered cheek silhouette in official reference images.
 */
function createSculptedCheekTufts(
  isLeft: boolean,
  orangeMat: THREE.Material,
  creamMat: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  const dir = isLeft ? -1 : 1;

  // 1. Upper Cheek Fur Tuft (Warm Orange Tabby)
  const tuftTop = new THREE.Mesh(
    new THREE.ConeGeometry(0.038, 0.12, 12),
    orangeMat
  );
  tuftTop.position.set(dir * 0.05, 0.03, 0.02);
  tuftTop.rotation.z = dir * (Math.PI / 2 + 0.35);
  tuftTop.rotation.x = 0.1;
  tuftTop.scale.set(1.0, 1.0, 0.5);
  tuftTop.castShadow = true;
  group.add(tuftTop);

  // 2. Middle Cheek Fur Tuft - Major Flare (Warm Orange Tabby)
  const tuftMid = new THREE.Mesh(
    new THREE.ConeGeometry(0.046, 0.16, 12),
    orangeMat
  );
  tuftMid.position.set(dir * 0.08, -0.03, 0.03);
  tuftMid.rotation.z = dir * (Math.PI / 2 + 0.08);
  tuftMid.scale.set(1.1, 1.0, 0.55);
  tuftMid.castShadow = true;
  group.add(tuftMid);

  // 3. Lower Cheek Fur Tuft (Cream Fur transition)
  const tuftLow = new THREE.Mesh(
    new THREE.ConeGeometry(0.042, 0.14, 12),
    creamMat
  );
  tuftLow.position.set(dir * 0.065, -0.09, 0.04);
  tuftLow.rotation.z = dir * (Math.PI / 2 - 0.28);
  tuftLow.rotation.x = -0.12;
  tuftLow.scale.set(1.0, 1.0, 0.5);
  tuftLow.castShadow = true;
  group.add(tuftLow);

  // 4. Jawline Chin Fluff (Cream Fur)
  const tuftJaw = new THREE.Mesh(
    new THREE.ConeGeometry(0.032, 0.09, 10),
    creamMat
  );
  tuftJaw.position.set(dir * 0.035, -0.14, 0.05);
  tuftJaw.rotation.z = dir * (Math.PI / 2 - 0.55);
  tuftJaw.scale.set(0.9, 1.0, 0.45);
  group.add(tuftJaw);

  return group;
}

/**
 * Creates Sculpted Anatomical Feline Paw with 4 articulated digits,
 * knuckles, and embedded underside toe beans
 */
function createMasterFelinePawGroup(furMat: THREE.Material, padMat: THREE.Material): {
  paw: THREE.Group;
  digits: THREE.Group[];
} {
  const paw = new THREE.Group();
  paw.name = 'SculptedPaw';

  // 1. Contoured Main Palm Body
  const palmGeom = new THREE.SphereGeometry(0.068, 28, 28);
  palmGeom.scale(1.0, 1.15, 0.7);
  const palmMesh = new THREE.Mesh(palmGeom, furMat);
  palmMesh.castShadow = true;
  paw.add(palmMesh);

  // 2. Four Articulated Feline Digits with Knuckles & Toe Beans
  // Digits: 0 = Pinky, 1 = Ring, 2 = Middle, 3 = Index (Pointer)
  const digits: THREE.Group[] = [];
  const fingerLengths = [0.038, 0.044, 0.046, 0.042];
  const fingerRadii = [0.016, 0.018, 0.018, 0.017];

  for (let f = 0; f < 4; f++) {
    const digitGroup = new THREE.Group();
    digitGroup.name = `Digit_${f}`;
    const xPos = -0.042 + f * 0.028;
    digitGroup.position.set(xPos, -0.052, 0.026);

    const h = fingerLengths[f];
    const r = fingerRadii[f];

    // Proximal phalanx (finger base)
    const baseGeom = new THREE.CylinderGeometry(r, r * 0.9, h, 16);
    const baseMesh = new THREE.Mesh(baseGeom, furMat);
    baseMesh.position.y = -h / 2;
    digitGroup.add(baseMesh);

    // Distal phalanx (finger tip pad)
    const tipGeom = new THREE.SphereGeometry(r * 1.05, 16, 16);
    tipGeom.scale(1.0, 0.95, 0.85);
    const tipMesh = new THREE.Mesh(tipGeom, furMat);
    tipMesh.position.y = -h;
    digitGroup.add(tipMesh);

    // Toe bean pad on fingertip
    const toeBean = new THREE.Mesh(new THREE.SphereGeometry(r * 0.72, 12, 12), padMat);
    toeBean.position.set(0, -h, r * 0.8);
    toeBean.scale.set(1.0, 1.0, 0.45);
    digitGroup.add(toeBean);

    paw.add(digitGroup);
    digits.push(digitGroup);
  }

  // 3. Main Central Metacarpal Pad (Pink leather heart-shaped pad)
  const mainPad = new THREE.Mesh(new THREE.SphereGeometry(0.034, 20, 20), padMat);
  mainPad.position.set(0, -0.01, 0.046);
  mainPad.scale.set(1.15, 0.9, 0.35);
  paw.add(mainPad);

  return { paw, digits };
}

/**
 * Creates Tailored Trouser Leg with vertical front crease
 */
function createMasterTrouserLegGeometry(): THREE.BufferGeometry {
  const geom = new THREE.CylinderGeometry(0.095, 0.082, 0.54, 28, 20);
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // Vertical front crease line
    if (v.z > 0.045) {
      v.z += (1.0 - Math.abs(v.x) / 0.095) * 0.015;
    }
    // Slight knee ease
    if (v.y > -0.07 && v.y < 0.07) {
      v.z += 0.012;
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates genuine Oxford Dress Shoes with almond toe cap,
 * brogue stitch line, stacked heel, and leather welted sole
 */
function createMasterOxfordShoeGeometry(): THREE.BufferGeometry {
  const geom = new THREE.BoxGeometry(0.15, 0.115, 0.3, 20, 14, 28);
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // 1. Almond Toe Curve & Sloped Cap
    if (v.z > 0.03) {
      const toeProg = (v.z - 0.03) / 0.12;
      v.x *= 1.0 - toeProg * 0.38;
      v.y *= 1.0 - toeProg * 0.48;
    }

    // 2. Heel Elevation
    if (v.z < -0.05) {
      const heelProg = (-v.z - 0.05) / 0.1;
      v.y += heelProg * 0.022;
      v.x *= 0.93;
    }

    // 3. Instep arch waist
    if (v.z > -0.03 && v.z < 0.05 && v.y < 0) {
      v.y += 0.015;
      v.x *= 0.88;
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geom.computeVertexNormals();
  return geom;
}

// ════════════════════════════════════════════════════════════════════
// 3. MAIN INTERACTIVE 3D COMPONENT IMPLEMENTATION
// ════════════════════════════════════════════════════════════════════

export default function TeacherCat3D({
  state = 'IDLE',
  animation,
  isCameraOn = false,
  cameraPreset = 'full',
  onCameraPresetChange,
  className = '',
}: TeacherCat3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Camera animation interpolation targets (full frames complete character comfortably)
  const targetCamPos = useRef(new THREE.Vector3(0, 0.0, 4.8));
  const targetCamLook = useRef(new THREE.Vector3(0, -0.05, 0));

  // Real-time audio lip-sync state
  const lipSyncRef = useRef<LipSyncData>({
    amplitude: 0,
    viseme: 'NEUTRAL',
    currentWord: '',
    charIndex: 0,
  });

  // Active animation state
  const currentAnimRef = useRef<AnimationName>('idle');

  // Map high-level teacher state to animation
  useEffect(() => {
    if (animation) {
      currentAnimRef.current = animation;
      return;
    }
    switch (state) {
      case 'LISTENING':
        currentAnimRef.current = 'curious';
        break;
      case 'THINKING':
        currentAnimRef.current = 'thinking';
        break;
      case 'SPEAKING':
        currentAnimRef.current = 'explaining';
        break;
      case 'EXPLAINING':
        currentAnimRef.current = 'demonstrating';
        break;
      case 'WAITING_FOR_ANSWER':
        currentAnimRef.current = 'encouraging';
        break;
      case 'HAPPY':
        currentAnimRef.current = 'clap';
        break;
      case 'CONFUSED':
        currentAnimRef.current = 'confused';
        break;
      case 'ENCOURAGING':
        currentAnimRef.current = 'encouraging';
        break;
      case 'INTERRUPTED':
        currentAnimRef.current = 'surprised';
        break;
      case 'IDLE':
      default:
        currentAnimRef.current = 'idle';
        break;
    }
  }, [state, animation]);

  // Subscribe to real-time lip-sync stream from SpeechManager
  useEffect(() => {
    const unsub = speechManager.onLipSync((data) => {
      lipSyncRef.current = data;
    });
    return unsub;
  }, []);

  // Camera preset handler with comfortable framing ensuring no cropping
  const setPreset = useCallback((preset: CameraPreset) => {
    switch (preset) {
      case 'face':
        targetCamPos.current.set(0, 0.45, 1.85);
        targetCamLook.current.set(0, 0.45, 0);
        break;
      case 'waist':
        targetCamPos.current.set(0, 0.22, 3.1);
        targetCamLook.current.set(0, 0.16, 0);
        break;
      case 'full':
      default:
        targetCamPos.current.set(0, 0.0, 4.8);
        targetCamLook.current.set(0, -0.05, 0);
        break;
    }
    onCameraPresetChange?.(preset);
  }, [onCameraPresetChange]);

  useEffect(() => {
    setPreset(cameraPreset);
  }, [cameraPreset, setPreset]);

  // ══════════════════════════════════════════════════════════════════
  // THREE.JS SCENE SETUP & SCULPTED CHARACTER RIG
  // ══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 550;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(0, 0.0, 4.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 1.5;
    controls.maxDistance = 6.8;
    controls.minPolarAngle = Math.PI / 4.2;
    controls.maxPolarAngle = Math.PI / 1.75;
    controls.target.set(0, -0.05, 0);
    controlsRef.current = controls;

    // ── BALANCED STUDIO CHARACTER LIGHTING (DEEP NAVY & VIBRANT TABBY POP) ──
    // Neutral ambient fill preserving deep navy tones without washing them out
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.48);
    scene.add(ambientLight);

    // Warm studio key light for crisp character definition and gentle shadows
    const keyLight = new THREE.DirectionalLight(0xfffaed, 1.85);
    keyLight.position.set(2.8, 3.8, 3.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Soft neutral fill light to bring out shadow details cleanly
    const fillLight = new THREE.DirectionalLight(0xf0f4ff, 0.65);
    fillLight.position.set(-2.8, 2.0, 2.4);
    scene.add(fillLight);

    // Warm golden character rim/hair light highlighting orange tabby fur & ears
    const rimLight = new THREE.DirectionalLight(0xffeed6, 1.6);
    rimLight.position.set(0, 3.2, -3.8);
    scene.add(rimLight);

    // Subtle ground bounce light
    const bounceLight = new THREE.DirectionalLight(0xffe6d0, 0.35);
    bounceLight.position.set(0, -2.5, 1.2);
    scene.add(bounceLight);

    // ── HIGH-END PBR MATERIALS ──────────────────────────────────
    const furTex = createTabbyFurTexture();
    const suitTex = createSuitWoolTexture();
    const tieTex = createTieTexture();
    const irisTex = createIrisTexture();
    const leatherTex = createShoeLeatherTexture();

    const orangeFurMat = new THREE.MeshStandardMaterial({
      map: furTex,
      roughness: 0.62,
      metalness: 0.02,
    });
    const darkStripeMat = new THREE.MeshStandardMaterial({
      color: 0x8a3205,
      roughness: 0.68,
    });
    const creamMuzzleMat = new THREE.MeshStandardMaterial({
      color: 0xfff7ec,
      roughness: 0.7,
    });
    const pinkNoseMat = new THREE.MeshStandardMaterial({
      color: 0xf5849a,
      roughness: 0.32,
    });
    const innerEarMat = new THREE.MeshStandardMaterial({
      color: 0xf2a4b2,
      roughness: 0.65,
    });
    const whiteEarFluffMat = new THREE.MeshStandardMaterial({
      color: 0xfffdf8,
      roughness: 0.9,
    });

    // Bespoke Royal Navy Wool Suit
    const suitNavyMat = new THREE.MeshStandardMaterial({
      map: suitTex,
      roughness: 0.48,
      metalness: 0.06,
    });
    const suitLapelMat = new THREE.MeshStandardMaterial({
      map: suitTex,
      roughness: 0.42,
      color: 0x142544,
    });
    const whiteShirtMat = new THREE.MeshStandardMaterial({
      color: 0xfdfefe,
      roughness: 0.35,
    });
    const tieMat = new THREE.MeshStandardMaterial({
      map: tieTex,
      roughness: 0.35,
    });
    const goldBadgeMat = new THREE.MeshStandardMaterial({
      color: 0xf4ba35,
      roughness: 0.2,
      metalness: 0.92,
    });
    const silverClipMat = new THREE.MeshStandardMaterial({
      color: 0xdde5ef,
      roughness: 0.16,
      metalness: 0.96,
    });
    const beltLeatherMat = new THREE.MeshStandardMaterial({
      color: 0x3d1c06,
      roughness: 0.35,
    });

    // Dark Acetate Glasses Frame
    const glassesFrameMat = new THREE.MeshStandardMaterial({
      color: 0x151413,
      roughness: 0.18,
      metalness: 0.3,
    });
    const glassesLensMat = new THREE.MeshPhysicalMaterial({
      color: 0xe8f6ff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.04,
      transmission: 0.78,
      reflectivity: 0.95,
    });

    // Polished Warm Brown Oxford Shoes
    const leatherShoeMat = new THREE.MeshStandardMaterial({
      map: leatherTex,
      roughness: 0.24,
      metalness: 0.18,
    });
    const soleMat = new THREE.MeshStandardMaterial({
      color: 0x1e1006,
      roughness: 0.65,
    });

    // Eye materials
    const eyeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
    });
    const greenIrisMat = new THREE.MeshStandardMaterial({
      map: irisTex,
      roughness: 0.16,
    });
    const darkPupilMat = new THREE.MeshBasicMaterial({ color: 0x060906 });
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const happyEyeArcMat = new THREE.MeshBasicMaterial({ color: 0x1e1410 });

    // Mouth cavity
    const mouthInsideMat = new THREE.MeshBasicMaterial({ color: 0x54141c });
    const tongueMat = new THREE.MeshStandardMaterial({
      color: 0xec697c,
      roughness: 0.42,
    });
    const teethMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
    });

    // Whisker material
    const whiskerMat = new THREE.MeshBasicMaterial({
      color: 0xfffefb,
      transparent: true,
      opacity: 0.78,
    });

    // ── CHARACTER SKELETON RIG HIERARCHY ────────────────────────
    const Root = new THREE.Group();
    Root.name = 'Root';
    scene.add(Root);

    // Glowing Floor Ring
    const holoRing = new THREE.Mesh(
      new THREE.RingGeometry(0.44, 0.54, 48),
      new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      })
    );
    holoRing.rotation.x = Math.PI / 2;
    holoRing.position.set(0, -0.9, 0);
    Root.add(holoRing);

    // ── GENUINE 3D GLB MODEL LOADER (AI-GENERATED MESH INTEGRATION) ──
    const gltfLoader = new GLTFLoader();
    let mixer: THREE.AnimationMixer | null = null;
    let importedModel: THREE.Group | null = null;
    let usingImportedModel = false;

    gltfLoader.load(
      '/models/teacher-cat.glb?v=20261119',
      (gltf) => {
        if (gltf.scene) {
          importedModel = gltf.scene;

          // Normalize scale to 1.78m character height
          const box = new THREE.Box3().setFromObject(importedModel);
          const size = box.getSize(new THREE.Vector3());

          if (size.y > 0.05) {
            const scale = 1.78 / size.y;
            importedModel.scale.setScalar(scale);
          }

          // Anchor grounded at Y = -0.9 (floor level)
          importedModel.position.set(0, -0.9, 0);

          importedModel.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              if (mesh.material) {
                const mat = mesh.material as THREE.MeshStandardMaterial;
                mat.vertexColors = true;
                mat.color.setRGB(1.0, 1.0, 1.0);
                mat.roughness = 0.52;
                mat.metalness = 0.06;
                mat.side = THREE.DoubleSide;
                mat.needsUpdate = true;
              }
            }
          });

          // Check if model contains embedded skeletal animations
          if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(importedModel);
            const clip = gltf.animations[0];
            const action = mixer.clipAction(clip);
            action.play();
          }

          Root.add(importedModel);
          usingImportedModel = true;
          // Hide procedural primitive mannequin
          Hips.visible = false;
        }
      },
      undefined,
      (err) => {
        console.warn('GLB asset notice:', err);
      }
    );

    const Hips = new THREE.Group();
    Hips.name = 'Hips';
    Hips.position.set(0, -0.16, 0);
    Root.add(Hips);

    const Spine = new THREE.Group();
    Spine.name = 'Spine';
    Spine.position.set(0, 0.12, 0);
    Hips.add(Spine);

    const Chest = new THREE.Group();
    Chest.name = 'Chest';
    Chest.position.set(0, 0.24, 0);
    Spine.add(Chest);

    const Neck = new THREE.Group();
    Neck.name = 'Neck';
    Neck.position.set(0, 0.28, 0);
    Chest.add(Neck);

    const Head = new THREE.Group();
    Head.name = 'Head';
    Head.position.set(0, 0.32, 0);
    Neck.add(Head);

    // ══════════════════════════════════════════════════════════════
    // 1. MASTER SCULPTED FELINE HEAD (NATURAL COMPACT PROPORTIONS)
    // ══════════════════════════════════════════════════════════════
    const sculptedHead = new THREE.Mesh(createMasterFelineHeadGeometry(), orangeFurMat);
    sculptedHead.castShadow = true;
    Head.add(sculptedHead);

    // Cream Whisker Pad Overlay (Soft gradient)
    const creamMuzzleL = new THREE.Mesh(new THREE.SphereGeometry(0.095, 24, 24), creamMuzzleMat);
    creamMuzzleL.position.set(-0.065, -0.058, 0.25);
    creamMuzzleL.scale.set(1.15, 0.85, 0.75);
    Head.add(creamMuzzleL);

    const creamMuzzleR = creamMuzzleL.clone();
    creamMuzzleR.position.x = 0.065;
    Head.add(creamMuzzleR);

    // Soft Cream Chin
    const creamChin = new THREE.Mesh(new THREE.SphereGeometry(0.082, 20, 20), creamMuzzleMat);
    creamChin.position.set(0, -0.145, 0.21);
    creamChin.scale.set(1.2, 0.7, 0.65);
    Head.add(creamChin);

    // Forehead Stripes (3 vertical stripes conforming to brow curve)
    for (let i = -1; i <= 1; i++) {
      const stripeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(i * 0.06, 0.24, 0.2),
        new THREE.Vector3(i * 0.05, 0.16, 0.25),
        new THREE.Vector3(i * 0.035, 0.1, 0.275),
      ]);
      const stripe = new THREE.Mesh(
        new THREE.TubeGeometry(stripeCurve, 12, 0.012, 8, false),
        darkStripeMat
      );
      Head.add(stripe);
    }

    // Cheek Tabby Stripes
    for (const side of [-1, 1]) {
      for (let s = 0; s < 2; s++) {
        const chkCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.21, -0.03 - s * 0.04, 0.18),
          new THREE.Vector3(side * 0.26, -0.04 - s * 0.04, 0.12),
          new THREE.Vector3(side * 0.29, -0.05 - s * 0.04, 0.06),
        ]);
        const chkStripe = new THREE.Mesh(
          new THREE.TubeGeometry(chkCurve, 12, 0.011, 8, false),
          darkStripeMat
        );
        Head.add(chkStripe);
      }
    }

    // Delicate Whiskers (3 on each cheek with organic spring)
    for (const side of [-1, 1]) {
      for (let w = -1; w <= 1; w++) {
        const whiskerCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.09, -0.055 + w * 0.026, 0.26),
          new THREE.Vector3(side * 0.24, -0.062 + w * 0.018, 0.21),
          new THREE.Vector3(side * 0.39, -0.085 + w * 0.01, 0.13),
        ]);
        const whisker = new THREE.Mesh(
          new THREE.TubeGeometry(whiskerCurve, 16, 0.002, 6, false),
          whiskerMat
        );
        Head.add(whisker);
      }
    }

    // Delicate Pink Nose with nostril indentations
    const noseMesh = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.035, 3), pinkNoseMat);
    noseMesh.position.set(0, -0.012, 0.31);
    noseMesh.rotation.x = Math.PI;
    noseMesh.rotation.y = Math.PI / 6;
    Head.add(noseMesh);

    // Stepped Sculpted Cheek Fur Tufts (Iconic Disney/Pixar fluffy cheek flares from official images)
    const cheekTuftsL = createSculptedCheekTufts(true, orangeFurMat, creamMuzzleMat);
    cheekTuftsL.position.set(-0.21, -0.04, 0.08);
    Head.add(cheekTuftsL);

    const cheekTuftsR = createSculptedCheekTufts(false, orangeFurMat, creamMuzzleMat);
    cheekTuftsR.position.set(0.21, -0.04, 0.08);
    Head.add(cheekTuftsR);

    // Expressive Arched Tabby Eyebrows resting over glasses rims
    const browL = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.016, 0.016),
      darkStripeMat
    );
    browL.position.set(-0.12, 0.165, 0.275);
    browL.rotation.z = -0.12;
    Head.add(browL);

    const browR = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.016, 0.016),
      darkStripeMat
    );
    browR.position.set(0.12, 0.165, 0.275);
    browR.rotation.z = 0.12;
    Head.add(browR);

    // Sweet Feline Smiling Philtrum Line
    const philtrumMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.035, 8),
      darkStripeMat
    );
    philtrumMesh.position.set(0, -0.032, 0.305);
    Head.add(philtrumMesh);

    // ══════════════════════════════════════════════════════════════
    // 2. SCULPTED FELINE EARS
    // ══════════════════════════════════════════════════════════════
    const buildEar = (isLeft: boolean) => {
      const earGroup = new THREE.Group();
      earGroup.name = isLeft ? 'Ear_L' : 'Ear_R';
      earGroup.position.set(isLeft ? -0.18 : 0.18, 0.26, 0.02);
      earGroup.rotation.z = isLeft ? 0.32 : -0.32;
      earGroup.rotation.y = isLeft ? 0.22 : -0.22;

      const outerEar = new THREE.Mesh(createMasterEarGeometry(), orangeFurMat);
      outerEar.castShadow = true;
      earGroup.add(outerEar);

      // Inner Ear Cavity
      const innerEarGeom = createMasterEarGeometry();
      innerEarGeom.scale(0.82, 0.82, 0.82);
      const innerEar = new THREE.Mesh(innerEarGeom, innerEarMat);
      innerEar.position.set(0, -0.008, 0.02);
      earGroup.add(innerEar);

      // White Ear Fluff at base
      const fluff = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), whiteEarFluffMat);
      fluff.position.set(0, -0.08, 0.055);
      fluff.scale.set(1.4, 0.7, 0.6);
      earGroup.add(fluff);

      return earGroup;
    };

    const Ear_L = buildEar(true);
    const Ear_R = buildEar(false);
    Head.add(Ear_L);
    Head.add(Ear_R);

    // ══════════════════════════════════════════════════════════════
    // 3. RECESSED 3D EYES & HAPPY CLOSED ARCS
    // ══════════════════════════════════════════════════════════════
    const buildEye = (isLeft: boolean) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.name = isLeft ? 'Eye_L' : 'Eye_R';
      eyeGroup.position.set(isLeft ? -0.118 : 0.118, 0.05, 0.22);

      const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.088, 32, 32), eyeWhiteMat);
      eyeball.scale.set(1, 1, 0.65);
      eyeGroup.add(eyeball);

      const pupilGroup = new THREE.Group();
      eyeGroup.add(pupilGroup);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.062, 24, 24), greenIrisMat);
      iris.position.set(0, 0, 0.042);
      iris.scale.set(1, 1, 0.35);
      pupilGroup.add(iris);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 24, 24), darkPupilMat);
      pupil.position.set(0, 0, 0.056);
      pupil.scale.set(1, 1, 0.25);
      pupilGroup.add(pupil);

      // Dual Specular Highlights
      const spec1 = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 12), highlightMat);
      spec1.position.set(0.02, 0.022, 0.065);
      pupilGroup.add(spec1);

      const spec2 = new THREE.Mesh(new THREE.SphereGeometry(0.007, 12, 12), highlightMat);
      spec2.position.set(-0.016, -0.015, 0.065);
      pupilGroup.add(spec2);

      // Normal Eyelid (blinking)
      const eyelid = new THREE.Mesh(
        new THREE.SphereGeometry(0.092, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.52),
        orangeFurMat
      );
      eyelid.scale.set(1, 1, 0.68);
      eyelid.rotation.x = -Math.PI * 0.45;
      eyeGroup.add(eyelid);

      // Happy Closed Eye Arc (^^ expression from reference sheet!)
      const happyArcGeo = new THREE.TorusGeometry(0.044, 0.009, 8, 24, Math.PI);
      const happyEyeArc = new THREE.Mesh(happyArcGeo, happyEyeArcMat);
      happyEyeArc.position.set(0, 0.012, 0.06);
      happyEyeArc.rotation.z = Math.PI;
      happyEyeArc.visible = false;
      eyeGroup.add(happyEyeArc);

      return { eyeGroup, eyeball, pupilGroup, eyelid, happyEyeArc };
    };

    const leftEyeObj = buildEye(true);
    const rightEyeObj = buildEye(false);
    Head.add(leftEyeObj.eyeGroup);
    Head.add(rightEyeObj.eyeGroup);

    // ══════════════════════════════════════════════════════════════
    // 4. BESPOKE SCULPTED 3D GLASSES
    // ══════════════════════════════════════════════════════════════
    const Glasses = createMasterGlassesGroup(glassesFrameMat, glassesLensMat);
    Glasses.position.set(0, 0.05, 0.295);
    Head.add(Glasses);

    // ══════════════════════════════════════════════════════════════
    // 5. JAW & MOUTH CAVITY (SYNCHRONIZED SPEECH & LAUGHTER)
    // ══════════════════════════════════════════════════════════════
    const Jaw = new THREE.Group();
    Jaw.name = 'Jaw';
    Jaw.position.set(0, -0.115, 0.25);
    Head.add(Jaw);

    const mouthCavity = new THREE.Mesh(new THREE.SphereGeometry(0.072, 24, 24), mouthInsideMat);
    mouthCavity.scale.set(1.15, 0.65, 0.45);
    Jaw.add(mouthCavity);

    const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.044, 16, 16), tongueMat);
    tongue.position.set(0, -0.012, 0.02);
    tongue.scale.set(1.0, 0.45, 0.65);
    Jaw.add(tongue);

    const upperTeeth = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.014, 0.014), teethMat);
    upperTeeth.position.set(0, 0.024, 0.026);
    Jaw.add(upperTeeth);

    // ══════════════════════════════════════════════════════════════
    // 6. TAILORED ROYAL NAVY SUIT, COLLAR, TIE & LAPELS
    // ══════════════════════════════════════════════════════════════
    const jacketMesh = new THREE.Mesh(createMasterTailoredSuitGeometry(), suitNavyMat);
    jacketMesh.castShadow = true;
    Chest.add(jacketMesh);

    // White shirt front showing inside open V-neck
    const shirtChest = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.36), whiteShirtMat);
    shirtChest.position.set(0, 0.09, 0.19);
    shirtChest.rotation.x = -0.12;
    Chest.add(shirtChest);

    // Pointed Shirt Collar wings wrapping around neck
    const collarL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.058, 0.035), whiteShirtMat);
    collarL.position.set(-0.058, 0.24, 0.16);
    collarL.rotation.z = -0.32;
    collarL.rotation.y = 0.22;
    Chest.add(collarL);

    const collarR = collarL.clone();
    collarR.position.x = 0.058;
    collarR.rotation.z = 0.32;
    collarR.rotation.y = -0.22;
    Chest.add(collarR);

    // 3D Notched Blazer Lapels rolling down chest
    const lapelCurveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.05, 0.25, 0.18),
      new THREE.Vector3(-0.105, 0.14, 0.21),
      new THREE.Vector3(-0.062, -0.02, 0.215),
    ]);
    const leftLapel = new THREE.Mesh(
      new THREE.TubeGeometry(lapelCurveL, 16, 0.028, 8, false),
      suitLapelMat
    );
    Chest.add(leftLapel);

    const lapelCurveR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 0.25, 0.18),
      new THREE.Vector3(0.105, 0.14, 0.21),
      new THREE.Vector3(0.062, -0.02, 0.215),
    ]);
    const rightLapel = new THREE.Mesh(
      new THREE.TubeGeometry(lapelCurveR, 16, 0.028, 8, false),
      suitLapelMat
    );
    Chest.add(rightLapel);

    // Gold School Crest Pin on left lapel
    const crestPin = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.009, 16), goldBadgeMat);
    crestPin.rotation.x = Math.PI / 2;
    crestPin.position.set(-0.115, 0.14, 0.225);
    Chest.add(crestPin);

    // White Pocket Square in left welt pocket
    const pocketSquare = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.024, 0.012), whiteShirtMat);
    pocketSquare.position.set(-0.145, 0.055, 0.205);
    pocketSquare.rotation.z = 0.14;
    Chest.add(pocketSquare);

    // Two dark horn buttons
    for (let b = 0; b < 2; b++) {
      const btn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.009, 16),
        glassesFrameMat
      );
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0, -0.08 - b * 0.08, 0.225);
      Chest.add(btn);
    }

    // Leather Belt & Buckle visible at jacket waist
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.202, 0.202, 0.032, 32), beltLeatherMat);
    belt.position.set(0, -0.22, 0);
    Chest.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.038, 0.015), goldBadgeMat);
    buckle.position.set(0, -0.22, 0.205);
    Chest.add(buckle);

    // Four-in-Hand Necktie Group
    const TieGroup = new THREE.Group();
    TieGroup.name = 'Tie';
    TieGroup.position.set(0, 0.2, 0.2);
    Chest.add(TieGroup);

    // 3D Tie Knot
    const tieKnot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.052, 12), tieMat);
    TieGroup.add(tieKnot);

    // Draped Tie Blade
    const tieBlade = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.042, 0.28, 4), tieMat);
    tieBlade.position.set(0, -0.15, 0.008);
    tieBlade.rotation.y = Math.PI / 4;
    tieBlade.scale.set(1, 1, 0.24);
    TieGroup.add(tieBlade);

    // Silver Tie Bar / Clip
    const tieClip = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.009, 0.012), silverClipMat);
    tieClip.position.set(0, -0.11, 0.018);
    TieGroup.add(tieClip);

    // Two Tailored Waist Flap Pockets (matching Image 1, 2, 3, 4)
    const flapGeom = new THREE.BoxGeometry(0.105, 0.024, 0.018);
    const pocketFlapL = new THREE.Mesh(flapGeom, suitNavyMat);
    pocketFlapL.position.set(-0.145, -0.11, 0.205);
    pocketFlapL.rotation.y = -0.16;
    pocketFlapL.rotation.z = -0.05;
    Chest.add(pocketFlapL);

    const pocketFlapR = new THREE.Mesh(flapGeom, suitNavyMat);
    pocketFlapR.position.set(0.145, -0.11, 0.205);
    pocketFlapR.rotation.y = 0.16;
    pocketFlapR.rotation.z = 0.05;
    Chest.add(pocketFlapR);

    // ══════════════════════════════════════════════════════════════
    // 7. SHOULDERS, SEPARATE ARMS & ARTICULATED FELINE PAWS
    // ══════════════════════════════════════════════════════════════
    const buildArm = (isLeft: boolean) => {
      const side = isLeft ? -1 : 1;
      const Shoulder = new THREE.Group();
      Shoulder.name = isLeft ? 'LeftShoulder' : 'RightShoulder';
      Shoulder.position.set(side * 0.26, 0.17, 0);

      // Tailored Upper Arm Sleeve
      const UpperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.2, 14, 18), suitNavyMat);
      UpperArm.position.set(0, -0.11, 0);
      UpperArm.castShadow = true;
      Shoulder.add(UpperArm);

      const Forearm = new THREE.Group();
      Forearm.name = isLeft ? 'LeftForearm' : 'RightForearm';
      Forearm.position.set(0, -0.22, 0);
      Shoulder.add(Forearm);

      // Tailored Forearm Sleeve
      const forearmMesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.064, 0.18, 14, 18),
        suitNavyMat
      );
      forearmMesh.position.set(0, -0.1, 0);
      Forearm.add(forearmMesh);

      // White Shirt Cuff peeking out of sleeve
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.03, 20), whiteShirtMat);
      cuff.position.set(0, -0.19, 0);
      Forearm.add(cuff);

      // Master Sculpted Feline Paw with 4 Articulated Digits
      const pawData = createMasterFelinePawGroup(orangeFurMat, pinkNoseMat);
      const Hand = pawData.paw;
      Hand.name = isLeft ? 'LeftHand' : 'RightHand';
      Hand.position.set(0, -0.24, 0);
      Forearm.add(Hand);

      return { Shoulder, Forearm, Hand, digits: pawData.digits };
    };

    const leftArm = buildArm(true);
    const rightArm = buildArm(false);
    Chest.add(leftArm.Shoulder);
    Chest.add(rightArm.Shoulder);

    // ══════════════════════════════════════════════════════════════
    // 8. TAILORED TROUSERS & SCULPTED OXFORD SHOES
    // ══════════════════════════════════════════════════════════════
    const buildLeg = (isLeft: boolean) => {
      const side = isLeft ? -1 : 1;
      const UpperLeg = new THREE.Group();
      UpperLeg.name = isLeft ? 'LeftUpperLeg' : 'RightUpperLeg';
      UpperLeg.position.set(side * 0.12, 0, 0);

      const thighMesh = new THREE.Mesh(createMasterTrouserLegGeometry(), suitNavyMat);
      thighMesh.position.set(0, -0.26, 0);
      thighMesh.castShadow = true;
      UpperLeg.add(thighMesh);

      const Foot = new THREE.Group();
      Foot.name = isLeft ? 'LeftFoot' : 'RightFoot';
      Foot.position.set(0, -0.54, 0.04);
      UpperLeg.add(Foot);

      // Sculpted Oxford Dress Shoe Upper
      const shoeUpper = new THREE.Mesh(createMasterOxfordShoeGeometry(), leatherShoeMat);
      shoeUpper.castShadow = true;
      Foot.add(shoeUpper);

      // Leather Sole & Stacked Heel
      const shoeSole = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.028, 0.31), soleMat);
      shoeSole.position.set(0, -0.055, 0.015);
      Foot.add(shoeSole);

      // Thin dress shoe laces on instep
      for (let l = 0; l < 3; l++) {
        const lace = new THREE.Mesh(
          new THREE.BoxGeometry(0.045, 0.005, 0.008),
          glassesFrameMat
        );
        lace.position.set(0, 0.045 + l * 0.012, 0.02 - l * 0.018);
        Foot.add(lace);
      }

      return { UpperLeg, Foot };
    };

    const leftLeg = buildLeg(true);
    const rightLeg = buildLeg(false);
    Hips.add(leftLeg.UpperLeg);
    Hips.add(rightLeg.UpperLeg);

    // ══════════════════════════════════════════════════════════════
    // 9. PROUD S-CURVED PLUSH TABBY TAIL (PROMINENTLY VISIBLE FROM FRONT)
    // ══════════════════════════════════════════════════════════════
    const tailBones: THREE.Group[] = [];
    let parentTail: THREE.Object3D = Hips;

    // The tail sweeps out to the right side and arches upward in an S-curve,
    // exactly like the official reference illustration!
    for (let i = 0; i < 7; i++) {
      const tailBone = new THREE.Group();
      tailBone.name = `Tail_0${i + 1}`;
      
      // Base bone angles out and backward
      if (i === 0) {
        tailBone.position.set(-0.06, -0.04, -0.16);
        tailBone.rotation.set(-0.8, -0.4, 0.6);
      } else {
        tailBone.position.set(0.04, 0.09, 0.02);
      }

      const segMat = i === 6 ? creamMuzzleMat : i % 2 === 0 ? orangeFurMat : darkStripeMat;
      const segRadius = 0.065 + (i < 4 ? i * 0.007 : (6 - i) * 0.005);
      const segMesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(segRadius, 0.09, 14, 18),
        segMat
      );
      segMesh.position.y = 0.05;
      tailBone.add(segMesh);

      parentTail.add(tailBone);
      tailBones.push(tailBone);
      parentTail = tailBone;
    }

    // ── MOUSE / CURSOR GAZE TRACKING ────────────────────────────
    const handleMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current = {
        x: THREE.MathUtils.clamp(nx, -1, 1),
        y: THREE.MathUtils.clamp(ny, -1, 1),
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // ── ANIMATION & RIG ENGINE LOOP ─────────────────────────────
    const startTime = performance.now();
    let prevTime = startTime;
    let blinkTimer = 0;
    let nextBlink = 2.8;
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - prevTime) / 1000;
      prevTime = now;
      const t = (now - startTime) / 1000;
      const anim = currentAnimRef.current;
      const lipSync = lipSyncRef.current;

      // Smooth camera interpolation towards active preset
      camera.position.lerp(targetCamPos.current, 0.06);
      controls.target.lerp(targetCamLook.current, 0.06);
      controls.update();

      // 0. Update Imported GLB Skeletal Animation Mixer & Posture
      if (mixer) {
        mixer.update(delta);
      }

      if (usingImportedModel && importedModel) {
        // Gaze tracking towards user cursor
        const targetRotY = mouseRef.current.x * 0.22;
        const targetRotX = -mouseRef.current.y * 0.1;

        // Expressive gestures mapped to classroom animation states
        let gestureRotY = 0;
        let gestureRotZ = 0;
        let gestureRotX = 0;
        let gesturePosY = 0;

        if (anim === 'greeting' || anim === 'waving') {
          gestureRotZ = Math.sin(t * 4.5) * 0.04;
          gestureRotY = Math.sin(t * 3.0) * 0.06;
        } else if (anim === 'nodding' || anim === 'nod') {
          gestureRotX = Math.sin(t * 6.0) * 0.07;
        } else if (anim === 'thinking' || anim === 'curious') {
          gestureRotZ = 0.04;
          gestureRotY = 0.1;
        } else if (anim === 'pointing' || anim === 'point') {
          gestureRotY = -0.12;
          gestureRotX = 0.03;
        } else if (anim === 'happy' || anim === 'clap' || anim === 'excited') {
          gesturePosY = Math.abs(Math.sin(t * 7.0)) * 0.03;
        } else if (anim === 'listening') {
          gestureRotZ = 0.035;
          gestureRotX = -0.02;
        }

        importedModel.rotation.y = THREE.MathUtils.lerp(
          importedModel.rotation.y,
          targetRotY + gestureRotY,
          0.06
        );
        importedModel.rotation.x = THREE.MathUtils.lerp(
          importedModel.rotation.x,
          targetRotX + gestureRotX,
          0.06
        );
        importedModel.rotation.z = THREE.MathUtils.lerp(
          importedModel.rotation.z,
          gestureRotZ,
          0.06
        );

        // Natural subtle breathing motion + gesture bounce
        importedModel.position.y = -0.9 + Math.sin(t * 2.2) * 0.012 + gesturePosY;

        // Vocal lip-sync reactive speech bounce
        if (lipSync.amplitude > 0.02) {
          importedModel.position.y += Math.sin(t * 14) * (lipSync.amplitude * 0.02);
        }
      }

      // 1. Natural Breathing Spine & Chest Motion
      const breath = Math.sin(t * 2.2) * 0.012;
      Chest.position.y = 0.24 + breath;
      Spine.rotation.x = Math.sin(t * 2.2) * 0.01;

      // 2. Facial Expressions: Eyes, Blinking & Lip-Sync
      if (anim === 'happy' || anim === 'clap') {
        // Laughing / Delighted Eye Arcs (^^ from reference sheet!)
        leftEyeObj.eyeball.visible = false;
        leftEyeObj.pupilGroup.visible = false;
        leftEyeObj.happyEyeArc.visible = true;

        rightEyeObj.eyeball.visible = false;
        rightEyeObj.pupilGroup.visible = false;
        rightEyeObj.happyEyeArc.visible = true;

        // Wide laughing mouth
        Jaw.scale.y = 0.85 + Math.sin(t * 10) * 0.15;
        Jaw.scale.x = 1.15;
        Jaw.position.y = -0.14;
        tongue.position.y = 0.01;
      } else {
        leftEyeObj.eyeball.visible = true;
        leftEyeObj.pupilGroup.visible = true;
        leftEyeObj.happyEyeArc.visible = false;

        rightEyeObj.eyeball.visible = true;
        rightEyeObj.pupilGroup.visible = true;
        rightEyeObj.happyEyeArc.visible = false;

        // Natural Blinking
        blinkTimer += delta;
        if (blinkTimer >= nextBlink) {
          leftEyeObj.eyelid.rotation.x = 0.05;
          rightEyeObj.eyelid.rotation.x = 0.05;
          if (blinkTimer >= nextBlink + 0.13) {
            leftEyeObj.eyelid.rotation.x = -Math.PI * 0.45;
            rightEyeObj.eyelid.rotation.x = -Math.PI * 0.45;
            blinkTimer = 0;
            nextBlink = 2.4 + Math.random() * 3.2;
          }
        }

        // Student Gaze Tracking (Eyes smoothly follow user's cursor)
        const targetEyeX = mouseRef.current.x * 0.024;
        const targetEyeY = mouseRef.current.y * 0.018;
        leftEyeObj.pupilGroup.position.x = THREE.MathUtils.lerp(
          leftEyeObj.pupilGroup.position.x,
          targetEyeX,
          0.1
        );
        leftEyeObj.pupilGroup.position.y = THREE.MathUtils.lerp(
          leftEyeObj.pupilGroup.position.y,
          targetEyeY,
          0.1
        );
        rightEyeObj.pupilGroup.position.x = THREE.MathUtils.lerp(
          rightEyeObj.pupilGroup.position.x,
          targetEyeX,
          0.1
        );
        rightEyeObj.pupilGroup.position.y = THREE.MathUtils.lerp(
          rightEyeObj.pupilGroup.position.y,
          targetEyeY,
          0.1
        );

        // Real-Time Vocal Lip-Sync (Audio Amplitude & Visemes)
        if (lipSync.amplitude > 0.02) {
          const visemeWidth =
            lipSync.viseme === 'O' ? 0.65 : lipSync.viseme === 'E' ? 1.25 : 1.0;
          Jaw.scale.y = 0.3 + lipSync.amplitude * 1.15;
          Jaw.scale.x = 0.88 * visemeWidth;
          Jaw.position.y = -0.115 - lipSync.amplitude * 0.035;
          tongue.position.y = -0.012 + lipSync.amplitude * 0.018;
        } else {
          Jaw.scale.set(0.8, 0.2, 1);
          Jaw.position.y = -0.115;
        }
      }

      // 3. Subtle Ear & Eyebrow Reactions
      Ear_L.rotation.z = 0.32 + Math.sin(t * 1.7) * 0.035;
      Ear_R.rotation.z = -0.32 - Math.cos(t * 2.1) * 0.035;

      browL.position.y =
        0.165 +
        (anim === 'curious' || anim === 'listening' ? 0.012 : Math.sin(t * 1.8) * 0.003);
      browR.position.y =
        0.165 +
        (anim === 'curious' || anim === 'listening' ? 0.012 : Math.sin(t * 1.8) * 0.003);

      // 4. Natural Tail Sway Physics
      const isFastTail =
        anim === 'greeting' ||
        anim === 'waving' ||
        anim === 'happy' ||
        anim === 'excited' ||
        anim === 'clap';
      const tailSpeed = isFastTail ? 5.0 : 2.2;
      tailBones.forEach((bone, idx) => {
        bone.rotation.z = 0.2 + Math.sin(t * tailSpeed - idx * 0.45) * (0.12 + idx * 0.02);
        if (idx > 0) {
          bone.rotation.x = Math.cos(t * 1.5 + idx) * 0.035;
        }
      });

      // ── 5. FULL ANIMATION POSE CONTROLLER ────────────────────────
      switch (anim) {
        case 'clap':
          // Clapping / Joyful Praise Pose (Official Image 3!)
          leftArm.Shoulder.rotation.x = THREE.MathUtils.lerp(
            leftArm.Shoulder.rotation.x,
            -0.92,
            0.15
          );
          leftArm.Shoulder.rotation.y = THREE.MathUtils.lerp(
            leftArm.Shoulder.rotation.y,
            0.15,
            0.15
          );
          leftArm.Shoulder.rotation.z = THREE.MathUtils.lerp(
            leftArm.Shoulder.rotation.z,
            0.36,
            0.15
          );
          leftArm.Forearm.rotation.x = THREE.MathUtils.lerp(
            leftArm.Forearm.rotation.x,
            -1.05,
            0.15
          );
          leftArm.Forearm.rotation.z = THREE.MathUtils.lerp(
            leftArm.Forearm.rotation.z,
            0.52 + Math.sin(t * 12) * 0.08,
            0.2
          );

          rightArm.Shoulder.rotation.x = THREE.MathUtils.lerp(
            rightArm.Shoulder.rotation.x,
            -0.92,
            0.15
          );
          rightArm.Shoulder.rotation.y = THREE.MathUtils.lerp(
            rightArm.Shoulder.rotation.y,
            -0.15,
            0.15
          );
          rightArm.Shoulder.rotation.z = THREE.MathUtils.lerp(
            rightArm.Shoulder.rotation.z,
            -0.36,
            0.15
          );
          rightArm.Forearm.rotation.x = THREE.MathUtils.lerp(
            rightArm.Forearm.rotation.x,
            -1.05,
            0.15
          );
          rightArm.Forearm.rotation.z = THREE.MathUtils.lerp(
            rightArm.Forearm.rotation.z,
            -0.52 - Math.sin(t * 12) * 0.08,
            0.2
          );

          // Paws clasped in praise with soft curled digits
          leftArm.digits.forEach((d) => {
            d.rotation.x = THREE.MathUtils.lerp(d.rotation.x, -0.65, 0.15);
          });
          rightArm.digits.forEach((d) => {
            d.rotation.x = THREE.MathUtils.lerp(d.rotation.x, -0.65, 0.15);
          });

          Hips.position.y = -0.16 + Math.abs(Math.sin(t * 8)) * 0.035;
          Head.rotation.x = Math.sin(t * 7) * 0.06;
          break;

        case 'point':
        case 'pointing':
          // Pointing Pose (Official Character Key Art Image 1 & 4!)
          // 1. Left Arm (Cat's left, Viewer's right) raises and points index finger forward/up
          leftArm.Shoulder.rotation.x = THREE.MathUtils.lerp(
            leftArm.Shoulder.rotation.x,
            -1.42,
            0.15
          );
          leftArm.Shoulder.rotation.y = THREE.MathUtils.lerp(
            leftArm.Shoulder.rotation.y,
            0.22,
            0.15
          );
          leftArm.Shoulder.rotation.z = THREE.MathUtils.lerp(
            leftArm.Shoulder.rotation.z,
            -0.28,
            0.15
          );
          leftArm.Forearm.rotation.x = THREE.MathUtils.lerp(
            leftArm.Forearm.rotation.x,
            0.12,
            0.15
          );
          leftArm.Forearm.rotation.y = THREE.MathUtils.lerp(
            leftArm.Forearm.rotation.y,
            0.32,
            0.15
          );
          leftArm.Hand.rotation.x = THREE.MathUtils.lerp(leftArm.Hand.rotation.x, -0.1, 0.15);
          leftArm.Hand.rotation.z = THREE.MathUtils.lerp(leftArm.Hand.rotation.z, -0.2, 0.15);

          // Articulate digits: Index (Digit_3) straight, pinky/ring/middle curled into palm!
          leftArm.digits[3].rotation.x = THREE.MathUtils.lerp(leftArm.digits[3].rotation.x, 0, 0.2);
          leftArm.digits[2].rotation.x = THREE.MathUtils.lerp(leftArm.digits[2].rotation.x, -1.35, 0.2);
          leftArm.digits[1].rotation.x = THREE.MathUtils.lerp(leftArm.digits[1].rotation.x, -1.35, 0.2);
          leftArm.digits[0].rotation.x = THREE.MathUtils.lerp(leftArm.digits[0].rotation.x, -1.35, 0.2);

          // 2. Right Arm (Cat's right, Viewer's left) held forward with welcoming open palm
          rightArm.Shoulder.rotation.x = THREE.MathUtils.lerp(
            rightArm.Shoulder.rotation.x,
            -0.42,
            0.12
          );
          rightArm.Shoulder.rotation.y = THREE.MathUtils.lerp(
            rightArm.Shoulder.rotation.y,
            -0.24,
            0.12
          );
          rightArm.Shoulder.rotation.z = THREE.MathUtils.lerp(
            rightArm.Shoulder.rotation.z,
            0.38,
            0.12
          );
          rightArm.Forearm.rotation.x = THREE.MathUtils.lerp(
            rightArm.Forearm.rotation.x,
            -0.3,
            0.12
          );
          rightArm.Forearm.rotation.y = THREE.MathUtils.lerp(
            rightArm.Forearm.rotation.y,
            -0.42,
            0.12
          );
          rightArm.Hand.rotation.x = THREE.MathUtils.lerp(rightArm.Hand.rotation.x, -0.55, 0.15);
          rightArm.Hand.rotation.y = THREE.MathUtils.lerp(rightArm.Hand.rotation.y, -0.35, 0.15);
          rightArm.Hand.rotation.z = THREE.MathUtils.lerp(rightArm.Hand.rotation.z, 0.25, 0.15);

          // Open fingers to display pink toe beans and heart-shaped palm pad
          rightArm.digits.forEach((d) => {
            d.rotation.x = THREE.MathUtils.lerp(d.rotation.x, -0.15, 0.15);
          });

          Head.rotation.y = THREE.MathUtils.lerp(Head.rotation.y, -0.16, 0.1);
          Head.rotation.x = THREE.MathUtils.lerp(Head.rotation.x, -0.04, 0.1);
          break;

        case 'explaining':
        case 'demonstrating':
          // Teaching / Explaining with gesturing hands beside body
          leftArm.Shoulder.rotation.x = -0.42 + Math.sin(t * 2.8) * 0.2;
          leftArm.Shoulder.rotation.y = 0;
          leftArm.Shoulder.rotation.z = 0.22 + Math.cos(t * 2.2) * 0.12;
          leftArm.Forearm.rotation.x = -0.55 + Math.sin(t * 2.8 + 0.5) * 0.16;
          leftArm.Forearm.rotation.y = 0;
          leftArm.Hand.rotation.set(0, 0, 0);

          rightArm.Shoulder.rotation.x = -0.38 + Math.cos(t * 2.6) * 0.2;
          rightArm.Shoulder.rotation.y = 0;
          rightArm.Shoulder.rotation.z = -0.22 - Math.sin(t * 2.4) * 0.12;
          rightArm.Forearm.rotation.x = -0.55 + Math.cos(t * 2.6 + 0.5) * 0.16;
          rightArm.Forearm.rotation.y = 0;
          rightArm.Hand.rotation.set(0, 0, 0);

          leftArm.digits.forEach((d, idx) => {
            d.rotation.x = -0.2 + Math.sin(t * 3.5 + idx) * 0.15;
          });
          rightArm.digits.forEach((d, idx) => {
            d.rotation.x = -0.2 + Math.cos(t * 3.5 + idx) * 0.15;
          });

          Head.rotation.y = Math.sin(t * 1.8) * 0.1;
          Head.rotation.x = Math.sin(t * 2.4) * 0.05;
          break;

        case 'waving':
        case 'greeting':
          // Friendly waving welcoming student
          leftArm.Shoulder.rotation.x = THREE.MathUtils.lerp(
            leftArm.Shoulder.rotation.x,
            -1.35,
            0.15
          );
          leftArm.Shoulder.rotation.y = 0;
          leftArm.Shoulder.rotation.z = THREE.MathUtils.lerp(
            leftArm.Shoulder.rotation.z,
            -0.4,
            0.15
          );
          leftArm.Forearm.rotation.z = Math.sin(t * 7.5) * 0.35 - 0.22;
          leftArm.Hand.rotation.set(0, 0, 0);

          rightArm.Shoulder.rotation.x = THREE.MathUtils.lerp(
            rightArm.Shoulder.rotation.x,
            -0.08,
            0.1
          );
          rightArm.Shoulder.rotation.y = 0;
          rightArm.Shoulder.rotation.z = THREE.MathUtils.lerp(
            rightArm.Shoulder.rotation.z,
            0.12,
            0.1
          );
          rightArm.Hand.rotation.set(0, 0, 0);

          leftArm.digits.forEach((d) => {
            d.rotation.x = -0.15;
          });
          rightArm.digits.forEach((d) => {
            d.rotation.x = -0.25;
          });

          Head.rotation.z = Math.sin(t * 3.5) * 0.08;
          break;

        case 'thinking':
          // Chin-touch thoughtful pose
          leftArm.Shoulder.rotation.x = THREE.MathUtils.lerp(
            leftArm.Shoulder.rotation.x,
            -1.2,
            0.12
          );
          leftArm.Shoulder.rotation.y = 0.2;
          leftArm.Shoulder.rotation.z = THREE.MathUtils.lerp(
            leftArm.Shoulder.rotation.z,
            0.38,
            0.12
          );
          leftArm.Forearm.rotation.x = THREE.MathUtils.lerp(
            leftArm.Forearm.rotation.x,
            -1.1,
            0.12
          );
          leftArm.Forearm.rotation.y = 0.25;

          rightArm.Shoulder.rotation.x = THREE.MathUtils.lerp(
            rightArm.Shoulder.rotation.x,
            -0.18,
            0.1
          );
          rightArm.Shoulder.rotation.y = 0;
          rightArm.Shoulder.rotation.z = 0.16;
          rightArm.Forearm.rotation.x = -0.16;

          leftArm.digits[3].rotation.x = -0.1;
          leftArm.digits[2].rotation.x = -0.8;
          leftArm.digits[1].rotation.x = -0.8;
          leftArm.digits[0].rotation.x = -0.8;

          rightArm.digits.forEach((d) => {
            d.rotation.x = -0.25;
          });

          Head.rotation.x = -0.1;
          Head.rotation.y = 0.14;
          break;

        case 'nod':
        case 'nodding':
          // Affirmative nod
          Head.rotation.x = Math.sin(t * 6.5) * 0.15;
          leftArm.Shoulder.rotation.x = -0.15;
          rightArm.Shoulder.rotation.x = -0.15;
          leftArm.digits.forEach((d) => (d.rotation.x = -0.25));
          rightArm.digits.forEach((d) => (d.rotation.x = -0.25));
          break;

        case 'walking':
          // Striding walk pose
          const stride = Math.sin(t * 4.5);
          leftLeg.UpperLeg.rotation.x = stride * 0.32;
          rightLeg.UpperLeg.rotation.x = -stride * 0.32;
          leftArm.Shoulder.rotation.x = -stride * 0.35 - 0.08;
          rightArm.Shoulder.rotation.x = stride * 0.35 - 0.08;
          Hips.position.y = -0.16 + Math.abs(Math.sin(t * 9)) * 0.022;
          leftArm.digits.forEach((d) => (d.rotation.x = -0.25));
          rightArm.digits.forEach((d) => (d.rotation.x = -0.25));
          break;

        case 'jumping':
          // Celebration jump
          const jumpH = Math.abs(Math.sin(t * 6)) * 0.15;
          Hips.position.y = -0.16 + jumpH;
          leftArm.Shoulder.rotation.x = -1.55;
          leftArm.Shoulder.rotation.z = 0.5;
          rightArm.Shoulder.rotation.x = -1.55;
          rightArm.Shoulder.rotation.z = -0.5;
          Head.rotation.x = 0.12;
          leftArm.digits.forEach((d) => (d.rotation.x = -0.1));
          rightArm.digits.forEach((d) => (d.rotation.x = -0.1));
          break;

        case 'sitting':
          // Seated pose
          leftLeg.UpperLeg.rotation.x = -Math.PI / 2.2;
          rightLeg.UpperLeg.rotation.x = -Math.PI / 2.2;
          Hips.position.y = -0.38;
          leftArm.Shoulder.rotation.x = -0.4;
          rightArm.Shoulder.rotation.x = -0.4;
          leftArm.digits.forEach((d) => (d.rotation.x = -0.25));
          rightArm.digits.forEach((d) => (d.rotation.x = -0.25));
          break;

        case 'goodbye':
          // Respectful bow
          Chest.rotation.x = 0.28;
          Head.rotation.x = 0.16;
          leftArm.Shoulder.rotation.x = -0.3;
          rightArm.Shoulder.rotation.x = -0.3;
          leftArm.digits.forEach((d) => (d.rotation.x = -0.25));
          rightArm.digits.forEach((d) => (d.rotation.x = -0.25));
          break;

        case 'curious':
        case 'listening':
          // Attentive listening stance
          Head.rotation.z = 0.12;
          Head.rotation.y = -0.08;
          leftArm.Shoulder.rotation.x = -0.12;
          rightArm.Shoulder.rotation.x = -0.12;
          leftArm.digits.forEach((d) => (d.rotation.x = -0.25));
          rightArm.digits.forEach((d) => (d.rotation.x = -0.25));
          break;

        case 'idle':
        default:
          // Natural Standing Stance (Official Image 2!) Both arms clearly visible beside body!
          leftArm.Shoulder.rotation.x = THREE.MathUtils.lerp(
            leftArm.Shoulder.rotation.x,
            -0.08 + Math.sin(t * 1.8) * 0.025,
            0.1
          );
          leftArm.Shoulder.rotation.y = THREE.MathUtils.lerp(leftArm.Shoulder.rotation.y, 0, 0.1);
          leftArm.Shoulder.rotation.z = THREE.MathUtils.lerp(
            leftArm.Shoulder.rotation.z,
            0.18, // Hands resting slightly outward from hips, never clipped
            0.1
          );
          leftArm.Forearm.rotation.x = THREE.MathUtils.lerp(
            leftArm.Forearm.rotation.x,
            -0.18, // Slight elbow flexion forward
            0.1
          );
          leftArm.Forearm.rotation.y = THREE.MathUtils.lerp(leftArm.Forearm.rotation.y, 0, 0.1);
          leftArm.Hand.rotation.set(0, 0, 0);

          rightArm.Shoulder.rotation.x = THREE.MathUtils.lerp(
            rightArm.Shoulder.rotation.x,
            -0.08 - Math.sin(t * 1.8) * 0.025,
            0.1
          );
          rightArm.Shoulder.rotation.y = THREE.MathUtils.lerp(rightArm.Shoulder.rotation.y, 0, 0.1);
          rightArm.Shoulder.rotation.z = THREE.MathUtils.lerp(
            rightArm.Shoulder.rotation.z,
            -0.18,
            0.1
          );
          rightArm.Forearm.rotation.x = THREE.MathUtils.lerp(
            rightArm.Forearm.rotation.x,
            -0.18,
            0.1
          );
          rightArm.Forearm.rotation.y = THREE.MathUtils.lerp(rightArm.Forearm.rotation.y, 0, 0.1);
          rightArm.Hand.rotation.set(0, 0, 0);

          // Relaxed fingers with natural gentle curl
          leftArm.digits.forEach((d) => {
            d.rotation.x = THREE.MathUtils.lerp(d.rotation.x, -0.25, 0.1);
          });
          rightArm.digits.forEach((d) => {
            d.rotation.x = THREE.MathUtils.lerp(d.rotation.x, -0.25, 0.1);
          });

          Head.rotation.y = Math.sin(t * 1.2) * 0.05;
          Head.rotation.x = Math.sin(t * 1.5) * 0.025;
          leftLeg.UpperLeg.rotation.x = 0;
          rightLeg.UpperLeg.rotation.x = 0;
          break;
      }

      renderer.render(scene, camera);
    };

    animate();

    // ── RESIZE HANDLER ──────────────────────────────────────────
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`w-full h-full relative cursor-grab active:cursor-grabbing select-none ${className}`}
      title="Left-click & drag to orbit 360°, scroll to zoom"
    />
  );
}
