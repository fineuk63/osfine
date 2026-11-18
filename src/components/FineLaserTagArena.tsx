import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Crosshair, Shield, Volume2, VolumeX, ChevronDown, ChevronUp, RotateCcw, Users } from 'lucide-react';
import { ArenaBeamEvent, ArenaPlayerState } from '../types/fine';

interface FineLaserTagArenaProps {
  clientId: string;
  playerName: string;
  accountNumber: string;
  players: ArenaPlayerState[];
  beams: ArenaBeamEvent[];
  hitBanner: string | null;
  onJoinArena: (team: 'cobalt' | 'crimson') => void;
  onLeaveArena: () => void;
  onMove: (pos: { x: number; y: number; z: number; yaw: number; pitch: number }) => void;
  onFire: (origin: [number, number, number], dir: [number, number, number]) => void;
}

const ARENA_PILLARS = [
  { x: 0, z: 0, hw: 2.2, hd: 2.2, height: 4.6, accent: 0x3b82f6 },
  { x: -10, z: -10, hw: 1.8, hd: 3.2, height: 3.8, accent: 0x2563eb },
  { x: 10, z: -10, hw: 1.8, hd: 3.2, height: 3.8, accent: 0x2563eb },
  { x: -10, z: 10, hw: 1.8, hd: 3.2, height: 3.8, accent: 0xd94b58 },
  { x: 10, z: 10, hw: 1.8, hd: 3.2, height: 3.8, accent: 0xd94b58 },
  { x: 0, z: -16, hw: 4.5, hd: 1.2, height: 2.9, accent: 0x2563eb },
  { x: 0, z: 16, hw: 4.5, hd: 1.2, height: 2.9, accent: 0xd94b58 },
  { x: -17, z: 0, hw: 1.2, hd: 4.5, height: 3.2, accent: 0x64748b },
  { x: 17, z: 0, hw: 1.2, hd: 4.5, height: 3.2, accent: 0x64748b },
];

// Reusable math objects outside render loop (zero GC churn)
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _rayOrigin = new THREE.Vector3();
const _rayDir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

function createFloorGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#111927';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(72, 118, 194, 0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(6, 6, 52, 52);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Composite 6-part procedural rig for remote players and sentry drones
function createPlayerRig(team: 'cobalt' | 'crimson', isBot?: boolean): THREE.Group {
  const group = new THREE.Group();
  const teamColor = team === 'cobalt' ? 0x2d70d5 : 0xd94b58;

  const armorMat = new THREE.MeshStandardMaterial({
    color: isBot ? 0x334155 : 0x1e293b,
    metalness: 0.72,
    roughness: 0.34,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.22,
  });
  const emitterMat = new THREE.MeshStandardMaterial({
    color: teamColor,
    emissive: teamColor,
    emissiveIntensity: 1.4,
    metalness: 0.2,
    roughness: 0.25,
  });

  // 1. Base boots / hover plinth (bottom-center pivot at y=0)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.22, 16), trimMat);
  base.position.y = 0.11;
  group.add(base);

  // 2. Lower legs column
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.72, 12), armorMat);
  legs.position.y = 0.58;
  group.add(legs);

  // 3. Armored torso core
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 0.42), armorMat);
  torso.position.y = 1.24;
  group.add(torso);

  // 4. Illuminated front chest sensor plate (target zone)
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.46), emitterMat);
  chestPlate.position.y = 1.26;
  group.add(chestPlate);

  // 5. Shoulder pauldrons
  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.16, 0.34), trimMat);
  shoulders.position.y = 1.54;
  group.add(shoulders);

  // 6. Visor helmet
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), armorMat);
  head.position.y = 1.8;
  group.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.22), emitterMat);
  visor.position.set(0, 1.81, -0.14);
  group.add(visor);

  // 7. Side-mounted laser carbine
  const carbine = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.72), trimMat);
  carbine.position.set(0.42, 1.22, -0.28);
  group.add(carbine);

  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}

// Composite 5-part first-person laser blaster viewmodel
function createBlasterViewmodel(team: 'cobalt' | 'crimson'): THREE.Group {
  const blaster = new THREE.Group();
  const teamColor = team === 'cobalt' ? 0x3b82f6 : 0xef4444;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.75,
    roughness: 0.3,
  });
  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.9,
    roughness: 0.18,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: teamColor,
    emissive: teamColor,
    emissiveIntensity: 1.6,
    roughness: 0.2,
    metalness: 0.1,
  });

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.56), bodyMat);
  blaster.add(receiver);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 0.48, 12), barrelMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, -0.44);
  blaster.add(barrel);

  const coreStrip = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.035, 0.34), coreMat);
  coreStrip.position.set(0, 0.04, -0.05);
  blaster.add(coreStrip);

  const optic = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.14), barrelMat);
  optic.position.set(0, 0.095, 0.02);
  blaster.add(optic);

  const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 8, 16), coreMat);
  muzzleRing.position.set(0, 0.02, -0.68);
  blaster.add(muzzleRing);

  blaster.position.set(0.28, -0.24, -0.48);
  return blaster;
}

export const FineLaserTagArena: React.FC<FineLaserTagArenaProps> = ({
  clientId,
  playerName,
  accountNumber,
  players,
  beams,
  hitBanner,
  onJoinArena,
  onLeaveArena,
  onMove,
  onFire,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [team, setTeam] = useState<'cobalt' | 'crimson'>('cobalt');
  const [joined, setJoined] = useState(false);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [dockOpen, setDockOpen] = useState(true);
  const [webglError, setWebglError] = useState<string | null>(null);

  // Refs synced to animation loop so React state changes never tear down WebGL
  const playersRef = useRef<ArenaPlayerState[]>(players);
  const beamsRef = useRef<ArenaBeamEvent[]>(beams);
  const clientIdRef = useRef(clientId);
  const joinedRef = useRef(joined);
  const teamRef = useRef(team);
  const mutedRef = useRef(muted);
  const onMoveRef = useRef(onMove);
  const onFireRef = useRef(onFire);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recoilRef = useRef(0);
  const resetSignalRef = useRef(0);

  playersRef.current = players;
  beamsRef.current = beams;
  clientIdRef.current = clientId;
  joinedRef.current = joined;
  teamRef.current = team;
  mutedRef.current = muted;
  onMoveRef.current = onMove;
  onFireRef.current = onFire;

  function playLaserSound(kind: 'fire' | 'hit') {
    if (mutedRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') void ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (kind === 'fire') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(760, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.14);
        gain.gain.setValueAtTime(0.11, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.15);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.09);
        gain.gain.setValueAtTime(0.13, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch {
      // Ignore audio autoplay blocks
    }
  }

  useEffect(() => {
    if (hitBanner) {
      playLaserSound('hit');
    }
  }, [hitBanner]);

  useEffect(() => {
    onJoinArena(team);
    setJoined(true);
    return () => {
      onLeaveArena();
    };
  }, []);

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    // Software WebGL probe
    const isSoftwareGl = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError('WebGL is unavailable in this browser context.');
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(mount.clientWidth || 1000, mount.clientHeight || 620);

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError('3D graphics context paused. Click Reload Arena to restore.');
    };
    const onContextRestored = () => {
      setWebglError(null);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1526);
    scene.fog = new THREE.FogExp2(0x0c1526, 0.018);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      72,
      (mount.clientWidth || 1000) / (mount.clientHeight || 620),
      0.1,
      140
    );
    scene.add(camera);

    let blasterGroup = createBlasterViewmodel(teamRef.current);
    camera.add(blasterGroup);

    // Three-point + Hemisphere lighting
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.75);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1e0, 1.85);
    keyLight.position.set(16, 28, 12);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -30;
      keyLight.shadow.camera.right = 30;
      keyLight.shadow.camera.top = 30;
      keyLight.shadow.camera.bottom = -30;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    rimLight.position.set(-18, 12, -20);
    scene.add(rimLight);

    // Floor
    const floorTex = createFloorGridTexture();
    floorTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.42,
      metalness: 0.35,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(54, 54), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Arena Perimeter Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x162238,
      metalness: 0.65,
      roughness: 0.38,
    });
    const wallCoords: Array<[number, number, number, number, number]> = [
      [0, 3, -27, 54, 1],
      [0, 3, 27, 54, 1],
      [-27, 3, 0, 1, 54],
      [27, 3, 0, 1, 54],
    ];
    for (const [wx, wy, wz, ww, wd] of wallCoords) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(ww, 6, wd), wallMat);
      w.position.set(wx, wy, wz);
      w.receiveShadow = true;
      scene.add(w);
    }

    // Composite Cover Pillars (3-part structures)
    const pillarSteelMat = new THREE.MeshStandardMaterial({
      color: 0x24324a,
      metalness: 0.78,
      roughness: 0.28,
    });
    const pillarCapMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.85,
      roughness: 0.2,
    });

    for (const p of ARENA_PILLARS) {
      const pGroup = new THREE.Group();
      pGroup.position.set(p.x, 0, p.z);

      const core = new THREE.Mesh(
        new THREE.BoxGeometry(p.hw * 2, p.height, p.hd * 2),
        pillarSteelMat
      );
      core.position.y = p.height / 2;
      core.castShadow = true;
      core.receiveShadow = true;
      pGroup.add(core);

      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(p.hw * 2 + 0.28, 0.24, p.hd * 2 + 0.28),
        pillarCapMat
      );
      plinth.position.y = 0.12;
      plinth.receiveShadow = true;
      pGroup.add(plinth);

      const stripMat = new THREE.MeshStandardMaterial({
        color: p.accent,
        emissive: p.accent,
        emissiveIntensity: 1.2,
        roughness: 0.2,
        metalness: 0.1,
      });
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(p.hw * 2 + 0.08, 0.12, p.hd * 2 + 0.08),
        stripMat
      );
      strip.position.y = p.height - 0.45;
      pGroup.add(strip);

      scene.add(pGroup);
    }

    // Remote Player Meshes Map
    const remoteMeshes = new Map<string, { group: THREE.Group; team: 'cobalt' | 'crimson'; isBot?: boolean }>();
    // Active Laser Beams Map
    const renderedBeams = new Map<string, { mesh: THREE.Mesh; expiresAt: number }>();

    // Local Player Physics State
    const localState = {
      x: 0,
      y: 1.7,
      z: -21,
      vy: 0,
      yaw: Math.PI,
      pitch: 0,
      grounded: true,
      lastNetworkSent: 0,
    };

    const keys: Record<string, boolean> = {};
    let isDraggingLook = false;
    let prevPointerX = 0;
    let prevPointerY = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }
      keys[e.code] = true;
      if (e.code === 'Space' && localState.grounded) {
        localState.vy = 6.5;
        localState.grounded = false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    const triggerFire = () => {
      if (!joinedRef.current) return;
      const me = playersRef.current.find((p) => p.id === clientIdRef.current);
      if (me && me.taggedOutUntil > Date.now()) return;

      recoilRef.current = 0.12;
      playLaserSound('fire');

      _rayOrigin.set(localState.x, localState.y - 0.1, localState.z);
      _rayDir.set(0, 0, -1).applyEuler(new THREE.Euler(localState.pitch, localState.yaw, 0, 'YXZ')).normalize();

      onFireRef.current(
        [_rayOrigin.x, _rayOrigin.y, _rayOrigin.z],
        [_rayDir.x, _rayDir.y, _rayDir.z]
      );
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.target !== renderer.domElement) return;
      if (document.pointerLockElement !== renderer.domElement) {
        try {
          const maybePromise = renderer.domElement.requestPointerLock() as unknown as Promise<void> | undefined;
          if (maybePromise && typeof maybePromise.catch === 'function') {
            maybePromise.catch(() => {});
          }
        } catch {
          // Fallback to drag look
        }
        isDraggingLook = true;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
      }
      if (e.button === 0) {
        triggerFire();
      }
    };

    const handleMouseUp = () => {
      isDraggingLook = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === renderer.domElement) {
        localState.yaw -= e.movementX * 0.0022;
        localState.pitch = THREE.MathUtils.clamp(localState.pitch - e.movementY * 0.002, -1.25, 1.25);
      } else if (isDraggingLook) {
        const dx = e.clientX - prevPointerX;
        const dy = e.clientY - prevPointerY;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
        localState.yaw -= dx * 0.004;
        localState.pitch = THREE.MathUtils.clamp(localState.pitch - dy * 0.004, -1.25, 1.25);
      }
    };

    const handlePointerLockChange = () => {
      setPointerLocked(document.pointerLockElement === renderer.domElement);
    };

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth || 1000;
      const h = mount.clientHeight || 620;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const clock = new THREE.Clock();
    let frameId = 0;
    let lastTeamBuilt = teamRef.current;
    let lastResetSeen = resetSignalRef.current;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function collidesWithPillar(nx: number, nz: number): boolean {
      const radius = 0.55;
      if (nx < -25.2 || nx > 25.2 || nz < -25.2 || nz > 25.2) return true;
      for (const p of ARENA_PILLARS) {
        if (
          nx > p.x - p.hw - radius &&
          nx < p.x + p.hw + radius &&
          nz > p.z - p.hd - radius &&
          nz < p.z + p.hd + radius
        ) {
          return true;
        }
      }
      return false;
    }

    function tick() {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const now = Date.now();

      // Rebuild viewmodel if team switched
      if (lastTeamBuilt !== teamRef.current) {
        camera.remove(blasterGroup);
        blasterGroup = createBlasterViewmodel(teamRef.current);
        camera.add(blasterGroup);
        lastTeamBuilt = teamRef.current;
      }

      // Handle manual reset/spawn
      if (lastResetSeen !== resetSignalRef.current) {
        localState.x = 0;
        localState.z = teamRef.current === 'cobalt' ? -21 : 21;
        localState.yaw = teamRef.current === 'cobalt' ? Math.PI : 0;
        localState.pitch = 0;
        localState.y = 1.7;
        lastResetSeen = resetSignalRef.current;
      }

      // Player Movement (WASD / Arrows)
      const me = playersRef.current.find((p) => p.id === clientIdRef.current);
      const taggedOut = Boolean(me && me.taggedOutUntil > now);

      if (!taggedOut) {
        const moveSpeed = keys['ShiftLeft'] ? 10.5 : 7.2;
        _forward.set(-Math.sin(localState.yaw), 0, -Math.cos(localState.yaw)).normalize();
        _right.crossVectors(_forward, _up).normalize();

        let moveX = 0;
        let moveZ = 0;
        if (keys['KeyW'] || keys['ArrowUp']) {
          moveX += _forward.x;
          moveZ += _forward.z;
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
          moveX -= _forward.x;
          moveZ -= _forward.z;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
          moveX += _right.x;
          moveZ += _right.z;
        }
        if (keys['KeyA'] || keys['ArrowLeft']) {
          moveX -= _right.x;
          moveZ -= _right.z;
        }

        const mag = Math.hypot(moveX, moveZ);
        if (mag > 0.001) {
          const stepX = (moveX / mag) * moveSpeed * dt;
          const stepZ = (moveZ / mag) * moveSpeed * dt;
          if (!collidesWithPillar(localState.x + stepX, localState.z)) {
            localState.x += stepX;
          }
          if (!collidesWithPillar(localState.x, localState.z + stepZ)) {
            localState.z += stepZ;
          }
        }
      }

      // Gravity & Jump
      if (!localState.grounded) {
        localState.vy -= 18 * dt;
        localState.y += localState.vy * dt;
        if (localState.y <= 1.7) {
          localState.y = 1.7;
          localState.vy = 0;
          localState.grounded = true;
        }
      }

      camera.position.set(localState.x, localState.y, localState.z);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = localState.yaw;
      camera.rotation.x = localState.pitch;

      // Recoil spring damping on blaster viewmodel
      recoilRef.current = THREE.MathUtils.damp(recoilRef.current, 0, 14, dt);
      blasterGroup.position.z = -0.48 + recoilRef.current;

      // Sync local position to WebSocket server at ~18Hz
      if (now - localState.lastNetworkSent > 55) {
        localState.lastNetworkSent = now;
        onMoveRef.current({
          x: localState.x,
          y: localState.y,
          z: localState.z,
          yaw: localState.yaw,
          pitch: localState.pitch,
        });
      }

      // Sync Remote Players & Sentries
      const activeIds = new Set<string>();
      for (const p of playersRef.current) {
        if (p.id === clientIdRef.current) continue;
        activeIds.add(p.id);
        let entry = remoteMeshes.get(p.id);
        if (!entry || entry.team !== p.team) {
          if (entry) scene.remove(entry.group);
          const group = createPlayerRig(p.team, p.isBot);
          group.position.set(p.x, 0, p.z);
          scene.add(group);
          entry = { group, team: p.team, isBot: p.isBot };
          remoteMeshes.set(p.id, entry);
        }
        entry.group.visible = p.taggedOutUntil <= now;
        entry.group.position.x = THREE.MathUtils.damp(entry.group.position.x, p.x, 12, dt);
        entry.group.position.z = THREE.MathUtils.damp(entry.group.position.z, p.z, 12, dt);
        entry.group.position.y = THREE.MathUtils.damp(entry.group.position.y, Math.max(0, p.y - 1.7), 12, dt);
        entry.group.rotation.y = p.yaw;
      }
      for (const [id, entry] of remoteMeshes) {
        if (!activeIds.has(id)) {
          scene.remove(entry.group);
          remoteMeshes.delete(id);
        }
      }

      // Render & Expire Laser Beams
      for (const b of beamsRef.current) {
        if (!renderedBeams.has(b.id) && now - b.timestamp < 320) {
          const start = new THREE.Vector3(...b.from);
          const end = new THREE.Vector3(...b.to);
          const dist = Math.max(0.5, start.distanceTo(end));
          const geom = new THREE.CylinderGeometry(0.04, 0.04, dist, 8);
          const mat = new THREE.MeshBasicMaterial({
            color: b.team === 'cobalt' ? 0x60a5fa : 0xf87171,
            transparent: true,
            opacity: 0.92,
          });
          const beamMesh = new THREE.Mesh(geom, mat);
          beamMesh.position.copy(start).lerp(end, 0.5);
          beamMesh.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            end.clone().sub(start).normalize()
          );
          scene.add(beamMesh);
          renderedBeams.set(b.id, { mesh: beamMesh, expiresAt: now + 220 });
        }
      }
      for (const [id, entry] of renderedBeams) {
        const remaining = entry.expiresAt - now;
        if (remaining <= 0) {
          scene.remove(entry.mesh);
          entry.mesh.geometry.dispose();
          (entry.mesh.material as THREE.Material).dispose();
          renderedBeams.delete(id);
        } else {
          (entry.mesh.material as THREE.MeshBasicMaterial).opacity = remaining / 220;
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      floorTex.dispose();
      renderer.dispose();
    };
  }, []);

  const handleTeamChange = (nextTeam: 'cobalt' | 'crimson') => {
    setTeam(nextTeam);
    resetSignalRef.current += 1;
    onJoinArena(nextTeam);
  };

  const me = players.find((p) => p.id === clientId);
  const cobaltScore = players.filter((p) => p.team === 'cobalt').reduce((acc, p) => acc + p.score, 0);
  const crimsonScore = players.filter((p) => p.team === 'crimson').reduce((acc, p) => acc + p.score, 0);
  const isTaggedOut = Boolean(me && me.taggedOutUntil > Date.now());

  return (
    <div className="relative w-full h-[calc(100vh-148px)] min-h-[540px] bg-[#0c1526] rounded-xl overflow-hidden border border-slate-800 select-none">
      {/* Isolated WebGL Mount Container */}
      <div ref={canvasMountRef} className="w-full h-full cursor-crosshair" />

      {webglError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c1526] text-slate-100 p-6 text-center z-20">
          <img
            src="/src/assets/images/fine_arena_preview_1794990398078.jpg"
            alt="FINE Tactical Laser Tag Arena"
            referrerPolicy="no-referrer"
            className="w-full max-w-xl h-56 object-cover rounded-xl mb-5 border border-slate-700"
          />
          <h3 className="text-lg font-semibold mb-1">3D Viewport Unavailable</h3>
          <p className="text-sm text-slate-400 max-w-md">{webglError}</p>
        </div>
      )}

      {/* Top Minimal HUD Strip (No backdrop-blur over WebGL) */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-4 pointer-events-none z-10">
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 flex items-center gap-4 pointer-events-auto">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">FINE Arena</div>
            <div className="text-sm font-semibold truncate max-w-[180px]">
              {playerName} · #{accountNumber}
            </div>
          </div>
          <div className="h-7 w-px bg-slate-800" />
          <div className="flex items-center gap-4 text-xs tabular-nums">
            <div>
              <span className="text-blue-400 font-semibold">Cobalt</span>{' '}
              <span className="font-mono text-white font-semibold">{cobaltScore}</span>
            </div>
            <span className="text-slate-600">/</span>
            <div>
              <span className="text-rose-400 font-semibold">Crimson</span>{' '}
              <span className="font-mono text-white font-semibold">{crimsonScore}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 flex items-center gap-4 text-xs tabular-nums">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Integrity:</span>
            <span className="font-mono font-semibold text-white">{me?.health ?? 100}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Active:</span>
            <span className="font-mono font-semibold text-white">{players.length}</span>
          </div>
          <div>
            <span>Tags:</span>{' '}
            <span className="font-mono font-semibold text-white">{me?.tags ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Center Reticle */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
        <div className="relative flex items-center justify-center">
          <Crosshair
            className={`w-6 h-6 ${team === 'cobalt' ? 'text-blue-400/90' : 'text-rose-400/90'}`}
          />
        </div>
      </div>

      {/* Hit / Tagged-out Notification Banner */}
      {hitBanner && (
        <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-blue-500/40 text-white px-4 py-1.5 rounded-lg text-xs font-medium z-10">
          {hitBanner}
        </div>
      )}

      {isTaggedOut && (
        <div className="pointer-events-none absolute inset-0 bg-rose-950/45 flex flex-col items-center justify-center text-white z-10">
          <p className="text-xl font-bold tracking-tight">Tagged Out — Respawning</p>
          <p className="text-xs text-rose-200 mt-1">Suit shield recharges in 3 seconds</p>
        </div>
      )}

      {/* Collapsible Bottom Control Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center max-w-[94vw]">
        <button
          type="button"
          onClick={() => setDockOpen((v) => !v)}
          className="mb-1.5 px-3 py-1 rounded-md bg-slate-950/90 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 hover:bg-slate-900 whitespace-nowrap"
        >
          {dockOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          {dockOpen ? 'Hide Controls' : 'Show Controls'}
        </button>

        {dockOpen && (
          <div className="bg-slate-950/95 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 flex flex-wrap items-center justify-center gap-3 shadow-xl">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => handleTeamChange('cobalt')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  team === 'cobalt' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Cobalt Team
              </button>
              <button
                type="button"
                onClick={() => handleTeamChange('crimson')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  team === 'crimson' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Crimson Team
              </button>
            </div>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            <span className="text-xs text-slate-300 whitespace-nowrap">
              {pointerLocked
                ? 'Locked: WASD move · Space jump · Click fire · Esc unlock'
                : 'Click arena to lock aim · Drag + Click to fire · WASD move'}
            </span>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            <button
              type="button"
              onClick={() => {
                resetSignalRef.current += 1;
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Position
            </button>

            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            >
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              {muted ? 'Muted' : 'Sound On'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
