
export enum MaterialCategory {
  TILES = 'Tiles',
  PAINT = 'Paint',
  WOOD = 'Wood'
}

export interface VendorProduct {
  id: string;
  name: string;
  vendor: string; // e.g., "Surya Tiles"
  category: MaterialCategory;
  thumbnail: string;
  textureUrl?: string; // For tiles/wood
  color?: string; // For paint
  price?: string;
  tags?: string[]; // New: for themes like 'warm', 'dark', 'modern'
}

export interface ThemePreset {
  exteriorWallId: string; // Product ID from constants
  interiorWallId: string;
  floorId: string;
  bathroomFloorId?: string;
}

export interface ThemeTemplate {
  id: string;
  name: string;
  color: string; // Representative color for UI
  filterTags: string[]; // Tags to filter products by
  preset: ThemePreset; // Auto-apply settings
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AppliedMaterial {
  meshId: string;
  productId: string;
}

// Expanded targets for the improved House Model
export type AITarget = 
  | 'all_walls' | 'all_floors'
  | 'exterior_walls' | 'interior_walls'
  | 'living_walls' | 'living_floor'
  | 'kitchen_walls' | 'kitchen_floor' | 'kitchen_island'
  | 'dining_walls' | 'dining_floor'
  | 'bed_walls' | 'bed_floor' | 'bed_furniture'
  | 'bath_walls' | 'bath_floor'
  | 'sofa' | 'stairs';

export interface AIAction {
  target: AITarget; 
  hexColor: string;
  explanation: string;
}

export interface AIResponse {
  message: string;
  actions?: AIAction[];
}
