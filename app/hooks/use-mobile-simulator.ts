'use client';

import { create } from 'zustand';

export type SimulatedDevice = 'iphone' | 'samsung' | 'pixel' | 'compact';

export interface DeviceSpecs {
  name: string;
  width: number;
  height: number;
  frameType: 'dynamic-island' | 'punch-hole' | 'notch';
}

export const DEVICE_SPECS: Record<SimulatedDevice, DeviceSpecs> = {
  iphone: {
    name: 'iPhone 15 Pro',
    width: 393,
    height: 852,
    frameType: 'dynamic-island',
  },
  samsung: {
    name: 'Galaxy S24',
    width: 412,
    height: 915,
    frameType: 'punch-hole',
  },
  pixel: {
    name: 'Pixel 8 Pro',
    width: 411,
    height: 892,
    frameType: 'punch-hole',
  },
  compact: {
    name: 'Compacto / SE',
    width: 375,
    height: 667,
    frameType: 'notch',
  },
};

interface MobileSimulatorState {
  isOpen: boolean;
  device: SimulatedDevice;
  isLandscape: boolean;
  zoom: number;
  targetPath: string | null;
  open: (device?: SimulatedDevice, initialPath?: string) => void;
  close: () => void;
  toggle: () => void;
  setDevice: (device: SimulatedDevice) => void;
  toggleOrientation: () => void;
  setZoom: (zoom: number) => void;
  setTargetPath: (path: string | null) => void;
}

export const useMobileSimulator = create<MobileSimulatorState>((set) => ({
  isOpen: false,
  device: 'iphone',
  isLandscape: false,
  zoom: 0.88,
  targetPath: null,
  open: (device, initialPath) =>
    set({
      isOpen: true,
      ...(device ? { device } : {}),
      ...(initialPath !== undefined ? { targetPath: initialPath } : {}),
    }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setDevice: (device) => set({ device }),
  toggleOrientation: () => set((state) => ({ isLandscape: !state.isLandscape })),
  setZoom: (zoom) => set({ zoom }),
  setTargetPath: (path) => set({ targetPath: path }),
}));
