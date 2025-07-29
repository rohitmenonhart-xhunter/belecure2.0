"use client";

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import type { ChangeEvent, MouseEvent } from "react";
// Removed Card components - using plain divs for cleaner appearance
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, UploadCloud, Undo, Trash2, Grid, Wand2, Loader2, Ruler } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";


interface Point {
  x: number;
  y: number;
}

interface Wall {
  start: Point;
  end: Point;
  id: string;
  pixelLength?: number;
  realLength?: number; // in inches
}

interface RoomLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
}

interface CalibrationData {
  pixelsPerInch: number;
  calibratedWallId: string | null;
}

const INITIAL_CANVAS_WIDTH = 1200;
const INITIAL_CANVAS_HEIGHT = 900;
const GRID_SIZE = 5; // Finer grid
const SNAP_THRESHOLD = 15;

export const FloorPlanEditor = forwardRef<{ exportBlueprintData: () => void }>((props, ref) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentEndPoint, setCurrentEndPoint] = useState<Point | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapPoint, setSnapPoint] = useState<Point | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Calibration states
  const [calibration, setCalibration] = useState<CalibrationData>({ pixelsPerInch: 0, calibratedWallId: null });
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
  const [calibrationInput, setCalibrationInput] = useState("");
  const [measurementUnit, setMeasurementUnit] = useState<"inches" | "feet" | "cm" | "m">("feet");
  
  // Multi-tap selection states
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [lastTappedWallId, setLastTappedWallId] = useState<string | null>(null);
  const TAP_TIMEOUT = 500; // milliseconds between taps
  
  // Tap-and-hold states
  const [isHolding, setIsHolding] = useState(false);
  const [holdStartTime, setHoldStartTime] = useState(0);
  const [holdWallId, setHoldWallId] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const HOLD_DURATION = 3000; // 3 seconds
  
  // Manual measurement and wall manipulation states
  const [showManualMeasurementDialog, setShowManualMeasurementDialog] = useState(false);
  const [manualMeasurementInput, setManualMeasurementInput] = useState("");
  const [wallToResize, setWallToResize] = useState<string | null>(null);
  const [moveWallsMode, setMoveWallsMode] = useState(false);
  const [isDraggingWall, setIsDraggingWall] = useState(false);
  const [draggedWallId, setDraggedWallId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point | null>(null);
  
  // Room labeling states
  const [roomLabels, setRoomLabels] = useState<RoomLabel[]>([]);
  const [labelingMode, setLabelingMode] = useState(false);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const [labelPosition, setLabelPosition] = useState<Point | null>(null);

  const { toast } = useToast();

  const editorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const blueprintCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Expose exportBlueprintData to parent component
  useImperativeHandle(ref, () => ({
    exportBlueprintData
  }));
  
  const getSnappedCoordinates = (point: Point): Point => {
    if (snapPoint) return snapPoint;
    if (!snapToGrid) return point;
    return {
      x: Math.round(point.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(point.y / GRID_SIZE) * GRID_SIZE,
    };
  };

  const getCanvasCoordinates = (event: MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get raw canvas coordinates
    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;
    
    // If there's an image, we need to account for the image positioning and scaling
    if (image) {
      const { x: imageOffsetX, y: imageOffsetY } = getDrawDimensions(image, canvas);
      
      // Only return coordinates if clicking within the image bounds
      const adjustedX = canvasX - imageOffsetX;
      const adjustedY = canvasY - imageOffsetY;
      
      return {
        x: canvasX,
        y: canvasY
      };
    }
    
    return {
      x: canvasX,
      y: canvasY,
    };
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setWalls([]);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutoDetect = () => {
    if (!image) {
      toast({
        title: "No Image",
        description: "Please upload a floor plan image first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    // Use a timeout to allow the UI to update to show the loader
    setTimeout(() => {
        try {
            const detectedWalls = processImageForWalls(image);
            setWalls(detectedWalls);
            toast({
              title: "Success",
              description: `Successfully detected ${detectedWalls.length} walls.`,
            });
        } catch (error) {
            console.error("Error processing image:", error);
            toast({
                title: "Detection Failed",
                description: "Could not detect walls. Please draw them manually.",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    }, 10);
  };
  
  const processImageForWalls = (img: HTMLImageElement): Wall[] => {
    const editorCanvas = editorCanvasRef.current;
    if (!editorCanvas) return [];

    const { drawWidth, drawHeight, x: offsetX, y: offsetY, scaleX, scaleY } = getDrawDimensions(img, editorCanvas);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = drawWidth;
    tempCanvas.height = drawHeight;
    const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];
    
    ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
    const imageData = ctx.getImageData(0, 0, drawWidth, drawHeight);
    const data = imageData.data;
    const pixels = new Uint8Array(drawWidth * drawHeight);

    // 1. Grayscale and Invert Binary Thresholding
    const threshold = 128;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      pixels[i / 4] = avg < threshold ? 1 : 0; // 1 for wall, 0 for background
    }

    const lines: Wall[] = [];
    const minWallLength = 30; // Minimum length of a wall in pixels
    const visited = new Set<number>();

    // 2. Contour Following to find wall segments
    for (let y = 0; y < drawHeight; y++) {
      for (let x = 0; x < drawWidth; x++) {
        const index = y * drawWidth + x;
        if (pixels[index] === 1 && !visited.has(index)) {
          
          const path = tracePath(pixels, drawWidth, drawHeight, x, y, visited);
          if(path.length === 0) continue;

          // 3. Line Simplification (using a simplified Ramer-Douglas-Peucker)
          const simplifiedPath = simplifyPath(path, 2.0);

          for(let i = 0; i < simplifiedPath.length - 1; i++) {
            const start = simplifiedPath[i];
            const end = simplifiedPath[i+1];
            const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));

            if (length > minWallLength) {
                lines.push({
                    start: { x: start.x + offsetX, y: start.y + offsetY },
                    end: { x: end.x + offsetX, y: end.y + offsetY },
                    id: `wall-${lines.length}`, // Assign a unique ID
                });
            }
          }
        }
      }
    }

    return lines;
  };

  const tracePath = (pixels: Uint8Array, width: number, height: number, startX: number, startY: number, visited: Set<number>) => {
    const path: Point[] = [];
    const stack: Point[] = [{x: startX, y: startY}];
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    
    const startIndex = startY * width + startX;
    if (visited.has(startIndex)) return [];
    
    let currentPoint = {x: startX, y: startY};
    path.push(currentPoint);
    visited.add(startY * width + startX);

    let i = 0;
    while(i < path.length) {
        currentPoint = path[i];
        i++;

        for(const [dx, dy] of directions) {
            const nx = currentPoint.x + dx;
            const ny = currentPoint.y + dy;
            const nIndex = ny * width + nx;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height && pixels[nIndex] === 1 && !visited.has(nIndex)) {
                visited.add(nIndex);
                path.push({x: nx, y: ny});
            }
        }
    }
    return path;
  }

  const simplifyPath = (points: Point[], tolerance: number): Point[] => {
    if (points.length < 3) return points;

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    let index = -1;
    let maxDist = 0;

    for (let i = 1; i < points.length - 1; i++) {
        const dist = perpendicularDistance(points[i], firstPoint, lastPoint);
        if (dist > maxDist) {
            maxDist = dist;
            index = i;
        }
    }

    if (maxDist > tolerance) {
        const firstHalf: Point[] = simplifyPath(points.slice(0, index + 1), tolerance);
        const secondHalf: Point[] = simplifyPath(points.slice(index), tolerance);
        return firstHalf.slice(0, firstHalf.length -1).concat(secondHalf);
    } else {
        return [firstPoint, lastPoint];
    }
  };

  const perpendicularDistance = (point: Point, lineStart: Point, lineEnd: Point) => {
      let dx = lineEnd.x - lineStart.x;
      let dy = lineEnd.y - lineStart.y;
  
      if (dx === 0 && dy === 0) { // It's a point not a line.
          dx = point.x - lineStart.x;
          dy = point.y - lineStart.y;
          return Math.sqrt(dx * dx + dy * dy);
      }
  
      const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);
      
      let closestPoint;
      if (t < 0) {
          closestPoint = lineStart;
      } else if (t > 1) {
          closestPoint = lineEnd;
      } else {
          closestPoint = { x: lineStart.x + t * dx, y: lineStart.y + t * dy };
      }
  
      dx = point.x - closestPoint.x;
      dy = point.y - closestPoint.y;
      return Math.sqrt(dx * dx + dy * dy);
  };

  const handleMouseDown = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;
    const coords = getCanvasCoordinates(event);
    
    // Check if clicking on a wall for calibration or moving (only if not at an endpoint)
    const clickedWall = findWallAtPoint(coords);
    const nearEndpoint = findNearestEndpoint(coords);
    
    if (clickedWall && !nearEndpoint && !isDrawing) {
      if (moveWallsMode) {
        // Start dragging the wall
        setIsDraggingWall(true);
        setDraggedWallId(clickedWall.id);
        
        // Calculate offset from wall center to click point
        const wallCenterX = (clickedWall.start.x + clickedWall.end.x) / 2;
        const wallCenterY = (clickedWall.start.y + clickedWall.end.y) / 2;
        setDragOffset({
          x: coords.x - wallCenterX,
          y: coords.y - wallCenterY
        });
        return;
      } else {
        // Start hold timer for resize mode
        setIsHolding(true);
        setHoldStartTime(Date.now());
        setHoldWallId(clickedWall.id);
        setHoldProgress(0);
        
        handleWallClick(clickedWall, event);
        return;
      }
    }
    
    // If in labeling mode, place label
    if (labelingMode) {
      handleLabelPlacement(coords);
      return;
    }
    
    // If in move mode, don't allow drawing
    if (moveWallsMode) return;
    
    // If clicking near an endpoint, start drawing from that exact endpoint
    let startCoords;
    if (nearEndpoint) {
      startCoords = nearEndpoint;
    } else {
      startCoords = getSnappedCoordinates(coords);
    }
    
    setIsDrawing(true);
    setStartPoint(startCoords);
    setCurrentEndPoint(startCoords);
  };

  const findNearestEndpoint = (point: Point): Point | null => {
    const tolerance = 15;
    
    for (const wall of walls) {
      const endpoints = [wall.start, wall.end];
      for (const endpoint of endpoints) {
        const distance = Math.sqrt(
          Math.pow(point.x - endpoint.x, 2) + Math.pow(point.y - endpoint.y, 2)
        );
        if (distance <= tolerance) {
          return endpoint;
        }
      }
    }
    return null;
  };

  const findWallAtPoint = (point: Point): Wall | null => {
    const tolerance = 10;
    
    for (const wall of walls) {
      const distance = distanceFromPointToLine(point, wall.start, wall.end);
      if (distance <= tolerance) {
        return wall;
      }
    }
    return null;
  };

  const distanceFromPointToLine = (point: Point, lineStart: Point, lineEnd: Point): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) {
      param = dot / lenSq;
    }

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

  const handleMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(event);
    
    // Handle wall dragging
    if (isDraggingWall && draggedWallId && dragOffset) {
      const targetWall = walls.find(w => w.id === draggedWallId);
      if (targetWall) {
        // Calculate new wall center position
        const newCenterX = coords.x - dragOffset.x;
        const newCenterY = coords.y - dragOffset.y;
        
        // Calculate wall dimensions
        const wallWidth = targetWall.end.x - targetWall.start.x;
        const wallHeight = targetWall.end.y - targetWall.start.y;
        
        // Update wall position
        const newStart = {
          x: newCenterX - wallWidth / 2,
          y: newCenterY - wallHeight / 2
        };
        const newEnd = {
          x: newCenterX + wallWidth / 2,
          y: newCenterY + wallHeight / 2
        };
        
        const updatedWalls = walls.map(wall => 
          wall.id === draggedWallId 
            ? { ...wall, start: newStart, end: newEnd }
            : wall
        );
        
        setWalls(updatedWalls);
      }
      return;
    }
    
    // Check for snapping to wall endpoints (only if not in move mode)
    if (!moveWallsMode) {
      let foundSnapPoint = null;
      for (const wall of walls) {
          const points = [wall.start, wall.end];
          for (const point of points) {
              const distance = Math.sqrt(Math.pow(coords.x - point.x, 2) + Math.pow(coords.y - point.y, 2));
              if (distance < SNAP_THRESHOLD) {
                  foundSnapPoint = point;
                  break;
              }
          }
          if (foundSnapPoint) break;
      }
      setSnapPoint(foundSnapPoint);
    }

    if (!isDrawing || !startPoint) return;
    const snappedCoords = getSnappedCoordinates(coords);
    setCurrentEndPoint(snappedCoords);
  };

  const handleMouseUp = () => {
    // Stop wall dragging
    if (isDraggingWall) {
      setIsDraggingWall(false);
      setDraggedWallId(null);
      setDragOffset(null);
      return;
    }
    
    // Stop hold timer
    if (isHolding) {
      setIsHolding(false);
      setHoldStartTime(0);
      setHoldWallId(null);
      setHoldProgress(0);
    }
    
    if (!isDrawing || !startPoint || !currentEndPoint) return;
    // Don't add zero-length walls
    if (startPoint.x === currentEndPoint.x && startPoint.y === currentEndPoint.y) {
        setIsDrawing(false);
        setStartPoint(null);
        setCurrentEndPoint(null);
        return;
    }
    setWalls([...walls, { start: startPoint, end: currentEndPoint, id: `wall-${walls.length}` }]);
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentEndPoint(null);
  };

  const handleMouseLeave = () => {
    setSnapPoint(null);
    
    // Stop hold timer
    if (isHolding) {
      setIsHolding(false);
      setHoldStartTime(0);
      setHoldWallId(null);
      setHoldProgress(0);
    }
    
    if (isDrawing) {
      handleMouseUp();
    }
  };
  
  const undoLastWall = () => {
    setWalls(walls.slice(0, -1));
  };
  
  const clearAllWalls = () => {
    setWalls([]);
    setCalibration({ pixelsPerInch: 0, calibratedWallId: null });
    setSelectedWallId(null);
    setTapCount(0);
    setLastTappedWallId(null);
  };

  const exitScaleMode = () => {
    setCalibration({ pixelsPerInch: 0, calibratedWallId: null });
    setSelectedWallId(null);
    setTapCount(0);
    setLastTappedWallId(null);
    
    // Keep the walls but remove the calibrated measurements
    // The drawing function will automatically show estimated measurements instead
    const updatedWalls = walls.map(wall => ({
      ...wall,
      pixelLength: undefined,
      realLength: undefined
    }));
    setWalls(updatedWalls);
    
    toast({
      title: "Exited Scale Mode",
      description: "Returned to estimated measurements mode.",
    });
  };

  // Calibration helper functions
  const calculateWallLength = (wall: Wall): number => {
    const deltaX = wall.end.x - wall.start.x;
    const deltaY = wall.end.y - wall.start.y;
    const pixelLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Debug logging
    console.log(`Wall ${wall.id}: deltaX=${deltaX.toFixed(1)}, deltaY=${deltaY.toFixed(1)}, pixelLength=${pixelLength.toFixed(1)}`);
    
    return pixelLength;
  };

  const convertPixelsToRealLength = (pixels: number): number => {
    if (calibration.pixelsPerInch === 0) return 0;
    const inches = pixels / calibration.pixelsPerInch;
    
    switch (measurementUnit) {
      case "inches": return inches;
      case "feet": return inches / 12;
      case "cm": return inches * 2.54;
      case "m": return inches * 0.0254;
      default: return inches;
    }
  };

  const formatMeasurement = (value: number): string => {
    const unit = measurementUnit === "feet" ? "ft" : measurementUnit === "inches" ? "in" : measurementUnit;
    
    // Show more precision for smaller measurements, less for larger ones
    let precision = 1;
    if (measurementUnit === "inches" && value < 10) precision = 2;
    if (measurementUnit === "feet" && value < 1) precision = 2;
    if (measurementUnit === "cm" && value < 10) precision = 1;
    if (measurementUnit === "m" && value < 1) precision = 2;
    
    return `${value.toFixed(precision)}${unit}`;
  };

  const handleWallClick = (wall: Wall, event: MouseEvent<HTMLCanvasElement>) => {
    event.stopPropagation();
    if (isDrawing) return;
    
    const currentTime = Date.now();
    
    // Check if this is a continuation of taps on the same wall
    if (lastTappedWallId === wall.id && currentTime - lastTapTime < TAP_TIMEOUT) {
      const newTapCount = tapCount + 1;
      setTapCount(newTapCount);
      
      if (newTapCount >= 3) {
        // Triple tap achieved - select the wall for calibration
        setSelectedWallId(wall.id);
        setCalibrationInput("");
        setTapCount(0);
        setLastTappedWallId(null);
        
        toast({
          title: "Wall Selected",
          description: "Wall selected for calibration. Click 'Calibrate' to set scale.",
        });
      }
    } else {
      // First tap or new wall
      setTapCount(1);
      setLastTappedWallId(wall.id);
      
      toast({
        title: `Tap ${2} more times`,
        description: "3 taps = calibrate, hold 3s = resize",
      });
    }
    
    setLastTapTime(currentTime);
    
    // Auto-reset tap counter after timeout
    setTimeout(() => {
      if (Date.now() - currentTime >= TAP_TIMEOUT) {
        setTapCount(0);
        setLastTappedWallId(null);
      }
    }, TAP_TIMEOUT);
  };

  const handleCalibrate = () => {
    const selectedWall = walls.find(w => w.id === selectedWallId);
    if (!selectedWall || !calibrationInput) return;

    const realLength = parseFloat(calibrationInput);
    if (isNaN(realLength) || realLength <= 0) {
      toast({
        title: "Invalid Measurement",
        description: "Please enter a valid positive number.",
        variant: "destructive",
      });
      return;
    }

    const pixelLength = calculateWallLength(selectedWall);
    let realLengthInInches = realLength;
    
    // Convert to inches for internal calculation
    switch (measurementUnit) {
      case "feet": realLengthInInches = realLength * 12; break;
      case "cm": realLengthInInches = realLength / 2.54; break;
      case "m": realLengthInInches = realLength / 0.0254; break;
    }

    const pixelsPerInch = pixelLength / realLengthInInches;
    
    // Debug logging
    console.log(`Calibration: pixelLength=${pixelLength.toFixed(1)}, realLength=${realLength}, realLengthInInches=${realLengthInInches.toFixed(1)}, pixelsPerInch=${pixelsPerInch.toFixed(4)}`);
    console.log(`Selected wall coordinates: start(${selectedWall.start.x.toFixed(1)}, ${selectedWall.start.y.toFixed(1)}), end(${selectedWall.end.x.toFixed(1)}, ${selectedWall.end.y.toFixed(1)})`);
    
    setCalibration({
      pixelsPerInch,
      calibratedWallId: selectedWall.id
    });

    // Update all walls with calculated measurements
    const updatedWalls = walls.map(wall => ({
      ...wall,
      pixelLength: calculateWallLength(wall),
      realLength: calculateWallLength(wall) / pixelsPerInch
    }));
    
    setWalls(updatedWalls);
    setShowCalibrationDialog(false);
    setSelectedWallId(null);
    
    toast({
      title: "Calibration Complete",
      description: `Set scale: 1 pixel = ${(1/pixelsPerInch).toFixed(4)} inches`,
    });
  };

  const handleManualResize = () => {
    const targetWall = walls.find(w => w.id === wallToResize);
    if (!targetWall || !manualMeasurementInput) return;

    const newLength = parseFloat(manualMeasurementInput);
    if (isNaN(newLength) || newLength <= 0) {
      toast({
        title: "Invalid Length",
        description: "Please enter a valid positive number.",
        variant: "destructive",
      });
      return;
    }

    // Convert the new length to pixels based on current calibration or estimation
    let newLengthInPixels;
    if (calibration.pixelsPerInch > 0) {
      // Use calibrated scale
      let lengthInInches = newLength;
      switch (measurementUnit) {
        case "feet": lengthInInches = newLength * 12; break;
        case "cm": lengthInInches = newLength / 2.54; break;
        case "m": lengthInInches = newLength / 0.0254; break;
      }
      newLengthInPixels = lengthInInches * calibration.pixelsPerInch;
    } else {
      // Use estimation scale (reverse of our estimation formula)
      if (image) {
        const scaleFactor = Math.min(image.naturalWidth, image.naturalHeight) > 1000 ? 0.05 : 0.1;
        newLengthInPixels = newLength / scaleFactor;
      } else {
        newLengthInPixels = newLength * 50;
      }
    }

    // Calculate current wall direction and resize while maintaining direction
    const currentLength = calculateWallLength(targetWall);
    const direction = {
      x: (targetWall.end.x - targetWall.start.x) / currentLength,
      y: (targetWall.end.y - targetWall.start.y) / currentLength
    };

    // Create new end point
    const newEndPoint = {
      x: targetWall.start.x + direction.x * newLengthInPixels,
      y: targetWall.start.y + direction.y * newLengthInPixels
    };

    // Update the wall
    const updatedWalls = walls.map(wall => 
      wall.id === wallToResize 
        ? { ...wall, end: newEndPoint }
        : wall
    );
    
    setWalls(updatedWalls);
    setShowManualMeasurementDialog(false);
    setWallToResize(null);
    
    toast({
      title: "Wall Resized",
      description: `Wall resized to ${newLength}${measurementUnit === "feet" ? "ft" : measurementUnit === "inches" ? "in" : measurementUnit}`,
    });
  };

  const rotateWall = (wallId: string) => {
    const targetWall = walls.find(w => w.id === wallId);
    if (!targetWall) return;

    const currentLength = calculateWallLength(targetWall);
    const centerX = (targetWall.start.x + targetWall.end.x) / 2;
    const centerY = (targetWall.start.y + targetWall.end.y) / 2;

    // Determine current orientation
    const deltaX = Math.abs(targetWall.end.x - targetWall.start.x);
    const deltaY = Math.abs(targetWall.end.y - targetWall.start.y);
    const isHorizontal = deltaX > deltaY;

    // Rotate 90 degrees
    let newStart, newEnd;
    if (isHorizontal) {
      // Make it vertical
      newStart = { x: centerX, y: centerY - currentLength / 2 };
      newEnd = { x: centerX, y: centerY + currentLength / 2 };
    } else {
      // Make it horizontal
      newStart = { x: centerX - currentLength / 2, y: centerY };
      newEnd = { x: centerX + currentLength / 2, y: centerY };
    }

    const updatedWalls = walls.map(wall => 
      wall.id === wallId 
        ? { ...wall, start: newStart, end: newEnd }
        : wall
    );
    
    setWalls(updatedWalls);
    
    toast({
      title: "Wall Rotated",
      description: `Wall rotated to ${isHorizontal ? 'vertical' : 'horizontal'} orientation`,
    });
  };

  const exportBlueprintData = () => {
    const blueprintData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      metadata: {
        title: "Floor Plan Blueprint",
        units: measurementUnit,
        calibrated: calibration.pixelsPerInch > 0,
        pixelsPerInch: calibration.pixelsPerInch,
        canvasDimensions: {
          width: INITIAL_CANVAS_WIDTH,
          height: INITIAL_CANVAS_HEIGHT
        }
      },
      walls: walls.map(wall => ({
        id: wall.id,
        start: wall.start,
        end: wall.end,
        pixelLength: calculateWallLength(wall),
        realLength: calibration.pixelsPerInch > 0 
          ? calculateWallLength(wall) / calibration.pixelsPerInch 
          : null,
        measurement: calibration.pixelsPerInch > 0 
          ? formatMeasurement(convertPixelsToRealLength(calculateWallLength(wall)))
          : `~${(calculateWallLength(wall) * (image ? (Math.min(image.naturalWidth, image.naturalHeight) > 1000 ? 0.05 : 0.1) : 1/50)).toFixed(1)}ft`
      })),
      roomLabels: roomLabels,
      calibration: {
        isCalibrated: calibration.pixelsPerInch > 0,
        pixelsPerInch: calibration.pixelsPerInch,
        calibratedWallId: calibration.calibratedWallId,
        referenceWall: calibration.calibratedWallId 
          ? walls.find(w => w.id === calibration.calibratedWallId)
          : null
      }
    };

    // Create and download the JSON file
    const dataStr = JSON.stringify(blueprintData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `blueprint-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Blueprint Exported",
      description: "Blueprint data saved as JSON file with all measurements and labels.",
    });
  };

  const handleLabelPlacement = (coords: Point) => {
    if (!labelingMode) return;
    
    setLabelPosition(coords);
    setLabelInput("");
    setShowLabelDialog(true);
  };

  const addRoomLabel = () => {
    if (!labelPosition || !labelInput.trim()) return;

    const newLabel: RoomLabel = {
      id: `label-${roomLabels.length}`,
      x: labelPosition.x,
      y: labelPosition.y,
      text: labelInput.trim(),
      fontSize: 16,
      color: "#00FFFF" // Cyan for futuristic look
    };

    setRoomLabels([...roomLabels, newLabel]);
    setShowLabelDialog(false);
    setLabelPosition(null);
    setLabelInput("");

    toast({
      title: "Room Labeled",
      description: `Added "${newLabel.text}" label to blueprint.`,
    });
  };

  const undoLastLabel = () => {
    if (roomLabels.length > 0) {
      const lastLabel = roomLabels[roomLabels.length - 1];
      setRoomLabels(prev => prev.slice(0, -1));
      
      toast({
        title: "Label Removed",
        description: `Removed label "${lastLabel.text}".`,
      });
    } else {
      toast({
        title: "No Labels to Remove",
        description: "There are no room labels to undo.",
        variant: "destructive",
      });
    }
  };

  const getDrawDimensions = (img: HTMLImageElement, canvas: HTMLCanvasElement) => {
    const canvasAspectRatio = canvas.width / canvas.height;
    const imageAspectRatio = img.naturalWidth / img.naturalHeight;
    let drawWidth, drawHeight, x = 0, y = 0;

    // Always preserve aspect ratio - fit image within canvas bounds
    if (imageAspectRatio > canvasAspectRatio) {
        // Image is wider than canvas - fit to width
        drawWidth = canvas.width;
        drawHeight = canvas.width / imageAspectRatio;
        y = (canvas.height - drawHeight) / 2;
    } else {
        // Image is taller than canvas - fit to height
        drawHeight = canvas.height;
        drawWidth = canvas.height * imageAspectRatio;
        x = (canvas.width - drawWidth) / 2;
    }
    
    return { 
      drawWidth, 
      drawHeight, 
      x, 
      y,
      scaleX: drawWidth / img.naturalWidth,
      scaleY: drawHeight / img.naturalHeight
    };
  };

  const drawOnCanvas = (
    ctx: CanvasRenderingContext2D,
    isBlueprint: boolean
  ) => {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (isBlueprint) {
        ctx.fillStyle = "#222F3D";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (image) {
        const { drawWidth, drawHeight, x, y } = getDrawDimensions(image, canvas);
        if (!isBlueprint) {
            ctx.drawImage(image, x, y, drawWidth, drawHeight);
        }
    } else if (!isBlueprint) {
      ctx.fillStyle = "hsl(var(--muted))";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "hsl(var(--muted-foreground))";
      ctx.textAlign = "center";
      ctx.font = "16px Inter";
      ctx.fillText("Upload a floor plan to begin", canvas.width / 2, canvas.height / 2);
    }
    
    if ((snapToGrid && image && !isBlueprint) || isBlueprint) {
        ctx.strokeStyle = isBlueprint ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.2)";
        ctx.lineWidth = 0.5;
        for (let gx = 0; gx < canvas.width; gx += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, canvas.height);
            ctx.stroke();
        }
        for (let gy = 0; gy < canvas.height; gy += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(canvas.width, gy);
            ctx.stroke();
        }
    }
    
    ctx.strokeStyle = isBlueprint ? "#FFFFFF" : "#FF0000";
    ctx.lineWidth = isBlueprint ? 3 : 4;
    ctx.lineCap = "round";
    ctx.shadowColor = isBlueprint ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 0, 0, 0.7)';
    ctx.shadowBlur = isBlueprint ? 8 : 10;

    walls.forEach(wall => {
      // Draw wall line
      const isSelected = wall.id === selectedWallId;
      const isCalibrated = wall.id === calibration.calibratedWallId;
      const isBeingTapped = wall.id === lastTappedWallId && tapCount > 0;
      const isBeingDragged = wall.id === draggedWallId;
      
      ctx.strokeStyle = isBlueprint ? "#FFFFFF" : 
                       isBeingDragged ? "#8A2BE2" : // Purple for dragged wall
                       isSelected ? "#00FF00" : 
                       isCalibrated ? "#FFD700" : 
                       isBeingTapped ? "#FFA500" : 
                       moveWallsMode ? "#FF69B4" : "#FF0000"; // Pink tint in move mode
      ctx.lineWidth = isBlueprint ? 3 : (isSelected || isCalibrated || isBeingDragged ? 5 : isBeingTapped ? 4.5 : 4);
      
      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.stroke();
      
              // Draw tap counter if wall is being tapped
        if (!isBlueprint && isBeingTapped) {
          const midX = (wall.start.x + wall.end.x) / 2;
          const midY = (wall.start.y + wall.end.y) / 2;
          const tapText = `${tapCount}/3`;
          
          ctx.save();
          ctx.font = "bold 14px Inter";
          const tapTextWidth = ctx.measureText(tapText).width;
          const padding = 6;
          
          // Draw tap counter background
          ctx.fillStyle = "rgba(255, 165, 0, 0.9)";
          ctx.fillRect(midX - tapTextWidth/2 - padding, midY - 25, tapTextWidth + padding * 2, 20);
          
          // Draw tap counter text
          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(tapText, midX, midY - 15);
          ctx.restore();
        }
        
        // Draw hold progress indicator
        if (!isBlueprint && isHolding && wall.id === holdWallId) {
          const midX = (wall.start.x + wall.end.x) / 2;
          const midY = (wall.start.y + wall.end.y) / 2;
          const radius = 25;
          
          ctx.save();
          
          // Draw background circle
          ctx.beginPath();
          ctx.arc(midX, midY, radius, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(138, 43, 226, 0.2)";
          ctx.fill();
          ctx.strokeStyle = "rgba(138, 43, 226, 0.6)";
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw progress arc
          ctx.beginPath();
          ctx.arc(midX, midY, radius - 3, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI * holdProgress));
          ctx.strokeStyle = "#8A2BE2";
          ctx.lineWidth = 4;
          ctx.stroke();
          
          // Draw hold text
          ctx.font = "bold 12px Inter";
          ctx.fillStyle = "#8A2BE2";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("HOLD", midX, midY - 3);
          
          // Draw progress percentage
          ctx.font = "10px Inter";
          ctx.fillText(`${Math.round(holdProgress * 100)}%`, midX, midY + 8);
          
          ctx.restore();
        }
        
        // Always show measurements on walls
        const midX = (wall.start.x + wall.end.x) / 2;
        const midY = (wall.start.y + wall.end.y) / 2;
        const pixelLength = calculateWallLength(wall);
        
        let measurement: string;
        if (calibration.pixelsPerInch > 0) {
          // Show real-world measurement if calibrated
          const realLength = convertPixelsToRealLength(pixelLength);
          measurement = formatMeasurement(realLength);
          
          // Debug logging for measurements
          console.log(`Wall ${wall.id} measurement: pixelLength=${pixelLength.toFixed(1)}, realLength=${realLength.toFixed(2)}, formatted=${measurement}`);
        } else {
          // More accurate feet estimation based on screen DPI and typical floor plan scales
          // Most floor plans are printed at 1/4" = 1' scale, and typical screen DPI is 96
          // For uploaded images, we estimate based on common architectural scales
          const screenDPI = window.devicePixelRatio * 96; // Get actual screen DPI
          let estimatedFeet;
          
          if (image) {
            // For uploaded floor plans, assume they're scanned at reasonable resolution
            // Common architectural scale: 1/4" = 1' means 4 pixels per foot at 96 DPI
            // But users often upload higher resolution images, so we scale accordingly
            const scaleFactor = Math.min(image.naturalWidth, image.naturalHeight) > 1000 ? 0.05 : 0.1;
            estimatedFeet = pixelLength * scaleFactor;
          } else {
            // Fallback for drawn-from-scratch plans
            estimatedFeet = pixelLength / 50; // More conservative estimate
          }
          
          measurement = `~${estimatedFeet.toFixed(1)}ft`;
        }
        
        // Draw measurement background
        ctx.save();
        ctx.font = "12px Inter";
        const textWidth = ctx.measureText(measurement).width;
        const padding = 4;
        
        ctx.fillStyle = isBlueprint ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.9)";
        ctx.fillRect(midX - textWidth/2 - padding, midY - 8, textWidth + padding * 2, 16);
        
        // Draw measurement text
        ctx.fillStyle = isBlueprint ? "#FFFFFF" : "#000000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(measurement, midX, midY);
        ctx.restore();
    });

    if (!isBlueprint && isDrawing && startPoint && currentEndPoint) {
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currentEndPoint.x, currentEndPoint.y);
      ctx.stroke();
    }
    
    if (!isBlueprint && snapPoint) {
      ctx.beginPath();
      ctx.arc(snapPoint.x, snapPoint.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw endpoint indicators to show where you can start new walls
    if (!isBlueprint && !isDrawing) {
      walls.forEach(wall => {
        const endpoints = [wall.start, wall.end];
        endpoints.forEach(endpoint => {
          ctx.beginPath();
          ctx.arc(endpoint.x, endpoint.y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(0, 255, 0, 0.6)";
          ctx.fill();
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      });
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Draw futuristic room labels (only on blueprint)
    if (isBlueprint) {
      roomLabels.forEach(label => {
        ctx.save();
        
        // Futuristic label styling
        ctx.font = `bold ${label.fontSize}px 'Space Grotesk', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Measure text for background
        const textWidth = ctx.measureText(label.text).width;
        const textHeight = label.fontSize;
        const padding = 8;
        
        // Draw futuristic background with multiple layers
        const bgWidth = textWidth + padding * 2;
        const bgHeight = textHeight + padding;
        
        // Outer glow
        ctx.shadowColor = label.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = `${label.color}20`; // 20% opacity
        ctx.fillRect(label.x - bgWidth/2 - 5, label.y - bgHeight/2 - 5, bgWidth + 10, bgHeight + 10);
        
        // Main background with gradient
        const gradient = ctx.createLinearGradient(
          label.x - bgWidth/2, label.y - bgHeight/2,
          label.x + bgWidth/2, label.y + bgHeight/2
        );
        gradient.addColorStop(0, `${label.color}40`);
        gradient.addColorStop(0.5, `${label.color}60`);
        gradient.addColorStop(1, `${label.color}40`);
        
        ctx.shadowBlur = 8;
        ctx.fillStyle = gradient;
        ctx.fillRect(label.x - bgWidth/2, label.y - bgHeight/2, bgWidth, bgHeight);
        
        // Border with animated effect
        ctx.strokeStyle = label.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 5;
        ctx.strokeRect(label.x - bgWidth/2, label.y - bgHeight/2, bgWidth, bgHeight);
        
        // Corner accents for futuristic look
        const cornerSize = 8;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 8;
        
        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(label.x - bgWidth/2, label.y - bgHeight/2 + cornerSize);
        ctx.lineTo(label.x - bgWidth/2, label.y - bgHeight/2);
        ctx.lineTo(label.x - bgWidth/2 + cornerSize, label.y - bgHeight/2);
        ctx.stroke();
        
        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(label.x + bgWidth/2 - cornerSize, label.y - bgHeight/2);
        ctx.lineTo(label.x + bgWidth/2, label.y - bgHeight/2);
        ctx.lineTo(label.x + bgWidth/2, label.y - bgHeight/2 + cornerSize);
        ctx.stroke();
        
        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(label.x - bgWidth/2, label.y + bgHeight/2 - cornerSize);
        ctx.lineTo(label.x - bgWidth/2, label.y + bgHeight/2);
        ctx.lineTo(label.x - bgWidth/2 + cornerSize, label.y + bgHeight/2);
        ctx.stroke();
        
        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(label.x + bgWidth/2 - cornerSize, label.y + bgHeight/2);
        ctx.lineTo(label.x + bgWidth/2, label.y + bgHeight/2);
        ctx.lineTo(label.x + bgWidth/2, label.y + bgHeight/2 - cornerSize);
        ctx.stroke();
        
        // Draw text with glow effect
        ctx.shadowColor = label.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(label.text, label.x, label.y);
        
        // Additional text glow
        ctx.shadowBlur = 5;
        ctx.fillStyle = label.color;
        ctx.fillText(label.text, label.x, label.y);
        
        ctx.restore();
      });
    }
  };

  useEffect(() => {
    const editorCtx = editorCanvasRef.current?.getContext("2d");
    if (editorCtx) {
      drawOnCanvas(editorCtx, false);
    }
  }, [image, walls, isDrawing, startPoint, currentEndPoint, snapToGrid, snapPoint, selectedWallId, calibration, measurementUnit, tapCount, lastTappedWallId, moveWallsMode, draggedWallId, isHolding, holdWallId, holdProgress]);

  useEffect(() => {
    const blueprintCtx = blueprintCanvasRef.current?.getContext("2d");
    if (blueprintCtx) {
        drawOnCanvas(blueprintCtx, true);
    }
  }, [walls, image, calibration, measurementUnit, roomLabels]);

  // Handle hold timer for manual resize
  useEffect(() => {
    if (!isHolding || !holdStartTime || !holdWallId) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - holdStartTime;
      const progress = Math.min(elapsed / HOLD_DURATION, 1);
      
      setHoldProgress(progress);
      
      if (progress >= 1) {
        // Hold completed - trigger manual resize
        setWallToResize(holdWallId);
        setManualMeasurementInput("");
        setShowManualMeasurementDialog(true);
        
        // Reset hold state
        setIsHolding(false);
        setHoldStartTime(0);
        setHoldWallId(null);
        setHoldProgress(0);
        
        toast({
          title: "Manual Resize Mode",
          description: "Enter the exact length to resize this wall.",
        });
        
        clearInterval(interval);
      }
    }, 50); // Update every 50ms for smooth progress

    return () => clearInterval(interval);
  }, [isHolding, holdStartTime, holdWallId, toast]);


  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      <div className="pt-0 px-0 pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h2 className="font-headline premium-title text-primary neon-text">Floor Plan Editor</h2>
                <p className="premium-text text-muted-foreground">Upload your plan and draw walls with <span className="text-secondary font-medium">precision calibration</span>.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center space-x-2">
                    <Grid className="h-3 w-3" />
                    <Label htmlFor="snap-to-grid" className="premium-label">Grid</Label>
                    <Switch
                        id="snap-to-grid"
                        checked={snapToGrid}
                        onCheckedChange={setSnapToGrid}
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Label htmlFor="unit-select" className="premium-label">Unit:</Label>
                    <select 
                        id="unit-select"
                        value={measurementUnit} 
                        onChange={(e) => setMeasurementUnit(e.target.value as any)}
                        className="px-2 py-1 border border-primary/30 rounded premium-text bg-background/80 backdrop-blur"
                    >
                        <option value="feet">Feet</option>
                        <option value="inches">Inches</option>
                        <option value="cm">CM</option>
                        <option value="m">Meters</option>
                    </select>
                </div>
                {selectedWallId && (
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowCalibrationDialog(true)}
                        className="h-7 px-2 premium-text bg-green-500/20 border-green-400 text-green-300 hover:bg-green-500/30 hover:shadow-[0_0_12px_rgba(34,197,94,0.3)] transition-all duration-200"
                    >
                        <Ruler className="mr-1 h-3 w-3" /> Calibrate
                    </Button>
                )}
                {calibration.pixelsPerInch > 0 && (
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={exitScaleMode}
                        className="h-7 px-2 premium-text bg-red-500/20 border-red-400 text-red-300 hover:bg-red-500/30 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)] transition-all duration-200"
                    >
                        Exit Scale
                    </Button>
                )}
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setMoveWallsMode(!moveWallsMode)}
                    className={`h-7 px-2 premium-text transition-all duration-200 ${
                        moveWallsMode 
                            ? 'bg-purple-500/20 border-purple-400 text-purple-300 hover:bg-purple-500/30 hover:shadow-[0_0_12px_rgba(147,51,234,0.3)]'
                            : 'border-muted-foreground/30 hover:border-purple-400 hover:text-purple-300'
                    }`}
                >
                    {moveWallsMode ? 'Exit Move' : 'Move Walls'}
                </Button>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLabelingMode(!labelingMode)}
                    className={`h-7 px-2 premium-text transition-all duration-200 ${
                        labelingMode 
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                            : 'border-muted-foreground/30 hover:border-cyan-400 hover:text-cyan-300'
                    }`}
                >
                    {labelingMode ? 'Exit Label' : 'Label Rooms'}
                </Button>
                {roomLabels.length > 0 && (
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={undoLastLabel}
                        className="h-7 px-2 premium-text bg-orange-500/20 border-orange-400 text-orange-300 hover:bg-orange-500/30 hover:shadow-[0_0_12px_rgba(251,146,60,0.3)] transition-all duration-200"
                    >
                        Undo Label
                    </Button>
                )}
                {selectedWallId && (
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => rotateWall(selectedWallId)}
                        className="h-7 px-2 premium-text bg-blue-500/20 border-blue-400 text-blue-300 hover:bg-blue-500/30 hover:shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all duration-200"
                    >
                        Rotate
                    </Button>
                )}
                <Button variant="outline" size="sm" onClick={undoLastWall} disabled={walls.length === 0 || isProcessing} className="h-7 px-2 premium-text">
                    <Undo className="mr-1 h-3 w-3" /> Undo
                </Button>
                <Button variant="destructive" size="sm" onClick={clearAllWalls} disabled={walls.length === 0 || isProcessing} className="h-7 px-2 premium-text">
                    <Trash2 className="mr-1 h-3 w-3" /> Clear
                </Button>
                <Button onClick={handleAutoDetect} disabled={!image || isProcessing} size="sm" className="h-7 px-2 neon-button text-background">
                    {isProcessing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />}
                    Auto-detect
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} size="sm" className="h-7 px-2 neon-button text-background">
                    <UploadCloud className="mr-1 h-3 w-3" /> Upload
                </Button>
                {image && walls.length > 0 && (
                    <Button 
                        onClick={() => {
                            // Store comprehensive blueprint data in localStorage for the enhancement page
                            const blueprintData = {
                                version: "1.0",
                                timestamp: new Date().toISOString(),
                                metadata: {
                                    title: "Floor Plan Blueprint",
                                    units: measurementUnit,
                                    calibrated: calibration.pixelsPerInch > 0,
                                    pixelsPerInch: calibration.pixelsPerInch,
                                    canvasDimensions: {
                                        width: INITIAL_CANVAS_WIDTH,
                                        height: INITIAL_CANVAS_HEIGHT
                                    },
                                    createdAt: new Date().toISOString(),
                                    wallCount: walls.length,
                                    labelCount: roomLabels.length,
                                    isCalibrated: calibration.pixelsPerInch > 0
                                },
                                walls: walls.map(wall => ({
                                    id: wall.id,
                                    start: wall.start,
                                    end: wall.end,
                                    pixelLength: calculateWallLength(wall),
                                    realLength: calibration.pixelsPerInch > 0 
                                        ? calculateWallLength(wall) / calibration.pixelsPerInch 
                                        : null,
                                    measurement: calibration.pixelsPerInch > 0 
                                        ? formatMeasurement(convertPixelsToRealLength(calculateWallLength(wall)))
                                        : `~${(calculateWallLength(wall) * (image ? (Math.min(image.naturalWidth, image.naturalHeight) > 1000 ? 0.05 : 0.1) : 1/50)).toFixed(1)}ft`,
                                    estimatedMeasurement: `~${(calculateWallLength(wall) * (image ? (Math.min(image.naturalWidth, image.naturalHeight) > 1000 ? 0.05 : 0.1) : 1/50)).toFixed(1)}ft`
                                })),
                                roomLabels: roomLabels,
                                calibration: {
                                    isCalibrated: calibration.pixelsPerInch > 0,
                                    pixelsPerInch: calibration.pixelsPerInch,
                                    calibratedWallId: calibration.calibratedWallId,
                                    referenceWall: calibration.calibratedWallId 
                                        ? walls.find(w => w.id === calibration.calibratedWallId)
                                        : null,
                                    measurementUnit: measurementUnit
                                },
                                imageData: image.src
                            };
                            localStorage.setItem('blueprintData', JSON.stringify(blueprintData));
                            window.location.href = '/enhancement';
                        }}
                        size="sm" 
                        className="h-7 px-2 premium-text bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400 text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30 hover:shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all duration-200"
                    >
                        Enhancement
                    </Button>
                )}
                <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                />
            </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-h-0 p-0">
        {!image && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Start your design!</AlertTitle>
            <AlertDescription>
              Click the 'Upload Plan' button to load your floor plan image into the editor.
            </AlertDescription>
          </Alert>
        )}
        
        {image && walls.length > 0 && calibration.pixelsPerInch === 0 && (
          <Alert className="mb-3 border-primary/50 bg-primary/10 backdrop-blur">
            <Ruler className="h-3 w-3 text-primary" />
            <AlertTitle className="text-primary premium-label">Calibrate for Precision</AlertTitle>
            <AlertDescription className="premium-text text-foreground/80">
              Showing estimated measurements. Triple-tap any wall (orange highlight), 
              then calibrate for exact dimensions. <span className="text-green-400 font-medium">Green dots</span> = connection points.
            </AlertDescription>
          </Alert>
        )}
        
        {calibration.pixelsPerInch > 0 && (
          <Alert className="mb-3 border-green-400/50 bg-green-400/10 backdrop-blur">
            <Ruler className="h-3 w-3 text-green-400" />
            <AlertTitle className="text-green-400 premium-label">Scale Active</AlertTitle>
            <AlertDescription className="premium-text text-foreground/80">
              Precise measurements displayed. <span className="text-yellow-400 font-medium">Golden wall</span> = reference measurement.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex-1 grid md:grid-cols-3 gap-8 min-h-0">
          <div className="flex flex-col overflow-auto md:col-span-2">
            <Label className="font-headline premium-label mb-1.5 block text-primary">Editor</Label>
            <div className="relative flex-1 w-full rounded-lg neon-border bg-muted/50 backdrop-blur">
                <canvas
                    ref={editorCanvasRef}
                    width={INITIAL_CANVAS_WIDTH}
                    height={INITIAL_CANVAS_HEIGHT}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    className={`absolute inset-0 w-full h-full rounded-lg ${image ? 'cursor-crosshair' : 'cursor-default'}`}
                />
            </div>
          </div>
          <div className="flex flex-col overflow-auto">
            <Label className="font-headline premium-label mb-1.5 block text-secondary">Blueprint</Label>
             <div className="relative w-full rounded-lg neon-border bg-background/80 backdrop-blur" style={{ aspectRatio: `${INITIAL_CANVAS_WIDTH}/${INITIAL_CANVAS_HEIGHT}` }}>
                <canvas
                    ref={blueprintCanvasRef}
                    width={INITIAL_CANVAS_WIDTH}
                    height={INITIAL_CANVAS_HEIGHT}
                    className="absolute inset-0 w-full h-full rounded-lg"
                />
            </div>
          </div>
        </div>
      </div>

      {/* Calibration Dialog */}
      <Dialog open={showCalibrationDialog} onOpenChange={setShowCalibrationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calibrate Wall Measurement</DialogTitle>
            <DialogDescription>
              Enter the real-world length of the selected wall to set the scale for all measurements.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="measurement" className="text-right">
                Length
              </Label>
              <Input
                id="measurement"
                type="number"
                step="0.1"
                placeholder="Enter length"
                value={calibrationInput}
                onChange={(e) => setCalibrationInput(e.target.value)}
                className="col-span-2"
              />
              <span className="text-sm text-muted-foreground">
                {measurementUnit === "feet" ? "ft" : measurementUnit === "inches" ? "in" : measurementUnit}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalibrationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCalibrate} disabled={!calibrationInput}>
              Set Scale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Measurement Dialog */}
      <Dialog open={showManualMeasurementDialog} onOpenChange={setShowManualMeasurementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resize Wall</DialogTitle>
            <DialogDescription>
              Enter the exact length you want this wall to be. The wall will resize automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manual-measurement" className="text-right">
                New Length
              </Label>
              <Input
                id="manual-measurement"
                type="number"
                step="0.1"
                placeholder="Enter length"
                value={manualMeasurementInput}
                onChange={(e) => setManualMeasurementInput(e.target.value)}
                className="col-span-2"
              />
              <span className="text-sm text-muted-foreground">
                {measurementUnit === "feet" ? "ft" : measurementUnit === "inches" ? "in" : measurementUnit}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualMeasurementDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleManualResize} disabled={!manualMeasurementInput}>
              Resize Wall
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Labeling Dialog */}
      <Dialog open={showLabelDialog} onOpenChange={setShowLabelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Room Label</DialogTitle>
            <DialogDescription>
              Enter a name for this room. It will appear on the blueprint with futuristic styling.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room-name" className="text-right">
                Room Name
              </Label>
              <Input
                id="room-name"
                type="text"
                placeholder="e.g. Living Room"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLabelDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addRoomLabel} disabled={!labelInput.trim()}>
              Add Label
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
