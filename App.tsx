
import React, { useState, useRef, useMemo } from 'react';
import { DesignScene } from './components/Scene';
import { AIAssistant } from './components/AIAssistant';
import { MOCK_PRODUCTS, THEME_TEMPLATES, MESH_GROUPS } from './constants';
import { VendorProduct, MaterialCategory, AIAction, AITarget, ThemeTemplate } from './types';
import * as THREE from 'three';

const App: React.FC = () => {
  // State
  const [uploadedModelUrl, setUploadedModelUrl] = useState<string | null>(null);
  const [selectedMesh, setSelectedMesh] = useState<THREE.Mesh | null>(null);
  const [appliedMaterials, setAppliedMaterials] = useState<Record<string, VendorProduct>>({});
  const [activeTab, setActiveTab] = useState<MaterialCategory>(MaterialCategory.TILES);
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('All');
  const [activeThemeId, setActiveThemeId] = useState<string>('all');
  const [recentProducts, setRecentProducts] = useState<VendorProduct[]>([]);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  
  // View & Lighting State
  const [viewMode, setViewMode] = useState<'room' | 'tile' | 'wall'>('room');
  const [isNight, setIsNight] = useState(false);

  // Calculation State
  const [sqFtInput, setSqFtInput] = useState<string>('');
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  const [productForQuote, setProductForQuote] = useState<VendorProduct | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<any>(null);

  // Derived Lists
  const vendors = useMemo(() => {
    const allVendors = MOCK_PRODUCTS.filter(p => p.category === activeTab).map(p => p.vendor);
    return ['All', ...Array.from(new Set(allVendors))];
  }, [activeTab]);

  const filteredProducts = useMemo(() => {
    let products = MOCK_PRODUCTS.filter(p => p.category === activeTab);

    // Vendor Filter
    if (selectedVendorFilter !== 'All') {
      products = products.filter(p => p.vendor === selectedVendorFilter);
    }

    // Theme Filter
    if (activeThemeId !== 'all') {
      const theme = THEME_TEMPLATES.find(t => t.id === activeThemeId);
      if (theme) {
        products = products.filter(p => 
          p.tags?.some(tag => theme.filterTags.includes(tag))
        );
      }
    }

    return products;
  }, [activeTab, selectedVendorFilter, activeThemeId]);

  // --- Handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedModelUrl(url);
      setAppliedMaterials({}); 
      setSelectedMesh(null);
    }
  };

  const handleSelectObject = (mesh: THREE.Mesh) => {
    setSelectedMesh(mesh);
  };

  const applyMaterial = (product: VendorProduct, meshUuid?: string) => {
    const targetUuid = meshUuid || selectedMesh?.uuid;
    
    if (!targetUuid) {
      alert("Please select a surface (floor or wall) in the 3D view first.");
      return;
    }
    
    // Apply
    setAppliedMaterials(prev => ({
      ...prev,
      [targetUuid]: product
    }));

    // Add to Recents
    setRecentProducts(prev => {
      const existing = prev.filter(p => p.id !== product.id);
      return [product, ...existing].slice(0, 5);
    });
    
    if (!meshUuid) {
      setProductForQuote(product);
      setSqFtInput('');
      setCalculatedCost(null);
    }
  };

  // --- THEME HANDLER ---
  const handleThemeSelect = (theme: ThemeTemplate) => {
    setActiveThemeId(theme.id);
    
    // If it's just "all" (custom), don't override materials
    if (theme.id === 'all') return;

    const { preset } = theme;
    if (!preset.exteriorWallId && !preset.interiorWallId && !preset.floorId) return;

    // Find Products
    const extProd = MOCK_PRODUCTS.find(p => p.id === preset.exteriorWallId);
    const intProd = MOCK_PRODUCTS.find(p => p.id === preset.interiorWallId);
    const flrProd = MOCK_PRODUCTS.find(p => p.id === preset.floorId);
    const bathFlrProd = MOCK_PRODUCTS.find(p => p.id === preset.bathroomFloorId) || flrProd;

    const newMaterials = { ...appliedMaterials };

    // Apply Exterior
    if (extProd) {
      MESH_GROUPS.exteriorWalls.forEach(id => newMaterials[id] = extProd);
    }
    // Apply Interior
    if (intProd) {
      MESH_GROUPS.interiorWalls.forEach(id => newMaterials[id] = intProd);
    }
    // Apply Floors
    if (flrProd) {
      [...MESH_GROUPS.livingFloors, ...MESH_GROUPS.bedroomFloors].forEach(id => newMaterials[id] = flrProd);
    }
    if (bathFlrProd) {
      MESH_GROUPS.bathroomFloors.forEach(id => newMaterials[id] = bathFlrProd);
    }

    setAppliedMaterials(newMaterials);
    
    // Also set lighting based on theme? 
    if (theme.filterTags.includes('dark')) {
      // Optional: Auto switch to night mode? 
      // setIsNight(true); 
    } else {
      // setIsNight(false);
    }
  };


  // --- AI ACTION HANDLER ---
  const handleAIActions = (actions: AIAction[]) => {
    const newMaterials = { ...appliedMaterials };
    
    const getIdsForTarget = (target: AITarget): string[] => {
       switch(target) {
         case 'exterior_walls': return MESH_GROUPS.exteriorWalls;
         case 'interior_walls': return MESH_GROUPS.interiorWalls;
         case 'living_walls': return MESH_GROUPS.livingWalls;
         case 'kitchen_walls': return MESH_GROUPS.kitchenWalls;
         case 'dining_walls': return MESH_GROUPS.diningWalls;
         case 'bed_walls': return MESH_GROUPS.bedWalls;
         case 'bath_walls': return MESH_GROUPS.bathWalls;
         case 'living_floor': return MESH_GROUPS.livingFloors; // Approximate
         case 'kitchen_floor': return ["floor-kitchen"];
         case 'dining_floor': return ["floor-dining"];
         case 'bed_floor': return MESH_GROUPS.bedroomFloors;
         case 'bath_floor': return MESH_GROUPS.bathroomFloors;
         case 'all_walls': return [...MESH_GROUPS.exteriorWalls, ...MESH_GROUPS.interiorWalls];
         case 'all_floors': return [...MESH_GROUPS.livingFloors, ...MESH_GROUPS.bedroomFloors, ...MESH_GROUPS.bathroomFloors];
         case 'kitchen_island': return ["kitchen-island-base"];
         case 'sofa': return ["sofa-base"];
         case 'bed_furniture': return ["bed-base"];
         case 'stairs': return Array.from({length: 12}).map((_, i) => `stairs-${i}`);
         default: return [];
       }
    };

    actions.forEach(action => {
      const targetIds = getIdsForTarget(action.target as AITarget);
      
      const aiProduct: VendorProduct = {
        id: `ai-${Date.now()}-${Math.random()}`,
        name: `AI: ${action.explanation}`,
        vendor: 'AI Design',
        category: MaterialCategory.PAINT,
        thumbnail: '',
        color: action.hexColor,
        price: 'N/A'
      };

      targetIds.forEach(id => {
        newMaterials[id] = aiProduct;
      });
    });

    setAppliedMaterials(newMaterials);
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const link = document.createElement('a');
      link.setAttribute('download', 'my-house-design.png');
      link.setAttribute('href', canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
      link.click();
    }
  };

  const handleCalculate = () => {
    if (!productForQuote || !sqFtInput) return;
    const priceStr = productForQuote.price?.split('/')[0].replace('$', '').replace(',', '');
    const price = parseFloat(priceStr || '0');
    const area = parseFloat(sqFtInput);
    if (!isNaN(price) && !isNaN(area)) {
      setCalculatedCost(price * area);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gray-900 font-sans text-gray-100">
      
      {/* LEFT SIDEBAR */}
      <div className="w-80 bg-[#1a1a1a] border-r border-gray-800 flex flex-col shadow-2xl z-10">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
             <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
             Immersive<span className="text-indigo-500">Home</span>
          </h1>
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded transition-all"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Upload GLB
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".glb,.gltf" />
            <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded transition-all">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Render
            </button>
          </div>
        </div>

        {/* Recently Used Section */}
        {recentProducts.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-800 bg-[#151515]">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Recently Used</h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {recentProducts.map(p => (
                <button 
                  key={`recent-${p.id}`}
                  onClick={() => applyMaterial(p)}
                  className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-gray-600 hover:border-indigo-500 transition-all relative overflow-hidden group"
                  title={p.name}
                >
                   {p.category === MaterialCategory.TILES && p.thumbnail ? (
                     <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full" style={{ backgroundColor: p.color }}></div>
                   )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="px-4 py-4 space-y-4">
          <div className="flex bg-gray-800 p-1 rounded-lg">
            {[MaterialCategory.TILES, MaterialCategory.PAINT].map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveTab(cat); setSelectedVendorFilter('All'); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                  activeTab === cat ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Filters Area */}
          <div className="space-y-3">
            
            {/* Vendor Filter */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Vendor</label>
              <div className="relative">
                <select 
                  value={selectedVendorFilter}
                  onChange={(e) => setSelectedVendorFilter(e.target.value)}
                  className="w-full p-2 bg-[#2a2a2a] text-gray-200 border border-gray-700 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none appearance-none"
                >
                  {vendors.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* Color Recommendation / Theme Templates */}
            <div>
               <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Design Templates (Click to Apply)</label>
               <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {THEME_TEMPLATES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeSelect(theme)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs transition-all ${
                        activeThemeId === theme.id 
                          ? 'bg-indigo-900/40 border-indigo-500 text-indigo-200' 
                          : 'bg-[#2a2a2a] border-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.color }}></div>
                      {theme.name}
                    </button>
                  ))}
               </div>
            </div>

          </div>
        </div>

        {/* Material Grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => applyMaterial(product)}
                className={`group cursor-pointer bg-[#222] rounded-xl p-2 hover:bg-[#2a2a2a] transition-all duration-200 border border-transparent ${
                  productForQuote?.id === product.id ? 'border-indigo-500 bg-[#2a2a2a]' : 'hover:border-gray-600'
                }`}
              >
                {/* Visual Preview */}
                <div className="aspect-[4/3] w-full rounded-lg overflow-hidden mb-2 relative shadow-inner bg-gray-900 flex items-center justify-center">
                  {product.category === MaterialCategory.TILES ? (
                    <div className="w-full h-full relative">
                        <img 
                          src={product.thumbnail} 
                          alt={product.name} 
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  ) : (
                    // Paint Color Swatch
                    <div className="relative w-16 h-16 rounded-full shadow-lg" style={{ backgroundColor: product.color }}>
                       <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/10 to-white/30 pointer-events-none"></div>
                       <div className="absolute top-2 right-3 w-4 h-2 bg-white/40 rounded-full blur-[1px] transform -rotate-12"></div>
                    </div>
                  )}
                  
                  {/* Price Tag Overlay */}
                  <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded font-mono border border-white/10">
                    {product.price?.split('/')[0]}
                  </div>
                </div>

                {/* Details */}
                <div className="px-1">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider truncate">{product.vendor}</p>
                  <p className="text-xs text-gray-200 font-medium truncate leading-tight">{product.name}</p>
                </div>
              </div>
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
             <div className="text-center py-8 text-gray-500 text-xs">
               No materials found for this filter.
             </div>
          )}
        </div>

        {/* Calculator Panel */}
        {productForQuote && (
          <div className="border-t border-gray-800 bg-[#1f1f1f] p-4 animate-slide-up">
            <div className="flex justify-between items-start mb-3">
               <div>
                 <h3 className="text-[10px] font-bold text-gray-500 uppercase">Estimator</h3>
                 <div className="text-sm text-indigo-300 font-bold truncate max-w-[150px]">{productForQuote.name}</div>
               </div>
               <button onClick={() => setProductForQuote(null)} className="text-gray-500 hover:text-white">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>

            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                 <input type="number" value={sqFtInput} onChange={(e) => setSqFtInput(e.target.value)} className="w-full bg-[#2a2a2a] text-white p-2 rounded border border-gray-700 text-sm focus:border-indigo-500 outline-none transition-colors placeholder-gray-600" placeholder="Area (Sq. Ft)" />
                 <span className="absolute right-3 top-2.5 text-xs text-gray-500">ft²</span>
              </div>
              <button onClick={handleCalculate} className="px-3 py-1 bg-gray-700 text-white text-xs font-bold rounded hover:bg-gray-600 transition-colors border border-gray-600">Calc</button>
            </div>
            
            {calculatedCost !== null && (
              <div className="flex justify-between items-end mb-3 p-2 bg-[#252525] rounded border border-green-900/30 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                <span className="text-xs text-gray-400">Estimated Cost</span>
                <span className="text-xl font-bold text-green-400">${calculatedCost.toFixed(2)}</span>
              </div>
            )}
            <a href={`mailto:sales@${productForQuote.vendor.replace(/\s/g, '').toLowerCase()}.com?subject=Quote Request&body=Interest in ${productForQuote.name}`} className="block w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded text-center transition-all shadow-lg shadow-indigo-900/20">Contact Vendor</a>
          </div>
        )}
      </div>

      {/* CENTER: 3D Viewport */}
      <div className="flex-1 relative bg-[#0f0f0f]">
        
        {/* View Controls */}
        <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
           {/* Day/Night Toggle */}
           <button 
             onClick={() => setIsNight(!isNight)}
             className={`p-3 rounded-full shadow-lg transition-colors ${isNight ? 'bg-gray-800 text-yellow-400 border border-gray-700' : 'bg-white text-orange-500'}`}
           >
             {isNight ? (
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
             ) : (
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
             )}
           </button>

           {/* View Modes */}
           <div className="bg-gray-800/80 backdrop-blur rounded-xl p-1 flex flex-col gap-1 shadow-lg mt-4 border border-gray-700">
             <button 
               onClick={() => setViewMode('room')}
               className={`p-2 rounded-lg transition-colors ${viewMode === 'room' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
               title="Room View"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
             </button>
             <button 
               onClick={() => setViewMode('tile')}
               className={`p-2 rounded-lg transition-colors ${viewMode === 'tile' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
               title="Tile View (Top)"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
             </button>
             <button 
               onClick={() => setViewMode('wall')}
               className={`p-2 rounded-lg transition-colors ${viewMode === 'wall' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
               title="Wall View (Front)"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
             </button>
           </div>
        </div>

        <DesignScene 
          canvasRef={canvasRef}
          uploadedModelUrl={uploadedModelUrl} 
          selectedMeshId={selectedMesh?.uuid || null}
          appliedMaterials={appliedMaterials}
          onSelectObject={handleSelectObject}
          viewMode={viewMode}
          isNight={isNight}
        />
        
        {!selectedMesh && !uploadedModelUrl && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 pointer-events-none">
             <p className="text-sm text-white/90 font-medium">Click any wall or floor to start designing</p>
          </div>
        )}
      </div>

      <AIAssistant 
        appliedMaterials={appliedMaterials} 
        onApplyActions={handleAIActions}
        isOpen={isAIChatOpen}
        onToggle={() => setIsAIChatOpen(!isAIChatOpen)}
      />

    </div>
  );
};

export default App;
