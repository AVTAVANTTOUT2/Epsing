#!/usr/bin/env tsx
/**
 * Generates PWA icons programmatically using Canvas.
 * Run once: npx tsx scripts/generate-icons.ts
 */
import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const SIZES = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
];

const PURPLE = '#6B3FA0';
const WHITE = '#FFFFFF';
const TEXT = 'E';

function generateIcon(size: number, maskable: boolean): Buffer {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const padding = maskable ? size * 0.15 : 0;
  const innerSize = size - padding * 2;

  // Background
  ctx.fillStyle = PURPLE;
  if (maskable) {
    ctx.fillRect(0, 0, size, size);
    // Rounded rect for non-maskable area
    ctx.fillStyle = PURPLE;
  } else {
    const r = size * 0.22;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.quadraticCurveTo(size, 0, size, r);
    ctx.lineTo(size, size - r);
    ctx.quadraticCurveTo(size, size, size - r, size);
    ctx.lineTo(r, size);
    ctx.quadraticCurveTo(0, size, 0, size - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();
  }

  // Text
  ctx.fillStyle = WHITE;
  ctx.font = `900 ${Math.floor(innerSize * 0.55)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(TEXT, size / 2, size / 2 + (maskable ? 0 : size * 0.02));

  return canvas.toBuffer('image/png');
}

const outDir = path.resolve(process.cwd(), 'public/icons');
fs.mkdirSync(outDir, { recursive: true });

for (const { name, size, maskable } of SIZES) {
  const buf = generateIcon(size, maskable);
  fs.writeFileSync(path.join(outDir, name), buf);
  console.log(`✓ ${name} (${size}x${size})`);
}

// Favicon
const favicon = generateIcon(32, false);
fs.writeFileSync(path.resolve(process.cwd(), 'public/favicon.ico'), favicon);
console.log('✓ favicon.ico');
