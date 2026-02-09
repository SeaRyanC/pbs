/**
 * Bead-based pixelation algorithm using hill-climbing random-lot-casting approach
 */

interface Point {
  x: number;
  y: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}

class Bead {
  centerX: number;
  centerY: number;
  size: number; // size is always odd (5, 7, 9, etc.)
  color: RGB;
  
  constructor(centerX: number, centerY: number, size: number, color: RGB) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.size = size;
    this.color = color;
  }
  
  get left(): number {
    return this.centerX - Math.floor(this.size / 2);
  }
  
  get right(): number {
    return this.centerX + Math.floor(this.size / 2);
  }
  
  get top(): number {
    return this.centerY - Math.floor(this.size / 2);
  }
  
  get bottom(): number {
    return this.centerY + Math.floor(this.size / 2);
  }
  
  contains(x: number, y: number): boolean {
    return x >= this.left && x <= this.right && y >= this.top && y <= this.bottom;
  }
  
  inExclusionZone(x: number, y: number, exclusionZoneSize: number): boolean {
    const exLeft = this.left - exclusionZoneSize;
    const exRight = this.right + exclusionZoneSize;
    const exTop = this.top - exclusionZoneSize;
    const exBottom = this.bottom + exclusionZoneSize;
    
    return x >= exLeft && x <= exRight && y >= exTop && y <= exBottom && !this.contains(x, y);
  }
}

interface ImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

class BeadPixelator {
  private imageData: ImageData;
  private beads: Bead[] = [];
  private claimedMask: Uint8Array; // 0 = free, 1 = in bead, 2 = in exclusion zone
  private minBeadSize: number;
  private colorThreshold: number;
  private exclusionZoneSize: number;
  private debugImages: Map<string, ImageData> = new Map();
  
  constructor(
    imageData: ImageData,
    minBeadSize: number = 7,
    colorThreshold: number = 20,
    exclusionZoneSize: number = 2
  ) {
    this.imageData = imageData;
    this.minBeadSize = minBeadSize;
    this.colorThreshold = colorThreshold;
    this.exclusionZoneSize = exclusionZoneSize;
    this.claimedMask = new Uint8Array(imageData.width * imageData.height);
  }
  
  private pixelIndex(x: number, y: number): number {
    return y * this.imageData.width + x;
  }
  
  private getPixel(x: number, y: number): RGB | null {
    if (x < 0 || x >= this.imageData.width || y < 0 || y >= this.imageData.height) {
      return null;
    }
    const idx = (y * this.imageData.width + x) * 4;
    return {
      r: this.imageData.data[idx]!,
      g: this.imageData.data[idx + 1]!,
      b: this.imageData.data[idx + 2]!,
      a: this.imageData.data[idx + 3]!
    };
  }
  
  private colorDistance(c1: RGB, c2: RGB): number {
    // Euclidean distance in RGB space
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }
  
  private colorsMatch(c1: RGB | null, c2: RGB | null): boolean {
    if (!c1 || !c2) return false;
    return this.colorDistance(c1, c2) <= this.colorThreshold;
  }
  
  private isPixelClaimed(x: number, y: number): boolean {
    if (x < 0 || x >= this.imageData.width || y < 0 || y >= this.imageData.height) {
      return true; // Out of bounds is considered claimed
    }
    return this.claimedMask[this.pixelIndex(x, y)] !== 0;
  }
  
  private isPixelInBead(x: number, y: number): boolean {
    if (x < 0 || x >= this.imageData.width || y < 0 || y >= this.imageData.height) {
      return false;
    }
    return this.claimedMask[this.pixelIndex(x, y)] === 1;
  }
  
  private isPixelInExclusionZone(x: number, y: number): boolean {
    if (x < 0 || x >= this.imageData.width || y < 0 || y >= this.imageData.height) {
      return false;
    }
    return this.claimedMask[this.pixelIndex(x, y)] === 2;
  }
  
  private canPlaceBead(centerX: number, centerY: number, size: number): RGB | null {
    const halfSize = Math.floor(size / 2);
    
    // Check bounds
    if (centerX - halfSize < 0 || centerX + halfSize >= this.imageData.width ||
        centerY - halfSize < 0 || centerY + halfSize >= this.imageData.height) {
      return null;
    }
    
    // Get center color
    const centerColor = this.getPixel(centerX, centerY);
    if (!centerColor) return null;
    
    // Check if center is already in a bead
    if (this.isPixelInBead(centerX, centerY)) return null;
    
    // Check four corners
    const corners: [number, number][] = [
      [centerX - halfSize, centerY - halfSize],
      [centerX + halfSize, centerY - halfSize],
      [centerX - halfSize, centerY + halfSize],
      [centerX + halfSize, centerY + halfSize]
    ];
    
    for (const [cx, cy] of corners) {
      const cornerColor = this.getPixel(cx, cy);
      if (!cornerColor || !this.colorsMatch(centerColor, cornerColor)) {
        return null;
      }
      if (this.isPixelInBead(cx, cy)) {
        return null;
      }
    }
    
    // Check entire bounding box
    for (let y = centerY - halfSize; y <= centerY + halfSize; y++) {
      for (let x = centerX - halfSize; x <= centerX + halfSize; x++) {
        const pixelColor = this.getPixel(x, y);
        if (!pixelColor || !this.colorsMatch(centerColor, pixelColor)) {
          return null;
        }
        if (this.isPixelInBead(x, y)) {
          return null;
        }
      }
    }
    
    return centerColor;
  }
  
  private isProperlyBordered(bead: Bead): boolean {
    // Check if at least some pixels past the exclusion zone are a different color
    let foundDifferentColor = false;
    const exSize = this.exclusionZoneSize;
    
    // Check pixels just outside the exclusion zone
    const checkLeft = bead.left - exSize - 1;
    const checkRight = bead.right + exSize + 1;
    const checkTop = bead.top - exSize - 1;
    const checkBottom = bead.bottom + exSize + 1;
    
    // Check top and bottom edges
    for (let x = checkLeft; x <= checkRight; x++) {
      const topColor = this.getPixel(x, checkTop);
      const bottomColor = this.getPixel(x, checkBottom);
      
      if (topColor && !this.colorsMatch(bead.color, topColor)) {
        foundDifferentColor = true;
      }
      if (bottomColor && !this.colorsMatch(bead.color, bottomColor)) {
        foundDifferentColor = true;
      }
      
      // Pixels in other beads are considered different
      if (this.isPixelInBead(x, checkTop) || this.isPixelInExclusionZone(x, checkTop)) {
        foundDifferentColor = true;
      }
      if (this.isPixelInBead(x, checkBottom) || this.isPixelInExclusionZone(x, checkBottom)) {
        foundDifferentColor = true;
      }
    }
    
    // Check left and right edges
    for (let y = checkTop; y <= checkBottom; y++) {
      const leftColor = this.getPixel(checkLeft, y);
      const rightColor = this.getPixel(checkRight, y);
      
      if (leftColor && !this.colorsMatch(bead.color, leftColor)) {
        foundDifferentColor = true;
      }
      if (rightColor && !this.colorsMatch(bead.color, rightColor)) {
        foundDifferentColor = true;
      }
      
      // Pixels in other beads are considered different
      if (this.isPixelInBead(checkLeft, y) || this.isPixelInExclusionZone(checkLeft, y)) {
        foundDifferentColor = true;
      }
      if (this.isPixelInBead(checkRight, y) || this.isPixelInExclusionZone(checkRight, y)) {
        foundDifferentColor = true;
      }
    }
    
    return foundDifferentColor;
  }
  
  private tryGrowBead(bead: Bead): Bead | null {
    const newSize = bead.size + 2;
    const color = this.canPlaceBead(bead.centerX, bead.centerY, newSize);
    if (!color) return null;
    
    const newBead = new Bead(bead.centerX, bead.centerY, newSize, color);
    if (this.isProperlyBordered(newBead)) {
      return newBead;
    }
    return null;
  }
  
  private tryGrowBeadUpLeft(bead: Bead): Bead | null {
    // Grow up and to the left while keeping right and bottom edges stationary
    const newSize = bead.size + 2;
    const halfSize = Math.floor(bead.size / 2);
    const newHalfSize = Math.floor(newSize / 2);
    const offset = newHalfSize - halfSize;
    
    // New center is shifted up and left
    const newCenterX = bead.centerX - offset;
    const newCenterY = bead.centerY - offset;
    
    const color = this.canPlaceBead(newCenterX, newCenterY, newSize);
    if (!color) return null;
    
    const newBead = new Bead(newCenterX, newCenterY, newSize, color);
    
    // Verify right and bottom edges stayed the same
    if (newBead.right !== bead.right || newBead.bottom !== bead.bottom) {
      return null;
    }
    
    if (this.isProperlyBordered(newBead)) {
      return newBead;
    }
    return null;
  }
  
  private tryMoveBead(bead: Bead, dx: number, dy: number): Bead | null {
    const newCenterX = bead.centerX + dx;
    const newCenterY = bead.centerY + dy;
    
    const color = this.canPlaceBead(newCenterX, newCenterY, bead.size);
    if (!color) return null;
    
    const newBead = new Bead(newCenterX, newCenterY, bead.size, color);
    if (this.isProperlyBordered(newBead)) {
      return newBead;
    }
    return null;
  }
  
  private optimizeBead(initialBead: Bead): Bead {
    let bead = initialBead;
    let improved = true;
    
    while (improved) {
      improved = false;
      
      // Try growing (centered)
      let grownBead = this.tryGrowBead(bead);
      while (grownBead) {
        bead = grownBead;
        improved = true;
        grownBead = this.tryGrowBead(bead);
      }
      
      // Try moving right
      let movedBead = this.tryMoveBead(bead, 1, 0);
      while (movedBead) {
        bead = movedBead;
        improved = true;
        movedBead = this.tryMoveBead(bead, 1, 0);
      }
      
      // Try moving down
      movedBead = this.tryMoveBead(bead, 0, 1);
      while (movedBead) {
        bead = movedBead;
        improved = true;
        movedBead = this.tryMoveBead(bead, 0, 1);
      }
      
      // Try growing up and to the left (keeping right/bottom stationary)
      let grownUpLeftBead = this.tryGrowBeadUpLeft(bead);
      while (grownUpLeftBead) {
        bead = grownUpLeftBead;
        improved = true;
        grownUpLeftBead = this.tryGrowBeadUpLeft(bead);
      }
    }
    
    return bead;
  }
  
  private addBead(bead: Bead): void {
    this.beads.push(bead);
    
    // Mark all pixels in this bead as claimed (value = 1)
    for (let y = bead.top; y <= bead.bottom; y++) {
      for (let x = bead.left; x <= bead.right; x++) {
        if (x >= 0 && x < this.imageData.width && y >= 0 && y < this.imageData.height) {
          this.claimedMask[this.pixelIndex(x, y)] = 1;
        }
      }
    }
    
    // Mark exclusion zone (value = 2)
    const exLeft = bead.left - this.exclusionZoneSize;
    const exRight = bead.right + this.exclusionZoneSize;
    const exTop = bead.top - this.exclusionZoneSize;
    const exBottom = bead.bottom + this.exclusionZoneSize;
    
    for (let y = exTop; y <= exBottom; y++) {
      for (let x = exLeft; x <= exRight; x++) {
        if (x >= 0 && x < this.imageData.width && y >= 0 && y < this.imageData.height) {
          // Only mark as exclusion zone if not already in a bead
          if (this.claimedMask[this.pixelIndex(x, y)] === 0) {
            this.claimedMask[this.pixelIndex(x, y)] = 2;
          }
        }
      }
    }
  }
  
  private getMedianColor(bead: Bead): RGB {
    const colors: RGB[] = [];
    
    for (let y = bead.top; y <= bead.bottom; y++) {
      for (let x = bead.left; x <= bead.right; x++) {
        const color = this.getPixel(x, y);
        if (color) colors.push(color);
      }
    }
    
    if (colors.length === 0) return { r: 0, g: 0, b: 0, a: 255 };
    
    colors.sort((a, b) => (a.r + a.g + a.b) - (b.r + b.g + b.b));
    return colors[Math.floor(colors.length / 2)]!;
  }
  
  public process(): void {
    console.log('Starting bead placement with probing grid...');
    let placedBeads = 0;
    
    // Walk through the image with a probing grid
    const stride = this.minBeadSize;
    
    for (let gridY = 0; gridY < this.imageData.height - stride; gridY += stride) {
      for (let gridX = 0; gridX < this.imageData.width - stride; gridX += stride) {
        // Check the four corners of the probing grid
        const corners: [number, number][] = [
          [gridX, gridY],
          [gridX + stride, gridY],
          [gridX, gridY + stride],
          [gridX + stride, gridY + stride]
        ];
        
        // Check if we already have beads at these corners
        let hasExistingBead = false;
        for (const [cx, cy] of corners) {
          if (this.isPixelInBead(cx, cy)) {
            hasExistingBead = true;
            break;
          }
        }
        
        if (hasExistingBead) continue;
        
        // Count different colors at the corners
        const cornerColors: (RGB | null)[] = corners.map(([x, y]) => this.getPixel(x, y));
        const differentColors = this.countDifferentColors(cornerColors.filter(c => c !== null) as RGB[]);
        
        // Need at least 3 different colors to be a useful spot
        if (differentColors < 3) continue;
        
        // Initialize beads on each corner and optimize them away from center
        const centerX = gridX + stride / 2;
        const centerY = gridY + stride / 2;
        
        for (const [cx, cy] of corners) {
          // Skip if this corner is already claimed
          if (this.isPixelClaimed(cx, cy)) continue;
          
          // Try to place a bead at this corner
          const color = this.canPlaceBead(cx, cy, this.minBeadSize);
          if (!color) continue;
          
          const initialBead = new Bead(cx, cy, this.minBeadSize, color);
          
          // Check if properly bordered
          if (!this.isProperlyBordered(initialBead)) continue;
          
          // Optimize the bead, moving it away from the grid center
          const optimizedBead = this.optimizeBeadAwayFrom(initialBead, centerX, centerY);
          
          // Add the bead
          this.addBead(optimizedBead);
          placedBeads++;
          
          if (placedBeads % 100 === 0) {
            console.log(`Placed ${placedBeads} beads`);
          }
        }
      }
    }
    
    console.log(`Finished: placed ${placedBeads} beads`);
    const claimedPixels = this.claimedMask.filter(v => v !== 0).length;
    console.log(`Coverage: ${(claimedPixels / (this.imageData.width * this.imageData.height) * 100).toFixed(1)}%`);
    
    this.createDebugImage('01-beads-placed');
    this.createExclusionZoneDebug('02-exclusion-zones');
    this.createBeadSizeHeatmap('03-bead-size-heatmap');
    this.createCoverageMap('04-coverage-map');
  }
  
  private countDifferentColors(colors: RGB[]): number {
    if (colors.length === 0) return 0;
    
    const uniqueColors: RGB[] = [];
    for (const color of colors) {
      let isDifferent = true;
      for (const unique of uniqueColors) {
        if (this.colorsMatch(color, unique)) {
          isDifferent = false;
          break;
        }
      }
      if (isDifferent) {
        uniqueColors.push(color);
      }
    }
    return uniqueColors.length;
  }
  
  private optimizeBeadAwayFrom(initialBead: Bead, centerX: number, centerY: number): Bead {
    let bead = initialBead;
    let improved = true;
    
    // Determine direction to move away from center
    const moveRight = bead.centerX > centerX;
    const moveDown = bead.centerY > centerY;
    
    while (improved) {
      improved = false;
      
      // Try growing (centered)
      let grownBead = this.tryGrowBead(bead);
      while (grownBead) {
        bead = grownBead;
        improved = true;
        grownBead = this.tryGrowBead(bead);
      }
      
      // Try moving away from center
      if (moveRight) {
        let movedBead = this.tryMoveBead(bead, 1, 0);
        while (movedBead) {
          bead = movedBead;
          improved = true;
          movedBead = this.tryMoveBead(bead, 1, 0);
        }
      } else {
        let movedBead = this.tryMoveBead(bead, -1, 0);
        while (movedBead) {
          bead = movedBead;
          improved = true;
          movedBead = this.tryMoveBead(bead, -1, 0);
        }
      }
      
      if (moveDown) {
        let movedBead = this.tryMoveBead(bead, 0, 1);
        while (movedBead) {
          bead = movedBead;
          improved = true;
          movedBead = this.tryMoveBead(bead, 0, 1);
        }
      } else {
        let movedBead = this.tryMoveBead(bead, 0, -1);
        while (movedBead) {
          bead = movedBead;
          improved = true;
          movedBead = this.tryMoveBead(bead, 0, -1);
        }
      }
      
      // Try growing up and to the left (keeping right/bottom stationary)
      let grownUpLeftBead = this.tryGrowBeadUpLeft(bead);
      while (grownUpLeftBead) {
        bead = grownUpLeftBead;
        improved = true;
        grownUpLeftBead = this.tryGrowBeadUpLeft(bead);
      }
    }
    
    return bead;
  }
  
  private createDebugImage(name: string): void {
    const debugData = new Uint8ClampedArray(this.imageData.width * this.imageData.height * 4);
    
    // Copy original image
    debugData.set(this.imageData.data);
    
    // Draw bead boundaries
    for (const bead of this.beads) {
      // Draw border
      for (let x = bead.left; x <= bead.right; x++) {
        this.setDebugPixel(debugData, x, bead.top, { r: 255, g: 0, b: 0, a: 255 });
        this.setDebugPixel(debugData, x, bead.bottom, { r: 255, g: 0, b: 0, a: 255 });
      }
      for (let y = bead.top; y <= bead.bottom; y++) {
        this.setDebugPixel(debugData, bead.left, y, { r: 255, g: 0, b: 0, a: 255 });
        this.setDebugPixel(debugData, bead.right, y, { r: 255, g: 0, b: 0, a: 255 });
      }
      
      // Mark center
      this.setDebugPixel(debugData, bead.centerX, bead.centerY, { r: 0, g: 255, b: 0, a: 255 });
    }
    
    this.debugImages.set(name, {
      width: this.imageData.width,
      height: this.imageData.height,
      data: debugData
    });
  }
  
  private setDebugPixel(data: Uint8ClampedArray, x: number, y: number, color: RGB): void {
    if (x < 0 || x >= this.imageData.width || y < 0 || y >= this.imageData.height) return;
    const idx = (y * this.imageData.width + x) * 4;
    data[idx] = color.r;
    data[idx + 1] = color.g;
    data[idx + 2] = color.b;
    data[idx + 3] = color.a;
  }
  
  private createExclusionZoneDebug(name: string): void {
    const debugData = new Uint8ClampedArray(this.imageData.width * this.imageData.height * 4);
    
    // Color code the mask: green = free, red = in bead, yellow = exclusion zone
    for (let y = 0; y < this.imageData.height; y++) {
      for (let x = 0; x < this.imageData.width; x++) {
        const idx = (y * this.imageData.width + x) * 4;
        const maskValue = this.claimedMask[this.pixelIndex(x, y)];
        
        if (maskValue === 0) {
          // Free - dark green
          debugData[idx] = 0;
          debugData[idx + 1] = 64;
          debugData[idx + 2] = 0;
          debugData[idx + 3] = 255;
        } else if (maskValue === 1) {
          // In bead - red
          debugData[idx] = 255;
          debugData[idx + 1] = 0;
          debugData[idx + 2] = 0;
          debugData[idx + 3] = 255;
        } else {
          // Exclusion zone - yellow
          debugData[idx] = 255;
          debugData[idx + 1] = 255;
          debugData[idx + 2] = 0;
          debugData[idx + 3] = 255;
        }
      }
    }
    
    this.debugImages.set(name, {
      width: this.imageData.width,
      height: this.imageData.height,
      data: debugData
    });
  }
  
  private createBeadSizeHeatmap(name: string): void {
    const debugData = new Uint8ClampedArray(this.imageData.width * this.imageData.height * 4);
    
    // Fill with black background
    debugData.fill(255);
    
    // Color each bead based on its size
    for (const bead of this.beads) {
      // Map size to color: smaller = blue, larger = red
      const normalizedSize = (bead.size - this.minBeadSize) / (50 - this.minBeadSize);
      const hue = (1 - Math.min(1, normalizedSize)) * 240; // 240 (blue) to 0 (red)
      
      const color = this.hslToRgb(hue / 360, 0.8, 0.5);
      
      for (let y = bead.top; y <= bead.bottom; y++) {
        for (let x = bead.left; x <= bead.right; x++) {
          this.setDebugPixel(debugData, x, y, color);
        }
      }
      
      // Draw border in white
      for (let x = bead.left; x <= bead.right; x++) {
        this.setDebugPixel(debugData, x, bead.top, { r: 255, g: 255, b: 255, a: 255 });
        this.setDebugPixel(debugData, x, bead.bottom, { r: 255, g: 255, b: 255, a: 255 });
      }
      for (let y = bead.top; y <= bead.bottom; y++) {
        this.setDebugPixel(debugData, bead.left, y, { r: 255, g: 255, b: 255, a: 255 });
        this.setDebugPixel(debugData, bead.right, y, { r: 255, g: 255, b: 255, a: 255 });
      }
    }
    
    this.debugImages.set(name, {
      width: this.imageData.width,
      height: this.imageData.height,
      data: debugData
    });
  }
  
  private createCoverageMap(name: string): void {
    const debugData = new Uint8ClampedArray(this.imageData.width * this.imageData.height * 4);
    
    // Copy original image
    debugData.set(this.imageData.data);
    
    // Overlay semi-transparent red on unclaimed pixels
    for (let y = 0; y < this.imageData.height; y++) {
      for (let x = 0; x < this.imageData.width; x++) {
        const idx = (y * this.imageData.width + x) * 4;
        if (this.claimedMask[this.pixelIndex(x, y)] === 0) {
          // Unclaimed - overlay red
          debugData[idx] = Math.min(255, debugData[idx]! + 100);
          debugData[idx + 1] = Math.max(0, debugData[idx + 1]! - 50);
          debugData[idx + 2] = Math.max(0, debugData[idx + 2]! - 50);
        }
      }
    }
    
    this.debugImages.set(name, {
      width: this.imageData.width,
      height: this.imageData.height,
      data: debugData
    });
  }
  
  private hslToRgb(h: number, s: number, l: number): RGB {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
      a: 255
    };
  }
  
  public inferPixelPitch(): number {
    // Collect all bead sizes
    const sizes = this.beads.map(b => b.size);
    
    if (sizes.length === 0) return this.minBeadSize;
    
    // Simple linear regression: find most common size as base
    const sizeCount = new Map<number, number>();
    for (const size of sizes) {
      sizeCount.set(size, (sizeCount.get(size) || 0) + 1);
    }
    
    // Find mode
    let maxCount = 0;
    let modeSize = this.minBeadSize;
    for (const [size, count] of sizeCount.entries()) {
      if (count > maxCount) {
        maxCount = count;
        modeSize = size;
      }
    }
    
    console.log('Bead size distribution:');
    const sortedSizes = Array.from(sizeCount.entries()).sort((a, b) => b[1] - a[1]);
    for (const [size, count] of sortedSizes.slice(0, 10)) {
      console.log(`  Size ${size}: ${count} beads (${(count / this.beads.length * 100).toFixed(1)}%)`);
    }
    
    console.log(`Inferred pixel pitch: ${modeSize} pixels per bead`);
    return modeSize;
  }
  
  public generateOutput(): ImageData {
    const pixelPitch = this.inferPixelPitch();
    
    // Determine bead types (1x1, 2x2, 3x3, etc.) and mark centerpoints
    interface BeadCenterPoint {
      x: number;
      y: number;
      gridSize: number; // 1 for 1x1, 2 for 2x2, etc.
      bead: Bead;
    }
    
    const beadCenters: BeadCenterPoint[] = [];
    
    for (const bead of this.beads) {
      const gridSize = Math.round(bead.size / pixelPitch);
      const actualGridSize = Math.max(1, gridSize);
      
      // For superbeads (2x2, 3x3, etc.), create multiple centerpoints
      if (actualGridSize === 1) {
        beadCenters.push({
          x: bead.centerX,
          y: bead.centerY,
          gridSize: 1,
          bead
        });
      } else {
        // Create centerpoints for each cell in the superbead
        const halfGridSize = Math.floor(actualGridSize / 2);
        for (let gy = 0; gy < actualGridSize; gy++) {
          for (let gx = 0; gx < actualGridSize; gx++) {
            const offsetX = (gx - halfGridSize) * pixelPitch;
            const offsetY = (gy - halfGridSize) * pixelPitch;
            beadCenters.push({
              x: bead.centerX + offsetX,
              y: bead.centerY + offsetY,
              gridSize: actualGridSize,
              bead
            });
          }
        }
      }
    }
    
    console.log(`Created ${beadCenters.length} bead centerpoints from ${this.beads.length} beads`);
    
    // Infer grid lines using least-squares regression
    const verticalLines = this.inferGridLines(beadCenters, true, pixelPitch);
    const horizontalLines = this.inferGridLines(beadCenters, false, pixelPitch);
    
    console.log(`Inferred ${verticalLines.length} vertical and ${horizontalLines.length} horizontal grid lines`);
    
    // Create output image based on the inferred grid
    const outputWidth = verticalLines.length - 1;
    const outputHeight = horizontalLines.length - 1;
    
    console.log(`Output dimensions: ${outputWidth}x${outputHeight}`);
    
    const outputData = new Uint8ClampedArray(outputWidth * outputHeight * 4);
    
    // Fill with transparent
    outputData.fill(0);
    
    // For each grid cell, find the bead that covers it
    for (let row = 0; row < outputHeight; row++) {
      for (let col = 0; col < outputWidth; col++) {
        // Each cell is bounded by adjacent grid lines
        // outputWidth = verticalLines.length - 1, so col+1 is always valid
        const leftLine = verticalLines[col]!;
        const rightLine = verticalLines[col + 1]!;
        const topLine = horizontalLines[row]!;
        const bottomLine = horizontalLines[row + 1]!;
        
        const cellCenterX = (leftLine + rightLine) / 2;
        const cellCenterY = (topLine + bottomLine) / 2;
        
        // Find the bead covering this cell
        let bestBead: Bead | null = null;
        let minDist = Infinity;
        
        for (const center of beadCenters) {
          if (center.bead.contains(Math.round(cellCenterX), Math.round(cellCenterY))) {
            const dist = Math.hypot(center.x - cellCenterX, center.y - cellCenterY);
            if (dist < minDist) {
              minDist = dist;
              bestBead = center.bead;
            }
          }
        }
        
        if (bestBead) {
          const medianColor = this.getMedianColor(bestBead);
          const idx = (row * outputWidth + col) * 4;
          outputData[idx] = medianColor.r;
          outputData[idx + 1] = medianColor.g;
          outputData[idx + 2] = medianColor.b;
          outputData[idx + 3] = medianColor.a;
        }
      }
    }
    
    // Create debug image showing the inferred grid
    this.createInferredGridDebug('05-inferred-grid', verticalLines, horizontalLines);
    
    return {
      width: outputWidth,
      height: outputHeight,
      data: outputData
    };
  }
  
  private inferGridLines(centers: Array<{x: number, y: number, gridSize: number, bead: Bead}>, vertical: boolean, pitch: number): number[] {
    // Extract coordinates (x for vertical, y for horizontal)
    const coords = centers.map(c => vertical ? c.x : c.y);
    
    if (coords.length === 0) return [0, vertical ? this.imageData.width : this.imageData.height];
    
    // Group coordinates by proximity
    // Threshold of 0.75 * pitch allows for slight variations while grouping nearby beads
    const GROUPING_THRESHOLD = 0.75;
    const groups: number[][] = [];
    const sortedCoords = [...coords].sort((a, b) => a - b);
    
    let currentGroup: number[] = [sortedCoords[0]!];
    for (let i = 1; i < sortedCoords.length; i++) {
      const coord = sortedCoords[i]!;
      const lastInGroup = currentGroup[currentGroup.length - 1]!;
      
      if (coord - lastInGroup < pitch * GROUPING_THRESHOLD) {
        currentGroup.push(coord);
      } else {
        groups.push(currentGroup);
        currentGroup = [coord];
      }
    }
    groups.push(currentGroup);
    
    // For each group, compute the average position (least-squares = mean for single dimension)
    const lines = groups.map(group => {
      const sum = group.reduce((a, b) => a + b, 0);
      return sum / group.length;
    });
    
    // Add boundary lines
    const dimension = vertical ? this.imageData.width : this.imageData.height;
    const result = [0, ...lines, dimension];
    
    return result.sort((a, b) => a - b);
  }
  
  private createInferredGridDebug(name: string, verticalLines: number[], horizontalLines: number[]): void {
    const debugData = new Uint8ClampedArray(this.imageData.width * this.imageData.height * 4);
    
    // Copy original image
    debugData.set(this.imageData.data);
    
    // Draw vertical lines
    for (const x of verticalLines) {
      const ix = Math.round(x);
      for (let y = 0; y < this.imageData.height; y++) {
        this.setDebugPixel(debugData, ix, y, { r: 0, g: 255, b: 0, a: 255 });
      }
    }
    
    // Draw horizontal lines
    for (const y of horizontalLines) {
      const iy = Math.round(y);
      for (let x = 0; x < this.imageData.width; x++) {
        this.setDebugPixel(debugData, x, iy, { r: 0, g: 255, b: 0, a: 255 });
      }
    }
    
    this.debugImages.set(name, {
      width: this.imageData.width,
      height: this.imageData.height,
      data: debugData
    });
  }
  
  public getDebugImages(): Map<string, ImageData> {
    return this.debugImages;
  }
}

export { BeadPixelator, Bead };
export type { ImageData, RGB };
