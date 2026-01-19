import type { Point, GridCorners, ColorMethod } from "./types";

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function perspectiveTransform(
  corners: GridCorners,
  u: number,
  v: number
): Point {
  const { topLeft, topRight, bottomLeft, bottomRight } = corners;
  
  const topX = topLeft.x + (topRight.x - topLeft.x) * u;
  const topY = topLeft.y + (topRight.y - topLeft.y) * u;
  const bottomX = bottomLeft.x + (bottomRight.x - bottomLeft.x) * u;
  const bottomY = bottomLeft.y + (bottomRight.y - bottomLeft.y) * u;
  
  return {
    x: topX + (bottomX - topX) * v,
    y: topY + (bottomY - topY) * v
  };
}

export function getPixelFromImageData(
  imageData: ImageData,
  x: number,
  y: number
): RGBA {
  const px = Math.floor(x);
  const py = Math.floor(y);
  
  if (px < 0 || px >= imageData.width || py < 0 || py >= imageData.height) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  
  const idx = (py * imageData.width + px) * 4;
  return {
    r: imageData.data[idx] ?? 0,
    g: imageData.data[idx + 1] ?? 0,
    b: imageData.data[idx + 2] ?? 0,
    a: imageData.data[idx + 3] ?? 255
  };
}

function collectCellPixels(
  imageData: ImageData,
  corners: GridCorners,
  cellX: number,
  cellY: number,
  gridWidth: number,
  gridHeight: number,
  sampleSize: number = 5
): RGBA[] {
  const pixels: RGBA[] = [];
  
  const u0 = cellX / gridWidth;
  const u1 = (cellX + 1) / gridWidth;
  const v0 = cellY / gridHeight;
  const v1 = (cellY + 1) / gridHeight;
  
  for (let i = 0; i < sampleSize; i++) {
    for (let j = 0; j < sampleSize; j++) {
      const u = u0 + (u1 - u0) * (i + 0.5) / sampleSize;
      const v = v0 + (v1 - v0) * (j + 0.5) / sampleSize;
      const point = perspectiveTransform(corners, u, v);
      const pixel = getPixelFromImageData(imageData, point.x, point.y);
      if (pixel.a > 0) {
        pixels.push(pixel);
      }
    }
  }
  
  return pixels;
}

function meanColor(pixels: RGBA[]): RGBA {
  if (pixels.length === 0) return { r: 0, g: 0, b: 0, a: 0 };
  
  let r = 0, g = 0, b = 0, a = 0;
  for (const p of pixels) {
    r += p.r;
    g += p.g;
    b += p.b;
    a += p.a;
  }
  const n = pixels.length;
  return {
    r: Math.round(r / n),
    g: Math.round(g / n),
    b: Math.round(b / n),
    a: Math.round(a / n)
  };
}

function medianColor(pixels: RGBA[]): RGBA {
  if (pixels.length === 0) return { r: 0, g: 0, b: 0, a: 0 };
  
  const sorted = {
    r: [...pixels].sort((a, b) => a.r - b.r),
    g: [...pixels].sort((a, b) => a.g - b.g),
    b: [...pixels].sort((a, b) => a.b - b.b),
    a: [...pixels].sort((a, b) => a.a - b.a)
  };
  
  const mid = Math.floor(pixels.length / 2);
  return {
    r: sorted.r[mid]?.r ?? 0,
    g: sorted.g[mid]?.g ?? 0,
    b: sorted.b[mid]?.b ?? 0,
    a: sorted.a[mid]?.a ?? 255
  };
}

function modeColor(pixels: RGBA[]): RGBA {
  if (pixels.length === 0) return { r: 0, g: 0, b: 0, a: 0 };
  
  const colorCounts = new Map<string, { count: number; color: RGBA }>();
  
  for (const p of pixels) {
    const qr = Math.round(p.r / 16) * 16;
    const qg = Math.round(p.g / 16) * 16;
    const qb = Math.round(p.b / 16) * 16;
    const key = `${qr},${qg},${qb}`;
    
    const existing = colorCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorCounts.set(key, { count: 1, color: p });
    }
  }
  
  let maxCount = 0;
  let modePixel: RGBA = pixels[0] ?? { r: 0, g: 0, b: 0, a: 0 };
  
  for (const { count, color } of colorCounts.values()) {
    if (count > maxCount) {
      maxCount = count;
      modePixel = color;
    }
  }
  
  return modePixel;
}

function kernelMedianColor(pixels: RGBA[]): RGBA {
  if (pixels.length === 0) return { r: 0, g: 0, b: 0, a: 0 };
  
  const weights: number[] = [];
  const size = Math.sqrt(pixels.length);
  const center = (size - 1) / 2;
  
  for (let i = 0; i < pixels.length; i++) {
    const row = Math.floor(i / size);
    const col = i % size;
    const dx = col - center;
    const dy = row - center;
    const dist = Math.sqrt(dx * dx + dy * dy);
    weights.push(Math.exp(-dist * dist / (2 * center * center)));
  }
  
  const weighted: { pixel: RGBA; weight: number }[] = pixels.map((p, i) => ({
    pixel: p,
    weight: weights[i] ?? 1
  }));
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const halfWeight = totalWeight / 2;
  
  const findWeightedMedian = (
    sorted: { pixel: RGBA; weight: number }[],
    getValue: (p: RGBA) => number
  ): number => {
    let cumWeight = 0;
    for (const { pixel, weight } of sorted.sort(
      (a, b) => getValue(a.pixel) - getValue(b.pixel)
    )) {
      cumWeight += weight;
      if (cumWeight >= halfWeight) return getValue(pixel);
    }
    return getValue(sorted[sorted.length - 1]?.pixel ?? { r: 0, g: 0, b: 0, a: 0 });
  };
  
  return {
    r: Math.round(findWeightedMedian([...weighted], (p) => p.r)),
    g: Math.round(findWeightedMedian([...weighted], (p) => p.g)),
    b: Math.round(findWeightedMedian([...weighted], (p) => p.b)),
    a: Math.round(findWeightedMedian([...weighted], (p) => p.a))
  };
}

function centerWeightedColor(pixels: RGBA[]): RGBA {
  if (pixels.length === 0) return { r: 0, g: 0, b: 0, a: 0 };
  
  const size = Math.sqrt(pixels.length);
  const center = Math.floor(size / 2);
  const centerIdx = center * size + center;
  const centerPixel = pixels[centerIdx];
  
  if (!centerPixel) return meanColor(pixels);
  
  let r = centerPixel.r * 4;
  let g = centerPixel.g * 4;
  let b = centerPixel.b * 4;
  let a = centerPixel.a * 4;
  let weight = 4;
  
  for (let i = 0; i < pixels.length; i++) {
    if (i !== centerIdx) {
      const p = pixels[i];
      if (p) {
        r += p.r;
        g += p.g;
        b += p.b;
        a += p.a;
        weight++;
      }
    }
  }
  
  return {
    r: Math.round(r / weight),
    g: Math.round(g / weight),
    b: Math.round(b / weight),
    a: Math.round(a / weight)
  };
}

function computeCellColor(pixels: RGBA[], method: ColorMethod): RGBA {
  switch (method) {
    case "mean":
      return meanColor(pixels);
    case "median":
      return medianColor(pixels);
    case "mode":
      return modeColor(pixels);
    case "kernelMedian":
      return kernelMedianColor(pixels);
    case "centerWeighted":
      return centerWeightedColor(pixels);
    default:
      return meanColor(pixels);
  }
}

export function generatePixelatedImage(
  sourceImage: HTMLImageElement,
  corners: GridCorners,
  outputWidth: number,
  outputHeight: number,
  colorMethod: ColorMethod
): ImageData {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = sourceImage.naturalWidth;
  tempCanvas.height = sourceImage.naturalHeight;
  const tempCtx = tempCanvas.getContext("2d");
  
  if (!tempCtx) {
    return new ImageData(outputWidth, outputHeight);
  }
  
  tempCtx.drawImage(sourceImage, 0, 0);
  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  
  const output = new ImageData(outputWidth, outputHeight);
  
  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const pixels = collectCellPixels(
        imageData,
        corners,
        x,
        y,
        outputWidth,
        outputHeight
      );
      
      const color = computeCellColor(pixels, colorMethod);
      const idx = (y * outputWidth + x) * 4;
      output.data[idx] = color.r;
      output.data[idx + 1] = color.g;
      output.data[idx + 2] = color.b;
      output.data[idx + 3] = color.a;
    }
  }
  
  return output;
}

export function rotatePoint(point: Point, center: Point, angleDeg: number): Point {
  const angleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  };
}

export function getCornersCenter(corners: GridCorners): Point {
  return {
    x: (corners.topLeft.x + corners.topRight.x + corners.bottomLeft.x + corners.bottomRight.x) / 4,
    y: (corners.topLeft.y + corners.topRight.y + corners.bottomLeft.y + corners.bottomRight.y) / 4
  };
}

export function applyRotationToCorners(
  corners: GridCorners,
  rotation: number
): GridCorners {
  const center = getCornersCenter(corners);
  return {
    topLeft: rotatePoint(corners.topLeft, center, rotation),
    topRight: rotatePoint(corners.topRight, center, rotation),
    bottomLeft: rotatePoint(corners.bottomLeft, center, rotation),
    bottomRight: rotatePoint(corners.bottomRight, center, rotation)
  };
}

export function applyPerspectiveSkew(
  corners: GridCorners,
  skewX: number,
  skewY: number,
  isometric: boolean
): GridCorners {
  if (isometric) {
    const center = getCornersCenter(corners);
    const isoAngle = 30;
    const scale = 0.5;
    
    return {
      topLeft: {
        x: corners.topLeft.x + (corners.topLeft.y - center.y) * Math.tan((isoAngle * Math.PI) / 180) * skewX * 0.1,
        y: corners.topLeft.y * (1 - Math.abs(skewY) * 0.1 * scale)
      },
      topRight: {
        x: corners.topRight.x + (corners.topRight.y - center.y) * Math.tan((isoAngle * Math.PI) / 180) * skewX * 0.1,
        y: corners.topRight.y * (1 - Math.abs(skewY) * 0.1 * scale)
      },
      bottomLeft: {
        x: corners.bottomLeft.x + (corners.bottomLeft.y - center.y) * Math.tan((isoAngle * Math.PI) / 180) * skewX * 0.1,
        y: corners.bottomLeft.y * (1 + Math.abs(skewY) * 0.1 * scale)
      },
      bottomRight: {
        x: corners.bottomRight.x + (corners.bottomRight.y - center.y) * Math.tan((isoAngle * Math.PI) / 180) * skewX * 0.1,
        y: corners.bottomRight.y * (1 + Math.abs(skewY) * 0.1 * scale)
      }
    };
  }
  
  return {
    topLeft: {
      x: corners.topLeft.x - skewX * 5,
      y: corners.topLeft.y - skewY * 5
    },
    topRight: {
      x: corners.topRight.x + skewX * 5,
      y: corners.topRight.y - skewY * 5
    },
    bottomLeft: {
      x: corners.bottomLeft.x - skewX * 5,
      y: corners.bottomLeft.y + skewY * 5
    },
    bottomRight: {
      x: corners.bottomRight.x + skewX * 5,
      y: corners.bottomRight.y + skewY * 5
    }
  };
}
