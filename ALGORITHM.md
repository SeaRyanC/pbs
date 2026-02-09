# Bead-Based Pixelation Algorithm

This document describes the hill-climbing random-lot-casting algorithm used to pixelate images.

## Overview

The algorithm treats the output image as if it were made of "beads" (like perler beads), where each bead represents a square region of similar-colored pixels in the input image. The algorithm intelligently discovers these beads and determines the optimal pixel pitch for the image.

## Key Concepts

### Bead
A **bead** is a square region in the input image where:
- All pixels within the bead have the same (or very similar) color
- The bead has a properly defined border (see below)
- Bead sizes are always odd numbers (5, 7, 9, 11, etc.)

### Exclusion Zone
An **exclusion zone** is a border around each bead (default: 2 pixels wide) where:
- No new beads can be placed
- This prevents beads from being placed too close to each other
- Helps handle edge artifacts in pixel art images

### Properly Bordered Bead
A bead is **properly bordered** if:
- All pixels inside its bounding box are the same color (within threshold)
- At least some pixels beyond its exclusion zone are a different color
- Pixels in other beads/exclusion zones count as "different color"

## Algorithm Steps

### 1. Random Bead Placement

```
while consecutive_failures < 10000:
    1. Pick a random pixel (x, y) in the image
    2. Skip if pixel is already claimed (in a bead or exclusion zone)
    3. Try to place a minimum-sized bead (default: 15x15) at (x, y)
    4. Check if all 4 corners match the center color
    5. Check if entire bounding box is the same color
    6. Check if properly bordered
    7. If all checks pass, optimize the bead (see below)
    8. Add the optimized bead and mark pixels as claimed
    9. Reset consecutive failures counter
```

### 2. Bead Optimization

Once a valid bead is found, we optimize it by:

```
repeat until no improvements:
    1. Try growing by 2 pixels (maintaining odd size)
       - Keep growing while valid and properly bordered
    
    2. Try moving down by 1 pixel
       - Keep moving while valid and properly bordered
    
    3. Try moving right by 1 pixel
       - Keep moving while valid and properly bordered
```

This hill-climbing approach finds larger, better-positioned beads.

### 3. Performance Optimizations

**Sidecar Mask**: Instead of checking all beads for overlap, we use a mask array where:
- 0 = free pixel
- 1 = pixel in a bead
- 2 = pixel in an exclusion zone

This makes collision detection O(1) instead of O(n).

**Bailout Condition**: Stop after 10,000 consecutive failed placement attempts. This prevents infinite loops while still achieving good coverage (~70%).

### 4. Pixel Pitch Inference

After placing all beads:

```
1. Count beads of each size
2. Find the mode (most common size)
3. This is the inferred pixel pitch
```

The algorithm naturally finds 1x1 beads (basic pixels) plus occasional 2x2, 3x3 "superbeads" where large uniform regions exist.

### 5. Output Generation

```
for each bead:
    1. Calculate median color of all pixels in the bead
    2. Determine output position: center_x / pixel_pitch, center_y / pixel_pitch
    3. Calculate output size: bead_size / pixel_pitch (for superbeads)
    4. Write median color to output pixel(s)
```

## Parameters

- **minBeadSize**: Minimum bead dimension (default: 15 pixels)
- **colorThreshold**: Max RGB distance for "same color" (default: 20)
- **exclusionZoneSize**: Border width around beads (default: 2 pixels)
- **maxConsecutiveFailures**: Bailout threshold (default: 10,000)

## Debug Visualizations

The algorithm generates 4 debug images:

1. **debug-01-beads-placed.png**: Original image with red bead borders and green centers
2. **debug-02-exclusion-zones.png**: Color-coded mask (green=free, red=bead, yellow=exclusion)
3. **debug-03-bead-size-heatmap.png**: Beads colored by size (blue=small, red=large)
4. **debug-04-coverage-map.png**: Original with red overlay on unclaimed pixels

## Results for ring.png

Processing a 1024×1024 pixel ring image:
- **Beads placed**: ~1400-1500
- **Coverage**: ~70-72%
- **Inferred pixel pitch**: 15 pixels per bead ✓
- **Output size**: 69×69 pixels
- **Processing time**: ~180k-300k attempts (varies due to randomness)

### Bead Size Distribution (typical)
- 15px: ~43% (base size, most common)
- 17px: ~18%
- 19px: ~13%
- 21px: ~11%
- 23px: ~10%
- Larger: ~5% (superbeads in uniform regions)

## Usage

```bash
npm run process
# or
node dist/processPng.js ring.png ring-pixel.png
```

This will generate:
- `ring-pixel.png` - The pixelated output
- `debug-01-beads-placed.png` - Debug visualization
- `debug-02-exclusion-zones.png` - Mask visualization
- `debug-03-bead-size-heatmap.png` - Size distribution
- `debug-04-coverage-map.png` - Coverage visualization
