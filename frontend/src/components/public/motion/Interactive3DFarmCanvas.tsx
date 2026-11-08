// frontend/src/components/public/motion/Interactive3DFarmCanvas.tsx
import React, { useRef, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';

// ─── 3D Farm Terrain Component ───
const FarmTerrain: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate gentle agricultural elevation contours
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(30, 30, 48, 48);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Subtle natural agricultural slope
      const z = Math.sin(x * 0.2) * 0.4 + Math.cos(y * 0.25) * 0.3 + Math.sin((x + y) * 0.1) * 0.2;
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        color="#2d5a27"
        roughness={0.85}
        metalness={0.05}
        flatShading={false}
      />
    </mesh>
  );
};

// ─── Crop Sector Rows ───
const CropSector: React.FC<{
  position: [number, number, number];
  color: string;
  name: string;
  size: [number, number];
}> = ({ position, color, name, size }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      {/* Plot base */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[size[0], size[1]]} />
        <meshStandardMaterial
          color={hovered ? '#4ade80' : color}
          roughness={0.7}
        />
      </mesh>

      {/* Raised crop rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh
          key={i}
          position={[-size[0] / 2 + (i + 0.5) * (size[0] / 6), 0.15, 0]}
        >
          <boxGeometry args={[0.25, 0.2, size[1] * 0.9]} />
          <meshStandardMaterial color={hovered ? '#15803d' : '#166534'} />
        </mesh>
      ))}

      {hovered && (
        <Html position={[0, 1.2, 0]} center distanceFactor={18}>
          <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-[10px] font-bold font-mono whitespace-nowrap shadow-lg border border-emerald-400 backdrop-blur-xs">
            {name}
          </div>
        </Html>
      )}
    </group>
  );
};

// ─── On-Farm Shaded Storage Shed & Crates ───
const FarmStructures: React.FC = () => {
  return (
    <group position={[6, 0, -4]}>
      {/* Shed Foundation */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[4, 0.8, 3]} />
        <meshStandardMaterial color="#78716c" roughness={0.9} />
      </mesh>

      {/* Shed Pillars */}
      {[-1.8, 1.8].map((x, xi) =>
        [-1.3, 1.3].map((z, zi) => (
          <mesh key={`${xi}-${zi}`} position={[x, 1.4, z]}>
            <cylinderGeometry args={[0.08, 0.08, 1.4]} />
            <meshStandardMaterial color="#44403c" />
          </mesh>
        ))
      )}

      {/* Shaded Canopy Roof */}
      <mesh position={[0, 2.2, 0]} rotation={[0, 0, -0.05]}>
        <boxGeometry args={[4.4, 0.1, 3.4]} />
        <meshStandardMaterial color="#047857" roughness={0.5} />
      </mesh>

      {/* Plastic Harvesting Crate Stacks */}
      {[-0.8, 0, 0.8].map((cx, idx) => (
        <mesh key={idx} position={[cx, 0.9, 0.5]}>
          <boxGeometry args={[0.6, 0.5, 0.5]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
      ))}

      {/* Shed Label */}
      <Html position={[0, 2.8, 0]} center distanceFactor={20}>
        <div className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-200 text-[9px] font-bold border border-emerald-500/50 backdrop-blur-xs whitespace-nowrap">
          On-Farm Shaded Shed (2 MT)
        </div>
      </Html>
    </group>
  );
};

// ─── Interactive IoT Telemetry Sensor Node ───
const SensorPin: React.FC<{
  position: [number, number, number];
  name: string;
  moisture: string;
  temp: string;
}> = ({ position, name, moisture, temp }) => {
  const [active, setActive] = useState(true);

  return (
    <group position={position}>
      {/* Sensor Mast */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.4]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
      </mesh>

      {/* Sensor Beacon */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh position={[0, 1.5, 0]} onClick={() => setActive(!active)}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={0.6}
          />
        </mesh>
      </Float>

      {/* Floating Telemetry Badge */}
      <Html position={[0, 2.3, 0]} center distanceFactor={16}>
        <div
          onClick={() => setActive(!active)}
          className="p-2.5 rounded-xl bg-slate-900/95 text-white text-[10px] shadow-xl border border-emerald-500/80 backdrop-blur-md cursor-pointer hover:scale-105 transition-transform min-w-[140px]"
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-700/80">
            <span className="font-bold text-emerald-400 font-mono truncate">{name}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          </div>
          <div className="mt-1.5 space-y-0.5 font-mono">
            <div className="flex justify-between text-slate-300">
              <span>Soil Moist:</span>
              <span className="text-emerald-300 font-bold">{moisture}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Air Temp:</span>
              <span className="text-amber-300 font-bold">{temp}</span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};

// ─── Solar Pump Facility ───
const SolarPump: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Solar Panel Base */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 1]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      {/* Solar Panel */}
      <mesh position={[0, 1.1, 0]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[1.6, 0.05, 1.2]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.6} roughness={0.2} />
      </mesh>
      <Html position={[0, 1.8, 0]} center distanceFactor={22}>
        <div className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-200 text-[8px] font-bold border border-blue-500/40 whitespace-nowrap">
          Solar Drip Pump (5 HP)
        </div>
      </Html>
    </group>
  );
};

// ─── Main Canvas Scene ───
export const Interactive3DFarmCanvas: React.FC = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [14, 12, 16], fov: 38 }}
      className="w-full h-full cursor-grab active:cursor-grabbing"
    >
      <color attach="background" args={['#0a1811']} />
      
      {/* Ambient & Directional Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[18, 25, 12]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-10, 8, -10]} intensity={0.5} color="#4ade80" />

      {/* Orbit Controls with Damping */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        maxPolarAngle={Math.PI / 2.15}
        minPolarAngle={Math.PI / 6}
        maxDistance={35}
        minDistance={10}
        dampingFactor={0.05}
        autoRotate={false}
      />

      {/* Farm World */}
      <group position={[0, -1, 0]}>
        <FarmTerrain />

        {/* Plot 1: Tomato Abhinav Grade A */}
        <CropSector
          position={[-5, 0.01, 2]}
          size={[8, 10]}
          color="#1e3f20"
          name="Plot A: Tomato (Abhinav) • 2.0 Ac"
        />

        {/* Plot 2: Onion Garwa Summer Crop */}
        <CropSector
          position={[5, 0.01, 4]}
          size={[6, 8]}
          color="#224d24"
          name="Plot B: Onion (Garwa) • 1.5 Ac"
        />

        {/* Farm Infrastructure */}
        <FarmStructures />
        <SolarPump position={[-7, 0, -5]} />

        {/* Telemetry Sensor Pin */}
        <SensorPin
          position={[-5, 0.2, 2]}
          name="NODE-NSK-NIPHAD-01"
          moisture="38.5% (Optimal)"
          temp="28.2°C"
        />
      </group>
    </Canvas>
  );
};

export default Interactive3DFarmCanvas;

