#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple HTML/JS minifier for inscription templates
function minifyInscription(html) {
    let minified = html;
    
    // Remove HTML comments
    minified = minified.replace(/<!--[\s\S]*?-->/g, '');
    
    // Remove unnecessary whitespace in HTML
    minified = minified.replace(/>\s+</g, '><');
    minified = minified.replace(/\s+/g, ' ');
    
    // Minify JavaScript (basic)
    // Remove single-line comments (careful with URLs)
    minified = minified.replace(/\/\/(?![^\n]*:\/\/).*$/gm, '');
    
    // Remove multi-line comments
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove console.log statements (optional for production)
    // minified = minified.replace(/console\.(log|error|warn)\([^)]*\);?/g, '');
    
    // Trim lines
    minified = minified.split('\n').map(line => line.trim()).join('\n');
    
    // Remove empty lines
    minified = minified.replace(/\n\s*\n/g, '\n');
    
    // Minify CSS
    minified = minified.replace(/\s*{\s*/g, '{');
    minified = minified.replace(/\s*}\s*/g, '}');
    minified = minified.replace(/\s*:\s*/g, ':');
    minified = minified.replace(/\s*;\s*/g, ';');
    
    return minified;
}

// Read the inscription template
const inputFile = path.join(__dirname, '../client/src/templates/inscription/membershipCard-recursive.html');
const outputFile = path.join(__dirname, '../client/src/templates/inscription/membershipCard.min.html');

try {
    const html = fs.readFileSync(inputFile, 'utf8');
    const minified = minifyInscription(html);
    
    // Write minified version
    fs.writeFileSync(outputFile, minified);
    
    // Calculate size reduction
    const originalSize = Buffer.byteLength(html, 'utf8');
    const minifiedSize = Buffer.byteLength(minified, 'utf8');
    const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);
    
    console.log('Inscription Minification Complete:');
    console.log(`Original size: ${originalSize} bytes`);
    console.log(`Minified size: ${minifiedSize} bytes`);
    console.log(`Size reduction: ${reduction}%`);
    console.log(`Output: ${outputFile}`);
    
    // Check if under 15KB limit
    if (minifiedSize > 15000) {
        console.warn('\n⚠️  WARNING: Minified size exceeds 15KB limit!');
        console.warn(`Current size: ${(minifiedSize / 1024).toFixed(2)}KB`);
        console.warn('Consider further optimization.');
    } else {
        console.log(`\n✅ Size is within 15KB limit (${(minifiedSize / 1024).toFixed(2)}KB)`);
    }
    
} catch (error) {
    console.error('Error minifying inscription:', error.message);
    process.exit(1);
}