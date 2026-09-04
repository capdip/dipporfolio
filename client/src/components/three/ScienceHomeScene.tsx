import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { useQualityTier, type QualityTier } from '../../hooks/useEnvironment';

interface ScienceHomeSceneProps {
  /** Kept for interface compatibility (scene is fully procedural). */
  imageUrls?: string[];
  colorPrimary?: string;
  colorAccent?: string;
  className?: string;
}

const QUALITY_PRESETS: Record<
  QualityTier,
  { dnaPairs: number; spikes: number; atoms: number; bacteria: number; particles: number; dpr: number }
> = {
  high: { dnaPairs: 20, spikes: 24, atoms: 10, bacteria: 5, particles: 600, dpr: 2 },
  medium: { dnaPairs: 14, spikes: 16, atoms: 8, bacteria: 3, particles: 320, dpr: 1.5 },
  low: { dnaPairs: 9, spikes: 10, atoms: 6, bacteria: 2, particles: 130, dpr: 1 },
};

const SLIDE_DURATION = 6; // seconds per auto-slide

/** DNA double helix: two sphere strands + connecting rungs. */
function buildDna(pairs: number, primary: THREE.Color, accent: THREE.Color): THREE.Group {
  const group = new THREE.Group();
  const sphereGeo = new THREE.SphereGeometry(0.16, 16, 16);
  const rungGeo = new THREE.CylinderGeometry(0.045, 0.045, 1, 8);
  const matA = new THREE.MeshStandardMaterial({ color: primary, roughness: 0.3, metalness: 0.2, emissive: primary, emissiveIntensity: 0.25 });
  const matB = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.3, metalness: 0.2, emissive: accent, emissiveIntensity: 0.25 });
  const rungMat = new THREE.MeshStandardMaterial({ color: 0x8ea0c0, roughness: 0.6, transparent: true, opacity: 0.6 });

  for (let i = 0; i < pairs; i++) {
    const t = (i / pairs) * Math.PI * 3.4;
    const y = i * 0.4 - pairs * 0.2;
    const r = 0.9;
    const a = new THREE.Mesh(sphereGeo, i % 2 ? matA : matB);
    a.position.set(Math.cos(t) * r, y, Math.sin(t) * r);
    const b = new THREE.Mesh(sphereGeo, i % 2 ? matB : matA);
    b.position.set(Math.cos(t + Math.PI) * r, y, Math.sin(t + Math.PI) * r);
    group.add(a, b);

    const rung = new THREE.Mesh(rungGeo, rungMat);
    rung.position.set(0, y, 0);
    rung.scale.y = 2 * r;
    rung.lookAt(new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r));
    rung.rotateX(Math.PI / 2);
    group.add(rung);
  }
  return group;
}

/** Virus particle: glowing core + spike proteins + inner genetic strand. */
function buildVirus(spikes: number, primary: THREE.Color, accent: THREE.Color): THREE.Group {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 32, 32),
    new THREE.MeshStandardMaterial({ color: primary, roughness: 0.25, metalness: 0.1, emissive: primary, emissiveIntensity: 0.35 })
  );
  group.add(core);

  const spikeGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.45, 8);
  const knobGeo = new THREE.SphereGeometry(0.12, 12, 12);
  const spikeMat = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.4, emissive: accent, emissiveIntensity: 0.3 });
  const dir = new THREE.Vector3();

  for (let i = 0; i < spikes; i++) {
    // Fibonacci sphere distribution for even spike coverage.
    const phi = Math.acos(1 - (2 * (i + 0.5)) / spikes);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    dir.setFromSphericalCoords(1, phi, theta);

    const spike = new THREE.Mesh(spikeGeo, spikeMat);
    spike.position.copy(dir.clone().multiplyScalar(0.95));
    spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const knob = new THREE.Mesh(knobGeo, spikeMat);
    knob.position.copy(dir.clone().multiplyScalar(1.2));
    group.add(spike, knob);
  }

  const strandPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = (i / 40) * Math.PI * 6;
    strandPts.push(new THREE.Vector3(Math.cos(t) * 0.3, i / 40 - 0.5, Math.sin(t) * 0.3));
  }
  const strand = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strandPts), 64, 0.035, 6, false),
    new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.8, roughness: 0.4 })
  );
  group.add(strand);
  return group;
}

/** Molecule: central atom with evenly distributed bonded satellites. */
function buildMolecule(atoms: number, primary: THREE.Color, accent: THREE.Color): THREE.Group {
  const group = new THREE.Group();
  const atomGeo = new THREE.SphereGeometry(0.34, 20, 20);
  const satGeo = new THREE.SphereGeometry(0.18, 14, 14);
  const bondGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
  const coreMat = new THREE.MeshStandardMaterial({ color: primary, roughness: 0.2, metalness: 0.35, emissive: primary, emissiveIntensity: 0.2 });
  const satMat = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.3, metalness: 0.2, emissive: accent, emissiveIntensity: 0.25 });
  const bondMat = new THREE.MeshStandardMaterial({ color: 0x9fb2d8, roughness: 0.5, transparent: true, opacity: 0.7 });

  group.add(new THREE.Mesh(atomGeo, coreMat));
  const dir = new THREE.Vector3();
  for (let i = 0; i < atoms; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / atoms);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i + 0.7;
    dir.setFromSphericalCoords(1, phi, theta);
    const sat = new THREE.Mesh(satGeo, satMat);
    sat.position.copy(dir.clone().multiplyScalar(1.05));
    const bond = new THREE.Mesh(bondGeo, bondMat);
    bond.position.copy(dir.clone().multiplyScalar(0.52));
    bond.scale.y = 1.05;
    bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    group.add(sat, bond);
  }
  return group;
}

/** Bacterium: rod-shaped cell with wiggly flagella. */
function buildBacterium(primary: THREE.Color, accent: THREE.Color): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.32, 0.7, 8, 20),
    new THREE.MeshStandardMaterial({ color: primary, roughness: 0.35, transparent: true, opacity: 0.92, emissive: primary, emissiveIntensity: 0.15 })
  );
  group.add(body);

  const flagMat = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.5, emissive: accent, emissiveIntensity: 0.4 });
  for (let i = 0; i < 3; i++) {
    const pts: THREE.Vector3[] = [];
    for (let j = 0; j <= 20; j++) {
      const t = j / 20;
      pts.push(new THREE.Vector3(0.65 + t * 0.9, Math.sin(t * 9 + i * 2.1) * 0.16, Math.cos(t * 7 + i) * 0.16));
    }
    const flagellum = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.025, 5, false),
      flagMat
    );
    flagellum.rotation.z = (i - 1) * 0.5;
    group.add(flagellum);
  }
  return group;
}

export default function ScienceHomeScene({
  colorPrimary = '#38bdf8',
  colorAccent = '#a78bfa',
  className,
}: ScienceHomeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const tier = useQualityTier();
  const tierRef = useRef(tier);
  tierRef.current = tier;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let webglOk = true;
    try {
      const probe = document.createElement('canvas');
      webglOk = Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'));
    } catch {
      webglOk = false;
    }
    if (!webglOk || prefersReduced) {
      console.info(
        `[ScienceHomeScene] 3D disabled — webglOk=${webglOk}, prefersReducedMotion=${prefersReduced}. Showing animated CSS fallback.`
      );
      mount.classList.add('scene-fallback');
      return () => mount.classList.remove('scene-fallback');
    }

    const preset = QUALITY_PRESETS[tierRef.current];
    const primary = new THREE.Color(colorPrimary);
    const accent = new THREE.Color(colorAccent);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / Math.max(mount.clientHeight, 1), 0.1, 100);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({
      antialias: tierRef.current !== 'low',
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.dpr));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 6, 8);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(accent, 14, 30);
    rimLight.position.set(-6, -3, 5);
    scene.add(rimLight);
    const fillLight = new THREE.PointLight(primary, 10, 30);
    fillLight.position.set(6, 4, -4);
    scene.add(fillLight);


  // --- Specimen carousel: stations arranged in a ring around the origin. ---
  const stations: Array<{ group: THREE.Group; angle: number; baseScale: number; spin: number }> = [];
  const addStation = (group: THREE.Group, angle: number, scale: number, spin: number) => {
    const radius = 4.4;
    group.position.set(Math.sin(angle) * radius, 0, -Math.cos(angle) * radius + 1.5);
    group.rotation.y = angle;
    scene.add(group);
    stations.push({ group, angle, baseScale: scale, spin });
  };

  addStation(buildDna(preset.dnaPairs, primary, accent), 0, 1.05, 0.35);
  addStation(buildVirus(preset.spikes, accent, primary), Math.PI / 2, 1.0, -0.3);
  addStation(buildMolecule(preset.atoms, primary, accent), Math.PI, 1.0, 0.45);
  for (let i = 0; i < preset.bacteria; i++) {
    const b = buildBacterium(accent, primary);
    b.rotation.z = (i - (preset.bacteria - 1) / 2) * 0.55;
    const wrap = new THREE.Group();
    wrap.add(b);
    addStation(wrap, Math.PI * 1.5 + i * 0.22, 0.9 + i * 0.05, -0.25);
  }

  // --- Ambient particle field. ---
  const particleCount = preset.particles;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 22;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: primary,
    size: 0.05,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // --- Mouse parallax (lerped, never snappy). ---
  const mouse = { x: 0, y: 0 };
  const onMouseMove = (e: MouseEvent) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('mousemove', onMouseMove);

  // --- Auto-slide camera: orbits to each station in turn. ---
  const camState = { angle: 0, distance: 11, height: 0 };
  let slideIndex = 0;
  let slideTween: gsap.core.Tween | null = null;
  const goToSlide = (index: number) => {
    const target = index % stations.length;
    const station = stations[target];
    slideTween?.kill();
    slideTween = gsap.to(camState, {
      angle: station.angle,
      distance: 8.2,
      height: 0.6,
      duration: 1.6,
      ease: 'power3.inOut',
    });
    stations.forEach((s, i) => {
      const focusScale = i === target ? s.baseScale * 1.18 : s.baseScale * 0.92;
      gsap.to(s.group.scale, { x: focusScale, y: focusScale, z: focusScale, duration: 1.4, ease: 'power2.inOut' });
    });
  };
  goToSlide(0);
  const slideTimer = window.setInterval(() => {
    slideIndex = (slideIndex + 1) % stations.length;
    goToSlide(slideIndex);
  }, SLIDE_DURATION * 1000);


  // --- Render loop: paused off-screen / hidden tab to save CPU/GPU. ---
  let visible = true;
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  });
  io.observe(mount);
  const onVisibility = () => {
    visible = !document.hidden;
  };
  document.addEventListener('visibilitychange', onVisibility);

  const clock = new THREE.Timer();
  let rafId = 0;
  const animate = () => {
    rafId = requestAnimationFrame(animate);
    if (!visible) return;
    clock.update();
    const t = clock.getElapsed();

    for (const s of stations) {
      s.group.rotation.y = s.angle + t * s.spin;
      s.group.position.y = Math.sin(t * 0.8 + s.angle * 2) * 0.35;
      s.group.rotation.z = Math.sin(t * 0.5 + s.angle) * 0.08;
    }
    particles.rotation.y = t * 0.02;
    particles.rotation.x = Math.sin(t * 0.1) * 0.05;

    // Camera: auto-slide orbit + mouse parallax offset.
    const cx = Math.sin(camState.angle) * camState.distance;
    const cz = -Math.cos(camState.angle) * camState.distance + 1.5;
    camera.position.x += (cx + mouse.x * 1.4 - camera.position.x) * 0.06;
    camera.position.y += (camState.height - mouse.y * 0.9 - camera.position.y) * 0.06;
    camera.position.z += (cz - camera.position.z) * 0.06;
    camera.lookAt(0, 0, 1.5);

    renderer.render(scene, camera);
  };
  animate();

  const onResize = () => {
    if (!mount.clientWidth || !mount.clientHeight) return;
    camera.aspect = mount.clientWidth / mount.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(mount.clientWidth, mount.clientHeight);
  };
  window.addEventListener('resize', onResize);

  return () => {
    cancelAnimationFrame(rafId);
    window.clearInterval(slideTimer);
    slideTween?.kill();
    gsap.killTweensOf([camState, particleMat]);
    for (const s of stations) gsap.killTweensOf(s.group.scale);
    io.disconnect();
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    particleGeo.dispose();
    particleMat.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
  };
}, [colorPrimary, colorAccent]);

return <div ref={mountRef} aria-hidden="true" className={className} />;
}

