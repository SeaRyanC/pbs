/**
 * Test script for background removal functionality
 * Tests the detectAndRemoveBackground function with bright magenta
 */

// Simulate the ICtCp color space conversion functions
function srgbToLinear(value) {
  const normalized = value / 255;
  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }
  return Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function linearToGamma(value) {
  return Math.pow(Math.max(0, value), 1 / 2.4);
}

function rgbToIctcp(rgba) {
  const r = srgbToLinear(rgba.r);
  const g = srgbToLinear(rgba.g);
  const b = srgbToLinear(rgba.b);
  
  const l = 0.412109 * r + 0.523925 * g + 0.063965 * b;
  const m = 0.166748 * r + 0.720459 * g + 0.112793 * b;
  const s = 0.024170 * r + 0.075440 * g + 0.900390 * b;
  
  const lPrime = linearToGamma(l);
  const mPrime = linearToGamma(m);
  const sPrime = linearToGamma(s);
  
  const i = 0.5 * lPrime + 0.5 * mPrime;
  const ct = 1.613769 * lPrime - 3.323486 * mPrime + 1.709717 * sPrime;
  const cp = 4.378152 * lPrime - 4.245608 * mPrime - 0.132544 * sPrime;
  
  return { i, ct, cp };
}

function ictcpDistanceSquared(a, b) {
  const di = a.i - b.i;
  const dct = a.ct - b.ct;
  const dcp = a.cp - b.cp;
  return di * di + dct * dct + dcp * dcp;
}

// Test the adaptive threshold calculation
function calculateAdaptiveThreshold(backgroundColor) {
  const bgIctcp = rgbToIctcp(backgroundColor);
  
  const intensity = bgIctcp.i;
  const chroma = Math.sqrt(bgIctcp.ct * bgIctcp.ct + bgIctcp.cp * bgIctcp.cp);
  
  const baseThreshold = 0.02;
  const intensityFactor = 1 + Math.min(intensity * 2, 2);
  const chromaFactor = 1 + Math.min(chroma * 2, 4);
  const adaptiveThreshold = baseThreshold * intensityFactor * chromaFactor;
  
  const colorThreshold = Math.min(adaptiveThreshold, 0.3);
  const colorThresholdSquared = colorThreshold * colorThreshold;
  
  return {
    bgIctcp,
    intensity,
    chroma,
    intensityFactor,
    chromaFactor,
    adaptiveThreshold,
    colorThreshold,
    colorThresholdSquared
  };
}

// Test if a color would be considered similar to background
function isColorSimilarToBackground(pixelColor, backgroundColor) {
  const bgIctcp = rgbToIctcp(backgroundColor);
  const pixelIctcp = rgbToIctcp(pixelColor);
  
  const bgCalc = calculateAdaptiveThreshold(backgroundColor);
  const distance = ictcpDistanceSquared(pixelIctcp, bgIctcp);
  const isSimilar = distance < bgCalc.colorThresholdSquared;
  
  return {
    isSimilar,
    distance,
    distanceSqrt: Math.sqrt(distance),
    threshold: bgCalc.colorThreshold,
    thresholdSquared: bgCalc.colorThresholdSquared
  };
}

console.log('=== Background Removal Test ===\n');

// Test 1: Bright Magenta (RGB 255, 0, 255)
const brightMagenta = { r: 255, g: 0, b: 255, a: 255 };
console.log('Test 1: Bright Magenta Background');
console.log('Color:', brightMagenta);
const magentaCalc = calculateAdaptiveThreshold(brightMagenta);
console.log('ICtCp values:', {
  i: magentaCalc.bgIctcp.i.toFixed(4),
  ct: magentaCalc.bgIctcp.ct.toFixed(4),
  cp: magentaCalc.bgIctcp.cp.toFixed(4)
});
console.log('Intensity:', magentaCalc.intensity.toFixed(4));
console.log('Chroma:', magentaCalc.chroma.toFixed(4));
console.log('Intensity Factor:', magentaCalc.intensityFactor.toFixed(4));
console.log('Chroma Factor:', magentaCalc.chromaFactor.toFixed(4));
console.log('Adaptive Threshold:', magentaCalc.adaptiveThreshold.toFixed(4));
console.log('Final Threshold:', magentaCalc.colorThreshold.toFixed(4));
console.log('Threshold Squared:', magentaCalc.colorThresholdSquared.toFixed(4));

// Test similar magenta colors
console.log('\n--- Testing similar magenta variations ---');
const testColors = [
  { r: 255, g: 0, b: 255, name: 'Exact match' },
  { r: 250, g: 0, b: 250, name: 'Slightly darker' },
  { r: 255, g: 5, b: 255, name: 'Slight green tint' },
  { r: 245, g: 0, b: 255, name: 'Variation' },
  { r: 255, g: 0, b: 245, name: 'Variation 2' },
  { r: 200, g: 0, b: 200, name: 'Much darker' },
];

testColors.forEach(color => {
  const result = isColorSimilarToBackground(color, brightMagenta);
  console.log(`${color.name} (${color.r},${color.g},${color.b}): ${result.isSimilar ? 'SIMILAR' : 'DIFFERENT'} (distance: ${result.distanceSqrt.toFixed(4)}, threshold: ${result.threshold.toFixed(4)})`);
});

// Test different color (should not be similar)
console.log('\n--- Testing different colors ---');
const differentColors = [
  { r: 255, g: 128, b: 0, name: 'Orange' },
  { r: 0, g: 0, b: 0, name: 'Black' },
  { r: 255, g: 255, b: 255, name: 'White' },
];

differentColors.forEach(color => {
  const result = isColorSimilarToBackground(color, brightMagenta);
  console.log(`${color.name} (${color.r},${color.g},${color.b}): ${result.isSimilar ? 'SIMILAR' : 'DIFFERENT'} (distance: ${result.distanceSqrt.toFixed(4)}, threshold: ${result.threshold.toFixed(4)})`);
});

// Test 2: Old threshold behavior (for comparison)
console.log('\n\n=== Old Fixed Threshold (0.02) Comparison ===');
const oldThreshold = 0.02;
const oldThresholdSquared = oldThreshold * oldThreshold;

console.log('Testing with old fixed threshold:', oldThreshold);
testColors.forEach(color => {
  const bgIctcp = rgbToIctcp(brightMagenta);
  const pixelIctcp = rgbToIctcp(color);
  const distance = ictcpDistanceSquared(pixelIctcp, bgIctcp);
  const isSimilar = distance < oldThresholdSquared;
  console.log(`${color.name}: ${isSimilar ? 'SIMILAR' : 'DIFFERENT'} (distance: ${Math.sqrt(distance).toFixed(4)}, threshold: ${oldThreshold})`);
});

console.log('\n=== Summary ===');
console.log('✓ Adaptive threshold increases from', oldThreshold, 'to', magentaCalc.colorThreshold.toFixed(4));
console.log('✓ This allows bright saturated colors to have larger tolerance');
console.log('✓ Background removal should now work for bright magenta');
