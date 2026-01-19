import { render } from "preact";
import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import type { AppState, Point, GridCorners, ColorMethod, SelectionMode } from "./types";
import { DEFAULT_STATE, COLOR_METHODS, saveState, loadState } from "./types";
import { generatePixelatedImage, getCornersCenter, rotatePoint, applyPerspectiveSkew, inferDimensions, inferDimensionsSuperSmart, type InferDimensionsProgress, type SuperSmartProgress } from "./imageProcessing";

type CornerKey = keyof GridCorners;

// Transform a corner point by rotating and scaling around a center
function transformCorner(point: Point, center: Point, angleDeg: number, scale: number): Point {
  const rotated = rotatePoint(point, center, angleDeg);
  return {
    x: center.x + (rotated.x - center.x) * scale,
    y: center.y + (rotated.y - center.y) * scale
  };
}

// Interpolate a point within the quadrilateral defined by four corners
// u and v are normalized coordinates (0-1) within the quad
function interpolateQuadPoint(corners: GridCorners, u: number, v: number): Point {
  const top = {
    x: corners.topLeft.x + (corners.topRight.x - corners.topLeft.x) * u,
    y: corners.topLeft.y + (corners.topRight.y - corners.topLeft.y) * u
  };
  const bottom = {
    x: corners.bottomLeft.x + (corners.bottomRight.x - corners.bottomLeft.x) * u,
    y: corners.bottomLeft.y + (corners.bottomRight.y - corners.bottomLeft.y) * u
  };
  return {
    x: top.x + (bottom.x - top.x) * v,
    y: top.y + (bottom.y - top.y) * v
  };
}

// Generate pixel grid lines as SVG path data
function generatePixelGridLines(corners: GridCorners, gridWidth: number, gridHeight: number): string {
  const paths: string[] = [];
  
  // Vertical lines (from column boundaries)
  for (let col = 1; col < gridWidth; col++) {
    const u = col / gridWidth;
    const top = interpolateQuadPoint(corners, u, 0);
    const bottom = interpolateQuadPoint(corners, u, 1);
    paths.push(`M ${top.x} ${top.y} L ${bottom.x} ${bottom.y}`);
  }
  
  // Horizontal lines (from row boundaries)
  for (let row = 1; row < gridHeight; row++) {
    const v = row / gridHeight;
    const left = interpolateQuadPoint(corners, 0, v);
    const right = interpolateQuadPoint(corners, 1, v);
    paths.push(`M ${left.x} ${left.y} L ${right.x} ${right.y}`);
  }
  
  return paths.join(" ");
}

// Generate pixel grid circles at cell centers for center-based methods
function generatePixelGridCircles(corners: GridCorners, gridWidth: number, gridHeight: number): Array<{ cx: number; cy: number; r: number }> {
  const circles: Array<{ cx: number; cy: number; r: number }> = [];
  
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      // Center of the cell
      const u = (col + 0.5) / gridWidth;
      const v = (row + 0.5) / gridHeight;
      const center = interpolateQuadPoint(corners, u, v);
      
      // Get corners of this cell to estimate radius
      const topLeft = interpolateQuadPoint(corners, col / gridWidth, row / gridHeight);
      const topRight = interpolateQuadPoint(corners, (col + 1) / gridWidth, row / gridHeight);
      const bottomLeft = interpolateQuadPoint(corners, col / gridWidth, (row + 1) / gridHeight);
      
      // Use the smaller dimension to determine radius
      const width = Math.hypot(topRight.x - topLeft.x, topRight.y - topLeft.y);
      const height = Math.hypot(bottomLeft.x - topLeft.x, bottomLeft.y - topLeft.y);
      const minDim = Math.min(width, height);
      
      // Use 20% of cell size as radius to represent the center sampling area
      const radiusFactor = 0.2;
      const r = minDim * radiusFactor * 0.5;
      
      circles.push({ cx: center.x, cy: center.y, r: Math.max(r, 1) });
    }
  }
  
  return circles;
}

function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCorner, setDragCorner] = useState<CornerKey | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Point | null>(null);
  const [dragStartCorners, setDragStartCorners] = useState<GridCorners | null>(null);
  const [dragStartRotation, setDragStartRotation] = useState<number>(0);
  const [imageOffset, setImageOffset] = useState<Point>({ x: 0, y: 0 });
  const [isInferring, setIsInferring] = useState(false);
  const [inferProgress, setInferProgress] = useState<InferDimensionsProgress | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (state.sourceImage) {
      const img = new Image();
      img.onload = () => setImageElement(img);
      img.src = state.sourceImage;
    } else {
      setImageElement(null);
    }
  }, [state.sourceImage]);

  useEffect(() => {
    if (!imageElement || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = state.outputWidth;
    canvas.height = state.outputHeight;

    const scaledCorners = scaleCorners(state.gridCorners, imageElement);
    const skewedCorners = applyPerspectiveSkew(
      scaledCorners,
      state.perspectiveSkewX,
      state.perspectiveSkewY,
      state.isometric
    );
    const pixelData = generatePixelatedImage(
      imageElement,
      skewedCorners,
      state.outputWidth,
      state.outputHeight,
      state.colorMethod,
      {
        enableColorLimit: state.enableColorLimit,
        maxColors: state.maxColors,
        enableBackgroundDetection: state.enableBackgroundDetection
      }
    );

    ctx.putImageData(pixelData, 0, 0);
  }, [imageElement, state.gridCorners, state.outputWidth, state.outputHeight, state.colorMethod, state.perspectiveSkewX, state.perspectiveSkewY, state.isometric, state.enableColorLimit, state.maxColors, state.enableBackgroundDetection]);

  // Calculate image offset within container (for proper alignment)
  const updateImageOffset = useCallback(() => {
    if (!sourceImageRef.current || !containerRef.current) return;
    
    const imgEl = sourceImageRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const imgRect = imgEl.getBoundingClientRect();
    
    setImageOffset({
      x: imgRect.left - containerRect.left,
      y: imgRect.top - containerRect.top
    });
  }, []);

  // Update offset when image loads or window resizes
  useEffect(() => {
    if (imageElement) {
      // Small delay to allow layout to settle
      const timer = setTimeout(updateImageOffset, 50);
      window.addEventListener("resize", updateImageOffset);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", updateImageOffset);
      };
    }
    return undefined;
  }, [imageElement, updateImageOffset]);

  const scaleCorners = useCallback((corners: GridCorners, img: HTMLImageElement): GridCorners => {
    const container = containerRef.current;
    const imgEl = sourceImageRef.current;
    if (!container || !img) return corners;

    // Get the actual displayed dimensions of the image
    let actualWidth: number;
    let actualHeight: number;
    
    if (imgEl) {
      actualWidth = imgEl.clientWidth;
      actualHeight = imgEl.clientHeight;
    } else {
      const rect = container.getBoundingClientRect();
      const displayedWidth = Math.min(rect.width, img.naturalWidth);
      const displayedHeight = Math.min(rect.height, img.naturalHeight);
      
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      actualWidth = displayedWidth;
      actualHeight = displayedWidth / aspectRatio;
      
      if (actualHeight > displayedHeight) {
        actualHeight = displayedHeight;
        actualWidth = displayedHeight * aspectRatio;
      }
    }

    const scaleX = img.naturalWidth / actualWidth;
    const scaleY = img.naturalHeight / actualHeight;

    // Adjust corners for image offset within container
    return {
      topLeft: { x: (corners.topLeft.x - imageOffset.x) * scaleX, y: (corners.topLeft.y - imageOffset.y) * scaleY },
      topRight: { x: (corners.topRight.x - imageOffset.x) * scaleX, y: (corners.topRight.y - imageOffset.y) * scaleY },
      bottomLeft: { x: (corners.bottomLeft.x - imageOffset.x) * scaleX, y: (corners.bottomLeft.y - imageOffset.y) * scaleY },
      bottomRight: { x: (corners.bottomRight.x - imageOffset.x) * scaleX, y: (corners.bottomRight.y - imageOffset.y) * scaleY }
    };
  }, [imageOffset]);

  const handleImageLoad = useCallback((dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const container = containerRef.current;
      
      if (container) {
        const rect = container.getBoundingClientRect();
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        
        // Calculate image dimensions (same logic as CSS max-width/max-height 100%)
        let displayWidth = rect.width;
        let displayHeight = rect.width / aspectRatio;
        
        if (displayHeight > rect.height) {
          displayHeight = rect.height;
          displayWidth = rect.height * aspectRatio;
        }
        
        // Calculate offset (image centered in container)
        const offsetX = (rect.width - displayWidth) / 2;
        const offsetY = (rect.height - displayHeight) / 2;
        
        // Set grid corners with a small padding from the image edges
        const padding = 20;
        setState((prev) => ({
          ...prev,
          sourceImage: dataUrl,
          gridCorners: {
            topLeft: { x: offsetX + padding, y: offsetY + padding },
            topRight: { x: offsetX + displayWidth - padding, y: offsetY + padding },
            bottomLeft: { x: offsetX + padding, y: offsetY + displayHeight - padding },
            bottomRight: { x: offsetX + displayWidth - padding, y: offsetY + displayHeight - padding }
          }
        }));
      } else {
        const padding = 50;
        const width = 400;
        const height = 400;
        setState((prev) => ({
          ...prev,
          sourceImage: dataUrl,
          gridCorners: {
            topLeft: { x: padding, y: padding },
            topRight: { x: width + padding, y: padding },
            bottomLeft: { x: padding, y: height + padding },
            bottomRight: { x: width + padding, y: height + padding }
          }
        }));
      }
    };
    img.src = dataUrl;
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        handleImageLoad(result);
      }
    };
    reader.readAsDataURL(file);
  }, [handleImageLoad]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          handleFileSelect(file);
          e.preventDefault();
          break;
        }
      }
    }
  }, [handleFileSelect]);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer?.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleCornerMouseDown = useCallback((corner: CornerKey, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragCorner(corner);
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      // Access state directly via the current state value
      // We use a ref pattern here since we need synchronous access
      setDragStartCorners(state.gridCorners);
      setDragStartRotation(state.rotation);
    }
  }, [state.gridCorners, state.rotation]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragCorner || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setState((prev) => {
      if (prev.selectionMode === "corners") {
        // Direct corner manipulation
        return {
          ...prev,
          gridCorners: {
            ...prev.gridCorners,
            [dragCorner]: { x, y }
          }
        };
      } else {
        // Transform mode: rotate and scale uniformly
        if (!dragStartPos || !dragStartCorners) return prev;
        
        const center = getCornersCenter(dragStartCorners);
        
        // Calculate angle change from start to current position
        const startAngle = Math.atan2(dragStartPos.y - center.y, dragStartPos.x - center.x);
        const currentAngle = Math.atan2(y - center.y, x - center.x);
        const angleDelta = (currentAngle - startAngle) * 180 / Math.PI;
        
        // Calculate scale change
        const startDist = Math.sqrt(
          Math.pow(dragStartPos.x - center.x, 2) + Math.pow(dragStartPos.y - center.y, 2)
        );
        const currentDist = Math.sqrt(
          Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2)
        );
        const scaleFactor = startDist > 0 ? currentDist / startDist : 1;
        
        // Apply rotation and scale to all corners from the original start position
        const newCorners: GridCorners = {
          topLeft: transformCorner(dragStartCorners.topLeft, center, angleDelta, scaleFactor),
          topRight: transformCorner(dragStartCorners.topRight, center, angleDelta, scaleFactor),
          bottomLeft: transformCorner(dragStartCorners.bottomLeft, center, angleDelta, scaleFactor),
          bottomRight: transformCorner(dragStartCorners.bottomRight, center, angleDelta, scaleFactor)
        };
        
        return {
          ...prev,
          rotation: dragStartRotation + angleDelta,
          gridCorners: newCorners
        };
      }
    });
  }, [isDragging, dragCorner, dragStartPos, dragStartCorners, dragStartRotation]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragCorner(null);
    setDragStartPos(null);
    setDragStartCorners(null);
    setDragStartRotation(0);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleRotationChange = useCallback((rotation: number) => {
    setState((prev) => {
      const center = getCornersCenter(prev.gridCorners);
      const rotationDelta = rotation - prev.rotation;
      
      const newCorners: GridCorners = {
        topLeft: rotatePoint(prev.gridCorners.topLeft, center, rotationDelta),
        topRight: rotatePoint(prev.gridCorners.topRight, center, rotationDelta),
        bottomLeft: rotatePoint(prev.gridCorners.bottomLeft, center, rotationDelta),
        bottomRight: rotatePoint(prev.gridCorners.bottomRight, center, rotationDelta)
      };
      
      return {
        ...prev,
        rotation,
        gridCorners: newCorners
      };
    });
  }, []);

  const handleCopyToClipboard = useCallback(async () => {
    if (!previewCanvasRef.current) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        previewCanvasRef.current?.toBlob(resolve, "image/png")
      );
      
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
      }
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!previewCanvasRef.current) return;

    const link = document.createElement("a");
    link.download = `pixelated-${state.outputWidth}x${state.outputHeight}.png`;
    link.href = previewCanvasRef.current.toDataURL("image/png");
    link.click();
  }, [state.outputWidth, state.outputHeight]);

  const handleClearImage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sourceImage: null
    }));
  }, []);

  const handleResetGrid = useCallback(() => {
    if (!imageElement || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const aspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
    
    // Calculate image dimensions (same logic as CSS max-width/max-height 100%)
    let displayWidth = rect.width;
    let displayHeight = rect.width / aspectRatio;
    
    if (displayHeight > rect.height) {
      displayHeight = rect.height;
      displayWidth = rect.height * aspectRatio;
    }
    
    // Calculate offset (image centered in container)
    const offsetX = (rect.width - displayWidth) / 2;
    const offsetY = (rect.height - displayHeight) / 2;
    
    // Set grid corners with a small padding from the image edges
    const padding = 20;

    setState((prev) => ({
      ...prev,
      gridCorners: {
        topLeft: { x: offsetX + padding, y: offsetY + padding },
        topRight: { x: offsetX + displayWidth - padding, y: offsetY + padding },
        bottomLeft: { x: offsetX + padding, y: offsetY + displayHeight - padding },
        bottomRight: { x: offsetX + displayWidth - padding, y: offsetY + displayHeight - padding }
      },
      rotation: 0
    }));
  }, [imageElement]);

  const handleInferDimensions = useCallback(async () => {
    if (!imageElement) return;
    
    setIsInferring(true);
    setInferProgress({ progress: 0, phase: "Starting analysis..." });
    
    try {
      const scaledCorners = scaleCorners(state.gridCorners, imageElement);
      const skewedCorners = applyPerspectiveSkew(
        scaledCorners,
        state.perspectiveSkewX,
        state.perspectiveSkewY,
        state.isometric
      );
      
      const result = await inferDimensions(
        imageElement,
        skewedCorners,
        state.outputWidth,
        state.outputHeight,
        state.colorMethod,
        (progress) => setInferProgress(progress)
      );
      
      // Update the output dimensions with the inferred values
      setState((prev) => ({
        ...prev,
        outputWidth: result.width,
        outputHeight: result.height
      }));
    } catch (error) {
      console.error("Error inferring dimensions:", error);
    } finally {
      setIsInferring(false);
      setInferProgress(null);
    }
  }, [imageElement, state.gridCorners, state.outputWidth, state.outputHeight, state.colorMethod, state.perspectiveSkewX, state.perspectiveSkewY, state.isometric, scaleCorners]);

  const handleSuperSmartInfer = useCallback(async () => {
    if (!imageElement) return;
    
    setIsInferring(true);
    setInferProgress({ progress: 0, phase: "Starting super-smart analysis..." });
    
    try {
      const scaledCorners = scaleCorners(state.gridCorners, imageElement);
      const skewedCorners = applyPerspectiveSkew(
        scaledCorners,
        state.perspectiveSkewX,
        state.perspectiveSkewY,
        state.isometric
      );
      
      const result = await inferDimensionsSuperSmart(
        imageElement,
        skewedCorners,
        (progress: SuperSmartProgress) => setInferProgress(progress)
      );
      
      // Update the output dimensions with the inferred values
      setState((prev) => ({
        ...prev,
        outputWidth: result.width,
        outputHeight: result.height
      }));
    } catch (error) {
      console.error("Error in super-smart inference:", error);
    } finally {
      setIsInferring(false);
      setInferProgress(null);
    }
  }, [imageElement, state.gridCorners, state.perspectiveSkewX, state.perspectiveSkewY, state.isometric, scaleCorners]);

  const corners = state.gridCorners;

  return (
    <>
      <header class="app-header">
        <h1>🎨 Pixel-Based Crafting - Image Pixelator</h1>
      </header>
      
      <main class="app-main">
        <section class="panel source-panel">
          <h2 class="panel-title">Source Image</h2>
          
          {state.sourceImage && imageElement && (
            <div class="image-controls">
              <button class="btn btn-secondary" onClick={handleClearImage}>
                🗑️ Clear
              </button>
              <button class="btn btn-secondary" onClick={handleResetGrid}>
                🔄 Reset Grid
              </button>
              <button class="btn btn-secondary" onClick={handleUploadClick}>
                📁 Change Image
              </button>
            </div>
          )}
          
          <div
            ref={containerRef}
            class={`image-container ${!state.sourceImage ? "drop-zone" : ""} ${isDragOver ? "drag-over" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={!state.sourceImage ? handleUploadClick : undefined}
          >
            {!state.sourceImage ? (
              <>
                <div class="icon">📷</div>
                <p><strong>Drop image here</strong></p>
                <p>or click to upload</p>
                <p>You can also paste from clipboard (Ctrl+V)</p>
              </>
            ) : (
              <>
                <img
                  ref={sourceImageRef}
                  src={state.sourceImage}
                  alt="Source"
                  class="source-image"
                  onLoad={updateImageOffset}
                />
                <div class="grid-overlay">
                  <svg>
                    <polygon
                      class="grid-fill"
                      points={`${corners.topLeft.x},${corners.topLeft.y} ${corners.topRight.x},${corners.topRight.y} ${corners.bottomRight.x},${corners.bottomRight.y} ${corners.bottomLeft.x},${corners.bottomLeft.y}`}
                    />
                    
                    {state.showPixelGrid && (
                      state.colorMethod === "centerWeighted" || state.colorMethod === "centerSpot" ? (
                        // Render circles for center-based methods
                        generatePixelGridCircles(corners, state.outputWidth, state.outputHeight).map((circle, i) => (
                          <circle
                            key={`pixel-circle-${i}`}
                            class="pixel-grid-circle"
                            cx={circle.cx}
                            cy={circle.cy}
                            r={circle.r}
                          />
                        ))
                      ) : (
                        // Render grid lines for other methods
                        <path
                          class="pixel-grid-lines"
                          d={generatePixelGridLines(corners, state.outputWidth, state.outputHeight)}
                        />
                      )
                    )}
                    
                    {(["topLeft", "topRight", "bottomLeft", "bottomRight"] as CornerKey[]).map((key) => {
                      const corner = corners[key];
                      return (
                        <circle
                          key={key}
                          class="grid-corner"
                          cx={corner.x}
                          cy={corner.y}
                          r={12}
                          onMouseDown={(e) => handleCornerMouseDown(key, e)}
                        />
                      );
                    })}
                  </svg>
                </div>
              </>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            class="hidden-input"
            onChange={handleFileInputChange}
          />
        </section>

        <section class="panel preview-panel">
          <h2 class="panel-title">Output Preview ({state.outputWidth}×{state.outputHeight})</h2>
          
          <div class="preview-canvas">
            <canvas
              ref={previewCanvasRef}
              class="preview-canvas-element"
            />
            
            {state.sourceImage && (
              <div class="btn-group">
                <button class="btn btn-primary" onClick={handleCopyToClipboard}>
                  📋 Copy
                </button>
                <button class="btn btn-primary" onClick={handleDownload}>
                  💾 Download
                </button>
              </div>
            )}
          </div>
        </section>

        <aside class="panel settings-panel">
          <h2 class="panel-title">Settings</h2>
          
          <div class="settings-group">
            <label>Output Dimensions</label>
            <div class="settings-row">
              <div>
                <label>Width</label>
                <input
                  type="number"
                  min="1"
                  max="256"
                  value={state.outputWidth}
                  onChange={(e) => {
                    const value = parseInt((e.target as HTMLInputElement).value, 10);
                    if (value > 0 && value <= 256) {
                      setState((prev) => ({ ...prev, outputWidth: value }));
                    }
                  }}
                  disabled={isInferring}
                />
              </div>
              <div>
                <label>Height</label>
                <input
                  type="number"
                  min="1"
                  max="256"
                  value={state.outputHeight}
                  onChange={(e) => {
                    const value = parseInt((e.target as HTMLInputElement).value, 10);
                    if (value > 0 && value <= 256) {
                      setState((prev) => ({ ...prev, outputHeight: value }));
                    }
                  }}
                  disabled={isInferring}
                />
              </div>
            </div>
            {state.sourceImage && (
              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    class="btn btn-primary"
                    onClick={handleInferDimensions}
                    disabled={isInferring || !imageElement}
                    style={{ flex: 1 }}
                  >
                    {isInferring ? "🔄..." : "🔍 Infer"}
                  </button>
                  <button
                    class="btn btn-primary"
                    onClick={handleSuperSmartInfer}
                    disabled={isInferring || !imageElement}
                    style={{ flex: 1 }}
                    title="Super-smart mode: Stochastically infers pixel art dimensions from misaligned images"
                  >
                    {isInferring ? "🔄..." : "🧠 Super Smart"}
                  </button>
                </div>
                {isInferring && inferProgress && (
                  <div class="infer-progress" style={{ marginTop: "0.5rem" }}>
                    <div class="progress-bar-container">
                      <div 
                        class="progress-bar-fill" 
                        style={{ width: `${inferProgress.progress}%` }}
                      />
                    </div>
                    <div class="progress-text">
                      {inferProgress.phase}
                    </div>
                    {inferProgress.currentBest && (
                      <div class="progress-best">
                        Current best: {inferProgress.currentBest.width}×{inferProgress.currentBest.height}
                      </div>
                    )}
                  </div>
                )}
                <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.5rem" }}>
                  Infer: Uses current dimensions as starting point<br/>
                  Super Smart: Stochastically finds optimal grid for misaligned pixel art
                </p>
              </div>
            )}
          </div>

          <div class="settings-group">
            <label>Color Selection Method</label>
            <select
              value={state.colorMethod}
              onChange={(e) => {
                const value = (e.target as HTMLSelectElement).value as ColorMethod;
                setState((prev) => ({ ...prev, colorMethod: value }));
              }}
            >
              {COLOR_METHODS.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
            <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.5rem" }}>
              {COLOR_METHODS.find((m) => m.id === state.colorMethod)?.description}
            </p>
          </div>

          <div class="settings-group">
            <label>Grid Rotation</label>
            <div class="rotation-control">
              <input
                type="range"
                min="-180"
                max="180"
                value={state.rotation}
                onChange={(e) => {
                  const value = parseInt((e.target as HTMLInputElement).value, 10);
                  handleRotationChange(value);
                }}
              />
              <span class="rotation-value">{state.rotation}°</span>
            </div>
            <button
              class="reset-btn"
              style={{ marginTop: "0.5rem" }}
              onClick={() => handleRotationChange(0)}
            >
              Reset Rotation
            </button>
          </div>

          <div class="settings-group">
            <label>Perspective Skew</label>
            <div class="perspective-controls">
              <div class="perspective-row">
                <label>X Skew</label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={state.perspectiveSkewX}
                  onChange={(e) => {
                    const value = parseInt((e.target as HTMLInputElement).value, 10);
                    setState((prev) => ({ ...prev, perspectiveSkewX: value }));
                  }}
                />
                <span>{state.perspectiveSkewX}</span>
              </div>
              <div class="perspective-row">
                <label>Y Skew</label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={state.perspectiveSkewY}
                  onChange={(e) => {
                    const value = parseInt((e.target as HTMLInputElement).value, 10);
                    setState((prev) => ({ ...prev, perspectiveSkewY: value }));
                  }}
                />
                <span>{state.perspectiveSkewY}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="isometric"
                  checked={state.isometric}
                  onChange={(e) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    setState((prev) => ({ ...prev, isometric: checked }));
                  }}
                />
                <label htmlFor="isometric" style={{ fontSize: "0.75rem", color: "#888" }}>
                  Isometric Projection (default)
                </label>
              </div>
              <button
                class="reset-btn"
                onClick={() => setState((prev) => ({
                  ...prev,
                  perspectiveSkewX: 0,
                  perspectiveSkewY: 0
                }))}
              >
                Reset Perspective
              </button>
            </div>
          </div>

          <div class="settings-group">
            <label>Selection Mode</label>
            <div class="selection-mode-buttons">
              <button
                class={`mode-btn ${state.selectionMode === "transform" ? "active" : ""}`}
                onClick={() => setState((prev) => ({ ...prev, selectionMode: "transform" }))}
              >
                🔄 Transform
              </button>
              <button
                class={`mode-btn ${state.selectionMode === "corners" ? "active" : ""}`}
                onClick={() => setState((prev) => ({ ...prev, selectionMode: "corners" }))}
              >
                📐 Corners
              </button>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.5rem" }}>
              {state.selectionMode === "transform" 
                ? "Drag to rotate/scale the selection uniformly"
                : "Drag individual corners to adjust perspective"
              }
            </p>
          </div>

          <div class="settings-group">
            <label>Color Quantization</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                type="checkbox"
                id="enableColorLimit"
                checked={state.enableColorLimit}
                onChange={(e) => {
                  const checked = (e.target as HTMLInputElement).checked;
                  setState((prev) => ({ ...prev, enableColorLimit: checked }));
                }}
              />
              <label htmlFor="enableColorLimit" style={{ fontSize: "0.75rem", color: "#888" }}>
                Limit output colors
              </label>
            </div>
            {state.enableColorLimit && (
              <div>
                <label>Max Colors: {state.maxColors}</label>
                <input
                  type="range"
                  min="2"
                  max="256"
                  value={state.maxColors}
                  onChange={(e) => {
                    const value = parseInt((e.target as HTMLInputElement).value, 10);
                    setState((prev) => ({ ...prev, maxColors: value }));
                  }}
                />
              </div>
            )}
            <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.5rem" }}>
              Uses k-means clustering in ICtCp color space
            </p>
          </div>

          <div class="settings-group">
            <label>Background Detection</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                id="enableBackgroundDetection"
                checked={state.enableBackgroundDetection}
                onChange={(e) => {
                  const checked = (e.target as HTMLInputElement).checked;
                  setState((prev) => ({ ...prev, enableBackgroundDetection: checked }));
                }}
              />
              <label htmlFor="enableBackgroundDetection" style={{ fontSize: "0.75rem", color: "#888" }}>
                Auto-remove uniform background
              </label>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.5rem" }}>
              Detects and removes solid background fields
            </p>
          </div>

          <div class="settings-group">
            <label>Pixel Grid Overlay</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                id="showPixelGrid"
                checked={state.showPixelGrid}
                onChange={(e) => {
                  const checked = (e.target as HTMLInputElement).checked;
                  setState((prev) => ({ ...prev, showPixelGrid: checked }));
                }}
              />
              <label htmlFor="showPixelGrid" style={{ fontSize: "0.75rem", color: "#888" }}>
                Show pixel grid in source preview
              </label>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.5rem" }}>
              {state.colorMethod === "centerWeighted" || state.colorMethod === "centerSpot"
                ? "Shows sampling circles for center-based color methods"
                : "Shows output pixel grid on source image"
              }
            </p>
          </div>
        </aside>
      </main>
    </>
  );
}

const appElement = document.getElementById("app");
if (appElement) {
  render(<App />, appElement);
}
