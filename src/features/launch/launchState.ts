import { create } from 'zustand';

interface LaunchState {
  /** True once the launch overlay starts revealing the app. */
  settled: boolean;
  markSettled: () => void;
}

export const useLaunchState = create<LaunchState>()((set) => ({
  settled: false,
  markSettled: () => set({ settled: true }),
}));
