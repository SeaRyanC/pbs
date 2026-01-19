import { render } from "preact";
import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import type { AppState, Point, GridCorners, ColorMethod } from "./types";
import { DEFAULT_STATE, COLOR_METHODS, saveState, loadState } from "./types";
import { generatePixelatedImage, getCornersCenter, rotatePoint } from "./imageProcessing";

type CornerKey = keyof GridCorners;

function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCorner, setDragCorner] = useState<CornerKey | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const pixelData = generatePixelatedImage(
      imageElement,
      scaledCorners,
      state.outputWidth,
      state.outputHeight,
      state.colorMethod
    );

    ctx.putImageData(pixelData, 0, 0);
  }, [imageElement, state.gridCorners, state.outputWidth, state.outputHeight, state.colorMethod]);

  const scaleCorners = useCallback((corners: GridCorners, img: HTMLImageElement): GridCorners => {
    const container = containerRef.current;
    if (!container || !img) return corners;

    const rect = container.getBoundingClientRect();
    const displayedWidth = Math.min(rect.width, img.naturalWidth);
    const displayedHeight = Math.min(rect.height, img.naturalHeight);
    
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    let actualWidth = displayedWidth;
    let actualHeight = displayedWidth / aspectRatio;
    
    if (actualHeight > displayedHeight) {
      actualHeight = displayedHeight;
      actualWidth = displayedHeight * aspectRatio;
    }

    const scaleX = img.naturalWidth / actualWidth;
    const scaleY = img.naturalHeight / actualHeight;

    return {
      topLeft: { x: corners.topLeft.x * scaleX, y: corners.topLeft.y * scaleY },
      topRight: { x: corners.topRight.x * scaleX, y: corners.topRight.y * scaleY },
      bottomLeft: { x: corners.bottomLeft.x * scaleX, y: corners.bottomLeft.y * scaleY },
      bottomRight: { x: corners.bottomRight.x * scaleX, y: corners.bottomRight.y * scaleY }
    };
  }, []);

  const handleImageLoad = useCallback((dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const padding = 50;
      const container = containerRef.current;
      let width = 400;
      let height = 400;
      
      if (container) {
        const rect = container.getBoundingClientRect();
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        width = Math.min(rect.width - padding * 2, 600);
        height = width / aspectRatio;
        
        if (height > rect.height - padding * 2) {
          height = Math.min(rect.height - padding * 2, 600);
          width = height * aspectRatio;
        }
      }

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
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragCorner || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setState((prev) => ({
      ...prev,
      gridCorners: {
        ...prev.gridCorners,
        [dragCorner]: { x, y }
      }
    }));
  }, [isDragging, dragCorner]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragCorner(null);
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
    const padding = 50;
    const aspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
    let width = Math.min(rect.width - padding * 2, 600);
    let height = width / aspectRatio;

    if (height > rect.height - padding * 2) {
      height = Math.min(rect.height - padding * 2, 600);
      width = height * aspectRatio;
    }

    setState((prev) => ({
      ...prev,
      gridCorners: {
        topLeft: { x: padding, y: padding },
        topRight: { x: width + padding, y: padding },
        bottomLeft: { x: padding, y: height + padding },
        bottomRight: { x: width + padding, y: height + padding }
      },
      rotation: 0
    }));
  }, [imageElement]);

  const getRotatedCorners = (): GridCorners => {
    return state.gridCorners;
  };

  const corners = getRotatedCorners();

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
                  src={state.sourceImage}
                  alt="Source"
                  class="source-image"
                />
                <div class="grid-overlay">
                  <svg>
                    <polygon
                      class="grid-fill"
                      points={`${corners.topLeft.x},${corners.topLeft.y} ${corners.topRight.x},${corners.topRight.y} ${corners.bottomRight.x},${corners.bottomRight.y} ${corners.bottomLeft.x},${corners.bottomLeft.y}`}
                    />
                    
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
              style={{
                width: `${Math.min(state.outputWidth * 4, 256)}px`,
                height: `${Math.min(state.outputHeight * 4, 256)}px`
              }}
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
                />
              </div>
            </div>
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
        </aside>
      </main>
    </>
  );
}

const appElement = document.getElementById("app");
if (appElement) {
  render(<App />, appElement);
}
