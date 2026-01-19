export interface Point {
  x: number;
  y: number;
}

export interface GridCorners {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
}

export type SelectionMode = "transform" | "corners";

export interface AppState {
  sourceImage: string | null;
  gridCorners: GridCorners;
  rotation: number;
  perspectiveSkewX: number;
  perspectiveSkewY: number;
  outputWidth: number;
  outputHeight: number;
  colorMethod: ColorMethod;
  isometric: boolean;
  selectionMode: SelectionMode;
  maxColors: number;
  enableColorLimit: boolean;
  enableBackgroundDetection: boolean;
}

export type ColorMethod = 
  | "mean"
  | "median"
  | "mode"
  | "kernelMedian"
  | "centerWeighted"
  | "centerSpot";

export interface ColorMethodInfo {
  id: ColorMethod;
  name: string;
  description: string;
}

export const COLOR_METHODS: ColorMethodInfo[] = [
  {
    id: "mean",
    name: "Mean Average",
    description: "Average of all pixel colors in the cell"
  },
  {
    id: "median",
    name: "Median",
    description: "Median color value of all pixels"
  },
  {
    id: "mode",
    name: "Mode (Most Common)",
    description: "Most frequently occurring color"
  },
  {
    id: "kernelMedian",
    name: "Kernel Median",
    description: "Median using a gaussian-weighted kernel"
  },
  {
    id: "centerWeighted",
    name: "Center Weighted",
    description: "Center pixel weighted more heavily"
  },
  {
    id: "centerSpot",
    name: "Center Spot",
    description: "Only measures color in the middle 20% of the cell"
  }
];

export const DEFAULT_STATE: AppState = {
  sourceImage: null,
  gridCorners: {
    topLeft: { x: 50, y: 50 },
    topRight: { x: 350, y: 50 },
    bottomLeft: { x: 50, y: 350 },
    bottomRight: { x: 350, y: 350 }
  },
  rotation: 0,
  perspectiveSkewX: 0,
  perspectiveSkewY: 0,
  outputWidth: 64,
  outputHeight: 64,
  colorMethod: "mean",
  isometric: true,
  selectionMode: "transform",
  maxColors: 32,
  enableColorLimit: true,
  enableBackgroundDetection: true
};

const STORAGE_KEY = "pbs-app-state";

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.warn("Failed to save state to localStorage");
  }
}

export function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AppState>;
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {
    console.warn("Failed to load state from localStorage");
  }
  return { ...DEFAULT_STATE };
}
