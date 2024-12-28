import { create } from 'zustand';
import { Vector3 } from 'three';

type Pickup = {
  id: number;
  type: 'health' | 'xp';
  position: Vector3;
  value: number;
  createdAt: number;
};

interface GameState {
  health: number;
  maxHealth: number;
  xp: number;
  level: number;
  pickups: Pickup[];
  pickupId: number;
  
  // Actions
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  addXP: (amount: number) => void;
  addPickup: (type: 'health' | 'xp', position: Vector3, value: number) => void;
  removePickup: (id: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  health: 100,
  maxHealth: 100,
  xp: 0,
  level: 1,
  pickups: [],
  pickupId: 0,

  takeDamage: (amount) => set((state) => ({
    health: Math.max(0, state.health - amount)
  })),

  heal: (amount) => set((state) => ({
    health: Math.min(state.maxHealth, state.health + amount)
  })),

  addXP: (amount) => set((state) => {
    const newXP = state.xp + amount;
    const xpToLevel = state.level * 100; // Simple level scaling

    if (newXP >= xpToLevel) {
      return {
        xp: newXP - xpToLevel,
        level: state.level + 1
      };
    }
    return { xp: newXP };
  }),

  addPickup: (type, position, value) => set((state) => ({
    pickups: [...state.pickups, {
      id: state.pickupId,
      type,
      position,
      value,
      createdAt: performance.now()
    }],
    pickupId: state.pickupId + 1
  })),

  removePickup: (id) => set((state) => ({
    pickups: state.pickups.filter(pickup => pickup.id !== id)
  }))
})); 