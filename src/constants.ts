// Projectile settings
export const PROJECTILE_SPEED = 30 // meters per second
export const PROJECTILE_RADIUS = 0.05
export const PROJECTILE_MAX_DISTANCE = 100 // meters
export const PROJECTILE_LIFETIME = 10000 // milliseconds

// Player settings
export const PLAYER_HEIGHT = 1.8 // meters
export const MOVEMENT_SPEED = 4 // Walking speed
export const MOVEMENT_ACCELERATION = 15
export const MOVEMENT_DECELERATION = 10
export const GRAVITY = 10
export const JUMP_FORCE = 10 // Increased initial jump force
export const DOUBLE_JUMP_FORCE = 6 // Slightly weaker second jump
export const GROUND_LEVEL = PLAYER_HEIGHT / 2
export const AIR_CONTROL = 0.5
export const MAX_FALL_SPEED = 20
export const JUMP_COOLDOWN = 50 // Reduced for more responsive jumping
export const PLAYER_RADIUS = 0.5
export const PLAYER_MAX_HEALTH = 100
export const PLAYER_INVULNERABILITY_TIME = 1000 // milliseconds

// Enemy settings
export const ENEMY_SPEED = 2 // meters per second
export const ENEMY_SIZE = 0.5 // meters
export const ENEMY_SPAWN_INTERVAL = 5000
export const ENEMY_DAMAGE = 10
export const KNOCKBACK_FORCE = 15

// Room settings
export const ROOM_SIZE = 50 // meters
export const ROOM_HEIGHT = 10 // meters
export const WALL_SEGMENTS = 16
export const WALL_PANEL_SIZE = 2.5
export const WALL_DEPTH = 0.2

// Particle settings
export const PARTICLE_COUNT = 5
export const PARTICLE_LIFETIME = 1000 // milliseconds
export const PARTICLE_SPEED = 5
export const PARTICLE_COLORS = ['#ff0000', '#ff00ff', '#00ffff', '#ffff00', '#ff8800'] 