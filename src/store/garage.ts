import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Vehicle } from '@/domain/types';

import { persistStorage, STORAGE_KEYS } from './storage';

export type VehicleInput = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;

interface GarageState {
  vehicles: Vehicle[];
  activeVehicleId: string | null;
  addVehicle: (input: VehicleInput) => Vehicle;
  updateVehicle: (id: string, input: VehicleInput) => void;
  removeVehicle: (id: string) => void;
  setActiveVehicle: (id: string) => void;
}

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useGarage = create<GarageState>()(
  persist(
    (set) => ({
      vehicles: [],
      activeVehicleId: null,

      addVehicle: (input) => {
        const timestamp = new Date().toISOString();
        const vehicle: Vehicle = {
          ...input,
          id: createId(),
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set((state) => ({ vehicles: [...state.vehicles, vehicle], activeVehicleId: vehicle.id }));
        return vehicle;
      },

      updateVehicle: (id, input) =>
        set((state) => ({
          vehicles: state.vehicles.map((vehicle) =>
            vehicle.id === id
              ? { ...vehicle, ...input, updatedAt: new Date().toISOString() }
              : vehicle,
          ),
        })),

      removeVehicle: (id) =>
        set((state) => {
          const vehicles = state.vehicles.filter((vehicle) => vehicle.id !== id);
          const activeVehicleId =
            state.activeVehicleId === id ? (vehicles[0]?.id ?? null) : state.activeVehicleId;
          return { vehicles, activeVehicleId };
        }),

      setActiveVehicle: (id) => set({ activeVehicleId: id }),
    }),
    {
      name: STORAGE_KEYS.garage,
      storage: persistStorage,
      version: 1,
      partialize: ({ vehicles, activeVehicleId }) => ({ vehicles, activeVehicleId }),
    },
  ),
);

export function useActiveVehicle(): Vehicle | null {
  return useGarage(
    (state) =>
      state.vehicles.find((vehicle) => vehicle.id === state.activeVehicleId) ??
      state.vehicles[0] ??
      null,
  );
}

export function useVehicle(id: string | undefined): Vehicle | null {
  return useGarage((state) => state.vehicles.find((vehicle) => vehicle.id === id) ?? null);
}
