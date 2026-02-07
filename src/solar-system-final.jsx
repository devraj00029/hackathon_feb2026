import React, { useRef, useState, Suspense, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { X, Activity, Thermometer, Ruler, Zap, Globe, Orbit } from 'lucide-react';

// --- CONFIGURATION ---
const ORBIT_SPEED = 0.2; 

// --- PLANET DATA ---
const PLANETS = [
  { name: "Mercury", color: "#A5A5A5", dist: 30, size: 0.8, speed: 1.5, desc: "The Swift Planet", temp: "167°C" },
  { name: "Venus",   color: "#E6C288", dist: 45, size: 1.5, speed: 1.2, desc: "Morning Star", temp: "464°C" },
  { name: "Earth",   color: "#2E86C1", dist: 60, size: 1.6, speed: 1.0, desc: "The Blue Marble", temp: "15°C" },
  { name: "Mars",    color: "#C0504D", dist: 80, size: 1.0, speed: 0.8, desc: "The Red Planet", temp: "-65°C" },
  { name: "Jupiter", color: "#D8CA9D", dist: 110, size: 4.5, speed: 0.5, desc: "Gas Giant", temp: "-110°C" },
  { name: "Saturn",  color: "#F4D03F", dist: 140, size: 3.8, speed: 0.4, desc: "Ringed Planet", temp: "-140°C" },
  { name: "Uranus",  color: "#4FD0E6", dist: 170, size: 2.8, speed: 0.3, desc: "Ice Giant", temp: "-195°C" },
  { name: "Neptune", color: "#2E56C1", dist: 200, size: 2.7, speed: 0.2, desc: "The Windy Planet", temp: "-200°C" },
];

// --- ORBIT MATH (Deterministic) ---
const getOrbitPosition = (data, elapsedTime, startAngle, isAsteroid) => {
    const speed = isAsteroid ? (data.velocity_kph / 20000) : data.speed;
    const dist = isAsteroid ? (70 + (data.miss_distance_km / 1000000)) : data.dist;
    const angle = startAngle + (elapsedTime * speed * 0.1);
    return new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
};

// --- COMPONENTS ---

function Sun() {
  return (
    <mesh>
      <sphereGeometry args={[5, 64, 64]} />
      <meshStandardMaterial emissive="#FFD700" emissiveIntensity={3} color="#FDB813" toneMapped={false} />
      <pointLight intensity={2} distance={300} decay={1} color="#FFF" />
    </mesh>
  );
}

function OrbitPath({ radius }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.2, radius + 0.2, 128]} />
      <meshBasicMaterial color="#FFFFFF" opacity={0.03} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function MovingObject({ data, isSelected, onClick, isAsteroid = false, positionRef }) {
  const meshRef = useRef();
  const { camera } = useThree();
  
  const startAngle = useMemo(() => {
      const seed = data.id ? data.id.charCodeAt(0) : data.name.charCodeAt(0);
      return seed % 100;
  }, [data.name, data.id]);

  data.startAngle = startAngle;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const pos = getOrbitPosition(data, clock.getElapsedTime(), startAngle, isAsteroid);
    meshRef.current.position.copy(pos);
    meshRef.current.rotation.y += 0.005;
    
    // Store position for camera tracking
    if (positionRef) {
      positionRef.current.copy(pos);
    }
  });

  // --- ADAPTIVE LABEL SCALING BASED ON CAMERA DISTANCE ---
  const labelDistanceFactor = useMemo(() => {
    if (isAsteroid) return 25; // SMALLER value = smaller labels when zoomed
    return 120; // Larger for planets
  }, [isAsteroid]);

  // Calculate adaptive font size based on selection and type
  const getLabelStyle = () => {
    if (isAsteroid) {
      if (isSelected) {
        return "text-[4px] bg-blue-600/90 border-blue-400 text-white px-0.5 py-0.5 border";
      }
      return "text-[3px] bg-white/10 text-gray-400 px-0.5 py-0.5";
    }
    // Planets
    return "text-[11px] font-bold bg-black/50 border border-white/20 text-white px-2.5 py-1.5";
  };

  const yOffset = isAsteroid ? 1.8 : data.size + 2.5;

  return (
    <group ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(data); }}>
      <mesh>
        {isAsteroid ? <dodecahedronGeometry args={[0.6, 0]} /> : <sphereGeometry args={[data.size, 64, 64]} />}
        <meshStandardMaterial 
          color={isAsteroid ? (data.hazard ? "#FF3333" : "#55FF55") : data.color}
          emissive={isAsteroid ? (data.hazard ? "#FF0000" : "#00FF00") : data.color}
          emissiveIntensity={isSelected ? 2.0 : 0.5} 
          roughness={0.2}
          toneMapped={false} 
        />
      </mesh>
      
      {/* Selection Ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
           <ringGeometry args={[isAsteroid ? 1.2 : data.size + 1, isAsteroid ? 1.4 : data.size + 1.2, 64]} />
           <meshBasicMaterial color="cyan" side={THREE.DoubleSide} transparent opacity={0.5} />
        </mesh>
      )}

      {/* HTML LABEL - Fixed scaling */}
      <Html 
        distanceFactor={labelDistanceFactor} 
        position={[0, yOffset, 0]} 
        center 
        style={{ pointerEvents: 'none' }}
        zIndexRange={[0, 0]}
      >
         <div className={`rounded font-mono tracking-widest transition-all duration-300 backdrop-blur-sm whitespace-nowrap ${getLabelStyle()} ${isSelected ? 'shadow-lg' : ''}`}>
            {data.name}
         </div>
      </Html>
    </group>
  );
}

// --- SIMPLIFIED CAMERA MANAGER ---
function CameraManager({ target, targetPositionRef }) {
  const { camera, controls } = useThree();
  const initialTransitionDone = useRef(false);
  const previousTargetPos = useRef(new THREE.Vector3());

  useEffect(() => {
    // Reset when target changes
    initialTransitionDone.current = false;
    previousTargetPos.current.set(0, 0, 0);
  }, [target]);

  useFrame(() => {
    if (!controls) return;

    if (target && targetPositionRef?.current) {
      const currentTargetPos = targetPositionRef.current;

      if (!initialTransitionDone.current) {
        // === INITIAL FLY-TO ANIMATION ===
        const isAsteroid = target.type === 'asteroid';
        const zoomDist = isAsteroid ? 8 : (target.size * 3 + 12);
        const heightOffset = isAsteroid ? 4 : (target.size * 2 + 6);
        
        const desiredCamPos = currentTargetPos.clone().add(new THREE.Vector3(zoomDist, heightOffset, zoomDist));

        camera.position.lerp(desiredCamPos, 0.08);
        controls.target.lerp(currentTargetPos, 0.08);

        if (camera.position.distanceTo(desiredCamPos) < 0.5) {
          initialTransitionDone.current = true;
          previousTargetPos.current.copy(currentTargetPos);
          console.log("✅ Transition complete - camera is FREE, only target will move");
        }
      } else {
        // === TRACKING MODE: MOVE BOTH CAMERA AND TARGET BY SAME DELTA ===
        // Calculate how much the target moved
        const delta = currentTargetPos.clone().sub(previousTargetPos.current);
        
        // Move BOTH camera and target by same amount
        // This keeps your relative position unchanged
        camera.position.add(delta);
        controls.target.add(delta);
        
        // Store new position for next frame
        previousTargetPos.current.copy(currentTargetPos);
      }
    } else {
      // === NO TARGET: RESET TO OVERVIEW ===
      const overviewPos = new THREE.Vector3(0, 80, 140);
      const sunPos = new THREE.Vector3(0, 0, 0);
      
      if (camera.position.distanceTo(overviewPos) > 2) {
        camera.position.lerp(overviewPos, 0.06);
        controls.target.lerp(sunPos, 0.06);
      }
    }
  });
  
  return null;
}

// --- MAIN COMPONENT ---
export default function SolarSystem({ liveFeedData, focusedAsteroidID, onClearFocus }) {
  const [target, setTarget] = useState(null);
  const targetPositionRef = useRef(new THREE.Vector3());

  useEffect(() => {
    if (focusedAsteroidID && liveFeedData) {
      const found = liveFeedData.find(a => a.id === focusedAsteroidID);
      if (found) {
          found.type = 'asteroid'; 
          found.size = 0.5; 
          setTarget(found);
      }
    }
  }, [focusedAsteroidID, liveFeedData]);

  const handleSelect = (data) => {
    setTarget(data);
  };

  const handleReset = () => {
    setTarget(null);
    onClearFocus(null);
  };

  return (
    <div className="w-full h-full relative bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      
      {/* 1. PLANET MENU (Top Left) */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
         <div className="bg-black/60 backdrop-blur border border-white/10 p-2 rounded-lg w-36 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="text-[10px] font-bold text-blue-400 mb-1 px-2 flex items-center gap-2"><Globe size={10}/> SYSTEM</div>
            {PLANETS.map(p => (
                <button key={p.name} onClick={() => handleSelect({...p, type: 'planet'})} className="block w-full text-left px-2 py-1.5 text-[10px] text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors border-b border-white/5 last:border-0">
                    {p.name}
                </button>
            ))}
         </div>
         {target && (
             <button onClick={handleReset} className="bg-red-600/90 text-white text-[10px] font-bold py-2 rounded hover:bg-red-500 transition-colors shadow-lg animate-in fade-in flex items-center justify-center gap-2">
                <Orbit size={12}/> RESET VIEW
             </button>
         )}
      </div>

      {/* 2. DETAILS PANEL (Bottom Right) - ONLY SHOWS WHEN SELECTED */}
      {target && (
         <div className="absolute bottom-6 right-6 z-20 w-80 bg-[#0B0D17]/90 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-10 duration-500">
             <button onClick={handleReset} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"><X size={16}/></button>
             
             {/* Header */}
             <div className="mb-4">
                 <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${target.type === 'asteroid' ? (target.risk > 50 ? 'bg-red-500 animate-pulse' : 'bg-green-500') : 'bg-blue-500'}`}></div>
                    <span className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">
                        {target.type === 'planet' ? 'PLANETARY BODY' : 'NEAR-EARTH OBJECT'}
                    </span>
                 </div>
                 <h2 className="text-3xl font-bold text-white tracking-tight">{target.name}</h2>
             </div>

             {/* Stats Grid */}
             <div className="grid grid-cols-2 gap-3 mb-4">
                 <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                     <div className="text-[9px] text-gray-400 flex items-center gap-1 mb-1"><Activity size={10}/> VELOCITY</div>
                     <div className="text-sm font-mono font-bold text-white">
                        {target.velocity_kph ? parseInt(target.velocity_kph).toLocaleString() : (target.speed * 10000).toLocaleString()} 
                        <span className="text-[9px] text-gray-500 ml-1">km/h</span>
                     </div>
                 </div>
                 <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                     <div className="text-[9px] text-gray-400 flex items-center gap-1 mb-1"><Ruler size={10}/> DIAMETER</div>
                     <div className="text-sm font-mono font-bold text-white">
                        {target.diameter_max ? Math.round(target.diameter_max).toLocaleString() : (target.size * 1000).toLocaleString()} 
                        <span className="text-[9px] text-gray-500 ml-1">km</span>
                     </div>
                 </div>
                 <div className="bg-white/5 p-2 rounded-lg border border-white/5 col-span-2">
                     <div className="text-[9px] text-gray-400 flex items-center gap-1 mb-1"><Thermometer size={10}/> SURFACE TEMP</div>
                     <div className="text-sm font-mono font-bold text-white">{target.temp || "Unknown / Varied"}</div>
                 </div>
             </div>
             
             {/* Risk Bar (Asteroids Only) */}
             {target.type === 'asteroid' && (
                 <div className="pt-3 border-t border-white/10">
                     <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-1 text-xs font-bold text-gray-300">
                             <Zap size={12} className={target.risk > 50 ? "text-red-500" : "text-green-500"} /> THREAT LEVEL
                         </div>
                         <span className={`text-[10px] font-bold ${target.risk > 50 ? "text-red-400" : "text-green-400"}`}>{target.risk}% PROBABILITY</span>
                     </div>
                     <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                         <div 
                            className={`h-full transition-all duration-1000 ${target.risk > 50 ? "bg-red-500 shadow-[0_0_10px_red]" : "bg-green-500 shadow-[0_0_10px_green]"}`} 
                            style={{width: `${target.risk}%`}}
                         ></div>
                     </div>
                 </div>
             )}
         </div>
      )}

      {/* 3D SCENE */}
      <Canvas camera={{ position: [0, 80, 140], fov: 45 }}>
        <Suspense fallback={null}>
          <color attach="background" args={['#020202']} />
          <Stars radius={200} depth={50} count={6000} factor={4} fade />
          
          <ambientLight intensity={1.5} /> 
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          <Sun />

          {/* Render Planets */}
          {PLANETS.map((p, i) => (
             <group key={i}>
                <OrbitPath radius={p.dist} />
                <MovingObject 
                  data={{...p, type: 'planet'}} 
                  isSelected={target?.name === p.name} 
                  onClick={handleSelect}
                  positionRef={target?.name === p.name ? targetPositionRef : null}
                />
             </group>
          ))}

          {/* Render Asteroids */}
          {liveFeedData && liveFeedData.map((ast) => (
             <MovingObject 
                key={ast.id} 
                data={ast} 
                isAsteroid={true} 
                isSelected={target?.id === ast.id} 
                onClick={handleSelect}
                positionRef={target?.id === ast.id ? targetPositionRef : null}
             />
          ))}

          <CameraManager target={target} targetPositionRef={targetPositionRef} />
          
          <EffectComposer>
            <Bloom luminanceThreshold={0.1} intensity={1.5} radius={0.5} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>

          {/* OrbitControls - Full manual control */}
          <OrbitControls 
            makeDefault
            enableRotate={true}
            enableZoom={true}
            enablePan={true} 
            enableDamping={true}
            dampingFactor={0.05}
            rotateSpeed={0.8}
            zoomSpeed={1.2}
            panSpeed={0.8}
            screenSpacePanning={true}
            maxDistance={400} 
            minDistance={1}
            mouseButtons={{
              LEFT: 0,   // rotate
              MIDDLE: 1, // zoom
              RIGHT: 2   // pan
            }}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}