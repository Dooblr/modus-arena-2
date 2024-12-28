import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

interface PickupProps {
  position: Vector3;
  type: 'health' | 'xp';
}

const Pickup = ({ position, type }: PickupProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    time.current += delta;
    groupRef.current.position.y = position.y + Math.sin(time.current * 2) * 0.1;
    groupRef.current.rotation.y += delta;
  });

  const color = type === 'health' ? '#ff4444' : '#4444ff';
  const emissive = type === 'health' ? '#ff0000' : '#0000ff';

  return (
    <group ref={groupRef} position={position}>
      {type === 'xp' ? (
        // Diamond shape for XP
        <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}>
          <octahedronGeometry args={[0.3]} />
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={2}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ) : (
        // Sphere for health
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={2}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}

      <pointLight
        color={color}
        intensity={1}
        distance={3}
        decay={2}
      />
    </group>
  );
};

export default Pickup; 