"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Lightbulb, 
  Home as HomeIcon, 
  Layers,
  Calendar,
  Loader2,
  ExternalLink,
  Download,
  Share2,
  Copy,
  CheckCircle2
} from 'lucide-react';

// Import interfaces from lighting page
interface Wall {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  pixelLength?: number;
  realLength?: number;
  measurement?: string;
  estimatedMeasurement?: string;
}

interface RoomLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  color?: string;
}

interface CalibrationData {
  pixelsPerInch: number;
  referenceWallId?: string | null;
  referenceLength?: number;
  unit?: 'feet' | 'inches' | 'cm' | 'meters';
  isCalibrated?: boolean;
  calibratedWallId?: string | null;
  referenceWall?: Wall | null;
  measurementUnit?: string;
}

interface Furniture {
  id: string;
  type: 'sofa' | 'bed' | 'table' | 'chair' | 'tv' | 'refrigerator' | 'kitchen' | 'bathroom' | 'dining' | 'wardrobe';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
}

interface LightFixture {
  id: string;
  type: 'spot-type1' | 'spot-type2' | 'spot-type3' | 'spot-type4' | 'spot-type5-wall-washer' | 'adjustable-spot-type6' | 'mini-spot' | 'bed-reading-spot' | 'waterproof-spot' | 'wall-washer-spot' | 'laser-blade' | 'linear-wall-washer' | 'linear-profile-lighting' | 'gimbel-spot' | 'surface-spot-light-indoor' | 'surface-spot-light-indoor-2' | 'downlight' | 'surface-panel' | 'indoor-strip-light' | 'curtain-grazer' | 'outdoor-profile' | 'magnetic-track' | 'track-spot' | 'track-spot-2' | 'magnetic-laser-blade' | 'magnetic-laser-blade-large' | 'magnetic-profile' | 'magnetic-profile-large' | 'laser-blade-wall-washer' | 'laser-blade-wall-washer-large' | 'magnetic-profile-adjustable' | 'magnetic-profile-adjustable-large' | 'stretch-ceiling' | 'module-signage' | 'table-lamp' | 'floor-lamp' | 'chandelier-2' | 'dining-linear-pendant' | 'hanging-light';
  x: number;
  y: number;
  intensity: number;
  color: string;
  radius: number;
  isOn: boolean;
  direction?: number;
  width?: number;
  size: number;
}

interface BlueprintData {
  walls: Wall[];
  roomLabels: RoomLabel[];
  calibration: CalibrationData;
  imageData: string;
  furniture?: Furniture[];
  metadata: {
    title?: string;
    units?: string;
    calibrated?: boolean;
    pixelsPerInch?: number;
    canvasDimensions?: {
      width: number;
      height: number;
    };
    createdAt: string;
    wallCount: number;
    labelCount: number;
    isCalibrated: boolean;
  };
}

interface ProjectData {
  id: string;
  projectId: string;
  title: string;
  description: string;
  blueprintData: BlueprintData;
  furnitureData: Furniture[];
  lightingData: {
    lights: LightFixture[];
    ambientLightLevel: number;
    settings: {
      ambientLightLevel: number;
      totalLights: number;
      activeLights: number;
    };
  };
  status: string;
  metadata: {
    wallCount: number;
    roomCount: number;
    furnitureCount: number;
    lightingCount: number;
    isCalibrated: boolean;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;

export default function PreviewPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBOM, setShowBOM] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [hoveredLight, setHoveredLight] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [lightDistances, setLightDistances] = useState<{ [key: string]: { horizontal: number; vertical: number; unit: string } }>({});
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  
  // Image states
  const [sofaImage, setSofaImage] = useState<HTMLImageElement | null>(null);
  const [grassImage, setGrassImage] = useState<HTMLImageElement | null>(null);
  const [flooringImage, setFlooringImage] = useState<HTMLImageElement | null>(null);
  const [gardenLightImage, setGardenLightImage] = useState<HTMLImageElement | null>(null);
  const [bedImage, setBedImage] = useState<HTMLImageElement | null>(null);
  const [tvImage, setTvImage] = useState<HTMLImageElement | null>(null);
  const [kitchenImage, setKitchenImage] = useState<HTMLImageElement | null>(null);
  const [bathroomImage, setBathroomImage] = useState<HTMLImageElement | null>(null);
  const [diningImage, setDiningImage] = useState<HTMLImageElement | null>(null);
  const [wardrobeImage, setWardrobeImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    loadProject();
    loadImages();
  }, [projectId]);

  // Calculate distances for all lights
  useEffect(() => {
    if (project?.lightingData?.lights && project?.blueprintData?.walls) {
      const distances: { [key: string]: { horizontal: number; vertical: number; unit: string } } = {};
      
      project.lightingData.lights.forEach(light => {
        const { horizontal, vertical, unit } = calculateLightDistances(light);
        distances[light.id] = { horizontal, vertical, unit };
      });
      
      setLightDistances(distances);
    }
  }, [project]);

  // Animation loop
  useEffect(() => {
    if (animationEnabled) {
      const animate = () => {
        if (project && canvasRef.current) {
          drawPreview();
        }
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (project && canvasRef.current) {
        drawPreview();
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [project, animationEnabled, sofaImage, grassImage, flooringImage, gardenLightImage, bedImage, tvImage, kitchenImage, bathroomImage, diningImage, wardrobeImage, hoveredLight]);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/preview/${projectId}`);
      const data = await response.json();
      
      if (response.ok && data.project) {
        setProject(data.project);
      } else {
        setError(data.error || 'Project not found');
      }
    } catch (error) {
      setError('Failed to load project preview');
    } finally {
      setLoading(false);
    }
  };

  const loadImages = () => {
    const images = [
      { setter: setSofaImage, src: '/sofatop.png' },
      { setter: setGrassImage, src: '/topgrass.jpg' },
      { setter: setFlooringImage, src: '/flooring.jpg' },
      { setter: setGardenLightImage, src: '/gardenlight.png' },
      { setter: setBedImage, src: '/bedtop.jpg' },
      { setter: setTvImage, src: '/tvtop.png' },
      { setter: setKitchenImage, src: '/kitchentop.png' },
      { setter: setBathroomImage, src: '/bathroom.png' },
      { setter: setDiningImage, src: '/diningtop.png' },
      { setter: setWardrobeImage, src: '/wardrobetop.jpg' },
    ];

    images.forEach(({ setter, src }) => {
      const img = new Image();
      img.onload = () => setter(img);
      img.src = src;
    });
  };

  const calculateLightDistances = (light: LightFixture) => {
    if (!project?.blueprintData?.walls) {
      return { horizontal: 0, vertical: 0, unit: 'px' };
    }

    let minHorizontalDistance = Infinity;
    let minVerticalDistance = Infinity;

    project.blueprintData.walls.forEach(wall => {
      const isHorizontal = Math.abs(wall.start.y - wall.end.y) < Math.abs(wall.start.x - wall.end.x);
      
      if (isHorizontal) {
        // Horizontal wall - calculate vertical distance
        const wallY = (wall.start.y + wall.end.y) / 2;
        const distance = Math.abs(light.y - wallY);
        minVerticalDistance = Math.min(minVerticalDistance, distance);
      } else {
        // Vertical wall - calculate horizontal distance
        const wallX = (wall.start.x + wall.end.x) / 2;
        const distance = Math.abs(light.x - wallX);
        minHorizontalDistance = Math.min(minHorizontalDistance, distance);
      }
    });

    // Convert to real measurements if calibrated
    const calibration = project.blueprintData.calibration;
    let unit = 'px';
    
    if (calibration?.isCalibrated && calibration.pixelsPerInch) {
      const pixelsPerInch = calibration.pixelsPerInch;
      unit = calibration.unit || 'ft';
      
      if (unit === 'feet' || unit === 'ft') {
        minHorizontalDistance = minHorizontalDistance / pixelsPerInch / 12; // Convert to feet
        minVerticalDistance = minVerticalDistance / pixelsPerInch / 12;
        unit = 'ft';
      } else if (unit === 'inches') {
        minHorizontalDistance = minHorizontalDistance / pixelsPerInch;
        minVerticalDistance = minVerticalDistance / pixelsPerInch;
        unit = 'in';
      } else if (unit === 'cm') {
        minHorizontalDistance = minHorizontalDistance / pixelsPerInch * 2.54;
        minVerticalDistance = minVerticalDistance / pixelsPerInch * 2.54;
        unit = 'cm';
      } else if (unit === 'meters') {
        minHorizontalDistance = minHorizontalDistance / pixelsPerInch * 0.0254;
        minVerticalDistance = minVerticalDistance / pixelsPerInch * 0.0254;
        unit = 'm';
      }
    }

    return {
      horizontal: minHorizontalDistance === Infinity ? 0 : minHorizontalDistance,
      vertical: minVerticalDistance === Infinity ? 0 : minVerticalDistance,
      unit
    };
  };

  // Mouse event handlers
  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !project) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    setMousePos({ x: event.clientX, y: event.clientY });

    // Calculate canvas coordinates
    const bounds = calculateBlueprintBounds();
    if (!bounds) return;

    const padding = 100;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;
    
    const scale = Math.min(
      availableWidth / bounds.width,
      availableHeight / bounds.height
    );

    const offsetX = (canvas.width - bounds.width * scale) / 2 - bounds.minX * scale;
    const offsetY = (canvas.height - bounds.height * scale) / 2 - bounds.minY * scale;

    // Check if hovering over any light
    let foundLight = null;
    project.lightingData?.lights?.forEach(light => {
      if (!light.isOn) return;

      const lightX = offsetX + light.x * scale;
      const lightY = offsetY + light.y * scale;
      const lightRadius = 4 * light.size + 10; // Slightly larger hit area
      
      const distance = Math.sqrt((x - lightX) ** 2 + (y - lightY) ** 2);
      if (distance <= lightRadius) {
        foundLight = light.id;
      }
    });

    setHoveredLight(foundLight);
  };

  const handleCanvasMouseLeave = () => {
    setHoveredLight(null);
    setMousePos(null);
  };

  const drawPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas || !project) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate bounds
    const bounds = calculateBlueprintBounds();
    if (!bounds) return;

    const padding = 100;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;
    
    const scale = Math.min(
      availableWidth / bounds.width,
      availableHeight / bounds.height
    );

    const offsetX = (canvas.width - bounds.width * scale) / 2 - bounds.minX * scale;
    const offsetY = (canvas.height - bounds.height * scale) / 2 - bounds.minY * scale;

    // Draw background
    drawNightBackground(ctx, canvas.width, canvas.height);
    drawGrassBackground(ctx, canvas.width, canvas.height);
    drawFlooring(ctx, offsetX, offsetY, scale, bounds);

    // Draw walls
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 2;
    
    project.blueprintData.walls.forEach((wall) => {
      ctx.beginPath();
      ctx.moveTo(
        offsetX + wall.start.x * scale,
        offsetY + wall.start.y * scale
      );
      ctx.lineTo(
        offsetX + wall.end.x * scale,
        offsetY + wall.end.y * scale
      );
      ctx.stroke();

      // Draw measurements
      const midX = offsetX + (wall.start.x + wall.end.x) / 2 * scale;
      const midY = offsetY + (wall.start.y + wall.end.y) / 2 * scale;
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 3;
      
      const measurement = formatMeasurement(wall.pixelLength || 0, wall.realLength);
      if (measurement && measurement !== 'undefined' && measurement !== 'NaN') {
        ctx.fillText(measurement, midX, midY - 8);
      }
    });

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw room labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    
    project.blueprintData.roomLabels.forEach((label) => {
      ctx.fillText(
        label.text,
        offsetX + label.x * scale,
        offsetY + label.y * scale
      );
    });

    // Draw furniture
    drawFurniture(ctx, offsetX, offsetY, scale);

    // Draw lights with animation
    drawLights(ctx, offsetX, offsetY, scale);
  };

  const calculateBlueprintBounds = () => {
    if (!project || project.blueprintData.walls.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    project.blueprintData.walls.forEach(wall => {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      minY = Math.min(minY, wall.start.y, wall.end.y);
      maxX = Math.max(maxX, wall.start.x, wall.end.x);
      maxY = Math.max(maxY, wall.start.y, wall.end.y);
    });

    return {
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  // Simplified drawing functions (reuse from lighting page)
  const drawNightBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f1a2e');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add garden lights
    const padding = 80;
    const cornerLights = [
      { x: padding, y: padding },
      { x: width - padding, y: padding },
      { x: padding, y: height - padding },
      { x: width - padding, y: height - padding },
      { x: width / 2, y: height / 2 }
    ];
    
    cornerLights.forEach(light => {
      if (gardenLightImage) {
        const glowGradient = ctx.createRadialGradient(
          light.x, light.y - 10, 0,
          light.x, light.y - 10, 40
        );
        glowGradient.addColorStop(0, 'rgba(255, 248, 220, 0.6)');
        glowGradient.addColorStop(0.3, 'rgba(255, 248, 220, 0.4)');
        glowGradient.addColorStop(0.7, 'rgba(255, 248, 220, 0.2)');
        glowGradient.addColorStop(1, 'rgba(255, 248, 220, 0)');
      
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(light.x, light.y - 10, 40, 0, Math.PI * 2);
        ctx.fill();
      
        const lightSize = 60;
        ctx.drawImage(
          gardenLightImage, 
          light.x - lightSize/2, 
          light.y - lightSize + 10,
          lightSize, 
          lightSize
        );
      
        const bulbGlow = ctx.createRadialGradient(
          light.x, light.y - 35, 0,
          light.x, light.y - 35, 25
        );
        bulbGlow.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        bulbGlow.addColorStop(0.3, 'rgba(255, 248, 220, 0.6)');
        bulbGlow.addColorStop(1, 'rgba(255, 248, 220, 0)');
      
        ctx.fillStyle = bulbGlow;
        ctx.beginPath();
        ctx.arc(light.x, light.y - 35, 25, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  const drawGrassBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const padding = 80;
    const lightRadius = 60;
    const cornerLights = [
      { x: padding, y: padding },
      { x: width - padding, y: padding },
      { x: padding, y: height - padding },
      { x: width - padding, y: height - padding },
      { x: width / 2, y: height / 2 }
    ];
    
    if (grassImage) {
      const tileSize = 80;
      
      for (let x = 0; x < width; x += tileSize) {
        for (let y = 0; y < height; y += tileSize) {
          const tileWidth = Math.min(tileSize, width - x);
          const tileHeight = Math.min(tileSize, height - y);
          ctx.drawImage(grassImage, x, y, tileWidth, tileHeight);
        }
      }
      
      ctx.fillStyle = 'rgba(32, 41, 19, 0.85)';
      ctx.fillRect(0, 0, width, height);
      
      cornerLights.forEach(light => {
        ctx.save();
        
        ctx.beginPath();
        ctx.arc(light.x, light.y - 10, lightRadius, 0, Math.PI * 2);
        ctx.clip();
        
        for (let x = light.x - lightRadius; x < light.x + lightRadius; x += tileSize) {
          for (let y = (light.y - 10) - lightRadius; y < (light.y - 10) + lightRadius; y += tileSize) {
            if (x >= 0 && y >= 0 && x < width && y < height) {
              const tileWidth = Math.min(tileSize, width - x);
              const tileHeight = Math.min(tileSize, height - y);
              ctx.drawImage(grassImage, x, y, tileWidth, tileHeight);
            }
          }
        }
        
        const lightGradient = ctx.createRadialGradient(
          light.x, light.y - 10, 0,
          light.x, light.y - 10, lightRadius
        );
        
        lightGradient.addColorStop(0, 'rgba(255, 248, 220, 0.1)');
        lightGradient.addColorStop(0.3, 'rgba(40, 35, 20, 0.3)');
        lightGradient.addColorStop(0.6, 'rgba(32, 41, 19, 0.6)');
        lightGradient.addColorStop(0.8, 'rgba(32, 41, 19, 0.8)');
        lightGradient.addColorStop(1, 'rgba(32, 41, 19, 0.85)');
        
        ctx.fillStyle = lightGradient;
        ctx.fillRect(light.x - lightRadius, (light.y - 10) - lightRadius, lightRadius * 2, lightRadius * 2);
        
        ctx.restore();
        
        const glowGradient = ctx.createRadialGradient(
          light.x, light.y - 10, 0,
          light.x, light.y - 10, lightRadius * 0.7
        );
        glowGradient.addColorStop(0, 'rgba(255, 248, 220, 0.4)');
        glowGradient.addColorStop(0.4, 'rgba(255, 248, 220, 0.2)');
        glowGradient.addColorStop(1, 'rgba(255, 248, 220, 0)');
        
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(light.x, light.y - 10, lightRadius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalCompositeOperation = 'source-over';
      });
    }
  };

  const drawFlooring = (ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, scale: number, bounds: any) => {
    if (flooringImage) {
      ctx.save();
      
      const flooringX = offsetX + bounds.minX * scale;
      const flooringY = offsetY + bounds.minY * scale;
      const flooringWidth = bounds.width * scale;
      const flooringHeight = bounds.height * scale;
      
      ctx.beginPath();
      ctx.rect(flooringX, flooringY, flooringWidth, flooringHeight);
      ctx.clip();
      
      const tileSize = 60;
      
      for (let x = flooringX; x < flooringX + flooringWidth; x += tileSize) {
        for (let y = flooringY; y < flooringY + flooringHeight; y += tileSize) {
          const tileWidth = Math.min(tileSize, flooringX + flooringWidth - x);
          const tileHeight = Math.min(tileSize, flooringY + flooringHeight - y);
          
          ctx.drawImage(flooringImage, x, y, tileWidth, tileHeight);
          
          ctx.fillStyle = 'rgba(15, 20, 10, 0.8)';
          ctx.fillRect(x, y, tileWidth, tileHeight);
        }
      }
      
      ctx.restore();
    }
  };

  const drawFurniture = (ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, scale: number) => {
    project?.furnitureData?.forEach(item => {
      const x = offsetX + item.x * scale;
      const y = offsetY + item.y * scale;
      const width = item.width * scale;
      const height = item.height * scale;

      ctx.save();
      ctx.translate(x + width/2, y + height/2);
      ctx.rotate(item.rotation * Math.PI / 180);
      
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) * 0.5);
      gradient.addColorStop(0, 'rgba(255, 204, 102, 0.05)');
      gradient.addColorStop(1, 'rgba(255, 204, 102, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(-width, -height, width * 2, height * 2);
      
      // Draw furniture based on type with images
      const imageMap: { [key: string]: HTMLImageElement | null } = {
        sofa: sofaImage,
        bed: bedImage,
        table: tvImage,
        chair: wardrobeImage,
        tv: tvImage,
        refrigerator: kitchenImage,
        kitchen: kitchenImage,
        bathroom: bathroomImage,
        dining: diningImage,
        wardrobe: wardrobeImage
      };

      const image = imageMap[item.type];
      if (image) {
        ctx.drawImage(image, -width/2, -height/2, width, height);
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(32, 41, 19, 0.2)';
        ctx.fillRect(-width/2, -height/2, width, height);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        // Fallback to colored rectangles
        ctx.fillStyle = item.color;
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 2;
        ctx.fillRect(-width/2, -height/2, width, height);
        ctx.strokeRect(-width/2, -height/2, width, height);
      }
      
      ctx.restore();
    });
  };

  const drawLights = (ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, scale: number) => {
    if (!project?.lightingData?.lights) return;

    const time = animationEnabled ? Date.now() / 1000 : 0;

    project.lightingData.lights.forEach((light, index) => {
      if (!light.isOn) return;

      const x = offsetX + light.x * scale;
      const y = offsetY + light.y * scale;
      const radius = light.radius * scale;
      const isHovered = hoveredLight === light.id;
      
      // Enhanced animated effects
      const pulseOffset = animationEnabled ? Math.sin(time * 2 + index * 0.5) * 0.1 : 0;
      const sparkleOffset = animationEnabled ? Math.sin(time * 4 + index * 1.2) * 0.05 : 0;
      const rotationOffset = animationEnabled ? time * 0.5 + index * 0.3 : 0;
      
      const currentIntensity = light.intensity / 100 * (1 + pulseOffset + sparkleOffset);
      const hoverBoost = isHovered ? 0.3 : 0;
      
      // Enhanced glow with multiple layers
      const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.3);
      innerGradient.addColorStop(0, `rgba(255, 255, 255, ${(currentIntensity + hoverBoost) * 0.9})`);
      innerGradient.addColorStop(0.5, `rgba(255, 248, 220, ${(currentIntensity + hoverBoost) * 0.7})`);
      innerGradient.addColorStop(1, `rgba(255, 248, 220, ${(currentIntensity + hoverBoost) * 0.4})`);
      
      ctx.fillStyle = innerGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Outer glow
      const outerGradient = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius);
      outerGradient.addColorStop(0, `rgba(255, 248, 220, ${(currentIntensity + hoverBoost) * 0.4})`);
      outerGradient.addColorStop(0.5, `rgba(255, 248, 220, ${(currentIntensity + hoverBoost) * 0.2})`);
      outerGradient.addColorStop(1, 'rgba(255, 248, 220, 0)');
      
      ctx.fillStyle = outerGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Sparkle effects for animation
      if (animationEnabled) {
        for (let i = 0; i < 6; i++) {
          const angle = rotationOffset + (i * Math.PI * 2) / 6;
          const sparkleDistance = (radius * 0.7) + Math.sin(time * 3 + i) * 5;
          const sparkleX = x + Math.cos(angle) * sparkleDistance;
          const sparkleY = y + Math.sin(angle) * sparkleDistance;
          const sparkleSize = (1 + Math.sin(time * 5 + i * 0.8)) * 1.5;
          
          ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + Math.sin(time * 4 + i) * 0.4})`;
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Draw light fixture with hover effect
      const fixtureSize = 4 * light.size * (isHovered ? 1.2 : 1);
      
      // Fixture glow
      if (isHovered) {
        const fixtureGlow = ctx.createRadialGradient(x, y, 0, x, y, fixtureSize + 8);
        fixtureGlow.addColorStop(0, 'rgba(255, 0, 255, 0.6)');
        fixtureGlow.addColorStop(1, 'rgba(255, 0, 255, 0)');
        ctx.fillStyle = fixtureGlow;
        ctx.beginPath();
        ctx.arc(x, y, fixtureSize + 8, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Main fixture
      ctx.fillStyle = isHovered ? '#FF44FF' : '#FF00FF';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.beginPath();
      ctx.arc(x, y, fixtureSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Animated center dot
      if (animationEnabled) {
        const centerPulse = Math.sin(time * 6 + index * 2) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + centerPulse * 0.2})`;
        ctx.beginPath();
        ctx.arc(x, y, fixtureSize * 0.3 * (1 + centerPulse * 0.2), 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw light type indicator with better visibility
      ctx.fillStyle = isHovered ? '#FFFF00' : '#FFFFFF';
      ctx.font = `${isHovered ? '10px' : '8px'} Arial`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeText(light.type.split('-')[0].toUpperCase(), x, y + (fixtureSize + 18));
      ctx.fillText(light.type.split('-')[0].toUpperCase(), x, y + (fixtureSize + 18));

      // Draw distance lines when hovered
      if (isHovered && project?.blueprintData?.walls) {
        drawDistanceLines(ctx, light, offsetX, offsetY, scale);
      }
    });
  };

  const drawDistanceLines = (ctx: CanvasRenderingContext2D, light: LightFixture, offsetX: number, offsetY: number, scale: number) => {
    if (!project?.blueprintData?.walls || !lightDistances[light.id]) return;

    const lightX = offsetX + light.x * scale;
    const lightY = offsetY + light.y * scale;
    const distance = lightDistances[light.id];

    // Draw distance indicators as simple lines extending from the light
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // Draw horizontal distance indicator
    const horizontalLineLength = 50;
    ctx.beginPath();
    ctx.moveTo(lightX, lightY);
    ctx.lineTo(lightX + horizontalLineLength, lightY);
    ctx.stroke();

    // Horizontal distance label
    ctx.fillStyle = '#00FFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    const hText = `H: ${distance.horizontal.toFixed(1)}${distance.unit}`;
    ctx.strokeText(hText, lightX + horizontalLineLength + 5, lightY - 5);
    ctx.fillText(hText, lightX + horizontalLineLength + 5, lightY - 5);

    // Draw vertical distance indicator
    const verticalLineLength = 50;
    ctx.beginPath();
    ctx.moveTo(lightX, lightY);
    ctx.lineTo(lightX, lightY - verticalLineLength);
    ctx.stroke();

    // Vertical distance label
    ctx.save();
    ctx.translate(lightX + 10, lightY - verticalLineLength - 5);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'left';
    const vText = `V: ${distance.vertical.toFixed(1)}${distance.unit}`;
    ctx.strokeText(vText, 0, 0);
    ctx.fillText(vText, 0, 0);
    ctx.restore();

    ctx.setLineDash([]);
  };

  const formatMeasurement = (pixelLength: number, realLength?: number): string => {
    if (realLength && project?.blueprintData?.calibration?.pixelsPerInch && project.blueprintData.calibration.pixelsPerInch > 0) {
      const unit = project.blueprintData.calibration.unit || project.blueprintData.calibration.measurementUnit || 'feet';
      if (unit === 'feet' || unit === 'ft') {
        const feet = Math.floor(realLength / 12);
        const inches = Math.round(realLength % 12);
        return feet > 0 ? `${feet}'${inches}"` : `${inches}"`;
      }
      return `${realLength.toFixed(1)} ${unit}`;
    }
    
    if (pixelLength && pixelLength > 0) {
      const estimatedFeet = (pixelLength * (window.devicePixelRatio || 1)) / (96 * 0.25);
      const feet = Math.floor(estimatedFeet);
      const inches = Math.round((estimatedFeet - feet) * 12);
      return feet > 0 ? `~${feet}'${inches}"` : `~${inches}"`;
    }
    
    return "0'0\"";
  };

  const copyPreviewLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const exportBOM = () => {
    if (!project?.lightingData?.lights) return;

    const bomData = generateBOMData();
    const csvContent = [
      ['Item', 'Light Type', 'Quantity', 'Intensity (%)', 'Status', 'Position X', 'Position Y', 'Notes'],
      ...bomData.map((item, index) => [
        index + 1,
        item.type,
        item.quantity,
        item.averageIntensity,
        item.status,
        item.position?.x || 'N/A',
        item.position?.y || 'N/A',
        item.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title}-BOM-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateBOMData = () => {
    if (!project?.lightingData?.lights) return [];

    const lightTypes: { [key: string]: any } = {};
    
    project.lightingData.lights.forEach(light => {
      if (!lightTypes[light.type]) {
        lightTypes[light.type] = {
          type: light.type,
          quantity: 0,
          totalIntensity: 0,
          activeCount: 0,
          positions: []
        };
      }
      
      lightTypes[light.type].quantity++;
      lightTypes[light.type].totalIntensity += light.intensity;
      if (light.isOn) lightTypes[light.type].activeCount++;
      lightTypes[light.type].positions.push({ x: light.x.toFixed(1), y: light.y.toFixed(1) });
    });

    return Object.values(lightTypes).map((item: any) => ({
      type: item.type.replace(/-/g, ' ').toUpperCase(),
      quantity: item.quantity,
      averageIntensity: Math.round(item.totalIntensity / item.quantity),
      status: `${item.activeCount}/${item.quantity} Active`,
      position: item.positions[0], // First position
      notes: item.quantity > 1 ? `${item.quantity} units total` : 'Single unit'
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-cyan-300">Loading project preview...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <ExternalLink className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-red-300">Preview Not Available</h1>
          <p className="text-slate-400">{error || 'Project not found'}</p>
        </div>
      </div>
    );
  }

  const bomData = generateBOMData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-700 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-8 w-8 text-cyan-400" />
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {project.title}
                  </h1>
                  <p className="text-sm text-slate-400">Project Preview</p>
                </div>
              </div>
              <Badge className="bg-green-500 text-white">
                {project.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setAnimationEnabled(!animationEnabled)}
                variant="outline"
                className={`border-gray-600 text-gray-300 hover:text-white ${
                  animationEnabled ? 'bg-cyan-600/20 border-cyan-500' : 'hover:bg-gray-700'
                }`}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                {animationEnabled ? 'Disable' : 'Enable'} Animation
              </Button>
              <Button
                onClick={() => setShowBOM(!showBOM)}
                variant="outline"
                className={`border-gray-600 text-gray-300 hover:text-white ${
                  showBOM ? 'bg-blue-600/20 border-blue-500' : 'hover:bg-gray-700'
                }`}
              >
                <Layers className="h-4 w-4 mr-2" />
                {showBOM ? 'Hide' : 'Show'} BOM
              </Button>
              <Button
                onClick={copyPreviewLink}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                {linkCopied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hover Tooltip */}
      {hoveredLight && mousePos && (
        <div 
          className="fixed z-50 bg-slate-800 border border-cyan-500 rounded-lg p-3 shadow-xl pointer-events-none"
          style={{ 
            left: mousePos.x + 15, 
            top: mousePos.y - 10,
            transform: mousePos.x > window.innerWidth - 200 ? 'translateX(-100%)' : 'none'
          }}
        >
          <div className="text-cyan-400 font-semibold text-sm mb-2">
            Light Distance Information
          </div>
          {lightDistances[hoveredLight] && (
            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex justify-between space-x-4">
                <span>Horizontal:</span>
                <span className="text-cyan-400 font-mono">
                  {lightDistances[hoveredLight].horizontal.toFixed(1)} {lightDistances[hoveredLight].unit}
                </span>
              </div>
              <div className="flex justify-between space-x-4">
                <span>Vertical:</span>
                <span className="text-cyan-400 font-mono">
                  {lightDistances[hoveredLight].vertical.toFixed(1)} {lightDistances[hoveredLight].unit}
                </span>
              </div>
              <div className="pt-1 border-t border-slate-600 text-slate-400 text-xs">
                Distance to nearest walls
              </div>
            </div>
          )}
        </div>
      )}

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Canvas Area */}
          <div className={`${showBOM ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            <Card className="bg-slate-900/60 border-slate-700 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-200">Lighting Design Preview</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Lightbulb className="h-4 w-4" />
                      <span>{project.lightingData?.lights?.filter(l => l.isOn).length || 0} Active Lights</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <HomeIcon className="h-4 w-4" />
                      <span>{project.metadata.roomCount} Rooms</span>
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="rounded-lg border border-gray-600 shadow-inner w-full h-auto bg-slate-800 cursor-crosshair"
                  style={{ maxWidth: '100%', height: 'auto' }}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={handleCanvasMouseLeave}
                />
                <div className="mt-4 text-center text-sm text-slate-500">
                  <p className="flex items-center justify-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                    {project.completedAt && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Completed: {new Date(project.completedAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* BOM Panel */}
          {showBOM && (
            <div className="lg:col-span-1">
              <Card className="bg-slate-900/60 border-slate-700 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-200 text-lg">Bill of Materials</CardTitle>
                    <Button
                      onClick={exportBOM}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {bomData.map((item, index) => (
                      <div key={index} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-slate-200 text-sm">{item.type}</h4>
                          <Badge variant="outline" className="text-xs">
                            {item.quantity}x
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-slate-400">
                          <div className="flex justify-between">
                            <span>Intensity:</span>
                            <span>{item.averageIntensity}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span>{item.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Position:</span>
                            <span>({item.position?.x}, {item.position?.y})</span>
                          </div>
                          {item.notes && (
                            <div className="text-slate-500 text-xs mt-1">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {bomData.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No light fixtures found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 