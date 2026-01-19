# PBS - Pixel-Based Crafting Image Pixelator

A static single-page web app for converting large, non-pixelated images into pixelated images suitable for pixel-based crafting projects.

## Features

- **Image Input**: Paste from clipboard, upload files, or drag-and-drop images
- **Adjustable Grid**: Drag individual corners to define the capture area (independent corner control for perspective images)
- **Grid Rotation**: Rotate the entire capture grid
- **Perspective Skew**: Adjust perspective with isometric projection default
- **Multiple Color Methods**:
  - Mean Average: Average of all pixel colors
  - Median: Median color value
  - Mode: Most frequently occurring color
  - Kernel Median: Gaussian-weighted kernel median
  - Center Weighted: Center pixel weighted more heavily
- **Configurable Output**: Set custom dimensions (default 64x64)
- **Live Preview**: Real-time pixelated preview without smoothing artifacts
- **Export Options**: Copy to clipboard or download as PNG
- **Persistence**: All settings saved to localStorage

## Tech Stack

- TypeScript 5.9
- Preact
- esbuild

## Development

```bash
# Install dependencies
npm install

# Type check
npm run typecheck

# Build for production
npm run build

# Watch mode for development
npm run watch
```

## Deployment

The app builds to the `docs/` folder for easy GitHub Pages deployment using the simple docs/ output folder method.

## Usage

1. Load an image (paste, upload, or drag-and-drop)
2. Adjust the grid corners to select the area you want to pixelate
3. Optionally adjust rotation and perspective
4. Configure output dimensions and color selection method
5. Preview the result in real-time
6. Copy or download the pixelated image