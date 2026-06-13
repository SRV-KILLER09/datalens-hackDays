"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function DataNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Create a perfect circular texture programmatically so particles are round, not square
  const circleTexture = useMemo(() => {
    if (typeof document === 'undefined') return null; // Handle SSR safely
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (context) {
      context.beginPath();
      context.arc(32, 32, 30, 0, Math.PI * 2);
      context.fillStyle = "white";
      context.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  // Generate random points in a highly organized, rounded concentric sphere pattern
  const count = 5000;
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    
    for (let i = 0; i < count; i++) {
      // Create 3 distinct spherical layers for a beautiful rounded depth effect
      let r;
      const layerRand = Math.random();
      if (layerRand > 0.8) {
        r = 14; // Outer sparse shell
      } else if (layerRand > 0.3) {
        r = 9;  // Mid dense shell
      } else {
        r = 4;  // Inner core
      }

      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Mix colors: emerald, cyan, and accent primary for DataLens
      const mix = Math.random();
      if (mix > 0.6) {
        color.set("#10b981"); // emerald
      } else if (mix > 0.2) {
        color.set("#06b6d4"); // cyan
      } else {
        color.set("#ffffff"); // white bright nodes
      }
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return [positions, colors];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Smooth interactive mouse reactivity
    // Math.PI / 4 gives a nice range of motion without spinning too far
    const targetX = (state.pointer.x * Math.PI) / 4;
    const targetY = (state.pointer.y * Math.PI) / 4;
    
    // Combine slow continuous rotation with mouse offset
    const desiredY = time * 0.03 + targetX;
    const desiredX = -targetY;

    // Use THREE.MathUtils.lerp for buttery smooth damping and momentum
    pointsRef.current.rotation.y = THREE.MathUtils.lerp(
      pointsRef.current.rotation.y,
      desiredY,
      0.015
    );
    pointsRef.current.rotation.x = THREE.MathUtils.lerp(
      pointsRef.current.rotation.x,
      desiredX,
      0.015
    );
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        map={circleTexture || undefined}
        alphaMap={circleTexture || undefined}
        alphaTest={0.01}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default function ThreeScene() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 18], fov: 60 }}>
        {/* Adds a fading fog towards the back to give depth */}
        <fog attach="fog" args={["#000000", 12, 30]} />
        <DataNetwork />
      </Canvas>
    </div>
  );
}
