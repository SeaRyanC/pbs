import type { Point, GridCorners, ColorMethod } from "./types";

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

// Constants for perspective skew calculations
const ISOMETRIC_ANGLE_DEGREES = 30;
const ISOMETRIC_SCALE_FACTOR = 0.5;
const SKEW_INTENSITY = 0.1;
const NON_ISOMETRIC_SKEW_FACTOR = 5;

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

// ICtCp color space conversion for better perceptual color clustering
// ICtCp is a perceptually uniform color space that's better for color comparison

interface ICtCp {
  i: number;  // Intensity (achromatic)
  ct: number; // Tritan (blue-yellow)
  cp: number; // Protan (red-green)
}

// Convert sRGB to linear RGB
function srgbToLinear(value: number): number {
  const normalized = value / 255;
  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }
  return Math.pow((normalized + 0.055) / 1.055, 2.4);
}

// Convert linear RGB to sRGB
function linearToSrgb(value: number): number {
  if (value <= 0.0031308) {
    return Math.round(Math.min(255, Math.max(0, value * 12.92 * 255)));
  }
  return Math.round(Math.min(255, Math.max(0, (1.055 * Math.pow(value, 1 / 2.4) - 0.055) * 255)));
}

// Simplified gamma transfer function for SDR ICtCp
// Uses a simple power function instead of PQ for SDR content
function gammaToLinear(value: number): number {
  return Math.pow(Math.max(0, value), 2.4);
}

function linearToGamma(value: number): number {
  return Math.pow(Math.max(0, value), 1 / 2.4);
}

// Convert RGB to ICtCp (simplified for SDR)
function rgbToIctcp(rgba: RGBA): ICtCp {
  // Convert sRGB to linear RGB
  const r = srgbToLinear(rgba.r);
  const g = srgbToLinear(rgba.g);
  const b = srgbToLinear(rgba.b);
  
  // RGB to LMS (using BT.2020 primaries approximation)
  const l = 0.412109 * r + 0.523925 * g + 0.063965 * b;
  const m = 0.166748 * r + 0.720459 * g + 0.112793 * b;
  const s = 0.024170 * r + 0.075440 * g + 0.900390 * b;
  
  // Apply simple gamma transfer function (works better for SDR than PQ)
  const lPrime = linearToGamma(l);
  const mPrime = linearToGamma(m);
  const sPrime = linearToGamma(s);
  
  // LMS' to ICtCp
  const i = 0.5 * lPrime + 0.5 * mPrime;
  const ct = 1.613769 * lPrime - 3.323486 * mPrime + 1.709717 * sPrime;
  const cp = 4.378152 * lPrime - 4.245608 * mPrime - 0.132544 * sPrime;
  
  return { i, ct, cp };
}

// Convert ICtCp back to RGB
function ictcpToRgb(ictcp: ICtCp): RGBA {
  const { i, ct, cp } = ictcp;
  
  // ICtCp to LMS'
  const lPrime = i + 0.008609 * ct + 0.111030 * cp;
  const mPrime = i - 0.008609 * ct - 0.111030 * cp;
  const sPrime = i + 0.560031 * ct - 0.320627 * cp;
  
  // Apply inverse gamma transfer function
  const l = gammaToLinear(lPrime);
  const m = gammaToLinear(mPrime);
  const s = gammaToLinear(sPrime);
  
  // LMS to RGB (inverse of above matrix)
  const r = 3.436607 * l - 2.506201 * m + 0.069594 * s;
  const g = -0.791329 * l + 1.983600 * m - 0.192271 * s;
  const b = -0.025950 * l - 0.098930 * m + 1.124880 * s;
  
  return {
    r: linearToSrgb(r),
    g: linearToSrgb(g),
    b: linearToSrgb(b),
    a: 255
  };
}

// Calculate squared distance in ICtCp space
function ictcpDistanceSquared(a: ICtCp, b: ICtCp): number {
  const di = a.i - b.i;
  const dct = a.ct - b.ct;
  const dcp = a.cp - b.cp;
  return di * di + dct * dct + dcp * dcp;
}

// K-means++ initialization for better initial centroids
function initializeCentroidsKMeansPlusPlus(colors: ICtCp[], k: number): ICtCp[] {
  if (colors.length <= k) {
    return colors.slice();
  }
  if (colors.length === 0) {
    return [];
  }
  
  const centroids: ICtCp[] = [];
  const usedIndices = new Set<number>();
  
  // Choose first centroid randomly
  const firstIdx = Math.floor(Math.random() * colors.length);
  const firstColor = colors[firstIdx];
  if (firstColor) {
    centroids.push({ ...firstColor });
    usedIndices.add(firstIdx);
  }
  
  // Choose remaining centroids with probability proportional to distance squared
  for (let i = 1; i < k && i < colors.length; i++) {
    const distances: number[] = [];
    let totalDist = 0;
    
    for (let j = 0; j < colors.length; j++) {
      if (usedIndices.has(j)) {
        distances.push(0);
        continue;
      }
      
      // Find distance to nearest centroid
      const color = colors[j];
      if (!color) {
        distances.push(0);
        continue;
      }
      
      let minDist = Infinity;
      for (const centroid of centroids) {
        const dist = ictcpDistanceSquared(color, centroid);
        minDist = Math.min(minDist, dist);
      }
      distances.push(minDist);
      totalDist += minDist;
    }
    
    // Choose next centroid with probability proportional to distance squared
    let threshold = Math.random() * totalDist;
    let chosenIdx = 0;
    for (let j = 0; j < distances.length; j++) {
      const dist = distances[j];
      if (dist !== undefined) {
        threshold -= dist;
        if (threshold <= 0) {
          chosenIdx = j;
          break;
        }
      }
    }
    
    const chosenColor = colors[chosenIdx];
    if (chosenColor) {
      centroids.push({ ...chosenColor });
      usedIndices.add(chosenIdx);
    }
  }
  
  return centroids;
}

// K-means clustering in ICtCp space
function kMeansClusterColors(colors: RGBA[], maxColors: number, maxIterations: number = 20): RGBA[] {
  if (colors.length <= maxColors) {
    return colors;
  }
  
  // Convert all colors to ICtCp
  const ictcpColors = colors.map(c => rgbToIctcp(c));
  
  // Find unique colors to reduce computation
  const uniqueColorMap = new Map<string, { ictcp: ICtCp; rgba: RGBA; count: number }>();
  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    const ictcpColor = ictcpColors[i];
    if (!color || !ictcpColor) continue;
    
    const key = `${color.r},${color.g},${color.b}`;
    const existing = uniqueColorMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      uniqueColorMap.set(key, { ictcp: ictcpColor, rgba: color, count: 1 });
    }
  }
  
  const uniqueColors = Array.from(uniqueColorMap.values());
  
  // If we have fewer unique colors than maxColors, return them directly
  if (uniqueColors.length <= maxColors) {
    return uniqueColors.map(c => c.rgba);
  }
  
  // Initialize centroids using k-means++
  let centroids = initializeCentroidsKMeansPlusPlus(
    uniqueColors.map(c => c.ictcp),
    maxColors
  );
  
  // K-means iterations
  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign each color to nearest centroid
    const clusters: { colors: typeof uniqueColors; ictcp: ICtCp }[] = centroids.map(c => ({
      colors: [],
      ictcp: c
    }));
    
    for (const color of uniqueColors) {
      let minDist = Infinity;
      let nearestIdx = 0;
      
      for (let i = 0; i < centroids.length; i++) {
        const centroid = centroids[i];
        if (!centroid) continue;
        const dist = ictcpDistanceSquared(color.ictcp, centroid);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = i;
        }
      }
      
      const cluster = clusters[nearestIdx];
      if (cluster) {
        cluster.colors.push(color);
      }
    }
    
    // Update centroids to be weighted mean of their clusters
    let converged = true;
    const newCentroids: ICtCp[] = [];
    
    for (const cluster of clusters) {
      if (cluster.colors.length === 0) {
        // Keep old centroid if cluster is empty
        newCentroids.push(cluster.ictcp);
        continue;
      }
      
      let sumI = 0, sumCt = 0, sumCp = 0, totalWeight = 0;
      for (const color of cluster.colors) {
        sumI += color.ictcp.i * color.count;
        sumCt += color.ictcp.ct * color.count;
        sumCp += color.ictcp.cp * color.count;
        totalWeight += color.count;
      }
      
      const newCentroid: ICtCp = {
        i: sumI / totalWeight,
        ct: sumCt / totalWeight,
        cp: sumCp / totalWeight
      };
      
      // Check for convergence
      if (ictcpDistanceSquared(newCentroid, cluster.ictcp) > 1e-10) {
        converged = false;
      }
      
      newCentroids.push(newCentroid);
    }
    
    centroids = newCentroids;
    
    if (converged) break;
  }
  
  // Convert centroids back to RGB
  return centroids.map(c => ictcpToRgb(c));
}

// Apply color quantization to output image
function applyColorQuantization(output: ImageData, maxColors: number): void {
  // Collect all non-transparent colors
  const colors: RGBA[] = [];
  for (let i = 0; i < output.data.length; i += 4) {
    const a = output.data[i + 3];
    if (a !== undefined && a > 0) {
      const r = output.data[i];
      const g = output.data[i + 1];
      const b = output.data[i + 2];
      if (r !== undefined && g !== undefined && b !== undefined) {
        colors.push({ r, g, b, a });
      }
    }
  }
  
  if (colors.length === 0) return;
  
  // Get the palette using k-means clustering
  const palette = kMeansClusterColors(colors, maxColors);
  if (palette.length === 0) return;
  
  const paletteIctcp = palette.map(c => rgbToIctcp(c));
  
  // Map each pixel to nearest palette color
  for (let i = 0; i < output.data.length; i += 4) {
    const a = output.data[i + 3];
    if (a === undefined || a === 0) continue;
    
    const r = output.data[i];
    const g = output.data[i + 1];
    const b = output.data[i + 2];
    if (r === undefined || g === undefined || b === undefined) continue;
    
    const pixel: RGBA = { r, g, b, a };
    const pixelIctcp = rgbToIctcp(pixel);
    
    let minDist = Infinity;
    let nearestIdx = 0;
    
    for (let j = 0; j < paletteIctcp.length; j++) {
      const paletteColor = paletteIctcp[j];
      if (!paletteColor) continue;
      const dist = ictcpDistanceSquared(pixelIctcp, paletteColor);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = j;
      }
    }
    
    const nearestColor = palette[nearestIdx];
    if (nearestColor) {
      output.data[i] = nearestColor.r;
      output.data[i + 1] = nearestColor.g;
      output.data[i + 2] = nearestColor.b;
    }
    // Keep original alpha
  }
}

// Detect and remove background pixels
// This detects if there's a uniform field around the image and blanks those pixels
// without affecting same-colored pixels inside the image
function detectAndRemoveBackground(
  output: ImageData,
  imageData: ImageData,
  corners: GridCorners,
  outputWidth: number,
  outputHeight: number
): void {
  // Sample border pixels to detect background color
  const borderColors: RGBA[] = [];
  const borderThreshold = 0.05; // Sample from outer 5% of the output
  
  // Check if a normalized coordinate is outside the original image bounds
  const isOutsideOriginalBounds = (u: number, v: number): boolean => {
    const point = perspectiveTransform(corners, u, v);
    return point.x < 0 || point.x >= imageData.width || 
           point.y < 0 || point.y >= imageData.height;
  };
  
  // Collect border colors (pixels near edges)
  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const u = (x + 0.5) / outputWidth;
      const v = (y + 0.5) / outputHeight;
      
      const isBorder = u < borderThreshold || u > (1 - borderThreshold) ||
                       v < borderThreshold || v > (1 - borderThreshold);
      
      if (isBorder) {
        const idx = (y * outputWidth + x) * 4;
        if (output.data[idx + 3]! > 0) {
          borderColors.push({
            r: output.data[idx]!,
            g: output.data[idx + 1]!,
            b: output.data[idx + 2]!,
            a: output.data[idx + 3]!
          });
        }
      }
    }
  }
  
  if (borderColors.length === 0) return;
  
  // Find the most common border color
  const colorCounts = new Map<string, { color: RGBA; count: number }>();
  for (const color of borderColors) {
    // Quantize to reduce noise
    const qr = Math.round(color.r / 8) * 8;
    const qg = Math.round(color.g / 8) * 8;
    const qb = Math.round(color.b / 8) * 8;
    const key = `${qr},${qg},${qb}`;
    
    const existing = colorCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorCounts.set(key, { color: { r: qr, g: qg, b: qb, a: 255 }, count: 1 });
    }
  }
  
  // Find the most common color
  let maxCount = 0;
  let backgroundColor: RGBA | null = null;
  for (const { color, count } of colorCounts.values()) {
    if (count > maxCount) {
      maxCount = count;
      backgroundColor = color;
    }
  }
  
  // Only proceed if background color appears in at least 50% of border pixels
  if (!backgroundColor || maxCount < borderColors.length * 0.5) return;
  
  const bgIctcp = rgbToIctcp(backgroundColor);
  const colorThreshold = 0.02; // Perceptual threshold for "same color"
  
  // Track which pixels are part of a "connected" background region
  // Use flood fill from edges to mark exterior background
  const isBackground = new Array<boolean>(outputWidth * outputHeight).fill(false);
  const visited = new Array<boolean>(outputWidth * outputHeight).fill(false);
  
  const isColorSimilar = (idx: number): boolean => {
    const pixel: RGBA = {
      r: output.data[idx * 4]!,
      g: output.data[idx * 4 + 1]!,
      b: output.data[idx * 4 + 2]!,
      a: output.data[idx * 4 + 3]!
    };
    
    if (pixel.a === 0) return true; // Transparent is "background"
    
    const pixelIctcp = rgbToIctcp(pixel);
    return ictcpDistanceSquared(pixelIctcp, bgIctcp) < colorThreshold;
  };
  
  // BFS flood fill from all edge pixels
  const queue: number[] = [];
  
  // Add all edge pixels to queue
  for (let x = 0; x < outputWidth; x++) {
    queue.push(x); // Top edge
    queue.push((outputHeight - 1) * outputWidth + x); // Bottom edge
  }
  for (let y = 1; y < outputHeight - 1; y++) {
    queue.push(y * outputWidth); // Left edge
    queue.push(y * outputWidth + outputWidth - 1); // Right edge
  }
  
  // Process queue
  while (queue.length > 0) {
    const idx = queue.pop()!;
    
    if (visited[idx]) continue;
    visited[idx] = true;
    
    if (!isColorSimilar(idx)) continue;
    
    isBackground[idx] = true;
    
    const x = idx % outputWidth;
    const y = Math.floor(idx / outputWidth);
    
    // Check 4-connected neighbors
    if (x > 0 && !visited[idx - 1]) queue.push(idx - 1);
    if (x < outputWidth - 1 && !visited[idx + 1]) queue.push(idx + 1);
    if (y > 0 && !visited[idx - outputWidth]) queue.push(idx - outputWidth);
    if (y < outputHeight - 1 && !visited[idx + outputWidth]) queue.push(idx + outputWidth);
  }
  
  // Clear background pixels (set alpha to 0)
  for (let i = 0; i < isBackground.length; i++) {
    if (isBackground[i]) {
      output.data[i * 4 + 3] = 0; // Set alpha to 0
    }
  }
}

export interface GenerateOptions {
  enableColorLimit: boolean;
  maxColors: number;
  enableBackgroundDetection: boolean;
}

export function generatePixelatedImage(
  sourceImage: HTMLImageElement,
  corners: GridCorners,
  outputWidth: number,
  outputHeight: number,
  colorMethod: ColorMethod,
  options: GenerateOptions = {
    enableColorLimit: true,
    maxColors: 32,
    enableBackgroundDetection: true
  }
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
  
  // Apply background detection before color quantization
  if (options.enableBackgroundDetection) {
    detectAndRemoveBackground(output, imageData, corners, outputWidth, outputHeight);
  }
  
  // Apply color quantization
  if (options.enableColorLimit && options.maxColors > 0) {
    applyColorQuantization(output, options.maxColors);
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

export function applyPerspectiveSkew(
  corners: GridCorners,
  skewX: number,
  skewY: number,
  isometric: boolean
): GridCorners {
  if (isometric) {
    const center = getCornersCenter(corners);
    const isoAngleRad = (ISOMETRIC_ANGLE_DEGREES * Math.PI) / 180;
    
    return {
      topLeft: {
        x: corners.topLeft.x + (corners.topLeft.y - center.y) * Math.tan(isoAngleRad) * skewX * SKEW_INTENSITY,
        y: corners.topLeft.y * (1 - Math.abs(skewY) * SKEW_INTENSITY * ISOMETRIC_SCALE_FACTOR)
      },
      topRight: {
        x: corners.topRight.x + (corners.topRight.y - center.y) * Math.tan(isoAngleRad) * skewX * SKEW_INTENSITY,
        y: corners.topRight.y * (1 - Math.abs(skewY) * SKEW_INTENSITY * ISOMETRIC_SCALE_FACTOR)
      },
      bottomLeft: {
        x: corners.bottomLeft.x + (corners.bottomLeft.y - center.y) * Math.tan(isoAngleRad) * skewX * SKEW_INTENSITY,
        y: corners.bottomLeft.y * (1 + Math.abs(skewY) * SKEW_INTENSITY * ISOMETRIC_SCALE_FACTOR)
      },
      bottomRight: {
        x: corners.bottomRight.x + (corners.bottomRight.y - center.y) * Math.tan(isoAngleRad) * skewX * SKEW_INTENSITY,
        y: corners.bottomRight.y * (1 + Math.abs(skewY) * SKEW_INTENSITY * ISOMETRIC_SCALE_FACTOR)
      }
    };
  }
  
  return {
    topLeft: {
      x: corners.topLeft.x - skewX * NON_ISOMETRIC_SKEW_FACTOR,
      y: corners.topLeft.y - skewY * NON_ISOMETRIC_SKEW_FACTOR
    },
    topRight: {
      x: corners.topRight.x + skewX * NON_ISOMETRIC_SKEW_FACTOR,
      y: corners.topRight.y - skewY * NON_ISOMETRIC_SKEW_FACTOR
    },
    bottomLeft: {
      x: corners.bottomLeft.x - skewX * NON_ISOMETRIC_SKEW_FACTOR,
      y: corners.bottomLeft.y + skewY * NON_ISOMETRIC_SKEW_FACTOR
    },
    bottomRight: {
      x: corners.bottomRight.x + skewX * NON_ISOMETRIC_SKEW_FACTOR,
      y: corners.bottomRight.y + skewY * NON_ISOMETRIC_SKEW_FACTOR
    }
  };
}

/**
 * Infer Dimensions Algorithm
 * 
 * This algorithm attempts to find the optimal pixel pitch (grid dimensions) for an image
 * that appears to be upscaled pixel art. It works by:
 * 1. Detecting edges/color transitions in the source image
 * 2. Finding the periodicity of these transitions (the implied pixel size)
 * 3. Optimizing for grid alignment that minimizes variance within cells
 * 
 * The key insight is that well-aligned pixel art will have uniform colors within each
 * "implied pixel" cell, so we minimize the variance of colors within cells.
 */

export interface InferDimensionsResult {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  confidence: number;
}

export interface InferDimensionsProgress {
  progress: number;  // 0-100
  phase: string;     // Description of current phase
  currentBest?: { width: number; height: number };
}

/**
 * Calculate the variance of colors within a cell.
 * Lower variance means pixels are more uniform (better alignment).
 */
function calculateCellVariance(
  imageData: ImageData,
  startX: number,
  startY: number,
  cellWidth: number,
  cellHeight: number
): number {
  const pixels: RGBA[] = [];
  
  const endX = Math.min(startX + cellWidth, imageData.width);
  const endY = Math.min(startY + cellHeight, imageData.height);
  
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const idx = (Math.floor(y) * imageData.width + Math.floor(x)) * 4;
      if (idx >= 0 && idx < imageData.data.length - 3) {
        pixels.push({
          r: imageData.data[idx]!,
          g: imageData.data[idx + 1]!,
          b: imageData.data[idx + 2]!,
          a: imageData.data[idx + 3]!
        });
      }
    }
  }
  
  if (pixels.length < 2) return 0;
  
  // Calculate mean
  let sumR = 0, sumG = 0, sumB = 0;
  for (const p of pixels) {
    sumR += p.r;
    sumG += p.g;
    sumB += p.b;
  }
  const n = pixels.length;
  const meanR = sumR / n;
  const meanG = sumG / n;
  const meanB = sumB / n;
  
  // Calculate variance
  let variance = 0;
  for (const p of pixels) {
    variance += (p.r - meanR) ** 2 + (p.g - meanG) ** 2 + (p.b - meanB) ** 2;
  }
  
  return variance / n;
}

/**
 * Calculate the total variance score for a given grid configuration.
 * Samples cells across the image and sums their variances.
 */
function calculateGridScore(
  imageData: ImageData,
  gridWidth: number,
  gridHeight: number,
  offsetX: number,
  offsetY: number,
  sampleRatio: number = 0.2
): number {
  const cellWidth = imageData.width / gridWidth;
  const cellHeight = imageData.height / gridHeight;
  
  // Determine how many cells to sample
  const totalCells = gridWidth * gridHeight;
  const sampleCount = Math.max(10, Math.floor(totalCells * sampleRatio));
  const step = Math.max(1, Math.floor(totalCells / sampleCount));
  
  let totalVariance = 0;
  let cellCount = 0;
  
  for (let i = 0; i < totalCells; i += step) {
    const cellX = i % gridWidth;
    const cellY = Math.floor(i / gridWidth);
    
    const startX = offsetX + cellX * cellWidth;
    const startY = offsetY + cellY * cellHeight;
    
    // Skip cells that are out of bounds
    if (startX < 0 || startY < 0 || startX >= imageData.width || startY >= imageData.height) {
      continue;
    }
    
    totalVariance += calculateCellVariance(imageData, startX, startY, cellWidth, cellHeight);
    cellCount++;
  }
  
  return cellCount > 0 ? totalVariance / cellCount : Infinity;
}

/**
 * Find the optimal offset for a given grid size by testing multiple offsets.
 */
function findOptimalOffset(
  imageData: ImageData,
  gridWidth: number,
  gridHeight: number,
  offsetSteps: number = 8
): { offsetX: number; offsetY: number; score: number } {
  const cellWidth = imageData.width / gridWidth;
  const cellHeight = imageData.height / gridHeight;
  
  let bestOffset = { offsetX: 0, offsetY: 0, score: Infinity };
  
  // Test different offsets within one cell
  for (let ox = 0; ox < offsetSteps; ox++) {
    for (let oy = 0; oy < offsetSteps; oy++) {
      const offsetX = (ox / offsetSteps) * cellWidth;
      const offsetY = (oy / offsetSteps) * cellHeight;
      
      const score = calculateGridScore(imageData, gridWidth, gridHeight, offsetX, offsetY, 0.15);
      
      if (score < bestOffset.score) {
        bestOffset = { offsetX, offsetY, score };
      }
    }
  }
  
  return bestOffset;
}

/**
 * Detect if the image has a dominant "pixel size" by analyzing edge frequencies.
 * Returns an estimate of the pixel pitch.
 */
function detectPixelPitch(imageData: ImageData): { pitchX: number; pitchY: number } {
  const width = imageData.width;
  const height = imageData.height;
  
  // Calculate horizontal differences (detect vertical edges)
  const hEdges: number[] = new Array(width).fill(0);
  for (let y = 0; y < height; y++) {
    for (let x = 1; x < width; x++) {
      const idx1 = (y * width + x - 1) * 4;
      const idx2 = (y * width + x) * 4;
      
      const diff = Math.abs(imageData.data[idx1]! - imageData.data[idx2]!) +
                   Math.abs(imageData.data[idx1 + 1]! - imageData.data[idx2 + 1]!) +
                   Math.abs(imageData.data[idx1 + 2]! - imageData.data[idx2 + 2]!);
      
      hEdges[x] = (hEdges[x] ?? 0) + diff;
    }
  }
  
  // Calculate vertical differences (detect horizontal edges)
  const vEdges: number[] = new Array(height).fill(0);
  for (let y = 1; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx1 = ((y - 1) * width + x) * 4;
      const idx2 = (y * width + x) * 4;
      
      const diff = Math.abs(imageData.data[idx1]! - imageData.data[idx2]!) +
                   Math.abs(imageData.data[idx1 + 1]! - imageData.data[idx2 + 1]!) +
                   Math.abs(imageData.data[idx1 + 2]! - imageData.data[idx2 + 2]!);
      
      vEdges[y] = (vEdges[y] ?? 0) + diff;
    }
  }
  
  // Find periodicity in edge patterns using autocorrelation
  const findPeriod = (edges: number[], maxPeriod: number): number => {
    let bestPeriod = 1;
    let bestScore = 0;
    
    for (let period = 4; period <= maxPeriod; period++) {
      let correlation = 0;
      let count = 0;
      
      for (let i = period; i < edges.length; i++) {
        correlation += (edges[i] ?? 0) * (edges[i - period] ?? 0);
        count++;
      }
      
      if (count > 0) {
        const score = correlation / count;
        if (score > bestScore) {
          bestScore = score;
          bestPeriod = period;
        }
      }
    }
    
    return bestPeriod;
  };
  
  const pitchX = findPeriod(hEdges, Math.min(100, Math.floor(width / 4)));
  const pitchY = findPeriod(vEdges, Math.min(100, Math.floor(height / 4)));
  
  return { pitchX, pitchY };
}

/**
 * Main function to infer optimal dimensions for the image.
 * This runs an optimization process to find the best grid size.
 * 
 * @param sourceImage - The source image element
 * @param corners - The current grid corners (used to extract the region of interest)
 * @param currentWidth - Current output width as starting point
 * @param currentHeight - Current output height as starting point
 * @param onProgress - Callback for progress updates
 * @returns The inferred dimensions
 */
export async function inferDimensions(
  sourceImage: HTMLImageElement,
  corners: GridCorners,
  currentWidth: number,
  currentHeight: number,
  onProgress?: (progress: InferDimensionsProgress) => void
): Promise<InferDimensionsResult> {
  // Create a canvas to get image data from the selected region
  const tempCanvas = document.createElement("canvas");
  
  // Calculate the bounding box of the corners
  const minX = Math.min(corners.topLeft.x, corners.bottomLeft.x);
  const maxX = Math.max(corners.topRight.x, corners.bottomRight.x);
  const minY = Math.min(corners.topLeft.y, corners.topRight.y);
  const maxY = Math.max(corners.bottomLeft.y, corners.bottomRight.y);
  
  const regionWidth = maxX - minX;
  const regionHeight = maxY - minY;
  
  // Use the full image for analysis
  tempCanvas.width = sourceImage.naturalWidth;
  tempCanvas.height = sourceImage.naturalHeight;
  const tempCtx = tempCanvas.getContext("2d");
  
  if (!tempCtx) {
    return {
      width: currentWidth,
      height: currentHeight,
      offsetX: 0,
      offsetY: 0,
      confidence: 0
    };
  }
  
  tempCtx.drawImage(sourceImage, 0, 0);
  const imageData = tempCtx.getImageData(
    Math.max(0, Math.floor(minX)),
    Math.max(0, Math.floor(minY)),
    Math.min(Math.floor(regionWidth), sourceImage.naturalWidth),
    Math.min(Math.floor(regionHeight), sourceImage.naturalHeight)
  );
  
  onProgress?.({ progress: 5, phase: "Analyzing image structure..." });
  
  // Allow UI to update
  await new Promise(resolve => setTimeout(resolve, 0));
  
  // Phase 1: Detect initial pitch estimate from edge patterns
  const { pitchX, pitchY } = detectPixelPitch(imageData);
  
  // Calculate initial grid size estimates
  const estimatedWidth = Math.round(imageData.width / pitchX);
  const estimatedHeight = Math.round(imageData.height / pitchY);
  
  onProgress?.({
    progress: 15,
    phase: "Initial estimate: " + estimatedWidth + "×" + estimatedHeight,
    currentBest: { width: estimatedWidth, height: estimatedHeight }
  });
  
  await new Promise(resolve => setTimeout(resolve, 0));
  
  // Phase 2: Coarse search around the estimate and current size
  const searchRanges = {
    minW: Math.max(4, Math.min(estimatedWidth, currentWidth) - 20),
    maxW: Math.min(256, Math.max(estimatedWidth, currentWidth) + 20),
    minH: Math.max(4, Math.min(estimatedHeight, currentHeight) - 20),
    maxH: Math.min(256, Math.max(estimatedHeight, currentHeight) + 20)
  };
  
  let bestResult = {
    width: currentWidth,
    height: currentHeight,
    offsetX: 0,
    offsetY: 0,
    score: Infinity
  };
  
  // Coarse search with step of 2
  const coarseStep = 2;
  const totalCoarseIterations = 
    Math.ceil((searchRanges.maxW - searchRanges.minW) / coarseStep) *
    Math.ceil((searchRanges.maxH - searchRanges.minH) / coarseStep);
  
  let coarseIteration = 0;
  
  for (let w = searchRanges.minW; w <= searchRanges.maxW; w += coarseStep) {
    for (let h = searchRanges.minH; h <= searchRanges.maxH; h += coarseStep) {
      coarseIteration++;
      
      // Quick score without offset optimization
      const score = calculateGridScore(imageData, w, h, 0, 0, 0.1);
      
      if (score < bestResult.score) {
        bestResult = { width: w, height: h, offsetX: 0, offsetY: 0, score };
      }
      
      // Update progress periodically
      if (coarseIteration % 50 === 0) {
        const progress = 15 + (coarseIteration / totalCoarseIterations) * 35;
        onProgress?.({
          progress,
          phase: `Coarse search: testing ${w}×${h}`,
          currentBest: { width: bestResult.width, height: bestResult.height }
        });
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }
  
  onProgress?.({
    progress: 50,
    phase: `Coarse search complete. Best: ${bestResult.width}×${bestResult.height}`,
    currentBest: { width: bestResult.width, height: bestResult.height }
  });
  
  await new Promise(resolve => setTimeout(resolve, 0));
  
  // Phase 3: Fine search around the best coarse result
  const fineSearchRange = 5;
  const fineRanges = {
    minW: Math.max(4, bestResult.width - fineSearchRange),
    maxW: Math.min(256, bestResult.width + fineSearchRange),
    minH: Math.max(4, bestResult.height - fineSearchRange),
    maxH: Math.min(256, bestResult.height + fineSearchRange)
  };
  
  const totalFineIterations = (fineRanges.maxW - fineRanges.minW + 1) * (fineRanges.maxH - fineRanges.minH + 1);
  let fineIteration = 0;
  
  for (let w = fineRanges.minW; w <= fineRanges.maxW; w++) {
    for (let h = fineRanges.minH; h <= fineRanges.maxH; h++) {
      fineIteration++;
      
      // Find optimal offset for this grid size
      const { offsetX, offsetY, score } = findOptimalOffset(imageData, w, h, 8);
      
      if (score < bestResult.score) {
        bestResult = { width: w, height: h, offsetX, offsetY, score };
      }
      
      // Update progress
      const progress = 50 + (fineIteration / totalFineIterations) * 40;
      if (fineIteration % 10 === 0) {
        onProgress?.({
          progress,
          phase: `Fine search: testing ${w}×${h}`,
          currentBest: { width: bestResult.width, height: bestResult.height }
        });
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }
  
  // Phase 4: Final offset optimization with higher resolution
  onProgress?.({
    progress: 92,
    phase: `Optimizing alignment for ${bestResult.width}×${bestResult.height}`,
    currentBest: { width: bestResult.width, height: bestResult.height }
  });
  
  await new Promise(resolve => setTimeout(resolve, 0));
  
  const finalOffset = findOptimalOffset(imageData, bestResult.width, bestResult.height, 16);
  bestResult.offsetX = finalOffset.offsetX;
  bestResult.offsetY = finalOffset.offsetY;
  bestResult.score = finalOffset.score;
  
  // Calculate confidence based on how much better the best result is compared to alternatives
  // Lower score = better alignment, confidence is inverse of normalized score
  const baselineScore = calculateGridScore(imageData, currentWidth, currentHeight, 0, 0, 0.2);
  const improvement = baselineScore > 0 ? (baselineScore - bestResult.score) / baselineScore : 0;
  const confidence = Math.max(0, Math.min(1, improvement + 0.5));
  
  onProgress?.({
    progress: 100,
    phase: `Complete: ${bestResult.width}×${bestResult.height}`,
    currentBest: { width: bestResult.width, height: bestResult.height }
  });
  
  return {
    width: bestResult.width,
    height: bestResult.height,
    offsetX: bestResult.offsetX,
    offsetY: bestResult.offsetY,
    confidence
  };
}
