import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSimulator } from '../../context/SimulatorContext';
import { soundFx } from '../../audio/audioSynthesizer';
import { Power, Layers, Map, Navigation, RotateCcw } from 'lucide-react';

// ── Fix leaflet default icon path issue with Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// UTU Bardoli — Precise GPS from Wikipedia (21°04′07″N 73°07′58″E)
const UTU_LAT = 21.0686;
const UTU_LNG = 73.1329;

// Scale: 1 Three.js unit ≈ 5 meters ≈ 0.000045 degrees lat
const METERS_PER_UNIT = 5;
const DEG_PER_METER_LAT = 1 / 111320;
const DEG_PER_METER_LNG = 1 / (111320 * Math.cos(UTU_LAT * Math.PI / 180));

// Pulse keyframe injected once into document head
if (typeof document !== 'undefined' && !document.getElementById('drone-pulse-style')) {
  const style = document.createElement('style');
  style.id = 'drone-pulse-style';
  style.textContent = `
    @keyframes dronePulse {
      0%   { box-shadow: 0 0 0 0 rgba(124,58,237,0.8), 0 0 12px rgba(124,58,237,0.6); }
      70%  { box-shadow: 0 0 0 14px rgba(124,58,237,0), 0 0 20px rgba(124,58,237,0.3); }
      100% { box-shadow: 0 0 0 0 rgba(124,58,237,0), 0 0 12px rgba(124,58,237,0.6); }
    }
    @keyframes droneRotor {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    .drone-marker-inner { animation: dronePulse 1.4s ease-out infinite; }
  `;
  document.head.appendChild(style);
}

// Drone marker icon — large, pulsing, always visible on map
const droneIcon = L.divIcon({
  html: `
    <div class="drone-marker-inner" style="
      width:44px; height:44px;
      background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
      border: 3px solid #a78bfa;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
      position: relative;
      z-index: 9999;
    ">
      🚁
    </div>`,
  className: '',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -26],
});

// Home helipad icon — slightly smaller so drone marker is always on top visually
const homeIcon = L.divIcon({
  html: `<div style="
    width:30px; height:30px;
    background: #1e3a2f;
    border: 2.5px solid #facc15;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: bold; color: #facc15;
    box-shadow: 0 0 8px rgba(250,204,21,0.5);
  ">H</div>`,
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -18],
});

// ── Leaflet map child: drone + home markers
function DroneMapMarker({ lat, lng, trail, isArmed }) {
  return (
    <>
      {/* Home / helipad marker — rendered FIRST so drone renders on top */}
      <Marker position={[UTU_LAT, UTU_LNG]} icon={homeIcon} zIndexOffset={0}>
        <Popup>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: 1.6 }}>
            <b>🏠 Home — UTU Maliba Campus</b><br />
            Uka Tarsadia University<br />
            Gopal Vidyanagar, Tarsadi<br />
            Bardoli, Surat — 394350<br />
            <span style={{color:'#888'}}>21°04′07″N 73°07′58″E</span>
          </div>
        </Popup>
      </Marker>

      {/* Drone marker — rendered LAST + zIndexOffset=1000 so always on top */}
      <Marker position={[lat, lng]} icon={droneIcon} zIndexOffset={1000}>
        <Popup>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: 1.6 }}>
            <b>🚁 Drone Position</b><br />
            Lat: {lat.toFixed(5)}° N<br />
            Lng: {lng.toFixed(5)}° E<br />
            <span style={{color: isArmed ? '#22c55e' : '#94a3b8'}}>
              {isArmed ? '⚡ ARMED — Motors Running' : '🔴 DISARMED'}
            </span>
          </div>
        </Popup>
      </Marker>

      {/* Flight trail */}
      {trail.length > 1 && (
        <Polyline positions={trail} color="#a78bfa" weight={2.5} opacity={0.8} dashArray="5,5" />
      )}
    </>
  );
}


// ─────────────────────────────────────────────
// THREE.JS SCENE BUILDER
// ─────────────────────────────────────────────
function buildScene() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a1628, 80, 350);
  scene.background = new THREE.Color(0x0a1a2e);

  const ambient = new THREE.AmbientLight(0x334466, 0.8);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff8e0, 1.4);
  sun.position.set(60, 120, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 500;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -100;
  sun.shadow.camera.right = sun.shadow.camera.top = 100;
  scene.add(sun);

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400, 40, 40),
    new THREE.MeshLambertMaterial({ color: 0x1a3a2a })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const grid = new THREE.GridHelper(400, 80, 0x2d5a3d, 0x244d34);
  grid.position.y = 0.05;
  scene.add(grid);

  // Helipad
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 0.12, 32), new THREE.MeshLambertMaterial({ color: 0x2a2a3a }));
  pad.position.set(0, 0.06, 0);
  scene.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.25, 8, 48), new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.2, 0);
  scene.add(ring);

  const hMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
  const makeBox = (w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hMat);
    m.position.set(x, y, z);
    scene.add(m);
  };
  makeBox(0.6, 0.15, 4.5, -2, 0.22, 0);
  makeBox(0.6, 0.15, 4.5, 2, 0.22, 0);
  makeBox(4, 0.15, 0.6, 0, 0.22, 0);

  // Trees
  const treeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x5c3d1e });
  const treeLeafMat = new THREE.MeshLambertMaterial({ color: 0x1f5e2c });
  [[-40, -50], [40, -50], [-55, 20], [55, 25], [-30, 60], [30, 60], [-70, -20], [70, -15]].forEach(([x, z]) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 5, 6), treeTrunkMat);
    trunk.position.set(x, 2.5, z);
    scene.add(trunk);
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(4, 9, 6), treeLeafMat);
    leaves.position.set(x, 9, z);
    scene.add(leaves);
  });

  // Quadcopter
  const droneGroup = new THREE.Group();
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x1e2a3d });
  const accentMat = new THREE.MeshLambertMaterial({ color: 0x7c3aed });
  const motorMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

  // Body
  droneGroup.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 2.2), frameMat), { castShadow: true }));
  const topPlate = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 1.8), accentMat);
  topPlate.position.y = 0.3;
  droneGroup.add(topPlate);

  const propGroups = [];
  [{ x: 5.5, z: -5.5, cw: true }, { x: 5.5, z: 5.5, cw: false }, { x: -5.5, z: 5.5, cw: true }, { x: -5.5, z: -5.5, cw: false }].forEach(({ x, z, cw }) => {
    // Arm
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 6, 6), frameMat);
    arm.position.set(x / 2, 0, z / 2);
    arm.lookAt(x, 0, z);
    arm.rotateX(Math.PI / 2);
    arm.position.set(x / 2, 0, z / 2);
    droneGroup.add(arm);

    // Motor
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.7, 10), motorMat);
    motor.position.set(x, 0.35, z);
    droneGroup.add(motor);

    // Prop group
    const propGroup = new THREE.Group();
    propGroup.position.set(x, 0.75, z);
    const propMat = new THREE.MeshLambertMaterial({ color: cw ? 0x475569 : 0x1d4ed8, transparent: true, opacity: 0.85 });
    propGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.08, 20), propMat));
    const bladeMat = new THREE.MeshLambertMaterial({ color: cw ? 0x334155 : 0x1e40af, transparent: true, opacity: 0.9 });
    [-1, 1].forEach((s) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.06, 0.55), bladeMat);
      b.rotation.y = s * Math.PI / 4;
      propGroup.add(b);
    });
    droneGroup.add(propGroup);
    propGroups.push({ group: propGroup, cw });
  });

  // LEDs
  const frontLed = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 2 }));
  frontLed.position.set(0, 0.3, 1.2);
  droneGroup.add(frontLed);
  const rearLed = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 2 }));
  rearLed.position.set(0, 0.3, -1.2);
  droneGroup.add(rearLed);

  droneGroup.position.set(0, 1.5, 0);
  scene.add(droneGroup);

  return { scene, droneGroup, propGroups };
}

// ─────────────────────────────────────────────
// SITL ARENA COMPONENT
// ─────────────────────────────────────────────
const CONTROL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);

export const SitlArenaTab = () => {
  const { addLog, allCalibrationsDone, triggerSafetyViolation } = useSimulator();
  const mountRef = useRef(null);
  const isFocusedRef = useRef(false); // true when 3D viewport is focused

  // Flight state refs (used inside rAF loop)
  const isArmedRef = useRef(false);
  const keysRef = useRef({});
  // GROUND_Y = 0.4 so drone sits naturally on helipad disc (frame bottom at ~0.15m)
  const GROUND_Y = 0.4;
  const posRef = useRef({ x: 0, y: GROUND_Y, z: 0 });   // start ON helipad
  const velRef = useRef({ x: 0, y: 0, z: 0 });
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const rollRef = useRef(0);
  const throttleRef = useRef(0);
  const propSpeedRef = useRef(0);
  const flightModeRef = useRef('STABILIZE');
  const GROUND_Y_REF = useRef(GROUND_Y); // accessible in rAF closure

  // React state for HUD & map — always init at UTU helipad position
  const [isArmed, setIsArmed] = useState(false);
  const [flightMode, setFlightMode] = useState('STABILIZE');
  const [hud, setHud] = useState({ alt: 0, spd: 0, hdg: 0, pitch: 0, roll: 0, thr: 0 });
  const [droneLat, setDroneLat] = useState(UTU_LAT);
  const [droneLng, setDroneLng] = useState(UTU_LNG);
  const [trail, setTrail] = useState([[UTU_LAT, UTU_LNG]]);
  const [activeView, setActiveView] = useState('split'); // '3d' | 'map' | 'split'

  // Three.js refs
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const droneRef = useRef(null);
  const propGroupsRef = useRef([]);
  const rafRef = useRef(null);

  // ── Initialize Three.js ──
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const W = container.clientWidth || 640;
    const H = container.clientHeight || 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const camera = new THREE.PerspectiveCamera(65, W / H, 0.1, 500);
    camera.position.set(0, 6, 18);
    cameraRef.current = camera;

    const { scene, droneGroup, propGroups } = buildScene();
    droneRef.current = droneGroup;
    propGroupsRef.current = propGroups;

    const clock = new THREE.Clock();
    let mapUpdateCounter = 0;
    let trailUpdateCounter = 0;
    const trailPoints = [[UTU_LAT, UTU_LNG]];

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const drone = droneRef.current;
      if (!drone) return;

      const armed = isArmedRef.current;
      const keys = keysRef.current;

      if (armed) {
        // Throttle: Up/Down arrows
        if (keys['ArrowUp']) throttleRef.current = Math.min(1, throttleRef.current + 2.2 * dt);
        if (keys['ArrowDown']) throttleRef.current = Math.max(0, throttleRef.current - 2.2 * dt);
        // Yaw: Left/Right arrows
        if (keys['ArrowLeft']) yawRef.current += 1.2 * dt;
        if (keys['ArrowRight']) yawRef.current -= 1.2 * dt;
        // Pitch: W/S
        const pitchTarget = keys['w'] || keys['W'] ? -0.28 : keys['s'] || keys['S'] ? 0.28 : 0;
        pitchRef.current += (pitchTarget - pitchRef.current) * 5 * dt;
        // Roll: A/D
        const rollTarget = keys['a'] || keys['A'] ? 0.22 : keys['d'] || keys['D'] ? -0.22 : 0;
        rollRef.current += (rollTarget - rollRef.current) * 5 * dt;

        // Physics
        const thrust = throttleRef.current * 18;
        velRef.current.y += (thrust - 9.8) * dt;
        velRef.current.y = Math.max(-15, Math.min(15, velRef.current.y));
        velRef.current.x = Math.sin(yawRef.current) * (-pitchRef.current) * 14 - Math.cos(yawRef.current) * rollRef.current * 8;
        velRef.current.z = Math.cos(yawRef.current) * (-pitchRef.current) * 14 + Math.sin(yawRef.current) * rollRef.current * 8;

        posRef.current.x += velRef.current.x * dt;
        posRef.current.z += velRef.current.z * dt;
        // Ground clamp: GROUND_Y so drone rests on helipad
        posRef.current.y = Math.max(GROUND_Y_REF.current, posRef.current.y + velRef.current.y * dt);
        if (posRef.current.y <= GROUND_Y_REF.current) { posRef.current.y = GROUND_Y_REF.current; velRef.current.y = 0; }

        propSpeedRef.current = 0.15 + throttleRef.current * 0.85;
        soundFx.updateMotorHum(throttleRef.current, true);

        // RTL auto-land
        if (flightModeRef.current === 'RTL') {
          const dx = -posRef.current.x, dz = -posRef.current.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 1) { posRef.current.x += dx * 0.5 * dt; posRef.current.z += dz * 0.5 * dt; }
          posRef.current.y = Math.max(GROUND_Y_REF.current, posRef.current.y - 4 * dt);
          if (posRef.current.y <= GROUND_Y_REF.current && dist < 2) {
            isArmedRef.current = false;
            setIsArmed(false);
            soundFx.playDisarmTone();
            addLog('INFO', 'RTL: Landed at home position. Auto-disarmed.');
          }
        }
      } else {
        velRef.current.x *= 0.8;
        velRef.current.z *= 0.8;
        velRef.current.y = Math.max(0, velRef.current.y - 15 * dt);
        posRef.current.y = Math.max(GROUND_Y_REF.current, posRef.current.y + velRef.current.y * dt);
        pitchRef.current *= 0.9;
        rollRef.current *= 0.9;
        throttleRef.current = Math.max(0, throttleRef.current - 2 * dt);
        propSpeedRef.current = throttleRef.current * 0.5;
        soundFx.updateMotorHum(0, false);
      }

      // Apply drone transforms
      drone.position.set(posRef.current.x, posRef.current.y, posRef.current.z);
      drone.rotation.y = yawRef.current;
      drone.rotation.x = pitchRef.current;
      drone.rotation.z = rollRef.current;

      // Spin props
      propGroupsRef.current.forEach(({ group, cw }) => {
        group.rotation.y += propSpeedRef.current * (cw ? 1 : -1);
      });

      // Camera follow drone (smooth orbit behind)
      const camOffset = new THREE.Vector3(
        Math.sin(yawRef.current) * -14, 6, Math.cos(yawRef.current) * -14
      );
      camera.position.lerp(
        new THREE.Vector3(posRef.current.x + camOffset.x, posRef.current.y + camOffset.y, posRef.current.z + camOffset.z),
        0.05
      );
      camera.lookAt(posRef.current.x, posRef.current.y, posRef.current.z);
      renderer.render(scene, camera);

      // Update map coords every 6 frames
      mapUpdateCounter++;
      if (mapUpdateCounter >= 6) {
        mapUpdateCounter = 0;
        const meters_x = posRef.current.x * METERS_PER_UNIT;
        const meters_z = -posRef.current.z * METERS_PER_UNIT; // negative Z = north
        const newLat = UTU_LAT + meters_z * DEG_PER_METER_LAT;
        const newLng = UTU_LNG + meters_x * DEG_PER_METER_LNG;
        setDroneLat(newLat);
        setDroneLng(newLng);

        // Trail every 30 frames
        trailUpdateCounter++;
        if (trailUpdateCounter >= 5 && armed) {
          trailUpdateCounter = 0;
          trailPoints.push([newLat, newLng]);
          if (trailPoints.length > 80) trailPoints.shift();
          setTrail([...trailPoints]);
        }

        // HUD update: altitude relative to ground (subtract GROUND_Y)
        const vel = velRef.current;
        const spd = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
        const hdg = ((yawRef.current * 180 / Math.PI) % 360 + 360) % 360;
        setHud({
          alt: Math.max(0, posRef.current.y - GROUND_Y_REF.current).toFixed(1),
          spd: spd.toFixed(1),
          hdg: hdg.toFixed(0),
          pitch: (pitchRef.current * 180 / Math.PI).toFixed(1),
          roll: (rollRef.current * 180 / Math.PI).toFixed(1),
          thr: Math.round(throttleRef.current * 100),
        });
      }
    };

    animate();

    const onResize = () => {
      const W2 = container.clientWidth || 640;
      const H2 = container.clientHeight || 400;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      
      // ✅ Explicitly dispose geometries, materials, and textures to prevent WebGL memory leaks
      scene.traverse((object) => {
        if (object.isMesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => disposeMaterial(mat));
            } else {
              disposeMaterial(object.material);
            }
          }
        }
      });
      
      function disposeMaterial(mat) {
        mat.dispose();
        if (mat.map) mat.map.dispose();
        if (mat.lightMap) mat.lightMap.dispose();
        if (mat.bumpMap) mat.bumpMap.dispose();
        if (mat.normalMap) mat.normalMap.dispose();
        if (mat.specularMap) mat.specularMap.dispose();
        if (mat.envMap) mat.envMap.dispose();
      }

      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  // ── Keyboard controls — prevent page scroll for arrow keys ──
  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key] = true;
      if (CONTROL_KEYS.has(e.key)) {
        e.preventDefault();
      }
    };
    const up = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', down, { passive: false });
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // ✅ SAFETY INTERLOCK: Bypassing UI restrictions to force tab open
  useEffect(() => {
    if (!allCalibrationsDone) {
      triggerSafetyViolation('UNAUTHORIZED ACCESS: FLIGHT ATTEMPTED BEFORE MANDATORY CALIBRATIONS COMPLETED');
    }
  }, [allCalibrationsDone, triggerSafetyViolation]);

  if (!allCalibrationsDone) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-slate-950/80 rounded-xl border-2 border-red-600/50 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
        <div className="text-red-500 font-bold text-3xl mb-4 text-center">🚨 FATAL SAFETY INTERLOCK 🚨</div>
        <div className="text-slate-300 font-mono text-center max-w-lg mb-6">
          System detected an unauthorized attempt to enter the Flight Controller SITL Arena while hardware calibrations are incomplete. This violates basic aviation safety principles.
        </div>
        <div className="text-slate-500 text-sm">Please return to the Virtual Bench and complete all mandatory steps.</div>
      </div>
    );
  }

  const toggleArm = useCallback(() => {
    if (isArmedRef.current) {
      isArmedRef.current = false;
      setIsArmed(false);
      throttleRef.current = 0;
      soundFx.playDisarmTone();
      addLog('INFO', 'DISARMED: Motors stopped.');
    } else {
      isArmedRef.current = true;
      setIsArmed(true);
      soundFx.playArmingTone();
      addLog('SUCCESS', 'ARMED: ArduCopter 3D SITL — flying over UTU Bardoli campus!');
    }
  }, [addLog]);

  const handleModeChange = (mode) => {
    setFlightMode(mode);
    flightModeRef.current = mode;
    addLog('INFO', `Flight mode changed to ${mode}.`);
  };

  const handleRTL = () => {
    handleModeChange('RTL');
    addLog('INFO', 'RTL activated — drone returning to UTU helipad.');
  };

  return (
    <div className="space-y-4 font-mono select-none">
      {/* Header bar */}
      <div className="gcs-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Layers className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-slate-100 tracking-wider">
              3D SITL FLIGHT ARENA — UTU BARDOLI CAMPUS
            </h2>
            <span className="px-2 py-0.5 text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 rounded-full">
              Three.js + Leaflet
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            ↑↓ Throttle&nbsp;·&nbsp;←→ Yaw&nbsp;·&nbsp;W/S Pitch&nbsp;·&nbsp;A/D Roll — Arrow keys won't scroll the page
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex bg-slate-900 border border-slate-700 rounded-lg overflow-hidden text-[10px] font-bold">
            {['3d', 'split', 'map'].map((v) => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                className={`px-2.5 py-1.5 transition-all ${activeView === v ? 'bg-purple-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {v === '3d' ? '3D ONLY' : v === 'split' ? 'SPLIT' : 'MAP'}
              </button>
            ))}
          </div>

          <select
            value={flightMode}
            onChange={(e) => handleModeChange(e.target.value)}
            className="bg-slate-900 text-purple-300 text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-700 focus:outline-none"
          >
            <option value="STABILIZE">STABILIZE</option>
            <option value="ALT_HOLD">ALT_HOLD</option>
            <option value="LOITER">LOITER</option>
            <option value="RTL">RTL</option>
          </select>

          <button
            onClick={handleRTL}
            className="px-3 py-1.5 rounded-lg font-bold text-xs bg-amber-700 hover:bg-amber-600 text-white flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> RTL
          </button>

          <button
            onClick={toggleArm}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
              isArmed ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-700 hover:bg-red-600 text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            {isArmed ? '⚡ ARMED' : 'ARM VEHICLE'}
          </button>
        </div>
      </div>

      {/* Main viewport area */}
      <div className={`grid gap-4 ${activeView === 'split' ? 'grid-cols-2' : 'grid-cols-1'}`}
           style={{ height: activeView === 'split' ? 480 : 520 }}>

        {/* ── 3D Viewport ── */}
        {(activeView === '3d' || activeView === 'split') && (
          <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
            <div ref={mountRef} className="w-full h-full" />

            {/* HUD: Top center — mode status */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2">
              <div className={`px-3 py-1 rounded-lg font-bold text-xs border ${
                isArmed ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-slate-950/80 border-slate-700 text-slate-400'
              }`}>
                {isArmed ? `⚡ ARMED — ${flightMode}` : `DISARMED — ${flightMode}`}
              </div>
            </div>

            {/* HUD: Top left — altitude */}
            <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-[11px] space-y-0.5">
              <div className="text-slate-400 text-[9px] uppercase tracking-widest">Altitude</div>
              <div className="text-emerald-400 font-bold text-lg leading-none">{hud.alt} m</div>
              <div className="text-slate-400 text-[9px]">Speed: <span className="text-cyan-300">{hud.spd} m/s</span></div>
            </div>

            {/* HUD: Top right — heading + GPS */}
            <div className="absolute top-3 right-3 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-[11px] text-right space-y-0.5">
              <div className="text-slate-400 text-[9px] uppercase tracking-widest">Heading</div>
              <div className="text-purple-300 font-bold text-lg leading-none">{hud.hdg}°</div>
              <div className="text-amber-400 text-[9px]">14.8V · 3D Fix</div>
            </div>

            {/* Artificial horizon crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-28 h-28 relative" style={{ transform: `rotate(${hud.roll}deg)` }}>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400 opacity-70" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400 opacity-70" />
                <div className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400" />
                <div className="absolute top-1/2 left-4 w-6 h-0.5 bg-cyan-400 -translate-y-1/2" />
                <div className="absolute top-1/2 right-4 w-6 h-0.5 bg-cyan-400 -translate-y-1/2" />
              </div>
            </div>

            {/* HUD: Bottom — throttle + attitude */}
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 flex items-center gap-2">
                <div className="text-[9px] text-slate-400 uppercase">THR</div>
                <div className="w-24 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
                  <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-75" style={{ width: `${hud.thr}%` }} />
                </div>
                <div className="text-emerald-400 font-bold text-xs w-6 text-right">{hud.thr}%</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] flex gap-3">
                <div className="text-center">
                  <div className="text-slate-500 text-[9px]">Pitch</div>
                  <div className="text-cyan-300 font-bold">{hud.pitch}°</div>
                </div>
                <div className="text-center">
                  <div className="text-slate-500 text-[9px]">Roll</div>
                  <div className="text-purple-300 font-bold">{hud.roll}°</div>
                </div>
              </div>
            </div>

            {/* Keyboard hint when disarmed */}
            {!isArmed && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-slate-950/85 border border-slate-700 rounded-xl px-8 py-4 text-center">
                  <div className="text-slate-200 font-bold text-sm mb-1">ARM the vehicle to start flying</div>
                  <div className="text-slate-500 text-xs">↑↓ Throttle&nbsp; ←→ Yaw&nbsp; W/S Pitch&nbsp; A/D Roll</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Leaflet Map ── */}
        {(activeView === 'map' || activeView === 'split') && (
          <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl" style={{ zIndex: 0 }}>
            {/* Map label */}
            <div className="absolute top-2 left-2 z-[999] bg-slate-950/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[10px] font-mono flex items-center gap-1.5">
              <Map className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-bold">LIVE GPS MAP</span>
              <span className="text-slate-500">— UTU Maliba Campus (21.0686°N, 73.1329°E)</span>
            </div>

            {/* Lat/Lng readout */}
            <div className="absolute bottom-2 left-2 z-[999] bg-slate-950/90 border border-slate-700 rounded-lg px-2.5 py-1 text-[10px] font-mono space-y-0.5">
              <div className="text-cyan-300">Lat: {droneLat.toFixed(5)}° N</div>
              <div className="text-purple-300">Lng: {droneLng.toFixed(5)}° E</div>
              <div className="text-amber-300">Alt: {hud.alt} m AGL</div>
            </div>

            <MapContainer
              center={[UTU_LAT, UTU_LNG]}
              zoom={16}
              style={{ width: '100%', height: '100%' }}
              zoomControl={true}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <DroneMapMarker lat={droneLat} lng={droneLng} trail={trail} isArmed={isArmed} />
            </MapContainer>
          </div>
        )}
      </div>

      {/* Quick controls guide */}
      <div className="gcs-panel p-3 rounded-xl border border-slate-800">
        <div className="flex flex-wrap gap-4 items-center justify-center text-[10px] font-mono">
          {[
            ['↑', 'Throttle Up'],
            ['↓', 'Throttle Down'],
            ['←', 'Yaw Left'],
            ['→', 'Yaw Right'],
            ['W', 'Fly Forward'],
            ['S', 'Fly Back'],
            ['A', 'Roll Left'],
            ['D', 'Roll Right'],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <kbd className="bg-slate-800 border border-slate-600 text-slate-200 px-2 py-0.5 rounded text-[10px] font-bold min-w-[26px] text-center shadow">
                {key}
              </kbd>
              <span className="text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
