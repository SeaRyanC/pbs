/**
 * Test script for super-smart mode algorithm
 * 
 * This script tests the stochastic grid alignment algorithm on the fox image.
 * Key feature to validate: The eyes should form two inverted V shapes.
 */

import sharp from 'sharp';

// Get pixel from buffer at coordinates
function getPixel(data, width, x, y) {
  const idx = (y * width + x) * 4;
  return {
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
    a: data[idx + 3]
  };
}

/**
 * Calculate the super-smart score for a given configuration.
 * Lower score is better.
 */
function calculateSuperSmartScore(data, width, height, pitch, offsetX, offsetY, sampleRatio = 0.3) {
  const gridWidth = Math.floor((width - offsetX) / pitch);
  const gridHeight = Math.floor((height - offsetY) / pitch);
  
  if (gridWidth < 4 || gridHeight < 4) return Infinity;
  
  const totalCells = gridWidth * gridHeight;
  const sampleCount = Math.max(50, Math.floor(totalCells * sampleRatio));
  const step = Math.max(1, Math.floor(totalCells / sampleCount));
  
  let totalIntraVariance = 0;
  let cellCount = 0;
  const cellMeans = [];
  
  for (let i = 0; i < totalCells; i += step) {
    const cellX = i % gridWidth;
    const cellY = Math.floor(i / gridWidth);
    
    const startX = Math.floor(offsetX + cellX * pitch);
    const startY = Math.floor(offsetY + cellY * pitch);
    const endX = Math.min(startX + Math.floor(pitch), width);
    const endY = Math.min(startY + Math.floor(pitch), height);
    
    if (startX < 0 || startY < 0 || endX > width || endY > height) {
      continue;
    }
    
    let sumR = 0, sumG = 0, sumB = 0;
    let sumR2 = 0, sumG2 = 0, sumB2 = 0;
    let pixelCount = 0;
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx] || 0;
        const g = data[idx + 1] || 0;
        const b = data[idx + 2] || 0;
        
        sumR += r;
        sumG += g;
        sumB += b;
        sumR2 += r * r;
        sumG2 += g * g;
        sumB2 += b * b;
        pixelCount++;
      }
    }
    
    if (pixelCount > 1) {
      const meanR = sumR / pixelCount;
      const meanG = sumG / pixelCount;
      const meanB = sumB / pixelCount;
      
      const varR = sumR2 / pixelCount - meanR * meanR;
      const varG = sumG2 / pixelCount - meanG * meanG;
      const varB = sumB2 / pixelCount - meanB * meanB;
      
      totalIntraVariance += varR + varG + varB;
      cellMeans.push({ r: meanR, g: meanG, b: meanB });
      cellCount++;
    }
  }
  
  if (cellCount < 2) return Infinity;
  
  const avgIntraVariance = totalIntraVariance / cellCount;
  
  const globalMean = {
    r: cellMeans.reduce((s, c) => s + c.r, 0) / cellMeans.length,
    g: cellMeans.reduce((s, c) => s + c.g, 0) / cellMeans.length,
    b: cellMeans.reduce((s, c) => s + c.b, 0) / cellMeans.length
  };
  
  let interCellVariance = 0;
  for (const mean of cellMeans) {
    interCellVariance += (mean.r - globalMean.r) ** 2;
    interCellVariance += (mean.g - globalMean.g) ** 2;
    interCellVariance += (mean.b - globalMean.b) ** 2;
  }
  interCellVariance /= cellMeans.length;
  
  const normalizedScore = (avgIntraVariance / (Math.sqrt(interCellVariance) + 1)) * pitch;
  return normalizedScore;
}

function findBestOffsetForPitch(data, width, height, pitch, offsetSteps = 16) {
  let bestScore = Infinity;
  let bestOffset = { offsetX: 0, offsetY: 0 };
  
  for (let ox = 0; ox < offsetSteps; ox++) {
    for (let oy = 0; oy < offsetSteps; oy++) {
      const offsetX = (ox / offsetSteps) * pitch;
      const offsetY = (oy / offsetSteps) * pitch;
      
      const score = calculateSuperSmartScore(data, width, height, pitch, offsetX, offsetY, 0.5);
      
      if (score < bestScore) {
        bestScore = score;
        bestOffset = { offsetX, offsetY };
      }
    }
  }
  
  return { ...bestOffset, score: bestScore };
}

function superSmartInfer(data, width, height) {
  console.log(`Image size: ${width}x${height}`);
  
  const gridSizes = [8, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64];
  
  let bestResult = {
    gridSize: 16,
    pitch: width / 16,
    offsetX: 0,
    offsetY: 0,
    score: Infinity
  };
  
  console.log('\nPhase 1: Testing candidate grid sizes...');
  
  for (const gridSize of gridSizes) {
    const pitch = width / gridSize;
    if (pitch < 4) continue;
    
    const result = findBestOffsetForPitch(data, width, height, pitch, 16);
    
    if (result.score < bestResult.score) {
      bestResult = {
        gridSize,
        pitch,
        offsetX: result.offsetX,
        offsetY: result.offsetY,
        score: result.score
      };
    }
    
    console.log(`  ${gridSize}x${gridSize}: score=${result.score.toFixed(2)}, offset=(${result.offsetX.toFixed(1)}, ${result.offsetY.toFixed(1)})`);
  }
  
  console.log(`\nBest so far: ${bestResult.gridSize}x${bestResult.gridSize}, score=${bestResult.score.toFixed(2)}`);
  
  // Fine-tune with more offset precision
  console.log('\nPhase 2: Fine-tuning offset...');
  const fineResult = findBestOffsetForPitch(data, width, height, bestResult.pitch, 64);
  if (fineResult.score < bestResult.score) {
    bestResult.offsetX = fineResult.offsetX;
    bestResult.offsetY = fineResult.offsetY;
    bestResult.score = fineResult.score;
  }
  
  console.log(`Final: ${bestResult.gridSize}x${bestResult.gridSize}, offset=(${bestResult.offsetX.toFixed(1)}, ${bestResult.offsetY.toFixed(1)}), score=${bestResult.score.toFixed(2)}`);
  
  return bestResult;
}

// Generate the pixelated image based on inferred grid
function generatePixelatedImage(data, width, height, result) {
  const { pitch, offsetX, offsetY, gridSize } = result;
  
  const output = [];
  
  for (let gy = 0; gy < gridSize; gy++) {
    const row = [];
    for (let gx = 0; gx < gridSize; gx++) {
      const startX = Math.floor(offsetX + gx * pitch);
      const startY = Math.floor(offsetY + gy * pitch);
      const endX = Math.min(startX + Math.floor(pitch), width);
      const endY = Math.min(startY + Math.floor(pitch), height);
      
      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const pixel = getPixel(data, width, x, y);
          sumR += pixel.r;
          sumG += pixel.g;
          sumB += pixel.b;
          count++;
        }
      }
      
      row.push({
        r: count > 0 ? Math.round(sumR / count) : 0,
        g: count > 0 ? Math.round(sumG / count) : 0,
        b: count > 0 ? Math.round(sumB / count) : 0,
        a: 255
      });
    }
    output.push(row);
  }
  
  return output;
}

// Print a visualization of the pixel data
function visualizePixelData(pixelData) {
  console.log('\nPixel visualization (X = very dark, x = dark, . = mid, space = light):');
  
  for (let r = 0; r < pixelData.length; r++) {
    let rowStr = String(r).padStart(2, ' ') + ' ';
    const row = pixelData[r];
    
    for (let c = 0; c < row.length; c++) {
      const pixel = row[c];
      const brightness = (pixel.r + pixel.g + pixel.b) / 3;
      
      if (brightness < 60) {
        rowStr += 'X';
      } else if (brightness < 120) {
        rowStr += 'x';
      } else if (brightness < 180) {
        rowStr += '.';
      } else {
        rowStr += ' ';
      }
    }
    console.log(rowStr);
  }
}

// Main execution
async function main() {
  console.log('=== Super-Smart Mode Test ===\n');
  
  const imagePath = '/tmp/pbs-test/fox.png';
  
  // Load image
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  console.log(`Loading image: ${imagePath}`);
  console.log(`Format: ${metadata.format}, Size: ${metadata.width}x${metadata.height}`);
  
  // Get raw pixel data
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  console.log(`Channels: ${info.channels}`);
  
  // Convert to RGBA buffer if needed
  let rgbaData;
  if (info.channels === 3) {
    rgbaData = Buffer.alloc(info.width * info.height * 4);
    for (let i = 0; i < info.width * info.height; i++) {
      rgbaData[i * 4] = data[i * 3];
      rgbaData[i * 4 + 1] = data[i * 3 + 1];
      rgbaData[i * 4 + 2] = data[i * 3 + 2];
      rgbaData[i * 4 + 3] = 255;
    }
  } else {
    rgbaData = data;
  }
  
  // Run super-smart inference
  console.log('\n--- Running Super-Smart Inference ---');
  const result = superSmartInfer(rgbaData, info.width, info.height);
  
  // Generate pixelated image
  console.log('\n--- Generating Pixelated Image ---');
  const pixelData = generatePixelatedImage(rgbaData, info.width, info.height, result);
  
  // Visualize the output
  visualizePixelData(pixelData);
  
  // Save the pixelated output
  const outputWidth = result.gridSize;
  const outputHeight = result.gridSize;
  const outputData = Buffer.alloc(outputWidth * outputHeight * 4);
  
  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const pixel = pixelData[y][x];
      const idx = (y * outputWidth + x) * 4;
      outputData[idx] = pixel.r;
      outputData[idx + 1] = pixel.g;
      outputData[idx + 2] = pixel.b;
      outputData[idx + 3] = pixel.a;
    }
  }
  
  await sharp(outputData, {
    raw: { width: outputWidth, height: outputHeight, channels: 4 }
  }).png().toFile('/tmp/pbs-test/fox-super-smart.png');
  
  console.log(`\nOutput saved to: /tmp/pbs-test/fox-super-smart.png`);
  console.log(`Output dimensions: ${outputWidth}x${outputHeight}`);
  
  return result;
}

main().catch(console.error);
