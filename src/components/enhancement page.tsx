"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Zap, Sofa, Bed, Table, Tv, Refrigerator, Armchair, Plus, LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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

interface BlueprintData {
  version?: string;
  timestamp?: string;
  walls: Wall[];
  roomLabels: RoomLabel[];
  calibration: CalibrationData;
  imageData: string;
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

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;

export default function EnhancementPage() {
  const router = useRouter();
  const [blueprintData, setBlueprintData] = useState<BlueprintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [selectedFurnitureType, setSelectedFurnitureType] = useState<Furniture['type'] | null>(null);
  const [selectedFurniture, setSelectedFurniture] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<'select' | 'move' | 'rotate' | 'pan'>('select');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotateStart, setRotateStart] = useState<{ x: number; y: number; angle: number } | null>(null);
  const [copiedFurniture, setCopiedFurniture] = useState<Furniture | null>(null);
  const [resizingFurniture, setResizingFurniture] = useState<string | null>(null);

  // Zoom and Pan state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

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
    const stored = localStorage.getItem('blueprintData');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setBlueprintData(data);
        console.log('Loaded blueprint data:', data);
      } catch (error) {
        console.error('Error parsing blueprint data:', error);
      }
    }
    setLoading(false);
  }, []);

  // Immediate render when blueprint data is available
  useEffect(() => {
    if (blueprintData && canvasRef.current) {
      console.log('Triggering immediate blueprint render');
      drawBlueprint();
    }
  }, [blueprintData, canvasRef.current]);

  // Add keyboard event listeners for copy/paste
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'c' && resizingFurniture) {
          // Copy selected furniture
          const furnitureItem = furniture.find(item => item.id === resizingFurniture);
          if (furnitureItem) {
            setCopiedFurniture(furnitureItem);
            console.log('Copied furniture:', furnitureItem.type);
          }
          event.preventDefault();
        } else if (event.key === 'v' && copiedFurniture) {
          // Paste furniture at a slight offset
          const newFurniture: Furniture = {
            ...copiedFurniture,
            id: Date.now().toString(),
            x: copiedFurniture.x + 20, // Offset by 20 units
            y: copiedFurniture.y + 20
          };
          setFurniture(prev => [...prev, newFurniture]);
          console.log('Pasted furniture:', newFurniture.type);
          event.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resizingFurniture, copiedFurniture, furniture]);

  useEffect(() => {
    // Load sofa image
    const sofaImg = new window.Image();
    sofaImg.onload = () => {
      setSofaImage(sofaImg);
    };
    sofaImg.src = '/sofatop.png';

    // Load grass image
    const grassImg = new window.Image();
    grassImg.onload = () => {
      setGrassImage(grassImg);
    };
    grassImg.src = '/topgrass.jpg';

    // Load flooring image
    const flooringImg = new window.Image();
    flooringImg.onload = () => {
      setFlooringImage(flooringImg);
    };
    flooringImg.src = '/flooring.jpg';

    // Load garden light image
    const gardenLightImg = new window.Image();
    gardenLightImg.onload = () => {
      setGardenLightImage(gardenLightImg);
    };
    gardenLightImg.src = '/gardenlight.png';

    // Load bed image
    const bedImg = new window.Image();
    bedImg.onload = () => {
      setBedImage(bedImg);
    };
    bedImg.src = '/bedtop.jpg';

    // Load TV image
    const tvImg = new window.Image();
    tvImg.onload = () => {
      setTvImage(tvImg);
    };
    tvImg.src = '/tvtop.png';

    // Load kitchen image
    const kitchenImg = new window.Image();
    kitchenImg.onload = () => {
      setKitchenImage(kitchenImg);
    };
    kitchenImg.src = '/kitchentop.png';

    // Load bathroom image
    const bathroomImg = new window.Image();
    bathroomImg.onload = () => {
      setBathroomImage(bathroomImg);
    };
    bathroomImg.src = '/bathroom.png';

    // Load dining image
    const diningImg = new window.Image();
    diningImg.onload = () => {
      setDiningImage(diningImg);
    };
    diningImg.src = '/diningtop.png';

    // Load wardrobe image
    const wardrobeImg = new window.Image();
    wardrobeImg.onload = () => {
      setWardrobeImage(wardrobeImg);
    };
    wardrobeImg.src = '/wardrobetop.jpg';
  }, []);

  // Force initial render when canvas ref is available
  useEffect(() => {
    if (canvasRef.current && blueprintData) {
      // Add a small delay to ensure canvas is properly mounted
      const timer = setTimeout(() => {
        drawBlueprint();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [canvasRef.current, blueprintData]);

  // Additional effect to ensure drawing happens when images load
  useEffect(() => {
    if (blueprintData && canvasRef.current && grassImage && flooringImage && gardenLightImage) {
      drawBlueprint();
    }
  }, [blueprintData, grassImage, flooringImage, gardenLightImage]);

  // Main rendering effect - triggers on any relevant change
  useEffect(() => {
    if (blueprintData && canvasRef.current) {
      drawBlueprint();
    }
  }, [blueprintData, furniture, sofaImage, grassImage, flooringImage, gardenLightImage, bedImage, tvImage, kitchenImage, bathroomImage, diningImage, wardrobeImage, selectedFurniture, interactionMode, zoom, panOffset]);

  const drawBlueprint = () => {
    const canvas = canvasRef.current;
    if (!canvas || !blueprintData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Calculate bounds for the blueprint
    const bounds = calculateBlueprintBounds();
    if (!bounds) {
      ctx.restore();
      return;
    }

    // Calculate scale and offset for centering (before zoom/pan)
    const padding = 100;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;
    
    const scale = Math.min(
      availableWidth / bounds.width,
      availableHeight / bounds.height
    );

    const offsetX = (canvas.width - bounds.width * scale) / 2 - bounds.minX * scale;
    const offsetY = (canvas.height - bounds.height * scale) / 2 - bounds.minY * scale;

    // Draw night background with stars and garden lights
    drawNightBackground(ctx, canvas.width, canvas.height);
    
    // Draw grass background with lighting effects
    drawGrassBackground(ctx, canvas.width, canvas.height);
    
    // Draw flooring for indoor areas
    drawFlooring(ctx, offsetX, offsetY, scale, bounds);

    // Draw walls with night theme - ENSURE WALLS ARE VISIBLE
    ctx.strokeStyle = '#ffffff'; // Make walls white/bright for better visibility
    ctx.lineWidth = 3; // Make walls thicker
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 2;
    
    blueprintData.walls.forEach((wall) => {
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

      // Draw wall measurements with night visibility - ALWAYS SHOW MEASUREMENTS
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

    // Reset shadow for other elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw room labels with updated styling - NO GLOW
    ctx.fillStyle = '#ffffff'; // Changed to white for better visibility
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    // Remove glow effect - no shadow
    
    blueprintData.roomLabels.forEach((label) => {
      ctx.fillText(
        label.text,
        offsetX + label.x * scale,
        offsetY + label.y * scale
      );
    });

    // Draw furniture
    drawFurniture(ctx, offsetX, offsetY, scale);

    // Restore canvas transformation
    ctx.restore();
  };

  const drawNightBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Create night sky gradient with dark blue instead of pitch black
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
    gradient.addColorStop(0, '#1a1a2e'); // Dark blue center
    gradient.addColorStop(0.5, '#16213e'); // Darker blue
    gradient.addColorStop(1, '#0f1a2e'); // Darkest blue instead of black
    
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
    
    // Add corner garden lights with glow + CENTER light
    const padding = 80;
    const lightRadius = 60; // Keep the same illumination radius
    const cornerLights = [
      { x: padding, y: padding }, // Top-left
      { x: width - padding, y: padding }, // Top-right
      { x: padding, y: height - padding }, // Bottom-left
      { x: width - padding, y: height - padding }, // Bottom-right
      { x: width / 2, y: height / 2 } // CENTER light
    ];
    
    cornerLights.forEach(light => {
      if (gardenLightImage) {
        // Draw glow effect first (behind the light)
        const glowGradient = ctx.createRadialGradient(
          light.x, light.y - 10, 0, // Adjust position for garden light
          light.x, light.y - 10, 40 // Glow radius
        );
        glowGradient.addColorStop(0, 'rgba(255, 248, 220, 0.6)'); // Bright warm center
        glowGradient.addColorStop(0.3, 'rgba(255, 248, 220, 0.4)'); // Medium glow
        glowGradient.addColorStop(0.7, 'rgba(255, 248, 220, 0.2)'); // Soft edge
        glowGradient.addColorStop(1, 'rgba(255, 248, 220, 0)'); // Fade to transparent
      
        ctx.fillStyle = glowGradient;
      ctx.beginPath();
        ctx.arc(light.x, light.y - 10, 40, 0, Math.PI * 2);
      ctx.fill();
      
        // Draw the garden light image
        const lightSize = 60; // Size of the garden light image
        ctx.drawImage(
          gardenLightImage, 
          light.x - lightSize/2, 
          light.y - lightSize + 10, // Position so light sits on ground
          lightSize, 
          lightSize
        );
      
        // Add additional bright glow around the light bulb area
        const bulbGlow = ctx.createRadialGradient(
          light.x, light.y - 35, 0, // Position at bulb area
          light.x, light.y - 35, 25
      );
        bulbGlow.addColorStop(0, 'rgba(255, 255, 255, 0.8)'); // Bright white center
        bulbGlow.addColorStop(0.3, 'rgba(255, 248, 220, 0.6)'); // Warm glow
        bulbGlow.addColorStop(1, 'rgba(255, 248, 220, 0)'); // Fade out
      
        ctx.fillStyle = bulbGlow;
      ctx.beginPath();
        ctx.arc(light.x, light.y - 35, 25, 0, Math.PI * 2);
      ctx.fill();
      }
    });
  };

  const drawGrassBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Define corner lights positions for grass illumination + CENTER light
    const padding = 80;
    const lightRadius = 60; // REDUCED to match the light beam size
    const cornerLights = [
      { x: padding, y: padding },
      { x: width - padding, y: padding },
      { x: padding, y: height - padding },
      { x: width - padding, y: height - padding },
      { x: width / 2, y: height / 2 } // CENTER light
    ];
    
    if (grassImage) {
      // Draw grass as base layer first - this will be revealed by lights
      const tileSize = 80;
      
      for (let x = 0; x < width; x += tileSize) {
        for (let y = 0; y < height; y += tileSize) {
          const tileWidth = Math.min(tileSize, width - x);
          const tileHeight = Math.min(tileSize, height - y);
          
          // Draw grass tile
          ctx.drawImage(grassImage, x, y, tileWidth, tileHeight);
        }
      }
      
      // Apply SPECIFIC NIGHT COLOR overlay - #202913
      ctx.fillStyle = 'rgba(32, 41, 19, 0.85)'; //rgb(66, 71, 59) with transparency
      ctx.fillRect(0, 0, width, height);
      
      // Now add light effects that reveal grass for ALL 5 lights
      cornerLights.forEach(light => {
        // First, create a mask to "cut out" the dark overlay in the light area
        ctx.save();
        
        // Create circular clipping path for the light area
        ctx.beginPath();
        ctx.arc(light.x, light.y - 10, lightRadius, 0, Math.PI * 2); // Adjusted position for garden light
        ctx.clip();
        
        // Re-draw the grass in this clipped area (this reveals the original grass)
        for (let x = light.x - lightRadius; x < light.x + lightRadius; x += tileSize) {
          for (let y = (light.y - 10) - lightRadius; y < (light.y - 10) + lightRadius; y += tileSize) {
            if (x >= 0 && y >= 0 && x < width && y < height) {
              const tileWidth = Math.min(tileSize, width - x);
              const tileHeight = Math.min(tileSize, height - y);
              ctx.drawImage(grassImage, x, y, tileWidth, tileHeight);
            }
          }
        }
        
        // Apply a much lighter night overlay only in the illuminated area
        const lightGradient = ctx.createRadialGradient(
          light.x, light.y - 10, 0, // Adjusted position for garden light
          light.x, light.y - 10, lightRadius
        );
        
        // Create gradient that keeps grass visible but adds warm lighting
        lightGradient.addColorStop(0, 'rgba(255, 248, 220, 0.1)'); // Very light warm tint at center
        lightGradient.addColorStop(0.3, 'rgba(40, 35, 20, 0.3)'); // Light warm overlay
        lightGradient.addColorStop(0.6, 'rgba(32, 41, 19, 0.6)'); // Medium #202913 overlay
        lightGradient.addColorStop(0.8, 'rgba(32, 41, 19, 0.8)'); // Darker #202913 towards edge
        lightGradient.addColorStop(1, 'rgba(32, 41, 19, 0.85)'); // Full #202913 at edge
        
        ctx.fillStyle = lightGradient;
        ctx.fillRect(light.x - lightRadius, (light.y - 10) - lightRadius, lightRadius * 2, lightRadius * 2);
        
        ctx.restore();
        
        // Add the warm light glow effect on top
        const glowGradient = ctx.createRadialGradient(
          light.x, light.y - 10, 0, // Adjusted position for garden light
          light.x, light.y - 10, lightRadius * 0.7
        );
        glowGradient.addColorStop(0, 'rgba(255, 248, 220, 0.4)'); // Warm center glow
        glowGradient.addColorStop(0.4, 'rgba(255, 248, 220, 0.2)'); // Medium glow
        glowGradient.addColorStop(1, 'rgba(255, 248, 220, 0)'); // Fade out
        
        // Use lighter blend mode to add warmth without obscuring grass
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(light.x, light.y - 10, lightRadius * 0.7, 0, Math.PI * 2); // Adjusted position
                 ctx.fill();
        
        // Reset blend mode
        ctx.globalCompositeOperation = 'source-over';
       });
    } else {
      // Fallback to #202913 based gradient if image not loaded
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#2E3A1D'); // Lighter #202913
      gradient.addColorStop(0.5, '#263117'); // Medium #202913
      gradient.addColorStop(1, '#202913'); // Full #202913
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Add light spots for all 5 lights even with fallback
      cornerLights.forEach(light => {
        const lightGradient = ctx.createRadialGradient(
          light.x, light.y, 0,
          light.x, light.y, lightRadius
        );
        lightGradient.addColorStop(0, 'rgba(120, 170, 120, 0.8)'); // Brighter center
        lightGradient.addColorStop(0.5, 'rgba(100, 140, 100, 0.4)'); // Medium falloff
        lightGradient.addColorStop(1, 'rgba(100, 140, 100, 0)');
        
        ctx.fillStyle = lightGradient;
        ctx.beginPath();
        ctx.arc(light.x, light.y, lightRadius, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  };

  const drawFlooring = (ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, scale: number, bounds: any) => {
    if (flooringImage) {
      // Create a clipping path for the blueprint area
      ctx.save();
      
      // Create a rectangular clipping area for the blueprint bounds
      const flooringX = offsetX + bounds.minX * scale;
      const flooringY = offsetY + bounds.minY * scale;
      const flooringWidth = bounds.width * scale;
      const flooringHeight = bounds.height * scale;
      
      ctx.beginPath();
      ctx.rect(flooringX, flooringY, flooringWidth, flooringHeight);
      ctx.clip();
      
      // Draw flooring as small square tiles with night lighting
      const tileSize = 60; // Size of each flooring tile
      
      for (let x = flooringX; x < flooringX + flooringWidth; x += tileSize) {
        for (let y = flooringY; y < flooringY + flooringHeight; y += tileSize) {
          const tileWidth = Math.min(tileSize, flooringX + flooringWidth - x);
          const tileHeight = Math.min(tileSize, flooringY + flooringHeight - y);
          
          // Draw flooring tile
          ctx.drawImage(flooringImage, x, y, tileWidth, tileHeight);
          
          // Apply DARKER night overlay for indoor areas - much darker for night theme
          ctx.fillStyle = 'rgba(15, 20, 10, 0.8)'; // Much darker overlay with higher opacity
          ctx.fillRect(x, y, tileWidth, tileHeight);
        }
      }
      
      ctx.restore();
    }
  };

  const calculateBlueprintBounds = () => {
    if (!blueprintData || blueprintData.walls.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    blueprintData.walls.forEach(wall => {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      minY = Math.min(minY, wall.start.y, wall.end.y);
      maxX = Math.max(maxX, wall.start.x, wall.end.x);
      maxY = Math.max(maxY, wall.start.y, wall.end.y);
    });

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  const drawFurniture = (ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, scale: number) => {
    furniture.forEach(item => {
      const x = offsetX + item.x * scale;
      const y = offsetY + item.y * scale;
      const width = item.width * scale;
      const height = item.height * scale;

      ctx.save();
      ctx.translate(x + width/2, y + height/2);
      ctx.rotate(item.rotation * Math.PI / 180);
      
      // Add SUBTLE ambient lighting around furniture for night effect - REDUCED intensity
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) * 0.5); // REDUCED from 0.8 to 0.5
      gradient.addColorStop(0, 'rgba(255, 204, 102, 0.05)'); // MUCH REDUCED from 0.1 to 0.05 - very subtle
      gradient.addColorStop(1, 'rgba(255, 204, 102, 0)'); // Fade to transparent
      ctx.fillStyle = gradient;
      ctx.fillRect(-width, -height, width * 2, height * 2);
      
      // Draw furniture shape based on type with DARKER colors for night
      switch (item.type) {
        case 'sofa':
          if (sofaImage) {
            // Draw the sofa image first (preserves transparency)
            ctx.drawImage(sofaImage, -width/2, -height/2, width, height);
            // Apply MILD dark overlay but preserve transparency - much lighter
            ctx.globalCompositeOperation = 'multiply'; // Darkens without affecting transparency
            ctx.fillStyle = 'rgba(32, 41, 19, 0.2)'; // MUCH LIGHTER overlay - only 0.2 opacity
            ctx.fillRect(-width/2, -height/2, width, height);
            // Reset blend mode
            ctx.globalCompositeOperation = 'source-over';
          } else {
            // Fallback to DARKER rectangle if image not loaded
            ctx.fillStyle = '#2D1810'; // DARKER brown for night
            ctx.strokeStyle = '#1A1A1A'; // DARKER stroke
            ctx.lineWidth = 2;
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.strokeRect(-width/2, -height/2, width, height);
          }
          break;
        case 'bed':
          if (bedImage) {
            ctx.drawImage(bedImage, -width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = 'rgba(32, 41, 19, 0.2)'; // MUCH LIGHTER overlay
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'source-over';
          } else {
            ctx.fillStyle = '#3D2F20'; // DARKER for night
            ctx.strokeStyle = '#1A1A1A'; // DARKER stroke
          ctx.lineWidth = 2;
          ctx.fillRect(-width/2, -height/2, width, height);
          ctx.strokeRect(-width/2, -height/2, width, height);
            // Add pillow - darker
            ctx.fillStyle = '#4A4A4A'; // DARKER pillow
          ctx.fillRect(-width/2 + 4, -height/2 + 4, width - 8, height/3);
          }
          break;
        case 'table':
          if (tvImage) {
            ctx.drawImage(tvImage, -width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = 'rgba(32, 41, 19, 0.2)'; // MUCH LIGHTER overlay
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'source-over';
          } else {
            ctx.fillStyle = '#4A2F1A'; // DARKER for night
            ctx.strokeStyle = '#1A1A1A'; // DARKER stroke
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, 0, width/2, height/2, 0, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          }
          break;
        case 'chair':
          if (wardrobeImage) {
            ctx.drawImage(wardrobeImage, -width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = 'rgba(32, 41, 19, 0.2)'; // MUCH LIGHTER overlay
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'source-over';
          } else {
            ctx.fillStyle = '#3D2A1A'; // DARKER for night
            ctx.strokeStyle = '#1A1A1A'; // DARKER stroke
          ctx.lineWidth = 2;
          ctx.fillRect(-width/2, -height/2, width, height);
          ctx.strokeRect(-width/2, -height/2, width, height);
          }
          break;
        case 'tv':
          if (tvImage) {
            ctx.drawImage(tvImage, -width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = 'rgba(32, 41, 19, 0.2)'; // MUCH LIGHTER overlay
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'source-over';
          } else {
            ctx.fillStyle = '#1A1A1A'; // Already dark
            ctx.strokeStyle = '#0F0F0F'; // Even darker stroke
          ctx.lineWidth = 2;
          ctx.fillRect(-width/2, -height/2, width, height);
          ctx.strokeRect(-width/2, -height/2, width, height);
          }
          break;
        case 'refrigerator':
          if (kitchenImage) {
            ctx.drawImage(kitchenImage, -width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = 'rgba(32, 41, 19, 0.2)'; // MUCH LIGHTER overlay
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'source-over';
          } else {
            ctx.fillStyle = '#3A3A3A'; // DARKER white for night
            ctx.strokeStyle = '#1A1A1A'; // DARKER stroke
          ctx.lineWidth = 2;
          ctx.fillRect(-width/2, -height/2, width, height);
          ctx.strokeRect(-width/2, -height/2, width, height);
            // Add handle - darker
            ctx.strokeStyle = '#2A2A2A'; // DARKER handle
          ctx.strokeRect(width/2 - 4, -height/4, 2, height/2);
          }
          break;
        case 'kitchen':
          if (kitchenImage) {
            ctx.drawImage(kitchenImage, -width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = 'rgba(32, 41, 19, 0.2)'; // MUCH LIGHTER overlay
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'source-over';
          } else {
            ctx.fillStyle = '#3A3A3A'; // DARKER white for night
            ctx.strokeStyle = '#1A1A1A'; // DARKER stroke
            ctx.lineWidth = 2;
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.strokeRect(-width/2, -height/2, width, height);
          }
          break;
        case 'bathroom':
          if (bathroomImage) {
            ctx.drawImage(bathroomImage, -width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = 'rgba(32, 41, 19, 0.2)'; // MUCH LIGHTER overlay
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'source-over';
          } else {
            ctx.fillStyle = '#3A3A3A'; // DARKER white for night
            ctx.strokeStyle = '#1A1A1A'; // DARKER stroke
            ctx.lineWidth = 2;
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.strokeRect(-width/2, -height/2, width, height);
          }
          break;
        case 'dining':
          if (diningImage) {
            ctx.drawImage(diningImage, -width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = 'rgba(32, 41, 19, 0.2)'; // MUCH LIGHTER overlay
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'source-over';
          } else {
            ctx.fillStyle = '#3A3A3A'; // DARKER white for night
            ctx.strokeStyle = '#1A1A1A'; // DARKER stroke
            ctx.lineWidth = 2;
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.strokeRect(-width/2, -height/2, width, height);
          }
          break;
        case 'wardrobe':
          if (wardrobeImage) {
            ctx.drawImage(wardrobeImage, -width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = 'rgba(32, 41, 19, 0.2)'; // MUCH LIGHTER overlay
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.globalCompositeOperation = 'source-over';
          } else {
            ctx.fillStyle = '#3D2A1A'; // DARKER for night
            ctx.strokeStyle = '#1A1A1A'; // DARKER stroke
            ctx.lineWidth = 2;
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.strokeRect(-width/2, -height/2, width, height);
          }
          break;
      }
      
      ctx.restore();
      
      // Draw selection outline and mode-specific handles
      if (selectedFurniture === item.id) {
        // Selection outline
        ctx.strokeStyle = '#00bcd4';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
        ctx.setLineDash([]);

        // Mode-specific visual feedback
        if (interactionMode === 'rotate') {
          // Rotation handle
          const centerX = x + width/2;
          const centerY = y + height/2;
          const rotateHandleDistance = Math.max(width, height) * 0.6;
          const rotateHandleX = centerX + rotateHandleDistance * Math.cos(-Math.PI/2);
          const rotateHandleY = centerY + rotateHandleDistance * Math.sin(-Math.PI/2);
          
          // Line from center to rotate handle
          ctx.strokeStyle = '#ff9800';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(rotateHandleX, rotateHandleY);
          ctx.stroke();
          
          // Rotate handle
          ctx.fillStyle = '#ff9800';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(rotateHandleX, rotateHandleY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // Center point
          ctx.fillStyle = '#ff9800';
          ctx.beginPath();
          ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (interactionMode === 'move') {
          // Move cursor indicator
          const centerX = x + width/2;
          const centerY = y + height/2;
          
          ctx.fillStyle = '#4caf50';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          
          // Draw move arrows (cross pattern)
          const arrowSize = 12;
          ctx.beginPath();
          // Horizontal arrow
          ctx.moveTo(centerX - arrowSize, centerY);
          ctx.lineTo(centerX + arrowSize, centerY);
          ctx.moveTo(centerX + arrowSize - 3, centerY - 3);
          ctx.lineTo(centerX + arrowSize, centerY);
          ctx.lineTo(centerX + arrowSize - 3, centerY + 3);
          ctx.moveTo(centerX - arrowSize + 3, centerY - 3);
          ctx.lineTo(centerX - arrowSize, centerY);
          ctx.lineTo(centerX - arrowSize + 3, centerY + 3);
          
          // Vertical arrow
          ctx.moveTo(centerX, centerY - arrowSize);
          ctx.lineTo(centerX, centerY + arrowSize);
          ctx.moveTo(centerX - 3, centerY + arrowSize - 3);
          ctx.lineTo(centerX, centerY + arrowSize);
          ctx.lineTo(centerX + 3, centerY + arrowSize - 3);
          ctx.moveTo(centerX - 3, centerY - arrowSize + 3);
          ctx.lineTo(centerX, centerY - arrowSize);
          ctx.lineTo(centerX + 3, centerY - arrowSize + 3);
          
          ctx.stroke();
        }
      }
    });
  };

  const formatMeasurement = (pixelLength: number, realLength?: number): string => {
    // If we have calibrated real length, use it
    if (realLength && blueprintData?.calibration?.pixelsPerInch && blueprintData.calibration.pixelsPerInch > 0) {
      const unit = blueprintData.calibration.unit || blueprintData.calibration.measurementUnit || 'feet';
      if (unit === 'feet' || unit === 'ft') {
        const feet = Math.floor(realLength / 12);
        const inches = Math.round(realLength % 12);
        return feet > 0 ? `${feet}'${inches}"` : `${inches}"`;
      }
      return `${realLength.toFixed(1)} ${unit}`;
    }
    
    // Fallback: Estimate in feet if not calibrated
    if (pixelLength && pixelLength > 0) {
      // Use a reasonable estimation: assume 96 DPI and scale appropriately
      const estimatedFeet = (pixelLength * (window.devicePixelRatio || 1)) / (96 * 0.25);
    const feet = Math.floor(estimatedFeet);
    const inches = Math.round((estimatedFeet - feet) * 12);
    return feet > 0 ? `~${feet}'${inches}"` : `~${inches}"`;
    }
    
    // Last fallback
    return "0'0\"";
  };

  if (loading) {
    return (
      <div className="min-h-screen premium-gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="premium-text text-primary">Loading blueprint...</p>
        </div>
      </div>
    );
  }

  if (!blueprintData) {
    return (
      <div className="min-h-screen premium-gradient-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <Zap className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="premium-title text-red-600">No Blueprint Data Found</h1>
          <p className="premium-text">Please create a blueprint first.</p>
          <Link href="/">
            <Button className="mt-4 warm-button">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Editor
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleDrop = (event: React.DragEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const data = JSON.parse(event.dataTransfer.getData('text/plain'));
    const type = data.type;

    if (!blueprintData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Apply inverse zoom and pan transformations
    const canvasX = (x - panOffset.x) / zoom;
    const canvasY = (y - panOffset.y) / zoom;

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

    const blueprintX = (canvasX - offsetX) / scale;
    const blueprintY = (canvasY - offsetY) / scale;

    const furnitureSize = getFurnitureSize(type);

    const newFurniture: Furniture = {
      id: Date.now().toString(),
      type: type,
      x: blueprintX - furnitureSize.width / 2,
      y: blueprintY - furnitureSize.height / 2,
      width: furnitureSize.width,
      height: furnitureSize.height,
      rotation: 0,
      color: getFurnitureColor(type)
    };

    setFurniture(prev => [...prev, newFurniture]);
    setSelectedFurniture(newFurniture.id);
  };

  const handleDragOver = (event: React.DragEvent<HTMLCanvasElement>) => {
    event.preventDefault();
  };

  const handleDragLeave = (event: React.DragEvent<HTMLCanvasElement>) => {
    // Optional: add a visual feedback when dragging leaves the droppable area
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !blueprintData) return;

    // In pan mode, don't handle clicks for furniture selection
    if (interactionMode === 'pan') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Account for canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Apply inverse zoom and pan transformations to get actual canvas coordinates
    const canvasX = (x - panOffset.x) / zoom;
    const canvasY = (y - panOffset.y) / zoom;

    // Convert to blueprint coordinates
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

    // Check if clicking on furniture first
    let clickedFurniture = null;
    
    for (const item of furniture) {
      const furnitureX = offsetX + item.x * scale;
      const furnitureY = offsetY + item.y * scale;
      const furnitureWidth = item.width * scale;
      const furnitureHeight = item.height * scale;
      
      // Check if clicking on furniture body (using transformed coordinates)
      if (canvasX >= furnitureX && canvasX <= furnitureX + furnitureWidth &&
          canvasY >= furnitureY && canvasY <= furnitureY + furnitureHeight) {
        clickedFurniture = item;
        break;
      }
    }
    
    if (clickedFurniture) {
      // Select furniture and prepare for interaction
      setSelectedFurniture(clickedFurniture.id);
      setResizingFurniture(null); // Clear old resize state
      
      if (interactionMode === 'move') {
        setIsDragging(true);
        setDragStart({ x, y });
      } else if (interactionMode === 'rotate') {
        setIsRotating(true);
        const centerX = offsetX + (clickedFurniture.x + clickedFurniture.width/2) * scale;
        const centerY = offsetY + (clickedFurniture.y + clickedFurniture.height/2) * scale;
        const angle = Math.atan2(canvasY - centerY, canvasX - centerX);
        setRotateStart({ x: centerX, y: centerY, angle: angle - (clickedFurniture.rotation * Math.PI / 180) });
      }
    } else {
      // Deselect furniture if clicking on empty area (no more click-to-place)
      setSelectedFurniture(null);
      setResizingFurniture(null);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !blueprintData) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Handle panning (middle mouse button OR pan mode with left mouse)
    if (isPanning && panStart) {
      const deltaX = x - panStart.x;
      const deltaY = y - panStart.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setPanStart({ x, y });
      return;
    }

    // Apply inverse zoom and pan transformations
    const canvasX = (x - panOffset.x) / zoom;
    const canvasY = (y - panOffset.y) / zoom;

    // Handle furniture dragging (only in move mode)
    if (isDragging && dragStart && selectedFurniture && interactionMode === 'move') {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      const bounds = calculateBlueprintBounds();
      if (!bounds) return;

      const padding = 100;
      const availableWidth = canvas.width - padding * 2;
      const availableHeight = canvas.height - padding * 2;
      
      const scale = Math.min(
        availableWidth / bounds.width,
        availableHeight / bounds.height
      );

      const blueprintDeltaX = deltaX / (scale * zoom);
      const blueprintDeltaY = deltaY / (scale * zoom);

      setFurniture(prev => prev.map(item => 
        item.id === selectedFurniture 
          ? { ...item, x: item.x + blueprintDeltaX, y: item.y + blueprintDeltaY }
          : item
      ));
      
      setDragStart({ x, y });
    }

    // Handle furniture rotation (only in rotate mode)
    if (isRotating && rotateStart && selectedFurniture && interactionMode === 'rotate') {
      const angle = Math.atan2(canvasY - rotateStart.y, canvasX - rotateStart.x);
      const rotation = ((angle - rotateStart.angle) * 180 / Math.PI) % 360;
      
      setFurniture(prev => prev.map(item => 
        item.id === selectedFurniture 
          ? { ...item, rotation: rotation }
          : item
      ));
    }
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Handle middle mouse button for panning (always works)
    if (event.button === 1) { 
      event.preventDefault();
      setIsPanning(true);
      setPanStart({ x, y });
      return;
    }

    // Handle left mouse button in pan mode
    if (event.button === 0 && interactionMode === 'pan') {
      event.preventDefault();
      setIsPanning(true);
      setPanStart({ x, y });
      return;
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setIsRotating(false);
    setRotateStart(null);
    setIsPanning(false);
    setPanStart(null);
  };

  // Size control functions
  const increaseFurnitureSize = (furnitureId: string) => {
    setFurniture(prev => prev.map(item => {
      if (item.id === furnitureId) {
        const scaleFactor = 1.1; // Increase by 10%
        return {
          ...item,
          width: Math.min(item.width * scaleFactor, 200), // Max size limit
          height: Math.min(item.height * scaleFactor, 200)
        };
      }
      return item;
    }));
  };

  const decreaseFurnitureSize = (furnitureId: string) => {
    setFurniture(prev => prev.map(item => {
      if (item.id === furnitureId) {
        const scaleFactor = 0.9; // Decrease by 10%
        return {
          ...item,
          width: Math.max(item.width * scaleFactor, 20), // Min size limit
          height: Math.max(item.height * scaleFactor, 20)
        };
      }
      return item;
    }));
  };

  const getFurnitureSize = (type: Furniture['type']) => {
    switch (type) {
      case 'sofa': return { width: 80, height: 40 };
      case 'bed': return { width: 70, height: 50 };
      case 'table': return { width: 50, height: 50 };
      case 'chair': return { width: 30, height: 30 };
      case 'tv': return { width: 60, height: 10 };
      case 'refrigerator': return { width: 30, height: 40 };
      case 'kitchen': return { width: 80, height: 60 };
      case 'bathroom': return { width: 60, height: 40 };
      case 'dining': return { width: 90, height: 60 };
      case 'wardrobe': return { width: 50, height: 30 };
      default: return { width: 40, height: 40 };
    }
  };

  const getFurnitureColor = (type: Furniture['type']) => {
    switch (type) {
      case 'sofa': return '#8B4513';
      case 'bed': return '#DEB887';
      case 'table': return '#D2691E';
      case 'chair': return '#CD853F';
      case 'tv': return '#2F4F4F';
      case 'refrigerator': return '#F5F5F5';
      case 'kitchen': return '#8B7355';
      case 'bathroom': return '#E6E6FA';
      case 'dining': return '#A0522D';
      case 'wardrobe': return '#8B4513';
      default: return '#A0A0A0';
    }
  };

  const furnitureTypes = [
    { type: 'sofa' as const, icon: Sofa, label: 'Sofa' },
    { type: 'bed' as const, icon: Bed, label: 'Bed' },
    { type: 'dining' as const, icon: Table, label: 'Dining' },
    { type: 'kitchen' as const, icon: Refrigerator, label: 'Kitchen' },
    { type: 'bathroom' as const, icon: Armchair, label: 'Bathroom' },
    { type: 'tv' as const, icon: Tv, label: 'TV' },
    { type: 'wardrobe' as const, icon: Armchair, label: 'Wardrobe' },
    { type: 'table' as const, icon: Table, label: 'Table' },
    { type: 'chair' as const, icon: Armchair, label: 'Chair' },
    { type: 'refrigerator' as const, icon: Refrigerator, label: 'Fridge' }
  ];

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, type: Furniture['type']) => {
    event.dataTransfer.setData('text/plain', JSON.stringify({ type }));
    setSelectedFurnitureType(type);
  };

  // Zoom functionality
  const handleZoom = (delta: number, centerX?: number, centerY?: number) => {
    const zoomFactor = 1.1;
    const newZoom = delta > 0 ? zoom * zoomFactor : zoom / zoomFactor;
    const clampedZoom = Math.max(0.1, Math.min(5, newZoom)); // Limit zoom between 0.1x and 5x
    
    if (centerX !== undefined && centerY !== undefined) {
      // Zoom towards the cursor position
      const scaleDiff = clampedZoom - zoom;
      setPanOffset(prev => ({
        x: prev.x - (centerX - prev.x) * scaleDiff / zoom,
        y: prev.y - (centerY - prev.y) * scaleDiff / zoom
      }));
    }
    
    setZoom(clampedZoom);
  };

  // Reset zoom and pan
  const resetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Handle wheel for zooming
  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const centerX = event.clientX - rect.left;
    const centerY = event.clientY - rect.top;
    
    handleZoom(-event.deltaY, centerX, centerY);
  };

  return (
    <div className="min-h-screen premium-gradient-bg">
      {/* Premium Header */}
      <header className="bg-card/80 shadow-sm border-b border-border backdrop-blur-xl warm-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Image
                  src="/lightscapelogo.png"
                  alt="Lightscape Logo"
                  width={32}
                  height={32}
                  className="warm-glow"
                />
                <div className="flex flex-col">
                  <h1 className="text-xl font-semibold warm-text text-primary">
                    Belecure
                  </h1>
                  <p className="text-xs premium-text opacity-75">A Product of Lightscape</p>
                </div>
              </div>
              <div className="border-l border-border pl-4">
                <h2 className="text-lg font-medium warm-text">
                  Blueprint Enhancement
                </h2>
                <p className="text-sm premium-text">
                  Add furniture and enhance your floor plan • Ctrl+C to copy, Ctrl+V to paste
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="outline" size="sm" className="border-border hover:bg-muted text-foreground hover:text-primary warm-border">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Button 
                onClick={() => {
                  // Save enhanced data to localStorage before navigating
                  const enhancedData = { ...blueprintData, furniture };
                  localStorage.setItem('enhancedBlueprintData', JSON.stringify(enhancedData));
                  // Navigate to lighting page
                  window.location.href = '/lighting';
                }}
                className="warm-button"
              >
                <Zap className="h-4 w-4 mr-2" />
                Go to Lighting
              </Button>
              <Button 
                onClick={() => {
                  const enhancedData = { ...blueprintData, furniture };
                  const dataStr = JSON.stringify(enhancedData, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `enhanced-blueprint-${Date.now()}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Enhanced Plan
              </Button>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Enhanced Furniture Toolbar with Drag & Drop */}
        <div className="w-64 bg-card/90 border-r border-border shadow-sm flex flex-col py-6 space-y-4 warm-border">
          <h3 className="text-sm font-medium premium-label text-center">
            FURNITURE LIBRARY
          </h3>
          <div className="w-full h-px bg-border mx-4"></div>
          
          {/* Interaction Mode Buttons */}
          <div className="px-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={interactionMode === 'select' ? "default" : "ghost"}
                size="sm"
                className={`p-2 flex flex-col items-center justify-center text-xs ${
                  interactionMode === 'select' 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => setInteractionMode('select')}
                title="Select Mode"
              >
                <span>🎯</span>
                <span className="text-[8px]">SELECT</span>
              </Button>
              <Button
                variant={interactionMode === 'move' ? "default" : "ghost"}
                size="sm"
                className={`p-2 flex flex-col items-center justify-center text-xs ${
                  interactionMode === 'move' 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => setInteractionMode('move')}
                title="Move Mode"
              >
                <span>✋</span>
                <span className="text-[8px]">MOVE</span>
              </Button>
              <Button
                variant={interactionMode === 'rotate' ? "default" : "ghost"}
                size="sm"
                className={`p-2 flex flex-col items-center justify-center text-xs ${
                  interactionMode === 'rotate' 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => setInteractionMode('rotate')}
                title="Rotate Mode"
              >
                <span>🔄</span>
                <span className="text-[8px]">ROTATE</span>
              </Button>
              <Button
                variant={interactionMode === 'pan' ? "default" : "ghost"}
                size="sm"
                className={`p-2 flex flex-col items-center justify-center text-xs ${
                  interactionMode === 'pan' 
                    ? 'bg-purple-500 text-white hover:bg-purple-600' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => setInteractionMode('pan')}
                title="Pan Mode - Drag to move view"
              >
                <span>👆</span>
                <span className="text-[8px]">PAN</span>
              </Button>
            </div>
          </div>
          
          <div className="w-full h-px bg-gray-600 mx-4"></div>
          
          {/* Furniture Images Grid - Drag & Drop */}
          <div className="px-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              {/* Sofa */}
              <div 
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, 'sofa')}
                title="Drag to place Sofa"
              >
                <div className="aspect-square bg-gray-600 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                  {sofaImage ? (
                    <img 
                      src="/sofatop.png" 
                      alt="Sofa" 
                      className="w-full h-full object-cover rounded-md"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">Loading...</span>
                  )}
                </div>
                <p className="text-xs text-gray-300 text-center font-medium">Sofa</p>
              </div>

              {/* Bed */}
              <div 
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, 'bed')}
                title="Drag to place Bed"
              >
                <div className="aspect-square bg-gray-600 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                  {bedImage ? (
                    <img 
                      src="/bedtop.jpg" 
                      alt="Bed" 
                      className="w-full h-full object-cover rounded-md"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">Loading...</span>
                  )}
                </div>
                <p className="text-xs text-gray-300 text-center font-medium">Bed</p>
              </div>

              {/* Dining */}
              <div 
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, 'dining')}
                title="Drag to place Dining Set"
              >
                <div className="aspect-square bg-gray-600 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                  {diningImage ? (
                    <img 
                      src="/diningtop.png" 
                      alt="Dining" 
                      className="w-full h-full object-cover rounded-md"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">Loading...</span>
                  )}
                </div>
                <p className="text-xs text-gray-300 text-center font-medium">Dining</p>
              </div>

              {/* Kitchen */}
              <div 
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, 'kitchen')}
                title="Drag to place Kitchen"
              >
                <div className="aspect-square bg-gray-600 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                  {kitchenImage ? (
                    <img 
                      src="/kitchentop.png" 
                      alt="Kitchen" 
                      className="w-full h-full object-cover rounded-md"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">Loading...</span>
                  )}
                </div>
                <p className="text-xs text-gray-300 text-center font-medium">Kitchen</p>
              </div>

              {/* Bathroom */}
              <div 
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, 'bathroom')}
                title="Drag to place Bathroom"
              >
                <div className="aspect-square bg-gray-600 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                  {bathroomImage ? (
                    <img 
                      src="/bathroom.png" 
                      alt="Bathroom" 
                      className="w-full h-full object-cover rounded-md"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">Loading...</span>
                  )}
                </div>
                <p className="text-xs text-gray-300 text-center font-medium">Bathroom</p>
              </div>

              {/* TV */}
              <div 
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, 'tv')}
                title="Drag to place TV"
              >
                <div className="aspect-square bg-gray-600 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                  {tvImage ? (
                    <img 
                      src="/tvtop.png" 
                      alt="TV" 
                      className="w-full h-full object-cover rounded-md"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">Loading...</span>
                  )}
                </div>
                <p className="text-xs text-gray-300 text-center font-medium">TV</p>
              </div>

              {/* Wardrobe */}
              <div 
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, 'wardrobe')}
                title="Drag to place Wardrobe"
              >
                <div className="aspect-square bg-gray-600 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                  {wardrobeImage ? (
                    <img 
                      src="/wardrobetop.jpg" 
                      alt="Wardrobe" 
                      className="w-full h-full object-cover rounded-md"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">Loading...</span>
                  )}
                </div>
                <p className="text-xs text-gray-300 text-center font-medium">Wardrobe</p>
              </div>

              {/* Table */}
              <div 
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, 'table')}
                title="Drag to place Table"
              >
                <div className="aspect-square bg-gray-600 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                  <div className="w-8 h-8 bg-amber-600 rounded-full"></div>
                </div>
                <p className="text-xs text-gray-300 text-center font-medium">Table</p>
              </div>
            </div>
          </div>

          {/* Clear All Button */}
          {furniture.length > 0 && (
            <>
              <div className="w-full h-px bg-gray-600 mx-4"></div>
              <div className="px-4">
              <Button
                variant="ghost"
                size="sm"
                  className="w-full text-red-400 hover:bg-red-900/20 hover:text-red-300"
                onClick={() => setFurniture([])}
                title="Clear All Furniture"
              >
                  Clear All Furniture
              </Button>
              </div>
            </>
          )}

          {/* Copy Indicator */}
          {copiedFurniture && (
            <>
              <div className="w-full h-px bg-gray-600 mx-4"></div>
              <div className="px-4">
                <div className="flex items-center justify-center p-2 bg-green-900/20 border border-green-700 rounded-lg">
                  <span className="text-green-400 text-xs">📋 {copiedFurniture.type} copied</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Blueprint Canvas - Fixed to top with no gap */}
        <div className="flex-1 flex flex-col p-4 bg-gray-900">
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Enhanced Floor Plan</h2>
                  <p className="text-sm text-gray-400">
                    Click to place furniture • {furniture.length} items placed
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Zoom Controls */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                      onClick={() => handleZoom(-1)}
                      title="Zoom Out"
                    >
                      <span className="text-lg">−</span>
                    </Button>
                    <span className="text-xs text-gray-400 min-w-[3rem] text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                      onClick={() => handleZoom(1)}
                      title="Zoom In"
                    >
                      <span className="text-lg">+</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                      onClick={resetView}
                      title="Reset View"
                    >
                      <span className="text-xs">Reset</span>
                    </Button>
                  </div>
                  
                  {selectedFurnitureType && (
                    <div className="flex items-center space-x-2 text-sm text-blue-400 bg-blue-900/20 px-3 py-1 rounded-full border border-blue-800">
                      <Plus className="h-4 w-4" />
                      <span>Click to place {selectedFurnitureType}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-800 canvas-night-mode">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`rounded-lg border border-gray-600 shadow-inner ${
                  interactionMode === 'pan' ? 'cursor-grab' : 'cursor-crosshair'
                }`}
                style={{ maxWidth: '100%', height: 'auto' }}
                onWheel={handleWheel}
                onMouseDown={handleCanvasMouseDown}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Reorganized with Furniture List at Top */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 shadow-sm overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Furniture List - Moved to Top */}
            {furniture.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Placed Furniture</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {furniture.map((item, index) => (
                    <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg ${
                      selectedFurniture === item.id ? 'bg-blue-900/30 border border-blue-700' : 'bg-gray-700'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-100 capitalize">
                          {item.type} {index + 1}
                        </span>
                          {selectedFurniture === item.id && (
                            <span className="text-xs text-blue-400">
                              {item.rotation !== 0 && `${Math.round(item.rotation)}° • `}
                              {Math.round(item.width)}×{Math.round(item.height)}
                            </span>
                          )}
                      </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {/* Size Controls */}
                      <Button
                        variant="ghost"
                        size="sm"
                          className="p-1 text-xs text-purple-400 hover:bg-purple-900/20 hover:text-purple-300"
                          onClick={() => decreaseFurnitureSize(item.id)}
                          title="Decrease Size"
                        >
                          -
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 text-xs text-purple-400 hover:bg-purple-900/20 hover:text-purple-300"
                          onClick={() => increaseFurnitureSize(item.id)}
                          title="Increase Size"
                        >
                          +
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`p-1 text-xs ${
                            selectedFurniture === item.id 
                              ? 'text-blue-400 hover:bg-blue-900/20' 
                              : 'text-gray-500 hover:bg-gray-600'
                          }`}
                          onClick={() => setSelectedFurniture(selectedFurniture === item.id ? null : item.id)}
                        >
                          {selectedFurniture === item.id ? '👁️' : '👁️‍🗨️'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-900/20 hover:text-red-300 p-1"
                        onClick={() => setFurniture(prev => prev.filter(f => f.id !== item.id))}
                      >
                        <span className="text-xs">×</span>
                      </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blueprint Info */}
              <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Blueprint Info</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Walls</p>
                  <p className="text-lg font-semibold text-gray-100">{blueprintData.metadata.wallCount}</p>
                    </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Rooms</p>
                  <p className="text-lg font-semibold text-gray-100">{blueprintData.metadata.labelCount}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Furniture</p>
                  <p className="text-lg font-semibold text-gray-100">{furniture.length}</p>
              </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Status</p>
                  <p className="text-sm font-medium text-green-400">
                    {blueprintData.metadata.isCalibrated ? 'Calibrated' : 'Estimated'}
                  </p>
                </div>
              </div>
                
                {/* Measurement Details */}
                {blueprintData.calibration?.isCalibrated && (
                  <div className="mt-4 bg-blue-900/20 border border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-blue-400 mb-1">Calibration Details</p>
                    <p className="text-sm text-gray-200">
                      <span className="font-semibold">{blueprintData.calibration.pixelsPerInch?.toFixed(2)}</span> pixels per inch
                    </p>
                    <p className="text-xs text-gray-400">
                      Units: {blueprintData.metadata?.units || blueprintData.calibration?.measurementUnit || 'feet'}
                    </p>
                    {blueprintData.calibration.referenceWall && (
                      <p className="text-xs text-gray-400">
                        Reference: Wall {blueprintData.walls.findIndex(w => w.id === blueprintData.calibration.calibratedWallId) + 1}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Total Measurements Summary */}
                {blueprintData.walls && blueprintData.walls.length > 0 && (
                  <div className="mt-4 bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-2">Total Perimeter</p>
                    {blueprintData.calibration?.isCalibrated ? (
                      <div>
                        <p className="text-lg font-semibold text-green-400">
                          {blueprintData.walls.reduce((total, wall) => {
                            if (wall.realLength) {
                              const length = parseFloat(wall.measurement?.replace(/[^\d.]/g, '') || '0');
                              return total + length;
                            }
                            return total;
                          }, 0).toFixed(1)} {blueprintData.metadata?.units || 'ft'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Calibrated measurement
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-semibold text-yellow-400">
                          ~{blueprintData.walls.reduce((total, wall) => {
                            const length = parseFloat((wall.estimatedMeasurement || wall.measurement || '0').replace(/[^\d.]/g, ''));
                            return total + length;
                          }, 0).toFixed(1)} ft
                        </p>
                        <p className="text-xs text-gray-500">
                          Estimated measurement
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

            {/* Furniture Controls */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-100 mb-2">Controls</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <p><strong className="text-cyan-400">Mode:</strong> {interactionMode.toUpperCase()}</p>
                <div className="border-t border-gray-600 my-2"></div>
                <p>• <span className="text-blue-400">🎯 SELECT:</span> Click to select/place</p>
                <p>• <span className="text-green-400">✋ MOVE:</span> Select & drag furniture</p>
                <p>• <span className="text-orange-400">🔄 ROTATE:</span> Drag handle to rotate</p>
                <p>• <span className="text-purple-400">👆 PAN:</span> Drag to move view</p>
                <p>• <span className="text-purple-400">📏 SIZE:</span> Use +/- buttons to resize</p>
                <div className="border-t border-gray-600 my-2"></div>
                <p>• <kbd className="bg-gray-600 px-1 rounded">Wheel</kbd> to zoom</p>
                <p>• <kbd className="bg-gray-600 px-1 rounded">Middle+drag</kbd> to pan</p>
                <p>• <kbd className="bg-gray-600 px-1 rounded">Ctrl+C</kbd> to copy</p>
                <p>• <kbd className="bg-gray-600 px-1 rounded">Ctrl+V</kbd> to paste</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-3 text-center premium-text border-t border-border warm-border">
        <div className="flex items-center justify-center space-x-2">
          <Image
            src="/lightscapelogo.png"
            alt="Lightscape Logo"
            width={16}
            height={16}
            className="opacity-75"
          />
                          <span>© 2025 <span className="text-primary font-medium">Belecure</span> - A Product of <span className="text-primary font-medium">Lightscape</span>. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
} 