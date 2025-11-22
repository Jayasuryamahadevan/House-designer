
import React, { useState, Suspense, useEffect, useMemo } from 'react';
import { Canvas, useLoader, ThreeEvent, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Sky, Environment, ContactShadows, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VendorProduct, MaterialCategory } from '../types';

// Fix for missing JSX types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// --- Camera View Handler ---
const CameraHandler = ({ viewMode }: { viewMode: 'room' | 'tile' | 'wall' }) => {
  const { camera, controls } = useThree();
  
  useEffect(() => {
    if (!controls) return;
    const orbit = controls as any;
    
    // Smoothly move camera based on mode
    const duration = 1000; // ms
    const startPos = camera.position.clone();
    let endPos = new THREE.Vector3();
    let targetPos = new THREE.Vector3(0, 0, 0);

    if (viewMode === 'tile') {
      // Top Down View
      endPos.set(0, 20, 0);
      targetPos.set(0, 0, 0);
      orbit.enableRotate = false;
    } else if (viewMode === 'wall') {
      // Front Elevation View
      endPos.set(0, 2, 20);
      targetPos.set(0, 2, 0);
      orbit.enableRotate = false;
    } else {
      // Standard Room View
      endPos.set(15, 12, 15);
      targetPos.set(0, 0, 0);
      orbit.enableRotate = true;
    }
    
    // Animate (Simple lerp for prototype)
    camera.position.copy(endPos);
    orbit.target.copy(targetPos);
    orbit.update();

  }, [viewMode, camera, controls]);

  return null;
};

// --- Robust Material Component ---
const MaterialWithTexture: React.FC<{ url: string; isSelected: boolean; color?: string }> = ({ url, isSelected, color }) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setHasError(false);
    setTexture(null);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous'); 
    
    loader.load(
      url,
      (loadedTex) => {
        if (isMounted) {
          loadedTex.wrapS = loadedTex.wrapT = THREE.RepeatWrapping;
          loadedTex.repeat.set(4, 4); 
          loadedTex.colorSpace = THREE.SRGBColorSpace;
          setTexture(loadedTex);
        }
      },
      undefined,
      (err) => {
        console.warn(`Texture failed to load: ${url}`, err);
        if (isMounted) setHasError(true);
      }
    );

    return () => {
      isMounted = false;
    };
  }, [url]);
  
  const materialProps = {
    emissive: isSelected ? new THREE.Color('#4f46e5') : new THREE.Color('black'),
    emissiveIntensity: isSelected ? 0.2 : 0,
    roughness: 0.6, 
    metalness: 0.1,
    color: hasError || !texture ? (color || '#cccccc') : 'white' 
  };

  return (
    <meshStandardMaterial 
      {...materialProps}
      map={texture || undefined} 
    />
  );
};

// --- Smart Mesh Wrapper ---
interface SmartMeshProps {
  id: string;
  name?: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  args: any[];
  geometryType?: 'box' | 'plane' | 'cylinder';
  defaultColor?: string;
  onSelect: (mesh: THREE.Mesh) => void;
  selectedMeshId: string | null;
  appliedMaterials: Record<string, VendorProduct>;
  receiveShadow?: boolean;
  castShadow?: boolean;
  transparent?: boolean;
  opacity?: number;
}

const SmartMesh: React.FC<SmartMeshProps> = ({ 
  id, 
  name, 
  position, 
  rotation, 
  args, 
  geometryType = 'box',
  defaultColor = '#e5e5e5',
  onSelect,
  selectedMeshId,
  appliedMaterials,
  receiveShadow = true,
  castShadow = true,
  transparent = false,
  opacity = 1
}) => {
  
  const product = appliedMaterials[id];
  const isSelected = selectedMeshId === id;

  return (
    <mesh
      uuid={id}
      userData={{ name }}
      position={position}
      rotation={rotation}
      receiveShadow={receiveShadow}
      castShadow={castShadow}
      onClick={(e: any) => { e.stopPropagation(); onSelect(e.object as THREE.Mesh); }}
    >
      {geometryType === 'box' && <boxGeometry args={args as [number, number, number]} />}
      {geometryType === 'plane' && <planeGeometry args={args as [number, number]} />}
      {geometryType === 'cylinder' && <cylinderGeometry args={args as [number, number, number, number]} />}

      {product?.textureUrl ? (
        <MaterialWithTexture 
          key={`${id}-${product.id}`} 
          url={product.textureUrl} 
          isSelected={isSelected} 
        />
      ) : (
        <meshStandardMaterial 
          color={product?.color || defaultColor}
          roughness={0.5}
          metalness={0.1}
          emissive={isSelected ? '#4f46e5' : 'black'}
          emissiveIntensity={isSelected ? 0.2 : 0}
          transparent={transparent}
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  );
};

// --- Wall With Window Helper ---
const WallWithGap = (props: {
  idPrefix: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  width: number;
  height: number;
  depth: number;
  gapWidth: number;
  gapHeight: number;
  gapX: number;
  gapY: number;
  commonProps: any;
}) => {
  const { idPrefix, position, rotation, width, height, depth, gapWidth, gapHeight, gapX, gapY, commonProps } = props;

  const leftWidth = (width / 2) + gapX - (gapWidth / 2);
  const rightWidth = (width / 2) - gapX - (gapWidth / 2);
  const topHeight = height - (gapY + gapHeight);
  const bottomHeight = gapY;

  return (
    <group position={position} rotation={rotation}>
      {leftWidth > 0 && (
        <SmartMesh {...commonProps}
          id={`${idPrefix}-left`}
          position={[-(width/2) + (leftWidth/2), 0, 0]}
          args={[leftWidth, height, depth]}
          defaultColor="#f3f4f6"
        />
      )}
      {rightWidth > 0 && (
        <SmartMesh {...commonProps}
          id={`${idPrefix}-right`}
          position={[(width/2) - (rightWidth/2), 0, 0]}
          args={[rightWidth, height, depth]}
          defaultColor="#f3f4f6"
        />
      )}
      {topHeight > 0 && (
        <SmartMesh {...commonProps}
          id={`${idPrefix}-top`}
          position={[gapX, (height/2) - (topHeight/2), 0]}
          args={[gapWidth, topHeight, depth]}
          defaultColor="#f3f4f6"
        />
      )}
      {bottomHeight > 0 && (
        <SmartMesh {...commonProps}
          id={`${idPrefix}-bottom`}
          position={[gapX, -(height/2) + (bottomHeight/2), 0]}
          args={[gapWidth, bottomHeight, depth]}
          defaultColor="#f3f4f6"
        />
      )}
      
      {gapHeight > 1 && (
         <group position={[gapX, -(height/2) + gapY + (gapHeight/2), 0]}>
           <mesh>
             <boxGeometry args={[gapWidth - 0.1, gapHeight - 0.1, 0.05]} />
             <meshPhysicalMaterial color="#88ccff" transmission={0.9} opacity={0.5} metalness={0} roughness={0} transparent />
           </mesh>
           <mesh position={[0,0,0]}>
              <boxGeometry args={[0.05, gapHeight, depth + 0.02]} />
              <meshStandardMaterial color="#1f2937" />
           </mesh>
           <mesh position={[0,0,0]}>
              <boxGeometry args={[gapWidth, 0.05, depth + 0.02]} />
              <meshStandardMaterial color="#1f2937" />
           </mesh>
         </group>
      )}
    </group>
  );
};


// --- REALISTIC MODERN VILLA COMPONENT ---
const ModernVilla = ({ onSelect, selectedMeshId, appliedMaterials }: { 
  onSelect: (mesh: THREE.Mesh) => void;
  selectedMeshId: string | null;
  appliedMaterials: Record<string, VendorProduct>;
}) => {
  const commonProps = { onSelect, selectedMeshId, appliedMaterials };
  const floorHeight = 3;
  const wallThick = 0.25;

  return (
    <group>
      {/* GROUND FLOOR FLOORS */}
      <SmartMesh {...commonProps} id="floor-living" name="Living Room Floor" position={[0, 0.1, 2]} rotation={[-Math.PI / 2, 0, 0]} args={[8, 6]} geometryType="plane" defaultColor="#e5e5e5" />
      <SmartMesh {...commonProps} id="floor-kitchen" name="Kitchen Floor" position={[-6, 0.1, 2]} rotation={[-Math.PI / 2, 0, 0]} args={[4, 6]} geometryType="plane" defaultColor="#cbd5e1" />
      <SmartMesh {...commonProps} id="floor-dining" name="Dining Floor" position={[0, 0.1, -3]} rotation={[-Math.PI / 2, 0, 0]} args={[8, 4]} geometryType="plane" defaultColor="#d4d4d8" />

      {/* GROUND FLOOR WALLS */}
      <SmartMesh {...commonProps} id="wall-g-back" position={[0, floorHeight/2, -5]} args={[16, floorHeight, wallThick]} defaultColor="#f3f4f6" />
      <WallWithGap idPrefix="wall-g-front" position={[0, floorHeight/2, 5]} width={8} height={floorHeight} depth={wallThick} gapWidth={5} gapHeight={2.2} gapX={0} gapY={0} commonProps={commonProps} />
      <SmartMesh {...commonProps} id="wall-g-front-k" position={[-6, floorHeight/2, 5]} args={[4, floorHeight, wallThick]} defaultColor="#f3f4f6" />
      <SmartMesh {...commonProps} id="wall-g-right" position={[4, floorHeight/2, 0]} rotation={[0, Math.PI/2, 0]} args={[10, floorHeight, wallThick]} defaultColor="#f3f4f6" />
      <WallWithGap idPrefix="wall-g-left" position={[-8, floorHeight/2, 2]} rotation={[0, Math.PI/2, 0]} width={6} height={floorHeight} depth={wallThick} gapWidth={2.5} gapHeight={1.2} gapX={0} gapY={1.1} commonProps={commonProps} />
      <SmartMesh {...commonProps} id="wall-g-left-d" position={[-4, floorHeight/2, -3]} rotation={[0, Math.PI/2, 0]} args={[4, floorHeight, wallThick]} defaultColor="#f3f4f6" />
      <SmartMesh {...commonProps} id="wall-g-partition" position={[-4, floorHeight/2, -1]} args={[0.2, floorHeight, 4]} defaultColor="#e5e7eb" />

      {/* SECOND FLOOR */}
      <group position={[0, floorHeight, 0]}>
        <mesh position={[0, 0.1, 0]}><boxGeometry args={[16.2, 0.2, 10.2]} /><meshStandardMaterial color="#1f2937" /></mesh>
        <SmartMesh {...commonProps} id="floor-bed-master" name="Master Bedroom Floor" position={[2, 0.21, -1]} rotation={[-Math.PI / 2, 0, 0]} args={[6, 8]} geometryType="plane" defaultColor="#fcd34d" />
        <SmartMesh {...commonProps} id="floor-bath-master" name="Bathroom Floor" position={[-4, 0.21, -3]} rotation={[-Math.PI / 2, 0, 0]} args={[6, 4]} geometryType="plane" defaultColor="#fff" />
        <SmartMesh {...commonProps} id="floor-terrace" name="Terrace Floor" position={[-4, 0.21, 3]} rotation={[-Math.PI / 2, 0, 0]} args={[6, 4]} geometryType="plane" defaultColor="#94a3b8" />

        <SmartMesh {...commonProps} id="wall-u-bed-back" position={[2, floorHeight/2, -5]} args={[6, floorHeight, wallThick]} defaultColor="#fff" />
        <SmartMesh {...commonProps} id="wall-u-bed-right" position={[5, floorHeight/2, -1]} rotation={[0, Math.PI/2, 0]} args={[8, floorHeight, wallThick]} defaultColor="#fff" />
        <WallWithGap idPrefix="wall-u-bed-front" position={[2, floorHeight/2, 3]} width={6} height={floorHeight} depth={wallThick} gapWidth={3} gapHeight={2.2} gapX={0} gapY={0} commonProps={commonProps} />
        <SmartMesh {...commonProps} id="wall-u-bath-back" position={[-4, floorHeight/2, -5]} args={[6, floorHeight, wallThick]} defaultColor="#f0fdf4" />
        <SmartMesh {...commonProps} id="wall-u-bath-left" position={[-7, floorHeight/2, -3]} rotation={[0, Math.PI/2, 0]} args={[4, floorHeight, wallThick]} defaultColor="#f0fdf4" />
        <WallWithGap idPrefix="wall-u-bath-front" position={[-4, floorHeight/2, -1]} width={6} height={floorHeight} depth={wallThick} gapWidth={1} gapHeight={2} gapX={2} gapY={0} commonProps={commonProps} />
        <SmartMesh {...commonProps} id="wall-u-split" position={[-1, floorHeight/2, -3]} rotation={[0, Math.PI/2, 0]} args={[4, floorHeight, wallThick]} defaultColor="#fff" />

        {/* Railings */}
        <mesh position={[-4, 0.6, 5]}><boxGeometry args={[6, 1, 0.05]} /><meshPhysicalMaterial color="#88ccff" transmission={0.6} roughness={0.1} transparent /></mesh>
        <mesh position={[-7, 0.6, 3]} rotation={[0, Math.PI/2, 0]}><boxGeometry args={[4, 1, 0.05]} /><meshPhysicalMaterial color="#88ccff" transmission={0.6} roughness={0.1} transparent /></mesh>
        {/* Roof */}
        <group position={[0, floorHeight + 0.2, 0]}>
           <mesh position={[2, 0.1, -1]} receiveShadow><boxGeometry args={[8, 0.2, 10]} /><meshStandardMaterial color="#1e293b" roughness={0.9} /></mesh>
           <mesh position={[-4, 0.1, -3]} receiveShadow><boxGeometry args={[7, 0.2, 5]} /><meshStandardMaterial color="#1e293b" roughness={0.9} /></mesh>
           <mesh position={[2, 0.1, 3.5]}><boxGeometry args={[8, 0.1, 1]} /><meshStandardMaterial color="#334155" /></mesh>
        </group>
      </group>

      {/* STAIRS */}
      <group position={[0, 0, -1]}>
         {Array.from({length: 12}).map((_, i) => (
           <SmartMesh key={i} {...commonProps} id={`stairs-${i}`} name="Stairs" position={[2, i * 0.25, i * 0.25]} args={[1.2, 0.1, 0.3]} defaultColor="#475569" />
         ))}
         <mesh position={[2.65, 1.5, 1.5]} rotation={[0.8, 0, 0]}><cylinderGeometry args={[0.05, 0.05, 5]} /><meshStandardMaterial color="#000" /></mesh>
      </group>

      {/* FURNITURE */}
      <SmartMesh {...commonProps} id="kitchen-island-base" name="Kitchen Island" position={[-6, 0.5, 3]} args={[1.5, 1, 2.5]} defaultColor="#111827" />
      <mesh position={[-6, 1.05, 3]}><boxGeometry args={[1.6, 0.05, 2.6]} /><meshStandardMaterial color="#fff" roughness={0.1} /></mesh>

      <group position={[1, 0.3, 3]} rotation={[0, -Math.PI/2, 0]}>
         <SmartMesh {...commonProps} id="sofa-base" name="Sofa" position={[0,0.2,0]} args={[2.2, 0.4, 0.8]} defaultColor="#4b5563" />
         <mesh position={[0,0.6,-0.35]}><boxGeometry args={[2.2, 0.6, 0.1]} /><meshStandardMaterial color="#4b5563" /></mesh>
         <mesh position={[-1,0.4,0]}><boxGeometry args={[0.2, 0.6, 0.8]} /><meshStandardMaterial color="#4b5563" /></mesh>
         <mesh position={[1,0.4,0]}><boxGeometry args={[0.2, 0.6, 0.8]} /><meshStandardMaterial color="#4b5563" /></mesh>
      </group>

      <group position={[2, floorHeight + 0.3, -3]}>
         <SmartMesh {...commonProps} id="bed-base" name="Bed" position={[0,0.2,0]} args={[2, 0.4, 2.2]} defaultColor="#fff" />
         <mesh position={[0,0.6,-1]}><boxGeometry args={[2, 0.8, 0.1]} /><meshStandardMaterial color="#9ca3af" /></mesh>
      </group>

    </group>
  );
};

const UploadedModel = ({ url, onSelect, selectedMeshId, appliedMaterials }: { 
  url: string, 
  onSelect: (mesh: THREE.Mesh) => void,
  selectedMeshId: string | null,
  appliedMaterials: Record<string, VendorProduct>
}) => {
  const gltf = useLoader(GLTFLoader, url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf]);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData = child.userData || {};
        const product = appliedMaterials[child.uuid];

        if (product) {
           if (product.category === MaterialCategory.PAINT && product.color) {
             child.material = new THREE.MeshStandardMaterial({ 
               color: product.color,
               roughness: 0.5
             });
           } else if (product.category === MaterialCategory.TILES && product.textureUrl) {
              const loader = new THREE.TextureLoader();
              loader.setCrossOrigin('anonymous');
              loader.load(product.textureUrl, (texture) => {
                  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                  texture.repeat.set(4, 4);
                  texture.colorSpace = THREE.SRGBColorSpace;
                  child.material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6, color: 'white' });
                  child.material.needsUpdate = true;
                }, undefined, (err) => child.material = new THREE.MeshStandardMaterial({ color: '#e0e0e0' })
              );
           }
        }
        
        if (selectedMeshId === child.uuid) {
           if (child.material instanceof THREE.MeshStandardMaterial) {
             if (!child.userData.isClonedForHighlight) {
                child.material = child.material.clone();
                child.userData.isClonedForHighlight = true;
             }
             child.material.emissive = new THREE.Color('#4f46e5');
             child.material.emissiveIntensity = 0.3;
           }
        } else {
           if (child.material instanceof THREE.MeshStandardMaterial) {
             child.material.emissive = new THREE.Color('black');
             child.material.emissiveIntensity = 0;
           }
        }
      }
    });
  }, [scene, appliedMaterials, selectedMeshId]);

  return (
    <primitive 
      object={scene} 
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        let target = e.object;
        while(target && !(target instanceof THREE.Mesh) && target.parent) {
            target = target.parent;
        }
        if (target instanceof THREE.Mesh) {
           onSelect(target);
        }
      }} 
    />
  );
};

interface SceneProps {
  uploadedModelUrl: string | null;
  selectedMeshId: string | null;
  appliedMaterials: Record<string, VendorProduct>;
  onSelectObject: (mesh: THREE.Mesh) => void;
  canvasRef: React.RefObject<any>;
  viewMode: 'room' | 'tile' | 'wall';
  isNight: boolean;
}

const NightLighting = () => {
  return (
    <group>
       <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
       <pointLight position={[0, 2, 2]} intensity={0.8} color="#ffaa00" distance={8} decay={2} />
       <pointLight position={[-6, 2, 2]} intensity={0.8} color="#ffaa00" distance={6} decay={2} />
       <pointLight position={[2, 5, -1]} intensity={0.6} color="#aaaaff" distance={8} decay={2} />
    </group>
  )
}

export const DesignScene: React.FC<SceneProps> = ({ 
  uploadedModelUrl, 
  selectedMeshId, 
  appliedMaterials, 
  onSelectObject,
  canvasRef,
  viewMode,
  isNight
}) => {
  return (
    <Canvas 
      shadows 
      ref={canvasRef}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      camera={{ position: [15, 12, 15], fov: 40 }}
      className={`w-full h-full transition-colors duration-1000 ${isNight ? 'bg-gray-900' : 'bg-sky-50'}`}
    >
      <CameraHandler viewMode={viewMode} />
      <Suspense fallback={null}>
        
        {!isNight && (
          <>
            <Sky sunPosition={[100, 40, 100]} turbidity={0.5} rayleigh={0.5} />
            <Environment preset="apartment" background={false} />
            <ambientLight intensity={0.5} color="#ffffff" />
            <directionalLight 
              position={[20, 30, 10]} 
              intensity={1.5} 
              castShadow 
              shadow-mapSize={[2048, 2048]}
              shadow-bias={-0.0001}
            />
          </>
        )}

        {isNight && (
          <>
             <ambientLight intensity={0.1} color="#111133" />
             <NightLighting />
          </>
        )}

        <Stage environment={isNight ? null : "apartment"} intensity={isNight ? 0 : 0.3} adjustCamera={false} shadows={!isNight}>
          {uploadedModelUrl ? (
            <UploadedModel 
              url={uploadedModelUrl} 
              onSelect={onSelectObject} 
              selectedMeshId={selectedMeshId}
              appliedMaterials={appliedMaterials}
            />
          ) : (
            <ModernVilla 
              onSelect={onSelectObject} 
              selectedMeshId={selectedMeshId}
              appliedMaterials={appliedMaterials}
            />
          )}
        </Stage>
        
        {!isNight && <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={40} blur={2} far={4.5} />}
        
        {/* Ground Plane */}
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
           <planeGeometry args={[100, 100]} />
           <meshStandardMaterial color={isNight ? "#0f172a" : "#f0f9ff"} roughness={1} />
        </mesh>

      </Suspense>
      <OrbitControls 
        makeDefault 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2.1} 
        maxDistance={50}
      />
    </Canvas>
  );
};
