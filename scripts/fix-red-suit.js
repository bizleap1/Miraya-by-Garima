import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function fixRedSuit() {
  const filePath = path.resolve('public/products/Suit- Red/1.JPG');
  console.log("Fixing rotation for:", filePath);

  const inputBuffer = await fs.promises.readFile(filePath);
  
  // Rotate 270 degrees (which is -90 degrees counter-clockwise) to bring head from 3 o'clock to 12 o'clock
  const outputBuffer = await sharp(inputBuffer)
    .rotate(270)
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();

  await fs.promises.writeFile(filePath, outputBuffer);

  const meta = await sharp(outputBuffer).metadata();
  console.log("SUCCESS! New dimensions:", meta.width, "x", meta.height);
}

fixRedSuit();
