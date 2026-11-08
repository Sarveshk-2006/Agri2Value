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
  MapPin,
  Pencil,
  Save,
  Trash2,
  Undo2,
  Sparkles,
  Download,
  ShieldCheck,
  Grid,
} from 'lucide-react';
import type { Farm, CropLot } from '../types';
import { calculatePolygonMetrics, generateInitialBoundary, type PolygonMetrics } from '../services/geocoding';

export interface Selected3DObject {
  id: string;
  name: string;
  category: 'storage' | 'equipment' | 'labour' | 'irrigation' | 'crop' | 'land' | 'boundary';
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
  onSaveBoundary?: (geojsonStr: string) => Promise<void> | void;
  onOpenEditModal?: () => void;
}

export const DigitalFarmView: React.FC<DigitalFarmViewProps> = ({
  farm,
  cropLots = [],
  selectedResourceId,
  onSelectResource,
  onSaveBoundary,
  onOpenEditModal: _onOpenEditModal,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // View & Camera States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'isometric' | 'topdown'>('isometric');
  const [showResources, setShowResources] = useState(true);
  const [showCrops, setShowCrops] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [showContours, setShowContours] = useState(false);
  const [selectedObject, setSelectedObject] = useState<Selected3DObject | null>(null);
  const [isWebGLSupported, setIsWebGLSupported] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  // Boundary Drawing State
  const [boundaryMode, setBoundaryMode] = useState<'view' | 'draw'>('view');
  // Coords in [lon, lat] format
  const [boundaryCoords, setBoundaryCoords] = useState<Array<[number, number]>>([]);
  const [boundaryMetrics, setBoundaryMetrics] = useState<PolygonMetrics | null>(null);
  const [isSavingBoundary, setIsSavingBoundary] = useState(false);
  const [boundarySaveSuccess, setBoundarySaveSuccess] = useState(false);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const interactiveMeshesRef = useRef<Array<{ mesh: THREE.Object3D; data: Selected3DObject }>>([]);
  const resourcesGroupRef = useRef<THREE.Group | null>(null);
  const cropsGroupRef = useRef<THREE.Group | null>(null);
  const boundaryGroupRef = useRef<THREE.Group | null>(null);
  const contoursGroupRef = useRef<THREE.Group | null>(null);
  const selectionMarkerRef = useRef<THREE.Mesh | null>(null);

  // Raycasting ground plane
  const groundPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.2));

  // Camera Orbit Drag State
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const cameraPolarRef = useRef({
    radius: 36,
    theta: Math.PI / 4,
    phi: Math.PI / 3.2,
    target: new THREE.Vector3(0, 0, 0),
  });

  // Reference coordinates for scaling: center of farm
  const centerLat = farm.latitude || 20.0768;
  const centerLon = farm.longitude || 74.0375;
  const registeredAcres = farm.land_area || 3.5;

  // Conversion: 1 Three.js unit = 5 meters
  const metersPerUnit = 5;
  const latRad = centerLat * (Math.PI / 180);
  const metersPerDegLat = 111132.0;
  const metersPerDegLon = 111320.0 * Math.cos(latRad);

  // Helper: Convert [lon, lat] to Three.js (x, z)
  const geoToWorld = useCallback(
    (lon: number, lat: number): [number, number] => {
      const dLon = lon - centerLon;
      const dLat = lat - centerLat;
      const xMeters = dLon * metersPerDegLon;
      const zMeters = -dLat * metersPerDegLat; // -z is North
      return [xMeters / metersPerUnit, zMeters / metersPerUnit];
    },
    [centerLat, centerLon, metersPerDegLat, metersPerDegLon]
  );

  // Helper: Convert Three.js (x, z) to [lon, lat]
  const worldToGeo = useCallback(
    (x: number, z: number): [number, number] => {
      const xMeters = x * metersPerUnit;
      const zMeters = -z * metersPerUnit;
      const lon = centerLon + xMeters / metersPerDegLon;
      const lat = centerLat + zMeters / metersPerDegLat;
      return [Number(lon.toFixed(6)), Number(lat.toFixed(6))];
    },
    [centerLat, centerLon, metersPerDegLat, metersPerDegLon]
  );

  // Associated crop lot for this farm
  const activeCropLot = cropLots.find(
    (lot) => lot.farm_id === farm.id || lot.farm_id === '1a30d9c6-3e7f-409e-8a5b-ea4a7065c4a9'
  );

  // Initialize boundary coords from farm profile
  useEffect(() => {
    if (farm.boundary_geojson) {
      try {
        const parsed = JSON.parse(farm.boundary_geojson);
        if (parsed.coordinates && Array.isArray(parsed.coordinates[0])) {
          const coords = parsed.coordinates[0] as Array<[number, number]>;
          setBoundaryCoords(coords);
          setBoundaryMetrics(calculatePolygonMetrics(coords));
          return;
        }
      } catch {
        // Fallback
      }
    }

    // If no boundary yet, generate initial boundary matching registered area
    const initial = generateInitialBoundary(centerLat, centerLon, registeredAcres);
    setBoundaryCoords(initial);
    setBoundaryMetrics(calculatePolygonMetrics(initial));
  }, [farm.boundary_geojson, centerLat, centerLon, registeredAcres]);

  // Recalculate metrics when boundary coordinates change
  useEffect(() => {
    if (boundaryCoords.length >= 3) {
      setBoundaryMetrics(calculatePolygonMetrics(boundaryCoords));
    }
  }, [boundaryCoords]);

  // Test WebGL support
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
      cameraPolarRef.current.phi = 0.05; // Straight down
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

  // Re-draw boundary in 3D scene whenever boundaryCoords changes
  const update3DBoundaryMesh = useCallback(() => {
    const boundaryGroup = boundaryGroupRef.current;
    if (!boundaryGroup) return;

    // Clear existing boundary objects
    while (boundaryGroup.children.length > 0) {
      const child = boundaryGroup.children[0];
      boundaryGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
    }

    if (boundaryCoords.length < 3) return;

    // Convert coords to world (x, z)
    const points2D = boundaryCoords.map(([lon, lat]) => geoToWorld(lon, lat));

    // A. 3D Line Loop for Boundary Fence
    const linePoints: THREE.Vector3[] = points2D.map(([x, z]) => new THREE.Vector3(x, 0.28, z));
    const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: '#10b981',
      linewidth: 3,
    });
    const lineMesh = new THREE.LineLoop(lineGeom, lineMat);
    boundaryGroup.add(lineMesh);

    // B. Semi-transparent polygon fill on top of terrain
    const shape = new THREE.Shape();
    shape.moveTo(points2D[0][0], -points2D[0][1]);
    for (let i = 1; i < points2D.length; i++) {
      shape.lineTo(points2D[i][0], -points2D[i][1]);
    }
    shape.closePath();

    const shapeGeom = new THREE.ShapeGeometry(shape);
    const shapeMat = new THREE.MeshBasicMaterial({
      color: '#10b981',
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const shapeMesh = new THREE.Mesh(shapeGeom, shapeMat);
    shapeMesh.rotation.x = -Math.PI / 2;
    shapeMesh.position.y = 0.24;
    boundaryGroup.add(shapeMesh);

    // C. 3D Boundary Corner Posts (Extruded Pillars)
    const postMat = new THREE.MeshLambertMaterial({ color: '#047857' });
    const postBeaconMat = new THREE.MeshBasicMaterial({ color: '#34d399' });

    points2D.forEach(([x, z], idx) => {
      // Wood/Concrete post
      const postGeom = new THREE.CylinderGeometry(0.18, 0.2, 1.4, 8);
      const postMesh = new THREE.Mesh(postGeom, postMat);
      postMesh.position.set(x, 0.9, z);
      postMesh.castShadow = true;
      boundaryGroup.add(postMesh);

      // Glowing beacon cap on top of post
      const beaconGeom = new THREE.SphereGeometry(0.24, 12, 12);
      const beaconMesh = new THREE.Mesh(beaconGeom, postBeaconMat);
      beaconMesh.position.set(x, 1.7, z);
      boundaryGroup.add(beaconMesh);

      // Register post as interactive boundary node
      const nodeData: Selected3DObject = {
        id: `boundary-node-${idx}`,
        name: `Boundary Landmark #${idx + 1}`,
        category: 'boundary',
        details: `Geodesic Vertex at [${boundaryCoords[idx]?.[1]?.toFixed(5)}°N, ${boundaryCoords[idx]?.[0]?.toFixed(5)}°E]. Part of verified perimeter polygon.`,
        status: 'VERIFIED GEO-TAG',
      };
      interactiveMeshesRef.current.push({ mesh: beaconMesh, data: nodeData });
    });
  }, [boundaryCoords, geoToWorld]);

  // Synchronize 3D Boundary whenever coords or farm changes
  useEffect(() => {
    update3DBoundaryMesh();
  }, [update3DBoundaryMesh]);

  // Toggle groups visibility
  useEffect(() => {
    if (resourcesGroupRef.current) resourcesGroupRef.current.visible = showResources;
  }, [showResources]);

  useEffect(() => {
    if (cropsGroupRef.current) cropsGroupRef.current.visible = showCrops;
  }, [showCrops]);

  useEffect(() => {
    if (boundaryGroupRef.current) boundaryGroupRef.current.visible = showBoundary;
  }, [showBoundary]);

  useEffect(() => {
    if (contoursGroupRef.current) contoursGroupRef.current.visible = showContours;
  }, [showContours]);

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
    const height = container.clientHeight || 460;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a'); // Sophisticated Slate-900 ambiance
    scene.fog = new THREE.FogExp2('#0f172a', 0.012);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 600);
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
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.7);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#f0fdf4', '#1e293b', 0.65);
    hemiLight.position.set(0, 60, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#fffbeb', 1.4);
    sunLight.position.set(28, 42, 22);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 140;
    const d = 30;
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

    // Area scaling factor (calculated based on land_area, e.g. 3.5 acres -> ~24 x 22 units)
    const baseArea = farm.land_area || 3.5;
    const plotWidth = Math.min(Math.max(18 + baseArea * 1.5, 20), 34);
    const plotLength = Math.min(Math.max(16 + baseArea * 1.4, 18), 30);

    // Base Terrain Slab (Sub-soil & Fertile Soil Top)
    const subSoilMat = new THREE.MeshLambertMaterial({ color: '#3e2723' });
    const grassMat = new THREE.MeshLambertMaterial({ color: '#2d6a4f' });
    const bedSoilMat = new THREE.MeshLambertMaterial({ color: '#1b140e' });

    // Sub-soil block
    const subSoilGeom = new THREE.BoxGeometry(plotWidth + 4, 1.4, plotLength + 4);
    const subSoilMesh = new THREE.Mesh(subSoilGeom, subSoilMat);
    subSoilMesh.position.y = -0.7;
    subSoilMesh.receiveShadow = true;
    farmGroup.add(subSoilMesh);

    // Grass Top Layer
    const grassGeom = new THREE.BoxGeometry(plotWidth + 3.8, 0.2, plotLength + 3.8);
    const grassMesh = new THREE.Mesh(grassGeom, grassMat);
    grassMesh.position.y = 0.1;
    grassMesh.receiveShadow = true;
    farmGroup.add(grassMesh);

    // ─── CONTOURS & GRID GROUP ───
    const contoursGroup = new THREE.Group();
    contoursGroup.visible = false;
    contoursGroupRef.current = contoursGroup;
    farmGroup.add(contoursGroup);

    // 1-meter elevation contour grid lines
    const gridHelper = new THREE.GridHelper(plotWidth + 2, 16, '#10b981', '#334155');
    gridHelper.position.y = 0.22;
    contoursGroup.add(gridHelper);

    // Farm Boundary Trees
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

    createTree(-plotWidth / 2 - 0.5, -plotLength / 2 - 0.5, 1.1);
    createTree(-plotWidth / 2 - 0.6, plotLength / 2 + 0.3, 0.95);
    createTree(plotWidth / 2 + 0.5, -plotLength / 2 - 0.4, 1.05);
    createTree(plotWidth / 2 + 0.6, plotLength / 2 + 0.4, 1.2);
    createTree(plotWidth / 2 + 0.4, 0, 0.85);
    createTree(-plotWidth / 2 - 0.5, 3, 0.9);

    // Farm Access Road / Tractor Path
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

    // Main Crop Bed (West side)
    const fieldWidth = plotWidth / 2 - 2;
    const fieldLength = plotLength - 4;
    const cropBedGeom = new THREE.BoxGeometry(fieldWidth, 0.24, fieldLength);
    const cropBedMesh = new THREE.Mesh(cropBedGeom, bedSoilMat);
    cropBedMesh.position.set(-plotWidth / 4 - 0.5, 0.15, 0);
    cropBedMesh.receiveShadow = true;
    cropsGroup.add(cropBedMesh);

    // Interactive Crop Bed
    const cropData: Selected3DObject = {
      id: 'crop-main-lot',
      name: activeCropLot?.crop_name
        ? `${activeCropLot.crop_name} (${activeCropLot.variety || 'Hybrid'})`
        : 'Tomato (Abhinav Hybrid Lot)',
      category: 'crop',
      quantity: activeCropLot?.quantity_kg_normalized || 4000,
      unit: 'kg',
      details: `${farm.land_area || 3.5} ${farm.land_area_unit || 'acre'} parcel cultivated with drip-irrigated commercial table & processing crop.`,
      status: activeCropLot?.status || 'READY_FOR_ANALYSIS',
    };
    interactiveMeshesRef.current.push({ mesh: cropBedMesh, data: cropData });

    // Procedural Crop Rows with Foliage and Fruit
    const plantMat = new THREE.MeshLambertMaterial({ color: '#2e7d32' });
    const fruitMat = new THREE.MeshLambertMaterial({ color: '#ef4444' });
    const stakeMat = new THREE.MeshLambertMaterial({ color: '#a16207' });

    const numRows = 7;
    const rowSpacing = fieldLength / (numRows + 1);
    const plantsPerRow = 10;
    const plantSpacing = fieldWidth / (plantsPerRow + 1);

    for (let r = 0; r < numRows; r++) {
      const zPos = -fieldLength / 2 + (r + 1) * rowSpacing;

      // Wooden trellising wire
      const wireGeom = new THREE.CylinderGeometry(0.02, 0.02, fieldWidth - 0.8);
      const wireMesh = new THREE.Mesh(wireGeom, stakeMat);
      wireMesh.rotation.z = Math.PI / 2;
      wireMesh.position.set(-plotWidth / 4 - 0.5, 1.2, zPos);
      cropsGroup.add(wireMesh);

      for (let p = 0; p < plantsPerRow; p++) {
        const xPos = -plotWidth / 4 - 0.5 - fieldWidth / 2 + (p + 1) * plantSpacing;

        // Support stake
        const stakeGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 5);
        const stakeMesh = new THREE.Mesh(stakeGeom, stakeMat);
        stakeMesh.position.set(xPos, 0.8, zPos);
        cropsGroup.add(stakeMesh);

        // Tomato Bush Cluster
        const bushGeom = new THREE.SphereGeometry(0.38, 7, 7);
        const bushMesh = new THREE.Mesh(bushGeom, plantMat);
        bushMesh.position.set(xPos, 0.7, zPos);
        bushMesh.castShadow = true;
        cropsGroup.add(bushMesh);

        // Ripe Tomatoes
        const fruitGeom = new THREE.SphereGeometry(0.12, 6, 6);
        const fruit1 = new THREE.Mesh(fruitGeom, fruitMat);
        fruit1.position.set(xPos + 0.18, 0.55, zPos + 0.12);
        cropsGroup.add(fruit1);

        const fruit2 = new THREE.Mesh(fruitGeom, fruitMat);
        fruit2.position.set(xPos - 0.16, 0.45, zPos - 0.14);
        cropsGroup.add(fruit2);
      }
    }

    // ─── RESOURCES GROUP ───
    const resourcesGroup = new THREE.Group();
    farmGroup.add(resourcesGroup);
    resourcesGroupRef.current = resourcesGroup;

    // A. Shaded On-Farm Shed (Storage)
    const storageRes = farm.resources?.find((r) => r.resource_type === 'storage') || {
      id: 'res-1',
      name: 'Shaded On-farm Shed (2 MT capacity)',
      resource_type: 'storage',
      quantity: 2000,
      unit: 'kg',
      availability_status: 'available',
    };

    const shedGroup = new THREE.Group();
    shedGroup.position.set(8.5, 0.2, -5.5);

    // Shed Concrete Plinth
    const plinthGeom = new THREE.BoxGeometry(5.2, 0.3, 4.4);
    const plinthMat = new THREE.MeshLambertMaterial({ color: '#94a3b8' });
    const plinthMesh = new THREE.Mesh(plinthGeom, plinthMat);
    plinthMesh.position.y = 0.15;
    plinthMesh.receiveShadow = true;
    shedGroup.add(plinthMesh);

    // Shed Walls
    const wallGeom = new THREE.BoxGeometry(4.8, 2.2, 4.0);
    const wallMat = new THREE.MeshLambertMaterial({ color: '#e2e8f0' });
    const wallMesh = new THREE.Mesh(wallGeom, wallMat);
    wallMesh.position.y = 1.4;
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    shedGroup.add(wallMesh);

    // Corrugated Gable Roof
    const roofGeom = new THREE.ConeGeometry(3.6, 1.2, 4);
    const roofMat = new THREE.MeshLambertMaterial({ color: '#047857' });
    const roofMesh = new THREE.Mesh(roofGeom, roofMat);
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.position.y = 3.1;
    roofMesh.castShadow = true;
    shedGroup.add(roofMesh);

    resourcesGroup.add(shedGroup);

    // Interactive Shed
    const shedData: Selected3DObject = {
      id: storageRes.id,
      name: storageRes.name,
      category: 'storage',
      quantity: storageRes.quantity,
      unit: storageRes.unit,
      details: 'Well-ventilated dry covered structure protecting harvested produce from direct sun exposure and sudden rainfall.',
      status: storageRes.availability_status || 'available',
    };
    interactiveMeshesRef.current.push({ mesh: wallMesh, data: shedData });

    // B. Harvest Crates Stacks (Equipment)
    const equipRes = farm.resources?.find((r) => r.resource_type === 'equipment') || {
      id: 'res-2',
      name: 'Plastic Harvesting Crates (20 kg each)',
      resource_type: 'equipment',
      quantity: 80,
      unit: 'crates',
      availability_status: 'available',
    };

    const cratesGroup = new THREE.Group();
    cratesGroup.position.set(8.5, 0.2, -0.5);

    const crateMat = new THREE.MeshLambertMaterial({ color: '#0284c7' });
    const crateGeom = new THREE.BoxGeometry(0.9, 0.5, 0.65);

    for (let cx = 0; cx < 3; cx++) {
      for (let cz = 0; cz < 2; cz++) {
        for (let cy = 0; cy < 3; cy++) {
          const crateMesh = new THREE.Mesh(crateGeom, crateMat);
          crateMesh.position.set(cx * 1.05 - 1.0, cy * 0.55 + 0.28, cz * 0.8 - 0.4);
          crateMesh.castShadow = true;
          crateMesh.receiveShadow = true;
          cratesGroup.add(crateMesh);

          if (cx === 1 && cy === 2 && cz === 0) {
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
      id: 'res-3',
      name: 'Family + 2 Seasonal Labourers',
      resource_type: 'labour',
      quantity: 3,
      unit: 'persons',
      availability_status: 'available',
    };

    const shelterGroup = new THREE.Group();
    shelterGroup.position.set(8.2, 0.2, 5.2);

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

    const canopyMat = new THREE.MeshLambertMaterial({ color: '#059669' });
    const canopyGeom = new THREE.BoxGeometry(2.8, 0.1, 2.4);
    const canopyMesh = new THREE.Mesh(canopyGeom, canopyMat);
    canopyMesh.position.y = 1.85;
    canopyMesh.castShadow = true;
    shelterGroup.add(canopyMesh);

    resourcesGroup.add(shelterGroup);

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

    const tankGeom = new THREE.CylinderGeometry(1.2, 1.3, 1.4, 16);
    const tankMat = new THREE.MeshLambertMaterial({ color: '#64748b' });
    const tankMesh = new THREE.Mesh(tankGeom, tankMat);
    tankMesh.position.y = 0.7;
    tankMesh.castShadow = true;
    waterGroup.add(tankMesh);

    const waterGeom = new THREE.CylinderGeometry(1.15, 1.15, 0.05, 16);
    const waterMat = new THREE.MeshLambertMaterial({ color: '#0284c7' });
    const waterMesh = new THREE.Mesh(waterGeom, waterMat);
    waterMesh.position.y = 1.38;
    waterGroup.add(waterMesh);

    const pumpGeom = new THREE.BoxGeometry(0.7, 0.8, 0.6);
    const pumpMat = new THREE.MeshLambertMaterial({ color: '#0f766e' });
    const pumpMesh = new THREE.Mesh(pumpGeom, pumpMat);
    pumpMesh.position.set(1.4, 0.4, 0);
    waterGroup.add(pumpMesh);

    resourcesGroup.add(waterGroup);

    const waterData: Selected3DObject = {
      id: 'infra-water-station',
      name: 'Farm Borewell & Precision Drip Manifold',
      category: 'irrigation',
      quantity: 1,
      unit: 'facility',
      details: 'Active groundwater source connected to automated precision drip fertigation network with solar pumping.',
      status: 'operational',
    };
    interactiveMeshesRef.current.push({ mesh: tankMesh, data: waterData });

    // ─── BOUNDARY GROUP ───
    const boundaryGroup = new THREE.Group();
    farmGroup.add(boundaryGroup);
    boundaryGroupRef.current = boundaryGroup;

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

    // Initial 3D boundary render
    update3DBoundaryMesh();

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

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      scene.clear();
    };
  }, [farm, activeCropLot, updateCameraPosition, update3DBoundaryMesh]);

  // Pointer Orbit Drag Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (boundaryMode === 'draw') return; // Don't orbit while drawing
    isDraggingRef.current = true;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevPointerRef.current.x;
    const deltaY = e.clientY - prevPointerRef.current.y;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };

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
      Math.min(75, cameraPolarRef.current.radius + zoomDelta)
    );
    updateCameraPosition();
  };

  // Canvas Click Handler: Handles Object Selection OR Boundary Point Placement
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cameraRef.current || !rendererRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    // MODE 1: BOUNDARY DRAWING MODE
    if (boundaryMode === 'draw') {
      const intersectPoint = new THREE.Vector3();
      const hit = raycaster.ray.intersectPlane(groundPlaneRef.current, intersectPoint);
      if (hit) {
        // Convert Three.js (x, z) to [lon, lat]
        const [lon, lat] = worldToGeo(intersectPoint.x, intersectPoint.z);

        // Append new point
        const updated = [...boundaryCoords, [lon, lat] as [number, number]];
        setBoundaryCoords(updated);
      }
      return;
    }

    // MODE 2: INSPECTION MODE (Select Objects)
    const candidates = interactiveMeshesRef.current.map((item) => item.mesh);
    const intersects = raycaster.intersectObjects(candidates, true);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const matched = interactiveMeshesRef.current.find(
        (item) => item.mesh === hitMesh || item.mesh.children.includes(hitMesh)
      );
      if (matched) {
        setSelectedObject(matched.data);
        if (onSelectResource) onSelectResource(matched.data.id);
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
      setSelectedObject(null);
      if (onSelectResource) onSelectResource(null);
      if (selectionMarkerRef.current) selectionMarkerRef.current.visible = false;
    }
  };

  // Boundary Tool Actions
  const handleAutoGenerateBoundary = () => {
    const generated = generateInitialBoundary(centerLat, centerLon, registeredAcres);
    setBoundaryCoords(generated);
  };

  const handleUndoBoundaryPoint = () => {
    if (boundaryCoords.length > 0) {
      setBoundaryCoords(boundaryCoords.slice(0, -1));
    }
  };

  const handleClearBoundary = () => {
    setBoundaryCoords([]);
    setBoundaryMetrics(null);
  };

  const handleSaveBoundary = async () => {
    if (boundaryCoords.length < 3) return;
    setIsSavingBoundary(true);

    // Ensure closing vertex matches starting vertex for strict GeoJSON specification
    const ring = [...boundaryCoords];
    if (
      ring.length > 2 &&
      (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])
    ) {
      ring.push(ring[0]);
    }

    const geojson = JSON.stringify({
      type: 'Polygon',
      coordinates: [ring],
    });

    try {
      if (onSaveBoundary) {
        await onSaveBoundary(geojson);
      }
      setBoundarySaveSuccess(true);
      setBoundaryMode('view');
      setTimeout(() => setBoundarySaveSuccess(false), 3500);
    } catch {
      // Handled by parent
    } finally {
      setIsSavingBoundary(false);
    }
  };

  // Export GeoJSON as downloadable file
  const handleExportGeoJSON = () => {
    if (boundaryCoords.length < 3) return;
    const ring = [...boundaryCoords];
    if (
      ring[0][0] !== ring[ring.length - 1][0] ||
      ring[0][1] !== ring[ring.length - 1][1]
    ) {
      ring.push(ring[0]);
    }

    const feature = {
      type: 'Feature',
      properties: {
        farm_id: farm.id,
        farm_name: farm.farm_name,
        village: farm.village,
        district: farm.district,
        state: farm.state,
        registered_acres: registeredAcres,
        mapped_acres: boundaryMetrics?.areaAcres || registeredAcres,
        perimeter_meters: boundaryMetrics?.perimeterMeters || 0,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [ring],
      },
    };

    const blob = new Blob([JSON.stringify(feature, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${farm.farm_name.toLowerCase().replace(/\s+/g, '_')}_boundary.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Category Icon Resolver
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'storage':
        return <Warehouse className="w-4 h-4 text-amber-500" />;
      case 'equipment':
        return <Package className="w-4 h-4 text-sky-400" />;
      case 'labour':
        return <Users className="w-4 h-4 text-emerald-400" />;
      case 'irrigation':
        return <Droplet className="w-4 h-4 text-blue-400" />;
      case 'crop':
        return <Sprout className="w-4 h-4 text-emerald-500" />;
      case 'boundary':
        return <MapPin className="w-4 h-4 text-emerald-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  // Accuracy calculation: mapped area vs registered area
  const areaRatio =
    boundaryMetrics && registeredAcres > 0
      ? Math.min(
          100,
          Math.max(
            0,
            100 - (Math.abs(boundaryMetrics.areaAcres - registeredAcres) / registeredAcres) * 100
          )
        )
      : 98.5;

  return (
    <div
      className={`relative rounded-3xl bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl' : 'w-full h-88 sm:h-96 lg:h-[480px]'
      }`}
      ref={mountRef}
    >
      {/* 3D WebGL Canvas or Fallback */}
      {isWebGLSupported ? (
        <canvas
          ref={canvasRef}
          className={`w-full h-full touch-none block ${
            boundaryMode === 'draw'
              ? 'cursor-crosshair'
              : 'cursor-grab active:cursor-grabbing'
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
        />
      ) : (
        /* Fallback 2D Isometric Schematic Canvas */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
            <Compass className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">Geospatial Farm Twin (2D Mode)</h4>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            WebGL acceleration is inactive in this session. Displaying verified geographic holding for{' '}
            <span className="text-emerald-400 font-semibold">{farm.farm_name}</span>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl w-full text-left">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Registered</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {farm.land_area} {farm.land_area_unit}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Coordinates</span>
              <span className="text-sm font-bold text-white truncate block font-mono">
                {centerLat.toFixed(3)}, {centerLon.toFixed(3)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Resources</span>
              <span className="text-sm font-bold text-sky-400 font-mono">
                {farm.resources?.length || 0} Registered
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Location</span>
              <span className="text-sm font-bold text-white truncate block">{farm.village}</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && isWebGLSupported && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 text-emerald-400 z-10">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold tracking-wide">Synthesizing 3D Geospatial Farm Twin...</span>
        </div>
      )}

      {/* Top Floating Badge: Truthful Geographic Identity Banner */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-20 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[11px] font-semibold text-slate-300 shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-extrabold text-white">{farm.farm_name}</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-mono font-bold">
            {centerLat.toFixed(4)}°N, {centerLon.toFixed(4)}°E
          </span>
          <span className="hidden md:inline text-slate-600">•</span>
          <span className="hidden md:inline text-slate-400 truncate">
            {farm.village}, {farm.district}
          </span>
          <span className="hidden lg:inline text-slate-600">•</span>
          <span className="hidden lg:inline text-amber-400 text-[10px] font-bold">
            Elev: ~568m ASL
          </span>
        </div>
      </div>

      {/* Top-Right Interactive Controls Toolbar */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
        {/* Reset Camera Button */}
        <button
          type="button"
          onClick={handleResetCamera}
          title="Reset Camera View"
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* View Mode Switcher (Isometric 3D vs Top-Down 2D Map) */}
        <button
          type="button"
          onClick={handleToggleViewMode}
          title={viewMode === 'isometric' ? 'Switch to Top-Down 2D Map' : 'Switch to Isometric 3D'}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            viewMode === 'topdown'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{viewMode === 'isometric' ? '3D Iso' : 'Top-Down'}</span>
        </button>

        <div className="w-px h-4 bg-slate-800 mx-0.5" />

        {/* Toggle Boundary Overlay */}
        <button
          type="button"
          onClick={() => setShowBoundary(!showBoundary)}
          title="Toggle 3D Boundary Fence"
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            showBoundary ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <MapPin className="w-4 h-4" />
        </button>

        {/* Toggle Elevation Contours */}
        <button
          type="button"
          onClick={() => setShowContours(!showContours)}
          title="Toggle Terrain Elevation Contours"
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            showContours ? 'text-sky-400 bg-sky-950/60' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Toggle Resources */}
        <button
          type="button"
          onClick={() => setShowResources(!showResources)}
          title="Toggle Infrastructure & Storage"
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            showResources ? 'text-amber-400 bg-amber-950/60' : 'text-slate-500 hover:text-slate-300'
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

        <div className="w-px h-4 bg-slate-800 mx-0.5" />

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen' : 'Expand View'}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Floating Mode Switch: DRAW BOUNDARY vs EXPLORE */}
      <div className="absolute top-14 right-3 z-20 flex items-center gap-1.5">
        {boundaryMode === 'view' ? (
          <button
            type="button"
            onClick={() => {
              setBoundaryMode('draw');
              setViewMode('topdown');
              cameraPolarRef.current.radius = 42;
              cameraPolarRef.current.theta = 0;
              cameraPolarRef.current.phi = 0.05;
              cameraPolarRef.current.target.set(0, 0, 0);
              updateCameraPosition();
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-400/40"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Map Boundary</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md p-1 rounded-2xl border border-emerald-500/40 shadow-xl">
            <button
              type="button"
              onClick={handleAutoGenerateBoundary}
              title="Auto-generate boundary matching registered acres"
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Auto-Fit</span>
            </button>
            <button
              type="button"
              onClick={handleUndoBoundaryPoint}
              title="Undo last point"
              className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClearBoundary}
              title="Clear all points"
              className="p-1.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-slate-800 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={boundaryCoords.length < 3 || isSavingBoundary}
              onClick={handleSaveBoundary}
              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingBoundary ? 'Saving...' : 'Save Boundary'}</span>
            </button>
            <button
              type="button"
              onClick={() => setBoundaryMode('view')}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Boundary Mode Active Floating Hint */}
      {boundaryMode === 'draw' && (
        <div className="absolute top-14 left-3 z-20 pointer-events-none animate-in fade-in">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-semibold shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Click on the terrain to place perimeter vertices ({boundaryCoords.length} points placed)</span>
          </div>
        </div>
      )}

      {/* Real-time Boundary Analytics Floating HUD */}
      {boundaryMetrics && (
        <div className="absolute bottom-3 left-3 z-20 max-w-sm pointer-events-auto">
          <div className="p-3 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-2xl text-white space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Geospatial Area Precision</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {boundaryMetrics.perimeterMeters}m Perimeter
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Digitally Mapped</span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {boundaryMetrics.areaAcres.toFixed(2)} Acres
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  ({boundaryMetrics.areaHectares.toFixed(2)} Ha)
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Registered Holding</span>
                <span className="text-sm font-black text-white font-mono">
                  {registeredAcres.toFixed(2)} {farm.land_area_unit || 'Acres'}
                </span>
                <span className="text-[10px] text-emerald-400 block font-bold">
                  {areaRatio.toFixed(1)}% Match
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[10px]">
              <span className="text-slate-400 truncate">
                {boundaryCoords.length >= 3 ? 'GeoJSON Polygon Active' : 'Draw 3+ points'}
              </span>
              <button
                type="button"
                onClick={handleExportGeoJSON}
                disabled={boundaryCoords.length < 3}
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Download className="w-3 h-3" />
                <span>Export GeoJSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification after Saving Boundary */}
      {boundarySaveSuccess && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 animate-in fade-in zoom-in-95">
          <div className="p-4 rounded-2xl bg-emerald-950/95 border border-emerald-500/60 shadow-2xl text-center text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold text-white">Boundary Saved to Farm Profile!</h4>
              <p className="text-xs text-emerald-200">
                Geodesic perimeter synchronized with backend database.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selected 3D Object Information Card */}
      {selectedObject && (
        <div className="absolute bottom-3 right-3 sm:right-4 sm:max-w-md z-20 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-emerald-500/40 shadow-2xl text-white">
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
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

      {/* Floating Bottom-Right Hint when no object is selected */}
      {!selectedObject && boundaryMode === 'view' && (
        <div className="absolute bottom-3 right-3 z-10 pointer-events-none hidden sm:block">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-xs border border-slate-800 text-[10px] font-medium text-slate-400 shadow-sm flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Click any shed, crop bed, or boundary post to inspect details</span>
          </div>
        </div>
      )}
    </div>
  );
};
