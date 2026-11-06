// frontend/src/components/DigitalFarmView.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Layers,
  Sprout,
  Warehouse,
  Package,
  Users,
  Droplet,
  Info,
  X,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import type { Farm, CropLot } from '../types';

export interface Selected3DObject {
  id: string;
  name: string;
  category: 'storage' | 'equipment' | 'labour' | 'irrigation' | 'crop' | 'land';
  quantity?: number;
  unit?: string;
  details: string;
  status: string;
}

interface DigitalFarmViewProps {
  farm: Farm;
  cropLots?: CropLot[];
  selectedResourceId?: string | null;
  onSelectResource?: (resourceId: string | null) => void;
}

export const DigitalFarmView: React.FC<DigitalFarmViewProps> = ({
  farm,
  cropLots = [],
  selectedResourceId,
  onSelectResource,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'isometric' | 'topdown'>('isometric');
  const [showResources, setShowResources] = useState(true);
  const [showCrops, setShowCrops] = useState(true);
  const [selectedObject, setSelectedObject] = useState<Selected3DObject | null>(null);
  const [isWebGLSupported, setIsWebGLSupported] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  // References for scene, camera, renderer, animation
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const interactiveMeshesRef = useRef<Array<{ mesh: THREE.Object3D; data: Selected3DObject }>>([]);
  const resourcesGroupRef = useRef<THREE.Group | null>(null);
  const cropsGroupRef = useRef<THREE.Group | null>(null);
  const selectionMarkerRef = useRef<THREE.Mesh | null>(null);

  // Camera Orbit drag control state
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const cameraPolarRef = useRef({
    radius: 36,
    theta: Math.PI / 4, // Horizontal angle (azimuth)
    phi: Math.PI / 3.2, // Vertical angle (elevation)
    target: new THREE.Vector3(0, 0, 0),
  });

  // Associated crop lot for this farm
  const activeCropLot = cropLots.find(
    (lot) => lot.farm_id === farm.id || lot.farm_id === '1a30d9c6-3e7f-409e-8a5b-ea4a7065c4a9'
  );

  // Helper to test WebGL support
  const checkWebGL = () => {
    try {
      const testCanvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (testCanvas.getContext('webgl2') || testCanvas.getContext('webgl'))
      );
    } catch {
      return false;
    }
  };

  // Update camera spherical position
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { radius, theta, phi, target } = cameraPolarRef.current;
    const sinPhi = Math.sin(phi);
    cameraRef.current.position.x = target.x + radius * sinPhi * Math.sin(theta);
    cameraRef.current.position.y = target.y + radius * Math.cos(phi);
    cameraRef.current.position.z = target.z + radius * sinPhi * Math.cos(theta);
    cameraRef.current.lookAt(target);
  }, []);

  // Reset Camera View
  const handleResetCamera = useCallback(() => {
    setViewMode('isometric');
    cameraPolarRef.current.radius = 36;
    cameraPolarRef.current.theta = Math.PI / 4;
    cameraPolarRef.current.phi = Math.PI / 3.2;
    cameraPolarRef.current.target.set(0, 0, 0);
    updateCameraPosition();
  }, [updateCameraPosition]);

  // Toggle Top-Down vs Isometric
  const handleToggleViewMode = () => {
    if (viewMode === 'isometric') {
      setViewMode('topdown');
      cameraPolarRef.current.radius = 38;
      cameraPolarRef.current.theta = 0;
      cameraPolarRef.current.phi = 0.05; // Almost straight down
      cameraPolarRef.current.target.set(0, 0, 0);
    } else {
      setViewMode('isometric');
      cameraPolarRef.current.radius = 36;
      cameraPolarRef.current.theta = Math.PI / 4;
      cameraPolarRef.current.phi = Math.PI / 3.2;
      cameraPolarRef.current.target.set(0, 0, 0);
    }
    updateCameraPosition();
  };

  // Synchronize selection with external selectedResourceId prop
  useEffect(() => {
    if (!selectedResourceId) {
      if (selectedObject && selectedObject.id.startsWith('res-')) {
        setSelectedObject(null);
      }
      return;
    }
    const found = interactiveMeshesRef.current.find((item) => item.data.id === selectedResourceId);
    if (found) {
      setSelectedObject(found.data);
      if (selectionMarkerRef.current) {
        selectionMarkerRef.current.position.set(
          found.mesh.position.x,
          found.mesh.position.y + 0.1,
          found.mesh.position.z
        );
        selectionMarkerRef.current.visible = true;
      }
    }
  }, [selectedResourceId]);

  // Toggle resources group visibility
  useEffect(() => {
    if (resourcesGroupRef.current) {
      resourcesGroupRef.current.visible = showResources;
    }
  }, [showResources]);

  // Toggle crops group visibility
  useEffect(() => {
    if (cropsGroupRef.current) {
      cropsGroupRef.current.visible = showCrops;
    }
  }, [showCrops]);

  // Initialize Three.js Scene
  useEffect(() => {
    const webglSupported = checkWebGL();
    if (!webglSupported) {
      setIsWebGLSupported(false);
      setIsLoading(false);
      return;
    }

    const container = mountRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 420;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f8fafc'); // Warm slate-50
    scene.fog = new THREE.FogExp2('#f8fafc', 0.012);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 500);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;
    } catch {
      setIsWebGLSupported(false);
      setIsLoading(false);
      return;
    }

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.65);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#f0fdf4', '#e2e8f0', 0.6);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#fffbeb', 1.25);
    sunLight.position.set(24, 38, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 120;
    const d = 26;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);

    // 5. Build Procedural Farm Geometry
    interactiveMeshesRef.current = [];

    // Master Farm Group
    const farmGroup = new THREE.Group();
    scene.add(farmGroup);

    // Area scaling factor (calculated based on land_area, e.g. 3.5 acres -> ~22 x 20 units)
    const baseArea = farm.land_area || 3.5;
    const plotWidth = Math.min(Math.max(16 + baseArea * 1.5, 18), 30);
    const plotLength = Math.min(Math.max(14 + baseArea * 1.4, 16), 26);

    // Base Terrain Slab (Sub-soil & Lush Grass Perimeter)
    const subSoilMat = new THREE.MeshLambertMaterial({ color: '#574130' }); // Earthy brown loam
    const grassMat = new THREE.MeshLambertMaterial({ color: '#3d7a46' }); // Rich agricultural green
    const bedSoilMat = new THREE.MeshLambertMaterial({ color: '#2b2118' }); // Fertile dark humus soil

    // Sub-soil block
    const subSoilGeom = new THREE.BoxGeometry(plotWidth + 4, 1.2, plotLength + 4);
    const subSoilMesh = new THREE.Mesh(subSoilGeom, subSoilMat);
    subSoilMesh.position.y = -0.6;
    subSoilMesh.receiveShadow = true;
    farmGroup.add(subSoilMesh);

    // Grass Top Layer
    const grassGeom = new THREE.BoxGeometry(plotWidth + 3.6, 0.2, plotLength + 3.6);
    const grassMesh = new THREE.Mesh(grassGeom, grassMat);
    grassMesh.position.y = 0.1;
    grassMesh.receiveShadow = true;
    farmGroup.add(grassMesh);

    // Farm Boundary Perimeter Trees
    const foliageMat1 = new THREE.MeshLambertMaterial({ color: '#15803d' });
    const foliageMat2 = new THREE.MeshLambertMaterial({ color: '#166534' });
    const trunkMat = new THREE.MeshLambertMaterial({ color: '#78350f' });

    const createTree = (x: number, z: number, scale = 1) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, 0.2, z);

      const trunkGeom = new THREE.CylinderGeometry(0.18 * scale, 0.25 * scale, 1.6 * scale, 6);
      const trunkMesh = new THREE.Mesh(trunkGeom, trunkMat);
      trunkMesh.position.y = 0.8 * scale;
      trunkMesh.castShadow = true;
      treeGroup.add(trunkMesh);

      const foliageGeom1 = new THREE.ConeGeometry(1.2 * scale, 2.2 * scale, 7);
      const foliageMesh1 = new THREE.Mesh(foliageGeom1, foliageMat1);
      foliageMesh1.position.y = 2.3 * scale;
      foliageMesh1.castShadow = true;
      treeGroup.add(foliageMesh1);

      const foliageGeom2 = new THREE.ConeGeometry(0.9 * scale, 1.6 * scale, 7);
      const foliageMesh2 = new THREE.Mesh(foliageGeom2, foliageMat2);
      foliageMesh2.position.y = 3.2 * scale;
      foliageMesh2.castShadow = true;
      treeGroup.add(foliageMesh2);

      farmGroup.add(treeGroup);
    };

    // Place perimeter trees at corners and edges
    createTree(-plotWidth / 2 - 0.5, -plotLength / 2 - 0.5, 1.1);
    createTree(-plotWidth / 2 - 0.6, plotLength / 2 + 0.3, 0.95);
    createTree(plotWidth / 2 + 0.5, -plotLength / 2 - 0.4, 1.05);
    createTree(plotWidth / 2 + 0.6, plotLength / 2 + 0.4, 1.2);
    createTree(plotWidth / 2 + 0.4, 0, 0.85);
    createTree(-plotWidth / 2 - 0.5, 3, 0.9);

    // Farm Access Pathway / Road (Gravel/Sandy trail)
    const roadMat = new THREE.MeshLambertMaterial({ color: '#d4b483' });
    const roadGeom = new THREE.BoxGeometry(3.2, 0.22, plotLength + 1);
    const roadMesh = new THREE.Mesh(roadGeom, roadMat);
    roadMesh.position.set(3, 0.12, 0);
    roadMesh.receiveShadow = true;
    farmGroup.add(roadMesh);

    // ─── CROPS GROUP ───
    const cropsGroup = new THREE.Group();
    farmGroup.add(cropsGroup);
    cropsGroupRef.current = cropsGroup;

    // Raised Cultivation Soil Beds (Main Crop Zone: West side of road)
    const fieldWidth = plotWidth / 2 - 2;
    const fieldLength = plotLength - 4;
    const cropBedGeom = new THREE.BoxGeometry(fieldWidth, 0.24, fieldLength);
    const cropBedMesh = new THREE.Mesh(cropBedGeom, bedSoilMat);
    cropBedMesh.position.set(-plotWidth / 4 - 0.5, 0.15, 0);
    cropBedMesh.receiveShadow = true;
    cropsGroup.add(cropBedMesh);

    // Register Crop Bed as Interactive Object
    const cropData: Selected3DObject = {
      id: 'crop-main-lot',
      name: activeCropLot?.crop_name
        ? `${activeCropLot.crop_name} (${activeCropLot.variety || 'Hybrid'})`
        : 'Tomato (Abhinav Hybrid Lot)',
      category: 'crop',
      quantity: activeCropLot?.quantity_kg_normalized || 4000,
      unit: 'kg',
      details: `${farm.land_area || 3.5} ${farm.land_area_unit || 'acre'} parcel cultivated with drip-irrigated table & processing tomato crop.`,
      status: activeCropLot?.status || 'READY_FOR_ANALYSIS',
    };
    interactiveMeshesRef.current.push({ mesh: cropBedMesh, data: cropData });

    // Procedural Crop Rows with Foliage and Fruit
    const plantMat = new THREE.MeshLambertMaterial({ color: '#2e7d32' });
    const fruitMat = new THREE.MeshLambertMaterial({ color: '#ef4444' }); // Red tomatoes
    const stakeMat = new THREE.MeshLambertMaterial({ color: '#a16207' });

    const numRows = 7;
    const rowSpacing = fieldLength / (numRows + 1);
    const plantsPerRow = 10;
    const plantSpacing = fieldWidth / (plantsPerRow + 1);

    for (let r = 0; r < numRows; r++) {
      const zPos = -fieldLength / 2 + (r + 1) * rowSpacing;

      // Bamboo trellis wire line
      const trellisGeom = new THREE.BoxGeometry(fieldWidth - 0.8, 0.05, 0.05);
      const trellisMesh = new THREE.Mesh(trellisGeom, stakeMat);
      trellisMesh.position.set(-plotWidth / 4 - 0.5, 1.1, zPos);
      cropsGroup.add(trellisMesh);

      // Trellis support stakes at ends and center
      [-fieldWidth / 2 + 0.6, 0, fieldWidth / 2 - 0.6].forEach((xOffset) => {
        const postGeom = new THREE.CylinderGeometry(0.04, 0.05, 1.2, 5);
        const postMesh = new THREE.Mesh(postGeom, stakeMat);
        postMesh.position.set(-plotWidth / 4 - 0.5 + xOffset, 0.7, zPos);
        cropsGroup.add(postMesh);
      });

      // Individual Tomato Vine bushes with fruit
      for (let p = 0; p < plantsPerRow; p++) {
        const xPos = -plotWidth / 4 - 0.5 - fieldWidth / 2 + (p + 1) * plantSpacing;

        // Bushy foliage
        const bushGeom = new THREE.DodecahedronGeometry(0.32, 1);
        const bushMesh = new THREE.Mesh(bushGeom, plantMat);
        bushMesh.position.set(xPos, 0.55, zPos);
        bushMesh.castShadow = true;
        cropsGroup.add(bushMesh);

        // Tomato fruit spheres
        if (p % 2 === 0) {
          const tomatoGeom = new THREE.SphereGeometry(0.09, 6, 6);
          const tomatoMesh = new THREE.Mesh(tomatoGeom, fruitMat);
          tomatoMesh.position.set(xPos + 0.12, 0.45, zPos + 0.18);
          cropsGroup.add(tomatoMesh);
        }
      }
    }

    // ─── RESOURCES GROUP ───
    const resourcesGroup = new THREE.Group();
    farmGroup.add(resourcesGroup);
    resourcesGroupRef.current = resourcesGroup;

    // A. Storage Shed (e.g. Shaded On-farm Shed 2 MT capacity)
    const storageRes = farm.resources?.find((r) => r.resource_type === 'storage') || {
      id: 'res-storage-demo',
      name: 'Shaded On-farm Shed (2 MT capacity)',
      resource_type: 'storage',
      quantity: 2000,
      unit: 'kg',
      availability_status: 'available',
    };

    const shedGroup = new THREE.Group();
    shedGroup.position.set(8.5, 0.2, -4);

    // Shed Base / Floor
    const shedFloorGeom = new THREE.BoxGeometry(4.8, 0.3, 4.2);
    const shedFloorMat = new THREE.MeshLambertMaterial({ color: '#94a3b8' }); // Concrete foundation
    const shedFloorMesh = new THREE.Mesh(shedFloorGeom, shedFloorMat);
    shedFloorMesh.position.y = 0.15;
    shedGroup.add(shedFloorMesh);

    // Shed Walls
    const wallMat = new THREE.MeshLambertMaterial({ color: '#78350f' }); // Treated wood timber
    const wallGeom = new THREE.BoxGeometry(4.4, 2.2, 3.8);
    const wallMesh = new THREE.Mesh(wallGeom, wallMat);
    wallMesh.position.y = 1.35;
    wallMesh.castShadow = true;
    shedGroup.add(wallMesh);

    // Shed Pitched Roof
    const roofMat = new THREE.MeshLambertMaterial({ color: '#991b1b' }); // Crimson corrugated metal roof
    const roofGeom = new THREE.ConeGeometry(3.6, 1.4, 4);
    const roofMesh = new THREE.Mesh(roofGeom, roofMat);
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.position.y = 3.0;
    roofMesh.scale.set(1.1, 0.9, 1.25);
    roofMesh.castShadow = true;
    shedGroup.add(roofMesh);

    // Shed Door Entrance (Open bay)
    const doorMat = new THREE.MeshLambertMaterial({ color: '#1e293b' });
    const doorGeom = new THREE.BoxGeometry(1.6, 1.7, 0.1);
    const doorMesh = new THREE.Mesh(doorGeom, doorMat);
    doorMesh.position.set(-0.8, 1.1, 1.95);
    shedGroup.add(doorMesh);

    resourcesGroup.add(shedGroup);

    // Register Shed as Interactive
    const shedData: Selected3DObject = {
      id: storageRes.id,
      name: storageRes.name,
      category: 'storage',
      quantity: storageRes.quantity,
      unit: storageRes.unit,
      details: 'On-farm ventilated storage structure with rated temperature stability and shade protection.',
      status: storageRes.availability_status || 'available',
    };
    interactiveMeshesRef.current.push({ mesh: wallMesh, data: shedData });
    interactiveMeshesRef.current.push({ mesh: roofMesh, data: shedData });

    // B. Harvesting Crates Pallet (Equipment)
    const equipRes = farm.resources?.find((r) => r.resource_type === 'equipment') || {
      id: 'res-equip-demo',
      name: 'Plastic Harvesting Crates (20 kg each)',
      resource_type: 'equipment',
      quantity: 80,
      unit: 'crates',
      availability_status: 'available',
    };

    const cratesGroup = new THREE.Group();
    cratesGroup.position.set(7.5, 0.2, 0.5);

    // Wooden Pallet
    const palletGeom = new THREE.BoxGeometry(2.4, 0.18, 2.0);
    const palletMat = new THREE.MeshLambertMaterial({ color: '#b45309' });
    const palletMesh = new THREE.Mesh(palletGeom, palletMat);
    palletMesh.position.y = 0.09;
    cratesGroup.add(palletMesh);

    // Stacked Plastic Crates (Blue & Red)
    const crateBlueMat = new THREE.MeshLambertMaterial({ color: '#0284c7' });
    const crateOrangeMat = new THREE.MeshLambertMaterial({ color: '#ea580c' });

    for (let cx = 0; cx < 2; cx++) {
      for (let cz = 0; cz < 2; cz++) {
        for (let cy = 0; cy < 3; cy++) {
          const crateGeom = new THREE.BoxGeometry(0.85, 0.45, 0.75);
          const cMat = (cx + cz + cy) % 2 === 0 ? crateBlueMat : crateOrangeMat;
          const crateMesh = new THREE.Mesh(crateGeom, cMat);
          crateMesh.position.set(
            -0.5 + cx * 1.0,
            0.4 + cy * 0.48,
            -0.45 + cz * 0.9
          );
          crateMesh.castShadow = true;
          cratesGroup.add(crateMesh);

          // Register top crate as interactive
          if (cy === 2 && cx === 0 && cz === 0) {
            const equipData: Selected3DObject = {
              id: equipRes.id,
              name: equipRes.name,
              category: 'equipment',
              quantity: equipRes.quantity,
              unit: equipRes.unit,
              details: 'Standard ventilated food-grade HDPE harvest crates (20 kg capacity each) ready for field transport.',
              status: equipRes.availability_status || 'available',
            };
            interactiveMeshesRef.current.push({ mesh: crateMesh, data: equipData });
          }
        }
      }
    }
    resourcesGroup.add(cratesGroup);

    // C. Labour Rest Shelter (Labour)
    const labourRes = farm.resources?.find((r) => r.resource_type === 'labour') || {
      id: 'res-labour-demo',
      name: 'Family + 2 Seasonal Labourers',
      resource_type: 'labour',
      quantity: 3,
      unit: 'persons',
      availability_status: 'available',
    };

    const shelterGroup = new THREE.Group();
    shelterGroup.position.set(8.2, 0.2, 5.2);

    // Shelter 4 poles
    const poleMat = new THREE.MeshLambertMaterial({ color: '#475569' });
    const poleOffsets = [
      [-1.2, -1.0],
      [1.2, -1.0],
      [-1.2, 1.0],
      [1.2, 1.0],
    ];
    poleOffsets.forEach(([px, pz]) => {
      const pGeom = new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6);
      const pMesh = new THREE.Mesh(pGeom, poleMat);
      pMesh.position.set(px, 0.9, pz);
      shelterGroup.add(pMesh);
    });

    // Shade Canopy Fabric
    const canopyMat = new THREE.MeshLambertMaterial({ color: '#059669' }); // Forest green shade cloth
    const canopyGeom = new THREE.BoxGeometry(2.8, 0.1, 2.4);
    const canopyMesh = new THREE.Mesh(canopyGeom, canopyMat);
    canopyMesh.position.y = 1.85;
    canopyMesh.castShadow = true;
    shelterGroup.add(canopyMesh);

    resourcesGroup.add(shelterGroup);

    // Register Shelter as Interactive
    const labourData: Selected3DObject = {
      id: labourRes.id,
      name: labourRes.name,
      category: 'labour',
      quantity: labourRes.quantity,
      unit: labourRes.unit,
      details: 'Registered skilled harvest and grading labour workforce mobilized for timely crop picking.',
      status: labourRes.availability_status || 'available',
    };
    interactiveMeshesRef.current.push({ mesh: canopyMesh, data: labourData });

    // D. Borewell & Water Irrigation Station
    const waterGroup = new THREE.Group();
    waterGroup.position.set(-plotWidth / 2 + 2, 0.2, plotLength / 2 - 2.5);

    // Concrete Tank
    const tankGeom = new THREE.CylinderGeometry(1.2, 1.3, 1.4, 16);
    const tankMat = new THREE.MeshLambertMaterial({ color: '#64748b' });
    const tankMesh = new THREE.Mesh(tankGeom, tankMat);
    tankMesh.position.y = 0.7;
    tankMesh.castShadow = true;
    waterGroup.add(tankMesh);

    // Water Surface Disc
    const waterGeom = new THREE.CylinderGeometry(1.15, 1.15, 0.05, 16);
    const waterMat = new THREE.MeshLambertMaterial({ color: '#0284c7' });
    const waterMesh = new THREE.Mesh(waterGeom, waterMat);
    waterMesh.position.y = 1.38;
    waterGroup.add(waterMesh);

    // Pump Housing Box
    const pumpGeom = new THREE.BoxGeometry(0.7, 0.8, 0.6);
    const pumpMat = new THREE.MeshLambertMaterial({ color: '#0f766e' });
    const pumpMesh = new THREE.Mesh(pumpGeom, pumpMat);
    pumpMesh.position.set(1.4, 0.4, 0);
    waterGroup.add(pumpMesh);

    resourcesGroup.add(waterGroup);

    // Register Water Station as Interactive
    const waterData: Selected3DObject = {
      id: 'infra-water-station',
      name: 'Farm Borewell & Drip Manifold',
      category: 'irrigation',
      quantity: 1,
      unit: 'facility',
      details: 'Active groundwater source connected to automated precision drip fertigation network.',
      status: 'operational',
    };
    interactiveMeshesRef.current.push({ mesh: tankMesh, data: waterData });

    // 6. Selection Highlight Ring Marker
    const ringGeom = new THREE.RingGeometry(1.8, 2.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#10b981',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const selectionRing = new THREE.Mesh(ringGeom, ringMat);
    selectionRing.rotation.x = -Math.PI / 2;
    selectionRing.position.y = 0.25;
    selectionRing.visible = false;
    scene.add(selectionRing);
    selectionMarkerRef.current = selectionRing;

    setIsLoading(false);

    // 7. Render Loop
    let isMounted = true;
    const animate = () => {
      if (!isMounted) return;
      animFrameRef.current = requestAnimationFrame(animate);

      // Subtle pulse on selection marker ring
      if (selectionMarkerRef.current && selectionMarkerRef.current.visible) {
        const time = Date.now() * 0.003;
        const scale = 1 + Math.sin(time) * 0.08;
        selectionMarkerRef.current.scale.set(scale, scale, 1);
      }

      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Cleanup on unmount or farm change
    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [farm, activeCropLot, updateCameraPosition]);

  // Pointer Drag & Orbit Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevPointerRef.current.x;
    const deltaY = e.clientY - prevPointerRef.current.y;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };

    // Update spherical coordinates
    cameraPolarRef.current.theta -= deltaX * 0.008;
    cameraPolarRef.current.phi = Math.max(
      0.15,
      Math.min(Math.PI / 2 - 0.05, cameraPolarRef.current.phi - deltaY * 0.008)
    );

    updateCameraPosition();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  // Wheel Zoom Handler
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.03;
    cameraPolarRef.current.radius = Math.max(
      16,
      Math.min(65, cameraPolarRef.current.radius + zoomDelta)
    );
    updateCameraPosition();
  };

  // Raycasting Click Handler to Select 3D Objects
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cameraRef.current || !rendererRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const candidates = interactiveMeshesRef.current.map((item) => item.mesh);
    const intersects = raycaster.intersectObjects(candidates, true);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      // Match with stored data
      const matched = interactiveMeshesRef.current.find(
        (item) => item.mesh === hitMesh || item.mesh.children.includes(hitMesh)
      );
      if (matched) {
        setSelectedObject(matched.data);
        if (onSelectResource) {
          onSelectResource(matched.data.id);
        }
        if (selectionMarkerRef.current) {
          selectionMarkerRef.current.position.set(
            matched.mesh.position.x,
            matched.mesh.position.y + 0.1,
            matched.mesh.position.z
          );
          selectionMarkerRef.current.visible = true;
        }
      }
    } else {
      // Clear selection if background clicked
      setSelectedObject(null);
      if (onSelectResource) onSelectResource(null);
      if (selectionMarkerRef.current) {
        selectionMarkerRef.current.visible = false;
      }
    }
  };

  // Category Icon Resolver
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'storage':
        return <Warehouse className="w-4 h-4 text-amber-600" />;
      case 'equipment':
        return <Package className="w-4 h-4 text-sky-600" />;
      case 'labour':
        return <Users className="w-4 h-4 text-emerald-600" />;
      case 'irrigation':
        return <Droplet className="w-4 h-4 text-blue-600" />;
      case 'crop':
        return <Sprout className="w-4 h-4 text-emerald-700" />;
      default:
        return <Layers className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div
      className={`relative rounded-3xl bg-slate-900 overflow-hidden border border-slate-800 shadow-xl transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl' : 'w-full h-80 sm:h-96 lg:h-[460px]'
      }`}
      ref={mountRef}
    >
      {/* 3D WebGL Canvas or Fallback */}
      {isWebGLSupported ? (
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing touch-none block"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
        />
      ) : (
        /* Fallback 2D Isometric Schematic Canvas */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-white">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
            <Compass className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">Interactive 2D Land Schematic</h4>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            WebGL acceleration is inactive in this browser session. Showing verified farm parcel configuration for{' '}
            <span className="text-emerald-400 font-semibold">{farm.farm_name}</span>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl w-full text-left">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Area</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {farm.land_area} {farm.land_area_unit}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Crop</span>
              <span className="text-sm font-bold text-white truncate block">
                {activeCropLot?.crop_name || 'Tomato'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Resources</span>
              <span className="text-sm font-bold text-sky-400 font-mono">
                {farm.resources?.length || 0} Registered
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Location</span>
              <span className="text-sm font-bold text-white truncate block">{farm.village}</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && isWebGLSupported && (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3 text-emerald-400 z-10">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold tracking-wide">Constructing 3D Digital Farm Twin...</span>
        </div>
      )}

      {/* Top Floating Badge: Truthful Disclosure Banner */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-20 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-semibold text-slate-300 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-bold text-white">{farm.farm_name}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 truncate">
            {farm.land_area ? `${farm.land_area} ${farm.land_area_unit}` : 'Registered Area'}
          </span>
          <span className="hidden md:inline text-slate-500">•</span>
          <span className="hidden md:inline text-amber-400/90 text-[10px]">
            Illustrative Digital Model (Not a surveyed land boundary)
          </span>
        </div>
      </div>

      {/* Top-Right Interactive Control Toolbar */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-lg">
        {/* Reset Camera Button */}
        <button
          type="button"
          onClick={handleResetCamera}
          title="Reset Camera View"
          className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* View Mode Switcher (Isometric vs Top-Down) */}
        <button
          type="button"
          onClick={handleToggleViewMode}
          title={viewMode === 'isometric' ? 'Switch to Top-Down 2D Map' : 'Switch to Isometric 3D'}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
            viewMode === 'topdown'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{viewMode === 'isometric' ? '3D Iso' : 'Top-Down'}</span>
        </button>

        <div className="w-px h-4 bg-slate-700 mx-0.5" />

        {/* Toggle Resources */}
        <button
          type="button"
          onClick={() => setShowResources(!showResources)}
          title="Toggle Infrastructure & Resources"
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            showResources ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Warehouse className="w-4 h-4" />
        </button>

        {/* Toggle Crops */}
        <button
          type="button"
          onClick={() => setShowCrops(!showCrops)}
          title="Toggle Cultivated Crops"
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            showCrops ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sprout className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen' : 'Expand View'}
          className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Contextual Object Information Drawer / Card */}
      {selectedObject && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-20 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 shadow-2xl text-white">
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
                  {getCategoryIcon(selectedObject.category)}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                    {selectedObject.name}
                  </h4>
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">
                    {selectedObject.category}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedObject(null);
                  if (onSelectResource) onSelectResource(null);
                  if (selectionMarkerRef.current) selectionMarkerRef.current.visible = false;
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedObject.details}</p>

            <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800/80 text-[11px]">
              {selectedObject.quantity ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Capacity / Count:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {selectedObject.quantity.toLocaleString('en-IN')} {selectedObject.unit}
                  </span>
                </div>
              ) : (
                <div className="text-slate-400 text-[10px]">Verified Infrastructure Record</div>
              )}

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>{selectedObject.status}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom-Right Hint */}
      {!selectedObject && (
        <div className="absolute bottom-3 right-3 z-10 pointer-events-none hidden sm:block">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-xs border border-slate-800 text-[10px] font-medium text-slate-400 shadow-sm flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Click any shed, crate pallet, or crop bed to inspect verified details</span>
          </div>
        </div>
      )}
    </div>
  );
};
