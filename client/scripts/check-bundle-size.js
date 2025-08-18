#!/usr/bin/env node

/**
 * Check bundle size and enforce size budget for embers-core
 * Reports gzipped size and exits with error if over limit
 * Uses size budget manifest for configuration
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load size budget manifest
const manifestPath = path.resolve(__dirname, '../embers-core.size-budget.json');
if (!fs.existsSync(manifestPath)) {
  console.error(`Size budget manifest not found at ${manifestPath}`);
  process.exit(1);
}

const sizeBudget = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

// Parse size string to bytes
function parseSize(sizeStr) {
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i);
  if (!match) throw new Error(`Invalid size format: ${sizeStr}`);
  
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  
  const multipliers = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024
  };
  
  return Math.floor(value * (multipliers[unit] || 1));
}

// Get size limits from manifest
const SIZE_LIMIT_BYTES = parseSize(sizeBudget.maxSize);
const WARN_LIMIT_BYTES = sizeBudget.warnSize ? parseSize(sizeBudget.warnSize) : null;
const SIZE_LIMIT_KB = (SIZE_LIMIT_BYTES / 1024).toFixed(2);
const WARN_LIMIT_KB = WARN_LIMIT_BYTES ? (WARN_LIMIT_BYTES / 1024).toFixed(2) : null;

// Path to the built bundle
const bundlePath = path.resolve(__dirname, '..', sizeBudget.path);

// Check if bundle exists
if (!fs.existsSync(bundlePath)) {
  console.error(`Bundle not found at ${bundlePath}`);
  console.error('Please run "npm run build:embers-core" first');
  process.exit(1);
}

// Read the bundle
const bundleContent = fs.readFileSync(bundlePath, 'utf-8');
const rawSize = Buffer.byteLength(bundleContent);

// Apply compression if specified
let compressedSize = rawSize;
if (sizeBudget.compression === 'gzip') {
  const gzippedContent = zlib.gzipSync(bundleContent);
  compressedSize = gzippedContent.length;
} else if (sizeBudget.compression === 'brotli') {
  const brotliContent = zlib.brotliCompressSync(bundleContent);
  compressedSize = brotliContent.length;
}

// Convert to KB for display
const compressedSizeKB = (compressedSize / 1024).toFixed(2);
const rawSizeKB = (rawSize / 1024).toFixed(2);

// Report sizes
console.log(`\n📦 ${sizeBudget.name} Bundle Size Report`);
console.log('─'.repeat(40));
console.log(`Bundle size (raw): ${rawSizeKB} KB`);
if (sizeBudget.compression) {
  console.log(`Bundle size (${sizeBudget.compression}): ${compressedSizeKB} KB`);
}
console.log(`Size limit: ${SIZE_LIMIT_KB} KB`);
if (WARN_LIMIT_KB) {
  console.log(`Warning threshold: ${WARN_LIMIT_KB} KB`);
}
console.log('─'.repeat(40));

// Check if size exceeds limits
if (compressedSize > SIZE_LIMIT_BYTES) {
  console.error(`\n❌ Bundle size exceeds limit!`);
  console.error(`   Current: ${compressedSizeKB} KB`);
  console.error(`   Limit: ${SIZE_LIMIT_KB} KB`);
  console.error(`   Exceeded by: ${((compressedSize - SIZE_LIMIT_BYTES) / 1024).toFixed(2)} KB`);
  process.exit(1);
} else if (WARN_LIMIT_BYTES && compressedSize > WARN_LIMIT_BYTES) {
  console.warn(`\n⚠️  Bundle size exceeds warning threshold`);
  console.warn(`   Current: ${compressedSizeKB} KB`);
  console.warn(`   Warning: ${WARN_LIMIT_KB} KB`);
  console.warn(`   ${((SIZE_LIMIT_BYTES - compressedSize) / 1024).toFixed(2)} KB remaining until limit`);
  process.exit(0);
} else {
  console.log(`\n✅ Bundle size is within limit`);
  console.log(`   ${((SIZE_LIMIT_BYTES - compressedSize) / 1024).toFixed(2)} KB under limit`);
  if (WARN_LIMIT_BYTES) {
    console.log(`   ${((WARN_LIMIT_BYTES - compressedSize) / 1024).toFixed(2)} KB under warning threshold`);
  }
  process.exit(0);
}