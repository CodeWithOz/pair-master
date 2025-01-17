
const { createCanvas } = require('canvas');
const fs = require('fs');

// Create a 512x512 canvas
const canvas = createCanvas(512, 512);
const ctx = canvas.getContext('2d');

// Set background
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, 512, 512);

// Grid settings
const padding = 64;
const cellSize = (512 - (padding * 2)) / 2;
const gap = 32;

// Draw cells
ctx.strokeStyle = '#000000';
ctx.lineWidth = 3;

for (let row = 0; row < 2; row++) {
  for (let col = 0; col < 2; col++) {
    const x = padding + (col * (cellSize + gap));
    const y = padding + (row * (cellSize + gap));
    
    ctx.beginPath();
    ctx.roundRect(x, y, cellSize, cellSize, 16);
    ctx.stroke();
  }
}

// Draw connecting line
ctx.strokeStyle = '#4CAF50';
ctx.lineWidth = 6;
ctx.beginPath();
ctx.moveTo(padding + cellSize/2, padding + cellSize/2);
ctx.lineTo(padding + cellSize*1.5 + gap, padding + cellSize*1.5 + gap);
ctx.stroke();

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('generated-icon.png', buffer);
