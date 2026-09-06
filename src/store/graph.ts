// Graph hover/select state for the 3D scene
import { create } from 'zustand';

interface GraphState {
  hovered: string | null;
  selected: string | null;
  cameraProgress: number; // 0..1, scroll-driven
  setHovered: (id: string | null) => void;
  setSelected: (id: string | null) => void;
  setCameraProgress: (p: number) => void;
}

export const useGraph = create<GraphState>((set) => ({
  hovered: null,
  selected: null,
  cameraProgress: 0,
  setHovered: (id) => set({ hovered: id }),
  setSelected: (id) => set({ selected: id }),
  setCameraProgress: (p) => set({ cameraProgress: p }),
}));
