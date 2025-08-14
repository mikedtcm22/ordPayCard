#!/usr/bin/env node
/**
 * prepare-parent.js — inject a custom image as a data URI into the parent HTML template
 * Usage:
 *   node inscription-testing/prepare-parent.js --image ./path/to/img.png \
 *     --template client/src/templates/inscription/registrationWrapper.html \
 *     --out inscription-testing/parent-custom.html
 */
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { template: 'client/src/templates/inscription/registrationWrapper.html', out: 'inscription-testing/parent-custom.html' };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--image') opts.image = args[++i];
    else if (a === '--template') opts.template = args[++i];
    else if (a === '--out') opts.out = args[++i];
  }
  if (!opts.image) {
    console.error('Usage: node inscription-testing/prepare-parent.js --image <file> [--template <file>] [--out <file>]');
    process.exit(2);
  }
  return opts;
}

function guessMime(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

function buildDataUri(imgPath) {
  const mime = guessMime(imgPath);
  const buf = fs.readFileSync(imgPath);
  const b64 = buf.toString('base64');
  return `data:${mime};base64,${b64}`;
}

function injectDataUri(templateHtml, dataUri) {
  // Robustly replace the entire assignment for var EMBED_DATA_URI = ...;
  // We scan forward from the declaration and find the first semicolon that
  // is NOT inside quotes or parentheses, then replace the whole assignment.
  const decl = 'var EMBED_DATA_URI';
  const idx = templateHtml.indexOf(decl);
  if (idx === -1) throw new Error('Could not find EMBED_DATA_URI declaration in template');

  // Find the '=' after the declaration
  const eqIdx = templateHtml.indexOf('=', idx);
  if (eqIdx === -1) throw new Error('Could not find EMBED_DATA_URI assignment operator');

  // Scan until the terminating semicolon not within quotes/template/paren
  let i = eqIdx + 1;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escapeNext = false;
  let parenDepth = 0;
  let endIdx = -1;

  while (i < templateHtml.length) {
    const ch = templateHtml[i];
    if (escapeNext) { escapeNext = false; i++; continue; }
    if (ch === '\\') { escapeNext = true; i++; continue; }

    if (!inDouble && !inTemplate && ch === "'") { inSingle = !inSingle; i++; continue; }
    if (!inSingle && !inTemplate && ch === '"') { inDouble = !inDouble; i++; continue; }
    if (!inSingle && !inDouble && ch === '`') { inTemplate = !inTemplate; i++; continue; }

    if (!inSingle && !inDouble && !inTemplate) {
      if (ch === '(') { parenDepth++; i++; continue; }
      if (ch === ')') { if (parenDepth > 0) parenDepth--; i++; continue; }
      if (ch === ';' && parenDepth === 0) { endIdx = i; break; }
    }

    i++;
  }

  if (endIdx === -1) throw new Error('Could not find end of EMBED_DATA_URI assignment');

  const before = templateHtml.slice(0, idx);
  const after = templateHtml.slice(endIdx + 1);
  const assignment = `${decl} = ${JSON.stringify(dataUri)};`;
  return before + assignment + after;
}

(function main() {
  const { image, template, out } = parseArgs();
  const tpl = fs.readFileSync(template, 'utf8');
  const uri = buildDataUri(image);
  const outHtml = injectDataUri(tpl, uri);
  const outDir = path.dirname(out);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(out, outHtml);
  console.log(`[prepare-parent] Wrote ${out}`);
})();

