import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function RotatingEarth() {
  const earthRef = useRef();

  // Make it spin slowly
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={earthRef} position={[0, 0, 0]}>
      {/* The Earth Sphere */}
      <sphereGeometry args={[2.5, 32, 32]} />
      <meshStandardMaterial 
        color="#4B9CD3" // Blue base
        roughness={0.7}
        metalness={0.1}
        wireframe={true} // Sci-fi Wireframe Look (Use 'false' for solid)
        emissive="#1E3A8A" // Glowing effect
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

export default function EarthViewer() {
  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
        
        {/* Background Stars */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
        
        {/* The Earth */}
        <RotatingEarth />
        
        {/* Mouse Controls */}
        <OrbitControls enableZoom={false} autoRotate={false} />
      </Canvas>
    </div>
  );
}