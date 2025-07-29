"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Zap, Lightbulb, Sun, Moon, Lamp, Home, Settings, Trash2, Copy, Eye, EyeOff, ChevronsLeft, ChevronsRight, Hand, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
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

interface LightFixture {
  id: string;
  type: 'spot-type1' | 'spot-type2' | 'spot-type3' | 'spot-type4' | 'spot-type5-wall-washer' | 'adjustable-spot-type6' | 'mini-spot' | 'bed-reading-spot' | 'waterproof-spot' | 'wall-washer-spot' | 'laser-blade' | 'linear-wall-washer' | 'linear-profile-lighting' | 'gimbel-spot' | 'surface-spot-light-indoor' | 'surface-spot-light-indoor-2' | 'downlight' | 'surface-panel' | 'indoor-strip-light' | 'curtain-grazer' | 'outdoor-profile' | 'magnetic-track' | 'track-spot' | 'track-spot-2' | 'magnetic-laser-blade' | 'magnetic-laser-blade-large' | 'magnetic-profile' | 'magnetic-profile-large' | 'laser-blade-wall-washer' | 'laser-blade-wall-washer-large' | 'magnetic-profile-adjustable' | 'magnetic-profile-adjustable-large' | 'stretch-ceiling' | 'module-signage' | 'table-lamp' | 'floor-lamp' | 'chandelier-2' | 'dining-linear-pendant' | 'hanging-light';
  x: number;
  y: number;
  intensity: number; // 0-100
  color: string;
  radius: number; // light spread radius
  isOn: boolean;
  direction?: number; // For adjustable/directional lights, in degrees
  width?: number; // For linear lights
  size: number; // Size multiplier for the light fixture (0.5 to 3.0)
}

interface BlueprintData {
  version?: string;
  timestamp?: string;
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

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;

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

export default function LightingPage() {
  const router = useRouter();
  const [blueprintData, setBlueprintData] = useState<BlueprintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [lightFixtures, setLightFixtures] = useState<LightFixture[]>([]);
  const [selectedLightType, setSelectedLightType] = useState<LightFixture['type'] | null>(null);
  const [selectedLight, setSelectedLight] = useState<string | null>(null);
  const [ambientLightLevel, setAmbientLightLevel] = useState(20); // 0-100
  const [isMoveModeEnabled, setIsMoveModeEnabled] = useState(false);
  const [isDraggingLight, setIsDraggingLight] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isBlueprintDragEnabled, setIsBlueprintDragEnabled] = useState(false);

  // Zoom and Pan state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

  // Image states (same as enhancement page)
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

  // Save to MongoDB states
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Logout function
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

  // Save project to MongoDB
  const handleSaveToMongoDB = async () => {
    if (!blueprintData) {
      alert('No blueprint data to save');
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Check if we have an existing project ID from editing
      const existingProjectId = localStorage.getItem('currentProjectId');
      const projectId = existingProjectId || `project_${Date.now()}`;
      const title = existingProjectId 
        ? `Updated Lighting Design - ${new Date().toLocaleDateString()}`
        : `Lighting Design - ${new Date().toLocaleDateString()}`;
      
      const lightingData = {
        lights: lightFixtures,
        ambientLightLevel,
        settings: {
          ambientLightLevel,
          totalLights: lightFixtures.length,
          activeLights: lightFixtures.filter(light => light.isOn).length
        }
      };

      const response = await fetch('/api/projects/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          title,
          description: `Complete lighting design with ${lightFixtures.length} light fixtures`,
          blueprintData,
          furnitureData: furniture,
          lightingData,
          status: 'lighting_complete'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the project ID for future saves
        localStorage.setItem('currentProjectId', projectId);
        
        const message = existingProjectId 
          ? 'Project updated successfully in MongoDB!' 
          : 'Project saved successfully to MongoDB!';
        setSaveMessage(message);
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error(data.error || 'Failed to save project');
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage(`Error: ${error instanceof Error ? error.message : 'Failed to save project'}`);
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const loadProjectData = async () => {
      // Check if we're editing an existing project
      const editingProjectId = localStorage.getItem('editingProjectId');
      
      if (editingProjectId) {
        // Load project from MongoDB
        try {
          const response = await fetch(`/api/projects/load?projectId=${editingProjectId}`);
          const data = await response.json();
          
          if (response.ok && data.project) {
            const project = data.project;
            setBlueprintData(project.blueprintData);
            setFurniture(project.furnitureData || []);
            
            // Load lighting data if it exists
            if (project.lightingData && project.lightingData.lights) {
              setLightFixtures(project.lightingData.lights);
              setAmbientLightLevel(project.lightingData.ambientLightLevel || 20);
            }
            
            console.log('Loaded project data for editing:', project);
            // Store the current project ID for future saves and clear the editing flag
            localStorage.setItem('currentProjectId', project.projectId);
            localStorage.removeItem('editingProjectId');
          } else {
            console.error('Failed to load project:', data.error);
            // Fallback to localStorage
            loadFromLocalStorage();
          }
        } catch (error) {
          console.error('Error loading project:', error);
          // Fallback to localStorage
          loadFromLocalStorage();
        }
      } else {
        // Load from localStorage as before
        loadFromLocalStorage();
      }
      
      setLoading(false);
    };

    const loadFromLocalStorage = () => {
      const stored = localStorage.getItem('enhancedBlueprintData') || localStorage.getItem('blueprintData');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setBlueprintData(data);
          if (data.furniture) {
            setFurniture(data.furniture);
          }
          console.log('Loaded enhanced blueprint data:', data);
        } catch (error) {
          console.error('Error parsing blueprint data:', error);
        }
      }
    };

    loadProjectData();
  }, []);

  // Load images (same as enhancement page)
  useEffect(() => {
    // Load all images
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
      { setter: setWardrobeImage, src: '/wardrobetop.jpg' }
    ];

    images.forEach(({ setter, src }) => {
      const img = new Image();
      img.onload = () => setter(img);
      img.src = src;
    });
  }, []);

  // Render effect
  useEffect(() => {
    if (blueprintData && canvasRef.current) {
      drawBlueprint();
    }
  }, [blueprintData, furniture, lightFixtures, selectedLight, ambientLightLevel, zoom, panOffset, sofaImage, grassImage, flooringImage, gardenLightImage, bedImage, tvImage, kitchenImage, bathroomImage, diningImage, wardrobeImage]);

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

    // Draw night background with stars and garden lights (EXACT SAME AS ENHANCEMENT)
    drawNightBackground(ctx, canvas.width, canvas.height);
    
    // Draw grass background with lighting effects (EXACT SAME AS ENHANCEMENT)
    drawGrassBackground(ctx, canvas.width, canvas.height);
    
    // Draw flooring for indoor areas (EXACT SAME AS ENHANCEMENT)
    drawFlooring(ctx, offsetX, offsetY, scale, bounds);

    // Draw walls with night theme - ENSURE WALLS ARE VISIBLE (EXACT SAME AS ENHANCEMENT)
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

    // Draw room labels with updated styling - NO GLOW (EXACT SAME AS ENHANCEMENT)
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

    // Draw furniture (EXACT SAME AS ENHANCEMENT)
    drawFurniture(ctx, offsetX, offsetY, scale);

    // Draw light fixtures and their illumination
    drawLightFixtures(ctx, offsetX, offsetY, scale);

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

  const drawWalls = (ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, scale: number) => {
    if (!blueprintData) return;

    ctx.strokeStyle = '#ffffff'; // Always white for night mode like enhancement page
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
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

      // Draw measurements
      const midX = offsetX + (wall.start.x + wall.end.x) / 2 * scale;
      const midY = offsetY + (wall.start.y + wall.end.y) / 2 * scale;
      
      ctx.fillStyle = '#ffffff'; // Always white for night mode like enhancement page
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      
      const measurement = formatMeasurement(wall.pixelLength || 0, wall.realLength);
      if (measurement && measurement !== 'undefined' && measurement !== 'NaN') {
        ctx.fillText(measurement, midX, midY - 8);
      }
    });

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  };

  const drawRoomLabels = (ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, scale: number) => {
    if (!blueprintData) return;

    ctx.fillStyle = '#ffffff'; // Always white for night mode like enhancement page
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    
    blueprintData.roomLabels.forEach((label) => {
      ctx.fillText(
        label.text,
        offsetX + label.x * scale,
        offsetY + label.y * scale
      );
    });
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
      
      // Draw selection outline if selected (for lighting fixtures)
      if (selectedLight === item.id) {
        ctx.strokeStyle = '#00bcd4';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
        ctx.setLineDash([]);
      }
    });
  };

  const drawLightFixtures = (ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, scale: number) => {
    lightFixtures.forEach(light => {
      const x = offsetX + light.x * scale;
      const y = offsetY + light.y * scale;
      const sizeMultiplier = light.size || 1.0;
      
      // Draw light fixture
      ctx.save();
      
      if (light.isOn) {
        ctx.save();
        
        if (light.direction !== undefined) {
          ctx.translate(x, y);
          ctx.rotate(light.direction * Math.PI / 180);
          ctx.translate(-x, -y);
        }
        
        // Draw light glow with wall physics
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
      
      // Draw fixture icon
      ctx.fillStyle = light.isOn ? '#ffff88' : '#666666';
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;
      
      switch (light.type) {
        case 'spot-type1': {
          // Filled magenta circle inside a larger, thin white circle.
          ctx.fillStyle = '#FF00FF'; // magenta
          ctx.beginPath();
          ctx.arc(x, y, 6 * sizeMultiplier, 0, Math.PI * 2); // inner filled circle
          ctx.fill();

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 10 * sizeMultiplier, 0, Math.PI * 2); // outer circle
          ctx.stroke();
          break;
        }
        case 'spot-type2': {
          // Thick magenta ring with a thin white ring inside
          ctx.strokeStyle = '#FF00FF'; // magenta
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2); // outer ring
          ctx.stroke();

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2); // inner ring
          ctx.stroke();
          break;
        }
        case 'spot-type3': {
          // Thick magenta ring.
          ctx.strokeStyle = '#FF00FF'; // magenta
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'spot-type4': {
          // Medium magenta ring with a thin white ring inside
          ctx.strokeStyle = '#FF00FF'; // magenta
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2); // outer ring
          ctx.stroke();

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2); // inner ring
          ctx.stroke();
          break;
        }
        case 'spot-type5-wall-washer': {
          // Outer magenta circle
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.stroke();
          // Inner semi-circle with grid
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI, false);
          ctx.clip();
          // Grid
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
          // Outer magenta circle
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.stroke();
          // Inner hashed area
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.clip();
          // Hash lines
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 0.5;
          for (let i = -12; i <= 12; i += 3) {
            ctx.beginPath();
            ctx.moveTo(x + i - 12, y - 12);
            ctx.lineTo(x + i + 12, y + 12);
            ctx.stroke();
          }
          ctx.restore();
          // Center hole
          ctx.fillStyle = 'black'; // Background color
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
          // Outer circle
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.stroke();
          // Inner grid
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
          // Outer circle
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.stroke();
          // Right half filled
          ctx.fillStyle = '#FF00FF';
          ctx.beginPath();
          ctx.arc(x, y, 9, -Math.PI / 2, Math.PI / 2, false);
          ctx.fill();
          break;
        }
        case 'laser-blade': {
          const rectWidth = 50 * sizeMultiplier;
          const rectHeight = 12 * sizeMultiplier;
          // Outer rectangle
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 1;
          ctx.strokeRect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
          // Inner circles
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
          // Filled rectangle
          ctx.fillStyle = '#FF00FF';
          ctx.fillRect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
          // Top line
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
          ctx.fillStyle = 'black'; // Background color to create stripe
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
            // top part
            ctx.beginPath();
            ctx.moveTo(x-4, y-7);
            ctx.quadraticCurveTo(x, y-10, x+4, y-7);
            ctx.lineTo(x+4, y);
            ctx.lineTo(x-4, y);
            ctx.closePath();
            ctx.fill();
            // middle bar
            ctx.strokeRect(x-5, y, 10, 2);
            // base
            ctx.fillRect(x-3, y+2, 6, 4);
            break;
        }
        case 'track-spot-2': {
            ctx.fillStyle = '#FF00FF';
            ctx.strokeStyle = '#FF00FF';
            ctx.lineWidth = 1;
            // triangle
            ctx.beginPath();
            ctx.moveTo(x-5, y-8);
            ctx.lineTo(x+5, y-8);
            ctx.lineTo(x, y-2);
            ctx.closePath();
            ctx.fill();
            // middle rect
            ctx.strokeRect(x-4, y-1, 8, 4);
            // base T
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
      }
      
      // Draw selection outline and distance indicators
      if (selectedLight === light.id) {
        ctx.strokeStyle = '#00bcd4';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const outlineSize = 15 * sizeMultiplier;
        ctx.strokeRect(x - outlineSize, y - outlineSize, outlineSize * 2, outlineSize * 2);
        ctx.setLineDash([]);

        // Draw distance lines to nearest walls
        const positionInfo = getLightPositionInfo(light);
        if (positionInfo && blueprintData?.walls) {
          ctx.strokeStyle = '#ff6b6b';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);

          // Draw line to nearest horizontal wall
          if (positionInfo.nearestWalls.horizontal) {
            const wall = positionInfo.nearestWalls.horizontal as Wall;
            const wallStartX = offsetX + wall.start.x * scale;
            const wallStartY = offsetY + wall.start.y * scale;
            const wallEndX = offsetX + wall.end.x * scale;
            const wallEndY = offsetY + wall.end.y * scale;

            // Find closest point on the wall
            const A = light.x - wall.start.x;
            const B = light.y - wall.start.y;
            const C = wall.end.x - wall.start.x;
            const D = wall.end.y - wall.start.y;
            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            
            if (lenSq > 0) {
              const param = Math.max(0, Math.min(1, dot / lenSq));
              const closestX = wall.start.x + param * C;
              const closestY = wall.start.y + param * D;
              const closestCanvasX = offsetX + closestX * scale;
              const closestCanvasY = offsetY + closestY * scale;

              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(closestCanvasX, closestCanvasY);
              ctx.stroke();

              // Draw distance text
              const midX = (x + closestCanvasX) / 2;
              const midY = (y + closestCanvasY) / 2;
              ctx.fillStyle = '#ff6b6b';
              ctx.font = '10px Arial';
              ctx.textAlign = 'center';
              const distance = positionInfo.hasCalibration 
                ? `${positionInfo.distances.horizontal.toFixed(1)} ${positionInfo.unit}`
                : `${positionInfo.distances.pixelHorizontal.toFixed(0)}px`;
              ctx.fillText(distance, midX, midY - 5);
            }
          }

          // Draw line to nearest vertical wall
          if (positionInfo.nearestWalls.vertical) {
            const wall = positionInfo.nearestWalls.vertical as Wall;
            const wallStartX = offsetX + wall.start.x * scale;
            const wallStartY = offsetY + wall.start.y * scale;
            const wallEndX = offsetX + wall.end.x * scale;
            const wallEndY = offsetY + wall.end.y * scale;

            // Find closest point on the wall
            const A = light.x - wall.start.x;
            const B = light.y - wall.start.y;
            const C = wall.end.x - wall.start.x;
            const D = wall.end.y - wall.start.y;
            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            
            if (lenSq > 0) {
              const param = Math.max(0, Math.min(1, dot / lenSq));
              const closestX = wall.start.x + param * C;
              const closestY = wall.start.y + param * D;
              const closestCanvasX = offsetX + closestX * scale;
              const closestCanvasY = offsetY + closestY * scale;

              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(closestCanvasX, closestCanvasY);
              ctx.stroke();

              // Draw distance text
              const midX = (x + closestCanvasX) / 2;
              const midY = (y + closestCanvasY) / 2;
              ctx.fillStyle = '#ff6b6b';
              ctx.font = '10px Arial';
              ctx.textAlign = 'center';
              const distance = positionInfo.hasCalibration 
                ? `${positionInfo.distances.vertical.toFixed(1)} ${positionInfo.unit}`
                : `${positionInfo.distances.pixelVertical.toFixed(0)}px`;
              ctx.fillText(distance, midX, midY + 15);
            }
          }

          ctx.setLineDash([]);
        }
      }
      
      ctx.restore();
    });
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

  const formatMeasurement = (pixelLength: number, realLength?: number): string => {
    if (realLength && blueprintData?.calibration?.pixelsPerInch && blueprintData.calibration.pixelsPerInch > 0) {
      const unit = blueprintData.calibration.unit || blueprintData.calibration.measurementUnit || 'feet';
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

  // Helper function to check if a point is inside a polygon (room)
  const isPointInPolygon = (point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
          (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Helper function to check line-line intersection
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

  // Helper function to determine if a wall is horizontal or vertical
  const getWallOrientation = (wall: Wall): 'horizontal' | 'vertical' | 'diagonal' => {
    const deltaX = Math.abs(wall.end.x - wall.start.x);
    const deltaY = Math.abs(wall.end.y - wall.start.y);
    const threshold = 10; // Tolerance for considering a wall horizontal/vertical

    if (deltaY <= threshold) return 'horizontal';
    if (deltaX <= threshold) return 'vertical';
    return 'diagonal';
  };

  // Helper function to calculate distance from a point to a line segment
  const distanceToLineSegment = (
    point: { x: number; y: number },
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number }
  ): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      // Line segment is actually a point
      return Math.sqrt(A * A + B * B);
    }

    let param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Function to get light position and wall distances
  const getLightPositionInfo = (light: LightFixture) => {
    if (!blueprintData?.walls || !blueprintData?.calibration) return null;

    const calibration = blueprintData.calibration;
    const walls = blueprintData.walls;

    // Convert light position to feet (always use feet when calibration is available)
    let realX = light.x;
    let realY = light.y;
    let displayUnit = 'pixels';
    
    // If we have calibration data, always convert to feet
    if (calibration.pixelsPerInch && calibration.pixelsPerInch > 0) {
      realX = light.x / calibration.pixelsPerInch / 12; // Convert to feet
      realY = light.y / calibration.pixelsPerInch / 12;
      displayUnit = 'feet';
    }

    // Find nearest horizontal and vertical walls
    let nearestHorizontalWall: Wall | null = null;
    let nearestVerticalWall: Wall | null = null;
    let minHorizontalDistance = Infinity;
    let minVerticalDistance = Infinity;

    walls.forEach(wall => {
      const orientation = getWallOrientation(wall);
      const distance = distanceToLineSegment(
        { x: light.x, y: light.y },
        wall.start,
        wall.end
      );

      if (orientation === 'horizontal' && distance < minHorizontalDistance) {
        minHorizontalDistance = distance;
        nearestHorizontalWall = wall;
      } else if (orientation === 'vertical' && distance < minVerticalDistance) {
        minVerticalDistance = distance;
        nearestVerticalWall = wall;
      }
    });

    // Convert distances to feet when calibration is available
    let realHorizontalDistance = minHorizontalDistance;
    let realVerticalDistance = minVerticalDistance;

    if (calibration.pixelsPerInch && calibration.pixelsPerInch > 0) {
      realHorizontalDistance = minHorizontalDistance / calibration.pixelsPerInch / 12;
      realVerticalDistance = minVerticalDistance / calibration.pixelsPerInch / 12;
    }

    return {
      position: {
        x: realX,
        y: realY,
        pixelX: light.x,
        pixelY: light.y
      },
      distances: {
        horizontal: realHorizontalDistance,
        vertical: realVerticalDistance,
        pixelHorizontal: minHorizontalDistance,
        pixelVertical: minVerticalDistance
      },
      nearestWalls: {
        horizontal: nearestHorizontalWall,
        vertical: nearestVerticalWall
      },
      unit: displayUnit,
      hasCalibration: calibration.pixelsPerInch && calibration.pixelsPerInch > 0
    };
  };

  // Function to draw light with wall shadows using ray casting
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
    if (!blueprintData?.walls) return;

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
    blueprintData.walls.forEach(wall => {
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
      blueprintData.walls.forEach(wall => {
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

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !blueprintData) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

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

    // Check if clicking on existing light fixture
    let clickedLight = null;
    for (const light of lightFixtures) {
      const distance = Math.sqrt(
        Math.pow(blueprintX - light.x, 2) + Math.pow(blueprintY - light.y, 2)
      );
      if (distance <= 15 * (light.size || 1.0)) {
        clickedLight = light;
        break;
      }
    }

    if (clickedLight) {
      setSelectedLight(clickedLight.id);
      if (isMoveModeEnabled) {
        setIsDraggingLight(true);
        setDragStart({ x: blueprintX, y: blueprintY });
      }
    } else if (selectedLightType) {
      // Place new light fixture
      const newLight: LightFixture = {
        id: Date.now().toString(),
        type: selectedLightType,
        x: blueprintX,
        y: blueprintY,
        intensity: 70,
        color: selectedLightType === 'outdoor-profile' ? '#FF0000' : '#ffffff',
        radius: (selectedLightType === 'mini-spot' || selectedLightType === 'bed-reading-spot') ? 30 : (selectedLightType === 'stretch-ceiling') ? 120 : (selectedLightType === 'chandelier-2') ? 80 : 60,
        isOn: true,
        size: 1.0, // Default size multiplier
        direction: (selectedLightType === 'spot-type5-wall-washer' || selectedLightType === 'adjustable-spot-type6' || selectedLightType === 'wall-washer-spot' || selectedLightType === 'laser-blade' || selectedLightType === 'linear-wall-washer' || selectedLightType === 'linear-profile-lighting' || selectedLightType === 'gimbel-spot' || selectedLightType === 'indoor-strip-light' || selectedLightType === 'curtain-grazer' || selectedLightType === 'outdoor-profile' || selectedLightType === 'magnetic-track' || selectedLightType === 'track-spot' || selectedLightType === 'track-spot-2' || selectedLightType === 'magnetic-laser-blade' || selectedLightType === 'magnetic-laser-blade-large' || selectedLightType === 'magnetic-profile' || selectedLightType === 'magnetic-profile-large' || selectedLightType === 'laser-blade-wall-washer' || selectedLightType === 'laser-blade-wall-washer-large' || selectedLightType === 'magnetic-profile-adjustable' || selectedLightType === 'magnetic-profile-adjustable-large' || selectedLightType === 'stretch-ceiling' || selectedLightType === 'module-signage' || selectedLightType === 'table-lamp' || selectedLightType === 'floor-lamp' || selectedLightType === 'chandelier-2' || selectedLightType === 'dining-linear-pendant' || selectedLightType === 'hanging-light') ? 0 : undefined,
        width: (selectedLightType === 'laser-blade' || selectedLightType === 'linear-wall-washer' || selectedLightType === 'linear-profile-lighting' || selectedLightType === 'indoor-strip-light' || selectedLightType === 'curtain-grazer' || selectedLightType === 'outdoor-profile' || selectedLightType === 'magnetic-track' || selectedLightType === 'magnetic-laser-blade' || selectedLightType === 'magnetic-profile' || selectedLightType === 'magnetic-profile-adjustable' || selectedLightType === 'dining-linear-pendant') ? 50 : (selectedLightType === 'magnetic-laser-blade-large' || selectedLightType === 'magnetic-profile-large' || selectedLightType === 'laser-blade-wall-washer-large' || selectedLightType === 'magnetic-profile-adjustable-large' || selectedLightType === 'stretch-ceiling' || selectedLightType === 'module-signage') ? 100 : undefined,
      };
      
      setLightFixtures(prev => [...prev, newLight]);
      setSelectedLight(newLight.id);
      setSelectedLightType(null);
    } else {
      setSelectedLight(null);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingLight || !selectedLight || !canvasRef.current || !blueprintData) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

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

    // Update the selected light position
    setLightFixtures(prev => prev.map(light => 
      light.id === selectedLight 
        ? { ...light, x: blueprintX, y: blueprintY }
        : light
    ));
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingLight(false);
    setDragStart(null);
  };

  const handleZoom = (delta: number, centerX?: number, centerY?: number) => {
    const zoomFactor = 1.1;
    const newZoom = delta > 0 ? zoom * zoomFactor : zoom / zoomFactor;
    const clampedZoom = Math.max(0.1, Math.min(5, newZoom));
    
    if (centerX !== undefined && centerY !== undefined) {
      const scaleDiff = clampedZoom - zoom;
      setPanOffset(prev => ({
        x: prev.x - (centerX - prev.x) * scaleDiff / zoom,
        y: prev.y - (centerY - prev.y) * scaleDiff / zoom
      }));
    }
    
    setZoom(clampedZoom);
  };

  const resetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
    
    // Calculate zoom
    const zoomFactor = 1.1;
    const newZoom = event.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    const clampedZoom = Math.max(0.1, Math.min(5, newZoom));
    
    // Calculate new pan offset to zoom toward mouse position
    const zoomChange = clampedZoom - zoom;
    const newPanOffset = {
      x: panOffset.x - (mouseX - panOffset.x) * (zoomChange / zoom),
      y: panOffset.y - (mouseY - panOffset.y) * (zoomChange / zoom)
    };
    
    setZoom(clampedZoom);
    setPanOffset(newPanOffset);
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button === 1 || (event.button === 0 && event.shiftKey) || (event.button === 0 && isBlueprintDragEnabled)) {
      // Middle mouse button, Shift+Left click, or enabled blueprint drag for panning
      event.preventDefault();
      setIsPanning(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
      const mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
      
      setPanStart({ x: mouseX - panOffset.x, y: mouseY - panOffset.y });
    }
  };

  const handleCanvasMouseMoveForPan = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning && panStart) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
      const mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
      
      setPanOffset({
        x: mouseX - panStart.x,
        y: mouseY - panStart.y
      });
    }
  };

  const handleCanvasMouseUpForPan = () => {
    setIsPanning(false);
    setPanStart(null);
  };

  const lightTypes: { type: LightFixture['type']; label: string }[] = [
    { type: 'spot-type1', label: 'Spot Type 1' },
    { type: 'spot-type2', label: 'Spot Type 2' },
    { type: 'spot-type3', label: 'Spot Type 3' },
    { type: 'spot-type4', label: 'Spot Type 4' },
    { type: 'spot-type5-wall-washer', label: 'Wall Washer' },
    { type: 'adjustable-spot-type6', label: 'Adjustable Spot' },
    { type: 'mini-spot', label: 'Mini Spot' },
    { type: 'bed-reading-spot', label: 'Bed Reading Spot' },
    { type: 'waterproof-spot', label: 'Waterproof Spot' },
    { type: 'wall-washer-spot', label: 'Wall Washer Spot' },
    { type: 'laser-blade', label: 'Laser Blade' },
    { type: 'linear-wall-washer', label: 'Linear Wall Washer' },
    { type: 'linear-profile-lighting', label: 'Linear Profile' },
    { type: 'gimbel-spot', label: 'Gimbel Spot' },
    { type: 'surface-spot-light-indoor', label: 'Surface Spot' },
    { type: 'surface-spot-light-indoor-2', label: 'Surface Spot 2' },
    { type: 'downlight', label: 'Downlight' },
    { type: 'surface-panel', label: 'Surface Panel' },
    { type: 'indoor-strip-light', label: 'Indoor Strip' },
    { type: 'curtain-grazer', label: 'Curtain Grazer' },
    { type: 'outdoor-profile', label: 'Outdoor Profile' },
    { type: 'magnetic-track', label: 'Magnetic Track' },
    { type: 'track-spot', label: 'Track Spot' },
    { type: 'track-spot-2', label: 'Track Spot 2' },
    { type: 'magnetic-laser-blade', label: 'Magnetic Laser Blade' },
    { type: 'magnetic-laser-blade-large', label: 'Magnetic Laser Blade Large' },
    { type: 'magnetic-profile', label: 'Magnetic Profile' },
    { type: 'magnetic-profile-large', label: 'Magnetic Profile Large' },
    { type: 'laser-blade-wall-washer', label: 'Laser Blade Wall Washer' },
    { type: 'laser-blade-wall-washer-large', label: 'Laser Blade Wall Washer Large' },
    { type: 'magnetic-profile-adjustable', label: 'Magnetic Profile Adjustable' },
    { type: 'magnetic-profile-adjustable-large', label: 'Magnetic Profile Adjustable Large' },
    { type: 'stretch-ceiling', label: 'Stretch Ceiling' },
    { type: 'module-signage', label: 'Module Signage' },
    { type: 'table-lamp', label: 'Table Lamp' },
    { type: 'floor-lamp', label: 'Floor Lamp' },
    { type: 'chandelier-2', label: 'Chandelier' },
    { type: 'dining-linear-pendant', label: 'Dining Linear Pendant' },
    { type: 'hanging-light', label: 'Hanging Light' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="premium-text text-cyan-300">Loading lighting design...</p>
        </div>
      </div>
    );
  }

  if (!blueprintData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Lightbulb className="h-16 w-16 text-red-400 mx-auto" />
          <h1 className="premium-title text-red-300">No Blueprint Data Found</h1>
          <p className="premium-text text-muted-foreground">Please create a blueprint first.</p>
          <Link href="/enhancement">
            <Button className="mt-4 neon-button">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Enhancement
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/enhancement">
                <Button variant="outline" size="sm" className="border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Enhancement
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-100">
                  Lighting Design
                </h1>
                <p className="text-sm text-gray-400">
                  Design and visualize lighting for your floor plan
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setIsBlueprintDragEnabled(!isBlueprintDragEnabled)}
                variant={isBlueprintDragEnabled ? "default" : "outline"}
                className={`${
                  isBlueprintDragEnabled 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white'
                }`}
                size="sm"
              >
                <Hand className="h-4 w-4 mr-2" />
                Blueprint Drag
              </Button>
              <Button 
                onClick={handleSaveToMongoDB}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Save Project
                  </>
                )}
              </Button>

              <Button 
                onClick={() => {
                  const lightingData = { ...blueprintData, furniture, lightFixtures, lightingSettings: { ambientLightLevel } };
                  const dataStr = JSON.stringify(lightingData, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `lighting-design-${Date.now()}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Design
              </Button>
              
              <Button 
                onClick={() => {
                  const positionsData = lightFixtures.map((light, index) => {
                    const positionInfo = getLightPositionInfo(light);
                    return {
                      lightId: index + 1,
                      type: light.type,
                      position: positionInfo ? {
                        x: positionInfo.hasCalibration ? positionInfo.position.x : positionInfo.position.pixelX,
                        y: positionInfo.hasCalibration ? positionInfo.position.y : positionInfo.position.pixelY,
                        unit: positionInfo.hasCalibration ? positionInfo.unit : 'pixels'
                      } : null,
                      distances: positionInfo ? {
                        toHorizontalWall: positionInfo.distances.horizontal !== Infinity 
                          ? (positionInfo.hasCalibration ? positionInfo.distances.horizontal : positionInfo.distances.pixelHorizontal)
                          : null,
                        toVerticalWall: positionInfo.distances.vertical !== Infinity 
                          ? (positionInfo.hasCalibration ? positionInfo.distances.vertical : positionInfo.distances.pixelVertical)
                          : null,
                        unit: positionInfo.hasCalibration ? positionInfo.unit : 'pixels'
                      } : null,
                      isOn: light.isOn,
                      intensity: light.intensity,
                      size: light.size || 1.0
                    };
                  });

                  const csvContent = [
                    ['Light ID', 'Type', 'X Position', 'Y Position', 'Distance to H Wall', 'Distance to V Wall', 'Unit', 'Status', 'Intensity', 'Size'],
                    ...positionsData.map(light => [
                      light.lightId,
                      light.type,
                      light.position?.x?.toFixed(2) || 'N/A',
                      light.position?.y?.toFixed(2) || 'N/A',
                      light.distances?.toHorizontalWall?.toFixed(2) || 'N/A',
                      light.distances?.toVerticalWall?.toFixed(2) || 'N/A',
                      light.position?.unit || 'N/A',
                      light.isOn ? 'ON' : 'OFF',
                      `${light.intensity}%`,
                      `${(light.size * 100).toFixed(0)}%`
                    ])
                  ].map(row => row.join(',')).join('\n');

                  const dataBlob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `light-positions-${Date.now()}.csv`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                variant="outline"
                className="border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Positions
              </Button>
              
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                className="border-red-600 text-red-400 hover:bg-red-900/20 hover:text-red-300 hover:border-red-500"
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Save Status Message */}
      {saveMessage && (
        <div className={`mx-4 mt-4 p-3 rounded-lg text-center ${
          saveMessage.includes('Error') 
            ? 'bg-red-900/20 border border-red-800 text-red-400' 
            : 'bg-green-900/20 border border-green-800 text-green-400'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Light Fixtures Toolbar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 shadow-sm flex flex-col py-6 space-y-4">
          <h3 className="text-sm font-medium text-gray-300 text-center">
            LIGHTING FIXTURES
          </h3>
          <div className="w-full h-px bg-gray-600 mx-4"></div>
          


          {/* Ambient Light Level */}
          <div className="px-4">
            <h4 className="text-xs font-medium text-gray-400 mb-2">AMBIENT LIGHT</h4>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="100"
                value={ambientLightLevel}
                onChange={(e) => setAmbientLightLevel(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-gray-300 min-w-[2rem]">{ambientLightLevel}%</span>
            </div>
          </div>
          
          <div className="w-full h-px bg-gray-600 mx-4"></div>
          
          {/* Light Fixtures Grid */}
          <div className="px-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {lightTypes.map(({ type, label }) => (
                <Button
                  key={type}
                  variant={selectedLightType === type ? "default" : "ghost"}
                  className={`p-2 h-auto flex flex-col items-center space-y-1 min-h-[80px] ${
                    selectedLightType === type
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                  onClick={() => setSelectedLightType(selectedLightType === type ? null : type)}
                >
                  <LightSymbol type={type} size={28} />
                  <span className="text-[10px] text-center leading-tight break-words px-1">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Clear All Lights */}
          {lightFixtures.length > 0 && (
            <>
              <div className="w-full h-px bg-gray-600 mx-4"></div>
              <div className="px-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-red-400 hover:bg-red-900/20 hover:text-red-300"
                  onClick={() => setLightFixtures([])}
                >
                  Clear All Lights
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Blueprint Canvas */}
        <div className="flex-1 flex flex-col p-4 bg-gray-900">
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Lighting Design Canvas</h2>
                  <p className="text-sm text-gray-400">
                    Click to place lights • {lightFixtures.length} fixtures placed
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
                    >
                      <span className="text-lg">+</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                      onClick={resetView}
                    >
                      <span className="text-xs">Reset</span>
                    </Button>
                  </div>
                  
                  {selectedLightType && (
                    <div className="flex items-center space-x-2 text-sm text-yellow-400 bg-yellow-900/20 px-3 py-1 rounded-full border border-yellow-800">
                      <Lightbulb className="h-4 w-4" />
                      <span>Click to place {selectedLightType}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-800">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={handleCanvasClick}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={(e) => {
                  handleCanvasMouseMove(e);
                  handleCanvasMouseMoveForPan(e);
                }}
                onMouseUp={() => {
                  handleCanvasMouseUp();
                  handleCanvasMouseUpForPan();
                }}
                className={`rounded-lg border border-gray-600 shadow-inner ${
                  isPanning ? 'cursor-grabbing' : 
                  isBlueprintDragEnabled ? 'cursor-grab' :
                  isMoveModeEnabled ? 'cursor-move' : 'cursor-crosshair'
                }`}
                style={{ maxWidth: '100%', height: 'auto' }}
                onWheel={handleWheel}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Light Controls */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 shadow-sm overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Selected Light Controls */}
            {selectedLight && (
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Light Settings</h3>
                {(() => {
                  const light = lightFixtures.find(l => l.id === selectedLight);
                  if (!light) return null;
                  
                  const positionInfo = getLightPositionInfo(light);
                  
                  return (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400">Type</label>
                        <p className="text-gray-100 capitalize">{light.type}</p>
                      </div>
                      
                      {/* Position Information */}
                      {positionInfo && (
                        <div className="bg-gray-700 rounded-lg p-3 space-y-2">
                          <h4 className="text-sm font-semibold text-gray-100">Position & Distances</h4>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-gray-400">X Position</label>
                              <p className="text-gray-100 font-mono">
                                {positionInfo.hasCalibration 
                                  ? `${positionInfo.position.x.toFixed(2)} ${positionInfo.unit}`
                                  : `${positionInfo.position.pixelX.toFixed(0)}px`
                                }
                              </p>
                            </div>
                            <div>
                              <label className="text-gray-400">Y Position</label>
                              <p className="text-gray-100 font-mono">
                                {positionInfo.hasCalibration 
                                  ? `${positionInfo.position.y.toFixed(2)} ${positionInfo.unit}`
                                  : `${positionInfo.position.pixelY.toFixed(0)}px`
                                }
                              </p>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-600 pt-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="text-gray-400">To Horizontal Wall</label>
                                <p className="text-gray-100 font-mono">
                                  {positionInfo.distances.horizontal !== Infinity 
                                    ? (positionInfo.hasCalibration 
                                        ? `${positionInfo.distances.horizontal.toFixed(2)} ${positionInfo.unit}`
                                        : `${positionInfo.distances.pixelHorizontal.toFixed(0)}px`
                                      )
                                    : 'No wall found'
                                  }
                                </p>
                              </div>
                              <div>
                                <label className="text-gray-400">To Vertical Wall</label>
                                <p className="text-gray-100 font-mono">
                                  {positionInfo.distances.vertical !== Infinity 
                                    ? (positionInfo.hasCalibration 
                                        ? `${positionInfo.distances.vertical.toFixed(2)} ${positionInfo.unit}`
                                        : `${positionInfo.distances.pixelVertical.toFixed(0)}px`
                                      )
                                    : 'No wall found'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {!positionInfo.hasCalibration && (
                            <div className="text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded">
                              ⚠️ Blueprint not calibrated. Showing pixel measurements.
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div>
                        <label className="text-sm text-gray-400">Intensity</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={light.intensity}
                          onChange={(e) => {
                            const newIntensity = Number(e.target.value);
                            setLightFixtures(prev => prev.map(l => 
                              l.id === selectedLight ? { ...l, intensity: newIntensity } : l
                            ));
                          }}
                          className="w-full mt-1"
                        />
                        <span className="text-xs text-gray-300">{light.intensity}%</span>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-400">Radius</label>
                        <input
                          type="range"
                          min="20"
                          max="150"
                          value={light.radius}
                          onChange={(e) => {
                            const newRadius = Number(e.target.value);
                            setLightFixtures(prev => prev.map(l => 
                              l.id === selectedLight ? { ...l, radius: newRadius } : l
                            ));
                          }}
                          className="w-full mt-1"
                        />
                        <span className="text-xs text-gray-300">{light.radius}px</span>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-400">Size</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:bg-gray-700 hover:text-gray-200 px-2"
                            onClick={() => {
                              const newSize = Math.max(0.5, (light.size || 1.0) - 0.1);
                              setLightFixtures(prev => prev.map(l => 
                                l.id === selectedLight ? { ...l, size: newSize } : l
                              ));
                            }}
                          >
                            −
                          </Button>
                          <input
                            type="range"
                            min="0.5"
                            max="3.0"
                            step="0.1"
                            value={light.size || 1.0}
                            onChange={(e) => {
                              const newSize = Number(e.target.value);
                              setLightFixtures(prev => prev.map(l => 
                                l.id === selectedLight ? { ...l, size: newSize } : l
                              ));
                            }}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:bg-gray-700 hover:text-gray-200 px-2"
                            onClick={() => {
                              const newSize = Math.min(3.0, (light.size || 1.0) + 0.1);
                              setLightFixtures(prev => prev.map(l => 
                                l.id === selectedLight ? { ...l, size: newSize } : l
                              ));
                            }}
                          >
                            +
                          </Button>
                        </div>
                        <span className="text-xs text-gray-300">{((light.size || 1.0) * 100).toFixed(0)}%</span>
                      </div>

                      {(light.type === 'adjustable-spot-type6' || light.type === 'spot-type5-wall-washer' || light.type === 'wall-washer-spot' || light.type === 'laser-blade' || light.type === 'linear-wall-washer' || light.type === 'linear-profile-lighting' || light.type === 'gimbel-spot' || light.type === 'indoor-strip-light' || light.type === 'curtain-grazer' || light.type === 'outdoor-profile' || light.type === 'magnetic-track' || light.type === 'track-spot' || light.type === 'track-spot-2' || selectedLightType === 'magnetic-laser-blade' || selectedLightType === 'magnetic-laser-blade-large' || selectedLightType === 'magnetic-profile' || selectedLightType === 'magnetic-profile-large' || selectedLightType === 'laser-blade-wall-washer' || selectedLightType === 'laser-blade-wall-washer-large' || selectedLightType === 'magnetic-profile-adjustable' || selectedLightType === 'magnetic-profile-adjustable-large' || selectedLightType === 'stretch-ceiling' || selectedLightType === 'module-signage' || selectedLightType === 'table-lamp' || selectedLightType === 'floor-lamp' || selectedLightType === 'chandelier-2' || selectedLightType === 'dining-linear-pendant' || selectedLightType === 'hanging-light') && (
                        <div>
                          <label className="text-sm text-gray-400">Direction</label>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={light.direction ?? 0}
                            onChange={(e) => {
                              const newDirection = Number(e.target.value);
                              setLightFixtures(prev => prev.map(l => 
                                l.id === selectedLight ? { ...l, direction: newDirection } : l
                              ));
                            }}
                            className="w-full mt-1"
                          />
                          <span className="text-xs text-gray-300">{light.direction ?? 0}°</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-gray-400">On/Off</label>
                        <Button
                          size="sm"
                          variant={light.isOn ? "default" : "ghost"}
                          onClick={() => {
                            setLightFixtures(prev => prev.map(l => 
                              l.id === selectedLight ? { ...l, isOn: !l.isOn } : l
                            ));
                          }}
                          className={light.isOn ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                        >
                          {light.isOn ? 'ON' : 'OFF'}
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-gray-400">Move Mode</label>
                        <Button
                          size="sm"
                          variant={isMoveModeEnabled ? "default" : "ghost"}
                          onClick={() => setIsMoveModeEnabled(!isMoveModeEnabled)}
                          className={isMoveModeEnabled ? "bg-blue-600 hover:bg-blue-700" : ""}
                        >
                          {isMoveModeEnabled ? 'ENABLED' : 'DISABLED'}
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-red-400 hover:bg-red-900/20 hover:text-red-300"
                        onClick={() => {
                          setLightFixtures(prev => prev.filter(l => l.id !== selectedLight));
                          setSelectedLight(null);
                        }}
                      >
                        Delete Light
                      </Button>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Light Fixtures List */}
            {lightFixtures.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Placed Lights</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {lightFixtures.map((light, index) => {
                    const positionInfo = getLightPositionInfo(light);
                    return (
                      <div 
                        key={light.id} 
                        className={`p-3 rounded-lg cursor-pointer ${
                          selectedLight === light.id ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        onClick={() => setSelectedLight(light.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${light.isOn ? 'bg-yellow-400' : 'bg-gray-500'}`}></div>
                            <span className="text-sm font-medium text-gray-100 capitalize">
                              {light.type} {index + 1}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {light.intensity}% • {light.isOn ? 'ON' : 'OFF'}
                          </div>
                        </div>
                        
                        {positionInfo && (
                          <div className="text-xs text-gray-400 grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-600">
                            <div>
                              <span className="text-gray-500">Pos:</span> 
                              <span className="text-gray-300 font-mono ml-1">
                                {positionInfo.hasCalibration 
                                  ? `${positionInfo.position.x.toFixed(1)}, ${positionInfo.position.y.toFixed(1)} ${positionInfo.unit}`
                                  : `${positionInfo.position.pixelX.toFixed(0)}, ${positionInfo.position.pixelY.toFixed(0)}px`
                                }
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Walls:</span> 
                              <span className="text-gray-300 font-mono ml-1">
                                {positionInfo.distances.horizontal !== Infinity && positionInfo.distances.vertical !== Infinity
                                  ? (positionInfo.hasCalibration 
                                      ? `${positionInfo.distances.horizontal.toFixed(1)}×${positionInfo.distances.vertical.toFixed(1)}`
                                      : `${positionInfo.distances.pixelHorizontal.toFixed(0)}×${positionInfo.distances.pixelVertical.toFixed(0)}`
                                    )
                                  : 'N/A'
                                }
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Blueprint Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Design Info</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Furniture</p>
                  <p className="text-lg font-semibold text-gray-100">{furniture.length}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Lights</p>
                  <p className="text-lg font-semibold text-gray-100">{lightFixtures.length}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Mode</p>
                  <p className="text-sm font-medium text-blue-400">Night</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Ambient</p>
                  <p className="text-sm font-medium text-green-400">{ambientLightLevel}%</p>
                </div>
              </div>
            </div>

            {/* Controls Guide */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-100 mb-2">Controls</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• Click fixture type to select</p>
                <p>• Click canvas to place light</p>
                <p>• Click light to select/edit</p>
                <p>• View exact position & wall distances</p>
                <p>• Adjust intensity, radius & size</p>
                <p>• Use +/− buttons to resize</p>
                <p>• Enable move mode to drag lights</p>
                <p>• Toggle lights on/off</p>
                <div className="border-t border-gray-600 my-2"></div>
                <p>• <kbd className="bg-gray-600 px-1 rounded">Wheel</kbd> to zoom in/out</p>
                <p>• <kbd className="bg-gray-600 px-1 rounded">Shift+Drag</kbd> to pan blueprint</p>
                <p>• <kbd className="bg-gray-600 px-1 rounded">Middle Click+Drag</kbd> to pan</p>
                <p>• <kbd className="bg-gray-600 px-1 rounded">Blueprint Drag</kbd> toggle for easy panning</p>
                <p>• <kbd className="bg-gray-600 px-1 rounded">Drag</kbd> to move lights (when enabled)</p>
                <p>• <span className="text-red-400">Red lines</span> show wall distances</p>
                <p>• Export positions as CSV file</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 