import { Canvas, useFrame } from '@react-three/fiber'
import { PointerLockControls, Box } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import { Vector3 } from 'three'
import './App.scss'
import * as THREE from 'three'
import {
  PROJECTILE_SPEED,
  PROJECTILE_RADIUS,
  PROJECTILE_MAX_DISTANCE,
  PROJECTILE_LIFETIME,
  PLAYER_HEIGHT,
  MOVEMENT_SPEED,
  MOVEMENT_ACCELERATION,
  MOVEMENT_DECELERATION,
  GRAVITY,
  JUMP_FORCE,
  GROUND_LEVEL,
  PLAYER_RADIUS,
  PLAYER_MAX_HEALTH,
  PLAYER_INVULNERABILITY_TIME,
  ENEMY_SPEED,
  ENEMY_SIZE,
  ENEMY_SPAWN_INTERVAL,
  ENEMY_DAMAGE,
  KNOCKBACK_FORCE,
  ROOM_SIZE,
  ROOM_HEIGHT,
  WALL_SEGMENTS,
  WALL_PANEL_SIZE,
  WALL_DEPTH,
  PARTICLE_COUNT,
  PARTICLE_LIFETIME,
  PARTICLE_SPEED,
  PARTICLE_COLORS,
  AIR_CONTROL,
  MAX_FALL_SPEED,
  JUMP_COOLDOWN,
  DOUBLE_JUMP_FORCE
} from './constants'
import PauseScreen from './components/PauseScreen'
import { useGameStore } from './store/gameStore'
import Pickup from './components/Pickup'
import HUD from './components/HUD'

type Projectile = {
  id: number
  position: Vector3
  direction: Vector3
  createdAt: number
}

type Enemy = {
  id: number
  position: Vector3
  health: number
  createdAt: number
  lastHitTime?: number
}

type Particle = {
  id: number
  position: Vector3
  velocity: Vector3
  color: string
  scale: number
  lifetime: number
  createdAt: number
}

// Add texture creation
const wallTexture = new THREE.TextureLoader().load('/grid.png')
wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping
wallTexture.repeat.set(4, 2)

function ProjectileObject({ position, direction, velocity, radius, onHit, enemies }: { position: Vector3, direction: Vector3, velocity: number, radius: number, onHit: (position: Vector3) => void, enemies: Enemy[] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.position.add(
      direction.clone().multiplyScalar(velocity * delta)
    )
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.05]} />
      <meshBasicMaterial color="#ff0" />
    </mesh>
  )
}

function EnemyObject({ position, health, lastHitTime }: { 
  position: Vector3,
  health: number,
  lastHitTime?: number 
}) {
  const isFlashing = lastHitTime && performance.now() - lastHitTime < 150;

  return (
    <group position={position}>
      {/* Main enemy mesh */}
      <mesh>
        <boxGeometry args={[ENEMY_SIZE, ENEMY_SIZE, ENEMY_SIZE]} />
        <meshStandardMaterial 
          color={isFlashing ? '#ffffff' : '#ff4444'}
          emissive={isFlashing ? '#ffffff' : '#ff0000'}
          emissiveIntensity={isFlashing ? 3 : 0.3}
          toneMapped={false}
        />
      </mesh>

      {/* Collision wireframe */}
      <mesh>
        <boxGeometry args={[ENEMY_SIZE, ENEMY_SIZE, ENEMY_SIZE]} />
        <meshBasicMaterial 
          color="#00ff00"
          wireframe
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Flash light effect */}
      {isFlashing && (
        <pointLight
          color="#ffffff"
          intensity={3}
          distance={3}
          decay={2}
        />
      )}
    </group>
  )
}

function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial 
          color="#2244ff"
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT, 0]} receiveShadow>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial 
          color="#1a1a3a"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Enhanced Walls */}
      {[
        { position: [0, ROOM_HEIGHT/2, ROOM_SIZE/2], rotation: [0, 0, 0] },
        { position: [0, ROOM_HEIGHT/2, -ROOM_SIZE/2], rotation: [0, Math.PI, 0] },
        { position: [ROOM_SIZE/2, ROOM_HEIGHT/2, 0], rotation: [0, -Math.PI/2, 0] },
        { position: [-ROOM_SIZE/2, ROOM_HEIGHT/2, 0], rotation: [0, Math.PI/2, 0] }
      ].map((wall, index) => (
        <group key={index} position={wall.position} rotation={wall.rotation}>
          {/* Main wall surface */}
          <mesh receiveShadow castShadow>
            <planeGeometry args={[ROOM_SIZE, ROOM_HEIGHT, WALL_SEGMENTS, WALL_SEGMENTS]} />
            <meshStandardMaterial
              color="#334466"
              metalness={0.4}
              roughness={0.6}
              map={wallTexture}
              normalScale={[0.2, 0.2]}
              aoMapIntensity={0.5}
            />
          </mesh>

          {/* Wall panels for depth */}
          {Array.from({ length: Math.floor(ROOM_SIZE/WALL_PANEL_SIZE) }).map((_, i) =>
            Array.from({ length: Math.floor(ROOM_HEIGHT/WALL_PANEL_SIZE) }).map((_, j) => (
              <mesh
                key={`panel-${i}-${j}`}
                position={[
                  (i * WALL_PANEL_SIZE) - (ROOM_SIZE/2) + (WALL_PANEL_SIZE/2),
                  (j * WALL_PANEL_SIZE) - (ROOM_HEIGHT/2) + (WALL_PANEL_SIZE/2),
                  -WALL_DEPTH/2
                ]}
                castShadow
              >
                <boxGeometry args={[WALL_PANEL_SIZE * 0.95, WALL_PANEL_SIZE * 0.95, WALL_DEPTH]} />
                <meshStandardMaterial
                  color="#2a3855"
                  metalness={0.6}
                  roughness={0.3}
                />
              </mesh>
            ))
          )}
        </group>
      ))}

      {/* Enhanced accent lighting strips */}
      {[0, 90, 180, 270].map((rotation, index) => (
        <group key={index} rotation={[0, rotation * Math.PI/180, 0]}>
          <mesh position={[ROOM_SIZE/2 - 0.1, ROOM_HEIGHT - 0.5, 0]}>
            <boxGeometry args={[0.1, 0.1, ROOM_SIZE]} />
            <meshBasicMaterial color="#88aaff" />
          </mesh>
          <pointLight
            position={[ROOM_SIZE/2 - 0.2, ROOM_HEIGHT - 0.5, 0]}
            intensity={1.0}
            distance={15}
            color="#88aaff"
          />
        </group>
      ))}

      {/* Enhanced central light */}
      <pointLight
        position={[0, ROOM_HEIGHT - 1, 0]}
        intensity={1.2}
        distance={ROOM_SIZE * 2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Additional ambient light for better overall visibility */}
      <ambientLight intensity={0.4} />

      {/* Add some colored rim lights for atmosphere */}
      <pointLight
        position={[ROOM_SIZE/2, 1, ROOM_SIZE/2]}
        intensity={0.5}
        distance={8}
        color="#ff4444"
      />
      <pointLight
        position={[-ROOM_SIZE/2, 1, -ROOM_SIZE/2]}
        intensity={0.5}
        distance={8}
        color="#4444ff"
      />
    </group>
  )
}

function ExplosionParticle({ position, velocity, color, scale }: Particle) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.position.add(velocity.clone().multiplyScalar(delta))
    meshRef.current.rotation.x += delta * 5
    meshRef.current.rotation.y += delta * 5
  })

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[scale, scale, scale]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  )
}

function App() {
  const { 
    health, 
    maxHealth, 
    pickups,
    xp,
    level,
    takeDamage, 
    addPickup, 
    removePickup,
    heal,
    addXP 
  } = useGameStore();

  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const [projectileId, setProjectileId] = useState(0)
  const controlsRef = useRef<any>(null)
  const [isLocked, setIsLocked] = useState(false)
  const playerPos = useRef(new Vector3(0, 2, 5))
  const currentVelocity = useRef(new Vector3())
  const targetVelocity = useRef(new Vector3())
  const verticalVelocity = useRef(0)
  const isGrounded = useRef(true)
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [enemyId, setEnemyId] = useState(0)
  const [playerHealth, setPlayerHealth] = useState(PLAYER_MAX_HEALTH)
  const lastHitTime = useRef(0)
  const knockbackVelocity = useRef(new Vector3())
  const [particles, setParticles] = useState<Particle[]>([])
  const particleId = useRef(0)
  const lastJumpTime = useRef(0)
  const hasDoubleJump = useRef(true)
  const [isPaused, setIsPaused] = useState(false)

  const clampPosition = (position: Vector3) => {
    const halfRoom = ROOM_SIZE / 2 - 0.5 // 0.5 margin to prevent touching walls
    position.x = Math.max(-halfRoom, Math.min(halfRoom, position.x))
    position.z = Math.max(-halfRoom, Math.min(halfRoom, position.z))
    position.y = Math.max(0.1, Math.min(ROOM_HEIGHT - 0.1, position.y)) // Keep within floor and ceiling
    return position
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLocked) return
      
      switch (e.code) {
        case 'KeyW':
          targetVelocity.current.z = MOVEMENT_SPEED
          break
        case 'KeyS':
          targetVelocity.current.z = -MOVEMENT_SPEED
          break
        case 'KeyA':
          targetVelocity.current.x = -MOVEMENT_SPEED
          break
        case 'KeyD':
          targetVelocity.current.x = MOVEMENT_SPEED
          break
        case 'Space':
          handleJump()
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isLocked) return
      
      switch (e.code) {
        case 'KeyW':
        case 'KeyS':
          targetVelocity.current.z = 0
          break
        case 'KeyA':
        case 'KeyD':
          targetVelocity.current.x = 0
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isLocked])

  useEffect(() => {
    const handleShoot = () => {
      if (!isLocked || isPaused) return

      const camera = controlsRef.current.getObject()
      const direction = new Vector3()
      camera.getWorldDirection(direction)

      setProjectiles(prev => [...prev, {
        id: projectileId,
        position: playerPos.current.clone().add(direction.clone().multiplyScalar(0.5)),
        direction: direction,
        createdAt: performance.now()
      }])
      setProjectileId(prev => prev + 1)
    }

    document.addEventListener('click', handleShoot)
    return () => document.removeEventListener('click', handleShoot)
  }, [isLocked, isPaused, projectileId])

  // Add function to create explosion
  const createExplosion = (position: Vector3) => {
    const newParticles: Particle[] = []
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Random direction
      const angle = (Math.random() * Math.PI * 2)
      const upwardBias = Math.random() * 0.5 + 0.5 // Bias upward
      const velocity = new Vector3(
        Math.cos(angle) * PARTICLE_SPEED,
        upwardBias * PARTICLE_SPEED,
        Math.sin(angle) * PARTICLE_SPEED
      )

      newParticles.push({
        id: particleId.current++,
        position: position.clone(),
        velocity,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        scale: Math.random() * 0.2 + 0.1,
        lifetime: PARTICLE_LIFETIME,
        createdAt: performance.now()
      })
    }

    setParticles(prev => [...prev, ...newParticles])
  }

  // Update projectile animation frame
  useEffect(() => {
    let lastTime = performance.now()
    let animationFrameId: number
    
    const updateProjectiles = () => {
      if (!isPaused) { // Only update if not paused
        const currentTime = performance.now()
        const deltaTime = (currentTime - lastTime) / 1000
        lastTime = currentTime

        setProjectiles(prev => prev.filter(projectile => {
          // Move projectile
          projectile.position.add(projectile.direction.clone().multiplyScalar(PROJECTILE_SPEED * deltaTime))
          
          // Check enemy collisions
          let hitEnemy = false
          setEnemies(enemies => enemies.map(enemy => {
            const distance = projectile.position.distanceTo(enemy.position)
            if (distance < ENEMY_SIZE) {
              hitEnemy = true
              const newHealth = enemy.health - 1
              
              if (newHealth <= 0) {
                handleEnemyDeath(enemy.position)
                return null
              }
              
              return {
                ...enemy,
                health: newHealth,
                lastHitTime: performance.now()
              }
            }
            return enemy
          }).filter((enemy): enemy is Enemy => enemy !== null))

          return !hitEnemy && 
            currentTime - projectile.createdAt <= PROJECTILE_LIFETIME &&
            projectile.position.distanceTo(playerPos.current) <= PROJECTILE_MAX_DISTANCE
        }))
      }
      
      animationFrameId = requestAnimationFrame(updateProjectiles)
    }

    animationFrameId = requestAnimationFrame(updateProjectiles)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isPaused])

  // Update enemy positions and check for projectile hits
  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId: number;

    const updateEnemies = () => {
      if (!isPaused && isLocked) { // Only update if not paused
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        setEnemies(prev => prev.map(enemy => {
          // Move towards player
          const directionToPlayer = playerPos.current.clone().sub(enemy.position).normalize();
          const newPosition = enemy.position.clone().add(
            directionToPlayer.multiplyScalar(ENEMY_SPEED * deltaTime)
          );

          // Check collision with player
          const distanceToPlayer = newPosition.distanceTo(playerPos.current);
          if (distanceToPlayer < (PLAYER_RADIUS + ENEMY_SIZE/2)) {
            takeDamage(10);
            createExplosion(enemy.position);
            return null;
          }

          return { ...enemy, position: newPosition };
        }).filter((enemy): enemy is Enemy => enemy !== null));
      }
      
      animationFrameId = requestAnimationFrame(updateEnemies);
    };

    animationFrameId = requestAnimationFrame(updateEnemies);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, isLocked, takeDamage, playerPos]);

  // Update player movement animation frame
  useEffect(() => {
    let lastTime = performance.now()
    let animationFrameId: number

    const updateLoop = () => {
      if (!isPaused && isLocked && controlsRef.current) { // Only update if not paused
        const currentTime = performance.now()
        const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1)
        lastTime = currentTime

        // ... rest of player movement logic ...
      }
      
      animationFrameId = requestAnimationFrame(updateLoop)
    }

    animationFrameId = requestAnimationFrame(updateLoop)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isLocked, isPaused])

  // Update player position with proper camera-relative movement
  useEffect(() => {
    let lastTime = performance.now()

    const updateLoop = () => {
      if (isPaused) {
        requestAnimationFrame(updateLoop)
        return
      }
      const currentTime = performance.now()
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1) // Cap delta time
      lastTime = currentTime

      if (isLocked && controlsRef.current) {
        const camera = controlsRef.current.getObject()

        // Apply smoother gravity
        if (!isGrounded.current) {
          verticalVelocity.current = Math.max(
            verticalVelocity.current - GRAVITY * deltaTime,
            -MAX_FALL_SPEED
          )
        }

        // Get camera direction
        const cameraDirection = new Vector3()
        camera.getWorldDirection(cameraDirection)
        
        // Calculate forward and right vectors
        const forward = cameraDirection.clone()
        forward.y = 0
        forward.normalize()
        
        const right = new Vector3()
        right.crossVectors(forward, new Vector3(0, 1, 0))

        // Movement with air control
        const movementMultiplier = isGrounded.current ? 1 : AIR_CONTROL
        currentVelocity.current.lerp(
          targetVelocity.current.clone().multiplyScalar(movementMultiplier),
          MOVEMENT_ACCELERATION * deltaTime
        )

        // Create movement vector
        const movement = new Vector3()
        
        // Add horizontal movement
        if (currentVelocity.current.z !== 0) {
          movement.add(forward.multiplyScalar(currentVelocity.current.z * deltaTime))
        }
        if (currentVelocity.current.x !== 0) {
          movement.add(right.multiplyScalar(currentVelocity.current.x * deltaTime))
        }
        
        // Add vertical movement
        movement.y = verticalVelocity.current * deltaTime

        // Apply movement with clamping
        const newPosition = playerPos.current.clone().add(movement)
        playerPos.current.copy(clampPosition(newPosition))

        // Ground check with better landing
        if (playerPos.current.y <= GROUND_LEVEL) {
          playerPos.current.y = GROUND_LEVEL
          verticalVelocity.current = 0
          isGrounded.current = true
          hasDoubleJump.current = true // Reset double jump when landing
        } else {
          isGrounded.current = false
        }

        camera.position.copy(playerPos.current)
      }

      requestAnimationFrame(updateLoop)
    }

    updateLoop()
  }, [isLocked, isPaused])

  // Update jump handler
  const handleJump = () => {
    const currentTime = performance.now()
    
    if (isGrounded.current && currentTime - lastJumpTime.current > JUMP_COOLDOWN) {
      // Normal jump from ground
      verticalVelocity.current = JUMP_FORCE
      isGrounded.current = false
      hasDoubleJump.current = true
      lastJumpTime.current = currentTime
    } else if (!isGrounded.current && hasDoubleJump.current) {
      // Double jump in air
      verticalVelocity.current = DOUBLE_JUMP_FORCE
      hasDoubleJump.current = false
      lastJumpTime.current = currentTime
    }
  }

  // Add enemy spawning system
  useEffect(() => {
    const spawnEnemy = () => {
      // Random position along room edges
      const side = Math.floor(Math.random() * 4)
      const pos = new Vector3()
      const offset = ROOM_SIZE / 2 - 1

      switch(side) {
        case 0: pos.set(offset, GROUND_LEVEL, Math.random() * ROOM_SIZE - offset); break
        case 1: pos.set(-offset, GROUND_LEVEL, Math.random() * ROOM_SIZE - offset); break
        case 2: pos.set(Math.random() * ROOM_SIZE - offset, GROUND_LEVEL, offset); break
        case 3: pos.set(Math.random() * ROOM_SIZE - offset, GROUND_LEVEL, -offset); break
      }

      setEnemies(prev => [...prev, {
        id: enemyId,
        position: pos,
        health: 3,
        createdAt: performance.now(),
        lastHitTime: 0
      }])
      setEnemyId(prev => prev + 1)
    }

    const interval = setInterval(spawnEnemy, ENEMY_SPAWN_INTERVAL)
    return () => clearInterval(interval)
  }, [enemyId])

  const handleProjectileHit = (position: Vector3) => {
    console.log('Projectile hit at position:', position); // Log the hit position

    // Create explosion effect or any other logic
    createExplosion(position); // Optional explosion effect

    // Update enemies state
    setEnemies(prev => prev.map(enemy => {
      const distance = enemy.position.distanceTo(position);
      if (distance < ENEMY_SIZE) {
        // Update last hit time for flashing
        return { ...enemy, lastHitTime: performance.now() };
      }
      return enemy;
    }));

    // Optionally remove the projectile
    setProjectiles(prev => prev.filter(p => p.id !== id)); // Remove projectile
  };

  // Update Z key handler to handle ESC as well
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLocked) return;
      
      if (e.code === 'KeyZ' || e.code === 'Escape') {
        setIsPaused(prev => {
          if (!prev) {
            document.exitPointerLock();
          }
          return !prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked]);

  // Update all animation frames to respect pause state
  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId: number;

    const updateLoop = () => {
      if (!isPaused && isLocked && controlsRef.current) {
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
        lastTime = currentTime;

        // ... rest of update logic ...
      }
      
      animationFrameId = requestAnimationFrame(updateLoop);
    };

    animationFrameId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isLocked, isPaused]);

  // Handle enemy death
  const handleEnemyDeath = (position: Vector3) => {
    createExplosion(position);
    // Drop XP at a better height for visibility and collection
    const dropPosition = position.clone().add(new Vector3(0, 1, 0));
    addPickup('xp', dropPosition, 10);
  };

  // Update the pickup collection effect
  useEffect(() => {
    if (!isLocked || isPaused) return;

    let animationFrameId: number;

    const checkPickups = () => {
      pickups.forEach(pickup => {
        const distanceToPlayer = pickup.position.distanceTo(playerPos.current);
        if (distanceToPlayer < 2) { // Increased pickup range
          if (pickup.type === 'xp') {
            addXP(pickup.value);
          }
          removePickup(pickup.id);
        }
      });

      animationFrameId = requestAnimationFrame(checkPickups);
    };

    animationFrameId = requestAnimationFrame(checkPickups);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isLocked, isPaused, addXP, removePickup, pickups, playerPos]);

  // Add health regeneration effect
  useEffect(() => {
    if (!isLocked || isPaused) return;

    const regenInterval = setInterval(() => {
      heal(1); // Regenerate 1 health every second
    }, 1000);

    return () => clearInterval(regenInterval);
  }, [isLocked, isPaused, heal]);

  return (
    <div className="game-container">
      <Canvas 
        camera={{ fov: 75 }}
        shadows
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputEncoding: THREE.sRGBEncoding
        }}
      >
        <color attach="background" args={['#000420']} />
        <fog attach="fog" args={['#000420', 5, ROOM_SIZE]} />
        
        <PointerLockControls 
          ref={controlsRef}
          onLock={() => setIsLocked(true)}
          onUnlock={() => setIsLocked(false)}
        />
        
        <ambientLight intensity={0.2} />
        
        <Room />

        {/* Enemies */}
        {enemies.map(enemy => (
          <EnemyObject
            key={enemy.id}
            position={enemy.position}
            health={enemy.health}
            lastHitTime={enemy.lastHitTime}
          />
        ))}

        {/* Projectiles */}
        {projectiles.map(projectile => (
          <ProjectileObject
            key={projectile.id}
            position={projectile.position}
            direction={projectile.direction}
            velocity={PROJECTILE_SPEED}
            radius={PROJECTILE_RADIUS}
            onHit={handleProjectileHit}
            enemies={enemies}
          />
        ))}

        {/* Explosion Particles */}
        {particles.map(particle => (
          <ExplosionParticle key={particle.id} {...particle} />
        ))}

        {/* Render pickups */}
        {pickups.map(pickup => (
          <Pickup
            key={pickup.id}
            position={pickup.position}
            type={pickup.type}
          />
        ))}
      </Canvas>

      {/* Crosshair */}
      {isLocked && (
        <div className="crosshair">
          <div className="dot" />
        </div>
      )}

      <PauseScreen 
        isVisible={isPaused}
        onResume={() => {
          setIsPaused(false);
          controlsRef.current?.lock();
        }}
      />

      {/* Start Prompt */}
      {!isLocked && (
        <div className="start-prompt">
          Click to play
        </div>
      )}

      {/* Health Display */}
      {isLocked && (
        <HUD 
          health={health}
          maxHealth={maxHealth}
          xp={xp}
          level={level}
          xpToNextLevel={level * 100}
          isLocked={isLocked}
        />
      )}
    </div>
  )
}

export default App
