#!/usr/bin/env node

/**
 * CLI tool to process PNG images using the bead pixelation algorithm
 */

import { readFileSync, writeFileSync } from 'fs';
import { PNG } from 'pngjs';
import { BeadPixelator, type ImageData } from './beadPixelation.js';

function decodePNG(buffer: Buffer): ImageData {
  const png = PNG.sync.read(buffer);
  return {
    width: png.width,
    height: png.height,
    data: new Uint8ClampedArray(png.data)
  };
}

function encodePNG(imageData: ImageData): Buffer {
  const png = new PNG({
    width: imageData.width,
    height: imageData.height
  });
  png.data = Buffer.from(imageData.data);
  return PNG.sync.write(png);
}

async function main() {
  const inputFile = process.argv[2] || 'ring.png';
  const outputFile = process.argv[3] || 'ring-pixel.png';
  
  console.log(`Processing ${inputFile}...`);
  
  try {
    const buffer = readFileSync(inputFile);
    const imageData = decodePNG(buffer);
    
    console.log(`Image size: ${imageData.width}x${imageData.height}`);
    
    const pixelator = new BeadPixelator(imageData);
    pixelator.process();
    
    const output = pixelator.generateOutput();
    
    // Save debug images
    for (const [name, debugImg] of pixelator.getDebugImages().entries()) {
      const debugFile = `debug-${name}.png`;
      console.log(`Saving debug image: ${debugFile}`);
      writeFileSync(debugFile, encodePNG(debugImg));
    }
    
    // Save output
    console.log(`Saving output: ${outputFile}`);
    writeFileSync(outputFile, encodePNG(output));
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
