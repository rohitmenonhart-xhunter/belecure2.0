"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
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
  CheckCircle2,
  ArrowLeft,
  Zap,
  Activity
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
  isSelected?: boolean;
  gapDistance?: number;
  gapUnit?: 'feet' | 'meters';
}

// Add the comprehensive LightSymbol component from lighting page
const LightSymbol = ({ type, size = 24, ...props }: { type: LightFixture['type'], size?: number, [key: string]: any }) => {
  const magenta = '#FF00FF';

  switch (type) {
    case 'spot-type1': {
      return (
        <svg {...props} viewBox="0 0 24 24">
           <circle cx="12" cy="12" r="8" stroke={magenta} strokeWidth="1" />
           <circle cx="12" cy="12" r="5" fill={magenta} stroke="none" />
        </svg>
      );
    }
    case 'spot-type2': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" stroke={magenta} strokeWidth="4" />
           <circle cx="12" cy="12" r="4" stroke={magenta} strokeWidth="1" />
        </svg>
      );
    }
    case 'spot-type3': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" stroke={magenta} strokeWidth="4" />
        </svg>
      );
    }
    case 'spot-type4': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" stroke={magenta} strokeWidth="3" />
           <circle cx="12" cy="12" r="4" stroke={magenta} strokeWidth="1" />
        </svg>
      );
    }
    case 'spot-type5-wall-washer': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path
            d="M12 2C6.48 2 2 6.48 2 12H22C22 6.48 17.52 2 12 2Z"
            fill={magenta}
          />
          <path d="M2 12V20C2 21.1 2.9 22 4 22H20C21.1 22 22 21.1 22 20V12H2Z" fill="black" />
        </svg>
      );
    }
    case 'adjustable-spot-type6': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <defs>
            <clipPath id="adjustable-spot-clip">
              <rect x="0" y="0" width="12" height="24" />
            </clipPath>
          </defs>
          <path d="M12 2 A10 10 0 0 0 2 12 H 22 A10 10 0 0 0 12 2Z" fill={magenta} />
          <path d="M12 2 A10 10 0 0 0 2 12 H 22 A10 10 0 0 0 12 2Z" fill="black" clipPath="url(#adjustable-spot-clip)" />
        </svg>
      );
    }
    case 'mini-spot': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="6" stroke={magenta} strokeWidth="3" />
           <circle cx="12" cy="12" r="2" fill={magenta} />
        </svg>
      );
    }
    case 'bed-reading-spot': {
         return (
           <svg {...props} viewBox="0 0 24 24">
             <circle cx="12" cy="12" r="7" stroke={magenta} strokeWidth="3" />
           </svg>
         );
    }
    case 'waterproof-spot': {
      return (
        <svg {...props} viewBox="0 0 24 24">
           <defs>
            <pattern id="waterproof-hatch" patternUnits="userSpaceOnUse" width="4" height="4">
              <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" style={{ stroke: magenta, strokeWidth: 1 }} />
            </pattern>
          </defs>
          <circle cx="12" cy="12" r="9" fill="url(#waterproof-hatch)" />
          <circle cx="12" cy="12" r="9" stroke={magenta} strokeWidth="1.5" fill="none" />
        </svg>
      );
    }
    case 'wall-washer-spot': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M12 2 A10 10 0 0 0 2 12 H22 A10 10 0 0 0 12 2Z" fill="black" />
           <path d="M12 2 A10 10 0 0 0 2 12" stroke={magenta} strokeWidth="1.5" fill="none" />
        </svg>
      );
    }
    case 'laser-blade': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <rect x="2" y="8" width="20" height="8" fill="black" stroke={magenta} strokeWidth="1" />
          <line x1="4" y1="12" x2="20" y2="12" stroke={magenta} strokeWidth="1.5" />
        </svg>
      );
    }
    case 'linear-wall-washer': {
         return (
             <svg {...props} viewBox="0 0 24 24">
                 <rect x="4" y="10" width="16" height="4" fill="black" stroke={magenta} strokeWidth="1.5" />
             </svg>
         );
    }
    case 'linear-profile-lighting': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <rect x="2" y="11" width="20" height="2" fill={magenta} />
        </svg>
      );
    }
    case 'gimbel-spot': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" stroke={magenta} strokeWidth="2" />
          <circle cx="12" cy="12" r="4" fill={magenta} />
          <line x1="4" y1="12" x2="20" y2="12" stroke={magenta} strokeWidth="1" />
        </svg>
      );
    }
    case 'surface-spot-light-indoor': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" fill={magenta} />
        </svg>
      );
    }
    case 'surface-spot-light-indoor-2': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" stroke={magenta} strokeWidth="2" />
          <circle cx="12" cy="12" r="4" fill={magenta} />
        </svg>
      );
    }
    case 'downlight': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" stroke={magenta} strokeWidth="1.5" />
          <circle cx="12" cy="12" r="5" fill={magenta} />
        </svg>
      );
    }
    case 'surface-panel': {
      return (
        <svg {...props} viewBox="0 0 24 24">
           <defs>
              <clipPath id="surface-panel-clip">
                <rect x="10" y="0" width="4" height="24" />
              </clipPath>
           </defs>
          <circle cx="12" cy="12" r="9" fill={magenta} />
           <circle cx="12" cy="12" r="9" fill={magenta} clipPath="url(#surface-panel-clip)" />
        </svg>
      );
    }
    case 'indoor-strip-light': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <line x1="12" y1="4" x2="12" y2="20" stroke={magenta} strokeWidth="3" strokeDasharray="4 2" />
        </svg>
      );
    }
    case 'curtain-grazer': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <line x1="12" y1="4" x2="12" y2="20" stroke={magenta} strokeWidth="3" />
           <line x1="10" y1="4" x2="10" y2="20" stroke={magenta} strokeWidth="1" />
           <line x1="14" y1="4" x2="14" y2="20" stroke={magenta} strokeWidth="1" />
        </svg>
      );
    }
    case 'outdoor-profile': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <line x1="12" y1="4" x2="12" y2="20" stroke="red" strokeWidth="3" strokeDasharray="4 2" />
        </svg>
      );
    }
    case 'magnetic-track': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <rect x="2" y="10" width="20" height="4" fill="#333" stroke="#555" strokeWidth="1" />
        </svg>
      );
    }
    case 'track-spot': {
      return (
        <svg {...props} viewBox="0 0 24 24">
          <rect x="2" y="10" width="20" height="4" fill="#333" />
          <circle cx="8" cy="12" r="3" fill={magenta} />
          <circle cx="16" cy="12" r="3" fill={magenta} />
        </svg>
      );
    }
    case 'track-spot-2': {
         return (
             <svg {...props} viewBox="0 0 24 24">
                 <rect x="2" y="10" width="20" height="4" fill="#333" />
                 <rect x="6" y="8" width="4" height="8" fill={magenta} />
                 <rect x="14" y="8" width="4" height="8" fill={magenta} />
             </svg>
         );
    }
    case 'magnetic-laser-blade': {
        const darkRed = '#8B0000';
        return (
            <svg {...props} viewBox="0 0 24 24">
                <rect x="2" y="8" width="20" height="8" fill={darkRed} stroke={magenta} strokeWidth="1" />
                <line x1="4" y1="12" x2="20" y2="12" stroke={magenta} strokeWidth="1.5" />
            </svg>
        );
    }
    case 'magnetic-laser-blade-large': {
        const darkRed = '#8B0000';
        return (
            <svg {...props} viewBox="0 0 24 24">
                <rect x="1" y="7" width="22" height="10" fill={darkRed} stroke={magenta} strokeWidth="1" />
                <line x1="3" y1="12" x2="21" y2="12" stroke={magenta} strokeWidth="2" />
            </svg>
        );
    }
    case 'magnetic-profile': {
        const darkRed = '#8B0000';
        return (
            <svg {...props} viewBox="0 0 24 24">
                <rect x="2" y="11" width="20" height="2" fill={darkRed} />
            </svg>
        );
    }
    case 'magnetic-profile-large': {
        const darkRed = '#8B0000';
        return (
            <svg {...props} viewBox="0 0 24 24">
                <rect x="1" y="10" width="22" height="5" fill={darkRed} />
            </svg>
        );
    }
    case 'laser-blade-wall-washer': {
        const darkRed = '#8B0000';
        return (
            <svg {...props} viewBox="0 0 24 24">
                <rect x="2" y="8" width="20" height="8" fill={darkRed} stroke={magenta} strokeWidth="1" />
                <line x1="4" y1="12" x2="20" y2="12" stroke={magenta} strokeWidth="1.5" />
            </svg>
        );
    }
    case 'laser-blade-wall-washer-large': {
        const darkRed = '#8B0000';
        return (
            <svg {...props} viewBox="0 0 24 24">
                <rect x="1" y="7" width="22" height="10" fill={darkRed} stroke={magenta} strokeWidth="1" />
                <line x1="3" y1="12" x2="21" y2="12" stroke={magenta} strokeWidth="2" />
            </svg>
        );
    }
    case 'magnetic-profile-adjustable': {
        const darkRed = '#8B0000';
        return (
            <svg {...props} viewBox="0 0 24 24">
                <path d="M4 8 L 4 18 L 20 18 L 20 8" stroke={darkRed} strokeWidth="2" fill="none" />
                <rect x="6" y="9" width="12" height="4" fill={darkRed} />
            </svg>
        );
    }
    case 'magnetic-profile-adjustable-large': {
        const darkRed = '#8B0000';
        return (
            <svg {...props} viewBox="0 0 24 24">
                <path d="M2 7 L 2 19 L 22 19 L 22 7" stroke={darkRed} strokeWidth="2" fill="none" />
                <rect x="4" y="9" width="16" height="5" fill={darkRed} />
            </svg>
        );
    }
    case 'stretch-ceiling': {
        return (
            <svg {...props} viewBox="0 0 24 24">
                <defs>
                    <linearGradient id="stretch-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{stopColor: magenta, stopOpacity: 0.3}} />
                        <stop offset="50%" style={{stopColor: magenta, stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: magenta, stopOpacity: 0.3}} />
                    </linearGradient>
                </defs>
                <g stroke="url(#stretch-grad)" strokeWidth="1.5">
                    <path d="M4 4 V 20 M6 4 V 20 M8 4 V 20 M10 4 V 20 M12 4 V 20 M14 4 V 20 M16 4 V 20 M18 4 V 20 M20 4 V 20" />
                </g>
            </svg>
        );
    }
    case 'module-signage': {
      const blue = '#4299e1';
      return (
          <svg {...props} viewBox="0 0 24 24">
              <g stroke={blue} strokeWidth="1">
                  <path d="M6 5 V 19 M9 5 V 19 M12 5 V 19 M15 5 V 19 M18 5 V 19" />
                  <path d="M6 8 H 18 M6 12 H 18 M6 16 H 18" />
              </g>
          </svg>
      );
    }
    case 'table-lamp': {
      const blue = '#0000FF';
      return (
          <svg {...props} viewBox="0 0 24 24">
              <path d="M6 14 A 6 6 0 0 1 18 14" stroke={blue} strokeWidth="1.5" fill="none" />
              <rect x="7" y="14" width="10" height="4" fill={blue} />
          </svg>
      );
    }
    case 'floor-lamp': {
      const blue = '#0000FF';
      return (
          <svg {...props} viewBox="0 0 24 24">
              <path d="M8 12 A 4 4 0 0 1 16 12" stroke={blue} strokeWidth="1.5" fill="none" />
              <rect x="9" y="12" width="6" height="3" fill={blue} />
              <rect x="11" y="15" width="2" height="5" fill={blue} />
          </svg>
      );
    }
    case 'chandelier-2': {
      const blue = '#0000FF';
      return (
          <svg {...props} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5" fill={blue}/>
              {Array.from({length: 12}).map((_, i) => {
                  const angle = (i / 12) * 2 * Math.PI;
                  const x1 = 12 + Math.cos(angle) * 5;
                  const y1 = 12 + Math.sin(angle) * 5;
                  const x2 = 12 + Math.cos(angle) * 7;
                  const y2 = 12 + Math.sin(angle) * 7;
                  const cx2 = 12 + Math.cos(angle) * 8;
                  const cy2 = 12 + Math.sin(angle) * 8;
                  return (
                      <g key={i}>
                          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={blue} strokeWidth="0.5"/>
                          <circle cx={cx2} cy={cy2} r="1.5" fill={blue}/>
                      </g>
                  );
              })}
          </svg>
      );
    }
    case 'dining-linear-pendant': {
      const magenta = '#FF00FF';
      return (
          <svg {...props} viewBox="0 0 24 24">
              <rect x="2" y="10" width="20" height="4" stroke={magenta} strokeWidth="1" fill="none"/>
              <rect x="3" y="11" width="18" height="2" fill={magenta}/>
          </svg>
      );
    }
    case 'hanging-light': {
        const blue = '#0000FF';
        return (
            <svg {...props} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" fill="white" stroke={blue} strokeWidth="1"/>
                <path d="M12 4 L12 20 M4 12 L20 12" stroke={blue} strokeWidth="1"/>
                <path d="M12,4 A8,8 0 0,1 20,12 L12,12Z" fill={blue}/>
                <path d="M12,12 A8,8 0 0,1 4,12 L12,12Z" fill={blue}/>
                <path d="M4,12 A8,8 0 0,1 12,20 L12,12Z" fill={blue}/>
            </svg>
        );
    }
    default:
      return <Zap size={size} {...props} />;
  }
};

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
      const img = new window.Image();
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

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !project) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

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

    // Check if clicking on any light to toggle it
    project.lightingData?.lights?.forEach((light, index) => {
      const lightX = offsetX + light.x * scale;
      const lightY = offsetY + light.y * scale;
      const lightRadius = 4 * light.size + 10; // Same hit area as hover
      
      const distance = Math.sqrt((x - lightX) ** 2 + (y - lightY) ** 2);
      if (distance <= lightRadius) {
        // Toggle the light
        toggleLight(light.id);
      }
    });
  };

  const toggleLight = async (lightId: string) => {
    if (!project) return;

    // Update local state immediately
    const updatedProject = {
      ...project,
      lightingData: {
        ...project.lightingData,
        lights: project.lightingData.lights.map(light =>
          light.id === lightId ? { ...light, isOn: !light.isOn } : light
        )
      }
    };
    
    setProject(updatedProject);

    // Save to database
    try {
      const response = await fetch('/api/projects/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProject),
      });

      if (!response.ok) {
        console.error('Failed to save light toggle');
        // Revert on error
        setProject(project);
      }
    } catch (error) {
      console.error('Error saving light toggle:', error);
      // Revert on error
      setProject(project);
    }
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

  // Helper function to check if a line intersects with any wall
  const isLightBlockedByWall = (lightX: number, lightY: number, targetX: number, targetY: number): boolean => {
    if (!project?.blueprintData?.walls) return false;

    for (const wall of project.blueprintData.walls) {
      // Check if the light ray intersects with this wall
      if (lineIntersectsLine(lightX, lightY, targetX, targetY, wall.start.x, wall.start.y, wall.end.x, wall.end.y)) {
        return true;
      }
    }
    return false;
  };

  // Helper function to check line intersection
  const lineIntersectsLine = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean => {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denom === 0) return false; // Lines are parallel

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  };

  // Helper function to check line-line intersection for wall shadows
  const lineIntersection = (
    line1: { start: { x: number; y: number }, end: { x: number; y: number } },
    line2: { start: { x: number; y: number }, end: { x: number; y: number } }
  ): { x: number; y: number } | null => {
    const x1 = line1.start.x, y1 = line1.start.y;
    const x2 = line1.end.x, y2 = line1.end.y;
    const x3 = line2.start.x, y3 = line2.start.y;
    const x4 = line2.end.x, y4 = line2.end.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null; // Lines are parallel

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      };
    }
    return null;
  };

  // Function to draw light with wall shadows using ray casting (from lighting page)
  const drawLightWithShadows = (
    ctx: CanvasRenderingContext2D,
    lightX: number,
    lightY: number,
    lightRadius: number,
    lightColor: string,
    lightIntensity: number,
    offsetX: number,
    offsetY: number,
    scale: number
  ) => {
    if (!project?.blueprintData?.walls) return;

    // Create gradient for the light
    const gradient = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, lightRadius);
    gradient.addColorStop(0, `${lightColor}${Math.round(lightIntensity * 2.55).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(0.5, `${lightColor}${Math.round(lightIntensity * 1.28).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, `${lightColor}00`);

    // Draw the base light circle
    ctx.fillStyle = gradient;
    
    // Use ray casting to create realistic shadows
    const rayCount = 64; // Number of rays to cast
    const rayAngles: number[] = [];
    
    // Cast rays in all directions
    for (let i = 0; i < rayCount; i++) {
      rayAngles.push((i / rayCount) * Math.PI * 2);
    }
    
    // Add rays toward wall endpoints for better shadow accuracy
    project.blueprintData.walls.forEach(wall => {
      const wallStartX = offsetX + wall.start.x * scale;
      const wallStartY = offsetY + wall.start.y * scale;
      const wallEndX = offsetX + wall.end.x * scale;
      const wallEndY = offsetY + wall.end.y * scale;
      
      const angleToStart = Math.atan2(wallStartY - lightY, wallStartX - lightX);
      const angleToEnd = Math.atan2(wallEndY - lightY, wallEndX - lightX);
      
      rayAngles.push(angleToStart - 0.001, angleToStart, angleToStart + 0.001);
      rayAngles.push(angleToEnd - 0.001, angleToEnd, angleToEnd + 0.001);
    });

    // Sort angles
    rayAngles.sort((a, b) => a - b);

    // Create the light polygon by casting rays
    ctx.beginPath();
    ctx.moveTo(lightX, lightY);

    rayAngles.forEach(angle => {
      let rayEndX = lightX + Math.cos(angle) * lightRadius;
      let rayEndY = lightY + Math.sin(angle) * lightRadius;
      let minDistance = lightRadius;

      // Check intersection with each wall
      project.blueprintData.walls.forEach(wall => {
        const wallStartX = offsetX + wall.start.x * scale;
        const wallStartY = offsetY + wall.start.y * scale;
        const wallEndX = offsetX + wall.end.x * scale;
        const wallEndY = offsetY + wall.end.y * scale;

        const intersection = lineIntersection(
          { start: { x: lightX, y: lightY }, end: { x: rayEndX, y: rayEndY } },
          { start: { x: wallStartX, y: wallStartY }, end: { x: wallEndX, y: wallEndY } }
        );

        if (intersection) {
          const distance = Math.sqrt(
            Math.pow(intersection.x - lightX, 2) + Math.pow(intersection.y - lightY, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            rayEndX = intersection.x;
            rayEndY = intersection.y;
          }
        }
      });

      ctx.lineTo(rayEndX, rayEndY);
    });

    ctx.closePath();
    ctx.fill();
  };

  const drawLights = (ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, scale: number) => {
    if (!project?.lightingData?.lights) return;

    project.lightingData.lights.forEach((light, index) => {
      const x = offsetX + light.x * scale;
      const y = offsetY + light.y * scale;
      const sizeMultiplier = light.size || 1.0;
      const isHovered = hoveredLight === light.id;
      
      // Draw light fixture
      ctx.save();
      
      if (light.isOn) {
        ctx.save();
        
        if (light.direction !== undefined) {
          ctx.translate(x, y);
          ctx.rotate(light.direction * Math.PI / 180);
          ctx.translate(-x, -y);
        }
        
        // Draw light glow with wall physics based on light type
        if (light.type === 'spot-type5-wall-washer' || light.type === 'wall-washer-spot') {
          // Semi-circle glow with shadows
        ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, light.radius * scale * sizeMultiplier, -Math.PI, 0);
          ctx.closePath();
          ctx.clip();
          drawLightWithShadows(ctx, x, y, light.radius * scale * sizeMultiplier, light.color, light.intensity, offsetX, offsetY, scale);
          ctx.restore();
        } else if (light.type === 'adjustable-spot-type6') {
          // Cone glow with shadows
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x,y);
          ctx.arc(x, y, light.radius * scale * sizeMultiplier, -Math.PI / 4, Math.PI / 4);
          ctx.closePath();
          ctx.clip();
          drawLightWithShadows(ctx, x, y, light.radius * scale * sizeMultiplier, light.color, light.intensity, offsetX, offsetY, scale);
          ctx.restore();
        } else if (light.type === 'laser-blade' || light.type === 'linear-wall-washer' || light.type === 'linear-profile-lighting' || light.type === 'indoor-strip-light' || light.type === 'curtain-grazer' || light.type === 'outdoor-profile' || light.type === 'magnetic-track' || light.type === 'magnetic-laser-blade' || light.type === 'magnetic-laser-blade-large' || light.type === 'magnetic-profile' || light.type === 'magnetic-profile-large' || light.type === 'laser-blade-wall-washer' || light.type === 'laser-blade-wall-washer-large' || light.type === 'magnetic-profile-adjustable' || light.type === 'magnetic-profile-adjustable-large' || light.type === 'stretch-ceiling' || light.type === 'module-signage' || light.type === 'table-lamp' || light.type === 'floor-lamp' || light.type === 'chandelier-2' || light.type === 'dining-linear-pendant' || light.type === 'hanging-light') {
          // Rectangular glow with shadows
          const rectWidth = (light.width || (light.type === 'laser-blade' ? 60 : (light.type === 'indoor-strip-light' || light.type === 'curtain-grazer' || light.type === 'outdoor-profile' || light.type === 'magnetic-track' ? 10 : 50))) * scale * sizeMultiplier;
          const rectHeight = light.radius * scale * sizeMultiplier;
          ctx.save();
          ctx.beginPath();
          ctx.rect(x - rectWidth / 2, y, rectWidth, rectHeight);
          ctx.clip();
          drawLightWithShadows(ctx, x, y, Math.max(rectWidth, rectHeight), light.color, light.intensity, offsetX, offsetY, scale);
          ctx.restore();
        } else if (light.type === 'gimbel-spot') {
          // Double radial glow with shadows
          ctx.save();
          drawLightWithShadows(ctx, x - 5 * scale, y, light.radius * 0.6 * scale * sizeMultiplier, light.color, light.intensity, offsetX, offsetY, scale);
          drawLightWithShadows(ctx, x + 5 * scale, y, light.radius * 0.6 * scale * sizeMultiplier, light.color, light.intensity, offsetX, offsetY, scale);
          ctx.restore();
        } else {
          // Standard radial glow with shadows
          drawLightWithShadows(ctx, x, y, light.radius * scale * sizeMultiplier, light.color, light.intensity, offsetX, offsetY, scale);
        }
        ctx.restore();
      }
      
      // Draw fixture icon with proper styling from lighting page
      ctx.fillStyle = light.isOn ? '#ffff88' : '#666666';
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;
      
      // Enhanced light fixture rendering based on type (from lighting page)
      switch (light.type) {
        case 'spot-type1': {
          ctx.fillStyle = '#FF00FF';
        ctx.beginPath();
          ctx.arc(x, y, 6 * sizeMultiplier, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 10 * sizeMultiplier, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'spot-type2': {
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.stroke();
              break;
            }
        case 'spot-type3': {
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'spot-type4': {
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'spot-type5-wall-washer': {
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI, false);
          ctx.clip();
          
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 0.5;
          for (let i = -8; i <= 8; i += 2) {
            ctx.beginPath();
            ctx.moveTo(x + i, y);
            ctx.lineTo(x + i, y - 8);
            ctx.stroke();
          }
          for (let i = 0; i >= -8; i -= 2) {
            ctx.beginPath();
            ctx.moveTo(x - 8, y + i);
            ctx.lineTo(x + 8, y + i);
            ctx.stroke();
          }
          ctx.restore();
          break;
        }
        case 'adjustable-spot-type6': {
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.clip();
        
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 0.5;
          for (let i = -12; i <= 12; i += 3) {
            ctx.beginPath();
            ctx.moveTo(x + i - 12, y - 12);
            ctx.lineTo(x + i + 12, y + 12);
            ctx.stroke();
          }
          ctx.restore();
          
          ctx.fillStyle = 'black';
        ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
          break;
        }
        case 'mini-spot': {
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'bed-reading-spot': {
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'waterproof-spot': {
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.clip();
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 0.5;
          for (let i = -10; i <= 10; i += 2) {
            ctx.beginPath();
            ctx.moveTo(x + i, y - 10);
            ctx.lineTo(x + i, y + 10);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x - 10, y + i);
            ctx.lineTo(x + 10, y + i);
            ctx.stroke();
          }
        ctx.restore();
          break;
        }
        case 'wall-washer-spot': {
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.fillStyle = '#FF00FF';
          ctx.beginPath();
          ctx.arc(x, y, 9, -Math.PI / 2, Math.PI / 2, false);
          ctx.fill();
          break;
        }
        case 'laser-blade': {
          const rectWidth = 50 * sizeMultiplier;
          const rectHeight = 12 * sizeMultiplier;
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.strokeRect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
          
          ctx.fillStyle = '#FF00FF';
          for (let i = 0; i < 5; i++) {
        ctx.beginPath();
            ctx.arc(x - (rectWidth/2) + 8 * sizeMultiplier + (i*9 * sizeMultiplier), y, 3 * sizeMultiplier, 0, 2 * Math.PI);
        ctx.fill();
      }
          break;
        }
        case 'linear-wall-washer': {
          const rectWidth = 50;
          const rectHeight = 8;
          ctx.fillStyle = '#FF00FF';
          ctx.fillRect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
          
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x - rectWidth / 2, y - rectHeight / 2 - 2);
          ctx.lineTo(x + rectWidth / 2, y - rectHeight / 2 - 2);
          ctx.stroke();
          break;
        }
        case 'linear-profile-lighting': {
          const rectWidth = 50;
          const rectHeight = 4;
          ctx.fillStyle = '#FF00FF';
          ctx.fillRect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x - rectWidth / 2, y - rectHeight / 2 - 2);
          ctx.lineTo(x + rectWidth / 2, y - rectHeight / 2 - 2);
          ctx.stroke();
          break;
        }
        case 'gimbel-spot': {
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x - 10, y - 6);
          ctx.lineTo(x - 10, y + 6);
          ctx.stroke();
          ctx.fillStyle = '#FF00FF';
          ctx.beginPath();
          ctx.arc(x - 3, y, 4, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x + 5, y, 4, 0, 2 * Math.PI);
          ctx.fill();
          break;
        }
        case 'surface-spot-light-indoor': {
          ctx.fillStyle = '#FF00FF';
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, 2 * Math.PI);
          ctx.fill();
          break;
        }
        case 'surface-spot-light-indoor-2': {
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.moveTo(x, y - 10);
          ctx.lineTo(x, y - 5);
          ctx.stroke();
          ctx.moveTo(x, y + 5);
          ctx.lineTo(x, y + 10);
          ctx.stroke();
          ctx.moveTo(x - 10, y);
          ctx.lineTo(x - 5, y);
          ctx.stroke();
          ctx.moveTo(x + 5, y);
          ctx.lineTo(x + 10, y);
          ctx.stroke();
          break;
        }
        case 'downlight': {
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, 2 * Math.PI);
          ctx.clip();
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 0.5;
          for (let i = -10; i <= 10; i += 4) {
              ctx.beginPath();
              ctx.moveTo(x + i, y - 10);
              ctx.lineTo(x + i, y + 10);
              ctx.stroke();
          }
          for (let i = -10; i <= 10; i += 4) {
              ctx.beginPath();
              ctx.moveTo(x - 10, y + i);
              ctx.lineTo(x + 10, y + i);
              ctx.stroke();
          }
          ctx.restore();
          break;
        }
        case 'surface-panel': {
          ctx.fillStyle = '#FF00FF';
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'black';
          ctx.fillRect(x - 2, y - 9, 4, 18);
          break;
        }
        case 'indoor-strip-light': {
          ctx.save();
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 4]);
          ctx.beginPath();
          ctx.moveTo(x, y - 10);
          ctx.lineTo(x, y + 10);
          ctx.stroke();
          ctx.restore();
          break;
        }
        case 'curtain-grazer': {
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x, y - 10);
          ctx.lineTo(x, y + 10);
          ctx.stroke();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x - 2.5, y - 10);
          ctx.lineTo(x - 2.5, y + 10);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + 2.5, y - 10);
          ctx.lineTo(x + 2.5, y + 10);
          ctx.stroke();
          break;
        }
        case 'outdoor-profile': {
          ctx.save();
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 4]);
          ctx.beginPath();
          ctx.moveTo(x, y - 10);
          ctx.lineTo(x, y + 10);
          ctx.stroke();
          ctx.restore();
          break;
        }
        case 'magnetic-track': {
          const rectWidth = 10;
          const rectHeight = 30;
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.strokeRect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x - rectWidth / 2 + 2.5, y - rectHeight / 2);
          ctx.lineTo(x - rectWidth / 2 + 2.5, y + rectHeight / 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y - rectHeight / 2);
          ctx.lineTo(x, y + rectHeight / 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + rectWidth / 2 - 2.5, y - rectHeight / 2);
          ctx.lineTo(x + rectWidth / 2 - 2.5, y + rectHeight / 2);
          ctx.stroke();
          break;
        }
        case 'track-spot': {
          ctx.strokeStyle = '#FF00FF';
          ctx.fillStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x-4, y-7);
          ctx.quadraticCurveTo(x, y-10, x+4, y-7);
          ctx.lineTo(x+4, y);
          ctx.lineTo(x-4, y);
          ctx.closePath();
          ctx.fill();
          ctx.strokeRect(x-5, y, 10, 2);
          ctx.fillRect(x-3, y+2, 6, 4);
          break;
        }
        case 'track-spot-2': {
          ctx.fillStyle = '#FF00FF';
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x-5, y-8);
          ctx.lineTo(x+5, y-8);
          ctx.lineTo(x, y-2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeRect(x-4, y-1, 8, 4);
          ctx.strokeRect(x-6, y+4, 12, 2);
          ctx.beginPath();
          ctx.moveTo(x, y+6);
          ctx.lineTo(x, y+9);
          ctx.stroke();
          break;
        }
        case 'magnetic-laser-blade': {
          const rectWidth = 50;
          const rectHeight = 12;
          ctx.fillStyle = '#8B0000';
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.fillRect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
          ctx.strokeRect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
          ctx.strokeStyle = '#FF00FF';
          for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.arc(x - (rectWidth/2) + 6 + (i*8), y, 4, 0, 2 * Math.PI);
            ctx.stroke();
          }
          break;
        }
        case 'magnetic-laser-blade-large': {
          const rectWidth = 100;
          const rectHeight = 12;
          ctx.fillStyle = '#8B0000';
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.fillRect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
          ctx.strokeRect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
          ctx.strokeStyle = '#FF00FF';
          for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.arc(x - (rectWidth/2) + 6 + (i*8), y, 4, 0, 2 * Math.PI);
            ctx.stroke();
          }
          break;
        }
        case 'magnetic-profile': {
          const rectWidth = 50;
          const rectHeight = 8;
          ctx.fillStyle = '#8B0000';
          ctx.fillRect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
          break;
        }
        case 'magnetic-profile-large': {
          const rectWidth = 80;
          const rectHeight = 8;
          ctx.fillStyle = '#8B0000';
          ctx.fillRect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
          break;
        }
        case 'laser-blade-wall-washer': {
          const rectWidth = 50;
          const rectHeight = 12;
          ctx.fillStyle = '#8B0000';
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.fillRect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
          ctx.strokeRect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
          ctx.strokeStyle = '#FF00FF';
          for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.arc(x - (rectWidth/2) + 6 + (i*8), y, 4, 0, 2 * Math.PI);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.moveTo(x - rectWidth / 2, y);
          ctx.lineTo(x + rectWidth / 2, y);
          ctx.stroke();
          break;
        }
        case 'laser-blade-wall-washer-large': {
          const rectWidth = 100;
          const rectHeight = 12;
          ctx.fillStyle = '#8B0000';
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.fillRect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
          ctx.strokeRect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
          ctx.strokeStyle = '#FF00FF';
          for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.arc(x - (rectWidth/2) + 6 + (i*8), y, 4, 0, 2 * Math.PI);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.moveTo(x - rectWidth / 2, y);
          ctx.lineTo(x + rectWidth / 2, y);
          ctx.stroke();
          break;
        }
        case 'magnetic-profile-adjustable': {
          const rectWidth = 50;
          const rectHeight = 12;
          ctx.strokeStyle = '#8B0000';
          ctx.fillStyle = '#8B0000';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x - rectWidth / 2, y - rectHeight / 2);
          ctx.lineTo(x - rectWidth / 2, y + rectHeight / 2);
          ctx.lineTo(x + rectWidth / 2, y + rectHeight / 2);
          ctx.lineTo(x + rectWidth / 2, y - rectHeight / 2);
          ctx.stroke();
          ctx.fillRect(x - rectWidth/2 + 5, y - 2, rectWidth - 10, 4);
          break;
        }
        case 'magnetic-profile-adjustable-large': {
          const rectWidth = 80;
          const rectHeight = 15;
          ctx.strokeStyle = '#8B0000';
          ctx.fillStyle = '#8B0000';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x - rectWidth / 2, y - rectHeight / 2);
          ctx.lineTo(x - rectWidth / 2, y + rectHeight / 2);
          ctx.lineTo(x + rectWidth / 2, y + rectHeight / 2);
          ctx.lineTo(x + rectWidth / 2, y - rectHeight / 2);
          ctx.stroke();
          ctx.fillRect(x - rectWidth/2 + 6, y - 2, rectWidth - 12, 4);
          break;
        }
        case 'stretch-ceiling': {
          const rectWidth = (light.width || 80) * scale;
          const rectHeight = (light.radius || 120) * scale;
          const gradient = ctx.createLinearGradient(x - rectWidth/2, y, x + rectWidth/2, y);
          gradient.addColorStop(0, 'rgba(255, 0, 255, 0)');
          gradient.addColorStop(0.2, 'rgba(255, 0, 255, 0.4)');
          gradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.6)');
          gradient.addColorStop(0.8, 'rgba(255, 0, 255, 0.4)');
          gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(x - rectWidth/2, y - rectHeight/2, rectWidth, rectHeight);
          break;
        }
        case 'module-signage': {
          const blue = '#4299e1';
          ctx.strokeStyle = blue;
          ctx.lineWidth = 1;
          const width = light.width || 50;
          const height = light.radius || 50;
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(x + (i - 2) * 10, y - height/2);
            ctx.lineTo(x + (i - 2) * 10, y + height/2);
            ctx.stroke();
          }
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x - width/2, y + (i - 1) * 15);
            ctx.lineTo(x + width/2, y + (i - 1) * 15);
            ctx.stroke();
          }
          break;
        }
        case 'table-lamp': {
          const blue = '#0000FF';
          ctx.strokeStyle = blue;
          ctx.fillStyle = blue;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 20, Math.PI, 0);
          ctx.stroke();
          ctx.fillRect(x - 15, y, 30, 8);
          break;
        }
        case 'floor-lamp': {
          const blue = '#0000FF';
          ctx.strokeStyle = blue;
          ctx.fillStyle = blue;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 15, Math.PI, 0);
          ctx.stroke();
          ctx.fillRect(x - 10, y, 20, 6);
          ctx.fillRect(x - 2, y + 6, 4, 10);
          break;
        }
        case 'chandelier-2': {
          const blue = '#0000FF';
          ctx.fillStyle = blue;
          ctx.beginPath();
          ctx.arc(x, y, 15 * sizeMultiplier, 0, Math.PI * 2);
          ctx.fill();
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * 2 * Math.PI;
            const x2 = x + Math.cos(angle) * 20 * sizeMultiplier;
            const y2 = y + Math.sin(angle) * 20 * sizeMultiplier;
            ctx.beginPath();
            ctx.arc(x2, y2, 5 * sizeMultiplier, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'dining-linear-pendant': {
          const magenta = '#FF00FF';
          ctx.strokeStyle = magenta;
          ctx.fillStyle = magenta;
          ctx.lineWidth = 2;
          ctx.strokeRect(x - 40, y - 5, 80, 10);
          ctx.fillRect(x - 38, y - 3, 76, 6);
          break;
        }
        case 'hanging-light': {
          const blue = '#0000FF';
          ctx.fillStyle = blue;
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x, y-20);
          ctx.lineTo(x,y+20);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x-20, y);
          ctx.lineTo(x+20,y);
          ctx.stroke();
          break;
        }
        default: {
          // Default simple fixture for unknown types
          const fixtureSize = 4 * sizeMultiplier * (isHovered ? 1.2 : 1);
          
      if (light.isOn) {
        ctx.fillStyle = isHovered ? '#FF6666' : '#FF4444';
      } else {
        ctx.fillStyle = isHovered ? '#888888' : '#666666';
      }
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.beginPath();
      ctx.arc(x, y, fixtureSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      if (light.isOn) {
        ctx.fillStyle = '#FFFFFF';
      } else {
        ctx.fillStyle = '#CCCCCC';
      }
      ctx.beginPath();
      ctx.arc(x, y, fixtureSize * 0.3, 0, Math.PI * 2);
      ctx.fill();
          break;
        }
      }
      
      // Add hover effects and interactivity
      if (isHovered) {
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        const outlineSize = 15 * sizeMultiplier;
        ctx.strokeRect(x - outlineSize, y - outlineSize, outlineSize * 2, outlineSize * 2);
        ctx.setLineDash([]);

      // Draw distance lines when hovered
        if (project?.blueprintData?.walls) {
        drawDistanceLines(ctx, light, offsetX, offsetY, scale);
      }
      }
      
      ctx.restore();
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
      <div className="min-h-screen premium-gradient-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="premium-text text-primary">Loading project preview...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen premium-gradient-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <ExternalLink className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-red-600">Preview Not Available</h1>
          <p className="premium-text">{error || 'Project not found'}</p>
        </div>
      </div>
    );
  }

  const bomData = generateBOMData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header with White Theme */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          {/* Top Row - Branding */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Image
                  src="/lightscapelogo.png"
                  alt="Lightscape Logo"
                  width={40}
                  height={40}
                  className="drop-shadow-sm"
                />
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Belecure
                  </h1>
                  <p className="text-xs text-gray-600">A Product of Lightscape</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          {/* Bottom Row - Project Info & Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border border-blue-200">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {project.title}
                  </h2>
                  <p className="text-sm text-gray-600">Project Preview</p>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm border-0 px-3 py-1">
                <Activity className="h-3 w-3 mr-1" />
                {project.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setAnimationEnabled(!animationEnabled)}
                variant={animationEnabled ? "default" : "outline"}
                className={animationEnabled 
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 shadow-md"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 bg-white"
                }
              >
                <Zap className="h-4 w-4 mr-2" />
                {animationEnabled ? 'Animation ON' : 'Animation OFF'}
              </Button>
              
              <Button
                onClick={() => setShowBOM(!showBOM)}
                variant={showBOM ? "default" : "outline"}
                className={showBOM 
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-md"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 bg-white"
                }
              >
                <Layers className="h-4 w-4 mr-2" />
                {showBOM ? 'Hide BOM' : 'Show BOM'}
              </Button>
              
              <Button
                onClick={copyPreviewLink}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 hover:border-green-400 transition-all duration-200 bg-white"
              >
                {linkCopied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
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
          className="fixed z-50 bg-white border border-gray-300 rounded-lg p-3 shadow-xl pointer-events-none"
          style={{ 
            left: mousePos.x + 15, 
            top: mousePos.y - 10,
            transform: mousePos.x > window.innerWidth - 250 ? 'translateX(-100%)' : 'none'
          }}
        >
          <div className="text-gray-800 font-semibold text-sm mb-2">
            Light Control & Information
          </div>
          <div className="space-y-2 text-xs text-gray-600 mb-3">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${project?.lightingData?.lights?.find(l => l.id === hoveredLight)?.isOn ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span>Status: {project?.lightingData?.lights?.find(l => l.id === hoveredLight)?.isOn ? 'ON' : 'OFF'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">💡</span>
              <span>Click to toggle ON/OFF</span>
            </div>
          </div>
          {lightDistances[hoveredLight] && (
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between space-x-4">
                <span>Horizontal:</span>
                <span className="text-blue-600 font-mono">
                  {lightDistances[hoveredLight].horizontal.toFixed(1)} {lightDistances[hoveredLight].unit}
                </span>
              </div>
              <div className="flex justify-between space-x-4">
                <span>Vertical:</span>
                <span className="text-blue-600 font-mono">
                  {lightDistances[hoveredLight].vertical.toFixed(1)} {lightDistances[hoveredLight].unit}
                </span>
              </div>
              <div className="pt-1 border-t border-gray-300 text-gray-500 text-xs">
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
            <Card className="bg-white border-gray-200 shadow-lg">
              <CardHeader className="pb-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border border-blue-200">
                      <Lightbulb className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Lighting Design Preview
                    </CardTitle>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-lg border border-cyan-200">
                      <Zap className="h-4 w-4 text-cyan-600" />
                      <span className="text-cyan-700 font-medium">{project.lightingData?.lights?.filter(l => l.isOn).length || 0}</span>
                      <span className="text-gray-600">/ {project.lightingData?.lights?.length || 0} Lights</span>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200">
                      <HomeIcon className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 font-medium">{project.metadata.roomCount}</span>
                      <span className="text-gray-600">Rooms</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="rounded-xl border-2 border-gray-300 shadow-lg w-full h-auto bg-gray-100 cursor-crosshair transition-all duration-300 hover:border-blue-400"
                    style={{ maxWidth: '100%', height: 'auto' }}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseLeave={handleCanvasMouseLeave}
                    onClick={handleCanvasClick}
                  />
                  {/* Canvas Overlay */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Live Preview</span>
                    </div>
                  </div>
                </div>
                
                {/* Project Info */}
                <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Created: <span className="text-gray-800">{new Date(project.createdAt).toLocaleDateString()}</span></span>
                  </div>
                  {project.completedAt && (
                    <>
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Completed: <span className="text-gray-800">{new Date(project.completedAt).toLocaleDateString()}</span></span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* BOM Panel */}
          {showBOM && (
            <div className="lg:col-span-1">
              <Card className="bg-white border-gray-200 shadow-lg">
                <CardHeader className="pb-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                        <Layers className="h-4 w-4 text-purple-600" />
                      </div>
                      <CardTitle className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Bill of Materials
                      </CardTitle>
                    </div>
                    <Button
                      onClick={exportBOM}
                      size="sm"
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 hover:border-green-400 transition-all duration-200 bg-white"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto p-4">
                  <div className="space-y-3">
                    {bomData.map((item, index) => (
                      <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:border-purple-300 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-800 text-sm leading-tight">{item.type}</h4>
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-xs px-2 py-1">
                            {item.quantity}x
                          </Badge>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Intensity:</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-12 h-1.5 bg-gray-300 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-300"
                                  style={{ width: `${item.averageIntensity}%` }}
                                ></div>
                              </div>
                              <span className="text-orange-600 font-medium">{item.averageIntensity}%</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Status:</span>
                            <span className="text-green-600 font-medium">{item.status}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Position:</span>
                            <span className="text-gray-800 font-mono text-xs">({item.position?.x}, {item.position?.y})</span>
                          </div>
                          {item.notes && (
                            <div className="text-gray-600 text-xs mt-2 p-2 bg-gray-100 rounded-lg border border-gray-200">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {bomData.length === 0 && (
                    <div className="text-center py-12">
                      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-6 border border-gray-200">
                        <Lightbulb className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-600 font-medium">No light fixtures found</p>
                        <p className="text-gray-500 text-xs mt-1">Add lights to your design to see the BOM</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      
      {/* Modern Footer */}
      <footer className="bg-white border-t border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src="/lightscapelogo.png"
                alt="Lightscape Logo"
                width={24}
                height={24}
                className="opacity-75"
              />
              <p className="text-sm text-gray-600">
                © 2024 <span className="text-blue-600 font-medium">Belecure</span> - A Product of <span className="text-purple-600 font-medium">Lightscape</span>. All rights reserved.
              </p>
            </div>
            <div className="text-xs text-gray-500">
              Professional Lighting Design Platform
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 