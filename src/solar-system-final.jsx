import React, { useRef, useState, Suspense, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

// --- CONFIG ---
const ORBIT_SPEED_MULTIPLIER = 0.2; // Adjust to make planets faster/slower
const CAM_RESET_POS = [0, 60, 120];

// --- PLANET DATA (Scaled for Visuals) ---
const PLANETS = [
  { name: "Mercury", color: "#A5A5A5", dist: 30, size: 0.8, speed: 4.7 },
  { name: "Venus", color: "#E6C288", dist: 45, size: 1.5, speed: 3.5 },
  { name: "Earth", color: "#4F81BD", dist: 60, size: 1.6, speed: 2.9 },
  { name: "Mars", color: "#C0504D", dist: 80, size: 1.0, speed: 2.4 },
  { name: "Jupiter", color: "#D8CA9D", dist: 110, size: 4.0, speed: 1.3 },
  { name: "Saturn", color: "#F4D03F", dist: 150, size: 3.5, speed: 0.9 },
];

function MovingObject({ data, isSelected, onClick, isAsteroid = false }) {
  const meshRef = useRef();
  
  // Random start angle so they aren't all in a line
  const startAngle = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    
    // Orbital Math
    const t = clock.getElapsedTime() * ORBIT_SPEED_MULTIPLIER;
    
    // If asteroid, calculate specific orbit based on real data (scaled)
    // If planet, use static config
    const speed = isAsteroid ? (data.velocity_kph / 10000) : data.speed;
    const dist = isAsteroid ? (70 + (data.miss_distance_km / 1000000)) : data.dist;
    
    const angle = startAngle + (t * speed * 0.1);
    
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    
    meshRef.current.position.set(x, 0, z);
    
    // Rotate object itself
    meshRef.current.rotation.y += 0.01;

    // UPDATE DATA REF FOR CAMERA TRACKING
    // We attach the current position to the data object so the CameraController can find it
    data.currentPosition = meshRef.current.position; 
  });

  return (
    <group ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(data); }}>
      <mesh>
        {isAsteroid ? <dodecahedronGeometry args={[0.5, 0]} /> : <sphereGeometry args={[data.size, 32, 32]} />}
        <meshStandardMaterial 
          color={isAsteroid ? (data.hazard ? "#ff3333" : "#88cc88") : data.color} 
          emissive={isSelected ? "#00ffff" : "#000000"}
          emissiveIntensity={isSelected ? 2 : 0}
        />
      </mesh>
      {/* Floating Label */}
      {(isSelected || !isAsteroid) && (
        <Html distanceFactor={100} position={[0, 2, 0]} style={{ pointerEvents: 'none' }}>
           <div className="text-[10px] text-white font-mono bg-black/50 px-1 rounded border border-white/20">
             {data.name}
           </div>
        </Html>
      )}
      {/* Orbit Ring (Visual Aid) */}
      {!isAsteroid && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[data.dist - 0.1, data.dist + 0.1, 64]} />
            <meshBasicMaterial color="white" opacity={0.05} transparent />
        </mesh>
      )}
    </group>
  );
}

// --- CONTROLS THE CAMERA ---
function CameraController({ target }) {
  const { camera, controls } = useThree();
  const vec = new THREE.Vector3();

  useFrame(() => {
    if (target?.currentPosition) {
      // TRACKING MODE: Follow the target
      // Calculate a nice offset: 10 units up, 10 units back
      const targetPos = target.currentPosition;
      
      // Smoothly move controls target to object
      controls.target.lerp(targetPos, 0.1);
      
      // Smoothly move camera behind object
      vec.copy(targetPos).add(new THREE.Vector3(10, 15, 20));
      camera.position.lerp(vec, 0.05);
      
      controls.update();
    } else {
      // RESET MODE: Drift back to center
      // (Optional: You can leave this out if you want the user to manual control after reset)
    }
  });
  return null;
}

export default function SolarSystem({ liveFeedData, focusedAsteroidID, onClearFocus }) {
  const [target, setTarget] = useState(null);

  // Sync with Sidebar Selection
  useEffect(() => {
    if (focusedAsteroidID && liveFeedData) {
       const found = liveFeedData.find(a => a.id === focusedAsteroidID);
       if (found) setTarget(found);
    }
  }, [focusedAsteroidID, liveFeedData]);

  const handleObjectClick = (data) => {
    setTarget(data);
    // Tell parent (App.jsx) that we selected something, so it highlights in sidebar
    if (data.type === 'asteroid') {
        onClearFocus(data.id); 
    }
  };

  const handleReset = () => {
    setTarget(null);
    onClearFocus(null); // Clear sidebar selection
  };

  return (
    <div className="w-full h-full relative bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
      
      {/* OVERLAY UI */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
         <div className="bg-black/80 backdrop-blur p-3 rounded-lg border border-white/10 text-white w-40">
             <div className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-widest">Solar System</div>
             {PLANETS.map(p => (
                 <button key={p.name} onClick={() => handleObjectClick({...p, type: 'planet'})} className="block w-full text-left text-[10px] hover:text-blue-300 py-1 transition-colors">
                    • {p.name}
                 </button>
             ))}
         </div>
         <button onClick={handleReset} className="bg-red-600/80 text-white text-xs py-2 rounded-lg font-bold hover:bg-red-500 transition-colors">
            RESET VIEW
         </button>
      </div>

      <Canvas camera={{ position: CAM_RESET_POS, fov: 45 }}>
        <Suspense fallback={null}>
            <color attach="background" args={['#050505']} />
            <Stars radius={300} depth={50} count={5000} factor={4} fade />
            <ambientLight intensity={0.4} />
            <pointLight position={[0, 0, 0]} intensity={2} color="#FFD700" />

            {/* SUN */}
            <mesh>
                <sphereGeometry args={[4, 32, 32]} />
                <meshStandardMaterial emissive="#FFD700" emissiveIntensity={2} color="orange" />
            </mesh>

            {/* PLANETS */}
            {PLANETS.map((p, i) => (
                <MovingObject 
                    key={i} 
                    data={{...p, type: 'planet'}} 
                    isSelected={target?.name === p.name}
                    onClick={handleObjectClick} 
                />
            ))}

            {/* ASTEROIDS (From API) */}
            {liveFeedData && liveFeedData.map((ast) => (
                <MovingObject 
                    key={ast.id} 
                    data={ast} 
                    isAsteroid={true} 
                    isSelected={target?.id === ast.id}
                    onClick={handleObjectClick} 
                />
            ))}

            <CameraController target={target} />
            <OrbitControls enablePan={true} maxDistance={400} />
            
            <EffectComposer>
                <Bloom luminanceThreshold={0.5} intensity={1.5} radius={0.5} />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}