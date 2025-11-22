
import { MaterialCategory, VendorProduct, ThemeTemplate } from './types';

// --- MESH ID CONSTANTS ---
export const MESH_GROUPS = {
  exteriorWalls: [
    "wall-g-back", "wall-g-right", "wall-g-front-left", "wall-g-front-right", "wall-g-front-top", "wall-g-front-bottom", 
    "wall-g-front-k", "wall-g-left-left", "wall-g-left-right", "wall-g-left-top", "wall-g-left-bottom",
    "wall-u-bed-back", "wall-u-bed-right", "wall-u-bed-front-left", "wall-u-bed-front-right", "wall-u-bed-front-top", "wall-u-bed-front-bottom",
    "wall-u-bath-back", "wall-u-bath-left", "wall-u-bath-front-left", "wall-u-bath-front-right", "wall-u-bath-front-top", "wall-u-bath-front-bottom"
  ],
  interiorWalls: [
    "wall-g-partition", "wall-u-split", "wall-g-left-d"
  ],
  livingFloors: ["floor-living", "floor-dining", "floor-kitchen"],
  bedroomFloors: ["floor-bed-master"],
  bathroomFloors: ["floor-bath-master"],
  
  // Group helpers
  get livingWalls() { return ["wall-g-back", "wall-g-right", "wall-g-front-left", "wall-g-front-right", "wall-g-front-top", "wall-g-front-bottom"]; },
  get kitchenWalls() { return ["wall-g-front-k", "wall-g-left-left", "wall-g-left-right", "wall-g-left-top", "wall-g-left-bottom", "wall-g-partition"]; },
  get diningWalls() { return ["wall-g-left-d", "wall-g-partition"]; },
  get bedWalls() { return ["wall-u-bed-back", "wall-u-bed-right", "wall-u-bed-front-left", "wall-u-bed-front-right", "wall-u-bed-front-top", "wall-u-bed-front-bottom", "wall-u-split"]; },
  get bathWalls() { return ["wall-u-bath-back", "wall-u-bath-left", "wall-u-bath-front-left", "wall-u-bath-front-right", "wall-u-bath-front-top", "wall-u-bath-front-bottom"]; }
};

export const THEME_TEMPLATES: ThemeTemplate[] = [
  { 
    id: 'all', 
    name: 'Custom', 
    color: '#ffffff', 
    filterTags: [],
    preset: { exteriorWallId: '', interiorWallId: '', floorId: '' } // No preset
  },
  { 
    id: 'modern-dark', 
    name: 'Modern Dark', 
    color: '#1f2937', 
    filterTags: ['dark', 'modern', 'industrial'],
    preset: {
      exteriorWallId: 'sw-002', // Tricorn Black
      interiorWallId: 'dlx-001', // Mineral Grey
      floorId: 'st-003', // Polished Concrete
      bathroomFloorId: 'rs-002' // Midnight Black
    }
  },
  { 
    id: 'warm-cozy', 
    name: 'Warm & Cozy', 
    color: '#fcd34d', 
    filterTags: ['warm', 'beige', 'wood'],
    preset: {
      exteriorWallId: 'ap-002', // Soft Cream
      interiorWallId: 'sw-001', // Alabaster White
      floorId: 'st-002', // Oak Hardwood
      bathroomFloorId: 'rs-001' // Travertine
    }
  },
  { 
    id: 'cool-calm', 
    name: 'Cool & Calm', 
    color: '#60a5fa', 
    filterTags: ['cool', 'blue', 'grey'],
    preset: {
      exteriorWallId: 'ap-001', // Royal Blue
      interiorWallId: 'sw-001', // White
      floorId: 'rsmi-001', // Mosaic Blue
      bathroomFloorId: 'njr-001' // Royal Marble
    }
  },
  { 
    id: 'earthy', 
    name: 'Earthy', 
    color: '#78350f', 
    filterTags: ['natural', 'brown', 'green'],
    preset: {
      exteriorWallId: 'ap-003', // Sage Green
      interiorWallId: 'ap-002', // Soft Cream
      floorId: 'njr-003', // Terra Cotta
      bathroomFloorId: 'rsmi-003' // Sandstone
    }
  },
];

export const MOCK_PRODUCTS: VendorProduct[] = [
  // --- SURYA TILES ---
  {
    id: 'st-001',
    name: 'Classic Brick Red',
    vendor: 'Surya Tiles',
    category: MaterialCategory.TILES,
    thumbnail: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/brick_diffuse.jpg',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/brick_diffuse.jpg',
    price: '$4.50/sqft',
    tags: ['warm', 'industrial', 'red']
  },
  {
    id: 'st-002',
    name: 'Oak Hardwood',
    vendor: 'Surya Tiles',
    category: MaterialCategory.TILES,
    thumbnail: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/hardwood2_diffuse.jpg',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/hardwood2_diffuse.jpg',
    price: '$6.20/sqft',
    tags: ['warm', 'wood', 'natural']
  },
  {
    id: 'st-003',
    name: 'Polished Concrete',
    vendor: 'Surya Tiles',
    category: MaterialCategory.TILES,
    thumbnail: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/floors/FloorsCheckerboard_S_Diffuse.jpg',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/floors/FloorsCheckerboard_S_Diffuse.jpg',
    price: '$5.50/sqft',
    tags: ['cool', 'industrial', 'grey', 'modern']
  },

  // --- NJR TILES (New) ---
  {
    id: 'njr-001',
    name: 'Royal Marble White',
    vendor: 'NJR Tiles',
    category: MaterialCategory.TILES,
    thumbnail: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
    price: '$9.50/sqft',
    tags: ['cool', 'modern', 'white']
  },
  {
    id: 'njr-002',
    name: 'Slate Grey Premium',
    vendor: 'NJR Tiles',
    category: MaterialCategory.TILES,
    thumbnail: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg', 
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg',
    price: '$7.25/sqft',
    tags: ['dark', 'industrial', 'modern']
  },
  {
    id: 'njr-003',
    name: 'Terra Cotta Outdoor',
    vendor: 'NJR Tiles',
    category: MaterialCategory.TILES,
    thumbnail: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/uv_grid_opengl.jpg',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/uv_grid_opengl.jpg',
    price: '$3.80/sqft',
    tags: ['warm', 'natural']
  },

  // --- RS TILES (New) ---
  {
    id: 'rs-001',
    name: 'Travertine Beige',
    vendor: 'RS Tiles',
    category: MaterialCategory.TILES,
    thumbnail: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/crate.gif',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/crate.gif',
    price: '$5.15/sqft',
    tags: ['warm', 'beige', 'natural']
  },
  {
    id: 'rs-002',
    name: 'Midnight Black Ceramic',
    vendor: 'RS Tiles',
    category: MaterialCategory.TILES,
    thumbnail: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water.jpg',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water.jpg',
    price: '$6.75/sqft',
    tags: ['dark', 'modern', 'industrial']
  },

  // --- RSMI TILES (New) ---
  {
    id: 'rsmi-001',
    name: 'Mosaic Blue',
    vendor: 'RSMI Tiles',
    category: MaterialCategory.TILES,
    thumbnail: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/colors.png',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/colors.png',
    price: '$12.00/sqft',
    tags: ['cool', 'blue']
  },
  {
    id: 'rsmi-002',
    name: 'Industrial Metal',
    vendor: 'RSMI Tiles',
    category: MaterialCategory.TILES,
    thumbnail: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/golfball.jpg',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/golfball.jpg',
    price: '$8.90/sqft',
    tags: ['modern', 'grey', 'industrial']
  },
  {
    id: 'rsmi-003',
    name: 'Sandstone Texture',
    vendor: 'RSMI Tiles',
    category: MaterialCategory.TILES,
    thumbnail: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/disturb.jpg',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/disturb.jpg',
    price: '$5.99/sqft',
    tags: ['warm', 'natural']
  },


  // --- PAINT ---

  // Asian Paints
  {
    id: 'ap-001',
    name: 'Royal Blue',
    vendor: 'Asian Paints',
    category: MaterialCategory.PAINT,
    thumbnail: '',
    color: '#1e3a8a',
    price: '$40/gal',
    tags: ['cool', 'blue', 'modern']
  },
  {
    id: 'ap-002',
    name: 'Soft Cream',
    vendor: 'Asian Paints',
    category: MaterialCategory.PAINT,
    thumbnail: '',
    color: '#fef3c7',
    price: '$35/gal',
    tags: ['warm', 'beige', 'cozy']
  },
  {
    id: 'ap-003',
    name: 'Sage Green',
    vendor: 'Asian Paints',
    category: MaterialCategory.PAINT,
    thumbnail: '',
    color: '#84a98c',
    price: '$38/gal',
    tags: ['natural', 'green', 'earthy']
  },
   {
    id: 'ap-004',
    name: 'Terracotta',
    vendor: 'Asian Paints',
    category: MaterialCategory.PAINT,
    thumbnail: '',
    color: '#e07a5f',
    price: '$38/gal',
    tags: ['warm', 'red', 'earthy']
  },

  // Dulux
  {
    id: 'dlx-001',
    name: 'Mineral Grey',
    vendor: 'Dulux',
    category: MaterialCategory.PAINT,
    thumbnail: '',
    color: '#4b5563',
    price: '$42/gal',
    tags: ['cool', 'grey', 'modern']
  },
  {
    id: 'dlx-002',
    name: 'Blush Pink',
    vendor: 'Dulux',
    category: MaterialCategory.PAINT,
    thumbnail: '',
    color: '#fce7f3',
    price: '$45/gal',
    tags: ['warm', 'cozy']
  },
  {
    id: 'dlx-003',
    name: 'Midnight Navy',
    vendor: 'Dulux',
    category: MaterialCategory.PAINT,
    thumbnail: '',
    color: '#0f172a',
    price: '$48/gal',
    tags: ['dark', 'modern', 'blue']
  },

  // Sherwin Williams
  {
    id: 'sw-001',
    name: 'Alabaster White',
    vendor: 'Sherwin Williams',
    category: MaterialCategory.PAINT,
    thumbnail: '',
    color: '#f9fafb',
    price: '$50/gal',
    tags: ['modern', 'white', 'clean']
  },
  {
    id: 'sw-002',
    name: 'Tricorn Black',
    vendor: 'Sherwin Williams',
    category: MaterialCategory.PAINT,
    thumbnail: '',
    color: '#111827',
    price: '$52/gal',
    tags: ['dark', 'modern', 'bold']
  },
  {
    id: 'sw-003',
    name: 'Naval',
    vendor: 'Sherwin Williams',
    category: MaterialCategory.PAINT,
    thumbnail: '',
    color: '#1e3a8a',
    price: '$55/gal',
    tags: ['blue', 'cool', 'bold']
  }
];
